import { help, normalize, parseCommand, parseNaturalAdd } from '../work/commands';
import type { ReplyMarkup, TelegramUpdate, Sender } from '../../adapters/telegram';
import type { Assistant, FocusAssistant, StructuredAssistant } from '../../adapters/openrouter';

type Job = { id: number; update_id: number; chat_id: string; text: string; attempts: number };
type Task = { id: string; title: string; status: 'open' | 'done'; revision: number; due_at?: number|null; goal_id?: number|null; goal_title?: string|null };
type Approval = { id: number; source_update: number; title: string; goal_scoped: number; status: 'pending' };
type WeeklyDraft = { id: 1; chat_id: string; step: 'goal'|'commitment'|'habit1'|'habit2'|'confirm'; goal: string|null; commitment: string|null; habit1: string|null; habit2: string|null; week_start: string };
type WeeklyPlan = { week_start: string; chat_id: string; goal: string; commitment: string; habit1: string; habit2: string };
type ReminderPreference = { weekly_progress_enabled: number; delivery_hour: number };
type ProgressEvent = { id: number; kind: 'job_application'|'run'; label: string; normalized_label: string; source_update: number };
type ProgressChange = { id: number; event_id: number; action: 'delete'|'rename'; new_label: string|null };
type CheckInChange = { id: number; checkin_id: number; action: 'delete'|'rename'; new_note: string|null };
type CheckInSelection = { id: number; week_start: string; source_update: number; text: string; candidate_item_ids: string; status: 'pending'|'selected'|'rejected'; expires_at: number|null };
type PlanItem = { id: number; kind: 'goal'|'commitment'|'habit'; position: number; title: string; normalized_title: string; metric: 'count'|'completion'; target_count: number|null; status: 'active'|'completed'; completed: number; goal_id: number|null; habit_id: number|null; cadence: 'daily'|'weekly'|null; minimum_value: number|null; minimum_unit: string|null };
type StagedCheckIn = { item: PlanItem; text: string; weekStart: string; sourceUpdate: number; occurredAt: number; localDate?: string; chatId: string; outcome: 'recorded'|'selected' };
type MeasurementRequest = PlanItem & { request_id: number; request_week_start: string; request_local_date: string };
type HabitSpec = { cadence: 'daily'|'weekly'; target: number; minimumValue?: number; minimumUnit?: 'minutes' };

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
  const quantity = normalize(text).match(/\b(\d{1,3})\s*(?:job|jobs|đơn|vị trí)\b/iu)?.[1];
  return quantity ? Number(quantity) : 1;
}

