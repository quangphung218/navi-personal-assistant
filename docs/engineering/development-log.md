# Development log

Nhật ký này là nguồn ghi vết chính cho quá trình phát triển Navi. Mỗi mục ghi một lát cắt có ý nghĩa, không ghi từng lệnh terminal hay tin nhắn xã giao.

## Quy tắc ghi vết

1. Sau mỗi thay đổi có ảnh hưởng đến sản phẩm, kiến trúc, dữ liệu, chi phí hoặc vận hành, thêm một mục mới ở cuối file.
2. Không sửa lịch sử để làm đẹp. Nếu có quyết định mới, thêm mục đính chính và liên kết mục cũ.
3. Ghi sự kiện theo ngày giờ `Asia/Ho_Chi_Minh`, dùng ngày ISO `YYYY-MM-DD`.
4. Tách rõ ba loại thông tin: `đã làm`, `đã kiểm chứng`, và `chưa làm/giả định`.
5. Không ghi secret, token, nội dung riêng tư không cần thiết, hoặc dữ liệu chat thật. Chỉ ghi tên biến secret và mã task nếu cần.
6. Mỗi mục phải chỉ ra file/config/migration liên quan và bước tiếp theo có thể thực hiện được.
7. Khi tổng hợp, dùng nhật ký này cùng git diff, test report và deployment history; không coi một kế hoạch là bằng chứng đã triển khai.

## Mẫu mục ghi vết

```md
## YYYY-MM-DD HH:MM — Tên lát cắt

- Bối cảnh:
- Đã làm:
  - `path/to/file`: thay đổi chính.
- Quyết định:
- Đã kiểm chứng: test, endpoint, migration hoặc deployment cụ thể.
- Chưa làm / giới hạn:
- Chi phí / dữ liệu / rủi ro:
- Bước tiếp theo:
```

## 2026-09-09 10:10 — Telegram task preview và luồng xác nhận

- Bối cảnh: xây lát cắt đầu tiên cho trợ lý cá nhân chạy 24/7 bằng Telegram, Cloudflare Free và D1/Queues.
- Đã làm:
  - `src/entrypoints/ingress.ts`: webhook private chat, ghép một owner và lưu job trước HTTP 200.
  - `src/modules/execution/store.ts`: xử lý `/add`, `/list`, `/done`, outbox và lease có fencing.
  - `src/modules/work/commands.ts`: lệnh chắc chắn, câu tự nhiên thêm task và xác nhận `đúng`/`hủy`.
  - `src/adapters/openrouter.ts`: DeepSeek V4 Flash qua OpenRouter cho yêu cầu chưa khớp lệnh, với giới hạn input/output.
  - `migrations/0001_tasks.sql`, `0002_ai_budget.sql`, `0003_approvals.sql`: task, ngân sách dự phòng và đề xuất chờ duyệt.
  - `wrangler.ingress.jsonc`, `wrangler.processor.jsonc`: hai Worker, D1, Queue consumer và Cron.
- Quyết định: câu tự nhiên không được tự tạo task; phải tạo approval request và chờ owner xác nhận. Câu xã giao như “Cảm ơn em” không gọi AI.
- Đã kiểm chứng: 18 test runtime D1/Workers, typecheck, build dry-run; health cloud 200; migration 0001–0003 đã áp dụng; Telegram webhook đang trỏ vào ingress.
- Chưa làm / giới hạn: kế hoạch tuần, cam kết, thói quen, nhắc lịch, bộ nhớ hội thoại, web admin, GitHub integration và diễn tập restore chưa có. OpenRouter chưa được gọi trong test tự động.
- Chi phí / dữ liệu / rủi ro: AI dự phòng giữ trần 0,80 USD/tháng trong D1; secret chỉ nằm trong Cloudflare/`.dev.vars` và không ghi vào nhật ký.
- Bước tiếp theo: thêm flow kế hoạch tuần gồm một mục tiêu, một cam kết và hai thói quen, vẫn dùng approval trước khi lưu.

## 2026-09-09 10:30 — Chốt nhận diện Navi

- Bối cảnh: chọn hướng logo `The Hidden Path` từ các concept đã xem.
- Đã làm: thêm `assets/brand/navi-mark.svg` cho nền trong suốt và `assets/brand/navi-app-icon.svg` cho avatar/app icon; cập nhật README.
- Quyết định: dải đường gấp tạo chữ N bằng khoảng âm, waypoint coral là tín hiệu bước tiếp theo; bảng màu ink navy, sage và coral.
- Đã kiểm chứng: SVG dùng viewBox vuông, không phụ thuộc font hoặc runtime, hiển thị được ở kích thước nhỏ.
- Chưa làm / giới hạn: chưa có wordmark hoàn chỉnh, favicon PNG/ICO hoặc kiểm tra hiển thị Telegram thực tế.
- Bước tiếp theo: dùng mark này trong web/admin surface khi bắt đầu xây giao diện; tiếp tục flow kế hoạch tuần.

## 2026-09-09 11:20 — Hiệu chỉnh Hidden Path mark

