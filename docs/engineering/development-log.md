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
