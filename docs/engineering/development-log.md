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

## 2026-09-09 17:15 — Chỉnh sửa tiến độ có xác nhận

- Đã làm: `/progress` trả tiến độ và các lượt đã ghi với mã `P...`; hỗ trợ `/progress edit P... Tên mới` cho lượt apply và `/progress delete P...` cho mọi lượt.
- Kiểm soát: mọi sửa/xoá tạo một yêu cầu chờ. Chỉ `đúng` mới thay đổi dữ liệu; `hủy` giữ nguyên. Mỗi chat chỉ có một yêu cầu chỉnh tiến độ đang chờ để không xác nhận nhầm.
- Dữ liệu: thêm `progress_change_requests` làm audit trail cho yêu cầu đã duyệt hoặc từ chối; không lưu lại một occurrence đã xoá như dữ liệu active.
- Đã kiểm chứng: test D1/Workers bao phủ danh sách, đổi tên, hủy xoá và xoá sau xác nhận.

## 2026-09-09 17:30 — Inline action buttons trên Telegram

- Đã làm: thêm nút `Đúng` và `Hủy` cho bản nháp kế hoạch, đề xuất task và chỉnh tiến độ; thêm `Xem tiến độ` sau khi ghi nhận kết quả.
- An toàn: callback mang mã của đối tượng đang chờ (`weekly`, `task`, `progress`), được kiểm tra với owner chat và trạng thái pending. Nút cũ không thể xác nhận nhầm một yêu cầu khác.
- Độ bền: reply markup được lưu cùng outbox delivery, nên retry Telegram vẫn gửi đúng nút. Callback query được trả lời ngay để Telegram bỏ trạng thái loading.
- Đã kiểm chứng: test sử dụng callback scoped để duyệt một task và kiểm tra markup được giao cùng tin nhắn.

## 2026-09-09 17:45 — Daily Execution Loop

- Đã làm: `/today` tổng hợp kế hoạch, tiến độ và task trong ngày; `/schedule T... dd/mm HH:mm` đặt một reminder cho task.
- Nhắc task: đến giờ, Telegram hiện `Đã làm`, `Dời 1 ngày` và `Bỏ nhắc`. Dời lịch giữ task mở; bỏ nhắc không xoá task.
- Nhịp pilot: briefing lúc 08:00; reminder tiến độ 20:00 giữ nguyên; review tuần tự gửi Chủ nhật 19:00, liệt kê task mở và hỗ trợ `/review carry T...` để đánh dấu task cho tuần kế tiếp.
- Độ bền: bảng occurrence riêng chống gửi lặp cho briefing, task reminder và weekly review; mọi thông báo tiếp tục dùng job/outbox hiện có.
- Đã kiểm chứng: test D1/Workers bao phủ dashboard, one-time task reminder cùng markup, briefing một lần/ngày và review một lần/tuần.

## 2026-09-09 18:00 — Job Application Pipeline

- Đã làm: thêm `/jobs` để lưu công ty, vị trí và URL JD; mỗi job có mã `J...`, trạng thái `applied`, `followed_up`, `responded`, `interview`, `offer` hoặc `rejected`.
- Nhịp follow-up: job mới mặc định được nhắc sau 5 ngày nếu vẫn ở `applied`. Reminder có nút `Đã follow-up` và `Dời 2 ngày`; occurrence được đánh dấu ngay khi xếp hàng để Cron không gửi trùng.
- Tiến độ: một job thêm bằng pipeline đồng thời ghi đúng một lượt apply vào chỉ tiêu tuần. Câu báo apply tự do hiện có vẫn giữ hành vi cũ để không làm thay đổi lịch sử.
- Telegram: thêm `/jobs` vào menu native và `/help` gồm cú pháp thêm job, cập nhật trạng thái và đặt lại follow-up.

## 2026-09-09 18:15 — Bỏ job pipeline, quay về trợ lý theo mục tiêu

- Quyết định: `apply job` là một ví dụ của tiến độ cam kết, không phải domain riêng của Navi. Pipeline, mã `J...` và follow-up tuyển dụng làm sản phẩm bị thu hẹp và tạo thêm thao tác không cần thiết.
- Đã dọn: gỡ `/jobs` khỏi menu, trợ giúp, parser, Worker và Cron. Migration mới xoá bảng thử nghiệm; giữ migration tạo bảng trong lịch sử để môi trường D1 đã deploy không bị lệch.
- Hướng tiếp: xây check-in tiến độ theo mục tiêu/cam kết/thói quen đang hoạt động, để cùng một luồng nhận được apply job, phần đã xong của side project hoặc bất kỳ kết quả đo được nào.

