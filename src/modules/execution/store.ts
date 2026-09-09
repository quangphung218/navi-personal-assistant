import { help, normalize, parseCommand, parseNaturalAdd } from '../work/commands';
import type { ReplyMarkup, TelegramUpdate, Sender } from '../../adapters/telegram';
import type { Assistant } from '../../adapters/openrouter';

type Job = { id: number; update_id: number; chat_id: string; text: string; attempts: number };
type Task = { id: string; title: string; status: 'open' | 'done'; revision: number; due_at: number|null };
type Approval = { id: number; source_update: number; title: string; status: 'pending' };
type WeeklyDraft = { id: 1; chat_id: string; step: 'goal'|'commitment'|'habit1'|'habit2'|'confirm'; goal: string|null; commitment: string|null; habit1: string|null; habit2: string|null; week_start: string };
type WeeklyPlan = { week_start: string; chat_id: string; goal: string; commitment: string; habit1: string; habit2: string };
type ReminderPreference = { weekly_progress_enabled: number; delivery_hour: number };
type ProgressEvent = { id: number; kind: 'job_application'|'run'; label: string; normalized_label: string };
type ProgressChange = { id: number; event_id: number; action: 'delete'|'rename'; new_label: string|null };
type CheckInChange = { id: number; checkin_id: number; action: 'delete'|'rename'; new_note: string|null };
type CheckInSelection = { id: number; week_start: string; source_update: number; text: string; candidate_item_ids: string; status: 'pending'|'selected'|'rejected'; expires_at: number|null };
type PlanItem = { id: number; kind: 'goal'|'commitment'|'habit'; position: number; title: string; normalized_title: string; metric: 'count'|'completion'; target_count: number|null; status: 'active'|'completed'; completed: number };
type StagedCheckIn = { item: PlanItem; text: string; weekStart: string; sourceUpdate: number; occurredAt: number; chatId: string; outcome: 'recorded'|'selected' };

function localDate(now: number): string {
  return new Date(now + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function weekStart(now: number): string {
  const local = new Date(now + 7 * 60 * 60 * 1000);
  const day = local.getUTCDay();
  local.setUTCDate(local.getUTCDate() - (day === 0 ? 6 : day - 1));
  return local.toISOString().slice(0, 10);
}

function datedRunLabel(date: { day: number; month: number; year?: number }, now: number): string | undefined {
  const localNow = new Date(now + 7 * 60 * 60 * 1000);
  const year = date.year ?? localNow.getUTCFullYear();
  const value = new Date(Date.UTC(year, date.month - 1, date.day));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== date.month - 1 || value.getUTCDate() !== date.day) return undefined;
  return value.toISOString().slice(0, 10);
}

function weekEnd(start: string): string {
  const value = new Date(`${start}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 6);
  return value.toISOString().slice(0, 10);
}

function localHour(now: number): number {
  return new Date(now + 7 * 60 * 60 * 1000).getUTCHours();
}

function localDay(now: number): number {
  return new Date(now + 7 * 60 * 60 * 1000).getUTCDay();
}

function scheduledTime(command: { day: number; month: number; year?: number; hour: number; minute: number }, now: number): number | undefined {
  const year = command.year ?? new Date(now + 7 * 60 * 60 * 1000).getUTCFullYear();
  const value = new Date(Date.UTC(year, command.month - 1, command.day, command.hour - 7, command.minute));
  const local = new Date(value.getTime() + 7 * 60 * 60 * 1000);
  if (local.getUTCFullYear() !== year || local.getUTCMonth() !== command.month - 1 || local.getUTCDate() !== command.day || local.getUTCHours() !== command.hour || local.getUTCMinutes() !== command.minute) return undefined;
  return value.getTime();
}

function formatLocalTime(timestamp: number): string {
  const local = new Date(timestamp + 7 * 60 * 60 * 1000);
  return `${String(local.getUTCDate()).padStart(2,'0')}/${String(local.getUTCMonth()+1).padStart(2,'0')} ${String(local.getUTCHours()).padStart(2,'0')}:${String(local.getUTCMinutes()).padStart(2,'0')}`;
}

function targetFrom(text: string): number | undefined {
  const value = Number(text.match(/\b(\d{1,3})\b/u)?.[1]);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function checkInQuantity(text: string): number {
  const withoutDate = normalize(text).replace(/ngày\s+\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{4})?/u,'');
  return Math.max(1, Number(withoutDate.match(/\b(\d{1,3})\b/u)?.[1] ?? 1));
}

function metricFor(title: string): { metric: 'count'|'completion'; target?: number } {
  const target = targetFrom(title);
  return target ? { metric: 'count', target } : { metric: 'completion' };
}

function planItemValues(plan: Pick<WeeklyPlan,'goal'|'commitment'|'habit1'|'habit2'>) {
  return [
    { kind:'goal' as const, position:0, title:plan.goal },
    { kind:'commitment' as const, position:0, title:plan.commitment },
    { kind:'habit' as const, position:1, title:plan.habit1 },
    { kind:'habit' as const, position:2, title:plan.habit2 },
  ].filter(item => item.title.trim().length > 0).map(item => ({ ...item, ...metricFor(item.title) }));
}

async function planItems(db: D1Database, week: string): Promise<PlanItem[]> {
  return (await db.prepare(`SELECT i.id,i.kind,i.position,i.title,i.normalized_title,i.metric,i.target_count,i.status,
    COALESCE(SUM(c.quantity),0) AS completed FROM weekly_plan_items i LEFT JOIN weekly_checkins c ON c.plan_item_id=i.id
    WHERE i.week_start=? GROUP BY i.id ORDER BY CASE i.kind WHEN 'goal' THEN 0 WHEN 'commitment' THEN 1 ELSE 2 END,i.position`).bind(week).all<PlanItem>()).results;
}

async function ensurePlanItems(db: D1Database, plan: WeeklyPlan, now: number): Promise<PlanItem[]> {
  const existing = await planItems(db, plan.week_start);
  if (!existing.length) await db.batch(planItemValues(plan).map(item => db.prepare(`INSERT OR IGNORE INTO weekly_plan_items(week_start,kind,position,title,normalized_title,metric,target_count,created_at)
    VALUES(?,?,?,?,?,?,?,?)`).bind(plan.week_start,item.kind,item.position,item.title,normalize(item.title),item.metric,item.target ?? null,now)));
  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO weekly_checkins(week_start,plan_item_id,quantity,note,normalized_note,source_update,occurred_at)
      SELECT e.week_start,i.id,1,e.label,e.normalized_label,e.source_update,e.occurred_at FROM weekly_progress_events e
      JOIN weekly_plan_items i ON i.week_start=e.week_start AND i.kind='commitment'
      WHERE e.week_start=? AND e.kind='job_application'`).bind(plan.week_start),
    db.prepare(`INSERT OR IGNORE INTO weekly_checkins(week_start,plan_item_id,quantity,note,normalized_note,source_update,occurred_at)
      SELECT e.week_start,i.id,1,e.label,e.normalized_label,e.source_update,e.occurred_at FROM weekly_progress_events e
      JOIN weekly_plan_items i ON i.week_start=e.week_start AND i.kind='habit' AND i.normalized_title LIKE '%chạy%'
      WHERE e.week_start=? AND e.kind='run'`).bind(plan.week_start),
  ]);
  return planItems(db, plan.week_start);
}

function checkInCandidates(items: PlanItem[], text: string): PlanItem[] {
  const message = normalize(text);
  const ignored = new Set(['anh','vua','vừa','da','đã','xong','hoan','thành','hoàn','làm','của','với','cho','trong','tuần','này']);
  const matches = items.map(item => ({ item, score: item.normalized_title.split(/[^\p{L}\p{N}]+/u)
    .filter(token => token.length > 2 && !ignored.has(token)).filter(token => message.includes(token)).length })).filter(match => match.score > 0);
  const highest = Math.max(0,...matches.map(match=>match.score));
  return matches.filter(match => match.score === highest).sort((a,b) => b.score-a.score).map(match => match.item);
}

function checkInKey(item: PlanItem, text: string, now: number): string {
  const value = normalize(text);
  if (item.kind === 'habit' && /chạy|run/iu.test(item.title)) {
    const dated = value.match(/ngày\s+(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{4}))?/iu);
    const date = dated ? datedRunLabel({day:Number(dated[1]),month:Number(dated[2]),year:dated[3] ? Number(dated[3]) : undefined},now) : localDate(now);
    return `run:${date ?? localDate(now)}`;
  }
  if (item.kind === 'commitment' && /apply|ứng tuyển/iu.test(item.title)) {
    const detail = value.replace(/^.*?(?:apply|ứng tuyển)(?:\s+(?:job|vị trí))?\s*/iu,'').replace(/^(?:thêm\s+)/iu,'');
    return `apply:${detail}`;
  }
  return value;
}

