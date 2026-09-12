export const pilotConversationCorpus = [
  { text: 'Anh đã public Navi lên GitHub', kind: 'checkIn', outcome: 'record' },
  { text: 'Anh vừa apply job Backend Developer', kind: 'checkIn', outcome: 'record' },
  { text: 'Hôm nay anh đã chạy bộ', kind: 'checkIn', outcome: 'record' },
  { text: 'Anh đã đọc sách', kind: 'checkIn', outcome: 'record' },
  { text: 'Anh đã đọc sách 2 buổi', kind: 'checkIn', outcome: 'record' },
  { text: 'Anh đã hoàn thành việc đó', kind: 'checkIn', outcome: 'ask' },
  { text: 'Anh đã hoàn thành Navi', kind: 'checkIn', outcome: 'choose' },
  { text: 'Anh đã viết xong README', kind: 'checkIn', outcome: 'ask' },
  { text: 'Anh vừa apply thêm một job', kind: 'checkIn', outcome: 'record' },
  { text: 'Ngày 7/9 anh đã chạy bộ', kind: 'checkIn', outcome: 'record' },
  { text: '/add Viết README', kind: 'add', outcome: 'task' },
  { text: '/done T12', kind: 'done', outcome: 'task' },
  { text: '/schedule T12 10/9 09:00', kind: 'schedule', outcome: 'task' },
  { text: '/progress', kind: 'progressList', outcome: 'read' },
  { text: '/review', kind: 'review', outcome: 'read' },
  { text: '/today', kind: 'today', outcome: 'read' },
  { text: '/focus status', kind: 'focus', outcome: 'read' },
  { text: 'Anh còn việc gì?', kind: 'list', outcome: 'read' },
  { text: 'Mục tiêu này xong rồi', kind: 'goal', outcome: 'confirm' },
  { text: 'Gắn task này vào mục tiêu', kind: 'goal', outcome: 'contextual' },
  { text: 'Task này để tuần sau', kind: 'review', outcome: 'contextual' },
  { text: 'Tuần này anh ưu tiên apply, cần sửa CV cho vị trí mobile trước.', kind: 'add', outcome: 'contextual' },
  { text: 'Việc này nên làm trước thế nào?', kind: 'unknown', outcome: 'ask' },
  { text: 'Mục tiêu nào đang ưu tiên?', kind: 'unknown', outcome: 'ask' },
  { text: 'Cảm ơn em', kind: 'thanks', outcome: 'non_mutating' },
  { text: 'Hủy', kind: 'reject', outcome: 'non_mutating' },
  { text: 'Anh đang suy nghĩ thêm', kind: 'unknown', outcome: 'non_mutating' },
] as const;

// Không dùng hội thoại thật. Mỗi case giả lập câu được reply để context pack phải ưu tiên
// reference Telegram thay vì suy đoán từ vị trí tin nhắn gần nhất.
export const pilotReplyContextCorpus = [
  { source: 'Task CV mobile cần sửa phần thành tích', reply: 'Việc này nên làm trước thế nào?' },
  { source: 'Mục tiêu tuần này là cập nhật portfolio', reply: 'Mục tiêu này có cần thêm task không?' },
  { source: 'Anh cần gửi năm hồ sơ trong tuần này', reply: 'Cam kết này đang thiếu gì?' },
] as const;

// Các câu này được chạy qua webhook → inbox → Processor → outbox/D1 trong test,
// thay vì chỉ kiểm tra nhánh parser. Chúng là lát cắt của tuần pilot đã xác nhận.
export const pilotExecutionWalkthrough = [
  { text: 'Anh đã public Navi lên GitHub', reply: 'Đã ghi nhận cho “Public Navi lên GitHub”' },
  { text: 'Anh vừa apply job Backend Developer', reply: 'Đã ghi nhận cho “Apply 5 jobs”' },
  { text: 'Hôm nay anh đã chạy bộ', reply: 'Đã ghi nhận cho “Chạy bộ 3 buổi”' },
  { text: 'Anh đã đọc sách', reply: 'Đã ghi nhận cho “Đọc sách 2 buổi”' },
  { text: '/add Viết README', reply: 'Đã thêm T12: Viết README' },
  { text: '/schedule T12 {{tomorrow}} 09:00', reply: 'Đã đặt nhắc T12: Viết README' },
  { text: '/today', reply: 'Hôm nay' },
  { text: '/progress', reply: 'Tiến độ tuần' },
  { text: 'Anh còn việc gì?', reply: '○ T12: Viết README' },
  { text: 'Cảm ơn em', reply: 'Dạ, em ở đây' },
] as const;
