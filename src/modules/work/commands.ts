export type Command = { kind: 'add'; title: string } | { kind: 'done'; reference: string }
  | { kind: 'list'; includeDone: boolean } | { kind: 'confirm'; target?: string } | { kind: 'reject'; target?: string }
  | { kind: 'week' } | { kind: 'weekStatus' } | { kind: 'progressList' }
  | { kind: 'progress'; activity: 'job_application'; detail: string }
  | { kind: 'progress'; activity: 'run'; date?: { day: number; month: number; year?: number } }
  | { kind: 'progressChange'; action: 'delete'|'rename'; reference: string; detail?: string }
  | { kind: 'reminders'; enabled?: boolean }
  | { kind: 'status' } | { kind: 'thanks' } | { kind: 'help' } | { kind: 'unknown' };

export const normalize = (text: string) => text.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
export function parseCommand(text: string): Command {
  const value = text.trim();
  const callback = value.match(/^_navi:(confirm|reject):([a-z]+:[a-z0-9-]+)$/iu);
  if (callback) return { kind: callback[1] === 'confirm' ? 'confirm' : 'reject', target: callback[2]!.toLowerCase() };
  if (/^_navi:show:progress$/iu.test(value)) return { kind: 'progressList' };
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
  const progressChange = value.match(/^\/progress(?:@\w+)?\s+(delete|xóa|xoá|edit|sửa)\s+(P\d+)(?:\s+(.+))?$/iu);
  if (progressChange) {
    const action = /^(?:delete|xóa|xoá)$/iu.test(progressChange[1]!) ? 'delete' : 'rename';
    const detail = progressChange[3]?.trim().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ');
    if (action === 'delete' && !detail) return { kind: 'progressChange', action, reference: progressChange[2]!.toUpperCase() };
    if (action === 'rename' && detail && detail.length > 1 && detail.length <= 180) return { kind: 'progressChange', action, reference: progressChange[2]!.toUpperCase(), detail };
  }
  if (/^\/progress(?:@\w+)?$/iu.test(value)) return { kind: 'progressList' };
  if (/^(?:\/week(?:@\w+)?\s+status|tiến độ tuần|tuần này thế nào\??)$/iu.test(value)) return { kind: 'weekStatus' };
  if (/^(?:\/week|\/tuan|lập kế hoạch tuần|kế hoạch tuần)(?:@\w+)?$/iu.test(value)) return { kind: 'week' };
  if (/^(?:\/reminders?(?:@\w+)?\s+(?:on|bật)|bật nhắc(?: tiến độ)?|bật reminder)$/iu.test(value)) return { kind: 'reminders', enabled: true };
  if (/^(?:\/reminders?(?:@\w+)?\s+(?:off|tắt)|tắt nhắc(?: tiến độ)?|tắt reminder)$/iu.test(value)) return { kind: 'reminders', enabled: false };
  if (/^(?:\/reminders?(?:@\w+)?|lịch nhắc|nhắc tiến độ thế nào)$/iu.test(value)) return { kind: 'reminders' };
  const application = value.match(/^(?:\/log\s+apply\s+|(?:anh\s+)?(?:vừa|đã)\s+(?:apply|ứng tuyển)(?:\s+(?:job|vị trí))?\s+)(.+)$/iu);
  if (application) {
    const detail = application[1]!.trim().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ');
    if (detail.length > 1 && detail.length <= 180) return { kind: 'progress', activity: 'job_application', detail };
  }
  const datedRun = value.match(/^ngày\s+(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{4}))?\s+(?:anh\s+)?(?:vừa|đã)\s+(?:chạy bộ|đi chạy)(?:\s+[^\n]{0,120})?[.!]?$/iu);
  if (datedRun) {
    const day = Number(datedRun[1]), month = Number(datedRun[2]);
    const year = datedRun[3] ? Number(datedRun[3]) : undefined;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) return { kind: 'progress', activity: 'run', date: { day, month, year } };
  }
  if (/^(?:\/log\s+run|(?:(?:hôm nay)\s+)?(?:anh\s+)?(?:vừa|đã)\s+(?:chạy bộ|đi chạy)(?:\s+[^\n]{0,120})?)[.!]?$/iu.test(value)) return { kind: 'progress', activity: 'run' };
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
export const help = `Anh bấm Menu bên cạnh ô chat, hoặc gõ / để chọn lệnh.\n\nKế hoạch tuần\n/week — lập kế hoạch\n/progress — xem tiến độ và lịch sử\n\nGhi nhận nhanh\nAnh đã apply job Backend Developer\nNgày 7/9 anh đã chạy bộ\n\nChỉnh tiến độ\n/progress delete P12\n/progress edit P12 Tên vị trí mới\nSau đó anh trả lời “đúng” để xác nhận.\n\nTask\n/add Viết README\n/list — việc chưa xong\n/done T123 — hoàn thành theo mã\n\nNhắc tiến độ\n/reminders — xem trạng thái\n/reminders off — tắt nhắc\n/reminders on — bật lại\n\nKết quả chỉ được ghi theo xác nhận của anh.`;
