const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'deepseek/deepseek-v4-flash';

export type Assistant = (text: string, context?: string) => Promise<string>;
export type TaskProposal = { kind:'add_task'; title:string; goalScoped:boolean } | { kind:'reply'; text:string };
export type StructuredAssistant = (text: string, context?: string) => Promise<TaskProposal>;
export type FocusAssistant = (brief: string) => Promise<string>;

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

function parseStructuredReply(value: unknown): TaskProposal {
  const raw = typeof value === 'string' ? value.trim().replace(/^```(?:json)?\s*|\s*```$/g, '') : '';
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
    const record = parsed as Record<string,unknown>;
    if (record.kind === 'add_task' && typeof record.title === 'string') {
      const title = record.title.trim().replace(/\s+/g,' ');
      if (title.length >= 2 && title.length <= 180 && typeof record.goalScoped === 'boolean') return {kind:'add_task',title,goalScoped:record.goalScoped};
    }
    if (record.kind === 'reply' && typeof record.text === 'string') {
      const text = record.text.trim();
      if (text.length > 0) return {kind:'reply',text:text.slice(0,3800)};
    }
  } catch { /* Fall through to a safe clarification. */ }
  return {kind:'reply',text:'Em chưa hiểu chắc ý này. Anh nói rõ giúp em muốn thêm việc, cập nhật tiến độ hay xem kế hoạch nhé.'};
}

export function openRouterStructuredAssistant(apiKey: string): StructuredAssistant {
  return async (text, context = '') => {
    const response = await fetch(ENDPOINT, {
      method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role:'system', content:'Em là bộ phân loại ý định cho trợ lý cá nhân tiếng Việt. Chỉ trả JSON hợp lệ, không markdown. Nếu người dùng rõ ràng muốn tạo một task, trả {"kind":"add_task","title":"nội dung task ngắn gọn","goalScoped":true|false}. goalScoped=true chỉ khi họ nói task phục vụ mục tiêu/kế hoạch hiện tại. Với mọi trường hợp khác trả {"kind":"reply","text":"một câu trả lời ngắn hoặc câu hỏi làm rõ"}. Không nói rằng dữ liệu đã được lưu và không đề xuất hành động phá huỷ.' },
          { role:'user', content:`${context ? `Ngữ cảnh gần đây:\n${context}\n\n` : ''}Tin nhắn mới:\n${text.slice(0,4000)}` },
        ], temperature:0, max_tokens:160,
      }), signal:AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error('openrouter_http_error');
    const body: unknown = await response.json();
    const content = (body as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message?.content;
    return parseStructuredReply(content);
  };
}

export function openRouterFocusAssistant(apiKey: string): FocusAssistant {
  return async (brief) => {
    const response = await fetch(ENDPOINT, {
      method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role:'system', content:'Em là trợ lý review tuần cho một người dùng Việt Nam. Chỉ dùng dữ liệu trong brief. Trả lời tối đa 500 ký tự, tiếng Việt, đúng ba dòng: “Điểm cần chú ý: …”, “Việc tiếp theo: …”, “Vì sao: …”. Đề xuất đúng một hành động nhỏ có thể làm ngay. Không bịa dữ liệu, không nói đã lưu/đổi/xóa gì, không ra lệnh tự động, không dùng markdown.' },
          { role:'user', content:`Brief dữ liệu tuần:\n${brief.slice(0,5000)}` },
        ], temperature:0.2, max_tokens:180,
      }), signal:AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error('openrouter_http_error');
    const body: unknown = await response.json();
    const content = (body as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim().length === 0) throw new Error('openrouter_invalid_response');
    return content.trim().slice(0,500);
  };
}