## 2026-09-09 18:30 — Check-in theo mục kế hoạch

- Đã làm: kế hoạch tuần tạo bốn mục có cấu trúc: mục tiêu, cam kết và hai thói quen. Mỗi mục có metric `count` khi câu chứa một chỉ tiêu số, hoặc `completion` cho kết quả hoàn thành một lần.
- Chat: các câu kết quả như “Anh đã public Navi lên GitHub” hoặc “Anh đã đọc sách” được đối chiếu với mục kế hoạch hiện hành. Navi chỉ ghi khi có đúng một mục khớp; không khớp hoặc nhiều khả năng thì yêu cầu nói rõ hơn.
- Dữ liệu: `weekly_checkins` giữ occurrence gắn với `weekly_plan_items`; `/progress` hiển thị trạng thái của các mục hoàn thành hoặc đã có check-in. Luồng apply/chạy bộ cũ vẫn giữ nguyên để bảo toàn lịch sử pilot.
- Đã kiểm chứng: test bao phủ metric lúc lập tuần, check-in generic, hoàn thành mục tiêu, và không ghi dữ liệu khi câu “việc đó” thiếu ngữ cảnh.

## 2026-09-09 20:05 — Hợp nhất tiến độ vào check-in chung

- Đã làm: câu apply và chạy bộ giờ cũng đi vào `weekly_checkins`, cùng đường với mục tiêu và thói quen khác. Khi đọc một kế hoạch cũ, Navi tự nối các occurrence apply/chạy bộ lịch sử vào đúng cam kết hoặc thói quen để không mất tiến độ đã ghi.
- Hiển thị và nhắc: `/progress`, dashboard, nhắc tối và review đọc số liệu từ mục kế hoạch/check-in thay vì duy trì hai bộ đếm active.
- Chỉnh sửa: `/progress` hiển thị mã `C...`; hỗ trợ `/progress edit C... Nội dung mới` và `/progress delete C...`, chỉ áp dụng sau khi anh xác nhận. Audit request giữ lại khi một check-in bị xoá.

## 2026-09-09 20:20 — Chọn mục check-in khi ngữ cảnh mơ hồ

- Đã làm: khi một câu báo kết quả khớp nhiều mục kế hoạch, Navi hiện tối đa ba nút chọn thay vì yêu cầu anh gõ lại.
- An toàn: selection request giữ chat, tuần, update gốc và danh sách item hợp lệ; callback chỉ ghi khi request còn pending và item nằm trong danh sách đó. Nút cũ hoặc callback sửa tay chỉ nhận phản hồi hết hiệu lực.
- Đã kiểm chứng: regression test bao phủ câu “Anh đã hoàn thành Navi” khớp hai mục, markup Telegram scoped và việc chỉ item được chọn nhận check-in.

## 2026-09-09 20:40 — Daily Loop theo mọi mục kế hoạch

- Đã làm: `/today`, `/week status` và review tuần hiển thị toàn bộ mục tiêu, cam kết và thói quen, kèm trạng thái `đã/chưa hoàn thành` hoặc tiến độ số lượng.
- Nhắc tối: Cron giờ liệt kê mọi mục chưa đạt, thay vì chỉ nhận biết apply và chạy bộ. Một mục tiêu one-off như public GitHub hay thói quen đọc sách cũng được nhắc khi còn thiếu.
- Đã kiểm chứng: test bao phủ dashboard, reminder và Sunday review với mục tiêu one-off, cam kết số lượng và hai thói quen; các test D1/Worker đều đạt.

## 2026-09-09 20:50 — Pilot corpus và telemetry check-in

- Đã làm: thêm corpus 20 câu tiếng Việt cho task, kế hoạch, check-in, câu mơ hồ, đọc trạng thái và câu không được tạo dữ liệu. Test cố định parser với kết quả kỳ vọng của từng câu.
- Telemetry: `checkin_outcomes` chỉ lưu chat ID, update ID, nhãn outcome và thời điểm. Bốn outcome là `recorded`, `ambiguous`, `unmatched`, `selected`; không lưu lại nội dung tin nhắn ngoài lịch sử hội thoại đã có.
- Đã kiểm chứng: test xác nhận check-in rõ ràng có `recorded`, lựa chọn inline chuyển `ambiguous` thành `selected`, cùng toàn bộ corpus và luồng D1/Worker.