async function stageCheckIn(db: D1Database, statements: D1PreparedStatement[], guard: string, args: () => (string|number)[], checkIn: StagedCheckIn): Promise<{ already: boolean; progress: string }> {
  const quantity = checkIn.item.metric === 'count' ? checkInQuantity(checkIn.text) : 1;
  const key = checkInKey(checkIn.item,checkIn.text,checkIn.occurredAt);
  const existing = await db.prepare('SELECT id FROM weekly_checkins WHERE source_update=? OR (plan_item_id=? AND normalized_note=?)')
    .bind(checkIn.sourceUpdate,checkIn.item.id,key).first<{id:number}>();
  const completed = checkIn.item.completed + quantity;
  const progress = checkIn.item.metric === 'count' ? `${completed}/${checkIn.item.target_count}` : 'đã hoàn thành';
  if (existing) return { already:true, progress };
  statements.push(db.prepare(`INSERT INTO weekly_checkins(week_start,plan_item_id,quantity,note,normalized_note,source_update,occurred_at)
    SELECT ?,?,?,?,?,?,? WHERE ${guard}`).bind(checkIn.weekStart,checkIn.item.id,quantity,checkIn.text,key,checkIn.sourceUpdate,checkIn.occurredAt,...args()));
  if (checkIn.item.metric === 'completion' || (checkIn.item.target_count !== null && completed >= checkIn.item.target_count)) {
    statements.push(db.prepare(`UPDATE weekly_plan_items SET status='completed' WHERE id=? AND ${guard}`).bind(checkIn.item.id,...args()));
  }
  if (checkIn.outcome === 'recorded') {
    statements.push(db.prepare(`INSERT OR IGNORE INTO checkin_outcomes(chat_id,source_update,outcome,created_at)
      SELECT ?,?,'recorded',? WHERE ${guard}`).bind(checkIn.chatId,checkIn.sourceUpdate,checkIn.occurredAt,...args()));
  } else {
    statements.push(db.prepare(`UPDATE checkin_outcomes SET outcome='selected' WHERE chat_id=? AND source_update=? AND outcome='ambiguous' AND ${guard}`)
      .bind(checkIn.chatId,checkIn.sourceUpdate,...args()));
  }
  return { already:false, progress };
}

function formatPlanItems(items: PlanItem[], showAll = false): string {
  const visible = showAll ? items : items.filter(item => item.metric === 'completion' || item.completed > 0);
  if (!visible.length) return '';
  return `\n\nKế hoạch đang theo dõi:\n${visible.map(item => {
    const progress = item.metric === 'count' ? `${item.completed}/${item.target_count}` : item.status === 'completed' ? 'đã hoàn thành' : 'chưa hoàn thành';
    return `• ${item.title} — ${progress}`;
  }).join('\n')}`;
}

function progressCounts(items: PlanItem[]): { applications: number; runs: number } {
  const applications = items.find(item => item.kind === 'commitment' && /apply|ứng tuyển/iu.test(item.title))?.completed ?? 0;
  const runs = items.find(item => item.kind === 'habit' && /chạy|run/iu.test(item.title))?.completed ?? 0;
  return { applications, runs };
}

function formatCheckIns(checkins: {id:number; note:string}[]): string {
  if (!checkins.length) return 'Chưa có check-in nào trong tuần này.';
  return `Check-in tuần này:\n${checkins.slice(0,20).map(checkin => `• C${checkin.id} · ${checkin.note.slice(0,140)}`).join('\n')}\n\nSửa: /progress edit C... Nội dung mới\nXoá: /progress delete C...`;
}

function formatProgress(plan: WeeklyPlan, applications: number, runs: number): string {
  const applicationTarget = targetFrom(plan.commitment);
  const runHabit = [plan.habit1, plan.habit2].find(value => /chạy|run/iu.test(value));
  const runTarget = runHabit ? targetFrom(runHabit) : undefined;
  const ratio = (count: number, target?: number) => target ? `${count}/${target}` : `${count} lần đã ghi`;
  return `Tiến độ tuần bắt đầu ${plan.week_start}:\n• Mục tiêu: ${plan.goal}\n• Cam kết: ${plan.commitment}\n• Apply: ${ratio(applications, applicationTarget)}\n• Chạy bộ: ${ratio(runs, runTarget)}\n\nCác kết quả được ghi theo xác nhận của anh.`;
}

function formatProgressEvents(events: ProgressEvent[]): string {
  if (!events.length) return 'Chưa có lượt nào được ghi trong tuần này.';
  const entry = (event: ProgressEvent) => event.kind === 'job_application'
    ? `P${event.id} · Apply — ${event.label.slice(0, 120)}`
    : `P${event.id} · Chạy bộ — ${event.label.slice(8,10)}/${event.label.slice(5,7)}`;
  return `Các lượt đã ghi:\n${events.slice(0,20).map(event => `• ${entry(event)}`).join('\n')}`
    + (events.length > 20 ? '\nĐang hiển thị 20 lượt gần nhất.' : '')
    + '\n\nSửa apply: /progress edit P... Tên mới\nXoá lượt: /progress delete P...';
}

function confirmationButtons(target: string): ReplyMarkup {
  return { inline_keyboard: [[
    { text: 'Đúng', callback_data: `_navi:confirm:${target}` },
    { text: 'Hủy', callback_data: `_navi:reject:${target}` },
  ]] };
}

const progressButton: ReplyMarkup = { inline_keyboard: [[{ text: 'Xem tiến độ', callback_data: '_navi:show:progress' }]] };

function taskReminderButtons(taskId: string): ReplyMarkup {
  return { inline_keyboard: [[
    { text: 'Đã làm', callback_data: `_navi:task:done:${taskId}` },
    { text: 'Dời 1 ngày', callback_data: `_navi:task:defer:${taskId}` },
  ], [{ text: 'Bỏ nhắc', callback_data: `_navi:task:clear:${taskId}` }]] };
}

function checkInSelectionButtons(sourceUpdate: number, items: PlanItem[]): ReplyMarkup {
  return { inline_keyboard: items.slice(0,3).map(item => [{ text: item.title.slice(0,60), callback_data: `_navi:checkin:select:${sourceUpdate}:${item.id}` }]) };
}

function readReplyMarkup(value: string|null): ReplyMarkup | undefined {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || !('inline_keyboard' in parsed) || !Array.isArray(parsed.inline_keyboard)) return undefined;
    return parsed as ReplyMarkup;
  } catch { return undefined; }
}
export async function ownerFor(db: D1Database) {
  return db.prepare('SELECT user_id,chat_id FROM owner WHERE id=1').first<{ user_id: string; chat_id: string }>();
}
export async function accept(db: D1Database, update: TelegramUpdate, bootstrap: boolean, now = Date.now()): Promise<boolean> {
  const m = update.message;
  if (!m || m.from.is_bot || m.chat.type !== 'private' || !m.text) return false;
  const userId = String(m.from.id), chatId = String(m.chat.id);
  const statements: D1PreparedStatement[] = [];
  if (bootstrap) statements.push(db.prepare('INSERT OR IGNORE INTO owner(id,user_id,chat_id,linked_at) VALUES(1,?,?,?)').bind(userId, chatId, now));
  statements.push(db.prepare(`INSERT OR IGNORE INTO jobs(update_id,user_id,chat_id,text,created_at)
    SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM owner WHERE id=1 AND user_id=? AND chat_id=?)`)
    .bind(update.update_id, userId, chatId, bootstrap || /^\/start\s+[a-f0-9]{64}$/.test(m.text) ? '/start' : m.text, now, userId, chatId));
  statements.push(db.prepare('INSERT OR IGNORE INTO job_metrics(job_id,queued_at) SELECT id,created_at FROM jobs WHERE update_id=?').bind(update.update_id));
  statements.push(db.prepare(`INSERT OR IGNORE INTO conversation_messages(chat_id,direction,text,update_id,created_at)
    SELECT ?, 'inbound', ?, ?, ? WHERE EXISTS(SELECT 1 FROM owner WHERE id=1 AND user_id=? AND chat_id=?)`)
    .bind(chatId, bootstrap || /^\/start\s+[a-f0-9]{64}$/.test(m.text) ? '/start' : m.text, update.update_id, now, userId, chatId));
  const results = await db.batch(statements);
  return (results.at(-1)?.meta.changes ?? 0) > 0;
}

export async function tasks(db: D1Database, includeDone = false): Promise<Task[]> {
  const result = await db.prepare(`SELECT id,title,status,revision FROM tasks ${includeDone ? '' : "WHERE status='open'"} ORDER BY created_at,id LIMIT 21`).all<Task>();
  return result.results;
}

async function todaySummary(db: D1Database, chatId: string, now: number): Promise<string> {
  const date = localDate(now), start = Date.parse(`${date}T00:00:00+07:00`), end = start + 24 * 60 * 60 * 1000;
  const plan = await db.prepare("SELECT week_start,chat_id,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'")
    .bind(weekStart(now), chatId).first<WeeklyPlan>();
  const due = (await db.prepare("SELECT id,title,status,revision,due_at FROM tasks WHERE status='open' AND due_at>=? AND due_at<? ORDER BY due_at,id LIMIT 6")
    .bind(start,end).all<Task>()).results;
  const unscheduled = due.length < 6 ? (await db.prepare("SELECT id,title,status,revision,due_at FROM tasks WHERE status='open' AND due_at IS NULL ORDER BY created_at,id LIMIT ?")
    .bind(6-due.length).all<Task>()).results : [];
  const carryovers = (await db.prepare(`SELECT task_id FROM weekly_task_carryovers WHERE week_start=?`).bind(weekStart(now)).all<{task_id:string}>()).results;
  const carried = new Set(carryovers.map(item=>item.task_id));
  const taskLines = [...due,...unscheduled].map(task => `• ${task.id}: ${task.title}${carried.has(task.id) ? ' — giữ từ tuần trước' : task.due_at ? ` — ${formatLocalTime(task.due_at)}` : ''}`);
  if (!plan) return `Hôm nay ${date.slice(8,10)}/${date.slice(5,7)}\n\n${taskLines.length ? `Việc cần làm:\n${taskLines.join('\n')}` : 'Chưa có task đang mở.'}\n\nAnh nhắn /week để lập kế hoạch tuần.`;
  const items = await ensurePlanItems(db, plan, now), counts = progressCounts(items);
  return `Hôm nay ${date.slice(8,10)}/${date.slice(5,7)}\n\n${formatProgress(plan, counts.applications, counts.runs)}${formatPlanItems(items,true)}\n\n${taskLines.length ? `Việc cần làm:\n${taskLines.join('\n')}` : 'Chưa có task đang mở.'}`;
}

