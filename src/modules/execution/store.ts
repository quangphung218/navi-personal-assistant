import { help, normalize, parseCommand, parseNaturalAdd } from '../work/commands';
import type { TelegramUpdate, Sender } from '../../adapters/telegram';
import type { Assistant } from '../../adapters/openrouter';

type Job = { id: number; update_id: number; chat_id: string; text: string; attempts: number };
type Task = { id: string; title: string; status: 'open' | 'done'; revision: number };
type Approval = { id: number; source_update: number; title: string; status: 'pending' };
type WeeklyDraft = { id: 1; chat_id: string; step: 'goal'|'commitment'|'habit1'|'habit2'|'confirm'; goal: string|null; commitment: string|null; habit1: string|null; habit2: string|null; week_start: string };
type WeeklyPlan = { week_start: string; chat_id: string; goal: string; commitment: string; habit1: string; habit2: string };
type ReminderPreference = { weekly_progress_enabled: number; delivery_hour: number };

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

function targetFrom(text: string): number | undefined {
  const value = Number(text.match(/\b(\d{1,3})\b/u)?.[1]);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function formatProgress(plan: WeeklyPlan, applications: number, runs: number): string {
  const applicationTarget = targetFrom(plan.commitment);
  const runHabit = [plan.habit1, plan.habit2].find(value => /chạy|run/iu.test(value));
  const runTarget = runHabit ? targetFrom(runHabit) : undefined;
  const ratio = (count: number, target?: number) => target ? `${count}/${target}` : `${count} lần đã ghi`;
  return `Tiến độ tuần bắt đầu ${plan.week_start}:\n• Mục tiêu: ${plan.goal}\n• Cam kết: ${plan.commitment}\n• Apply: ${ratio(applications, applicationTarget)}\n• Chạy bộ: ${ratio(runs, runTarget)}\n\nCác kết quả được ghi theo xác nhận của anh.`;
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
    const draft = await db.prepare("SELECT id,chat_id,step,goal,commitment,habit1,habit2,week_start FROM weekly_drafts WHERE id=1 AND chat_id=?").bind(job.chat_id).first<WeeklyDraft>();
    if (job.attempts >= 3) {
      result = 'Em chưa xử lý được yêu cầu này sau ba lần thử. Anh gửi lại yêu cầu giúp em; em chưa đánh dấu việc đã xong.';
    } else if (draft && command.kind !== 'week' && command.kind !== 'weekStatus' && command.kind !== 'reminders' && command.kind !== 'help') {
      const value = job.text.trim().replace(/\s+/g, ' ');
      if (draft.step === 'confirm') {
        if (command.kind === 'confirm') {
          statements.push(db.prepare(`INSERT INTO weekly_plans(week_start,chat_id,goal,commitment,habit1,habit2,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`)
            .bind(draft.week_start, draft.chat_id, draft.goal, draft.commitment, draft.habit1, draft.habit2, now, ...args()));
          statements.push(db.prepare(`DELETE FROM weekly_drafts WHERE id=1 AND ${guard}`).bind(...args()));
          result = `Đã lưu kế hoạch tuần bắt đầu ${draft.week_start}:\n• Mục tiêu: ${draft.goal}\n• Cam kết: ${draft.commitment}\n• Thói quen 1: ${draft.habit1}\n• Thói quen 2: ${draft.habit2}`;
        } else if (command.kind === 'reject') {
          statements.push(db.prepare(`DELETE FROM weekly_drafts WHERE id=1 AND ${guard}`).bind(...args()));
          result = 'Đã bỏ bản nháp kế hoạch tuần. Khi sẵn sàng anh nhắn /week để làm lại.';
        } else result = 'Anh trả lời “đúng” để lưu kế hoạch, hoặc “hủy” để làm lại.';
      } else if (value.length < 2 || value.length > 180) result = 'Anh gửi một câu ngắn từ 2 đến 180 ký tự nhé.';
      else if (draft.step === 'goal') {
        statements.push(db.prepare(`UPDATE weekly_drafts SET goal=?,step='commitment' WHERE id=1 AND ${guard}`).bind(value, ...args()));
        result = 'Mục tiêu đã ghi. Cam kết cá nhân tuần này của anh là gì?';
      } else if (draft.step === 'commitment') {
        statements.push(db.prepare(`UPDATE weekly_drafts SET commitment=?,step='habit1' WHERE id=1 AND ${guard}`).bind(value, ...args()));
        result = 'Đã ghi cam kết. Thói quen thứ nhất anh muốn theo dõi là gì?';
      } else if (draft.step === 'habit1') {
        statements.push(db.prepare(`UPDATE weekly_drafts SET habit1=?,step='habit2' WHERE id=1 AND ${guard}`).bind(value, ...args()));
        result = 'Đã ghi thói quen thứ nhất. Thói quen thứ hai là gì?';
      } else {
        statements.push(db.prepare(`UPDATE weekly_drafts SET habit2=?,step='confirm' WHERE id=1 AND ${guard}`).bind(value, ...args()));
        result = `Em tóm tắt kế hoạch tuần bắt đầu ${draft.week_start}:\n• Mục tiêu: ${draft.goal}\n• Cam kết: ${draft.commitment}\n• Thói quen 1: ${draft.habit1}\n• Thói quen 2: ${value}\n\nAnh trả lời “đúng” để lưu, hoặc “hủy” để bỏ.`;
      }
    } else if (command.kind === 'week') {
      const date = weekStart(now);
      statements.push(db.prepare(`INSERT OR IGNORE INTO weekly_drafts(id,chat_id,step,week_start,created_at) SELECT 1,?,'goal',?,? WHERE ${guard}`).bind(job.chat_id, date, now, ...args()));
      result = 'Mình lập kế hoạch tuần này nhé. Mục tiêu công việc quan trọng nhất của anh là gì?';
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
    } else if (command.kind === 'weekStatus' || command.kind === 'progress') {
      const currentWeek = weekStart(now);
      const plan = await db.prepare("SELECT week_start,goal,commitment,habit1,habit2 FROM weekly_plans WHERE week_start=? AND chat_id=? AND status='active'")
        .bind(currentWeek, job.chat_id).first<WeeklyPlan>();
      if (!plan) result = 'Tuần này chưa có kế hoạch đã xác nhận. Anh nhắn /week để tạo nhé.';
      else {
        const counts = await db.prepare(`SELECT
          SUM(CASE WHEN kind='job_application' THEN 1 ELSE 0 END) AS applications,
          SUM(CASE WHEN kind='run' THEN 1 ELSE 0 END) AS runs
          FROM weekly_progress_events WHERE week_start=?`).bind(currentWeek).first<{applications:number|null;runs:number|null}>();
        let applications = counts?.applications ?? 0, runs = counts?.runs ?? 0;
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
            }
          }
        } else result = formatProgress(plan, applications, runs);
      }
    } else if (command.kind === 'add') {
      const id = `T${job.update_id}`;
      statements.push(db.prepare(`INSERT INTO tasks(id,title,normalized_title,source_update,created_at) SELECT ?,?,?,?,? WHERE ${guard}`)
        .bind(id, command.title, normalize(command.title), job.update_id, now, ...args()));
      result = `Đã thêm ${id}: ${command.title}\nKhi xong, anh nhắn /done ${id}.`;
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
      const approval = await db.prepare("SELECT id,source_update,title,status FROM approval_requests WHERE chat_id=? AND status='pending' ORDER BY created_at DESC LIMIT 1")
        .bind(job.chat_id).first<Approval>();
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
    } else if (command.kind === 'help') result = help;
    else if (command.kind === 'thanks') result = 'Dạ, em ở đây. Khi cần thêm việc anh cứ nhắn em nhé.';
    else if (parseNaturalAdd(job.text)) {
      const title = parseNaturalAdd(job.text)!;
      statements.push(db.prepare(`INSERT INTO approval_requests(chat_id,source_update,title,created_at) SELECT ?,?,?,? WHERE ${guard}`).bind(job.chat_id, job.update_id, title, now, ...args()));
      result = `Em hiểu là anh muốn thêm task: “${title}”.\nAnh trả lời “đúng” để xác nhận, hoặc “hủy” để bỏ qua.`;
    }
    else if (assistant && await reserveAi(db, now)) result = await assistant(job.text, recent);
    else result = assistant ? 'Tháng này em đã chạm ngân sách AI dự phòng. Anh dùng /help để xem các lệnh chắc chắn.' : 'Em chưa hiểu chắc yêu cầu này.\n' + help;
    // Lease serializes task writers; job result and outbox commit with the task change.
    statements.push(db.prepare(`INSERT INTO deliveries(job_id,chat_id,text) SELECT ?,?,? WHERE ${guard}`).bind(job.id, job.chat_id, result, ...args()));
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
  const item = await db.prepare('SELECT job_id,chat_id,text,attempts FROM deliveries WHERE claim_token=?').bind(token)
    .first<{ job_id: number; chat_id: string; text: string; attempts: number }>();
  if (!item) return false;
  await db.prepare('UPDATE job_metrics SET delivery_started_at=COALESCE(delivery_started_at,?) WHERE job_id=?').bind(now, item.job_id).run();
  let outcome;
  try { outcome = await sender(item.chat_id, item.text); } catch { outcome = { kind: 'unknown' as const }; }
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
  const counts = await db.prepare(`SELECT
    SUM(CASE WHEN kind='job_application' THEN 1 ELSE 0 END) AS applications,
    SUM(CASE WHEN kind='run' THEN 1 ELSE 0 END) AS runs
    FROM weekly_progress_events WHERE week_start=?`).bind(currentWeek).first<{applications:number|null;runs:number|null}>();
  const applications = counts?.applications ?? 0, runs = counts?.runs ?? 0;
  const applicationTarget = targetFrom(plan.commitment);
  const runHabit = [plan.habit1, plan.habit2].find(value => /chạy|run/iu.test(value));
  const runTarget = runHabit ? targetFrom(runHabit) : undefined;
  const pending = [
    applicationTarget && applications < applicationTarget ? `Apply ${applications}/${applicationTarget}` : undefined,
    runTarget && runs < runTarget ? `Chạy bộ ${runs}/${runTarget}` : undefined,
  ].filter((value): value is string => Boolean(value));
  if (!pending.length) return false;
  const updateId = -Number(date.replaceAll('-',''));
  const text = `Nhắc tiến độ hôm nay (${date.slice(8,10)}/${date.slice(5,7)}): ${pending.join(' · ')}.\n\nAnh cập nhật khi hoàn thành, hoặc dùng /reminders off để tắt nhắc.`;
  const results = await db.batch([
    db.prepare(`INSERT OR IGNORE INTO jobs(update_id,user_id,chat_id,text,created_at,status,result)
      SELECT ?,owner.user_id,owner.chat_id,?,?, 'done', ? FROM owner
      WHERE NOT EXISTS(SELECT 1 FROM weekly_reminders WHERE week_start=? AND local_date=?)`)
      .bind(updateId, text, now, text, currentWeek, date),
    db.prepare('INSERT OR IGNORE INTO deliveries(job_id,chat_id,text) SELECT id,chat_id,result FROM jobs WHERE update_id=?').bind(updateId),
    db.prepare('INSERT OR IGNORE INTO job_metrics(job_id,queued_at,processing_started_at,processing_finished_at) SELECT id,created_at,created_at,created_at FROM jobs WHERE update_id=?').bind(updateId),
    db.prepare('INSERT OR IGNORE INTO weekly_reminders(week_start,local_date,job_id,created_at) SELECT ?,?,id,? FROM jobs WHERE update_id=?').bind(currentWeek, date, now, updateId),
  ]);
  return (results[0]?.meta.changes ?? 0) === 1;
}