## 2026-09-09 21:05 — Chuyển tuần và review sau check-in chung

- Đã làm: `/week` của tuần mới hiển thị task đã chọn carry-over; khi kế hoạch mới được xác nhận, kế hoạch active cũ được archive. `/today` đánh dấu task giữ từ tuần trước.
- Review: kiểm tra thay đổi từ khi thêm check-in chung theo yêu cầu sản phẩm và quy tắc repo. Đã sửa matcher bỏ qua từ “làm”, khôi phục thời điểm thực cho check-in chạy bộ có ngày, giữ giới hạn tuần, và thêm hạn 24 giờ cho nút chọn mục mơ hồ. Nút sau hạn hoặc sau khi plan bị archive tự bị từ chối.
- Giới hạn còn theo dõi: các bảng progress cũ vẫn tồn tại để nối dữ liệu pilot lịch sử vào check-in mới; chưa xoá khi chưa có migration/export thay thế. Corpus hiện khóa phân loại 20 câu và một số hành vi trọng yếu; sẽ mở rộng thành test end-to-end theo dữ liệu pilot thật.
- Đã kiểm chứng: test review → carry → tuần mới → dashboard, check-in ngày cụ thể, 34 tests D1/Worker, typecheck và build.

## 2026-09-09 21:20 — Kế hoạch tuần với một thói quen

- Đã làm: sau thói quen đầu tiên, Navi cho phép anh nhắn “bỏ qua” để không tạo thói quen thứ hai. Bản tóm tắt trước khi xác nhận cũng chỉ hiện các mục thực sự đã chọn.
- Dữ liệu: mục thói quen trống không còn được tạo trong `weekly_plan_items`, vì vậy `/today`, nhắc tiến độ và review tự động chỉ đọc ba mục còn lại.
- Đã kiểm chứng: regression test lập kế hoạch một thói quen, kiểm tra bản tóm tắt, dữ liệu D1 và dashboard.

## 2026-09-09 21:35 — Corpus pilot end-to-end

- Đã làm: một walkthrough từ các câu pilot thật giờ đi qua Telegram webhook, inbox, Processor, D1 và outbox giả lập trong cùng một test.
- Bao phủ: lập tuần, bốn dạng check-in, thêm task, đặt nhắc, dashboard, tiến độ, danh sách task và câu cảm ơn.
- Giới hạn: corpus 20 câu vẫn giữ test phân loại đầy đủ; walkthrough ưu tiên các luồng có trạng thái và dữ liệu quan sát được, sẽ bổ sung trường hợp mơ hồ/sửa dữ liệu theo log pilot thật khi có thêm dữ liệu.

## 2026-09-09 21:50 — Độ tin cậy ghi check-in

- Đã làm: gom quy tắc chống trùng, số lượng, trạng thái hoàn thành và telemetry vào một đường ghi chung cho câu check-in trực tiếp lẫn nút chọn mục mơ hồ.
- Đã kiểm chứng: một walkthrough D1/Telegram bao phủ chọn mục, ngày chạy bộ cụ thể, sửa check-in sau xác nhận, nút chọn hết hạn và xoá check-in sau xác nhận.

## 2026-09-09 22:10 — Quan sát pilot từ Telegram

- Đã làm: thêm `/status` để đọc dữ liệu vận hành vừa quan sát được: kế hoạch tuần hiện hành, task mở, trạng thái nhắc và check-in gần nhất. Không suy đoán uptime ngoài việc Worker vừa xử lý lệnh.
- Telemetry: `/insights` tổng hợp check-in ghi thẳng, ghi sau khi chọn, chưa nối được mục và lựa chọn còn chờ trong tuần hiện tại. Lệnh không hiển thị nội dung hội thoại mới.
- Telegram: hai lệnh mới được thêm vào Menu và `/help`.

## 2026-09-10 — Xuất dữ liệu pilot