async function systemStatusSummary(db: D1Database, chatId: string, now: number): Promise<string> {
  const currentWeek = weekStart(now);
  const [plan, preference, openTasks, latest] = await Promise.all([
    db.prepare("SELECT goal FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'").bind(currentWeek,chatId).first<{goal:string}>(),
    db.prepare('SELECT weekly_progress_enabled,delivery_hour FROM reminder_preferences WHERE chat_id=?').bind(chatId).first<ReminderPreference>(),
    db.prepare("SELECT COUNT(*) AS count FROM tasks WHERE status='open'").first<{count:number}>(),
    db.prepare(`SELECT c.note,c.occurred_at FROM weekly_checkins c JOIN weekly_plans p ON p.week_start=c.week_start
      WHERE p.chat_id=? AND p.status='active' ORDER BY c.occurred_at DESC,c.id DESC LIMIT 1`).bind(chatId).first<{note:string;occurred_at:number}>(),
  ]);
  const reminders = (preference?.weekly_progress_enabled ?? 1) === 1
    ? `bật lúc ${String(preference?.delivery_hour ?? 20).padStart(2,'0')}:00` : 'đang tắt';
  return `Trạng thái Navi\n• Tin /status này vừa được Worker xử lý.\n• Kế hoạch tuần: ${plan ? `đang theo dõi “${plan.goal}”` : 'chưa có'}\n• Task mở: ${openTasks?.count ?? 0}\n• Nhắc tiến độ: ${reminders}\n• Check-in gần nhất: ${latest ? `“${latest.note}” (${formatLocalTime(latest.occurred_at)})` : 'chưa có'}`;
}

async function insightsSummary(db: D1Database, chatId: string, now: number): Promise<string> {
  const start = Date.parse(`${weekStart(now)}T00:00:00+07:00`), end = start + 7*24*60*60*1000;
  const [outcomes, pending] = await Promise.all([
    db.prepare(`SELECT outcome,COUNT(*) AS count FROM checkin_outcomes WHERE chat_id=? AND created_at>=? AND created_at<? GROUP BY outcome`)
      .bind(chatId,start,end).all<{outcome:'recorded'|'selected'|'ambiguous'|'unmatched';count:number}>(),
    db.prepare(`SELECT COUNT(*) AS count FROM checkin_selection_requests WHERE chat_id=? AND status='pending' AND expires_at>?`)
      .bind(chatId,now).first<{count:number}>(),
  ]);
  const counts = new Map(outcomes.results.map(row=>[row.outcome,row.count]));
  return `Tín hiệu check-in tuần này\n• Ghi thẳng: ${counts.get('recorded') ?? 0}\n• Ghi sau khi anh chọn: ${counts.get('selected') ?? 0}\n• Chưa nối được mục: ${counts.get('unmatched') ?? 0}\n• Đang chờ chọn: ${pending?.count ?? 0}\n\nEm dùng các số này để biết câu nào cần bổ sung vào corpus, không lưu thêm nội dung tin nhắn.`;
}

