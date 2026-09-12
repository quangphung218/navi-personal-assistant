import { env } from 'cloudflare:workers';
import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import migration from '../migrations/0001_tasks.sql?raw';
import aiBudgetMigration from '../migrations/0002_ai_budget.sql?raw';
import approvalsMigration from '../migrations/0003_approvals.sql?raw';
import weeklyMigration from '../migrations/0004_weekly_plans.sql?raw';
import contextMigration from '../migrations/0005_conversation_context.sql?raw';
import progressMigration from '../migrations/0006_weekly_progress.sql?raw';
import remindersMigration from '../migrations/0007_reminders_and_metrics.sql?raw';
import correctionsMigration from '../migrations/0008_progress_corrections.sql?raw';
import inlineActionsMigration from '../migrations/0009_inline_actions.sql?raw';
import dailyLoopMigration from '../migrations/0010_daily_execution_loop.sql?raw';
import genericCheckinsMigration from '../migrations/0013_generic_plan_checkins.sql?raw';
import checkinCorrectionsMigration from '../migrations/0014_checkin_corrections.sql?raw';
import checkinSelectionMigration from '../migrations/0015_checkin_selection.sql?raw';
import checkinOutcomesMigration from '../migrations/0016_checkin_outcomes.sql?raw';
import expireCheckinSelectionsMigration from '../migrations/0017_expire_checkin_selections.sql?raw';
import foundationsMigration from '../migrations/0018_goal_habit_foundations.sql?raw';
import backfillHabitDatesMigration from '../migrations/0019_backfill_habit_checkin_dates.sql?raw';
import measurementRequestsMigration from '../migrations/0020_checkin_measurement_requests.sql?raw';
import latencyMetricsMigration from '../migrations/0021_job_latency_metrics.sql?raw';
import aiTaskProposalsMigration from '../migrations/0022_ai_task_proposals.sql?raw';
import goalRenameMigration from '../migrations/0023_goal_rename_requests.sql?raw';
import focusFeedbackMigration from '../migrations/0024_focus_feedback.sql?raw';
import replyContextMigration from '../migrations/0025_reply_context.sql?raw';
import ingress from '../src/entrypoints/ingress';
import { accept, processNext, deliverNext, enqueueDailyBriefing, enqueueDueTaskReminders, enqueueWeeklyProgressReminder, enqueueWeeklyReview, tasks, ownerFor, hasPending } from '../src/modules/execution/store';
import { parseCommand } from '../src/modules/work/commands';
import { openRouterFocusAssistant, openRouterStructuredAssistant } from '../src/adapters/openrouter';
import { telegramMenuCommands } from '../src/modules/work/menu';
import type { TelegramUpdate } from '../src/adapters/telegram';
import { pilotConversationCorpus, pilotExecutionWalkthrough } from './fixtures/pilot-conversation-corpus';
const db = env.DB;
function update(id: number, text: string, user=123): TelegramUpdate {
  return { update_id:id, message:{from:{id:user,is_bot:false},chat:{id:user,type:'private'},text} };
}
function callbackUpdate(id: number, data: string, user=123): TelegramUpdate {
  return { update_id:id, callback_query:{id:`callback-${id}`,from:{id:user,is_bot:false},message:{chat:{id:user,type:'private'}},data} };
}
function replyUpdate(id: number, text: string, replyToMessageId: number, user=123): TelegramUpdate {
  return { update_id:id, message:{message_id:id+1000,from:{id:user,is_bot:false},chat:{id:user,type:'private'},text,
    reply_to_message:{message_id:replyToMessageId,text:'Tin được reply'}} };
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
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({ok:true,result:{message_id:1}}),{status:200})));
  for(const table of ['focus_feedback','goal_rename_requests','checkin_measurement_requests','checkin_outcomes','checkin_selection_requests','checkin_change_requests','weekly_checkins','weekly_plan_items','habit_definitions','weekly_task_carryovers','weekly_reviews','daily_briefings','task_reminders','progress_change_requests','job_metrics','weekly_reminders','reminder_preferences','weekly_progress_events','conversation_messages','weekly_plans','weekly_drafts','approval_requests','ai_budget','deliveries','tasks','goals','jobs','owner']) await db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
  await db.batch([...migration.split(';'), ...aiBudgetMigration.split(';'), ...approvalsMigration.split(';'), ...weeklyMigration.split(';'), ...contextMigration.split(';'), ...progressMigration.split(';'), ...remindersMigration.split(';'), ...correctionsMigration.split(';'), ...inlineActionsMigration.split(';'), ...dailyLoopMigration.split(';'), ...genericCheckinsMigration.split(';'), ...checkinCorrectionsMigration.split(';'), ...checkinSelectionMigration.split(';'), ...checkinOutcomesMigration.split(';'), ...expireCheckinSelectionsMigration.split(';'), ...foundationsMigration.split(';'), ...backfillHabitDatesMigration.split(';'), ...measurementRequestsMigration.split(';'), ...latencyMetricsMigration.split(';'), ...aiTaskProposalsMigration.split(';'), ...goalRenameMigration.split(';'), ...focusFeedbackMigration.split(';'), ...replyContextMigration.split(';')].map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
});
describe('task conversation on real D1 bindings',()=>{
  it('exposes a compact Telegram command menu backed by supported commands',()=>{
    expect(telegramMenuCommands.map(item=>item.command)).toEqual(['week','goal','today','schedule','review','progress','insights','focus','export','add','list','done','reminders','status','help']);
    expect(telegramMenuCommands.every(item => /^[a-z0-9_]{1,32}$/.test(item.command) && item.description.length > 0 && item.description.length <= 256)).toBe(true);
    expect(parseCommand('/progress')).toEqual({kind:'progressList',page:0});
    expect(parseCommand('/add mục tiêu: Viết README')).toEqual({kind:'add',title:'Viết README',goalScoped:true});
    expect(parseCommand('/status')).toEqual({kind:'systemStatus'});
    expect(parseCommand('/insights')).toEqual({kind:'insights'});
    expect(parseCommand('/focus')).toEqual({kind:'focus'});
    expect(parseCommand('/focus status')).toEqual({kind:'focus',status:true});
    expect(parseCommand('_navi:focus:feedback:9:helpful')).toEqual({kind:'focusFeedback',focusJobId:9,verdict:'helpful'});
    expect(parseCommand('/export json')).toEqual({kind:'export',format:'json'});
    expect(parseCommand('/reminders off')).toEqual({kind:'reminders',enabled:false});
    expect(parseCommand('/schedule T12 10/9 09:00')).toEqual({kind:'schedule',reference:'T12',day:10,month:9,year:undefined,hour:9,minute:0});
    expect(parseCommand('/goal')).toEqual({kind:'goal',action:'show'});
    expect(parseCommand('/goal add T12')).toEqual({kind:'goal',action:'attach',taskId:'T12'});
    expect(parseCommand('/goal rename Tìm việc Product')).toEqual({kind:'goal',action:'rename',title:'Tìm việc Product'});
    expect(parseCommand('/goal history')).toEqual({kind:'goal',action:'history'});
    expect(parseCommand('/week continue')).toEqual({kind:'week',continueGoal:true});
    expect(parseCommand('_navi:review:carry:T12')).toEqual({kind:'review',carry:'T12'});
    expect(parseCommand('Mục tiêu này xong rồi')).toEqual({kind:'goal',action:'complete'});
    expect(parseCommand('Task này để tuần sau')).toEqual({kind:'review',carry:'đó'});
    expect(parseCommand('Gắn task này vào mục tiêu')).toEqual({kind:'goal',action:'attach',taskId:'đó'});
    expect(parseCommand('Hello em, mục tiêu apply 5 cv trong tuần này anh cần có task mới là xây dựng lại make cv cho từng vị trí'))
      .toEqual({kind:'add',title:'xây dựng lại make cv cho từng vị trí',goalScoped:true});
    expect(parseCommand('Tuần này anh ưu tiên apply, cần sửa CV cho vị trí mobile trước.'))
      .toEqual({kind:'add',title:'sửa CV cho vị trí mobile',goalScoped:true});
    expect(parseCommand('Tuần này anh cần làm gì?')).toEqual({kind:'unknown'});
  });
  it('accepts only a valid structured AI task proposal',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:'{"kind":"add_task","title":"Tùy biến CV","goalScoped":true}'}}]}),{status:200})));
    await expect(openRouterStructuredAssistant('test-key')('CV của anh còn chung chung')).resolves.toEqual({kind:'add_task',title:'Tùy biến CV',goalScoped:true});
  });
  it('uses the focus assistant only to suggest one next action from a bounded weekly brief',async()=>{
    const now=Date.now();
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng'],[8,'/add Viết README']] as const) {
      await accept(db,update(id,text),false,now); await processNext(db,now); await replies();
    }
    await accept(db,update(9,'/focus'),false,now);
    let brief='';
    await processNext(db,now,undefined,undefined,async value=>{
      brief=value;
      return 'Điểm cần chú ý: chưa có check-in.\nViệc tiếp theo: dành 10 phút viết README.\nVì sao: đây là task đang mở hỗ trợ mục tiêu.';
    });
    const response=(await replies()).at(-1) ?? '';
    expect(brief).toContain('Mục tiêu: Ship Navi');
    expect(brief).toContain('T8: Viết README');
    expect(response).toContain('Gợi ý ưu tiên');
    expect(response).toContain('Việc tiếp theo: dành 10 phút viết README.');
    expect(await db.prepare("SELECT route FROM job_metrics WHERE job_id=(SELECT id FROM jobs WHERE update_id=9)").first()).toMatchObject({route:'ai_focus'});
    expect(await db.prepare('SELECT COUNT(*) AS count FROM tasks').first<{count:number}>()).toMatchObject({count:1});
    const delivery = await db.prepare('SELECT reply_markup FROM deliveries WHERE job_id=9').first<{reply_markup:string}>();
    expect(JSON.parse(delivery!.reply_markup)).toEqual({inline_keyboard:[[
      {text:'Hữu ích',callback_data:'_navi:focus:feedback:9:helpful'},
      {text:'Chưa đúng',callback_data:'_navi:focus:feedback:9:not_helpful'},
    ]]});
    await accept(db,update(10,'_navi:focus:feedback:9:helpful'),false,now); await processNext(db,now); await replies();
    expect(await db.prepare('SELECT verdict FROM focus_feedback WHERE focus_job_id=9').first()).toMatchObject({verdict:'helpful'});
    await accept(db,update(11,'_navi:focus:feedback:9:not_helpful'),false,now); await processNext(db,now);
    expect((await replies()).at(-1)).toContain('đánh giá gợi ý này rồi');
    await accept(db,update(12,'/focus status'),false,now); await processNext(db,now);
    expect((await replies()).at(-1)).toContain('Tỷ lệ hữu ích: 100%');
  });
  it('configures the focus assistant with a bounded Vietnamese review response',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:'Điểm cần chú ý: tiến độ chậm.\nViệc tiếp theo: hoàn thành README.\nVì sao: task này đang mở.'}}]}),{status:200})));
    await expect(openRouterFocusAssistant('test-key')('Tuần 2026-09-07')).resolves.toContain('Việc tiếp theo: hoàn thành README.');
  });
  it('builds a bounded, source-labelled context pack for the structured assistant',async()=>{
    const now=Date.now();
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Thiền 5 phút'],[6,'Đọc sách'],[7,'đúng'],[8,'/add Viết README'],[9,'Anh đã thiền']] as const) {
      await accept(db,update(id,text),false,now); await processNext(db,now); await replies();
    }
    await accept(db,update(10,'Em nhắc anh việc nào phù hợp nhất?'),false,now);
    let context='';
    await processNext(db,now,undefined,async (_text, value)=>{
      context=value ?? '';
      return {kind:'reply',text:'Em sẽ dựa trên kế hoạch tuần để gợi ý.'};
    });
    expect(context).toContain('Kế hoạch tuần');
    expect(context).toContain('mục tiêu “Ship Navi”');
    expect(context).toContain('Task mở gần đây: T8 “Viết README”');
    expect(context).toContain('chờ số phút cho thói quen “Thiền 5 phút”');
    expect(context.length).toBeLessThanOrEqual(3800);
    expect(await db.prepare("SELECT route FROM job_metrics WHERE job_id=(SELECT id FROM jobs WHERE update_id=10)").first()).toMatchObject({route:'ai_intent'});
  });
  it('puts the exact replied-to Telegram message ahead of ordinary recent context',async()=>{
    const now=Date.now();
    await accept(db,{...update(1,'/start secret'),message:{...update(1,'/start secret').message!,message_id:1001}},true,now); await processNext(db,now); await replies();
    const original: TelegramUpdate={update_id:2,message:{message_id:700,from:{id:123,is_bot:false},chat:{id:123,type:'private'},text:'Task CV mobile cần sửa phần thành tích'}};
    await accept(db,original,false,now); await processNext(db,now); await replies();
    await accept(db,replyUpdate(3,'Việc này nên ưu tiên thế nào?',700),false,now);
    let context='';
    await processNext(db,now,undefined,async (_text,value)=>{
      context=value ?? '';
      return {kind:'reply',text:'Em đã nhận được tham chiếu task.'};
    });
    expect(await db.prepare('SELECT reply_to_message_id FROM jobs WHERE update_id=3').first()).toMatchObject({reply_to_message_id:700});
    expect(context).toContain('Tin anh đang trả lời: Anh: Task CV mobile cần sửa phần thành tích');
    expect((await replies()).at(-1)).toContain('Em đã nhận được tham chiếu task.');
  });
  it('handles the inline progress button through the Telegram callback ingress path',async()=>{
    const now=Date.now();
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng']] as const) {
      await receive(update(id,text)); await processNext(db,now); await replies();
    }
    const response=await receive(callbackUpdate(8,'_navi:show:progress'));
    expect(response.status).toBe(200);
    expect(await processNext(db,now)).toBe(true);
    expect((await replies()).at(-1)).toContain('Tiến độ tuần');
  });
  it('records the AI route and its processing duration for an unmatched message',async()=>{
    const now=Date.now();
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    await accept(db,update(2,'Giúp anh suy nghĩ một điều mới'),false,now);
    await processNext(db,now,async()=> 'Em đang suy nghĩ cùng anh.');
    expect(await db.prepare('SELECT route,ai_started_at,ai_finished_at FROM job_metrics WHERE job_id=(SELECT id FROM jobs WHERE update_id=2)').first())
      .toMatchObject({route:'ai'});
  });
  it('reports observed runtime state and weekly check-in telemetry',async()=>{
    const now=Date.now();
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Public Navi'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng']] as const){await receive(update(id,text));await processNext(db,now);await replies();}
    await receive(update(8,'Anh đã public Navi')); await processNext(db,now); await replies();
    await receive(update(9,'Anh đã viết README')); await processNext(db,now); await replies();
    await receive(update(10,'Anh đã hoàn thành Navi')); await processNext(db,now); await replies();
    await receive(update(11,'/status')); await processNext(db,now);
    const status=(await replies()).at(-1) ?? '';
    expect(status).toContain('Tin /status này vừa được Worker xử lý');
    expect(status).toContain('10 tin gần: Queue');
    await receive(update(12,'/insights')); await processNext(db,now);
    const insight=(await replies()).at(-1);
    expect(insight).toContain('Ghi thẳng: 1');
    expect(insight).toContain('Chưa nối được mục: 1');
    expect(insight).toContain('Đang chờ chọn: 1');
  },10_000);
  it('exports the current plan, tasks, and check-ins as Markdown or JSON',async()=>{
    const now=Date.now();
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng'],[8,'/add Viết README'],[9,'Anh đã apply job Backend Developer']] as const){await receive(update(id,text));await processNext(db,now);await replies();}
    await receive(update(10,'/export')); await processNext(db,now);
    const markdown=(await replies()).at(-1);
    expect(markdown).toContain('Kế hoạch');
    expect(markdown).toContain('T8: Viết README');
    expect(markdown).toContain('Anh đã apply job Backend Developer');
    await receive(update(11,'/export json')); await processNext(db,now);
    const json=(await replies()).at(-1) ?? '';
    expect(json).toContain('"weekStart"');
    expect(json).toContain('"tasks"');
    expect(json).toContain('"checkins"');
    expect(json.length).toBeLessThan(4097);
  });
  it('keeps the pilot conversation corpus classified as intended',()=>{
    for (const sample of pilotConversationCorpus) expect(parseCommand(sample.text).kind).toBe(sample.kind);
  });
  it('runs the pilot execution walkthrough through Telegram, D1, and outbox',async()=>{
    const now=Date.now();
    const tomorrow = new Date(now + 24*60*60*1000 + 7*60*60*1000);
    const scheduledDay = tomorrow.getUTCDate(), scheduledMonth = tomorrow.getUTCMonth()+1, scheduledYear = tomorrow.getUTCFullYear();
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Public Navi lên GitHub'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách 2 buổi'],[7,'đúng']] as const) {
      await receive(update(id,text)); await processNext(db,now); await replies();
    }
    for(const [offset,sample] of pilotExecutionWalkthrough.entries()) {
      const text = sample.text.replace('{{tomorrow}}',`${scheduledDay}/${scheduledMonth}`);
      await receive(update(offset+8,text)); expect(await processNext(db,now), text).toBe(true);
      expect((await replies()).at(-1)).toContain(sample.reply);
    }
    expect((await db.prepare('SELECT note FROM weekly_checkins ORDER BY id').all<{note:string}>()).results).toEqual([
      {note:'Anh đã public Navi lên GitHub'},
      {note:'Anh vừa apply job Backend Developer'},
      {note:'Hôm nay anh đã chạy bộ'},
      {note:'Anh đã đọc sách'},
    ]);
    expect(await db.prepare('SELECT due_at FROM tasks WHERE id=?').bind('T12').first<{due_at:number}>())
      .toMatchObject({due_at:Date.UTC(scheduledYear,scheduledMonth-1,scheduledDay,2)});
    expect((await db.prepare("SELECT outcome FROM checkin_outcomes ORDER BY source_update").all<{outcome:string}>()).results)
      .toEqual([{outcome:'recorded'},{outcome:'recorded'},{outcome:'recorded'},{outcome:'recorded'}]);
  });
  it('keeps recent conversation context and reports pending versus saved tasks',async()=>{
    await link(); await receive(update(2,'thêm task viết proposal')); await processNext(db); await replies();
    await receive(update(3,'em đã thêm task chưa')); await processNext(db);
    expect((await replies()).at(-1)).toContain('đang chờ anh xác nhận');
    await receive(update(4,'đúng')); await processNext(db); await replies();
    await receive(update(5,'em đã thêm task chưa')); await processNext(db);
    expect((await replies()).at(-1)).toContain('Task gần nhất đã được lưu');
    expect((await db.prepare('SELECT COUNT(*) AS count FROM conversation_messages').first<{count:number}>())?.count).toBeGreaterThan(4);
  });
  it('resolves “việc đó” only when one recent open task exists',async()=>{
    await link(); await receive(update(2,'/add Viết proposal')); await processNext(db); await replies();
    await receive(update(3,'đánh dấu việc đó xong')); await processNext(db);
    expect(await tasks(db,true)).toMatchObject([{status:'done',title:'Viết proposal'}]);
  });
  it('guides a weekly plan and saves only after confirmation',async()=>{
    await link();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi MVP'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách 2 buổi']] as const){await receive(update(id,text));await processNext(db);}
    expect(await db.prepare('SELECT * FROM weekly_plans').first()).toBeNull();
    await receive(update(7,'đúng')); await processNext(db);
    expect(await db.prepare('SELECT goal,commitment,habit1,habit2 FROM weekly_plans').first()).toMatchObject({goal:'Ship Navi MVP',commitment:'Apply 5 jobs',habit1:'Chạy bộ 3 buổi',habit2:'Đọc sách 2 buổi'});
    expect((await db.prepare('SELECT kind,title,metric,target_count FROM weekly_plan_items ORDER BY id').all()).results).toMatchObject([
      {kind:'goal',title:'Ship Navi MVP',metric:'completion',target_count:null},
      {kind:'commitment',title:'Apply 5 jobs',metric:'count',target_count:5},
      {kind:'habit',title:'Chạy bộ 3 buổi',metric:'count',target_count:3},
      {kind:'habit',title:'Đọc sách 2 buổi',metric:'count',target_count:2},
    ]);
  });
  it('allows a weekly plan with one habit',async()=>{
    await link();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi MVP'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'bỏ qua']] as const){await receive(update(id,text));await processNext(db);}
    const summary=(await replies()).at(-1);
    expect(summary).toContain('Thói quen 1: Chạy bộ 3 buổi');
    expect(summary).not.toContain('Thói quen 2');
    await receive(update(7,'đúng')); await processNext(db);
    expect(await db.prepare('SELECT goal,commitment,habit1,habit2 FROM weekly_plans').first()).toMatchObject({goal:'Ship Navi MVP',commitment:'Apply 5 jobs',habit1:'Chạy bộ 3 buổi',habit2:''});
    expect((await db.prepare('SELECT title FROM weekly_plan_items ORDER BY id').all<{title:string}>()).results).toEqual([
      {title:'Ship Navi MVP'}, {title:'Apply 5 jobs'}, {title:'Chạy bộ 3 buổi'},
    ]);
    await receive(update(8,'/today')); await processNext(db);
    expect((await replies()).at(-1)).not.toContain('Thói quen 2');
  });
  it('carries selected tasks into a new week and archives the prior plan',async()=>{
    const now=Date.now(), local=new Date(now+7*60*60*1000), day=local.getUTCDay();
    local.setUTCDate(local.getUTCDate()-(day===0?6:day-1)+7);
    const nextWeek=local.toISOString().slice(0,10), previous=new Date(local.getTime()-7*24*60*60*1000).toISOString().slice(0,10);
    await accept(db,update(1,'/start secret'),true,now);await processNext(db,now);await replies();
    await db.prepare(`INSERT INTO weekly_plans(week_start,chat_id,goal,commitment,habit1,habit2,created_at)
      VALUES(?,'123','Old goal','Apply 5 jobs','Chạy bộ 3 buổi','Đọc sách',?)`).bind(previous,now).run();
    await db.prepare("INSERT INTO tasks(id,title,normalized_title,source_update,created_at) VALUES('T99','Viết README','viết readme',99,?)").bind(now).run();
    await db.prepare('INSERT INTO weekly_task_carryovers(week_start,task_id,decided_at) VALUES(?,?,?)').bind(nextWeek,'T99',now).run();
    await receive(update(2,'/week'));await processNext(db,local.getTime());
    expect((await replies()).at(-1)).toContain('T99: Viết README');
    for(const [id,text] of [[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng']] as const){await receive(update(id,text));await processNext(db,local.getTime());}
    expect(await db.prepare('SELECT status FROM weekly_plans WHERE week_start=?').bind(previous).first()).toMatchObject({status:'archived'});
    expect(await db.prepare('SELECT status FROM weekly_plans WHERE week_start=?').bind(nextWeek).first()).toMatchObject({status:'active'});
    await receive(update(8,'/today'));await processNext(db,local.getTime());
    expect((await replies()).at(-1)).toContain('T99: Viết README — giữ từ tuần trước');
  });
  it('records a generic completion only when it matches one planned item',async()=>{
    await link();
    for(const [id,text] of [[2,'/week'],[3,'Public Navi lên GitHub'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách 2 buổi'],[7,'đúng']] as const){await receive(update(id,text));await processNext(db);}
    await receive(update(8,'Anh đã public Navi lên GitHub')); await processNext(db);
    expect(await db.prepare('SELECT quantity,note FROM weekly_checkins').first()).toMatchObject({quantity:1,note:'Anh đã public Navi lên GitHub'});
    expect(await db.prepare("SELECT status FROM weekly_plan_items WHERE kind='goal'").first()).toMatchObject({status:'completed'});
    expect(await db.prepare('SELECT outcome FROM checkin_outcomes WHERE source_update=8').first()).toMatchObject({outcome:'recorded'});
    expect((await replies()).at(-1)).toContain('Đã ghi nhận cho “Public Navi lên GitHub”');
    await receive(update(9,'Anh đã hoàn thành việc đó')); await processNext(db);
    expect(await db.prepare('SELECT COUNT(*) AS count FROM weekly_checkins').first()).toMatchObject({count:1});
    expect((await replies()).at(-1)).toContain('chưa nối được');
  });
  it('offers scoped inline choices when a check-in matches multiple planned items',async()=>{
    await link();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi MVP'],[4,'Public Navi lên GitHub'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng']] as const){await receive(update(id,text));await processNext(db);}
    await replies(); await receive(update(8,'Anh đã hoàn thành Navi')); await processNext(db);
    let markup: unknown;
    await deliverNext(db,async (_chat,_text,buttons)=>{markup=buttons;return {kind:'sent',messageId:1};});
    expect(markup).toEqual({inline_keyboard:[[{text:'Ship Navi MVP',callback_data:'_navi:checkin:select:8:1'}],[{text:'Public Navi lên GitHub',callback_data:'_navi:checkin:select:8:2'}]]});
    await receive(update(9,'_navi:checkin:select:8:2')); await processNext(db);
    expect(await db.prepare('SELECT plan_item_id,note FROM weekly_checkins').first()).toMatchObject({plan_item_id:2,note:'Anh đã hoàn thành Navi'});
    expect(await db.prepare('SELECT status,selected_item_id FROM checkin_selection_requests WHERE source_update=8').first()).toMatchObject({status:'selected',selected_item_id:2});
    expect(await db.prepare('SELECT outcome FROM checkin_outcomes WHERE source_update=8').first()).toMatchObject({outcome:'selected'});
  });
  it('keeps selected, expired, dated, and corrected check-ins consistent end to end',async()=>{
    const now=Date.now(), local=new Date(now+7*60*60*1000), dated=`Ngày ${local.getUTCDate()}/${local.getUTCMonth()+1} anh đã chạy bộ`;
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Public Navi'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng']] as const){
      await receive(update(id,text)); await processNext(db,now); await replies();
    }
    await receive(update(8,'Anh đã hoàn thành Navi')); await processNext(db,now); await replies();
    await receive(update(9,'_navi:checkin:select:8:1')); await processNext(db,now);
    expect((await replies()).at(-1)).toContain('Đã ghi nhận cho “Ship Navi”');
    await receive(update(10,dated)); await processNext(db,now);
    expect((await replies()).at(-1)).toContain('Đã ghi nhận cho “Chạy bộ 3 buổi”: 1/3 lần');
    await receive(update(11,'/progress edit C1 Ship Navi production')); await processNext(db,now); await replies();
    await receive(update(12,'_navi:confirm:checkin:1')); await processNext(db,now);
    expect(await db.prepare('SELECT note FROM weekly_checkins WHERE id=1').first()).toMatchObject({note:'Ship Navi production'});
    await receive(update(13,'Anh đã hoàn thành Navi')); await processNext(db,now); await replies();
    await db.prepare('UPDATE checkin_selection_requests SET expires_at=? WHERE source_update=13').bind(now-1).run();
    await receive(update(14,'_navi:checkin:select:13:1')); await processNext(db,now);
    expect((await replies()).at(-1)).toContain('không còn hiệu lực');
    await receive(update(15,'/progress delete C1')); await processNext(db,now); await replies();
    await receive(update(16,'_navi:confirm:checkin:1')); await processNext(db,now);
    expect((await db.prepare('SELECT note FROM weekly_checkins ORDER BY id').all<{note:string}>()).results).toEqual([{note:dated}]);
    expect((await db.prepare('SELECT outcome FROM checkin_outcomes ORDER BY source_update').all<{outcome:string}>()).results)
      .toEqual([{outcome:'selected'},{outcome:'recorded'},{outcome:'ambiguous'}]);
  });
  it('records weekly applications and one run per local day without duplicates',async()=>{
    await link();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng']] as const){await receive(update(id,text));await processNext(db);}
    await receive(update(8,'Anh vừa apply job Backend Developer')); await processNext(db);
    await receive(update(9,'Anh đã apply job Backend Developer')); await processNext(db);
    await receive(update(10,'Hôm nay anh đã chạy bộ')); await processNext(db);
    await receive(update(11,'Hôm nay anh đã chạy bộ')); await processNext(db);
    await receive(update(12,'/week status')); await processNext(db);
    const events=await db.prepare('SELECT note FROM weekly_checkins ORDER BY id').all<{note:string}>();
    expect(events.results).toHaveLength(2);
    expect(events.results[0]).toMatchObject({note:'Anh vừa apply job Backend Developer'});
    const status=(await replies()).at(-1);
    expect(status).toContain('Cam kết apply: 1/5');
    expect(status).toContain('Thói quen chạy bộ: 1/3 lần');
  });
  it('tracks habits as daily occurrences instead of interpreting minutes as repetitions',async()=>{
    await link();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,"Thiền trong 5'"],[6,'Nghe tiếng Anh thụ động'],[7,'đúng']] as const){await receive(update(id,text));await processNext(db);await replies();}
    expect((await db.prepare("SELECT target_count FROM weekly_plan_items WHERE kind='habit' ORDER BY position").all<{target_count:number}>()).results)
      .toEqual([{target_count:7},{target_count:7}]);
    await receive(update(8,'Hôm nay anh đã thiền 5 phút')); await processNext(db);
    expect((await replies()).at(-1)).toContain('Đã ghi nhận cho “Thiền trong 5\'”: 1/7 ngày');
    await receive(update(9,'Hôm nay anh đã thiền 5 phút')); await processNext(db); await replies();
    await receive(update(10,'Hôm nay anh đã nghe tiếng Anh thụ động')); await processNext(db); await replies();
    expect((await db.prepare('SELECT quantity FROM weekly_checkins ORDER BY id').all<{quantity:number}>()).results).toEqual([{quantity:1},{quantity:1}]);
    await receive(update(11,'/progress')); await processNext(db);
    const progress=(await replies()).at(-1) ?? '';
    expect(progress).toContain('Mỗi ngày, tối thiểu 5 phút');
    expect(progress).toContain('1/7 ngày');
    expect(progress).toContain('Chuỗi hiện tại: 1 ngày');
  });
  it('keeps legacy running history visible when the current plan no longer has a running habit',async()=>{
    await link();
    for(const [id,text] of [[2,'/week'],[3,'Tìm việc'],[4,'Apply 5 job'],[5,'Thiền 5 buổi'],[6,'Nghe tiếng Anh'],[7,'đúng']] as const){await receive(update(id,text));await processNext(db);await replies();}
    const plan=await db.prepare("SELECT week_start FROM weekly_plans WHERE status='active'").first<{week_start:string}>();
    await db.batch([
      db.prepare("INSERT INTO weekly_progress_events(week_start,kind,label,normalized_label,source_update,occurred_at) VALUES(?,'run','2026-09-07','2026-09-07',81,?)").bind(plan!.week_start,Date.now()),
      db.prepare("INSERT INTO weekly_progress_events(week_start,kind,label,normalized_label,source_update,occurred_at) VALUES(?,'run','2026-09-08','2026-09-08',82,?)").bind(plan!.week_start,Date.now()),
    ]);
    await receive(update(9,'/progress')); await processNext(db);
    const progress=(await replies()).at(-1) ?? '';
    expect(progress).toContain('Lịch sử đã ghi, chưa gắn với mục kế hoạch hiện tại');
    expect(progress).toContain('Chạy bộ ngày 07/09');
    expect(progress).toContain('Chạy bộ ngày 08/09');
    expect(progress).toContain('Mục tiêu\nTìm việc');
    expect(progress).toContain('Cam kết\nApply 5 job');
    expect(progress).toContain('Thói quen 1\nThiền 5 buổi');
    expect(progress).toContain('░░░░░░░░ 0/5');
    expect(progress).toContain('○ Chưa hoàn thành');
    expect(progress).not.toContain('Thói quen chạy bộ:');
  });
  it('records an explicitly dated run without calling AI',async()=>{
    const now=Date.now();
    await accept(db,update(1,'/start secret'),true,now);await processNext(db,now);
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng']] as const){
      await receive(update(id,text));await processNext(db,now);
    }
    let aiCalls=0;
    await receive(update(8,'Ngày 7/9 anh đã chạy bộ'));
    await processNext(db,now,async()=>{aiCalls++;return 'AI fallback';});
    const events=await db.prepare('SELECT note FROM weekly_checkins').all<{note:string}>();
    expect(aiCalls).toBe(0);
    expect(events.results).toEqual([{note:'Ngày 7/9 anh đã chạy bộ'}]);
    expect(await db.prepare('SELECT occurred_at FROM weekly_checkins').first()).toMatchObject({occurred_at:Date.parse('2026-09-07T12:00:00+07:00')});
  });
  it('lists, renames and deletes progress only after confirmation',async()=>{
    await link();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng'],[8,'Anh đã apply job Backend Developer']] as const){await receive(update(id,text));await processNext(db);}
    await receive(update(9,'/progress'));await processNext(db);
    expect((await replies()).at(-1)).toContain('C1 · Anh đã apply job Backend Developer');
    await receive(update(10,'/progress edit C1 Senior Backend Developer'));await processNext(db);
    expect(await db.prepare('SELECT note FROM weekly_checkins WHERE id=1').first()).toMatchObject({note:'Anh đã apply job Backend Developer'});
    expect((await replies()).at(-1)).toContain('bấm nút');
    await receive(update(11,'đúng'));await processNext(db);await replies();
    expect(await db.prepare('SELECT note FROM weekly_checkins WHERE id=1').first()).toMatchObject({note:'Senior Backend Developer'});
    await receive(update(12,'/progress delete C1'));await processNext(db);await replies();
    await receive(update(13,'hủy'));await processNext(db);await replies();
    expect(await db.prepare('SELECT id FROM weekly_checkins WHERE id=1').first()).toMatchObject({id:1});
    await receive(update(14,'/progress delete C1'));await processNext(db);await replies();
    await receive(update(15,'đúng em'));await processNext(db);
    expect(await db.prepare('SELECT id FROM weekly_checkins WHERE id=1').first()).toBeNull();
  });
  it('queues one evening reminder for incomplete weekly progress and records delivery timing',async()=>{
    const now=Date.UTC(2026,8,9,13);
    await accept(db,update(1,'/start secret'),true,now);await processNext(db,now);await replies();
    await db.prepare(`INSERT INTO weekly_plans(week_start,chat_id,goal,commitment,habit1,habit2,created_at)
      VALUES('2026-09-07','123','Ship Navi','Apply 5 jobs','Chạy bộ 3 buổi','Đọc sách',?)`).bind(now).run();
    expect(await enqueueWeeklyProgressReminder(db,now)).toBe(true);
    expect(await enqueueWeeklyProgressReminder(db,now+5*60_000)).toBe(false);
    const sent=await replies();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain('Apply 5 jobs 0/5');
    expect(sent[0]).toContain('Chạy bộ 3 buổi 0/3 lần');
    expect(await db.prepare("SELECT delivery_started_at,delivery_finished_at,delivery_status FROM job_metrics WHERE job_id=(SELECT job_id FROM weekly_reminders)").first())
      .toMatchObject({delivery_status:'sent'});
  });
  it('builds a daily dashboard and sends each scheduled task reminder once',async()=>{
    await link();await replies();await receive(update(2,'/add Viết README'));await processNext(db);await replies();
    const due=Date.now();await db.prepare('UPDATE tasks SET due_at=? WHERE id=?').bind(due,'T2').run();
    await receive(update(3,'/today'));await processNext(db);
    expect((await replies()).at(-1)).toContain('T2: Viết README');
    expect(await enqueueDueTaskReminders(db,due+1_000)).toBe(true);
    expect(await enqueueDueTaskReminders(db,due+2_000)).toBe(false);
    let markup: unknown;
    await deliverNext(db,async (_chat,_text,buttons)=>{markup=buttons;return {kind:'sent',messageId:1};});
    expect(markup).toEqual({inline_keyboard:[[{text:'Đã làm',callback_data:'_navi:task:done:T2'},{text:'Dời 1 ngày',callback_data:'_navi:task:defer:T2'}],[{text:'Bỏ nhắc',callback_data:'_navi:task:clear:T2'}]]});
  });
  it('shows every planned item in today, reminder, and weekly review',async()=>{
    const now=Date.now(), reminder=Date.UTC(2026,8,9,13);
    await accept(db,update(1,'/start secret'),true,now);await processNext(db,now);await replies();
    await db.prepare(`INSERT INTO weekly_plans(week_start,chat_id,goal,commitment,habit1,habit2,created_at)
      VALUES('2026-09-07','123','Public Navi lên GitHub','Apply 5 jobs','Chạy bộ 3 buổi','Đọc sách 2 buổi',?)`).bind(now).run();
    await receive(update(2,'/today'));await processNext(db,now);
    expect((await replies()).at(-1)).toContain('Mục tiêu\nPublic Navi lên GitHub\n○ Chưa hoàn thành');
    expect(await enqueueWeeklyProgressReminder(db,reminder)).toBe(true);
    expect((await replies()).at(-1)).toContain('Đọc sách 2 buổi 0/2 lần');
    const sunday=Date.UTC(2026,8,13,12);
    expect(await enqueueWeeklyReview(db,sunday)).toBe(true);
    expect((await replies()).at(-1)).toContain('Mục tiêu\nPublic Navi lên GitHub\n○ Chưa hoàn thành');
  });
  it('queues one daily briefing and one Sunday review',async()=>{
    const morning=Date.UTC(2026,8,10,1), sunday=Date.UTC(2026,8,13,12);
    await accept(db,update(1,'/start secret'),true,morning);await processNext(db,morning);await replies();
    expect(await enqueueDailyBriefing(db,morning)).toBe(true);
    expect(await enqueueDailyBriefing(db,morning+60_000)).toBe(false);
    await db.prepare(`INSERT INTO weekly_plans(week_start,chat_id,goal,commitment,habit1,habit2,created_at) VALUES('2026-09-07','123','Ship Navi','Apply 5 jobs','Chạy bộ 3 buổi','Đọc sách',?)`).bind(sunday).run();
    expect(await enqueueWeeklyReview(db,sunday)).toBe(true);
    expect(await enqueueWeeklyReview(db,sunday+60_000)).toBe(false);
  });
  it('lets the owner turn weekly reminders off and back on',async()=>{
    await link();await replies();
    await receive(update(2,'/reminders off'));await processNext(db);await replies();
    expect(await db.prepare('SELECT weekly_progress_enabled FROM reminder_preferences WHERE chat_id=?').bind('123').first()).toMatchObject({weekly_progress_enabled:0});
    await receive(update(3,'bật nhắc tiến độ'));await processNext(db);
    expect((await replies()).at(-1)).toContain('Đã bật nhắc');
  });
  it('proposes a natural task and only creates it after confirmation',async()=>{
    await link(); await replies(); await receive(update(2,'À chắc anh phải thêm task apply 5 job trong tuần này')); await processNext(db);
    expect(await tasks(db)).toEqual([]);
    let markup: unknown;
    await deliverNext(db,async (_chat,_text,buttons)=>{markup=buttons;return {kind:'sent',messageId:1};});
    expect(markup).toEqual({inline_keyboard:[[{text:'Đúng',callback_data:'_navi:confirm:task:2'},{text:'Hủy',callback_data:'_navi:reject:task:2'}]]});
    await receive(update(3,'_navi:confirm:task:2')); await processNext(db);
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
  it('keeps a measured habit below its minimum out of progress and links goal tasks explicitly',async()=>{
    await link(); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,"Thiền trong 5'"],[6,'Nghe tiếng Anh'],[7,'đúng']] as const) {
      await accept(db,update(id,text),false); await processNext(db); await replies();
    }
    await receive(update(8,'Hôm nay anh đã thiền 2 phút')); await processNext(db);
    expect((await replies()).at(-1)).toContain('Ngày này chưa tính vào tiến độ');
    expect(await db.prepare("SELECT completed FROM (SELECT COALESCE(SUM(CASE WHEN met_threshold=1 THEN quantity ELSE 0 END),0) AS completed FROM weekly_checkins)").first()).toMatchObject({completed:0});
    await receive(update(9,'Hôm nay anh đã thiền 5 phút')); await processNext(db);
    expect((await replies()).at(-1)).toContain('Đã ghi nhận cho “Thiền trong 5\'”: 1/7 ngày');
    await receive(update(10,'/add mục tiêu: Viết README')); await processNext(db);
    expect((await tasks(db))[0]).toMatchObject({title:'Viết README',goal_title:'Ship Navi'});
    await receive(update(11,'/add Mua cà phê')); await processNext(db);
    expect((await tasks(db))[1]).toMatchObject({title:'Mua cà phê',goal_id:null});
  });
  it('shows a goal, links existing tasks, and changes its status only after confirmation',async()=>{
    await link(); await replies();
    let lastReply='';
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng'],[8,'/add Viết README'],[9,'/goal']] as const) {
      await accept(db,update(id,text),false); await processNext(db); lastReply=(await replies()).at(-1) ?? '';
    }
    expect(lastReply).toContain('T8: Viết README');
    await accept(db,update(10,'/goal add T8'),false); await processNext(db); await replies();
    expect((await tasks(db))[0]).toMatchObject({id:'T8',goal_title:'Ship Navi'});
    await accept(db,update(11,'/goal remove T8'),false); await processNext(db); await replies();
    expect((await tasks(db))[0]).toMatchObject({id:'T8',goal_id:null});
    await accept(db,update(12,'/goal done'),false); await processNext(db); await replies();
    const goal = await db.prepare("SELECT id,status FROM goals WHERE normalized_title='ship navi'").first<{id:number;status:string}>();
    expect(goal?.status).toBe('active');
    await accept(db,{...callbackUpdate(13,`_navi:confirm:goal:complete:${goal!.id}`),message:{from:{id:123,is_bot:false},chat:{id:123,type:'private'},text:`_navi:confirm:goal:complete:${goal!.id}`}},false); await processNext(db); await replies();
    expect(await db.prepare('SELECT status FROM goals WHERE id=?').bind(goal!.id).first()).toMatchObject({status:'completed'});
    await accept(db,{...callbackUpdate(14,`_navi:confirm:goal:reopen:${goal!.id}`),message:{from:{id:123,is_bot:false},chat:{id:123,type:'private'},text:`_navi:confirm:goal:reopen:${goal!.id}`}},false); await processNext(db); await replies();
    expect(await db.prepare('SELECT status FROM goals WHERE id=?').bind(goal!.id).first()).toMatchObject({status:'active'});
    await accept(db,update(15,'/goal rename Ship Navi v2'),false); await processNext(db); await replies();
    expect(await db.prepare('SELECT status FROM goal_rename_requests WHERE goal_id=?').bind(goal!.id).first()).toMatchObject({status:'pending'});
    await accept(db,update(16,'_navi:confirm:goalrename:15'),false); await processNext(db); await replies();
    expect(await db.prepare('SELECT title,normalized_title FROM goals WHERE id=?').bind(goal!.id).first()).toMatchObject({title:'Ship Navi v2',normalized_title:'ship navi v2'});
    await accept(db,update(17,'/goal history'),false); await processNext(db);
    expect((await replies()).at(-1)).toContain('Ship Navi v2');
    await accept(db,update(18,'/goal archive'),false); await processNext(db); await replies();
    await accept(db,update(19,`_navi:confirm:goal:archive:${goal!.id}`),false); await processNext(db); await replies();
    expect(await db.prepare('SELECT status FROM goals WHERE id=?').bind(goal!.id).first()).toMatchObject({status:'archived'});
  });
  it('makes an actionable weekly review and carries a chosen task forward',async()=>{
    const now=Date.now();
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng'],[8,'/add Viết README']] as const) {
      await accept(db,update(id,text),false,now); await processNext(db,now); await replies();
    }
    await accept(db,update(9,'/review'),false,now); await processNext(db,now);
    const delivery=await db.prepare('SELECT text,reply_markup FROM deliveries ORDER BY job_id DESC LIMIT 1').first<{text:string;reply_markup:string}>();
    expect(delivery?.text).toContain('Review tuần');
    expect(delivery?.text).toContain('T8: Viết README — việc riêng');
    expect(JSON.parse(delivery!.reply_markup)).toEqual({inline_keyboard:[[{text:'Đã xong T8',callback_data:'_navi:task:done:T8'},{text:'Sang tuần T8',callback_data:'_navi:review:carry:T8'}]]});
    await replies();
    await accept(db,update(10,'_navi:review:carry:T8'),false,now); await processNext(db,now); await replies();
    expect(await db.prepare("SELECT task_id FROM weekly_task_carryovers WHERE task_id='T8'").first()).toMatchObject({task_id:'T8'});
  });
  it('understands a contextual task and goal reference when one task is unambiguous',async()=>{
    const now=Date.now();
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng'],[8,'/add Viết README']] as const) {
      await accept(db,update(id,text),false,now); await processNext(db,now); await replies();
    }
    await accept(db,update(9,'Gắn task này vào mục tiêu'),false,now); await processNext(db,now); await replies();
    expect((await tasks(db))[0]).toMatchObject({id:'T8',goal_title:'Ship Navi'});
    await accept(db,update(10,'Mục tiêu này xong rồi'),false,now); await processNext(db,now);
    const goalPrompt=await db.prepare('SELECT text,reply_markup FROM deliveries ORDER BY job_id DESC LIMIT 1').first<{text:string;reply_markup:string}>();
    expect(goalPrompt?.text).toContain('Anh muốn đánh dấu mục tiêu');
    expect(JSON.parse(goalPrompt!.reply_markup).inline_keyboard[0][0].callback_data).toContain('_navi:confirm:goal:complete:');
    await replies();
    await accept(db,update(11,'Task này để tuần sau'),false,now); await processNext(db,now); await replies();
    expect(await db.prepare("SELECT task_id FROM weekly_task_carryovers WHERE task_id='T8'").first()).toMatchObject({task_id:'T8'});
    await accept(db,update(12,'/help'),false,now); await processNext(db,now);
    expect((await replies()).at(-1)).toContain('mục tiêu này xong rồi');
  });
  it('adds a task scoped to the stated goal without waiting for the AI fallback',async()=>{
    const now=Date.now();
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Apply 5 CV phù hợp'],[4,'Apply 5 jobs'],[5,'Thiền 5 phút'],[6,'Nghe tiếng Anh'],[7,'đúng']] as const) {
      await accept(db,update(id,text),false,now); await processNext(db,now); await replies();
    }
    await accept(db,update(8,'Hello em, mục tiêu apply 5 cv trong tuần này anh cần có task mới là xây dựng lại make cv cho từng vị trí'),false,now);
    let aiCalls=0;
    await processNext(db,now,async()=>{aiCalls++; return 'Không được dùng';});
    expect(aiCalls).toBe(0);
    expect((await tasks(db))[0]).toMatchObject({id:'T8',title:'xây dựng lại make cv cho từng vị trí',goal_title:'Apply 5 CV phù hợp'});
  });
  it('turns a stated weekly priority into a goal-scoped task without the AI fallback',async()=>{
    const now=Date.now();
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Tìm việc phù hợp'],[4,'Apply 5 jobs'],[5,'Thiền 5 phút'],[6,'Nghe tiếng Anh'],[7,'đúng']] as const) {
      await accept(db,update(id,text),false,now); await processNext(db,now); await replies();
    }
    await accept(db,update(8,'Tuần này anh ưu tiên apply, cần sửa CV cho vị trí mobile trước.'),false,now);
    let aiCalls=0;
    await processNext(db,now,async()=>{aiCalls++; return 'Không được dùng';});
    expect(aiCalls).toBe(0);
    expect((await tasks(db))[0]).toMatchObject({title:'sửa CV cho vị trí mobile',goal_title:'Tìm việc phù hợp'});
  });
  it('turns an AI task proposal into a confirmation before it mutates the goal',async()=>{
    const now=Date.now();
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Tìm việc phù hợp'],[4,'Apply 5 jobs'],[5,'Thiền 5 phút'],[6,'Nghe tiếng Anh'],[7,'đúng']] as const) {
      await accept(db,update(id,text),false,now); await processNext(db,now); await replies();
    }
    await accept(db,update(8,'Em thấy CV của anh đang chung chung, nên xử lý thế nào?'),false,now);
    await processNext(db,now,undefined,async()=>({kind:'add_task',title:'Tùy biến CV cho vị trí Mobile',goalScoped:true}));
    expect(await tasks(db)).toEqual([]);
    expect(await db.prepare('SELECT title,goal_scoped,status FROM approval_requests WHERE source_update=8').first())
      .toMatchObject({title:'Tùy biến CV cho vị trí Mobile',goal_scoped:1,status:'pending'});
    const proposal=await db.prepare('SELECT text,reply_markup FROM deliveries ORDER BY job_id DESC LIMIT 1').first<{text:string;reply_markup:string}>();
    expect(proposal?.text).toContain('sẽ gắn với mục tiêu tuần hiện tại');
    expect(JSON.parse(proposal!.reply_markup).inline_keyboard[0][0].callback_data).toBe('_navi:confirm:task:8');
    await replies();
    await accept(db,update(9,'_navi:confirm:task:8'),false,now); await processNext(db,now); await replies();
    expect((await tasks(db))[0]).toMatchObject({id:'T8',title:'Tùy biến CV cho vị trí Mobile',goal_title:'Tìm việc phù hợp'});
  });
  it('continues a goal into the next week without creating a second identity',async()=>{
    const now=Date.now(), local=new Date(now+7*60*60*1000), day=(local.getUTCDay()+6)%7;
    local.setUTCDate(local.getUTCDate()-day);
    const currentWeek=local.toISOString().slice(0,10), previousDate=new Date(`${currentWeek}T00:00:00Z`);
    previousDate.setUTCDate(previousDate.getUTCDate()-7);
    const previousWeek=previousDate.toISOString().slice(0,10);
    await link(); await replies();
    await db.prepare('INSERT INTO weekly_plans(week_start,chat_id,goal,commitment,habit1,habit2,created_at) VALUES(?,?,?,?,?,?,?)')
      .bind(previousWeek,'123','Ship Navi','Apply 5 jobs','Chạy bộ 3 buổi','Đọc sách',now-1).run();
    await db.prepare('INSERT INTO goals(chat_id,title,normalized_title,created_at) VALUES(?,?,?,?)').bind('123','Ship Navi','ship navi',now-1).run();
    await accept(db,update(9,'/week continue'),false,now); expect(await processNext(db,now)).toBe(true);
    expect((await replies()).at(-1)).toContain('Tiếp tục mục tiêu: Ship Navi');
    for(const [id,text] of [[10,'Apply thêm 5 jobs'],[11,'Chạy bộ 3 buổi'],[12,'Đọc sách'],[13,'đúng'],[14,'/goal']] as const) {
      await accept(db,update(id,text),false,now); await processNext(db,now); await replies();
    }
    expect(await db.prepare("SELECT COUNT(*) AS count FROM goals WHERE normalized_title='ship navi'").first()).toMatchObject({count:1});
    const links=(await db.prepare("SELECT DISTINCT goal_id FROM weekly_plan_items WHERE kind='goal' ORDER BY goal_id").all<{goal_id:number}>()).results;
    expect(links).toHaveLength(1);
  });
  it('preserves a habit measurement when correcting only its note',async()=>{
    await link(); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi v2'],[4,'Apply 5 jobs'],[5,"Thiền trong 5'"],[6,'Nghe tiếng Anh'],[7,'đúng']] as const) {
      await receive(update(id,text)); await processNext(db); await replies();
    }
    expect(await db.prepare("SELECT metric FROM weekly_plan_items WHERE kind='goal'").first()).toMatchObject({metric:'completion'});
    await receive(update(8,'Hôm nay anh đã thiền 5 phút')); await processNext(db); await replies();
    await receive(update(9,'/progress edit C1 Thiền buổi sáng')); await processNext(db); await replies();
    await receive(update(10,'đúng')); await processNext(db); await replies();
    expect(await db.prepare('SELECT note,actual_value,met_threshold FROM weekly_checkins WHERE id=1').first())
      .toMatchObject({note:'Thiền buổi sáng',actual_value:5,met_threshold:1});
    await receive(update(11,'/week status')); await processNext(db);
    expect((await replies()).at(-1)).toContain('1/7 ngày');
  });
  it('reads duration and weekly cadence together, and backfills a dated legacy run',async()=>{
    await link(); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Thiền 5 phút, 3 buổi/tuần'],[6,'Nghe tiếng Anh'],[7,'đúng']] as const) {
      await receive(update(id,text)); await processNext(db); await replies();
    }
    expect(await db.prepare("SELECT cadence,target_count,minimum_value FROM weekly_plan_items WHERE kind='habit' AND position=1").first())
      .toMatchObject({cadence:'weekly',target_count:3,minimum_value:5});
    const item=await db.prepare("SELECT id,week_start FROM weekly_plan_items WHERE kind='habit' AND position=1").first<{id:number;week_start:string}>();
    const timestamp=Date.parse('2026-09-08T12:00:00+07:00');
    await db.batch([
      db.prepare("INSERT INTO weekly_progress_events(week_start,kind,label,normalized_label,source_update,occurred_at) VALUES(?,'run','2026-09-07','2026-09-07',88,?)").bind(item!.week_start,timestamp),
      db.prepare("INSERT INTO weekly_checkins(week_start,plan_item_id,quantity,note,normalized_note,source_update,occurred_at) VALUES(?,?,1,'2026-09-07','2026-09-07',88,?)").bind(item!.week_start,item!.id,timestamp),
    ]);
    await db.prepare(backfillHabitDatesMigration).run();
    expect(await db.prepare('SELECT local_date FROM weekly_checkins WHERE source_update=88').first()).toMatchObject({local_date:'2026-09-07'});
  });
  it('records a bare minute reply against the pending habit measurement',async()=>{
    await link(); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,"Thiền trong 5'"],[6,'Nghe tiếng Anh'],[7,'đúng']] as const) {
      await receive(update(id,text)); await processNext(db); await replies();
    }
    await receive(update(8,'Hôm nay anh đã thiền')); await processNext(db);
    expect((await replies()).at(-1)).toContain('ví dụ: 5 phút');
    expect(await db.prepare("SELECT status FROM checkin_measurement_requests WHERE source_update=8").first()).toMatchObject({status:'pending'});
    await receive(update(9,'5 phút')); await processNext(db);
    expect((await replies()).at(-1)).toContain('Đã ghi nhận 5 phút');
    expect(await db.prepare('SELECT actual_value,met_threshold FROM weekly_checkins').first()).toMatchObject({actual_value:5,met_threshold:1});
    expect(await db.prepare("SELECT status FROM checkin_measurement_requests WHERE source_update=8").first()).toMatchObject({status:'recorded'});
  });
  it('keeps the original day across midnight and supports scoped cancellation and expiry',async()=>{
    const localNow=new Date(Date.now()+7*60*60*1000);
    localNow.setUTCHours(23,55,0,0);
    const now=localNow.getTime()-7*60*60*1000;
    const originalDate=new Date(now+7*60*60*1000).toISOString().slice(0,10);
    const [year,month,day]=originalDate.split('-').map(Number);
    await accept(db,update(1,'/start secret'),true,now); await processNext(db,now); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Thiền 5 phút'],[6,'Nghe tiếng Anh 10 phút'],[7,'đúng'],[8,'Hôm nay anh đã thiền']] as const) {
      await accept(db,update(id,text),false,now); await processNext(db,now); await replies();
    }
    await accept(db,update(9,'5 phút'),false,now+10*60*1000); await processNext(db,now+10*60*1000); await replies();
    expect(await db.prepare('SELECT local_date,actual_value FROM weekly_checkins').first()).toMatchObject({local_date:originalDate,actual_value:5});
    await accept(db,update(10,'/today'),false,now+10*60*1000); await processNext(db,now+10*60*1000);
    const today=(await replies()).at(-1)!;
    expect(today).toContain('Chuỗi hiện tại: 1 ngày');
    expect(today).toContain('Hôm nay: chưa ghi nhận');
    for(const [id,text] of [[11,'Hôm nay anh đã thiền'],[12,'Hôm nay anh đã nghe tiếng Anh'],[13,'_navi:measurement:cancel:11']] as const) {
      await accept(db,update(id,text),false,now+20*60*1000); await processNext(db,now+20*60*1000); await replies();
    }
    expect(await db.prepare("SELECT source_update FROM checkin_measurement_requests WHERE status='pending'").first()).toMatchObject({source_update:12});
    await accept(db,update(14,'/cancelmeasurement'),false,now+20*60*1000); await processNext(db,now+20*60*1000); await replies();
    expect(await db.prepare("SELECT id FROM checkin_measurement_requests WHERE status='pending'").first()).toBeNull();
    await accept(db,update(15,`Ngày ${day}/${month}/${year} anh đã thiền`),false,now+20*60*1000); await processNext(db,now+20*60*1000); await replies();
    const request=await db.prepare('SELECT created_at,expires_at FROM checkin_measurement_requests WHERE source_update=15').first<{created_at:number;expires_at:number}>();
    expect(request!.expires_at-request!.created_at).toBe(24*60*60*1000);
    await accept(db,update(16,'5 phút'),false,request!.expires_at+1); await processNext(db,request!.expires_at+1);
    expect((await replies()).at(-1)).toContain('hết hạn');
    expect(await db.prepare('SELECT COUNT(*) AS n FROM weekly_checkins').first()).toMatchObject({n:1});
  });
  it('shows unmet and met habits today and refuses ambiguous old measurement requests',async()=>{
    await link(); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Thiền 5 phút'],[6,'Nghe tiếng Anh 10 phút'],[7,'đúng'],[8,'Hôm nay anh đã thiền 2 phút'],[9,'Hôm nay anh đã nghe tiếng Anh 10 phút'],[10,'/today']] as const) {
      await receive(update(id,text)); await processNext(db);
    }
    const today=(await replies()).at(-1)!;
    expect(today).toContain('Hôm nay: đã ghi nhận, chưa đủ ngưỡng');
    expect(today).toContain('Hôm nay: đã đạt');
    await db.prepare(`INSERT INTO checkin_measurement_requests(chat_id,plan_item_id,week_start,local_date,source_update,created_at,expires_at)
      SELECT '123',id,week_start,week_start,100+id,?,? FROM weekly_plan_items WHERE kind='habit'`).bind(Date.now(),Date.now()+60000).run();
    await receive(update(11,'5 phút')); await processNext(db);
    expect((await replies()).at(-1)).toContain('Có nhiều câu hỏi');
    expect(await db.prepare('SELECT COUNT(*) AS n FROM weekly_checkins').first()).toMatchObject({n:2});
  });
  it('paginates progress history with a callback-safe page command',async()=>{
    await link(); await replies();
    for(const [id,text] of [[2,'/week'],[3,'Ship Navi'],[4,'Apply 5 jobs'],[5,'Chạy bộ 3 buổi'],[6,'Đọc sách'],[7,'đúng']] as const) {
      await receive(update(id,text)); await processNext(db); await replies();
    }
    const item=await db.prepare("SELECT id,week_start FROM weekly_plan_items WHERE kind='commitment'").first<{id:number;week_start:string}>();
    await db.batch(Array.from({length:7},(_,index)=>db.prepare(`INSERT INTO weekly_checkins(week_start,plan_item_id,quantity,note,normalized_note,source_update,occurred_at)
      VALUES(?,?,?,?,?,?,?)`).bind(item!.week_start,item!.id,1,`Apply ${index+1}`,`apply ${index+1}`,100+index,Date.now()+index)));
    expect(parseCommand('_navi:show:progress:1')).toEqual({kind:'progressList',page:1});
    await receive(update(20,'/progress 2')); await processNext(db);
    const progress=(await replies()).at(-1) ?? '';
    expect(progress).toContain('Lịch sử gần đây · trang 2');
    expect(progress).toContain('Apply 1');
    expect(progress).not.toContain('Apply 7');
  });
});