- Đã làm: `/export` tạo bản Markdown của kế hoạch tuần, tối đa 6 task gần nhất và 6 check-in tuần hiện tại; `/export json` trả cùng snapshot ở dạng máy đọc được.
- Giới hạn: Telegram có giới hạn độ dài tin nhắn nên export chủ động giới hạn danh sách. Đây là snapshot gửi riêng cho chat đã pairing, không phải backup lịch sử đầy đủ hay file đính kèm.

## 2026-09-10 — Khôi phục callback Telegram cho nút inline

- Nguyên nhân: webhook Telegram pilot chỉ đăng ký update kiểu `message`. Các nút inline như “Xem tiến độ” gửi `callback_query`, nên Telegram không chuyển update đến Worker; D1 không tạo job và chat không có phản hồi.
- Đã làm: thêm `npm run telegram:webhook`, đọc URL webhook hiện có và cấu hình rõ `message` cùng `callback_query`, giữ webhook secret và không bỏ update đang chờ. Script xác nhận lại cấu hình sau khi ghi.
- Đã kiểm chứng: regression test gửi callback thật qua ingress → D1 job → Processor/outbox giả lập và nhận nội dung “Tiến độ tuần”. Cần chạy script với secret local để đồng bộ cấu hình Telegram thật.

## 2026-09-10 — Giữ lịch sử tiến độ khi kế hoạch đổi thói quen

- Phát hiện từ pilot: hai lượt chạy bộ ngày 07 và 08/09 vẫn có trong `weekly_progress_events`, không có yêu cầu xoá/sửa, nhưng bị ẩn khi kế hoạch tuần hiện tại không còn mục chạy bộ. Đây là dữ liệu legacy chưa gắn được vào mục kế hoạch mới.
- Đã làm: `/progress` giờ hiển thị rõ “Lịch sử đã ghi, chưa gắn với mục kế hoạch hiện tại” cho các lượt legacy chưa được materialize thành check-in. Lượt đã gắn không bị hiện lặp lại.
- Đã kiểm chứng: regression test tạo kế hoạch không có chạy bộ cùng hai lượt chạy legacy, rồi kiểm tra cả hai ngày vẫn xuất hiện trong `/progress`.

## 2026-09-10 — Gắn loại mục rõ trong tiến độ

- Đã làm: `/progress` hiển thị rõ từng mục là `Mục tiêu`, `Cam kết` hoặc `Thói quen N`; mỗi check-in cũng ghi mục mà nó thuộc về. Điều này giúp phân biệt kết quả theo kế hoạch với lịch sử chưa gắn mục.
- Đã sửa: dòng tóm tắt apply/chạy bộ chỉ xuất hiện khi chính kế hoạch tuần có cam kết apply hoặc thói quen chạy bộ; không còn tạo cảm giác Navi đang theo dõi một thói quen không có trong kế hoạch.
- Đã kiểm chứng: regression test kiểm tra một plan không có chạy bộ vẫn gắn nhãn đủ mục tiêu/cam kết/thói quen và không hiện bộ đếm chạy bộ.

## 2026-09-10 — Bảng tiến độ trực quan trong Telegram

- Đã làm: thay danh sách phẳng trong `/progress` và `/today` bằng bảng tuần dễ quét trên điện thoại. Mục tiêu/cam kết/thói quen là các khối riêng; mục có chỉ tiêu số dùng thanh 8 ô `█░` kèm tỷ lệ; mục một lần dùng `✓` hoặc `○`.
- Phạm vi: đây là visualization chữ từ dữ liệu D1 hiện có, không cần tạo ảnh chart hoặc thêm dịch vụ mới. Vì vậy nó phản hồi nhanh, dùng được trong chat và không tạo dữ liệu diễn giải ngoài trạng thái thực.
- Đã kiểm chứng: regression test bảo đảm metric 0/5 hiện đủ tám ô trống và mục one-off hiện trạng thái chưa hoàn thành.

## 2026-09-10 — Thói quen theo occurrence hằng ngày

- Quyết định: thói quen pilot là hành vi mỗi ngày. Con số thời lượng trong tên, như “Thiền trong 5 phút”, là ngưỡng của một ngày chứ không phải số lần cần cộng trong tuần.
- Đã làm: habit mới và habit đang active đều dùng target 7 ngày; mỗi check-in habit ghi quantity 1 và chống trùng theo habit + ngày. Navi hiểu trực tiếp câu thiền/nghe, bảng tuần hiển thị ngưỡng mỗi ngày, `x/7 ngày` và chuỗi hiện tại.
- Giới hạn: cadence hiện cố định hằng ngày. Lịch chỉ ngày thường, một số ngày/tuần hoặc thói quen theo lịch riêng là chặng tiếp theo, cần model dữ liệu cadence riêng thay vì tái dùng target tuần.