async function exportSummary(db: D1Database, chatId: string, now: number, format: 'markdown'|'json'): Promise<string> {
  const currentWeek = weekStart(now);
  const plan = await db.prepare("SELECT week_start,chat_id,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'")
    .bind(currentWeek,chatId).first<WeeklyPlan>();
  const [items, taskRows, checkins] = await Promise.all([
    plan ? ensurePlanItems(db,plan,now) : Promise.resolve([] as PlanItem[]),
    db.prepare('SELECT id,title,status,due_at,completed_at FROM tasks ORDER BY created_at DESC,id DESC LIMIT 6').all<{id:string;title:string;status:string;due_at:number|null;completed_at:number|null}>(),
    db.prepare(`SELECT c.id,c.note,c.quantity,c.occurred_at,i.title AS item_title FROM weekly_checkins c
      JOIN weekly_plan_items i ON i.id=c.plan_item_id JOIN weekly_plans p ON p.week_start=c.week_start
      WHERE p.chat_id=? AND c.week_start=? ORDER BY c.occurred_at DESC,c.id DESC LIMIT 6`).bind(chatId,currentWeek).all<{id:number;note:string;quantity:number;occurred_at:number;item_title:string}>(),
  ]);
  if (format === 'json') {
    const payload = {
      exportedAt: new Date(now).toISOString(), weekStart: currentWeek,
      plan: plan && { goal:plan.goal, commitment:plan.commitment, habits:[plan.habit1,plan.habit2].filter(Boolean), items:items.map(item=>({title:item.title,metric:item.metric,target:item.target_count,completed:item.completed,status:item.status})) },
      tasks: taskRows.results.map(task=>({id:task.id,title:task.title.slice(0,120),status:task.status,dueAt:task.due_at,completedAt:task.completed_at})),
      checkins: checkins.results.map(checkin=>({id:checkin.id,item:checkin.item_title.slice(0,120),quantity:checkin.quantity,note:checkin.note.slice(0,120),occurredAt:checkin.occurred_at})),
      limits: { tasks:6, checkins:6 },
    };
    return `Navi export (JSON, tối đa 6 task và 6 check-in)\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``;
  }
  const taskLines = taskRows.results.length ? taskRows.results.map(task=>`• ${task.status === 'done' ? '✓' : '○'} ${task.id}: ${task.title}${task.due_at ? ` — nhắc ${formatLocalTime(task.due_at)}` : ''}`).join('\n') : '• Chưa có task.';
  const itemLines = items.length ? items.map(item=>`• ${item.title} — ${item.metric === 'count' ? `${item.completed}/${item.target_count}` : item.status === 'completed' ? 'đã hoàn thành' : 'chưa hoàn thành'}`).join('\n') : '• Chưa có kế hoạch tuần.';
  const checkinLines = checkins.results.length ? checkins.results.map(checkin=>`• C${checkin.id} · ${checkin.item_title}: ${checkin.note} (${formatLocalTime(checkin.occurred_at)})`).join('\n') : '• Chưa có check-in.';
  return `Navi export — tuần ${currentWeek}\n\nKế hoạch\n${itemLines}\n\nTask gần nhất (tối đa 6)\n${taskLines}\n\nCheck-in tuần này (tối đa 6)\n${checkinLines}\n\nDùng /export json nếu anh cần bản máy đọc được.`;
}

const AI_RESERVATION_MICROS = 20_000;
const AI_MONTHLY_CAP_MICROS = 800_000;
export async function reserveAi(db: D1Database, now = Date.now()): Promise<boolean> {
  const month = new Date(now).toISOString().slice(0, 7);
  await db.prepare('INSERT OR IGNORE INTO ai_budget(month) VALUES(?)').bind(month).run();
  const result = await db.prepare('UPDATE ai_budget SET reserved_micros=reserved_micros+?,calls=calls+1 WHERE month=? AND reserved_micros+?<=?')
    .bind(AI_RESERVATION_MICROS, month, AI_RESERVATION_MICROS, AI_MONTHLY_CAP_MICROS).run();
  return result.meta.changes === 1;
}

// All mutations in the personal conversation share this lease. Every write is fenced.
export async function processNext(db: D1Database, now = Date.now(), assistant?: Assistant): Promise<boolean> {
  const token = crypto.randomUUID();
  const claimed = await db.prepare('UPDATE owner SET lease_token=?,lease_until=? WHERE id=1 AND lease_until<=?').bind(token, now + 30000, now).run();
  if (!claimed.meta.changes) return false;
  try {
    const job = await db.prepare("SELECT id,update_id,chat_id,text,attempts FROM jobs WHERE status='pending' ORDER BY id LIMIT 1").first<Job>();
    if (!job) return false;
    await db.prepare('UPDATE job_metrics SET processing_started_at=COALESCE(processing_started_at,?) WHERE job_id=?').bind(now, job.id).run();
    const guard = `EXISTS(SELECT 1 FROM owner WHERE id=1 AND lease_token=? AND lease_until>?) AND EXISTS(SELECT 1 FROM jobs WHERE id=? AND status='pending')`;
    const args = () => [token, Date.now(), job.id];
    const statements: D1PreparedStatement[] = [];
    const command = parseCommand(job.text);
    const recent = (await db.prepare("SELECT direction,text FROM conversation_messages WHERE chat_id=? ORDER BY created_at DESC,id DESC LIMIT 12").bind(job.chat_id).all<{direction:'inbound'|'outbound';text:string}>()).results.reverse()
      .map(m => `${m.direction === 'inbound' ? 'Anh' : 'Navi'}: ${m.text.slice(0, 500)}`).join('\n');
    let result: string;
    let replyMarkup: ReplyMarkup | undefined;
    const draft = await db.prepare("SELECT id,chat_id,step,goal,commitment,habit1,habit2,week_start FROM weekly_drafts WHERE id=1 AND chat_id=?").bind(job.chat_id).first<WeeklyDraft>();
    if (job.attempts >= 3) {
      result = 'Em chưa xử lý được yêu cầu này sau ba lần thử. Anh gửi lại yêu cầu giúp em; em chưa đánh dấu việc đã xong.';
    } else if (draft && command.kind !== 'week' && command.kind !== 'weekStatus' && command.kind !== 'progressList' && command.kind !== 'progressChange' && command.kind !== 'checkInChange' && command.kind !== 'checkInSelect' && command.kind !== 'today' && command.kind !== 'schedule' && command.kind !== 'defer' && command.kind !== 'clearSchedule' && command.kind !== 'review' && command.kind !== 'reminders' && command.kind !== 'help') {
      const value = job.text.trim().replace(/\s+/g, ' ');
      if (draft.step === 'confirm') {
        if (command.kind === 'confirm' && (!command.target || command.target === `weekly:${draft.week_start}`)) {
          statements.push(db.prepare(`INSERT INTO weekly_plans(week_start,chat_id,goal,commitment,habit1,habit2,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`)
            .bind(draft.week_start, draft.chat_id, draft.goal, draft.commitment, draft.habit1, draft.habit2, now, ...args()));
          statements.push(db.prepare(`UPDATE weekly_plans SET status='archived' WHERE chat_id=? AND week_start<>? AND status='active' AND ${guard}`)
            .bind(draft.chat_id,draft.week_start,...args()));
          for (const item of planItemValues({ goal:draft.goal!, commitment:draft.commitment!, habit1:draft.habit1!, habit2:draft.habit2! })) {
            statements.push(db.prepare(`INSERT INTO weekly_plan_items(week_start,kind,position,title,normalized_title,metric,target_count,created_at)
              SELECT ?,?,?,?,?,?,?,? WHERE ${guard}`).bind(draft.week_start,item.kind,item.position,item.title,normalize(item.title),item.metric,item.target ?? null,now,...args()));
          }
          statements.push(db.prepare(`DELETE FROM weekly_drafts WHERE id=1 AND ${guard}`).bind(...args()));
          result = `Đã lưu kế hoạch tuần bắt đầu ${draft.week_start}:\n• Mục tiêu: ${draft.goal}\n• Cam kết: ${draft.commitment}\n• Thói quen 1: ${draft.habit1}\n• Thói quen 2: ${draft.habit2}`;
        } else if (command.kind === 'reject' && (!command.target || command.target === `weekly:${draft.week_start}`)) {
          statements.push(db.prepare(`DELETE FROM weekly_drafts WHERE id=1 AND ${guard}`).bind(...args()));
          result = 'Đã bỏ bản nháp kế hoạch tuần. Khi sẵn sàng anh nhắn /week để làm lại.';
        } else result = 'Anh dùng nút bên trên hoặc trả lời “đúng” để lưu kế hoạch, “hủy” để làm lại.';
      } else if (value.length < 2 || value.length > 180) result = 'Anh gửi một câu ngắn từ 2 đến 180 ký tự nhé.';
      else if (draft.step === 'goal') {
        statements.push(db.prepare(`UPDATE weekly_drafts SET goal=?,step='commitment' WHERE id=1 AND ${guard}`).bind(value, ...args()));
        result = 'Mục tiêu đã ghi. Cam kết cá nhân tuần này của anh là gì?';
      } else if (draft.step === 'commitment') {
        statements.push(db.prepare(`UPDATE weekly_drafts SET commitment=?,step='habit1' WHERE id=1 AND ${guard}`).bind(value, ...args()));
        result = 'Đã ghi cam kết. Thói quen thứ nhất anh muốn theo dõi là gì?';
      } else if (draft.step === 'habit1') {
        statements.push(db.prepare(`UPDATE weekly_drafts SET habit1=?,step='habit2' WHERE id=1 AND ${guard}`).bind(value, ...args()));
        result = 'Đã ghi thói quen thứ nhất. Thói quen thứ hai là gì? Nếu chỉ theo dõi một thói quen, anh nhắn “bỏ qua”.';
      } else {
        const habit2 = /^(?:bỏ qua|bo qua|skip|không có)$/iu.test(value) ? '' : value;
        statements.push(db.prepare(`UPDATE weekly_drafts SET habit2=?,step='confirm' WHERE id=1 AND ${guard}`).bind(habit2, ...args()));
        result = `Em tóm tắt kế hoạch tuần bắt đầu ${draft.week_start}:\n• Mục tiêu: ${draft.goal}\n• Cam kết: ${draft.commitment}\n• Thói quen 1: ${draft.habit1}${habit2 ? `\n• Thói quen 2: ${habit2}` : ''}\n\nAnh bấm nút để lưu hoặc bỏ.`;
        replyMarkup = confirmationButtons(`weekly:${draft.week_start}`);
      }
    } else if (command.kind === 'week') {
      const date = weekStart(now);
      const existing = await db.prepare("SELECT week_start FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'").bind(date,job.chat_id).first<{week_start:string}>();
      if (existing) result = `Tuần bắt đầu ${date} đã có kế hoạch. Anh dùng /week status để xem tiến độ hoặc /review để tổng kết.`;
      else {
        const carryovers = (await db.prepare(`SELECT t.id,t.title FROM weekly_task_carryovers c JOIN tasks t ON t.id=c.task_id
          WHERE c.week_start=? AND t.status='open' ORDER BY t.created_at,t.id`).bind(date).all<{id:string;title:string}>()).results;
        statements.push(db.prepare(`INSERT OR IGNORE INTO weekly_drafts(id,chat_id,step,week_start,created_at) SELECT 1,?,'goal',?,? WHERE ${guard}`).bind(job.chat_id, date, now, ...args()));
        result = `Mình lập kế hoạch tuần bắt đầu ${date} nhé.${carryovers.length ? `\n\nTask giữ từ tuần trước:\n${carryovers.map(task=>`• ${task.id}: ${task.title}`).join('\n')}` : ''}\n\nMục tiêu công việc quan trọng nhất của anh là gì?`;
      }
    } else if (command.kind === 'today') {
      result = await todaySummary(db, job.chat_id, now);
    } else if (command.kind === 'schedule') {
      const dueAt = scheduledTime(command, now);
      const task = await db.prepare("SELECT id,title,status,revision,due_at FROM tasks WHERE id=? AND status='open'").bind(command.reference).first<Task>();
      if (!task) result = 'Em không thấy task đang mở này. Anh dùng /list để xem mã task nhé.';
      else if (!dueAt || dueAt <= now) result = 'Thời điểm nhắc cần ở tương lai. Ví dụ: /schedule T12 10/9 09:00';
      else {
        statements.push(db.prepare(`UPDATE tasks SET due_at=? WHERE id=? AND status='open' AND ${guard}`).bind(dueAt, task.id, ...args()));
        result = `Đã đặt nhắc ${task.id}: ${task.title}\n${formatLocalTime(dueAt)} (giờ Việt Nam).`;
      }
    } else if (command.kind === 'defer' || command.kind === 'clearSchedule') {
      const task = await db.prepare("SELECT id,title,status,revision,due_at FROM tasks WHERE id=? AND status='open'").bind(command.reference).first<Task>();
      if (!task) result = 'Task này không còn mở.';
      else if (command.kind === 'clearSchedule') {
        statements.push(db.prepare(`UPDATE tasks SET due_at=NULL WHERE id=? AND status='open' AND ${guard}`).bind(task.id, ...args()));
        result = `Đã bỏ nhắc cho ${task.id}. Task vẫn còn trong danh sách mở.`;
      } else {
        const next = (task.due_at && task.due_at > now ? task.due_at : now) + 24 * 60 * 60 * 1000;
        statements.push(db.prepare(`UPDATE tasks SET due_at=? WHERE id=? AND status='open' AND ${guard}`).bind(next, task.id, ...args()));
        result = `Đã dời ${task.id} sang ${formatLocalTime(next)}.`;
      }
    } else if (command.kind === 'review') {
      const currentWeek = weekStart(now);
      if (command.carry) {
        const task = await db.prepare("SELECT id,title,status,revision,due_at FROM tasks WHERE id=? AND status='open'").bind(command.carry).first<Task>();
        if (!task) result = 'Task này không còn mở nên không cần chuyển tuần.';
        else {
          const next = weekEnd(currentWeek);
          const nextMonday = new Date(`${next}T00:00:00Z`); nextMonday.setUTCDate(nextMonday.getUTCDate()+1);
          const nextWeek = nextMonday.toISOString().slice(0,10);
          statements.push(db.prepare(`INSERT OR IGNORE INTO weekly_task_carryovers(week_start,task_id,decided_at) SELECT ?,?,? WHERE ${guard}`).bind(nextWeek, task.id, now, ...args()));
          result = `Đã đánh dấu ${task.id} cho tuần bắt đầu ${nextWeek}. Task vẫn giữ nguyên, không bị nhân đôi.`;
        }
      } else {
        const plan = await db.prepare("SELECT week_start,chat_id,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'").bind(currentWeek, job.chat_id).first<WeeklyPlan>();
        const open = await tasks(db);
        const items = plan ? await ensurePlanItems(db,plan,now) : [];
        const counts = progressCounts(items);
        result = `${plan ? `${formatProgress(plan, counts.applications, counts.runs)}${formatPlanItems(items,true)}\n\n` : ''}Review tuần:\n${open.length ? `Task đang mở:\n${open.slice(0,10).map(task=>`• ${task.id}: ${task.title}`).join('\n')}\n\nChuyển một task: /review carry T...` : 'Không còn task mở.'}`;
      }
    } else if (command.kind === 'reminders') {
      const preference = await db.prepare('SELECT weekly_progress_enabled,delivery_hour FROM reminder_preferences WHERE chat_id=?').bind(job.chat_id).first<ReminderPreference>();
      if (command.enabled === undefined) {
        const enabled = preference?.weekly_progress_enabled ?? 1, hour = preference?.delivery_hour ?? 20;
        result = enabled ? `Nhắc tiến độ tuần đang bật lúc ${String(hour).padStart(2,'0')}:00 mỗi tối (giờ Việt Nam). Dùng /reminders off để tắt.`
          : 'Nhắc tiến độ tuần đang tắt. Dùng /reminders on để bật lại lúc 20:00 mỗi tối.';
      } else {
        statements.push(db.prepare(`INSERT INTO reminder_preferences(chat_id,weekly_progress_enabled,delivery_hour,updated_at) VALUES(?,?,20,?)
          ON CONFLICT(chat_id) DO UPDATE SET weekly_progress_enabled=excluded.weekly_progress_enabled,updated_at=excluded.updated_at WHERE ${guard}`)
          .bind(job.chat_id, command.enabled ? 1 : 0, now, ...args()));
        result = command.enabled ? 'Đã bật nhắc tiến độ tuần lúc 20:00 mỗi tối (giờ Việt Nam).' : 'Đã tắt nhắc tiến độ tuần. Khi cần bật lại, anh nhắn /reminders on.';
      }
    } else if (command.kind === 'checkIn') {
      const currentWeek = weekStart(now);
      const plan = await db.prepare("SELECT week_start,chat_id,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'")
        .bind(currentWeek, job.chat_id).first<WeeklyPlan>();
      if (!plan) result = 'Tuần này chưa có kế hoạch đã xác nhận. Anh nhắn /week để tạo trước nhé.';
      else if (command.date && !datedRunLabel(command.date, now)) result = 'Ngày check-in không hợp lệ. Anh ghi theo dạng: “Ngày 7/9 anh đã chạy bộ”.';
      else if (command.date && (() => { const date = datedRunLabel(command.date, now)!; return date < currentWeek || date > weekEnd(currentWeek); })()) result = `Ngày check-in không nằm trong tuần đang theo dõi (${currentWeek} đến ${weekEnd(currentWeek)}).`;
      else {
        const items = await ensurePlanItems(db, plan, now);
        const candidates = checkInCandidates(items, command.text);
        if (!candidates.length) {
          statements.push(db.prepare(`INSERT OR IGNORE INTO checkin_outcomes(chat_id,source_update,outcome,created_at)
            SELECT ?,?,'unmatched',? WHERE ${guard}`).bind(job.chat_id,job.update_id,now,...args()));
          result = `Em chưa nối được cập nhật này với một mục trong kế hoạch tuần. Anh nói rõ tên mục tiêu hoặc task giúp em nhé.\n\n${formatPlanItems(items)}`;
        }
        else if (candidates.length > 1) {
          const choices = candidates.slice(0,3);
          statements.push(db.prepare(`INSERT OR IGNORE INTO checkin_selection_requests(chat_id,week_start,source_update,text,candidate_item_ids,created_at,expires_at)
            SELECT ?,?,?,?,?,?,? WHERE ${guard}`).bind(job.chat_id,currentWeek,job.update_id,command.text,JSON.stringify(choices.map(item=>item.id)),now,now+24*60*60*1000,...args()));
          statements.push(db.prepare(`INSERT OR IGNORE INTO checkin_outcomes(chat_id,source_update,outcome,created_at)
            SELECT ?,?,'ambiguous',? WHERE ${guard}`).bind(job.chat_id,job.update_id,now,...args()));
          result = `Em thấy cập nhật này có thể thuộc vài mục. Anh chọn đúng mục để em ghi nhé:\n${choices.map(item=>`• ${item.title}`).join('\n')}`;
          replyMarkup = checkInSelectionButtons(job.update_id,choices);
        }
        else {
          const item = candidates[0]!;
          const occurredAt = command.date ? Date.parse(`${datedRunLabel(command.date,now)!}T12:00:00+07:00`) : now;
          const staged = await stageCheckIn(db,statements,guard,args,{item,text:command.text,weekStart:currentWeek,sourceUpdate:job.update_id,occurredAt,chatId:job.chat_id,outcome:'recorded'});
          if (staged.already) result = `Cập nhật này đã được ghi trước đó cho “${item.title}”.`;
          else {
            result = `Đã ghi nhận cho “${item.title}”: ${staged.progress}.`;
            replyMarkup = progressButton;
          }
        }
      }
    } else if (command.kind === 'checkInSelect') {
      const selection = await db.prepare(`SELECT id,week_start,source_update,text,candidate_item_ids,status,expires_at FROM checkin_selection_requests
        WHERE chat_id=? AND source_update=? AND status='pending'`).bind(job.chat_id,command.sourceUpdate).first<CheckInSelection>();
      let candidateIds: number[] = [];
      try { const value: unknown = selection ? JSON.parse(selection.candidate_item_ids) : []; candidateIds = Array.isArray(value) && value.every(Number.isInteger) ? value : []; } catch { candidateIds = []; }
      const currentPlan = selection ? await db.prepare("SELECT week_start FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'").bind(selection.week_start,job.chat_id).first<{week_start:string}>() : undefined;
      const expired = Boolean(selection && ((selection.expires_at ?? 0) <= now || !currentPlan));
      const item = selection && !expired && candidateIds.includes(command.itemId) ? await db.prepare(`SELECT i.id,i.kind,i.position,i.title,i.normalized_title,i.metric,i.target_count,i.status,
        COALESCE(SUM(c.quantity),0) AS completed FROM weekly_plan_items i LEFT JOIN weekly_checkins c ON c.plan_item_id=i.id
        WHERE i.id=? AND i.week_start=? GROUP BY i.id`).bind(command.itemId,selection.week_start).first<PlanItem>() : undefined;
      if (!selection || !item) {
        if (selection && expired) statements.push(db.prepare(`UPDATE checkin_selection_requests SET status='rejected',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now,selection.id,...args()));
        result = 'Lựa chọn này không còn hiệu lực. Anh gửi lại cập nhật để Navi hỏi lại nhé.';
      }
      else {
        const staged = await stageCheckIn(db,statements,guard,args,{item,text:selection.text,weekStart:selection.week_start,sourceUpdate:selection.source_update,occurredAt:now,chatId:job.chat_id,outcome:'selected'});
        if (staged.already) result = `Cập nhật này đã được ghi cho “${item.title}”.`;
        else {
          statements.push(db.prepare(`UPDATE checkin_selection_requests SET status='selected',selected_item_id=?,decided_at=? WHERE id=? AND status='pending' AND ${guard}`)
            .bind(item.id,now,selection.id,...args()));
          result = `Đã ghi nhận cho “${item.title}”: ${staged.progress}.`;
          replyMarkup = progressButton;
        }
      }
    } else if (command.kind === 'checkInChange') {
      const currentWeek = weekStart(now);
      const checkin = await db.prepare(`SELECT c.id,c.note FROM weekly_checkins c JOIN weekly_plans p ON p.week_start=c.week_start
        WHERE c.id=? AND p.chat_id=? AND p.status='active'`).bind(Number(command.reference.slice(1)),job.chat_id).first<{id:number;note:string}>();
      const pending = await db.prepare("SELECT id FROM checkin_change_requests WHERE chat_id=? AND status='pending'").bind(job.chat_id).first<{id:number}>();
      if (pending) result = 'Em đang chờ anh xác nhận một thay đổi check-in trước đó. Anh trả lời “đúng” hoặc “hủy” trước nhé.';
      else if (!checkin) result = `Em không thấy ${command.reference} trong tiến độ tuần này. Anh nhắn /progress để xem mã.`;
      else {
        statements.push(db.prepare(`INSERT INTO checkin_change_requests(chat_id,checkin_id,action,new_note,created_at)
          SELECT ?,?,?,?,? WHERE ${guard}`).bind(job.chat_id,checkin.id,command.action,command.detail ?? null,now,...args()));
        result = command.action === 'delete' ? `Anh muốn xoá ${command.reference}: “${checkin.note}”. Anh bấm nút để xác nhận hoặc giữ lại.`
          : `Anh muốn đổi ${command.reference} thành “${command.detail}”. Anh bấm nút để xác nhận hoặc giữ nguyên.`;
        replyMarkup = confirmationButtons(`checkin:${checkin.id}`);
      }
    } else if (command.kind === 'weekStatus' || command.kind === 'progressList' || command.kind === 'progress' || command.kind === 'progressChange') {
      const currentWeek = weekStart(now);
      const plan = await db.prepare("SELECT week_start,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'")
        .bind(currentWeek, job.chat_id).first<WeeklyPlan>();
      if (!plan) result = 'Tuần này chưa có kế hoạch đã xác nhận. Anh nhắn /week để tạo nhé.';
      else {
        const items = await ensurePlanItems(db, plan, now);
        let { applications, runs } = progressCounts(items);
        if (command.kind === 'progress') {
          const label = command.activity === 'job_application' ? command.detail
            : command.date ? datedRunLabel(command.date, now) : localDate(now);
          if (!label) result = 'Ngày chạy bộ không hợp lệ. Anh ghi theo dạng: “Ngày 7/9 anh đã chạy bộ”.';
          else if (command.activity === 'run' && (label < currentWeek || label > weekEnd(currentWeek))) {
            result = `Ngày ${label} không nằm trong tuần đang theo dõi (${currentWeek} đến ${weekEnd(currentWeek)}).`;
          } else {
            const normalized = normalize(label);
            const existing = await db.prepare('SELECT id FROM weekly_progress_events WHERE week_start=? AND kind=? AND normalized_label=?')
              .bind(currentWeek, command.activity, normalized).first<{id:number}>();
            if (existing) result = command.activity === 'job_application'
              ? `Vị trí “${label}” đã được ghi trong tuần này nên em không cộng lại.\n\n${formatProgress(plan, applications, runs)}`
              : `Buổi chạy ngày ${label} đã được ghi rồi nên em không cộng lại.\n\n${formatProgress(plan, applications, runs)}`;
            else {
              statements.push(db.prepare(`INSERT INTO weekly_progress_events(week_start,kind,label,normalized_label,source_update,occurred_at)
                SELECT ?,?,?,?,?,? WHERE ${guard}`).bind(currentWeek, command.activity, label, normalized, job.update_id, now, ...args()));
              if (command.activity === 'job_application') applications += 1; else runs += 1;
              result = `${command.activity === 'job_application' ? `Đã ghi nhận anh apply: ${label}.` : `Đã ghi nhận buổi chạy ngày ${label}.`}\n\n${formatProgress(plan, applications, runs)}`;
              replyMarkup = progressButton;
            }
          }
        } else if (command.kind === 'progressList') {
          const checkins = (await db.prepare(`SELECT id,note FROM weekly_checkins WHERE week_start=? ORDER BY id DESC LIMIT 21`).bind(currentWeek).all<{id:number;note:string}>()).results;
          result = `${formatProgress(plan, applications, runs)}${formatPlanItems(items,true)}\n\n${formatCheckIns(checkins)}`;
        } else if (command.kind === 'progressChange') {
          const pendingChange = await db.prepare("SELECT id,event_id,action,new_label FROM progress_change_requests WHERE chat_id=? AND status='pending' LIMIT 1")
            .bind(job.chat_id).first<ProgressChange>();
          if (pendingChange) result = 'Em đang chờ anh xác nhận một thay đổi tiến độ trước đó. Anh trả lời “đúng” hoặc “hủy” trước nhé.';
          else {
            const eventId = Number(command.reference.slice(1));
            const event = await db.prepare(`SELECT e.id,e.kind,e.label,e.normalized_label FROM weekly_progress_events e
              JOIN weekly_plans p ON p.week_start=e.week_start WHERE e.id=? AND e.week_start=? AND p.chat_id=? AND p.status='active'`)
              .bind(eventId, currentWeek, job.chat_id).first<ProgressEvent>();
            if (!event) result = `Em không thấy ${command.reference} trong tiến độ tuần này. Anh nhắn /progress để xem mã.`;
            else if (command.action === 'rename' && event.kind !== 'job_application') result = `Chỉ có thể sửa tên lượt apply. ${command.reference} là một buổi chạy; nếu ghi nhầm anh có thể xoá bằng /progress delete ${command.reference}.`;
            else if (command.action === 'rename') {
              const duplicate = await db.prepare('SELECT id FROM weekly_progress_events WHERE week_start=? AND kind=? AND normalized_label=? AND id<>?')
                .bind(currentWeek, event.kind, normalize(command.detail!), event.id).first<{id:number}>();
              if (duplicate) result = `Tên “${command.detail}” đã có trong tuần này nên em không thể đổi thành bản trùng.`;
              else {
                statements.push(db.prepare(`INSERT INTO progress_change_requests(chat_id,event_id,action,new_label,created_at)
                  SELECT ?,?,?,?,? WHERE ${guard}`).bind(job.chat_id, event.id, 'rename', command.detail!, now, ...args()));
                result = `Anh muốn đổi ${command.reference} từ “${event.label}” thành “${command.detail}”. Anh bấm nút để xác nhận hoặc giữ nguyên.`;
                replyMarkup = confirmationButtons(`progress:${event.id}`);
              }
            } else {
              statements.push(db.prepare(`INSERT INTO progress_change_requests(chat_id,event_id,action,created_at)
                SELECT ?,?,?,? WHERE ${guard}`).bind(job.chat_id, event.id, 'delete', now, ...args()));
              result = `Anh muốn xoá ${command.reference}: “${event.label}”. Anh bấm nút để xác nhận hoặc giữ lại.`;
              replyMarkup = confirmationButtons(`progress:${event.id}`);
            }
          }
        } else result = `${formatProgress(plan, applications, runs)}${formatPlanItems(items,true)}`;
      }
    } else if (command.kind === 'add') {
      const id = `T${job.update_id}`;
      statements.push(db.prepare(`INSERT INTO tasks(id,title,normalized_title,source_update,created_at) SELECT ?,?,?,?,? WHERE ${guard}`)
        .bind(id, command.title, normalize(command.title), job.update_id, now, ...args()));
      result = `Đã thêm ${id}: ${command.title}\nKhi xong, anh nhắn /done ${id}.`;
    } else if (command.kind === 'export') {
      result = await exportSummary(db,job.chat_id,now,command.format);
    } else if (command.kind === 'systemStatus') {
      result = await systemStatusSummary(db,job.chat_id,now);
    } else if (command.kind === 'insights') {
      result = await insightsSummary(db,job.chat_id,now);
    } else if (command.kind === 'status') {
      const pendingApproval = await db.prepare("SELECT title FROM approval_requests WHERE chat_id=? AND status='pending' ORDER BY created_at DESC LIMIT 1").bind(job.chat_id).first<{title:string}>();
      const pendingTask = await db.prepare("SELECT id,title FROM tasks WHERE status='open' ORDER BY created_at DESC LIMIT 1").bind().first<{id:string;title:string}>();
      result = pendingApproval ? `Em đang chờ anh xác nhận task: ${pendingApproval.title}` : pendingTask ? `Task gần nhất đã được lưu: ${pendingTask.id} — ${pendingTask.title}` : 'Hiện chưa có task nào được lưu.';
    } else if (command.kind === 'list') {
      const list = await tasks(db, command.includeDone);
      result = list.length ? list.slice(0, 20).map(t => `${t.status === 'done' ? '✓' : '○'} ${t.id}: ${t.title.slice(0, 140)}`).join('\n')
        + (list.length > 20 ? '\nĐang hiển thị 20 việc đầu; hoàn thành bớt để xem các việc tiếp theo.' : '') : 'Chưa có công việc nào được ghi nhận trong danh sách này.';
    } else if (command.kind === 'done') {
      let reference = command.reference;
      if (normalize(reference) === 'đó') {
        const recentTask = await db.prepare("SELECT id FROM tasks WHERE status='open' ORDER BY created_at DESC,id DESC LIMIT 2").all<{id:string}>();
        if (recentTask.results.length !== 1) { result = recentTask.results.length > 1 ? 'Có nhiều việc có thể là “việc đó”. Anh dùng mã T... để em chọn đúng nhé.' : 'Em chưa thấy task gần đây để đánh dấu hoàn thành.'; reference = ''; }
        else reference = recentTask.results[0]!.id;
      }
      const key = reference.replace(/^#/, '').toUpperCase();
      const matches = /^T\d+$/.test(key)
        ? (await db.prepare('SELECT id,title,status,revision FROM tasks WHERE id=?').bind(key).all<Task>()).results
        : (await db.prepare('SELECT id,title,status,revision FROM tasks WHERE normalized_title=? LIMIT 2').bind(normalize(command.reference)).all<Task>()).results;
      if (matches.length !== 1) result = matches.length > 1 ? 'Có nhiều việc trùng tên. Anh dùng /list rồi /done kèm mã việc nhé.' : 'Em chưa xác định được việc này. Anh dùng /list rồi /done kèm mã việc nhé.';
      else {
        const task = matches[0]!;
        if (task.status === 'done') result = `${task.id} đã được ghi nhận hoàn thành trước đó.`;
        else {
          statements.push(db.prepare(`UPDATE tasks SET status='done',revision=revision+1,completed_at=?,completion_source='user_reported' WHERE id=? AND revision=? AND ${guard}`)
            .bind(now, task.id, task.revision, ...args()));
          result = `Đã ghi nhận ${task.id} hoàn thành theo xác nhận của anh: ${task.title}`;
        }
      }
    } else if (command.kind === 'confirm' || command.kind === 'reject') {
      const checkinChange = command.target && !command.target.startsWith('checkin:') ? undefined
        : await db.prepare(`SELECT id,checkin_id,action,new_note FROM checkin_change_requests WHERE chat_id=? AND status='pending'
          ${command.target?.startsWith('checkin:') ? 'AND checkin_id=?' : ''} ORDER BY created_at DESC LIMIT 1`)
          .bind(job.chat_id,...(command.target?.startsWith('checkin:') ? [Number(command.target.slice(8))] : [])).first<CheckInChange>();
      if (checkinChange) {
        const checkin = await db.prepare(`SELECT c.id,c.note,c.plan_item_id FROM weekly_checkins c JOIN weekly_plans p ON p.week_start=c.week_start
          WHERE c.id=? AND p.chat_id=? AND p.status='active'`).bind(checkinChange.checkin_id,job.chat_id).first<{id:number;note:string;plan_item_id:number}>();
        if (command.kind === 'reject') {
          statements.push(db.prepare(`UPDATE checkin_change_requests SET status='rejected',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now,checkinChange.id,...args()));
          result = 'Đã giữ nguyên check-in.';
        } else if (!checkin) {
          statements.push(db.prepare(`UPDATE checkin_change_requests SET status='rejected',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now,checkinChange.id,...args()));
          result = 'Check-in này không còn tồn tại nên em không thay đổi thêm.';
        } else if (checkinChange.action === 'delete') {
          statements.push(db.prepare(`DELETE FROM weekly_checkins WHERE id=? AND ${guard}`).bind(checkin.id,...args()));
          statements.push(db.prepare(`UPDATE weekly_plan_items SET status=CASE
            WHEN metric='completion' AND EXISTS(SELECT 1 FROM weekly_checkins WHERE plan_item_id=?) THEN 'completed'
            WHEN metric='completion' THEN 'active'
            WHEN COALESCE((SELECT SUM(quantity) FROM weekly_checkins WHERE plan_item_id=?),0)>=target_count THEN 'completed'
            ELSE 'active' END WHERE id=? AND ${guard}`).bind(checkin.plan_item_id,checkin.plan_item_id,checkin.plan_item_id,...args()));
          statements.push(db.prepare(`UPDATE checkin_change_requests SET status='approved',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now,checkinChange.id,...args()));
          result = `Đã xoá C${checkin.id}: “${checkin.note}”.`;
        } else {
          statements.push(db.prepare(`UPDATE weekly_checkins SET note=?,normalized_note=? WHERE id=? AND ${guard}`).bind(checkinChange.new_note!,normalize(checkinChange.new_note!),checkin.id,...args()));
          statements.push(db.prepare(`UPDATE checkin_change_requests SET status='approved',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now,checkinChange.id,...args()));
          result = `Đã đổi C${checkin.id} thành “${checkinChange.new_note}”.`;
        }
      } else {
      const progressChange = command.target && !command.target.startsWith('progress:') ? undefined
        : await db.prepare(`SELECT id,event_id,action,new_label FROM progress_change_requests WHERE chat_id=? AND status='pending'
          ${command.target?.startsWith('progress:') ? 'AND event_id=?' : ''} ORDER BY created_at DESC LIMIT 1`)
          .bind(job.chat_id, ...(command.target?.startsWith('progress:') ? [Number(command.target.slice(9))] : []))
          .first<ProgressChange>();
      if (progressChange) {
        const event = await db.prepare(`SELECT e.id,e.kind,e.label,e.normalized_label FROM weekly_progress_events e
          JOIN weekly_plans p ON p.week_start=e.week_start WHERE e.id=? AND p.chat_id=? AND p.status='active'`).bind(progressChange.event_id, job.chat_id).first<ProgressEvent>();
        if (command.kind === 'reject') {
          statements.push(db.prepare(`UPDATE progress_change_requests SET status='rejected',decided_at=? WHERE id=? AND status='pending' AND ${guard}`)
            .bind(now, progressChange.id, ...args()));
          result = 'Đã giữ nguyên tiến độ.';
        } else if (!event) {
          statements.push(db.prepare(`UPDATE progress_change_requests SET status='rejected',decided_at=? WHERE id=? AND status='pending' AND ${guard}`)
            .bind(now, progressChange.id, ...args()));
          result = 'Lượt tiến độ này không còn tồn tại nên em không thay đổi thêm.';
        } else if (progressChange.action === 'delete') {
          statements.push(db.prepare(`DELETE FROM weekly_progress_events WHERE id=? AND ${guard}`).bind(event.id, ...args()));
          statements.push(db.prepare(`UPDATE progress_change_requests SET status='approved',decided_at=? WHERE id=? AND status='pending' AND ${guard}`)
            .bind(now, progressChange.id, ...args()));
          result = `Đã xoá P${event.id}: “${event.label}”.`;
        } else {
          const duplicate = await db.prepare('SELECT id FROM weekly_progress_events WHERE week_start=(SELECT week_start FROM weekly_progress_events WHERE id=?) AND kind=? AND normalized_label=? AND id<>?')
            .bind(event.id, event.kind, normalize(progressChange.new_label!), event.id).first<{id:number}>();
          if (duplicate) {
            statements.push(db.prepare(`UPDATE progress_change_requests SET status='rejected',decided_at=? WHERE id=? AND status='pending' AND ${guard}`)
              .bind(now, progressChange.id, ...args()));
            result = 'Tên mới đã trùng với một lượt apply khác nên em không đổi.';
          }
          else {
            statements.push(db.prepare(`UPDATE weekly_progress_events SET label=?,normalized_label=? WHERE id=? AND ${guard}`)
              .bind(progressChange.new_label!, normalize(progressChange.new_label!), event.id, ...args()));
            statements.push(db.prepare(`UPDATE progress_change_requests SET status='approved',decided_at=? WHERE id=? AND status='pending' AND ${guard}`)
              .bind(now, progressChange.id, ...args()));
            result = `Đã đổi P${event.id} thành “${progressChange.new_label}”.`;
          }
        }
      } else {
      const approval = command.target && !command.target.startsWith('task:') ? undefined
        : await db.prepare(`SELECT id,source_update,title,status FROM approval_requests WHERE chat_id=? AND status='pending'
          ${command.target?.startsWith('task:') ? 'AND source_update=?' : ''} ORDER BY created_at DESC LIMIT 1`)
          .bind(job.chat_id, ...(command.target?.startsWith('task:') ? [Number(command.target.slice(5))] : [])).first<Approval>();
      if (!approval) result = 'Hiện không có đề xuất nào đang chờ xác nhận.';
      else if (command.kind === 'reject') {
        statements.push(db.prepare(`UPDATE approval_requests SET status='rejected',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now, approval.id, ...args()));
        result = `Đã bỏ đề xuất thêm việc: ${approval.title}`;
      } else {
        const taskId = `T${approval.source_update}`;
        statements.push(db.prepare(`INSERT INTO tasks(id,title,normalized_title,source_update,created_at) SELECT ?,?,?,?,? WHERE ${guard}`).bind(taskId, approval.title, normalize(approval.title), approval.source_update, now, ...args()));
        statements.push(db.prepare(`UPDATE approval_requests SET status='approved',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now, approval.id, ...args()));
        result = `Đã xác nhận và thêm ${taskId}: ${approval.title}\nKhi xong, anh nhắn /done ${taskId}.`;
      }
      }
      }
    } else if (command.kind === 'help') result = help;
    else if (command.kind === 'thanks') result = 'Dạ, em ở đây. Khi cần thêm việc anh cứ nhắn em nhé.';
    else if (parseNaturalAdd(job.text)) {
      const title = parseNaturalAdd(job.text)!;
      statements.push(db.prepare(`INSERT INTO approval_requests(chat_id,source_update,title,created_at) SELECT ?,?,?,? WHERE ${guard}`).bind(job.chat_id, job.update_id, title, now, ...args()));
      result = `Em hiểu là anh muốn thêm task: “${title}”.\nAnh bấm nút để xác nhận hoặc bỏ qua.`;
      replyMarkup = confirmationButtons(`task:${job.update_id}`);
    }
    else if (assistant && await reserveAi(db, now)) result = await assistant(job.text, recent);
    else result = assistant ? 'Tháng này em đã chạm ngân sách AI dự phòng. Anh dùng /help để xem các lệnh chắc chắn.' : 'Em chưa hiểu chắc yêu cầu này.\n' + help;
    // Lease serializes task writers; job result and outbox commit with the task change.
    statements.push(db.prepare(`INSERT INTO deliveries(job_id,chat_id,text,reply_markup) SELECT ?,?,?,? WHERE ${guard}`).bind(job.id, job.chat_id, result, replyMarkup ? JSON.stringify(replyMarkup) : null, ...args()));
    statements.push(db.prepare(`INSERT INTO conversation_messages(chat_id,direction,text,created_at) SELECT ?,'outbound',?,? WHERE ${guard}`).bind(job.chat_id, result, now, ...args()));
    statements.push(db.prepare(`UPDATE jobs SET status=?,result=? WHERE id=? AND ${guard}`)
      .bind(job.attempts >= 3 ? 'failed' : 'done', result, job.id, ...args()));
    const completed = await db.batch(statements);
    const didComplete = (completed.at(-1)?.meta.changes ?? 0) > 0;
    if (didComplete) await db.prepare('UPDATE job_metrics SET processing_finished_at=? WHERE job_id=?').bind(Date.now(), job.id).run();
    return didComplete;
  } catch {
    await db.prepare(`UPDATE jobs SET attempts=attempts+1 WHERE id=(SELECT id FROM jobs WHERE status='pending' ORDER BY id LIMIT 1)
      AND EXISTS(SELECT 1 FROM owner WHERE lease_token=?)`).bind(token).run();
    throw new Error('job_processing_failed');
  } finally {
    await db.prepare('UPDATE owner SET lease_token=NULL,lease_until=0 WHERE id=1 AND lease_token=?').bind(token).run();
  }
}

