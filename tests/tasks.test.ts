import { env } from 'cloudflare:workers';
import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import migration from '../migrations/0001_tasks.sql?raw';
import approvalsMigration from '../migrations/0003_approvals.sql?raw';
import ingress from '../src/entrypoints/ingress';
import { accept, processNext, deliverNext, tasks, ownerFor, hasPending } from '../src/modules/execution/store';
import { parseCommand } from '../src/modules/work/commands';
import type { TelegramUpdate } from '../src/adapters/telegram';
const db = env.DB;
function update(id: number, text: string, user=123): TelegramUpdate {
  return { update_id:id, message:{from:{id:user,is_bot:false},chat:{id:user,type:'private'},text} };
}
async function receive(value: unknown, secret='test-webhook-secret') {
  const ctx=createExecutionContext();
  const response=await ingress.fetch(new Request('https://bot.test/webhooks/telegram',{method:'POST',headers:{'X-Telegram-Bot-Api-Secret-Token':secret},body:JSON.stringify(value)}),env,ctx);
  await waitOnExecutionContext(ctx); return response;
}
async function link() { await accept(db,update(1,'/start secret'),true); await processNext(db); }
async function replies() {
  const messages:string[]=[];
  while(await deliverNext(db,async (_chat,text)=>{messages.push(text);return {kind:'sent',messageId:messages.length};})) {}
  return messages;
}
beforeEach(async()=>{
  for(const table of ['approval_requests','deliveries','tasks','jobs','owner']) await db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
  await db.batch([...migration.split(';'), ...approvalsMigration.split(';')].map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
});
describe('task conversation on real D1 bindings',()=>{
  it('proposes a natural task and only creates it after confirmation',async()=>{
    await link(); await receive(update(2,'À chắc anh phải thêm task apply 5 job trong tuần này')); await processNext(db);
    expect(await tasks(db)).toEqual([]);
    expect((await replies()).at(-1)).toContain('trả lời “đúng”');
    await receive(update(3,'đúng')); await processNext(db);
    expect(await tasks(db)).toMatchObject([{id:'T2',title:'apply 5 job trong tuần này',status:'open'}]);
  });
  it('rejects a natural task proposal without creating a task',async()=>{
    await link(); await receive(update(2,'thêm task chạy bộ 3 buổi')); await processNext(db); await replies();
    await receive(update(3,'hủy')); await processNext(db);
    expect(await tasks(db)).toEqual([]);
  });
  it('accepts polite confirmation and gratitude without calling AI',async()=>{
    await link(); await receive(update(2,'thêm task đọc tài liệu')); await processNext(db); await replies();
    await receive(update(3,'đúng em')); await processNext(db);
    expect(await tasks(db)).toMatchObject([{title:'đọc tài liệu'}]);
    await receive(update(4,'Cảm ơn em')); await processNext(db);
    expect((await replies()).at(-1)).toContain('em ở đây');
  });
  it('creates, lists and completes a task; state survives new request contexts',async()=>{
    await link();
    await receive(update(2,'Thêm việc viết README'));
    expect(await processNext(db)).toBe(true);
    expect(await tasks(db)).toMatchObject([{id:'T2',title:'viết README',status:'open',revision:1}]);
    await receive(update(3,'Anh còn việc gì?')); await processNext(db);
    await receive(update(4,'Xong T2')); await processNext(db);
    expect(await tasks(db)).toEqual([]);
    expect(await tasks(db,true)).toMatchObject([{id:'T2',status:'done',revision:2}]);
    expect((await replies()).join('\n')).toContain('theo xác nhận của anh');
  });
  it('deduplicates concurrent inbound updates and job wakeups',async()=>{
    await link();
    await Promise.all([receive(update(2,'/add Một việc')),receive(update(2,'/add Một việc'))]);
    await Promise.all([processNext(db),processNext(db)]);
    expect(await tasks(db)).toHaveLength(1);
    const output=await replies();expect(output.filter(s=>s.startsWith('Đã thêm'))).toHaveLength(1);
  });
  it('keeps two intentional messages with the same title and asks for an ID',async()=>{
    await link();
    for(const id of [2,3]) {await receive(update(id,'/add README'));await processNext(db);}
    await receive(update(4,'Xong README'));await processNext(db);
    expect(await tasks(db)).toHaveLength(2);
    expect((await replies()).at(-1)).toContain('nhiều việc trùng tên');
  });
  it('processes persisted conversation order regardless of wakeup order',async()=>{
    await link();
    await receive(update(2,'/add README'));await receive(update(3,'/done T2'));
    await Promise.all([processNext(db),processNext(db)]);await processNext(db);
    expect(await tasks(db,true)).toMatchObject([{id:'T2',status:'done'}]);
  });
  it('does not invent a task when completion arrives before creation',async()=>{
    await link();await receive(update(2,'/done T3'));await processNext(db);
    await receive(update(3,'/add README'));await processNext(db);
    expect(await tasks(db)).toMatchObject([{id:'T3',status:'open'}]);
  });
  it('does not increase revision for repeated completion',async()=>{
    await link();for(const [id,text] of [[2,'/add README'],[3,'/done T2'],[4,'/done T2']] as const){await receive(update(id,text));await processNext(db);}
    expect((await tasks(db,true))[0]?.revision).toBe(2);
  });
  it('rejects unauthorized requests, other users and groups',async()=>{
    expect((await receive(update(1,'/start '+ 'a'.repeat(64)),'wrong')).status).toBe(401);
    expect(await ownerFor(db)).toBeNull();
    await receive(update(1,'/start '+ 'a'.repeat(64)));expect(await ownerFor(db)).toMatchObject({user_id:'123'});
    await receive(update(2,'/add intruder',999));
    const group=update(3,'/add group');group.message!.chat.type='group';await receive(group);
    await processNext(db);expect(await tasks(db)).toEqual([]);
    const ctx=createExecutionContext();
    // Existing ownership cannot be replaced even with a valid bootstrap code.
    await receive(update(4,'/start '+ 'a'.repeat(64),999));expect((await ownerFor(db))?.user_id).toBe('123');
    await waitOnExecutionContext(ctx);
  });
  it('never persists bootstrap credentials, including repeated pairing messages',async()=>{
    await receive(update(1,'/start '+ 'a'.repeat(64)));
    await receive(update(2,'/start '+ 'a'.repeat(64)));
    const jobs=await db.prepare('SELECT text FROM jobs ORDER BY id').all<{text:string}>();
    expect(jobs.results.map(j=>j.text)).toEqual(['/start','/start']);
  });
  it('rolls back task creation if the outbox write fails',async()=>{
    await link();await replies();await receive(update(2,'/add README'));
    await db.prepare("CREATE TRIGGER fail_delivery BEFORE INSERT ON deliveries BEGIN SELECT RAISE(ABORT, 'test_failure'); END").run();
    await expect(processNext(db)).rejects.toThrow('job_processing_failed');
    expect(await tasks(db)).toEqual([]);
    expect(await db.prepare('SELECT status,attempts FROM jobs WHERE update_id=2').first()).toMatchObject({status:'pending',attempts:1});
    await db.prepare('DROP TRIGGER fail_delivery').run();await processNext(db);
    expect(await tasks(db)).toHaveLength(1);
  });
  it('rejects an expired bootstrap code',async()=>{
    const clock=vi.spyOn(Date,'now').mockReturnValue(4202444800000);
    try { await receive(update(1,'/start '+ 'a'.repeat(64))); expect(await ownerFor(db)).toBeNull(); }
    finally { clock.mockRestore(); }
  });
  it('rejects oversized input before database writes',async()=>{
    expect((await receive({text:'x'.repeat(20000)})).status).toBe(400);
    expect(await ownerFor(db)).toBeNull();
  });
  it('keeps completed tasks when Telegram result is unknown and does not resend blindly',async()=>{
    await link();await replies();await receive(update(2,'/add README'));await processNext(db);
    let calls=0;await deliverNext(db,async()=>{calls++;return {kind:'unknown'};});
    await deliverNext(db,async()=>{calls++;return {kind:'sent',messageId:10};});
    expect(calls).toBe(1);expect(await tasks(db)).toHaveLength(1);expect(await hasPending(db)).toBe(false);
  });
  it('retries explicit rate limits without rerunning task creation',async()=>{
    await link();await replies();await receive(update(2,'/add README'));await processNext(db);
    const now=Date.now();await deliverNext(db,async()=>({kind:'retry',after:60}),now);
    expect(await deliverNext(db,async()=>({kind:'sent',messageId:5}),now+1000)).toBe(false);
    expect(await deliverNext(db,async()=>({kind:'sent',messageId:5}),now+60001)).toBe(true);
    expect(await tasks(db)).toHaveLength(1);
  });
  it('recovers from an expired processing lease',async()=>{
    await link();await receive(update(2,'/add README'));
    await db.prepare('UPDATE owner SET lease_token=?,lease_until=?').bind('dead-worker',Date.now()-1).run();
    expect(await processNext(db)).toBe(true);expect(await tasks(db)).toHaveLength(1);
  });
  it('does not accept arbitrary ambiguous conversation as a mutation',()=>{
    expect(parseCommand('xóa tất cả')).toEqual({kind:'unknown'});
    expect(parseCommand('Thêm việc '+ 'a'.repeat(181))).toEqual({kind:'unknown'});
  });
});
