export type Command = { kind: 'add'; title: string; goalScoped: boolean } | { kind: 'done'; reference: string }
  | { kind: 'list'; includeDone: boolean } | { kind: 'confirm'; target?: string } | { kind: 'reject'; target?: string }
  | { kind: 'week'; continueGoal: boolean } | { kind: 'weekStatus' } | { kind: 'progressList'; page: number }
  | { kind: 'today' } | { kind: 'review'; carry?: string }
  | { kind: 'schedule'; reference: string; day: number; month: number; year?: number; hour: number; minute: number }
  | { kind: 'defer'; reference: string } | { kind: 'clearSchedule'; reference: string }
  | { kind: 'progress'; activity: 'job_application'; detail: string }
  | { kind: 'progress'; activity: 'run'; date?: { day: number; month: number; year?: number } }
  | { kind: 'progressChange'; action: 'delete'|'rename'; reference: string; detail?: string }
  | { kind: 'checkInChange'; action: 'delete'|'rename'; reference: string; detail?: string }
  | { kind: 'checkIn'; text: string; date?: { day: number; month: number; year?: number } }
  | { kind: 'measurement'; value: number; unit: 'minutes' }
  | { kind: 'cancelMeasurement'; sourceUpdate?: number }
  | { kind: 'goal'; action: 'show'|'complete'|'reopen'|'attach'|'detach'; taskId?: string }
  | { kind: 'checkInSelect'; sourceUpdate: number; itemId: number }
  | { kind: 'reminders'; enabled?: boolean } | { kind: 'export'; format: 'markdown'|'json' }
  | { kind: 'systemStatus' } | { kind: 'insights' } | { kind: 'status' }
  | { kind: 'thanks' } | { kind: 'help' } | { kind: 'unknown' };