## 2026-09-10 — Review mô hình mục tiêu, task và thói quen

- Đã review tĩnh trạng thái `1191cd6`; kết quả trong `docs/reviews/domain-progress-review-2026-09-10.md`.
- Phát hiện: thiếu liên kết task–goal; ngưỡng phút chưa được kiểm tra; cadence bị ép 7 ngày; streak chưa nối qua tuần; sửa note có thể mất chống trùng; legacy có nguy cơ hiện lặp/tái tạo sau xoá; tin tiến độ dài chưa phân trang.
- Điều chỉnh nhận định: 42 tests trước đó chưa bao phủ các trường hợp này. Mô hình đang đủ cho pilot cơ bản, chưa đủ chắc để mở rộng; ưu tiên sửa phép tính và dữ liệu trước làm thêm chart.
- Lượt này chỉ lưu kết quả review và thứ tự triển khai, không thay đổi runtime hoặc dữ liệu production.

## 2026-09-10 — Nền dữ liệu mục tiêu, thói quen và việc riêng

- Đã làm: thêm `goals` và `habit_definitions` làm nguồn dữ liệu chuẩn theo chat; task có thể gắn `goal_id`, còn mục kế hoạch tuần giữ liên kết đến goal/habit và cadence riêng.
- Thói quen: Navi nhận `3 buổi` hoặc `2 lần` là chỉ tiêu tuần (`x/n lần`); thói quen không có lịch riêng vẫn là hằng ngày (`x/7 ngày`). Thói quen có ngưỡng, như `Thiền trong 5'`, ghi giá trị thực tế; dưới 5 phút được lưu minh bạch nhưng chưa cộng tiến độ. Cập nhật cùng ngày có thể thay bản ghi dưới ngưỡng bằng lần đủ ngưỡng.
- Task: `/add` tạo việc riêng; `/add mục tiêu: ...` gắn task với mục tiêu tuần hiện hành. `/list` và `/today` ghi rõ phạm vi để tránh lẫn lộn.
- Dữ liệu: check-in habit có ngày địa phương và chống trùng theo habit/ngày; streak hằng ngày đọc qua các tuần với cùng habit. Xoá check-in legacy đồng thời xoá event nguồn để dữ liệu không tự materialize lại.
- Đã áp dụng migration `0018_goal_habit_foundations.sql` trên D1 remote và deploy Processor version `bb5c88ac-8eb4-4de6-85f5-05a176b59088`.
- Đã kiểm chứng: `npm run check` (43 tests, typecheck và build) pass trước deploy.

## 2026-09-10 — Review lại sau nền dữ liệu 0018

- Review tĩnh `191ea55`; chi tiết tại `docs/reviews/foundations-followup-2026-09-10.md`.
- Phát hiện còn thiếu: sửa note thay đổi measurement; ngày/ID lịch sử chưa backfill; cadence có cả phút và lịch tuần đọc sai; query legacy vẫn thiếu source_update; streak hôm nay chưa check-in về 0; chưa có pending lượng thực hiện và phân trang tin dài.
- Đính chính phạm vi lần trước: uniqueness ngày chỉ áp dụng bản ghi có local_date; streak qua tuần chỉ nối các mục đã liên kết cùng habit_id. Chưa chứng minh toàn bộ lịch sử cũ đã được chuyển đổi.
- Lượt này lưu kết quả review và nhóm việc A/B/C, không đổi runtime, không deploy, không thao tác dữ liệu production. Test pass trước đây là bằng chứng cho bộ ca cũ, chưa phải các ca vừa phát hiện.

## 2026-09-10 — Khắc phục độ tin cậy dữ liệu check-in

