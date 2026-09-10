export type ConversationalIntent =
  | { kind:'add_task'; title:string; goalScoped:boolean }
  | { kind:'complete_goal' }
  | { kind:'reopen_goal' }
  | { kind:'attach_recent_task' }
  | { kind:'detach_recent_task' }
  | { kind:'carry_recent_task' }
  | { kind:'complete_recent_task' };

function title(value: string): string | undefined {
  const cleaned = value.trim().replace(/[.!?]+$/u, '').replace(/\s+/g, ' ');
  return cleaned.length > 0 && cleaned.length <= 180 ? cleaned : undefined;
}

// This module deliberately recognizes only high-confidence Vietnamese phrasing.
// Anything outside it remains a conversational reply and never becomes a mutation by inference.
export function interpretConversationalIntent(text: string): ConversationalIntent | undefined {
  const value = text.trim();
  const contextualGoalTask = value.match(/^(?:hello\s+em[,.!]?\s*)?(?:mục tiêu|goal)\b[\s\S]{0,160}?\b(?:anh\s+)?cần(?:\s+có)?\s+(?:một\s+)?(?:task|việc)(?:\s+mới)?\s*(?:là|:)\s*(.+)$/iu);
  if (contextualGoalTask) {
    const task = title(contextualGoalTask[1]!);
    return task ? {kind:'add_task',title:task,goalScoped:true} : undefined;
  }
  const priorityTask = value.match(/^(?:tuần này\s+(?:anh\s+)?ưu tiên\s+.+?,\s*)?(?:anh\s+)?cần\s+(.+?)(?:\s+trước)?[.!]?$/iu);
  if (priorityTask && /(?:^tuần này|ưu tiên)/iu.test(value) && !/\bcần\s+(?:gì|làm gì)\b/iu.test(value)) {
    const task = title(priorityTask[1]!);
    return task ? {kind:'add_task',title:task,goalScoped:true} : undefined;
  }
  if (/^(?:mục tiêu|goal)\s+(?:này|đó)\s+(?:đã )?(?:xong|hoàn thành)(?: rồi)?[.!]?$/iu.test(value)) return {kind:'complete_goal'};
  if (/^(?:mở lại|tiếp tục)\s+(?:mục tiêu|goal)\s+(?:này|đó)[.!]?$/iu.test(value)) return {kind:'reopen_goal'};
  if (/^(?:gắn|thêm)\s+(?:task|việc)\s+(?:này|đó)\s+(?:vào|cho)\s+(?:mục tiêu|goal)[.!]?$/iu.test(value)) return {kind:'attach_recent_task'};
  if (/^(?:bỏ|gỡ)\s+(?:task|việc)\s+(?:này|đó)\s+(?:khỏi|ra khỏi)\s+(?:mục tiêu|goal)[.!]?$/iu.test(value)) return {kind:'detach_recent_task'};
  if (/^(?:(?:task|việc)\s+(?:này|đó)\s+)?(?:để|sang)\s+tuần sau[.!]?$/iu.test(value)) return {kind:'carry_recent_task'};
  if (/^(?:đánh dấu(?: là)?\s+)?(?:việc|task|cái)\s+(?:này|đó)\s+(?:đã )?(?:xong|hoàn thành)[.!]?$/iu.test(value)) return {kind:'complete_recent_task'};
  return undefined;
}