function habitSpec(title: string): HabitSpec {
  const daily = /(?:mỗi|hằng)\s+ngày/iu.test(title);
  const weekly = title.match(/\b(\d{1,2})\s*(?:buổi|lần)(?:\s*(?:\/\s*tuần|mỗi\s+tuần))?/iu)?.[1];
  const duration = title.match(/\b(\d{1,3})\s*(?:phút|phut|min|['’])/iu)?.[1];
  const cadence = weekly && !daily ? 'weekly' : 'daily';
  return { cadence, target:cadence === 'weekly' ? Number(weekly) : 7,
    ...(duration ? {minimumValue:Number(duration),minimumUnit:'minutes' as const} : {}) };
}

function habitRule(item: Pick<PlanItem,'cadence'|'minimum_value'|'minimum_unit'>): string {
  const frequency = item.cadence === 'weekly' ? 'Theo lịch tuần' : 'Mỗi ngày';
  return item.minimum_value && item.minimum_unit === 'minutes' ? `${frequency}, tối thiểu ${item.minimum_value} phút` : frequency;
}

function metricFor(title: string): { metric: 'count'|'completion'; target?: number } {
  const target = /(?:apply|ứng tuyển)/iu.test(title) ? targetFrom(title) : undefined;
  return target ? { metric: 'count', target } : { metric: 'completion' };
}

function planItemValues(plan: Pick<WeeklyPlan,'goal'|'commitment'|'habit1'|'habit2'>) {
  return [
    { kind:'goal' as const, position:0, title:plan.goal },
    { kind:'commitment' as const, position:0, title:plan.commitment },
    { kind:'habit' as const, position:1, title:plan.habit1 },
    { kind:'habit' as const, position:2, title:plan.habit2 },
  ].filter(item => item.title.trim().length > 0).map(item => {
    const spec = item.kind === 'habit' ? habitSpec(item.title) : undefined;
    return { ...item, ...(spec ? { metric:'count' as const, ...spec } : metricFor(item.title)) };
  });
}

async function planItems(db: D1Database, week: string): Promise<PlanItem[]> {
  return (await db.prepare(`SELECT i.id,i.kind,i.position,i.title,i.normalized_title,i.metric,i.target_count,i.status,i.goal_id,i.habit_id,i.cadence,i.minimum_value,i.minimum_unit,
    COALESCE(SUM(CASE WHEN i.kind='habit' THEN COALESCE(c.met_threshold,1)*c.quantity ELSE c.quantity END),0) AS completed FROM weekly_plan_items i LEFT JOIN weekly_checkins c ON c.plan_item_id=i.id
    WHERE i.week_start=? GROUP BY i.id ORDER BY CASE i.kind WHEN 'goal' THEN 0 WHEN 'commitment' THEN 1 ELSE 2 END,i.position`).bind(week).all<PlanItem>()).results;
}

async function ensurePlanItems(db: D1Database, plan: WeeklyPlan, now: number): Promise<PlanItem[]> {
  const existing = await planItems(db, plan.week_start);
  if (!existing.length) await db.batch(planItemValues(plan).map(item => db.prepare(`INSERT OR IGNORE INTO weekly_plan_items(week_start,kind,position,title,normalized_title,metric,target_count,created_at)
    VALUES(?,?,?,?,?,?,?,?)`).bind(plan.week_start,item.kind,item.position,item.title,normalize(item.title),item.metric,item.target ?? null,now)));
  await db.prepare('INSERT OR IGNORE INTO goals(chat_id,title,normalized_title,created_at) VALUES(?,?,?,?)')
    .bind(plan.chat_id,plan.goal,normalize(plan.goal),now).run();
  const goal = await db.prepare('SELECT id FROM goals WHERE chat_id=? AND normalized_title=?').bind(plan.chat_id,normalize(plan.goal)).first<{id:number}>();
  if (goal) await db.prepare("UPDATE weekly_plan_items SET goal_id=? WHERE week_start=? AND kind='goal'").bind(goal.id,plan.week_start).run();
  for (const [position,title] of [[1,plan.habit1],[2,plan.habit2]] as const) {
    if (!title.trim()) continue;
    const spec = habitSpec(title);
    await db.prepare(`INSERT OR IGNORE INTO habit_definitions(chat_id,title,normalized_title,cadence,target_occurrences,minimum_value,minimum_unit,created_at)
      VALUES(?,?,?,?,?,?,?,?)`).bind(plan.chat_id,title,normalize(title),spec.cadence,spec.target,spec.minimumValue ?? null,spec.minimumUnit ?? null,now).run();
    const habit = await db.prepare('SELECT id FROM habit_definitions WHERE chat_id=? AND normalized_title=?').bind(plan.chat_id,normalize(title)).first<{id:number}>();
    await db.prepare(`UPDATE weekly_plan_items SET metric='count',target_count=?,habit_id=?,cadence=?,minimum_value=?,minimum_unit=?
      WHERE week_start=? AND kind='habit' AND position=?`).bind(spec.target,habit?.id ?? null,spec.cadence,spec.minimumValue ?? null,spec.minimumUnit ?? null,plan.week_start,position).run();
  }
  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO weekly_checkins(week_start,plan_item_id,quantity,note,normalized_note,source_update,occurred_at)
      SELECT e.week_start,i.id,1,e.label,e.normalized_label,e.source_update,e.occurred_at FROM weekly_progress_events e
      JOIN weekly_plan_items i ON i.week_start=e.week_start AND i.kind='commitment'
      WHERE e.week_start=? AND e.kind='job_application'
        AND (i.normalized_title LIKE '%apply%' OR i.normalized_title LIKE '%ứng tuyển%')
        AND NOT EXISTS(SELECT 1 FROM weekly_checkins c WHERE c.source_update=e.source_update)`).bind(plan.week_start),
    db.prepare(`INSERT OR IGNORE INTO weekly_checkins(week_start,plan_item_id,quantity,note,normalized_note,source_update,occurred_at,local_date,met_threshold)
      SELECT e.week_start,i.id,1,e.label,e.normalized_label,e.source_update,e.occurred_at,e.label,1 FROM weekly_progress_events e
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
  if (item.kind === 'habit') {
    const dated = value.match(/ngày\s+(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{4}))?/iu);
    const date = dated ? datedRunLabel({day:Number(dated[1]),month:Number(dated[2]),year:dated[3] ? Number(dated[3]) : undefined},now) : localDate(now);
    return `habit:${date ?? localDate(now)}`;
  }
  if (item.kind === 'commitment' && /apply|ứng tuyển/iu.test(item.title)) {
    const detail = value.replace(/^.*?(?:apply|ứng tuyển)(?:\s+(?:job|vị trí))?\s*/iu,'').replace(/^(?:thêm\s+)/iu,'');
    return `apply:${detail}`;
  }
  return value;
}

function checkInDate(text: string, recordedAt: number): string {
  const value = normalize(text);
  const vietnamese = value.match(/ngày\s+(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{4}))?/iu);
  if (vietnamese) return datedRunLabel({day:Number(vietnamese[1]),month:Number(vietnamese[2]),year:vietnamese[3] ? Number(vietnamese[3]) : undefined},recordedAt) ?? localDate(recordedAt);
  const iso = value.match(/\b(20\d{2}-\d{2}-\d{2})\b/u)?.[1];
  return iso ?? localDate(recordedAt);
}

function reportedHabitValue(text: string, item: Pick<PlanItem,'minimum_value'|'minimum_unit'>): number|undefined {
  if (item.minimum_unit !== 'minutes') return undefined;
  const value = text.match(/\b(\d{1,3})\s*(?:phút|phut|min|['’])/iu)?.[1];
  return value ? Number(value) : undefined;
}

function previousDate(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0,10);
}

async function habitStreaks(db: D1Database, week: string, now: number): Promise<Map<number,number>> {
  const checkins = (await db.prepare(`SELECT current_item.id AS plan_item_id,c.local_date,c.note,c.occurred_at FROM weekly_plan_items current_item
    JOIN weekly_plan_items historical_item ON historical_item.habit_id=current_item.habit_id
    JOIN weekly_checkins c ON c.plan_item_id=historical_item.id
    WHERE current_item.week_start=? AND current_item.kind='habit' AND current_item.cadence='daily' AND COALESCE(c.met_threshold,1)=1`)
    .bind(week).all<{plan_item_id:number;local_date:string|null;note:string;occurred_at:number}>()).results;
  const datesByHabit = new Map<number,Set<string>>();
  for (const checkin of checkins) {
    const dates = datesByHabit.get(checkin.plan_item_id) ?? new Set<string>();
    dates.add(checkin.local_date ?? checkInDate(checkin.note,checkin.occurred_at));
    datesByHabit.set(checkin.plan_item_id,dates);
  }
  const streaks = new Map<number,number>();
  for (const [itemId,dates] of datesByHabit) {
    let day = localDate(now), streak = 0;
    if (!dates.has(day)) day = previousDate(day);
    while (dates.has(day)) { streak += 1; day = previousDate(day); }
    streaks.set(itemId,streak);
  }
  return streaks;
}

async function stageCheckIn(db: D1Database, statements: D1PreparedStatement[], guard: string, args: () => (string|number)[], checkIn: StagedCheckIn): Promise<{ already: boolean; progress: string; needsMeasurement?: boolean; metThreshold?: boolean; actualValue?: number }> {
  const quantity = checkIn.item.kind === 'habit' ? 1 : checkIn.item.metric === 'count' ? checkInQuantity(checkIn.text) : 1;
  const key = checkInKey(checkIn.item,checkIn.text,checkIn.occurredAt);
  const localDay = checkIn.item.kind === 'habit' ? (checkIn.localDate ?? checkInDate(checkIn.text,checkIn.occurredAt)) : null;
  const actualValue = checkIn.item.kind === 'habit' ? reportedHabitValue(checkIn.text,checkIn.item) : undefined;
  if (checkIn.item.kind === 'habit' && checkIn.item.minimum_value !== null && actualValue === undefined) {
    return { already:false, progress:`cần ghi số phút để đối chiếu mức ${checkIn.item.minimum_value} phút`, needsMeasurement:true };
  }
  if (checkIn.item.kind === 'habit') statements.push(db.prepare(`UPDATE checkin_measurement_requests SET status='recorded',decided_at=?
    WHERE chat_id=? AND plan_item_id=? AND local_date=? AND status='pending' AND ${guard}`).bind(checkIn.occurredAt,checkIn.chatId,checkIn.item.id,localDay,...args()));
  const metThreshold = checkIn.item.kind === 'habit' ? (checkIn.item.minimum_value === null || (actualValue ?? 0) >= checkIn.item.minimum_value) : undefined;
  const existing = await db.prepare('SELECT id,met_threshold FROM weekly_checkins WHERE source_update=? OR (plan_item_id=? AND local_date=?) OR (plan_item_id=? AND normalized_note=?)')
    .bind(checkIn.sourceUpdate,checkIn.item.id,localDay,checkIn.item.id,key).first<{id:number;met_threshold:number|null}>();
  const completed = checkIn.item.completed + (metThreshold === false ? 0 : quantity);
  const habitUnit = checkIn.item.cadence === 'weekly' ? ' lần' : ' ngày';
  const progress = checkIn.item.metric === 'count' ? `${completed}/${checkIn.item.target_count}${checkIn.item.kind === 'habit' ? habitUnit : ''}` : 'đã hoàn thành';
  if (existing && !(checkIn.item.kind === 'habit' && existing.met_threshold === 0 && metThreshold)) return { already:true, progress };
  if (existing) {
    statements.push(db.prepare(`UPDATE weekly_checkins SET quantity=?,note=?,normalized_note=?,source_update=?,occurred_at=?,actual_value=?,actual_unit='minutes',met_threshold=1
      WHERE id=? AND ${guard}`).bind(quantity,checkIn.text,key,checkIn.sourceUpdate,checkIn.occurredAt,actualValue ?? null,existing.id,...args()));
  } else statements.push(db.prepare(`INSERT INTO weekly_checkins(week_start,plan_item_id,quantity,note,normalized_note,source_update,occurred_at,local_date,actual_value,actual_unit,met_threshold)
    SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE ${guard}`).bind(checkIn.weekStart,checkIn.item.id,quantity,checkIn.text,key,checkIn.sourceUpdate,checkIn.occurredAt,localDay,actualValue ?? null,actualValue === undefined ? null : 'minutes',metThreshold === undefined ? null : Number(metThreshold),...args()));
  if (checkIn.item.metric === 'completion' || (checkIn.item.target_count !== null && completed >= checkIn.item.target_count)) {
    statements.push(db.prepare(`UPDATE weekly_plan_items SET status='completed' WHERE id=? AND ${guard}`).bind(checkIn.item.id,...args()));
    if (checkIn.item.kind === 'goal' && checkIn.item.goal_id) statements.push(db.prepare(`UPDATE goals SET status='completed' WHERE id=? AND ${guard}`).bind(checkIn.item.goal_id,...args()));
  }
  if (checkIn.outcome === 'recorded') {
    statements.push(db.prepare(`INSERT OR IGNORE INTO checkin_outcomes(chat_id,source_update,outcome,created_at)
      SELECT ?,?,'recorded',? WHERE ${guard}`).bind(checkIn.chatId,checkIn.sourceUpdate,checkIn.occurredAt,...args()));
  } else {
    statements.push(db.prepare(`UPDATE checkin_outcomes SET outcome='selected' WHERE chat_id=? AND source_update=? AND outcome='ambiguous' AND ${guard}`)
      .bind(checkIn.chatId,checkIn.sourceUpdate,...args()));
  }
  return { already:false, progress, metThreshold, actualValue };
}

function formatPlanItems(items: PlanItem[], showAll = false, streaks?: Map<number,number>, today?: Map<number,string>): string {
  const visible = showAll ? items : items.filter(item => item.metric === 'completion' || item.completed > 0);
  if (!visible.length) return '';
  return `\n\nBảng tiến độ tuần:\n${visible.map(item => {
    const category = item.kind === 'goal' ? 'Mục tiêu' : item.kind === 'commitment' ? 'Cam kết' : `Thói quen ${item.position}`;
    const progress = item.metric === 'count'
      ? `${'█'.repeat(Math.min(8, Math.floor(item.completed / (item.target_count ?? 1) * 8)))}${'░'.repeat(Math.max(0, 8 - Math.min(8, Math.floor(item.completed / (item.target_count ?? 1) * 8))))} ${item.completed}/${item.target_count}${item.kind === 'habit' ? item.cadence === 'weekly' ? ' lần' : ' ngày' : ''}`
      : item.status === 'completed' ? '✓ Đã hoàn thành' : '○ Chưa hoàn thành';
    const habitDetail = item.kind === 'habit'
      ? `\n${habitRule(item)}\n${progress}${today ? `\nHôm nay: ${today.get(item.id) ?? 'chưa ghi nhận'}` : ''}${streaks && item.cadence === 'daily' ? `\nChuỗi hiện tại: ${streaks.get(item.id) ?? 0} ngày` : ''}`
      : `\n${progress}`;
    return `${category}\n${item.title.slice(0,180)}${habitDetail}`;
  }).join('\n\n')}`;
}

function progressCounts(items: PlanItem[]): { applications: number; runs: number } {
  const applications = items.find(item => item.kind === 'commitment' && /apply|ứng tuyển/iu.test(item.title))?.completed ?? 0;
  const runs = items.find(item => item.kind === 'habit' && /chạy|run/iu.test(item.title))?.completed ?? 0;
  return { applications, runs };
}

function formatCheckIns(checkins: {id:number; note:string; source_update?:number; item_kind?:PlanItem['kind']; item_position?:number; item_title?:string}[]): string {
  if (!checkins.length) return 'Chưa có check-in nào trong tuần này.';
  return `Check-in tuần này:\n${checkins.slice(0,20).map(checkin => {
    const category = checkin.item_kind === 'goal' ? 'Mục tiêu' : checkin.item_kind === 'commitment' ? 'Cam kết' : checkin.item_kind === 'habit' ? `Thói quen ${checkin.item_position}` : undefined;
    return `• C${checkin.id} · ${checkin.note.slice(0,120)}${category && checkin.item_title ? ` — ${category}: ${checkin.item_title.slice(0,60)}` : ''}`;
  }).join('\n')}\n\nSửa: /progress edit C... Nội dung mới\nXoá: /progress delete C...`;
}

function formatUngroupedProgressEvents(events: ProgressEvent[]): string {
  if (!events.length) return '';
  return `Lịch sử đã ghi, chưa gắn với mục kế hoạch hiện tại:\n${events.slice(0,20).map(event => event.kind === 'run'
    ? `• Chạy bộ ngày ${event.label.slice(8,10)}/${event.label.slice(5,7)}`
    : `• Apply — ${event.label.slice(0,120)}`).join('\n')}`;
}

function formatProgress(plan: WeeklyPlan, applications: number, runs: number): string {
  const applicationTarget = /apply|ứng tuyển/iu.test(plan.commitment) ? targetFrom(plan.commitment) : undefined;
  const runHabit = [plan.habit1, plan.habit2].find(value => /chạy|run/iu.test(value));
  const runTarget = runHabit ? habitSpec(runHabit).target : undefined;
  const ratio = (count: number, target?: number) => target ? `${count}/${target}` : `${count} lần đã ghi`;
  const tracked = [
    applicationTarget ? `• Cam kết apply: ${ratio(applications, applicationTarget)}` : undefined,
    runHabit ? `• Thói quen chạy bộ: ${ratio(runs, runTarget)}${habitSpec(runHabit).cadence === 'daily' ? ' ngày' : ' lần'}` : undefined,
  ].filter(Boolean).join('\n');
  return `Tiến độ tuần bắt đầu ${plan.week_start}:\n• Mục tiêu: ${plan.goal}\n• Cam kết: ${plan.commitment}${tracked ? `\n${tracked}` : ''}\n\nCác kết quả được ghi theo xác nhận của anh.`;
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

function focusFeedbackButtons(jobId: number): ReplyMarkup {
  return { inline_keyboard: [[
    { text:'Hữu ích', callback_data:`_navi:focus:feedback:${jobId}:helpful` },
    { text:'Chưa đúng', callback_data:`_navi:focus:feedback:${jobId}:not_helpful` },
  ]] };
}

function progressPageButtons(page: number, hasNext: boolean): ReplyMarkup | undefined {
  const buttons = [] as Array<{text:string;callback_data:string}>;
  if (page > 0) buttons.push({text:'‹ Trang trước',callback_data:`_navi:show:progress:${page-1}`});
  if (hasNext) buttons.push({text:'Trang sau ›',callback_data:`_navi:show:progress:${page+1}`});
  return buttons.length ? {inline_keyboard:[buttons]} : undefined;
}

function stageMeasurementRequest(db: D1Database, statements: D1PreparedStatement[], guard: string, args: () => (string|number)[], checkIn: StagedCheckIn, now: number): void {
  const localDay = checkIn.localDate ?? checkInDate(checkIn.text,checkIn.occurredAt);
  statements.push(db.prepare(`UPDATE checkin_measurement_requests SET status='expired',decided_at=?
    WHERE chat_id=? AND status='pending' AND ${guard}`)
    .bind(now,checkIn.chatId,...args()));
  statements.push(db.prepare(`INSERT INTO checkin_measurement_requests(chat_id,plan_item_id,week_start,local_date,source_update,created_at,expires_at)
    SELECT ?,?,?,?,?,?,? WHERE ${guard}`).bind(checkIn.chatId,checkIn.item.id,checkIn.weekStart,localDay,checkIn.sourceUpdate,now,now+24*60*60*1000,...args()));
}

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
  const result = await db.prepare(`SELECT t.id,t.title,t.status,t.revision,t.due_at,t.goal_id,g.title AS goal_title
    FROM tasks t LEFT JOIN goals g ON g.id=t.goal_id ${includeDone ? '' : "WHERE t.status='open'"} ORDER BY t.created_at,t.id LIMIT 21`).all<Task>();
  return result.results;
}

function reviewTaskButtons(open: Task[]): ReplyMarkup | undefined {
  const buttons: ReplyMarkup['inline_keyboard'] = [];
  for (const task of open.slice(0,5)) {
    buttons.push([
      {text:`Đã xong ${task.id}`,callback_data:`_navi:task:done:${task.id}`},
      {text:`Sang tuần ${task.id}`,callback_data:`_navi:review:carry:${task.id}`},
    ]);
  }
  return buttons.length ? {inline_keyboard:buttons} : undefined;
}

async function weeklyReviewSummary(db: D1Database, plan: WeeklyPlan, now: number): Promise<{text:string; replyMarkup?:ReplyMarkup}> {
  const [open,items] = await Promise.all([tasks(db),ensurePlanItems(db,plan,now)]);
  const counts = progressCounts(items);
  const taskLines = open.length
    ? open.slice(0,5).map(task=>`• ${task.id}: ${task.title}${task.goal_title ? ` — hỗ trợ: ${task.goal_title}` : ' — việc riêng'}`).join('\n')
    : 'Không còn task mở.';
  const remainder = open.length > 5 ? `\nCòn ${open.length-5} task khác; dùng /list để xem toàn bộ.` : '';
  return {
    text: `${formatProgress(plan, counts.applications, counts.runs)}${formatPlanItems(items,true)}\n\nReview tuần\nTask còn mở:\n${taskLines}${remainder}\n\nAnh có thể đánh dấu xong hoặc chọn task cần giữ sang tuần.`,
    replyMarkup: reviewTaskButtons(open),
  };
}

async function todaySummary(db: D1Database, chatId: string, now: number): Promise<string> {
  const date = localDate(now), start = Date.parse(`${date}T00:00:00+07:00`), end = start + 24 * 60 * 60 * 1000;
  const plan = await db.prepare("SELECT week_start,chat_id,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'")
    .bind(weekStart(now), chatId).first<WeeklyPlan>();
  const due = (await db.prepare("SELECT t.id,t.title,t.status,t.revision,t.due_at,t.goal_id,g.title AS goal_title FROM tasks t LEFT JOIN goals g ON g.id=t.goal_id WHERE t.status='open' AND t.due_at>=? AND t.due_at<? ORDER BY t.due_at,t.id LIMIT 6")
    .bind(start,end).all<Task>()).results;
  const unscheduled = due.length < 6 ? (await db.prepare("SELECT t.id,t.title,t.status,t.revision,t.due_at,t.goal_id,g.title AS goal_title FROM tasks t LEFT JOIN goals g ON g.id=t.goal_id WHERE t.status='open' AND t.due_at IS NULL ORDER BY t.created_at,t.id LIMIT ?")
    .bind(6-due.length).all<Task>()).results : [];
  const carryovers = (await db.prepare(`SELECT task_id FROM weekly_task_carryovers WHERE week_start=?`).bind(weekStart(now)).all<{task_id:string}>()).results;
  const carried = new Set(carryovers.map(item=>item.task_id));
  const taskLines = [...due,...unscheduled].map(task => `• ${task.id}: ${task.title}${carried.has(task.id) ? ' — giữ từ tuần trước' : task.due_at ? ` — ${formatLocalTime(task.due_at)}` : ''}${task.goal_title ? ` — mục tiêu: ${task.goal_title}` : ' — việc riêng'}`);
  if (!plan) return `Hôm nay ${date.slice(8,10)}/${date.slice(5,7)}\n\n${taskLines.length ? `Việc cần làm:\n${taskLines.join('\n')}` : 'Chưa có task đang mở.'}\n\nAnh nhắn /week để lập kế hoạch tuần.`;
  const items = await ensurePlanItems(db, plan, now), streaks = await habitStreaks(db, plan.week_start, now);
  const daily = (await db.prepare(`SELECT c.plan_item_id,MAX(COALESCE(c.met_threshold,1)) AS met FROM weekly_checkins c
    JOIN weekly_plan_items i ON i.id=c.plan_item_id WHERE i.week_start=? AND i.kind='habit' AND c.local_date=? GROUP BY c.plan_item_id`)
    .bind(plan.week_start,date).all<{plan_item_id:number;met:number}>()).results;
  const today = new Map(daily.map(row=>[row.plan_item_id,row.met ? 'đã đạt' : 'đã ghi nhận, chưa đủ ngưỡng']));
  return `Hôm nay ${date.slice(8,10)}/${date.slice(5,7)}${formatPlanItems(items,true,streaks,today)}\n\n${taskLines.length ? `Việc cần làm:\n${taskLines.map(line=>line.length>240 ? line.slice(0,239)+'…' : line).join('\n')}` : 'Chưa có task đang mở.'}`;
}

async function systemStatusSummary(db: D1Database, chatId: string, now: number): Promise<string> {
  const currentWeek = weekStart(now);
  const [plan, preference, openTasks, latest, latency] = await Promise.all([
    db.prepare("SELECT goal FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'").bind(currentWeek,chatId).first<{goal:string}>(),
    db.prepare('SELECT weekly_progress_enabled,delivery_hour FROM reminder_preferences WHERE chat_id=?').bind(chatId).first<ReminderPreference>(),
    db.prepare("SELECT COUNT(*) AS count FROM tasks WHERE status='open'").first<{count:number}>(),
    db.prepare(`SELECT c.note,c.occurred_at FROM weekly_checkins c JOIN weekly_plans p ON p.week_start=c.week_start
      WHERE p.chat_id=? AND p.status='active' ORDER BY c.occurred_at DESC,c.id DESC LIMIT 1`).bind(chatId).first<{note:string;occurred_at:number}>(),
    db.prepare(`SELECT ROUND(AVG(processing_started_at-queued_at)) AS queue_ms,
      ROUND(AVG(processing_finished_at-processing_started_at)) AS processing_ms,
      ROUND(AVG(delivery_finished_at-delivery_started_at)) AS delivery_ms,
      ROUND(AVG(CASE WHEN route LIKE 'ai%' THEN ai_finished_at-ai_started_at END)) AS ai_ms,
      SUM(CASE WHEN route LIKE 'ai%' THEN 1 ELSE 0 END) AS ai_count
      FROM (SELECT m.* FROM job_metrics m JOIN jobs j ON j.id=m.job_id WHERE j.chat_id=? ORDER BY m.job_id DESC LIMIT 10)`).bind(chatId)
      .first<{queue_ms:number|null;processing_ms:number|null;delivery_ms:number|null;ai_ms:number|null;ai_count:number|null}>(),
  ]);
  const reminders = (preference?.weekly_progress_enabled ?? 1) === 1
    ? `bật lúc ${String(preference?.delivery_hour ?? 20).padStart(2,'0')}:00` : 'đang tắt';
  const milliseconds = (value:number|null|undefined) => value === null || value === undefined ? 'chưa đủ dữ liệu' : `${value}ms`;
  const performance = latency ? `• 10 tin gần: Queue ${milliseconds(latency.queue_ms)} · xử lý ${milliseconds(latency.processing_ms)} · gửi ${milliseconds(latency.delivery_ms)}${latency.ai_count ? ` · AI ${milliseconds(latency.ai_ms)} (${latency.ai_count} tin)` : ''}` : '';
  return `Trạng thái Navi\n• Tin /status này vừa được Worker xử lý.\n• Kế hoạch tuần: ${plan ? `đang theo dõi “${plan.goal}”` : 'chưa có'}\n• Task mở: ${openTasks?.count ?? 0}\n• Nhắc tiến độ: ${reminders}\n${performance}\n• Check-in gần nhất: ${latest ? `“${latest.note}” (${formatLocalTime(latest.occurred_at)})` : 'chưa có'}`;
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

async function focusBrief(db: D1Database, plan: WeeklyPlan, now: number): Promise<string> {
  const [items, open, checkins] = await Promise.all([
    ensurePlanItems(db, plan, now),
    tasks(db),
    db.prepare(`SELECT i.kind,i.title,c.quantity,c.local_date,c.actual_value,c.met_threshold
      FROM weekly_checkins c JOIN weekly_plan_items i ON i.id=c.plan_item_id
      WHERE c.week_start=? ORDER BY c.occurred_at DESC,c.id DESC LIMIT 6`).bind(plan.week_start)
      .all<{kind:PlanItem['kind'];title:string;quantity:number;local_date:string|null;actual_value:number|null;met_threshold:number|null}>(),
  ]);
  const planLines = items.map(item => {
    const progress = item.metric === 'completion' ? (item.status === 'completed' ? 'đã hoàn thành' : 'chưa hoàn thành') : `${item.completed}/${item.target_count}`;
    return `- ${item.kind}: ${item.title} — ${progress}`;
  });
  const taskLines = open.length ? open.slice(0,6).map(task => `- ${task.id}: ${task.title}${task.goal_title ? ` (hỗ trợ ${task.goal_title})` : ' (việc riêng)'}`) : ['- không có task mở'];
  const checkinLines = checkins.results.length
    ? checkins.results.map(checkin => `- ${checkin.kind}: ${checkin.title} — ${checkin.quantity}${checkin.local_date ? `, ngày ${checkin.local_date}` : ''}${checkin.actual_value !== null ? `, ${checkin.actual_value} phút` : ''}${checkin.met_threshold === 0 ? ', chưa đạt ngưỡng' : ''}`)
    : ['- chưa có check-in'];
  return `Tuần ${plan.week_start}\nMục tiêu: ${plan.goal}\nCam kết: ${plan.commitment}\n\nTiến độ kế hoạch:\n${planLines.join('\n')}\n\nTask mở:\n${taskLines.join('\n')}\n\nCheck-in gần nhất:\n${checkinLines.join('\n')}`;
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
export async function processNext(db: D1Database, now = Date.now(), assistant?: Assistant, structuredAssistant?: StructuredAssistant, focusAssistant?: FocusAssistant): Promise<boolean> {
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
    let result = '';
    let replyMarkup: ReplyMarkup | undefined;
    let route = 'local';
    let aiStartedAt: number|undefined;
    let aiFinishedAt: number|undefined;
    const draft = await db.prepare("SELECT id,chat_id,step,goal,commitment,habit1,habit2,week_start FROM weekly_drafts WHERE id=1 AND chat_id=?").bind(job.chat_id).first<WeeklyDraft>();
    if (job.attempts >= 3) {
      result = 'Em chưa xử lý được yêu cầu này sau ba lần thử. Anh gửi lại yêu cầu giúp em; em chưa đánh dấu việc đã xong.';
    } else if (draft && command.kind !== 'measurement' && command.kind !== 'cancelMeasurement' && command.kind !== 'week' && command.kind !== 'weekStatus' && command.kind !== 'progressList' && command.kind !== 'progressChange' && command.kind !== 'checkInChange' && command.kind !== 'checkInSelect' && command.kind !== 'today' && command.kind !== 'schedule' && command.kind !== 'defer' && command.kind !== 'clearSchedule' && command.kind !== 'review' && command.kind !== 'reminders' && command.kind !== 'focus' && command.kind !== 'focusFeedback' && command.kind !== 'help') {
      const value = job.text.trim().replace(/\s+/g, ' ');
      if (draft.step === 'confirm') {
        if (command.kind === 'confirm' && (!command.target || command.target === `weekly:${draft.week_start}`)) {
          statements.push(db.prepare(`INSERT INTO weekly_plans(week_start,chat_id,goal,commitment,habit1,habit2,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`)
            .bind(draft.week_start, draft.chat_id, draft.goal, draft.commitment, draft.habit1, draft.habit2, now, ...args()));
          statements.push(db.prepare(`UPDATE weekly_plans SET status='archived' WHERE chat_id=? AND week_start<>? AND status='active' AND ${guard}`)
            .bind(draft.chat_id,draft.week_start,...args()));
          for (const item of planItemValues({ goal:draft.goal!, commitment:draft.commitment!, habit1:draft.habit1!, habit2:draft.habit2! })) {
            const habit = item.kind === 'habit' ? habitSpec(item.title) : undefined;
            statements.push(db.prepare(`INSERT INTO weekly_plan_items(week_start,kind,position,title,normalized_title,metric,target_count,cadence,minimum_value,minimum_unit,created_at)
              SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE ${guard}`).bind(draft.week_start,item.kind,item.position,item.title,normalize(item.title),item.metric,item.target ?? null,habit?.cadence ?? null,habit?.minimumValue ?? null,habit?.minimumUnit ?? null,now,...args()));
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
        const previous = command.continueGoal ? await db.prepare("SELECT goal FROM weekly_plans WHERE chat_id=? AND status='active' AND week_start<? ORDER BY week_start DESC LIMIT 1")
          .bind(job.chat_id,date).first<{goal:string}>() : undefined;
        if (command.continueGoal && !previous) result = 'Em chưa thấy mục tiêu tuần trước để tiếp tục. Anh dùng /week để lập kế hoạch mới nhé.';
        else {
          statements.push(db.prepare(`INSERT OR IGNORE INTO weekly_drafts(id,chat_id,step,goal,week_start,created_at) SELECT 1,?,?,?,?,? WHERE ${guard}`)
            .bind(job.chat_id,previous ? 'commitment' : 'goal',previous?.goal ?? null,date,now,...args()));
          result = `Mình lập kế hoạch tuần bắt đầu ${date} nhé.${previous ? `\n\nTiếp tục mục tiêu: ${previous.goal}.` : ''}${carryovers.length ? `\n\nTask giữ từ tuần trước:\n${carryovers.map(task=>`• ${task.id}: ${task.title}`).join('\n')}` : ''}\n\n${previous ? 'Cam kết cá nhân tuần này của anh là gì?' : 'Mục tiêu công việc quan trọng nhất của anh là gì?'}`;
        }
      }
    } else if (command.kind === 'goal') {
      if (command.action === 'history') {
        const history = (await db.prepare(`SELECT g.id,g.title,g.status,COUNT(DISTINCT i.week_start) AS weeks,
          SUM(CASE WHEN t.status='open' THEN 1 ELSE 0 END) AS open_tasks
          FROM goals g LEFT JOIN weekly_plan_items i ON i.goal_id=g.id
          LEFT JOIN tasks t ON t.goal_id=g.id WHERE g.chat_id=?
          GROUP BY g.id ORDER BY CASE g.status WHEN 'active' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END,g.created_at DESC LIMIT 12`).bind(job.chat_id)
          .all<{id:number;title:string;status:'active'|'completed'|'archived';weeks:number;open_tasks:number}>()).results;
        result = history.length ? `Lịch sử mục tiêu\n${history.map(goal=>`• ${goal.title} — ${goal.status === 'active' ? 'đang theo dõi' : goal.status === 'completed' ? 'đã đạt' : 'đã lưu trữ'} · ${goal.weeks} tuần · ${goal.open_tasks ?? 0} task mở`).join('\n')}\n\nDùng /goal để xem mục tiêu tuần này.` : 'Chưa có mục tiêu nào trong lịch sử.';
      } else {
      const currentWeek = weekStart(now);
      const plan = await db.prepare("SELECT week_start,chat_id,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'")
        .bind(currentWeek,job.chat_id).first<WeeklyPlan>();
      if (!plan) result = 'Tuần này chưa có mục tiêu đang theo dõi. Anh nhắn /week để lập kế hoạch nhé.';
      else {
        const goalItem = (await ensurePlanItems(db,plan,now)).find(item=>item.kind==='goal');
        const goal = goalItem?.goal_id ? await db.prepare('SELECT id,title,normalized_title,status FROM goals WHERE id=? AND chat_id=?').bind(goalItem.goal_id,job.chat_id).first<{id:number;title:string;normalized_title:string;status:'active'|'completed'|'archived'}>() : undefined;
        if (!goal || !goalItem) result = 'Em chưa tạo được dữ liệu mục tiêu tuần này. Anh thử lại /goal giúp em.';
        else if (goal.status === 'archived' && (command.action === 'attach' || command.action === 'detach' || command.action === 'complete' || command.action === 'rename')) result = `Mục tiêu “${goal.title}” đang được lưu trữ. Anh dùng /goal reopen trước khi thay đổi.`;
        else if (command.action === 'complete' || command.action === 'reopen' || command.action === 'archive') {
          const action = command.action === 'complete' ? 'complete' : 'reopen';
          const actionName = command.action === 'archive' ? 'archive' : action;
          result = actionName === 'complete' ? `Anh muốn đánh dấu mục tiêu “${goal.title}” đã đạt. Task hoàn thành không tự quyết định điều này. Anh bấm nút để xác nhận.`
            : actionName === 'archive' ? `Anh muốn lưu trữ mục tiêu “${goal.title}”. Task đang mở vẫn được giữ nguyên. Anh bấm nút để xác nhận.`
            : `Anh muốn mở lại mục tiêu “${goal.title}”. Anh bấm nút để xác nhận.`;
          replyMarkup = confirmationButtons(`goal:${actionName}:${goal.id}`);
        } else if (command.action === 'rename') {
          const nextTitle = command.title!;
          if (normalize(nextTitle) === goal.normalized_title) result = 'Tên mục tiêu này chưa thay đổi.';
          else {
            statements.push(db.prepare(`INSERT INTO goal_rename_requests(chat_id,goal_id,new_title,normalized_new_title,created_at)
              SELECT ?,?,?,?,? WHERE ${guard}`).bind(job.chat_id,goal.id,nextTitle,normalize(nextTitle),now,...args()));
            result = `Anh muốn đổi mục tiêu từ “${goal.title}” thành “${nextTitle}”. Lịch sử và task gắn mục tiêu sẽ được giữ nguyên. Anh bấm nút để xác nhận.`;
            replyMarkup = confirmationButtons(`goalrename:${job.update_id}`);
          }
        } else if (command.action === 'attach' || command.action === 'detach') {
          const taskCandidates = command.taskId === 'đó'
            ? (await db.prepare("SELECT id,title,status,goal_id FROM tasks WHERE status='open' ORDER BY created_at DESC,id DESC LIMIT 2").all<{id:string;title:string;status:string;goal_id:number|null}>()).results
            : (await db.prepare('SELECT id,title,status,goal_id FROM tasks WHERE id=?').bind(command.taskId).all<{id:string;title:string;status:string;goal_id:number|null}>()).results;
          const task = taskCandidates.length === 1 ? taskCandidates[0] : undefined;
          if (!task) result = taskCandidates.length > 1 ? 'Có nhiều task gần đây. Anh dùng /goal add T... để em gắn đúng task nhé.' : 'Em không thấy task này. Anh dùng /list để xem mã task nhé.';
          else if (command.action === 'attach') {
            statements.push(db.prepare(`UPDATE tasks SET goal_id=? WHERE id=? AND ${guard}`).bind(goal.id,task.id,...args()));
            result = `Đã gắn ${task.id}: ${task.title} với mục tiêu “${goal.title}”.`;
          } else if (task.goal_id !== goal.id) result = `${task.id} hiện không thuộc mục tiêu “${goal.title}”.`;
          else {
            statements.push(db.prepare(`UPDATE tasks SET goal_id=NULL WHERE id=? AND ${guard}`).bind(task.id,...args()));
            result = `Đã chuyển ${task.id}: ${task.title} thành việc riêng.`;
          }
        } else {
          const [linked,independent] = await Promise.all([
            db.prepare("SELECT id,title,status FROM tasks WHERE goal_id=? ORDER BY status,created_at,id LIMIT 10").bind(goal.id).all<{id:string;title:string;status:'open'|'done'}>(),
            db.prepare("SELECT id,title FROM tasks WHERE status='open' AND goal_id IS NULL ORDER BY created_at,id LIMIT 4").all<{id:string;title:string}>(),
          ]);
          result = `Mục tiêu\n${goal.title}\nTrạng thái: ${goal.status === 'completed' ? 'đã đạt' : 'đang theo dõi'}\n\nTask hỗ trợ:\n${linked.results.length ? linked.results.map(task=>`• ${task.status === 'done' ? '✓' : '○'} ${task.id}: ${task.title}`).join('\n') : 'Chưa có task nào gắn mục tiêu này.'}${independent.results.length ? `\n\nViệc riêng có thể gắn:\n${independent.results.map(task=>`• ${task.id}: ${task.title}`).join('\n')}` : ''}\n\nGắn: /goal add T...\nBỏ gắn: /goal remove T...`;
          const buttons: ReplyMarkup['inline_keyboard'] = [];
          for (const task of independent.results.slice(0,2)) buttons.push([{text:`Gắn ${task.id}`,callback_data:`_navi:goal:attach:${task.id}`}]);
          for (const task of linked.results.filter(task=>task.status==='open').slice(0,2)) buttons.push([{text:`Bỏ gắn ${task.id}`,callback_data:`_navi:goal:detach:${task.id}`}]);
          replyMarkup = buttons.length ? {inline_keyboard:buttons} : undefined;
        }
      }
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
        const taskCandidates = command.carry === 'đó'
          ? (await db.prepare("SELECT id,title,status,revision,due_at FROM tasks WHERE status='open' ORDER BY created_at DESC,id DESC LIMIT 2").all<Task>()).results
          : (await db.prepare("SELECT id,title,status,revision,due_at FROM tasks WHERE id=? AND status='open'").bind(command.carry).all<Task>()).results;
        const task = taskCandidates.length === 1 ? taskCandidates[0] : undefined;
        if (!task) result = taskCandidates.length > 1 ? 'Có nhiều task gần đây. Anh dùng /review carry T... để chọn đúng task nhé.' : 'Task này không còn mở nên không cần chuyển tuần.';
        else {
          const next = weekEnd(currentWeek);
          const nextMonday = new Date(`${next}T00:00:00Z`); nextMonday.setUTCDate(nextMonday.getUTCDate()+1);
          const nextWeek = nextMonday.toISOString().slice(0,10);
          statements.push(db.prepare(`INSERT OR IGNORE INTO weekly_task_carryovers(week_start,task_id,decided_at) SELECT ?,?,? WHERE ${guard}`).bind(nextWeek, task.id, now, ...args()));
          result = `Đã đánh dấu ${task.id} cho tuần bắt đầu ${nextWeek}. Task vẫn giữ nguyên, không bị nhân đôi.`;
        }
      } else {
        const plan = await db.prepare("SELECT week_start,chat_id,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'").bind(currentWeek, job.chat_id).first<WeeklyPlan>();
        if (!plan) result = 'Tuần này chưa có kế hoạch để review. Anh nhắn /week để lập kế hoạch nhé.';
        else {
          const summary = await weeklyReviewSummary(db,plan,now);
          result = summary.text;
          replyMarkup = summary.replyMarkup;
        }
      }
    } else if (command.kind === 'focusFeedback') {
      const focusJob = await db.prepare(`SELECT j.id FROM jobs j JOIN job_metrics m ON m.job_id=j.id
        WHERE j.id=? AND j.chat_id=? AND j.status='done' AND m.route='ai_focus'`).bind(command.focusJobId,job.chat_id).first<{id:number}>();
      const existing = focusJob ? await db.prepare('SELECT verdict FROM focus_feedback WHERE focus_job_id=? AND chat_id=?').bind(focusJob.id,job.chat_id).first<{verdict:'helpful'|'not_helpful'}>() : undefined;
      if (!focusJob) result = 'Đánh giá này không còn gắn với một gợi ý hợp lệ của anh.';
      else if (existing) result = 'Anh đã đánh giá gợi ý này rồi. Em giữ nguyên đánh giá đầu tiên để số liệu không bị lệch.';
      else {
        statements.push(db.prepare(`INSERT INTO focus_feedback(chat_id,focus_job_id,verdict,created_at)
          SELECT ?,?,?,? WHERE ${guard}`).bind(job.chat_id,focusJob.id,command.verdict,now,...args()));
        result = command.verdict === 'helpful'
          ? 'Đã ghi nhận gợi ý này hữu ích. Em sẽ tiếp tục giữ cách gợi ý ngắn và có hành động cụ thể.'
          : 'Đã ghi nhận gợi ý này chưa đúng. Em sẽ dùng tín hiệu này để chỉnh cách chọn trọng tâm.';
      }
    } else if (command.kind === 'focus') {
      if (command.status) {
        const feedback = await db.prepare(`SELECT COUNT(*) AS total,
          SUM(CASE WHEN verdict='helpful' THEN 1 ELSE 0 END) AS helpful,
          SUM(CASE WHEN verdict='not_helpful' THEN 1 ELSE 0 END) AS not_helpful
          FROM focus_feedback WHERE chat_id=?`).bind(job.chat_id).first<{total:number;helpful:number|null;not_helpful:number|null}>();
        const total = feedback?.total ?? 0, helpful = feedback?.helpful ?? 0, notHelpful = feedback?.not_helpful ?? 0;
        result = total === 0 ? 'Focus chưa có đánh giá nào. Sau mỗi gợi ý, anh bấm “Hữu ích” hoặc “Chưa đúng” để em đo chất lượng.'
          : `Đánh giá Focus\n• Đã đánh giá: ${total} gợi ý\n• Hữu ích: ${helpful}\n• Chưa đúng: ${notHelpful}\n• Tỷ lệ hữu ích: ${Math.round(helpful / total * 100)}%\n\nĐây là tín hiệu pilot, chưa đủ để tự thay đổi kế hoạch của anh.`;
      } else {
      const plan = await db.prepare("SELECT week_start,chat_id,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'")
        .bind(weekStart(now), job.chat_id).first<WeeklyPlan>();
      if (!plan) result = 'Tuần này chưa có kế hoạch để em đưa gợi ý. Anh nhắn /week để lập kế hoạch nhé.';
      else if (!focusAssistant) result = 'Review AI hiện chưa được cấu hình. Anh vẫn có thể dùng /review để xem tổng kết theo dữ liệu.';
      else if (await reserveAi(db, now)) {
        route = 'ai_focus';
        aiStartedAt = Date.now();
        const suggestion = await focusAssistant(await focusBrief(db,plan,now));
        aiFinishedAt = Date.now();
        result = `Gợi ý ưu tiên\n${suggestion}`;
        replyMarkup = focusFeedbackButtons(job.id);
      } else {
        route = 'ai_budget_limited';
        result = 'Tháng này em đã chạm ngân sách AI dự phòng. Anh dùng /review để xem tổng kết theo dữ liệu.';
      }
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
    } else if (command.kind === 'cancelMeasurement') {
      statements.push(db.prepare(`UPDATE checkin_measurement_requests SET status='expired',decided_at=? WHERE chat_id=? AND status='pending' AND (? IS NULL OR source_update=?) AND ${guard}`).bind(now,job.chat_id,command.sourceUpdate ?? null,command.sourceUpdate ?? null,...args()));
      result = 'Đã hủy câu hỏi số phút đang chờ. Chưa ghi thêm tiến độ.';
    } else if (command.kind === 'measurement') {
      statements.push(db.prepare(`UPDATE checkin_measurement_requests SET status='expired',decided_at=? WHERE chat_id=? AND status='pending' AND expires_at<=? AND ${guard}`).bind(now,job.chat_id,now,...args()));
      const requests = (await db.prepare(`SELECT r.id AS request_id,r.week_start AS request_week_start,r.local_date AS request_local_date,
        i.id,i.kind,i.position,i.title,i.normalized_title,i.metric,i.target_count,i.status,i.goal_id,i.habit_id,i.cadence,i.minimum_value,i.minimum_unit,
        COALESCE(SUM(CASE WHEN COALESCE(c.met_threshold,1)=1 THEN c.quantity ELSE 0 END),0) AS completed
        FROM checkin_measurement_requests r JOIN weekly_plan_items i ON i.id=r.plan_item_id
        LEFT JOIN weekly_checkins c ON c.plan_item_id=i.id
        WHERE r.chat_id=? AND r.status='pending' AND r.expires_at>?
        GROUP BY r.id,i.id ORDER BY r.created_at DESC,r.id DESC LIMIT 2`).bind(job.chat_id,now).all<MeasurementRequest>()).results;
      const pending = requests[0];
      if (requests.length > 1) result = 'Có nhiều câu hỏi số phút đang chờ. Anh gửi lại tên thói quen kèm số phút để em ghi đúng mục nhé.';
      else if (!pending) result = 'Em chưa có câu hỏi số phút nào đang chờ hoặc câu hỏi đã hết hạn. Anh gửi lại cập nhật thói quen kèm số phút giúp em nhé.';
      else if (pending.minimum_unit !== command.unit) result = `Em đang cần số phút cho “${pending.title}”.`;
      else {
        const occurredAt = Date.parse(`${pending.request_local_date}T12:00:00+07:00`);
        const staged = await stageCheckIn(db,statements,guard,args,{item:pending,text:`Đã thực hiện ${command.value} phút`,weekStart:pending.request_week_start,sourceUpdate:job.update_id,occurredAt,localDate:pending.request_local_date,chatId:job.chat_id,outcome:'recorded'});
        statements.push(db.prepare(`UPDATE checkin_measurement_requests SET status='recorded',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now,pending.request_id,...args()));
        if (staged.already) result = `Ngày ${pending.request_local_date} của “${pending.title}” đã được ghi trước đó.`;
        else {
          result = staged.metThreshold === false
            ? `Đã ghi ${command.value}/${pending.minimum_value} phút cho “${pending.title}”. Ngày này chưa tính vào tiến độ.`
            : `Đã ghi nhận ${command.value} phút cho “${pending.title}”: ${staged.progress}, ngày ${pending.request_local_date}.`;
          replyMarkup = progressButton;
        }
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
          const checkIn = {item,text:command.text,weekStart:currentWeek,sourceUpdate:job.update_id,occurredAt,chatId:job.chat_id,outcome:'recorded' as const};
          const staged = await stageCheckIn(db,statements,guard,args,checkIn);
          if (staged.needsMeasurement) {
            stageMeasurementRequest(db,statements,guard,args,checkIn,now);
            result = `Em đang chờ số phút cho “${item.title}”, ngày ${checkInDate(checkIn.text,occurredAt)}. Anh chỉ cần trả lời, ví dụ: 5 phút. Câu hỏi này thay câu hỏi số phút trước đó, có hiệu lực 24 giờ.`;
            replyMarkup = {inline_keyboard:[[{text:'Hủy câu hỏi',callback_data:`_navi:measurement:cancel:${job.update_id}`}]]};
          }
          else if (staged.already) result = `Cập nhật này đã được ghi trước đó cho “${item.title}”.`;
          else {
            result = staged.metThreshold === false
              ? `Đã ghi ${staged.actualValue}/${item.minimum_value} phút cho “${item.title}”. Ngày này chưa tính vào tiến độ.`
              : `Đã ghi nhận cho “${item.title}”: ${staged.progress}.`;
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
      const item = selection && !expired && candidateIds.includes(command.itemId) ? await db.prepare(`SELECT i.id,i.kind,i.position,i.title,i.normalized_title,i.metric,i.target_count,i.status,i.goal_id,i.habit_id,i.cadence,i.minimum_value,i.minimum_unit,
        COALESCE(SUM(CASE WHEN i.kind='habit' THEN COALESCE(c.met_threshold,1)*c.quantity ELSE c.quantity END),0) AS completed FROM weekly_plan_items i LEFT JOIN weekly_checkins c ON c.plan_item_id=i.id
        WHERE i.id=? AND i.week_start=? GROUP BY i.id`).bind(command.itemId,selection.week_start).first<PlanItem>() : undefined;
      if (!selection || !item) {
        if (selection && expired) statements.push(db.prepare(`UPDATE checkin_selection_requests SET status='rejected',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now,selection.id,...args()));
        result = 'Lựa chọn này không còn hiệu lực. Anh gửi lại cập nhật để Navi hỏi lại nhé.';
      }
      else {
        const checkIn = {item,text:selection.text,weekStart:selection.week_start,sourceUpdate:selection.source_update,occurredAt:now,chatId:job.chat_id,outcome:'selected' as const};
        const staged = await stageCheckIn(db,statements,guard,args,checkIn);
        if (staged.needsMeasurement) {
          stageMeasurementRequest(db,statements,guard,args,checkIn,now);
          statements.push(db.prepare(`UPDATE checkin_selection_requests SET status='selected',selected_item_id=?,decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(item.id,now,selection.id,...args()));
          result = `Em đang chờ số phút cho “${item.title}”, ngày ${checkInDate(selection.text,now)}. Anh chỉ cần trả lời, ví dụ: 5 phút. Câu hỏi này thay câu hỏi số phút trước đó, có hiệu lực 24 giờ.`;
          replyMarkup = {inline_keyboard:[[{text:'Hủy câu hỏi',callback_data:`_navi:measurement:cancel:${selection.source_update}`}]]};
        }
        else if (staged.already) result = `Cập nhật này đã được ghi cho “${item.title}”.`;
        else {
          statements.push(db.prepare(`UPDATE checkin_selection_requests SET status='selected',selected_item_id=?,decided_at=? WHERE id=? AND status='pending' AND ${guard}`)
            .bind(item.id,now,selection.id,...args()));
          result = staged.metThreshold === false
            ? `Đã ghi ${staged.actualValue}/${item.minimum_value} phút cho “${item.title}”. Ngày này chưa tính vào tiến độ.`
            : `Đã ghi nhận cho “${item.title}”: ${staged.progress}.`;
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
      const plan = await db.prepare("SELECT week_start,chat_id,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'")
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
          const page = Math.max(0,command.page), pageSize = 6, offset = page * pageSize;
          const [checkins, events, streaks] = await Promise.all([
            db.prepare(`SELECT c.id,c.note,c.source_update,i.kind AS item_kind,i.position AS item_position,i.title AS item_title
              FROM weekly_checkins c JOIN weekly_plan_items i ON i.id=c.plan_item_id
              WHERE c.week_start=? ORDER BY c.id DESC LIMIT ? OFFSET ?`).bind(currentWeek,pageSize+1,offset).all<{id:number;note:string;source_update:number;item_kind:PlanItem['kind'];item_position:number;item_title:string}>(),
            db.prepare(`SELECT e.id,e.kind,e.label,e.normalized_label,e.source_update FROM weekly_progress_events e
              WHERE e.week_start=? AND NOT EXISTS(SELECT 1 FROM weekly_checkins c WHERE c.source_update=e.source_update)
              ORDER BY e.id DESC LIMIT ? OFFSET ?`).bind(currentWeek,pageSize+1,offset).all<ProgressEvent>(),
            habitStreaks(db, currentWeek, now),
          ]);
          const hasNext = checkins.results.length > pageSize || events.results.length > pageSize;
          const visibleCheckins = checkins.results.slice(0,pageSize), visibleEvents = events.results.slice(0,pageSize);
          result = `Tiến độ tuần ${currentWeek}${page === 0 ? formatPlanItems(items,true,streaks) : ''}\n\nLịch sử gần đây · trang ${page+1}\n${formatCheckIns(visibleCheckins)}${visibleEvents.length ? `\n\n${formatUngroupedProgressEvents(visibleEvents)}` : ''}`;
          replyMarkup = progressPageButtons(page,hasNext);
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
      let goalId: number|null = null, goalTitle: string|undefined, canAdd = true;
      if (command.goalScoped) {
        const plan = await db.prepare("SELECT week_start,chat_id,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'")
          .bind(weekStart(now),job.chat_id).first<WeeklyPlan>();
        if (!plan) { result = 'Tuần này chưa có mục tiêu để gắn việc. Anh nhắn /week để lập kế hoạch, hoặc dùng /add để thêm việc riêng.'; canAdd = false; }
        else {
          const goal = (await ensurePlanItems(db,plan,now)).find(item => item.kind === 'goal');
          goalId = goal?.goal_id ?? null;
          goalTitle = goal?.title;
          if (!goalId) { result = 'Em chưa tạo được mục tiêu tuần để gắn việc. Anh thử lại giúp em.'; canAdd = false; }
        }
      }
      if (canAdd) {
        statements.push(db.prepare(`INSERT INTO tasks(id,title,normalized_title,source_update,created_at,goal_id) SELECT ?,?,?,?,?,? WHERE ${guard}`)
          .bind(id, command.title, normalize(command.title), job.update_id, now, goalId, ...args()));
        result = `Đã thêm ${id}: ${command.title}${goalTitle ? `\nGắn với mục tiêu: ${goalTitle}.` : '\nĐây là việc riêng.'}\nKhi xong, anh nhắn /done ${id}.`;
      }
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
      result = list.length ? list.slice(0, 20).map(t => `${t.status === 'done' ? '✓' : '○'} ${t.id}: ${t.title.slice(0, 140)}${t.goal_title ? ` — mục tiêu: ${t.goal_title}` : ' — việc riêng'}`).join('\n')
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
      const renameTarget = command.target?.match(/^goalrename:(\d+)$/u);
      if (renameTarget) {
        const change = await db.prepare(`SELECT id,goal_id,new_title,normalized_new_title FROM goal_rename_requests WHERE chat_id=? AND status='pending' ORDER BY created_at DESC LIMIT 1`)
          .bind(job.chat_id).first<{id:number;goal_id:number;new_title:string;normalized_new_title:string}>();
        const goal = change ? await db.prepare('SELECT id,title FROM goals WHERE id=? AND chat_id=?').bind(change.goal_id,job.chat_id).first<{id:number;title:string}>() : undefined;
        if (!change || !goal) result = 'Đề xuất đổi tên mục tiêu này không còn hiệu lực.';
        else if (command.kind === 'reject') {
          statements.push(db.prepare(`UPDATE goal_rename_requests SET status='rejected',decided_at=? WHERE id=? AND ${guard}`).bind(now,change.id,...args()));
          result = 'Đã giữ nguyên tên mục tiêu.';
        } else {
          const duplicate = await db.prepare('SELECT id FROM goals WHERE chat_id=? AND normalized_title=? AND id<>?').bind(job.chat_id,change.normalized_new_title,goal.id).first<{id:number}>();
          if (duplicate) result = 'Tên mới đã thuộc một mục tiêu khác. Em chưa đổi để không nhập nhầm lịch sử.';
          else {
            statements.push(db.prepare(`UPDATE goals SET title=?,normalized_title=? WHERE id=? AND ${guard}`).bind(change.new_title,change.normalized_new_title,goal.id,...args()));
            statements.push(db.prepare(`UPDATE weekly_plans SET goal=? WHERE chat_id=? AND status='active' AND week_start IN (SELECT week_start FROM weekly_plan_items WHERE goal_id=?) AND ${guard}`).bind(change.new_title,job.chat_id,goal.id,...args()));
            statements.push(db.prepare(`UPDATE goal_rename_requests SET status='approved',decided_at=? WHERE id=? AND ${guard}`).bind(now,change.id,...args()));
            result = `Đã đổi mục tiêu từ “${goal.title}” thành “${change.new_title}”. Lịch sử và task gắn mục tiêu được giữ nguyên.`;
          }
        }
      } else {
      const goalTarget = command.target?.match(/^goal:(complete|reopen|archive):(\d+)$/u);
      if (goalTarget) {
        const goal = await db.prepare('SELECT id,title,status FROM goals WHERE id=? AND chat_id=?').bind(Number(goalTarget[2]),job.chat_id).first<{id:number;title:string;status:string}>();
        if (!goal) result = 'Mục tiêu này không còn tồn tại hoặc không thuộc cuộc trò chuyện này.';
        else if (command.kind === 'reject') result = 'Đã giữ nguyên trạng thái mục tiêu.';
        else {
          const status = goalTarget[1] === 'complete' ? 'completed' : goalTarget[1] === 'archive' ? 'archived' : 'active';
          statements.push(db.prepare(`UPDATE goals SET status=? WHERE id=? AND chat_id=? AND ${guard}`).bind(status,goal.id,job.chat_id,...args()));
          result = status === 'completed' ? `Đã đánh dấu mục tiêu “${goal.title}” đã đạt.` : status === 'archived' ? `Đã lưu trữ mục tiêu “${goal.title}”.` : `Đã mở lại mục tiêu “${goal.title}”.`;
        }
      } else {
      const checkinChange = command.target && !command.target.startsWith('checkin:') ? undefined
        : await db.prepare(`SELECT id,checkin_id,action,new_note FROM checkin_change_requests WHERE chat_id=? AND status='pending'
          ${command.target?.startsWith('checkin:') ? 'AND checkin_id=?' : ''} ORDER BY created_at DESC LIMIT 1`)
          .bind(job.chat_id,...(command.target?.startsWith('checkin:') ? [Number(command.target.slice(8))] : [])).first<CheckInChange>();
      if (checkinChange) {
        const checkin = await db.prepare(`SELECT c.id,c.note,c.plan_item_id,c.source_update,i.kind,i.minimum_value,i.minimum_unit
          FROM weekly_checkins c JOIN weekly_plans p ON p.week_start=c.week_start JOIN weekly_plan_items i ON i.id=c.plan_item_id
          WHERE c.id=? AND p.chat_id=? AND p.status='active'`).bind(checkinChange.checkin_id,job.chat_id)
          .first<{id:number;note:string;plan_item_id:number;source_update:number;kind:PlanItem['kind'];minimum_value:number|null;minimum_unit:string|null}>();
        if (command.kind === 'reject') {
          statements.push(db.prepare(`UPDATE checkin_change_requests SET status='rejected',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now,checkinChange.id,...args()));
          result = 'Đã giữ nguyên check-in.';
        } else if (!checkin) {
          statements.push(db.prepare(`UPDATE checkin_change_requests SET status='rejected',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now,checkinChange.id,...args()));
          result = 'Check-in này không còn tồn tại nên em không thay đổi thêm.';
        } else if (checkinChange.action === 'delete') {
          statements.push(db.prepare(`DELETE FROM weekly_checkins WHERE id=? AND ${guard}`).bind(checkin.id,...args()));
          statements.push(db.prepare(`DELETE FROM weekly_progress_events WHERE source_update=? AND ${guard}`).bind(checkin.source_update,...args()));
          statements.push(db.prepare(`UPDATE weekly_plan_items SET status=CASE
            WHEN metric='completion' AND EXISTS(SELECT 1 FROM weekly_checkins WHERE plan_item_id=?) THEN 'completed'
            WHEN metric='completion' THEN 'active'
            WHEN COALESCE((SELECT SUM(CASE WHEN COALESCE(met_threshold,1)=1 THEN quantity ELSE 0 END) FROM weekly_checkins WHERE plan_item_id=?),0)>=target_count THEN 'completed'
            ELSE 'active' END WHERE id=? AND ${guard}`).bind(checkin.plan_item_id,checkin.plan_item_id,checkin.plan_item_id,...args()));
          statements.push(db.prepare(`UPDATE checkin_change_requests SET status='approved',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now,checkinChange.id,...args()));
          result = `Đã xoá C${checkin.id}: “${checkin.note}”.`;
        } else {
          statements.push(db.prepare(`UPDATE weekly_checkins SET note=?,normalized_note=? WHERE id=? AND ${guard}`)
            .bind(checkinChange.new_note!,normalize(checkinChange.new_note!),checkin.id,...args()));
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
        : await db.prepare(`SELECT id,source_update,title,goal_scoped,status FROM approval_requests WHERE chat_id=? AND status='pending'
          ${command.target?.startsWith('task:') ? 'AND source_update=?' : ''} ORDER BY created_at DESC LIMIT 1`)
          .bind(job.chat_id, ...(command.target?.startsWith('task:') ? [Number(command.target.slice(5))] : [])).first<Approval>();
      if (!approval) result = 'Hiện không có đề xuất nào đang chờ xác nhận.';
      else if (command.kind === 'reject') {
        statements.push(db.prepare(`UPDATE approval_requests SET status='rejected',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now, approval.id, ...args()));
        result = `Đã bỏ đề xuất thêm việc: ${approval.title}`;
      } else {
        const taskId = `T${approval.source_update}`;
        let goalId: number|null = null, goalTitle: string|undefined;
        if (approval.goal_scoped) {
          const plan = await db.prepare("SELECT week_start,chat_id,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'")
            .bind(weekStart(now),job.chat_id).first<WeeklyPlan>();
          const goal = plan ? (await ensurePlanItems(db,plan,now)).find(item=>item.kind==='goal') : undefined;
          goalId = goal?.goal_id ?? null;
          goalTitle = goal?.title;
          if (!goalId) {
            statements.push(db.prepare(`UPDATE approval_requests SET status='rejected',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now,approval.id,...args()));
            result = 'Mục tiêu tuần hiện tại không còn để gắn task này. Em đã bỏ đề xuất; anh có thể tạo lại bằng /add.';
          }
        }
        if (result === '') {
          statements.push(db.prepare(`INSERT INTO tasks(id,title,normalized_title,source_update,created_at,goal_id) SELECT ?,?,?,?,?,? WHERE ${guard}`).bind(taskId, approval.title, normalize(approval.title), approval.source_update, now, goalId, ...args()));
          statements.push(db.prepare(`UPDATE approval_requests SET status='approved',decided_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(now, approval.id, ...args()));
          result = `Đã xác nhận và thêm ${taskId}: ${approval.title}${goalTitle ? `\nGắn với mục tiêu: ${goalTitle}.` : ''}\nKhi xong, anh nhắn /done ${taskId}.`;
        }
      }
      }
      }
      }
      }
    } else if (command.kind === 'help') result = `${help}\n\nMục tiêu\n/goal — xem mục tiêu và task hỗ trợ\n/goal add T123 — gắn task vào mục tiêu\n/goal remove T123 — chuyển task thành việc riêng\n/goal done — đánh dấu mục tiêu đã đạt\n/goal rename Tên mới — đổi tên, giữ lịch sử\n/goal archive — lưu trữ mục tiêu\n/goal history — xem lịch sử mục tiêu\n/week continue — tiếp tục mục tiêu tuần trước\n\nAnh cũng có thể nhắn tự nhiên: “mục tiêu này xong rồi”, “task này để tuần sau” hoặc “gắn task này vào mục tiêu”.`;
    else if (command.kind === 'thanks') result = 'Dạ, em ở đây. Khi cần thêm việc anh cứ nhắn em nhé.';
    else if (parseNaturalAdd(job.text)) {
      const title = parseNaturalAdd(job.text)!;
      statements.push(db.prepare(`INSERT INTO approval_requests(chat_id,source_update,title,created_at) SELECT ?,?,?,? WHERE ${guard}`).bind(job.chat_id, job.update_id, title, now, ...args()));
      result = `Em hiểu là anh muốn thêm task: “${title}”.\nAnh bấm nút để xác nhận hoặc bỏ qua.`;
      replyMarkup = confirmationButtons(`task:${job.update_id}`);
    }
    else if (structuredAssistant && await reserveAi(db, now)) {
      route = 'ai_intent';
      aiStartedAt = Date.now();
      const proposal = await structuredAssistant(job.text, recent);
      aiFinishedAt = Date.now();
      if (proposal.kind === 'add_task') {
        statements.push(db.prepare(`INSERT INTO approval_requests(chat_id,source_update,title,goal_scoped,created_at) SELECT ?,?,?,?,? WHERE ${guard}`)
          .bind(job.chat_id,job.update_id,proposal.title,Number(proposal.goalScoped),now,...args()));
        result = `Em hiểu anh muốn thêm task: “${proposal.title}”.${proposal.goalScoped ? '\nTask này sẽ gắn với mục tiêu tuần hiện tại.' : '\nĐây sẽ là việc riêng.'}\nAnh bấm nút để xác nhận hoặc bỏ qua.`;
        replyMarkup = confirmationButtons(`task:${job.update_id}`);
      } else result = proposal.text;
    }
    else if (assistant && await reserveAi(db, now)) {
      route = 'ai';
      aiStartedAt = Date.now();
      result = await assistant(job.text, recent);
      aiFinishedAt = Date.now();
    } else {
      route = assistant || structuredAssistant ? 'ai_budget_limited' : 'unrecognized';
      result = assistant || structuredAssistant ? 'Tháng này em đã chạm ngân sách AI dự phòng. Anh dùng /help để xem các lệnh chắc chắn.' : 'Em chưa hiểu chắc yêu cầu này.\n' + help;
    }
    // Lease serializes task writers; job result and outbox commit with the task change.
    statements.push(db.prepare(`INSERT INTO deliveries(job_id,chat_id,text,reply_markup) SELECT ?,?,?,? WHERE ${guard}`).bind(job.id, job.chat_id, result, replyMarkup ? JSON.stringify(replyMarkup) : null, ...args()));
    statements.push(db.prepare(`INSERT INTO conversation_messages(chat_id,direction,text,created_at) SELECT ?,'outbound',?,? WHERE ${guard}`).bind(job.chat_id, result, now, ...args()));
    statements.push(db.prepare(`UPDATE job_metrics SET route=?,ai_started_at=?,ai_finished_at=? WHERE job_id=? AND ${guard}`)
      .bind(route,aiStartedAt ?? null,aiFinishedAt ?? null,job.id,...args()));
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
    .map(item => `${item.title} ${item.metric === 'completion' ? '— chưa hoàn thành' : `${item.completed}/${item.target_count}${item.kind === 'habit' ? item.cadence === 'weekly' ? ' lần' : ' ngày' : ''}`}`);
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
  const summary = await weeklyReviewSummary(db,plan,now);
  const text = summary.text;
  const updateId = -(4_000_000_000 + Number(plan.week_start.replaceAll('-','')));
  const results = await db.batch([
    db.prepare(`INSERT OR IGNORE INTO jobs(update_id,user_id,chat_id,text,created_at,status,result)
      SELECT ?,owner.user_id,owner.chat_id,?,?, 'done', ? FROM owner
      WHERE NOT EXISTS(SELECT 1 FROM weekly_reviews WHERE week_start=?)`).bind(updateId,text,now,text,plan.week_start),
    db.prepare('INSERT OR IGNORE INTO deliveries(job_id,chat_id,text,reply_markup) SELECT id,chat_id,result,? FROM jobs WHERE update_id=?').bind(summary.replyMarkup ? JSON.stringify(summary.replyMarkup) : null, updateId),
    db.prepare('INSERT OR IGNORE INTO job_metrics(job_id,queued_at,processing_started_at,processing_finished_at) SELECT id,created_at,created_at,created_at FROM jobs WHERE update_id=?').bind(updateId),
    db.prepare('INSERT OR IGNORE INTO weekly_reviews(week_start,job_id,created_at) SELECT ?,id,? FROM jobs WHERE update_id=?').bind(plan.week_start,now,updateId),
  ]);
  return (results[0]?.meta.changes ?? 0) === 1;
}
