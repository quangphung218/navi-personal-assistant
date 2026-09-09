import { z } from 'zod';

export const updateSchema = z.object({
  update_id: z.number().int().nonnegative().safe(),
  message: z.object({
    from: z.object({ id: z.number().int().positive().safe(), is_bot: z.boolean() }),
    chat: z.object({ id: z.number().int().safe(), type: z.string() }),
    text: z.string().max(4096).optional(),
  }).optional(),
});
export type TelegramUpdate = z.infer<typeof updateSchema>;
export type SendResult = { kind: 'sent'; messageId: number } | { kind: 'retry'; after: number }
  | { kind: 'unknown' } | { kind: 'failed' };
export type Sender = (chatId: string, text: string) => Promise<SendResult>;

export function telegramSender(token: string): Sender {
  return async (chatId, text) => {
    if (!token) return { kind: 'failed' };
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, link_preview_options: { is_disabled: true } }),
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
