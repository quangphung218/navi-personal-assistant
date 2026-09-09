# Telegram task preview — 09/09/2026

Đây là lát cắt thực thi đầu tiên, chưa phải toàn bộ pilot trợ lý điều phối tuần.

## Đã có

- Ghép một tài khoản Telegram cá nhân bằng mã ngẫu nhiên 256 bit, hạn 24 giờ. Mã không được lưu vào jobs. Sau khi ghép, chỉ đúng user và private chat đã đăng ký được ghi dữ liệu; mã không thể thay chủ tài khoản.
- `/add Viết README`, `/list`, `/list all`, `/done T123`, `/help`. Hỗ trợ thêm một số câu tiếng Việt như “Thêm việc …”, “Anh còn việc gì?”, “Xong T123”. Tên trùng cần dùng mã việc.
- Hoàn thành mang nguồn `user_reported`: ghi nhận xác nhận của chủ tài khoản, không tuyên bố bot đã tự thực hiện công việc.
- `/week` tạo kế hoạch tuần có xác nhận. `/week status` xem tiến độ; câu “Anh vừa apply job Backend Developer” và “Hôm nay anh đã chạy bộ” ghi sự kiện nguồn `user_reported`. Một vị trí chuẩn hóa chỉ được tính một lần mỗi tuần; chạy bộ được tính tối đa một buổi mỗi ngày theo `Asia/Ho_Chi_Minh`.
- Ingress lưu job vào D1 trước khi trả HTTP 200. Queue chỉ đánh thức bộ xử lý; Cron mỗi 5 phút khôi phục các job chưa được phát đi. Khóa có hạn và token bảo vệ các lần ghi; task, kết quả job và outbox cùng một transaction.
- Tin Telegram trùng `update_id` không tạo việc trùng. Hai tin riêng cùng tên vẫn là hai việc.
- Gửi phản hồi gặp 429 được thử lại có giới hạn; timeout/5xx hoặc trạng thái gửi không rõ được giữ `unknown`, không gửi lại mù. Có thể dùng `/list` để đọc trạng thái đã lưu.

## Cloud hiện tại

- Account được kiểm tra trước triển khai; ID nằm trong hai config cloud.
- Ingress: `personal-assistant-ingress`, URL `https://personal-assistant-ingress.quangphung-assistant-05b11d.workers.dev`.
- Processor: `personal-assistant-processor`, không có URL công khai; queue consumer và Cron đã triển khai.
- D1: `personal-assistant-pilot`, migration `0001_tasks.sql` đã áp dụng remote.
- Queue: `personal-assistant-jobs`, batch 1, concurrency 1, retention 24 giờ. D1 giữ job nếu queue hết hạn hoặc publication thất bại.
- Ingress có ba Cloudflare Secrets: webhook secret, bootstrap code và expiry. Processor chỉ có Telegram bot token. OpenRouter key chưa upload vì chưa dùng.
- Logs chỉ dùng mã sự kiện; không ghi nội dung chat, URL Telegram chứa bot token hoặc lỗi fetch nguyên bản. Tắt automatic traces ở processor để tránh ghi token trong URL Telegram; ingress bật traces. Đây là ngoại lệ có chủ đích với hướng dẫn observability của skill.

Mở file local `connect-telegram.txt` (được gitignore, quyền 600), mở liên kết bằng Telegram rồi bấm Start. Liên kết dành riêng cho chủ bot. Không đưa file này lên GitHub. Cơ chế bootstrap local thay web pairing qua Access trong lát cắt này; chưa có màn hình thu hồi/đổi tài khoản.

## Kiểm chứng

`npm exec --yes --package=node@24 -- npm run check` đã qua: generated bindings, TypeScript ứng dụng và tests, 15 test workerd/D1, dry-run cả hai Worker. Tests dùng fake sender, không gọi Telegram hay OpenRouter thật. Bao phủ duplicate/concurrency, owner authorization, code hết hạn, input quá lớn, completion lặp, transaction rollback, lease recovery và delivery retry/unknown.

Health cloud trả 200; webhook không có secret trả 401; update không có message với secret hợp lệ trả 200. Telegram setWebhook đã thành công, getWebhookInfo có pending=0 và không có lỗi. Trò chuyện Telegram đầu cuối cần chủ tài khoản mở liên kết ghép và gửi lệnh; chưa được tính là đã nghiệm thu chỉ từ health hoặc test giả lập.

`npm run dev` vẫn là probe local riêng để kiểm tra môi trường/D1; không phải toàn bộ bot. `npm test` chạy tích hợp task bằng runtime Workers cô lập. `npm run types` dùng config test có cùng bindings và widened strings, không cần credentials trên checkout mới.

## Vận hành và phần tiếp theo

Triển khai lại code: chạy `npm run check`, kiểm tra đúng account, áp dụng migration mới bằng `npx wrangler d1 migrations apply personal-assistant-pilot --remote --config wrangler.ingress.jsonc`, rồi `npx wrangler deploy --config wrangler.processor.jsonc` và `npx wrangler deploy --config wrangler.ingress.jsonc`. Secrets đã upload được giữ qua deploy. Không deploy `wrangler.local.jsonc`.

Trước migration có dữ liệu, export D1 vào thư mục `backups/` được ignore và kiểm chứng khôi phục ở database cô lập. Code rollback không hoàn tác schema/data. Chưa thực hiện diễn tập restore hay kiểm chứng 24/7 dài ngày.

Đã có adapter DeepSeek V4 Flash qua OpenRouter cho tin nhắn không khớp lệnh chắc chắn. Adapter gửi tối đa 4.000 ký tự đầu vào và 400 token đầu ra; D1 giữ khoản dự phòng 0,02 USD cho mỗi lượt, với trần 0,80 USD theo tháng UTC. Lỗi OpenRouter được retry theo job, còn trạng thái Telegram vẫn không gửi lại mù. Chưa gọi AI thật trong test và chưa có bộ nhớ dài hạn. Kế hoạch tuần và tiến độ apply/chạy bộ đã có; chưa có lịch nhắc, web admin, pagination đầy đủ hoặc GitHub integration. Danh sách hiển thị tối đa 20 việc mỗi lần. Cron hiện chỉ khôi phục job, chưa gửi nhắc chủ động.

Bước tiếp theo sau khi thử lệnh: tích hợp OpenRouter với budget guard và command schema kiểm chứng; sau đó mới thêm lịch và điều phối mục tiêu/cam kết/thói quen. Không nâng paid plan hoặc tự nạp tiền.