export async function deliverNext(db: D1Database, sender: Sender, now = Date.now()): Promise<boolean> {
  // A crashed sender might already have delivered. Never retry that case blindly.
  await db.prepare("UPDATE deliveries SET status='unknown' WHERE status='sending' AND claimed_at<?").bind(now - 60000).run();
  const token = crypto.randomUUID();
  const claim = await db.prepare(`UPDATE deliveries SET status='sending',claim_token=?,claimed_at=?,attempts=attempts+1
    WHERE job_id=(SELECT job_id FROM deliveries WHERE status='pending' AND next_at<=? ORDER BY job_id LIMIT 1)
    AND status='pending' AND NOT EXISTS(SELECT 1 FROM deliveries WHERE status='sending') AND EXISTS(SELECT 1 FROM owner WHERE chat_id=deliveries.chat_id)`)
    .bind(token, now, now).run();
  if (!claim.meta.changes) return false;
  const item = await db.prepare('SELECT job_id,chat_id,text,reply_markup,attempts FROM deliveries WHERE claim_token=?').bind(token)
    .first<{ job_id: number; chat_id: string; text: string; reply_markup: string|null; attempts: number }>();
  if (!item) return false;
  await db.prepare('UPDATE job_metrics SET delivery_started_at=COALESCE(delivery_started_at,?) WHERE job_id=?').bind(now, item.job_id).run();
  let outcome;
  try { outcome = await sender(item.chat_id, item.text, readReplyMarkup(item.reply_markup)); } catch { outcome = { kind: 'unknown' as const }; }
  const status = outcome.kind === 'retry' ? (item.attempts < 3 ? 'pending' : 'failed') : outcome.kind;
  await db.prepare('UPDATE deliveries SET status=?,next_at=?,message_id=? WHERE job_id=? AND claim_token=?')
    .bind(status, outcome.kind === 'retry' ? now + outcome.after * 1000 : 0, outcome.kind === 'sent' ? outcome.messageId : null, item.job_id, token).run();
  await db.prepare('UPDATE job_metrics SET delivery_finished_at=?,delivery_status=? WHERE job_id=?').bind(Date.now(), status, item.job_id).run();
  return true;
}
export async function hasPending(db: D1Database) {
  return Boolean(await db.prepare(`SELECT 1 FROM jobs WHERE status='pending' UNION ALL SELECT 1 FROM deliveries WHERE (status='pending' AND next_at<=?) OR (status='sending' AND claimed_at<?) LIMIT 1`).bind(Date.now(), Date.now()-60000).first());
}