- Bối cảnh: bản SVG đầu tiên lệch concept 01 vì dùng nhiều mảng ghép thành chữ N.
- Đã làm: thay bằng một nét ribbon liên tục; khoảng âm tạo nhịp chữ N, waypoint coral đứng tách ở phía trước; đồng bộ mark trong suốt và app icon.
- Đã kiểm chứng: cả hai SVG dùng viewBox vuông, không phụ thuộc font hoặc runtime.
- Chưa làm / giới hạn: chưa tạo PNG/ICO và chưa kiểm tra trực tiếp ở kích thước Telegram avatar.
- Bước tiếp theo: chọn kích thước xuất và dùng mark trong các bề mặt UI của Navi.

## 2026-09-09 11:35 — Đối chiếu lại concept 01

- Bối cảnh: bản hiệu chỉnh trước vẫn khác reference vì có hai màu trên ribbon và hình học quá giống chữ N dựng thẳng.
- Đã làm: dùng một nét ivory liên tục, cong mềm hơn, waypoint coral lớn hơn và bỏ mảng xanh.
- Quyết định: reference concept 01 là nguồn thị giác ưu tiên; không thêm chi tiết chỉ để làm rõ chữ N.
- Chưa làm / giới hạn: cần render cạnh reference ở kích thước avatar trước khi chốt cuối.

## 2026-09-09 10:45 — Guided weekly plan

- Bối cảnh: cần biến mục tiêu, cam kết và thói quen của tuần mẫu thành dữ liệu có xác nhận.
- Đã làm: thêm `weekly_drafts` và `weekly_plans` trong `migrations/0004_weekly_plans.sql`; `/week` dẫn qua một mục tiêu, một cam kết và hai thói quen, rồi chờ `đúng` hoặc `hủy`.
- Quyết định: bản nháp chỉ thuộc owner chat, mỗi câu trả lời lấp một bước; không lưu kế hoạch trước khi xác nhận cuối.
- Đã kiểm chứng: 19 test runtime D1/Workers và typecheck qua.
- Chưa làm / giới hạn: chưa có nhắc lịch, tracking occurrence hoặc tự tính tiến độ 5 job/3 buổi chạy.
- Bước tiếp theo: thêm tiêu chí định lượng và nhắc tiến độ cho các cam kết đã lưu.

## 2026-09-09 10:55 — Conversation context v1

- Bối cảnh: tin nhắn tự nhiên trước đó chưa được nối thành một cuộc hội thoại có ngữ cảnh.
- Đã làm: thêm `conversation_messages` trong `migrations/0005_conversation_context.sql`; lưu 12 tin gần nhất; truyền context ngắn cho OpenRouter; thêm nhận diện câu hỏi trạng thái task.
- Quyết định: chỉ giữ context ngắn hạn phục vụ cuộc trò chuyện hiện tại, không coi toàn bộ lịch sử chat là bộ nhớ dài hạn.
- Đã kiểm chứng: 20 test runtime D1/Workers, typecheck qua; kiểm tra được trạng thái pending approval và saved task.
- Chưa làm / giới hạn: chưa có tham chiếu “việc đó” theo reply/thread, chưa có memory claims hoặc tóm tắt hội thoại dài.
- Bước tiếp theo: thêm resolver cho task/approval đang được nhắc đến và bộ test từ các câu hội thoại thực tế.

## 2026-09-09 11:05 — Context resolver v1

- Bối cảnh: câu tham chiếu như “việc đó” cần nối với đối tượng gần nhất mà không đoán khi mơ hồ.
- Đã làm: nhận “đánh dấu việc đó xong”, chọn duy nhất task đang mở gần nhất; nhiều ứng viên hoặc không có ứng viên thì yêu cầu mã task.
- Đã kiểm chứng: 21 test runtime D1/Workers và typecheck qua.
- Chưa làm / giới hạn: chưa xử lý reply/thread Telegram hoặc tham chiếu kế hoạch/approval bằng đại từ.
- Bước tiếp theo: thêm bộ câu hội thoại thực tế và resolver cho task trong kế hoạch tuần.

## 2026-09-09 14:15 — Dựng lại logo từ ảnh concept 01

- Bối cảnh: người dùng xác nhận các lần sửa SVG trước vẫn sai hình; những mô tả trước về việc bám reference chưa được kiểm chứng bằng render.
- Đã làm: dùng ảnh concept gốc làm reference cho image generation, lưu `assets/brand/navi-hidden-path.png`, cập nhật README và thêm hướng dẫn brand asset. Gỡ hai SVG sai; có thể phục hồi từ Git history.
- Đã kiểm chứng: xem ảnh kết quả cạnh reference trong hội thoại: đầu trái hình giọt nước, ribbon rộng cong với nếp gấp tối, chấm coral tách riêng. Đây là bản tái dựng, không phải crop nguyên pixel.
- Chưa làm / giới hạn: asset hiện là PNG nền tối, chưa có vector hoặc nền trong suốt. Chưa thay avatar Telegram.
- Bước tiếp theo: dùng PNG hiện tại; mọi bản vector tiếp theo cần đối chiếu hình render với reference trước khi thay thế.

