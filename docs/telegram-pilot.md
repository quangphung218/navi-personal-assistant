# Bản thử Telegram 24/7 và tuần mẫu

Ngày: 08/09/2026. Trạng thái: đầu vào sản phẩm đã ghi nhận; chưa có bot/server chạy thật. Bổ sung cho [thiết kế hiện hành](personal-assistant-product.md).

## Đầu vào anh đã xác nhận

| Nội dung | Dữ liệu xác nhận | Còn thiếu |
|---|---|---|
| Kênh | Telegram, hội thoại riêng cho bản đầu | Bot và liên kết tài khoản |
| Vận hành | Hoạt động 24/7 trong giai đoạn thử; anh chưa có VPS/server | Host, chi phí và tài khoản triển khai |
| Mục tiêu công việc | Xây chính chatbot Personal Assistant trong repo này và public lên GitHub | Phạm vi bản công bố, deadline và tiêu chí bản dùng được |
| Cam kết định kỳ | Tìm và apply ít nhất 5 job/tuần | Vai trò, địa điểm/remote, tiêu chí phù hợp, hồ sơ và lịch rảnh |
| Thói quen | Chạy bộ 3 buổi/tuần | Ngày/giờ, thời lượng và cách ghi nhận |

Anh mới nêu một thói quen; bản thử dùng đúng một thói quen này. Chưa có cam kết giờ cố định. Side project đã xác nhận là chatbot trong repo này. Chưa có yêu cầu hoàn thành trong một tuần hoặc chạy bao nhiêu km.

## Mô hình tuần mẫu

Tuần tính thứ Hai–Chủ nhật, múi giờ Asia/Ho_Chi_Minh là mặc định đề xuất theo môi trường hiện tại, cần xác nhận khi onboarding. Chưa gắn tuần vào ngày cụ thể hoặc xếp lịch khi chưa có thời gian rảnh.

- Side project: một goal với project liên kết. Các bước nháp: chốt phạm vi → làm luồng chính → kiểm tra chạy được → chuẩn bị README → public GitHub. Tiêu chí nghiệm thu chi tiết chốt theo ý tưởng; URL repo và kiểm tra public là bằng chứng cho bước công bố, không tự chứng minh chất lượng sản phẩm.
- Tìm job: cam kết định kỳ có ngưỡng ít nhất 5 ứng tuyển/tuần. Mỗi cơ hội lưu công ty, vị trí, URL/ID, trạng thái, ngày gửi và nguồn xác nhận. Phân biệt tìm thấy, đang chuẩn bị và đã gửi. Đếm ứng tuyển đã gửi theo vị trí duy nhất trong tuần; retry hoặc sửa hồ sơ cùng lần gửi không cộng thêm. Người dùng xác nhận gửi thì ghi nguồn là tự báo, không giả là đã đối soát bên ngoài.
- Chạy bộ: một habit, mục tiêu 3 lần/tuần; mỗi lần có ngày giờ và nguồn ghi nhận. Chưa ghi nhận là thiếu dữ liệu, không tự ghi thất bại. Nhắc lặp không tạo thêm lần chạy.

Side project có thể hỗ trợ portfolio tìm việc nhưng đó là quan hệ đề xuất, không thay thế chỉ tiêu 5 ứng tuyển. Thời gian dùng chung chỉ tính một lần. Nếu thiếu thời gian, trình phương án đổi phạm vi hoặc lịch, không tự bỏ việc tìm job/chạy bộ.

Ví dụ bản tin khi chưa có dữ liệu: “Tuần này: chatbot chưa chốt phạm vi bản công bố; ứng tuyển chưa có lượt được ghi nhận / mục tiêu ≥5; chạy bộ chưa có buổi được ghi nhận / mục tiêu 3. Bước tiếp theo: chốt phạm vi project và khung giờ rảnh.” Không báo 0 việc thực tế chỉ vì chưa nhập dữ liệu.

## Kết nối và vận hành sau review ngân sách

**Đề xuất hiện hành: Telegram webhook → Cloudflare Workers Free → D1 + Queues + Cron → OpenRouter → DeepSeek → Telegram.** Thay phương án long polling trên VM được đề xuất trước khi biết ngân sách. [Blueprint hạ tầng](engineering/infrastructure.md) và [review stack](engineering/tech-stack-review.md) là nguồn triển khai.

Bot nhận sự kiện trên cloud khi laptop tắt. Đây là mục tiêu chạy 24/7 theo sự kiện, chưa phải uptime được kiểm chứng hoặc tiến trình chạy coding agent liên tục. Nhắc lịch có độ trễ tới một tick cron 5 phút cộng thời gian xử lý; chốt giờ yên lặng riêng.