export async function enqueueWeeklyProgressReminder(db: D1Database, now = Date.now()): Promise<boolean> {
  const currentWeek = weekStart(now), date = localDate(now);
  const plan = await db.prepare("SELECT week_start,chat_id,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND status='active' LIMIT 1")
    .bind(currentWeek).first<WeeklyPlan>();
  if (!plan) return false;
  const preference = await db.prepare('SELECT weekly_progress_enabled,delivery_hour FROM reminder_preferences WHERE chat_id=?').bind(plan.chat_id).first<ReminderPreference>();
  const hour = preference?.delivery_hour ?? 20;
  if ((preference?.weekly_progress_enabled ?? 1) !== 1 || localHour(now) !== hour) return false;
  const items = await ensurePlanItems(db, plan, now);
  const pending = items.filter(item => item.metric === 'completion' ? item.status !== 'completed' : item.completed < (item.target_count ?? 0))
    .map(item => `${item.title} ${item.metric === 'completion' ? '— chưa hoàn thành' : `${item.completed}/${item.target_count}`}`);
  if (!pending.length) return false;
  const updateId = -Number(date.replaceAll('-',''));
  const text = `Nhắc tiến độ hôm nay (${date.slice(8,10)}/${date.slice(5,7)}):\n${pending.map(item=>`• ${item}`).join('\n')}\n\nAnh cập nhật khi hoàn thành, hoặc dùng /reminders off để tắt nhắc.`;
  const results = await db.batch([
    db.prepare(`INSERT OR IGNORE INTO jobs(update_id,user_id,chat_id,text,created_at,status,result)
      SELECT ?,owner.user_id,owner.chat_id,?,?, 'done', ? FROM owner
      WHERE NOT EXISTS(SELECT 1 FROM weekly_reminders WHERE week_start=? AND local_date=?)`)
      .bind(updateId, text, now, text, currentWeek, date),
    db.prepare('INSERT OR IGNORE INTO deliveries(job_id,chat_id,text,reply_markup) SELECT id,chat_id,result,? FROM jobs WHERE update_id=?').bind(JSON.stringify(progressButton), updateId),
    db.prepare('INSERT OR IGNORE INTO job_metrics(job_id,queued_at,processing_started_at,processing_finished_at) SELECT id,created_at,created_at,created_at FROM jobs WHERE update_id=?').bind(updateId),
    db.prepare('INSERT OR IGNORE INTO weekly_reminders(week_start,local_date,job_id,created_at) SELECT ?,?,id,? FROM jobs WHERE update_id=?').bind(currentWeek, date, now, updateId),
  ]);
  return (results[0]?.meta.changes ?? 0) === 1;
}