export const normalize = (text: string) => text.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
export function parseCommand(text: string): Command {
  const value = text.trim();
  if (/^\/cancelmeasurement$/iu.test(value)) return {kind:'cancelMeasurement'};
  const cancelMeasurement = value.match(/^_navi:measurement:cancel:(\d+)$/u);
  if (cancelMeasurement) return {kind:'cancelMeasurement',sourceUpdate:Number(cancelMeasurement[1])};
  const callback = value.match(/^_navi:(confirm|reject):([a-z]+:[a-z0-9:-]+)$/iu);
  if (callback) return { kind: callback[1] === 'confirm' ? 'confirm' : 'reject', target: callback[2]!.toLowerCase() };
  if (/^_navi:show:progress$/iu.test(value)) return { kind: 'progressList', page:0 };
  const progressPage = value.match(/^_navi:show:progress:(\d{1,3})$/iu);
  if (progressPage) return { kind:'progressList',page:Number(progressPage[1]) };
  const checkInSelect = value.match(/^_navi:checkin:select:(\d+):(\d+)$/iu);
  if (checkInSelect) return { kind: 'checkInSelect', sourceUpdate: Number(checkInSelect[1]), itemId: Number(checkInSelect[2]) };
  const taskAction = value.match(/^_navi:task:(done|defer|clear):(T\d+)$/iu);
  if (taskAction) return taskAction[1] === 'done' ? { kind: 'done', reference: taskAction[2]!.toUpperCase() }
    : taskAction[1] === 'defer' ? { kind: 'defer', reference: taskAction[2]!.toUpperCase() } : { kind: 'clearSchedule', reference: taskAction[2]!.toUpperCase() };
  const goalAction = value.match(/^_navi:goal:(attach|detach):(T\d+)$/iu);
  if (goalAction) return {kind:'goal',action:goalAction[1] as 'attach'|'detach',taskId:goalAction[2]!.toUpperCase()};
  const add = value.match(/^(?:\/add(?:@\w+)?\s+|(?:thêm việc|thêm công việc|tạo việc)\s*:?\s+)([\s\S]+)$/iu);
  if (add) {
    const raw = add[1]!.trim().replace(/\s+/g, ' ');
    const scoped = raw.match(/^(?:mục tiêu|goal)\s*:\s*(.+)$/iu);
    const title = (scoped?.[1] ?? raw).trim();
    return title.length > 0 && title.length <= 180 ? { kind: 'add', title, goalScoped:Boolean(scoped) } : { kind: 'unknown' };
  }
  if (/^(?:mục tiêu|goal)\s+(?:này|đó)\s+(?:đã )?(?:xong|hoàn thành)(?: rồi)?[.!]?$/iu.test(value)) return {kind:'goal',action:'complete'};
  if(/^(?:mở lại|tiếp tục)\s+(?:mục tiêu|goal)\s+(?:này|đó)[.!]?$/iu.test(value)) return {kind:'goal',action:'reopen'};
  if (/^(?:gắn|thêm)\s+(?:task|việc)\s+(?:này|đó)\s+(?:vào|cho)\s+(?:mục tiêu|goal)[.!]?$/iu.test(value)) return {kind:'goal',action:'attach',taskId:'đó'};
  if (/^(?:bỏ|gỡ)\s+(?:task|việc)\s+(?:này|đó)\s+(?:khỏi|ra khỏi)\s+(?:mục tiêu|goal)[.!]?$/iu.test(value)) return {kind:'goal',action:'detach',taskId:'đó'};
  if (/^(?:(?:task|việc)\s+(?:này|đó)\s+)?(?:để|sang)\s+tuần sau[.!]?$/iu.test(value)) return {kind:'review',carry:'đó'};
  if (/^(?:đánh dấu(?: là)?\s+)?(?:việc|task|cái)\s+(?:này|đó)\s+(?:đã )?(?:xong|hoàn thành)[.!]?$/iu.test(value)) return { kind: 'done', reference: 'đó' };
  const done = value.match(/^(?:\/done(?:@\w+)?\s+|(?:xong|hoàn thành)\s+)(.+)$/iu);
  if (done) return { kind: 'done', reference: done[1]!.trim() };
  if (/^\/list(?:@\w+)?\s+all$/iu.test(value)) return { kind: 'list', includeDone: true };
  if (/^(?:\/list(?:@\w+)?|anh còn việc gì\??|còn việc gì\??|danh sách(?: công việc)?|xem công việc)$/iu.test(value)) return { kind: 'list', includeDone: false };
  if (/^\/status(?:@\w+)?$/iu.test(value)) return { kind: 'systemStatus' };
  if (/^\/insights(?:@\w+)?$/iu.test(value)) return { kind: 'insights' };
  if (/^\/export(?:@\w+)?$/iu.test(value)) return { kind: 'export', format: 'markdown' };
  if (/^\/export(?:@\w+)?\s+json$/iu.test(value)) return { kind: 'export', format: 'json' };
  if (/^(?:em đã thêm task chưa|anh đã thêm task chưa|task đó đã được thêm chưa|trạng thái task)$/iu.test(value)) return { kind: 'status' };
  if (/^\/(?:start|help)(?:@\w+)?$/iu.test(value)) return { kind: 'help' };
  if (/^(?:\/today(?:@\w+)?|hôm nay có gì|hôm nay làm gì)$/iu.test(value)) return { kind: 'today' };
  const schedule = value.match(/^\/schedule(?:@\w+)?\s+(T\d+)\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\s+(\d{1,2})(?::(\d{2}))?$/iu);
  if (schedule) {
    const day=Number(schedule[2]),month=Number(schedule[3]),year=schedule[4]?Number(schedule[4]):undefined,hour=Number(schedule[5]),minute=Number(schedule[6] ?? 0);
    if(day>=1&&day<=31&&month>=1&&month<=12&&hour>=0&&hour<=23&&minute>=0&&minute<=59) return {kind:'schedule',reference:schedule[1]!.toUpperCase(),day,month,year,hour,minute};
  }
  const carry = value.match(/^\/review(?:@\w+)?\s+carry\s+(T\d+)$/iu);
  if (carry) return { kind: 'review', carry: carry[1]!.toUpperCase() };
  const reviewCarry = value.match(/^_navi:review:carry:(T\d+)$/iu);
  if (reviewCarry) return { kind:'review', carry:reviewCarry[1]!.toUpperCase() };
  if (/^(?:\/review(?:@\w+)?|review tuần)$/iu.test(value)) return { kind: 'review' };
  const progressChange = value.match(/^\/progress(?:@\w+)?\s+(delete|xóa|xoá|edit|sửa)\s+(P\d+)(?:\s+(.+))?$/iu);
  if (progressChange) {
    const action = /^(?:delete|xóa|xoá)$/iu.test(progressChange[1]!) ? 'delete' : 'rename';
    const detail = progressChange[3]?.trim().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ');
    if (action === 'delete' && !detail) return { kind: 'progressChange', action, reference: progressChange[2]!.toUpperCase() };
    if (action === 'rename' && detail && detail.length > 1 && detail.length <= 180) return { kind: 'progressChange', action, reference: progressChange[2]!.toUpperCase(), detail };
  }
  const checkInChange = value.match(/^\/progress(?:@\w+)?\s+(delete|xóa|xoá|edit|sửa)\s+(C\d+)(?:\s+(.+))?$/iu);
  if (checkInChange) {
    const action = /^(?:delete|xóa|xoá)$/iu.test(checkInChange[1]!) ? 'delete' : 'rename';
    const detail = checkInChange[3]?.trim().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ');
    if (action === 'delete' && !detail) return { kind: 'checkInChange', action, reference: checkInChange[2]!.toUpperCase() };
    if (action === 'rename' && detail && detail.length > 1 && detail.length <= 180) return { kind: 'checkInChange', action, reference: checkInChange[2]!.toUpperCase(), detail };
  }
  const progressList = value.match(/^\/progress(?:@\w+)?(?:\s+(\d{1,3}))?$/iu);
  if (progressList) return { kind: 'progressList', page:Math.max(0,Number(progressList[1] ?? 1)-1) };
  if (/^(?:\/week(?:@\w+)?\s+status|tiến độ tuần|tuần này thế nào\??)$/iu.test(value)) return { kind: 'weekStatus' };
  if (/^\/(?:week|tuan)(?:@\w+)?\s+(?:continue|tiếp tục)$/iu.test(value)) return {kind:'week',continueGoal:true};
  if (/^(?:\/week|\/tuan|lập kế hoạch tuần|kế hoạch tuần)(?:@\w+)?$/iu.test(value)) return { kind: 'week',continueGoal:false };
  const goal = value.match(/^\/goal(?:@\w+)?(?:\s+(done|complete|reopen|add|remove)\s*(T\d+)?)?$/iu);
  if (goal) {
    const action = goal[1]?.toLowerCase();
    if (!action) return {kind:'goal',action:'show'};
    if (/^(?:done|complete)$/.test(action)) return {kind:'goal',action:'complete'};
    if (action === 'reopen') return {kind:'goal',action:'reopen'};
    if (action === 'add' && goal[2]) return {kind:'goal',action:'attach',taskId:goal[2].toUpperCase()};
    if (action === 'remove' && goal[2]) return {kind:'goal',action:'detach',taskId:goal[2].toUpperCase()};
  }
  if (/^(?:\/reminders?(?:@\w+)?\s+(?:on|bật)|bật nhắc(?: tiến độ)?|bật reminder)$/iu.test(value)) return { kind: 'reminders', enabled: true };
  if (/^(?:\/reminders?(?:@\w+)?\s+(?:off|tắt)|tắt nhắc(?: tiến độ)?|tắt reminder)$/iu.test(value)) return { kind: 'reminders', enabled: false };
  if (/^(?:\/reminders?(?:@\w+)?|lịch nhắc|nhắc tiến độ thế nào)$/iu.test(value)) return { kind: 'reminders' };
  if (/^(?:\/log\s+apply\s+|(?:anh\s+)?(?:vừa|đã)\s+(?:apply|ứng tuyển)(?:\s+(?:job|vị trí))?\s+).{2,180}$/iu.test(value)) return { kind: 'checkIn', text: value.replace(/[.!?]+$/u, '') };
  const datedRun = value.match(/^ngày\s+(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{4}))?\s+(?:anh\s+)?(?:vừa|đã)\s+(?:chạy bộ|đi chạy)(?:\s+[^\n]{0,120})?[.!]?$/iu);
  if (datedRun) {
    const day = Number(datedRun[1]), month = Number(datedRun[2]);
    const year = datedRun[3] ? Number(datedRun[3]) : undefined;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) return { kind: 'checkIn', text: value.replace(/[.!?]+$/u, ''), date:{day,month,year} };
  }
  if (/^(?:\/log\s+run|(?:(?:hôm nay)\s+)?(?:anh\s+)?(?:vừa|đã)\s+(?:chạy bộ|đi chạy)(?:\s+[^\n]{0,120})?)[.!]?$/iu.test(value)) return { kind: 'checkIn', text: value.replace(/[.!?]+$/u, '') };
  if (/^(?:(?:hôm nay)\s+)?(?:anh\s+)?(?:vừa|đã)\s+(?:xong|hoàn thành|làm xong|public|đăng|viết|đọc|học|thiền|nghe)\b[\s\S]{0,180}$/iu.test(value)) return { kind: 'checkIn', text: value.replace(/[.!?]+$/u, '') };
  const datedHabit = value.match(/^ngày\s+(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{4}))?\s+(?:anh\s+)?(?:vừa|đã)\s+(?:thiền|nghe)\b[\s\S]{0,180}$/iu);
  if (datedHabit) {
    const day=Number(datedHabit[1]), month=Number(datedHabit[2]), year=datedHabit[3] ? Number(datedHabit[3]) : undefined;
    if (day>=1&&day<=31&&month>=1&&month<=12) return { kind:'checkIn', text:value.replace(/[.!?]+$/u,''), date:{day,month,year} };
  }
  const measurement = value.match(/^(\d{1,3})\s*(?:phút|phut|min|['’])[.!]?$/iu);
  if (measurement) return { kind:'measurement',value:Number(measurement[1]),unit:'minutes' };
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
export const help = `Anh bấm Menu bên cạnh ô chat, hoặc gõ / để chọn lệnh.\n\nMỗi ngày\n/today — việc và tiến độ hôm nay\n/schedule T12 10/9 09:00 — đặt giờ nhắc task\n/review — tổng kết tuần\n/review carry T12 — đưa task sang tuần mới\n\nKế hoạch tuần\n/week — lập kế hoạch\n/progress — xem tiến độ và lịch sử\n/progress 2 — xem trang lịch sử tiếp theo\n/insights — xem mức Navi hiểu check-in tuần này\n\nGhi nhận nhanh\nAnh đã apply job Backend Developer\nNgày 7/9 anh đã chạy bộ\nAnh đã public Navi lên GitHub\nAnh đã đọc sách\nNếu Navi hỏi số phút, anh chỉ cần trả lời: 5 phút\n\nTask\n/add Viết README — việc riêng\n/add mục tiêu: Viết README — việc cho mục tiêu tuần\n/list — việc chưa xong\n/done T123 — hoàn thành theo mã\n\nNhắc tiến độ\n/reminders — xem trạng thái\n/reminders off — tắt nhắc\n/reminders on — bật lại\n\nDữ liệu\n/export — bản sao dễ đọc\n/export json — bản sao máy đọc được\n\nTrạng thái Navi\n/status — xem dữ liệu vận hành vừa đọc được\n\nKết quả chỉ được ghi khi Navi nối được với đúng mục trong kế hoạch tuần.`;