## 2026-09-09 — Logo nền trong suốt

- Yêu cầu: bỏ nền navy của phương án 01.
- Đã làm: tạo `assets/brand/navi-hidden-path-transparent.png` từ logo hiện tại bằng công cụ sửa ảnh; cập nhật README. Giữ bản nền tối làm tham chiếu.
- Kiểm chứng: đã xem ảnh xuất, kiểm tra PNG 1254 × 1254 có alpha với giá trị từ 0 đến 255.
- Giới hạn: bản raster tái dựng, chưa có SVG vector.

## 2026-09-09 14:50 — Weekly Progress v1

- Bối cảnh: kế hoạch tuần đã lưu được nhưng chưa phản ánh số lần ứng tuyển và chạy bộ đã hoàn thành.
- Đã làm: thêm `weekly_progress_events` trong `migrations/0006_weekly_progress.sql`; nhận câu báo apply/chạy bộ và `/week status`; tính mục tiêu số từ cam kết/thói quen tuần.
- Quyết định: mọi kết quả mang nguồn `user_reported`; vị trí ứng tuyển trùng trong cùng tuần không cộng lại; chạy bộ tối đa một occurrence mỗi ngày theo `Asia/Ho_Chi_Minh`.
- Đã kiểm chứng: 22 test workerd/D1 và TypeScript qua; test bao phủ hai kiểu trùng và báo `1/5`, `1/3`.
- Chưa làm / giới hạn: chưa có URL/công ty riêng cho hồ sơ ứng tuyển, chưa sửa/xóa occurrence và chưa nhắc chủ động.
- Bước tiếp theo: chạy pilot với dữ liệu thật, sau đó thêm lệnh sửa occurrence trước khi bật nhắc lịch.

## 2026-09-09 15:50 — Sửa cập nhật chạy bộ có ngày

- Bối cảnh: câu “Ngày 7/9 anh đã chạy bộ” nhận được phản hồi chậm nhưng không tạo occurrence; D1 production chỉ có occurrence apply và chưa có occurrence chạy.
- Nguyên nhân: parser chỉ nhận “Hôm nay anh đã chạy bộ”, nên câu có ngày bị chuyển sang OpenRouter. Model có thể trò chuyện về kết quả nhưng không có quyền ghi tiến độ.
- Đã làm: nhận ngày `d/m` hoặc `d/m/yyyy`, kiểm tra ngày lịch hợp lệ và giới hạn trong tuần đang theo dõi; lưu ngày chuẩn `yyyy-mm-dd` trực tiếp vào `weekly_progress_events`.
- Đã kiểm chứng: thêm regression test từ nguyên văn tin nhắn thực tế, xác nhận không gọi AI và ghi ngày `2026-09-07`.
- Vận hành: sáu delivery gần nhất mất khoảng 2,5–8 giây, ngoại lệ cao nhất gần 58 giây. Nhánh deterministic mới loại bỏ thời gian OpenRouter khỏi cập nhật chạy bộ có ngày.
- Bước tiếp theo: theo dõi độ trễ sau deploy; sau đó thêm telemetry theo từng giai đoạn ingress, xử lý và gửi Telegram nếu vẫn vượt mục tiêu.

## 2026-09-09 16:00 — Nhắc tiến độ tuần và telemetry v1

- Đã làm: Cron kiểm tra kế hoạch tuần mỗi 5 phút và gửi một nhắc tiến độ lúc 20:00 theo giờ Việt Nam khi chỉ tiêu apply hoặc chạy bộ còn thiếu. Mỗi tuần/ngày có unique reminder nên không gửi trùng; không gửi bù sau khung giờ.
- Kiểm soát: `/reminders` xem trạng thái, `/reminders off` tắt và `/reminders on` bật lại. Telegram retry chỉ retry delivery, không tạo thêm reminder.
- Telemetry: thêm `job_metrics` chỉ chứa mốc thời gian queue, xử lý và giao tin cùng trạng thái delivery; không lưu nội dung chat. Bật Workers Logs và trace sampling 10% để điều tra lỗi runtime khi cần.
- Đã kiểm chứng: test D1/Workers bao phủ incomplete plan, một nhắc duy nhất trong ngày, delivery và tắt/bật preference.

## 2026-09-09 16:15 — Telegram command menu và trợ giúp theo tác vụ

- Đã làm: đăng ký menu native gồm tuần, tiến độ, task, nhắc và trợ giúp cho private chat. `/help` được viết lại theo các luồng thực tế thay vì liệt kê kỹ thuật.
- Quyết định: giữ menu ở 7 lệnh ngắn; thao tác có tham số như `/done T123` và `/reminders off` được đưa vào phần trợ giúp để menu không quá tải.
- Vận hành: `npm run telegram:menu` đọc token từ `.dev.vars`, gọi Telegram qua HTTPS, kiểm tra danh sách sau khi ghi và không in token hay response thô.
