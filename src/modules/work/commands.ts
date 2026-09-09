export type Command = { kind: 'add'; title: string } | { kind: 'done'; reference: string }
  | { kind: 'list'; includeDone: boolean } | { kind: 'confirm' } | { kind: 'reject' }
  | { kind: 'week' } | { kind: 'status' } | { kind: 'thanks' } | { kind: 'help' } | { kind: 'unknown' };

export const normalize = (text: string) => text.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
export function parseCommand(text: string): Command {
  const value = text.trim();
  const add = value.match(/^(?:\/add(?:@\w+)?\s+|(?:thêm việc|thêm công việc|tạo việc)\s*:?\s+)([\s\S]+)$/iu);
  if (add) {
    const title = add[1]!.trim().replace(/\s+/g, ' ');
    return title.length > 0 && title.length <= 180 ? { kind: 'add', title } : { kind: 'unknown' };
  }
  if (/^(?:đánh dấu|đánh dấu là)\s+(?:việc đó|task đó|cái đó)\s+(?:xong|hoàn thành)$/iu.test(value)) return { kind: 'done', reference: 'đó' };
  const done = value.match(/^(?:\/done(?:@\w+)?\s+|(?:xong|hoàn thành)\s+)(.+)$/iu);
  if (done) return { kind: 'done', reference: done[1]!.trim() };
  if (/^\/list(?:@\w+)?\s+all$/iu.test(value)) return { kind: 'list', includeDone: true };
  if (/^(?:\/list(?:@\w+)?|anh còn việc gì\??|còn việc gì\??|danh sách(?: công việc)?|xem công việc)$/iu.test(value)) return { kind: 'list', includeDone: false };
  if (/^(?:em đã thêm task chưa|anh đã thêm task chưa|task đó đã được thêm chưa|trạng thái task)$/iu.test(value)) return { kind: 'status' };
  if (/^\/(?:start|help)(?:@\w+)?$/iu.test(value)) return { kind: 'help' };
  if (/^(?:\/week|\/tuan|lập kế hoạch tuần|kế hoạch tuần)(?:@\w+)?$/iu.test(value)) return { kind: 'week' };
  if (/^(?:đúng|đúng rồi|ok|okay|đồng ý|xác nhận|yes)(?:\s+em)?[.!]?$/iu.test(value)) return { kind: 'confirm' };
  if (/^(?:không|không phải|hủy|huỷ|cancel|no)(?:\s+em)?[.!]?$/iu.test(value)) return { kind: 'reject' };
  if (/^(?:cảm ơn|cam on|thanks|thank you)(?:\s+em)?[.!]?$/iu.test(value)) return { kind: 'thanks' };
  return { kind: 'unknown' };
}
export function parseNaturalAdd(text: string): string | undefined {
  const match = text.trim().match(/^(?:à\s*)?(?:chắc\s+)?(?:anh\s+)?(?:phải\s+)?(?:thêm|tạo)\s+(?:task|công việc|việc)\s+(.+)$/iu);
  if (!match) return undefined;
  const title = match[1]!.trim().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ');
  return title.length > 0 && title.length <= 180 ? title : undefined;
}
export const help = 'Em đã sẵn sàng ghi công việc cho anh.\n\nThêm việc viết README\n/week — lập kế hoạch tuần\n/list — việc chưa xong\n/list all — cả việc đã xong\n/done T123 — hoàn thành theo mã\n\nAnh cũng có thể nhắn “Xong viết README” nếu tên đó chỉ khớp một việc. Bản này ghi nhận theo lời anh; chưa tự làm task hoặc gọi AI.';
