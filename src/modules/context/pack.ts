type Plan = { week_start:string; goal:string; commitment:string; habit1:string; habit2:string };
type Task = { id:string; title:string; goal_title:string|null };
type Message = { direction:'inbound'|'outbound'; text:string };

function shorten(value: string, limit: number): string {
  const compact = value.replace(/\s+/g,' ').trim();
  return compact.length > limit ? `${compact.slice(0,limit - 1)}…` : compact;
}

// The interface is deliberately one read: callers receive a bounded, source-labelled brief.
// Pending state stays in its owning tables; this module only composes it for conversation.
export async function buildConversationContext(db: D1Database, chatId: string, now = Date.now()): Promise<string> {
  const [plan, tasks, draft, approval, rename, measurement, selection, messages] = await Promise.all([
    db.prepare("SELECT week_start,goal,commitment,habit1,habit2 FROM weekly_plans WHERE chat_id=? AND status='active' ORDER BY week_start DESC LIMIT 1")
      .bind(chatId).first<Plan>(),
    db.prepare(`SELECT t.id,t.title,g.title AS goal_title FROM tasks t LEFT JOIN goals g ON g.id=t.goal_id
      WHERE t.status='open' ORDER BY t.created_at DESC,t.id DESC LIMIT 3`).all<Task>(),
    db.prepare("SELECT step,goal,commitment,habit1,habit2,week_start FROM weekly_drafts WHERE id=1 AND chat_id=?")
      .bind(chatId).first<{step:string;goal:string|null;commitment:string|null;habit1:string|null;habit2:string|null;week_start:string}>(),
    db.prepare("SELECT title,goal_scoped FROM approval_requests WHERE chat_id=? AND status='pending' ORDER BY created_at DESC LIMIT 1")
      .bind(chatId).first<{title:string;goal_scoped:number}>(),
    db.prepare("SELECT new_title FROM goal_rename_requests WHERE chat_id=? AND status='pending' ORDER BY created_at DESC LIMIT 1")
      .bind(chatId).first<{new_title:string}>(),
    db.prepare(`SELECT i.title,r.local_date FROM checkin_measurement_requests r JOIN weekly_plan_items i ON i.id=r.plan_item_id
      WHERE r.chat_id=? AND r.status='pending' AND r.expires_at>? ORDER BY r.created_at DESC LIMIT 1`)
      .bind(chatId,now).first<{title:string;local_date:string}>(),
    db.prepare("SELECT text FROM checkin_selection_requests WHERE chat_id=? AND status='pending' AND expires_at>? ORDER BY created_at DESC LIMIT 1")
      .bind(chatId,now).first<{text:string}>(),
    db.prepare("SELECT direction,text FROM conversation_messages WHERE chat_id=? ORDER BY created_at DESC,id DESC LIMIT 6")
      .bind(chatId).all<Message>(),
  ]);
  const sections: string[] = [];
  if (plan) sections.push(`Kế hoạch tuần ${plan.week_start}: mục tiêu “${shorten(plan.goal,160)}”; cam kết “${shorten(plan.commitment,160)}”; thói quen “${shorten([plan.habit1,plan.habit2].filter(Boolean).join(' / '),180)}”.`);
  if (tasks.results.length) sections.push(`Task mở gần đây: ${tasks.results.map(task => `${task.id} “${shorten(task.title,120)}”${task.goal_title ? ` (mục tiêu: ${shorten(task.goal_title,80)})` : ' (việc riêng)'}`).join('; ')}.`);
  const pending: string[] = [];
  if (draft) pending.push(`đang lập kế hoạch tuần ${draft.week_start}, bước ${draft.step}`);
  if (approval) pending.push(`chờ xác nhận task “${shorten(approval.title,140)}”${approval.goal_scoped ? ' cho mục tiêu tuần' : ''}`);
  if (rename) pending.push(`chờ xác nhận đổi tên mục tiêu thành “${shorten(rename.new_title,140)}”`);
  if (measurement) pending.push(`chờ số phút cho thói quen “${shorten(measurement.title,120)}” ngày ${measurement.local_date}`);
  if (selection) pending.push(`chờ chọn mục check-in cho “${shorten(selection.text,140)}”`);
  if (pending.length) sections.push(`Trạng thái đang chờ: ${pending.join('; ')}.`);
  const recent = messages.results.reverse();
  if (recent.length) sections.push(`Hội thoại gần đây:\n${recent.map(message => `${message.direction === 'inbound' ? 'Anh' : 'Navi'}: ${shorten(message.text,240)}`).join('\n')}`);
  return sections.join('\n\n').slice(0,3800);
}