export async function enqueueDailyBriefing(db: D1Database, now = Date.now()): Promise<boolean> {
  if (localHour(now) !== 8) return false;
  const owner = await ownerFor(db); if (!owner) return false;
  const date = localDate(now), updateId = -(3_000_000_000 + Number(date.replaceAll('-','')));
  const text = await todaySummary(db, owner.chat_id, now);
  const results = await db.batch([
    db.prepare(`INSERT OR IGNORE INTO jobs(update_id,user_id,chat_id,text,created_at,status,result)
      SELECT ?,?,?,?,?,'done',? WHERE NOT EXISTS(SELECT 1 FROM daily_briefings WHERE local_date=?)`)
      .bind(updateId, owner.user_id, owner.chat_id, text, now, text, date),
    db.prepare('INSERT OR IGNORE INTO deliveries(job_id,chat_id,text,reply_markup) SELECT id,chat_id,result,? FROM jobs WHERE update_id=?').bind(JSON.stringify(progressButton), updateId),
    db.prepare('INSERT OR IGNORE INTO job_metrics(job_id,queued_at,processing_started_at,processing_finished_at) SELECT id,created_at,created_at,created_at FROM jobs WHERE update_id=?').bind(updateId),
    db.prepare('INSERT OR IGNORE INTO daily_briefings(local_date,job_id,created_at) SELECT ?,id,? FROM jobs WHERE update_id=?').bind(date, now, updateId),
  ]);
  return (results[0]?.meta.changes ?? 0) === 1;
}