D1 lưu inbox/job/outbox; queue chỉ đánh thức. Webhook trả thành công sau lưu DB, cron phục hồi việc chưa dispatch, gửi tin lỗi không chạy lại công việc. Telegram giữ update chưa nhận tối đa 24 giờ; webhook và getUpdates không dùng đồng thời. [Telegram Getting updates](https://core.telegram.org/bots/api#getting-updates)

Tạo bot qua [BotFather](https://core.telegram.org/bots/features#botfather), giữ token trong secret phía server. Web admin dùng Access và pairing một lần để liên kết Telegram user/private chat. Chỉ phục vụ tài khoản đã liên kết.

Chưa tạo tài nguyên hoặc nạp tiền. Trước dùng thật phải kiểm tra CPU/quota Free, auth, secret, retry, snapshot/export và restore, cùng luồng gửi tin/nhắc khi laptop tắt. Hạ tầng free có giới hạn; không tự nâng plan. [Nghiên cứu hạn mức và chi phí](research/telegram-infrastructure-options.md).

## Phạm vi hành động bản đầu

Tạo kế hoạch, ghi task/cam kết/thói quen, ghi ứng tuyển đã gửi, nhắc theo lịch đã chọn và trả tiến độ. Hỗ trợ chuẩn bị nháp theo yêu cầu. Chưa có quyền tự gửi hồ sơ cho nhà tuyển dụng hoặc public code; khi triển khai các hành động này cần đích/nội dung và quyền rõ theo thiết kế chung.

Không cần connector tuyển dụng, GitHub hoặc thiết bị chạy bộ để kiểm chứng luồng đầu: nhập URL và ghi nhận chủ động là đủ. Thêm connector sau khi thấy công nhập liệu thực tế.

## Bước triển khai tiếp theo

1. Xây chính chatbot này; chốt phạm vi bản công bố và ngân sách host. Scaffold lõi, fixture và adapter giả lập trên máy trước khi có token/server.
2. Dựng một luồng văn bản Telegram → inbox → job → task → outbox → phản hồi, cùng trang trạng thái dùng chung.
3. Chạy fixture ứng tuyển, chạy bộ và đổi kế hoạch; kiểm tra sự kiện trùng và cập nhật đồng thời.
4. Cấu hình bot/cloud thật, thử mất mạng, restart và restore; sau đó chạy pilot hai tuần.

Không cần bổ sung thói quen thứ hai hoặc xếp đủ cả tuần mới bắt đầu xây lõi.

## Mốc phát triển và mốc vận hành

Anh chưa có VPS/server. Bản local là mốc phát triển; pilot cloud đề xuất không cần mua VPS.

- Local: scaffold TypeScript/Hono, fake Telegram/DeepSeek, D1/Queue mô phỏng; kiểm tra lưu việc và phản hồi.
- Cloud: cấu hình account Free, webhook, queue/cron và admin auth; đo CPU/quota và kiểm chứng phục hồi trước pilot.
- Public GitHub: source, README chạy local và hướng dẫn deploy; loại secret/DB cá nhân/CV/backup khỏi nội dung công bố. Repo public độc lập với web và dữ liệu cá nhân.

Bản công bố đầu tập trung vào giao việc → lưu/theo dõi → ghi hoàn thành có nguồn → tổng hợp tuần. Khả năng tự viết code cho chatbot vẫn ở chặng sau.

## Model và ngân sách cập nhật

Anh chọn DeepSeek qua **OpenRouter**, khoảng 1–2 USD/tháng tổng hosting + API. Model ứng viên `deepseek/deepseek-v4-flash`; dùng OpenRouter key/endpoint. [Bảng giá và dự toán cập nhật](research/telegram-infrastructure-options.md) thay dự toán DeepSeek trực tiếp trước đây. Reasoning và provider routing phải kiểm tra theo endpoint được chọn.

Cloudflare Free trong quota là phương án hạ tầng 0 USD đề xuất. Default cap AI 0,80 USD/tháng để chừa dự phòng ở mức tổng 1 USD; có thể nâng cap 1,60 USD khi chọn tổng 2 USD. Cap là thiết kế dự kiến, chưa cấu hình thật. Lệnh xác định/nhắc template không cần model; hết budget vẫn lưu yêu cầu và báo phần phân tích chờ.

Trước khi nạp tiền cần kiểm tra mức nạp tối thiểu/phí trong tài khoản. Giá sử dụng tháng không đồng nghĩa số tiền nạp lần đầu. Oracle Always Free/VM là dự phòng, không còn là lựa chọn mặc định.