- Đã sửa: sửa nội dung check-in không còn thay đổi số phút hoặc trạng thái đạt ngưỡng. Bằng chứng đo lường chỉ đổi khi có một luồng thay đổi measurement riêng.
- Đã sửa: nhận diện thói quen tách thời lượng và nhịp. Ví dụ `Thiền 5 phút, 3 buổi/tuần` được lưu thành ba lần/tuần với mức tối thiểu năm phút; `mỗi ngày` ưu tiên nhịp hằng ngày. Số trong tên mục tiêu không còn tự biến thành chỉ tiêu.
- Đã sửa: kế hoạch lưu cadence và ngưỡng ngay lúc xác nhận. Lịch sử legacy chỉ materialize lượt apply vào đúng cam kết apply; `/progress` lọc event legacy bằng toàn bộ check-in cùng nguồn để không hiện lặp vì giới hạn trang.
- Dữ liệu: migration `0019_backfill_habit_checkin_dates.sql` đã điền `local_date` cho habit check-in cũ, ưu tiên ngày ISO của lượt chạy legacy rồi đến ngày Việt Nam của lúc ghi. `UPDATE OR IGNORE` giữ nguyên bản ghi nếu dữ liệu cũ trùng ngày, không xoá hoặc gộp bằng chứng.
- Đã áp dụng migration remote và deploy Processor version `feed2fb0-f411-4270-b8a6-5368cf2ed7e4`.
- Đã kiểm chứng: `npm run check` pass với 45 tests, typecheck và Worker build dry-run. Test mới bao phủ sửa note giữ measurement, cadence có cả thời lượng/lịch tuần và backfill ngày chạy legacy.

## 2026-09-10 — Đo thói quen tiếp nối và lịch sử phân trang

- Đã làm: khi cập nhật habit thiếu mức đo, Navi tạo một yêu cầu số phút có scope habit/ngày và hạn 24 giờ. Anh có thể trả lời ngắn `5 phút`; Worker nối câu trả lời với yêu cầu đang chờ, kiểm tra ngưỡng và lưu check-in bền vững. Không có yêu cầu chờ thì câu số phút không tự tạo progress.
- Đã làm: `/progress` giữ tổng quan và hiển thị sáu check-in/lượt legacy mỗi trang. `/progress 2` hoặc nút Trang sau/Trang trước xem tiếp lịch sử; formatter giữ payload ngắn hơn giới hạn Telegram.
- Dữ liệu: migration `0020_checkin_measurement_requests.sql` thêm trạng thái pending/recorded/expired cho yêu cầu số phút, không chứa secret hay thay đổi check-in cũ.
- Đã áp dụng migration remote và deploy Processor version `f7eaf5e8-48e5-42be-810b-389ae9c2b807`.
- Đã kiểm chứng: `npm run check` pass với 47 tests, typecheck và Worker build dry-run. Ca mới kiểm tra trả lời bare `5 phút` và trang hai của progress.

## 2026-09-10 — Hoàn thiện vòng check-in hằng ngày

- Đã làm: một yêu cầu số phút mới thay thế yêu cầu trước đó. Nút Hủy chỉ hủy đúng yêu cầu đã tạo nút; `/cancelmeasurement` hủy các yêu cầu còn chờ. Yêu cầu quá 24 giờ được đánh dấu hết hạn trước khi xử lý câu trả lời. Nếu dữ liệu cũ có nhiều yêu cầu chờ, Navi yêu cầu anh gửi lại cập nhật có tên habit thay vì tự chọn.
- Đã làm: câu trả lời số phút dùng ngày của câu hỏi ban đầu, kể cả khi anh trả lời sau nửa đêm. Một check-in trực tiếp cho cùng habit/ngày cũng tự đóng yêu cầu số phút đang chờ.
- Đã làm: `/today` hiển thị từng habit là `chưa ghi nhận`, `đã ghi nhận, chưa đủ ngưỡng` hoặc `đã đạt`. Streak hằng ngày giữ chuỗi đến hôm qua khi hôm nay chưa có check-in, thay vì hiện 0 từ đầu ngày.
- Đã làm: `/progress` trang đầu dùng bảng tiến độ và lịch sử giới hạn; các trang sau chỉ hiện lịch sử. Nội dung check-in, title task và title mục bị cắt có kiểm soát để giữ delivery trong giới hạn Telegram.
- Đã deploy Processor version `4a732df1-a7a4-4ec9-a2e1-803ec12f0a04`.
- Đã kiểm chứng: `npm run check` pass với 49 tests, typecheck và Worker build dry-run. Ca mới phủ qua nửa đêm, hủy/hết hạn, nhiều request chờ, trạng thái hôm nay và lịch sử dài.

## 2026-09-10 — Vòng đời mục tiêu và task hỗ trợ

