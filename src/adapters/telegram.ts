import { z } from 'zod';

export const updateSchema = z.object({
  update_id: z.number().int().nonnegative().safe(),
  message: z.object({
    from: z.object({ id: z.number().int().positive().safe(), is_bot: z.boolean() }),
    chat: z.object({ id: z.number().int().safe(), type: z.string() }),
    text: z.string().max(4096).optional(),
  }).optional(),
  callback_query: z.object({
    id: z.string().min(1).max(128),
    from: z.object({ id: z.number().int().positive().safe(), is_bot: z.boolean() }),
    message: z.object({ chat: z.object({ id: z.number().int().safe(), type: z.string() }) }),
    data: z.string().min(1).max(64),
  }).optional(),
});
export type TelegramUpdate = z.infer<typeof updateSchema>;
export type SendResult = { kind: 'sent'; messageId: number } | { kind: 'retry'; after: number }
  | { kind: 'unknown' } | { kind: 'failed' };
export type ReplyMarkup = { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
export type Sender = (chatId: string, text: string, replyMarkup?: ReplyMarkup) => Promise<SendResult>;

export function telegramSender(token: string): Sender {
  return async (chatId, text, replyMarkup) => {
    if (!token) return { kind: 'failed' };
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup, link_preview_options: { is_disabled: true } }),
        signal: AbortSignal.timeout(10000),
      });
      // Never log the response/error: the URL contains the bot token.
      const raw: unknown = await response.json();
      const parsed = z.object({ ok: z.boolean(), result: z.object({ message_id: z.number().int() }).optional(),
        parameters: z.object({ retry_after: z.number().positive() }).optional() }).safeParse(raw);
      if (response.ok && parsed.success && parsed.data.ok && parsed.data.result) return { kind: 'sent', messageId: parsed.data.result.message_id };
      if (response.status === 429) return { kind: 'retry', after: Math.min(parsed.success ? (parsed.data.parameters?.retry_after ?? 60) : 60, 86400) };
      if (response.status >= 400 && response.status < 500) return { kind: 'failed' };
      return { kind: 'unknown' };
    } catch { return { kind: 'unknown' }; }
  };
}

export async function sendTyping(token: string, chatId: string): Promise<void> {
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' }), signal: AbortSignal.timeout(5_000),
    });
  } catch { /* Typing is best-effort and never blocks a durable reply. */ }
}

export async function answerCallback(token: string, callbackQueryId: string): Promise<void> {
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId }), signal: AbortSignal.timeout(10_000),
    });
  } catch { /* Telegram will dismiss on its own if the network is unavailable. */ }
}