export async function enqueueDueTaskReminders(db: D1Database, now = Date.now()): Promise<boolean> {
  const due = (await db.prepare(`SELECT id,title,status,revision,due_at FROM tasks
    WHERE status='open' AND due_at<=? AND due_at>? ORDER BY due_at,id LIMIT 5`).bind(now, now-5*60_000).all<Task>()).results;
  let queued = false;
  for (const task of due) {
    const taskNumber = Number(task.id.slice(1));
    const updateId = -(1_000_000_000_000 + Math.floor(task.due_at! / 60_000) * 1_000 + taskNumber);
    const text = `Đến giờ cho ${task.id}: ${task.title}\n\nAnh chọn trạng thái cho việc này nhé.`;
    const results = await db.batch([
      db.prepare(`INSERT OR IGNORE INTO jobs(update_id,user_id,chat_id,text,created_at,status,result)
        SELECT ?,owner.user_id,owner.chat_id,?,?, 'done', ? FROM owner
        WHERE NOT EXISTS(SELECT 1 FROM task_reminders WHERE task_id=? AND due_at=?)`)
        .bind(updateId, text, now, text, task.id, task.due_at),
      db.prepare('INSERT OR IGNORE INTO deliveries(job_id,chat_id,text,reply_markup) SELECT id,chat_id,result,? FROM jobs WHERE update_id=?').bind(JSON.stringify(taskReminderButtons(task.id)), updateId),
      db.prepare('INSERT OR IGNORE INTO job_metrics(job_id,queued_at,processing_started_at,processing_finished_at) SELECT id,created_at,created_at,created_at FROM jobs WHERE update_id=?').bind(updateId),
      db.prepare('INSERT OR IGNORE INTO task_reminders(task_id,due_at,job_id,created_at) SELECT ?,?,id,? FROM jobs WHERE update_id=?').bind(task.id, task.due_at, now, updateId),
    ]);
    queued ||= (results[0]?.meta.changes ?? 0) === 1;
  }
  return queued;
}

export async function enqueueWeeklyReview(db: D1Database, now = Date.now()): Promise<boolean> {
  if (localDay(now) !== 0 || localHour(now) !== 19) return false;
  const plan = await db.prepare("SELECT week_start,chat_id,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND status='active' LIMIT 1")
    .bind(weekStart(now)).first<WeeklyPlan>();
  if (!plan) return false;
  const open = await tasks(db);
  const items = await ensurePlanItems(db, plan, now), counts = progressCounts(items);
  const text = `${formatProgress(plan, counts.applications, counts.runs)}${formatPlanItems(items,true)}\n\nReview tuần:\n${open.length ? open.slice(0,10).map(task=>`• ${task.id}: ${task.title}`).join('\n') : 'Không còn task mở.'}\n\nChọn task cần giữ: /review carry T...`;
  const updateId = -(4_000_000_000 + Number(plan.week_start.replaceAll('-','')));
  const results = await db.batch([
    db.prepare(`INSERT OR IGNORE INTO jobs(update_id,user_id,chat_id,text,created_at,status,result)
      SELECT ?,owner.user_id,owner.chat_id,?,?, 'done', ? FROM owner
      WHERE NOT EXISTS(SELECT 1 FROM weekly_reviews WHERE week_start=?)`).bind(updateId,text,now,text,plan.week_start),
    db.prepare('INSERT OR IGNORE INTO deliveries(job_id,chat_id,text,reply_markup) SELECT id,chat_id,result,? FROM jobs WHERE update_id=?').bind(JSON.stringify(progressButton), updateId),
    db.prepare('INSERT OR IGNORE INTO job_metrics(job_id,queued_at,processing_started_at,processing_finished_at) SELECT id,created_at,created_at,created_at FROM jobs WHERE update_id=?').bind(updateId),
    db.prepare('INSERT OR IGNORE INTO weekly_reviews(week_start,job_id,created_at) SELECT ?,id,? FROM jobs WHERE update_id=?').bind(plan.week_start,now,updateId),
  ]);
  return (results[0]?.meta.changes ?? 0) === 1;
}