- Đã làm: thêm `/goal` để xem mục tiêu tuần, trạng thái mục tiêu, task hỗ trợ đã gắn và các việc riêng có thể gắn. Người dùng có thể dùng `/goal add T123` hoặc `/goal remove T123`; các nút nhanh thực hiện cùng thao tác.
- Đã làm: `/goal done` và `/goal reopen` luôn yêu cầu xác nhận. Hoàn thành task không tự suy ra mục tiêu đã đạt; check-in ghi thẳng đúng mục tiêu thì mới đồng thời hoàn tất mục tiêu đó.
- Đã làm: `/week continue` giữ nguyên identity của mục tiêu tuần trước, chỉ hỏi lại cam kết và thói quen của tuần mới. Identity được nối qua `normalized_title`, nên task đã gắn và lịch sử mục tiêu không bị nhân bản khi tên mục tiêu giữ nguyên.
- Telegram: đã bổ sung `/goal` vào command menu.
- Đã kiểm chứng: `npm run check` pass với 51 tests, typecheck và Worker build dry-run. Ca mới phủ xem/gắn/bỏ gắn task, xác nhận đóng/mở mục tiêu và tiếp tục mục tiêu qua tuần.

## 2026-09-10 — Review tuần có thể hành động

- Đã làm: `/review` và bản review tự gửi cuối tuần dùng cùng một bản tóm tắt: mục tiêu, cam kết, từng thói quen, các task còn mở và phạm vi task (hỗ trợ mục tiêu hoặc việc riêng).
- Đã làm: mỗi review hiện tối đa năm task với nút `Đã xong` và `Sang tuần`. Nút `Sang tuần` dùng cùng luồng durable với `/review carry T...`, nên chỉ đánh dấu một carryover và không nhân bản task.
- Giới hạn: review không tự quyết định xoá hoặc chuyển task; người dùng chọn rõ từng task. Khi có hơn năm task, Navi báo số còn lại và hướng dẫn dùng `/list`.
- Đã kiểm chứng: `npm run check` pass với 52 tests, typecheck và Worker build dry-run. Ca mới phủ render nút review và callback chuyển task sang tuần.

## 2026-09-10 — Hướng dẫn và ngữ cảnh hội thoại an toàn

- Đã làm: `/help` bổ sung nhóm mục tiêu, tuần tiếp theo và ví dụ câu nói tự nhiên để các lệnh mới không chỉ xuất hiện trong Telegram menu.
- Đã làm: Navi hiểu `mục tiêu này xong rồi`, `mở lại mục tiêu này`, `gắn task này vào mục tiêu`, `bỏ task này khỏi mục tiêu` và `task này để tuần sau`. Các tham chiếu này chỉ được nối khi đúng một task đang mở; có nhiều task thì Navi yêu cầu mã `T...` thay vì đoán.
- An toàn dữ liệu: hoàn tất mục tiêu vẫn mở màn xác nhận; chuyển task sang tuần vẫn đi qua bản ghi carryover có unique key như lệnh `/review carry T...`.
- Đã kiểm chứng: `npm run check` pass với 53 tests, typecheck và Worker build dry-run. Ca mới phủ parser, task ngữ cảnh, confirmation mục tiêu, carryover và nội dung `/help`.

## 2026-09-10 — Task được nói trong ngữ cảnh mục tiêu

- Sự cố pilot: câu “mục tiêu apply 5 CV trong tuần này anh cần có task mới là xây dựng lại make CV cho từng vị trí” trước đây không khớp parser. Nó rơi vào OpenRouter, làm mất scope mục tiêu và thêm độ trễ từ model ngoài.
- Đã sửa: parser nhận mẫu `mục tiêu … cần có task mới là …`, giữ nguyên nội dung task người dùng nói và gắn task vào mục tiêu tuần hiện hành. Luồng này không gọi AI fallback.
- Độ trễ: Queue Processor có batch tối đa một giây. Với mẫu đã nhận diện, đường xử lý chỉ còn Queue, D1 và Telegram; giới hạn chờ OpenRouter 15 giây không còn áp dụng cho câu này.
- Đã kiểm chứng: `npm run check` pass với 54 tests, typecheck và Worker build dry-run. Regression test dùng đúng câu pilot, kiểm tra task được gắn mục tiêu và AI fallback không được gọi.
