const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'deepseek/deepseek-v4-flash';

export type Assistant = (text: string, context?: string) => Promise<string>;

export function openRouterAssistant(apiKey: string): Assistant {
  return async (text, context = '') => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'Em là trợ lý cá nhân tiếng Việt. Trả lời ngắn, rõ, không tự nhận đã làm việc nếu chưa có bằng chứng. Chỉ trả lời văn bản, không markdown dài.' },
          { role: 'user', content: `${context ? `Ngữ cảnh gần đây:\n${context}\n\n` : ''}Tin nhắn mới:\n${text.slice(0, 4000)}` },
        ],
        temperature: 0.2,
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('openrouter_http_error');
    const body: unknown = await response.json();
    const content = (body as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim().length === 0) throw new Error('openrouter_invalid_response');
    return content.trim().slice(0, 3800);
  };
}
