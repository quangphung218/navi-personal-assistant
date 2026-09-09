# Hạ tầng Telegram trong ngân sách 1–2 USD/tháng

Kiểm tra nguồn chính thức: 08/09/2026. Đây là nghiên cứu và đề xuất trước coding; chưa tạo tài nguyên, nạp tiền hoặc triển khai. Ngân sách tạm hiểu là tổng hosting + AI API.

## Kết luận đề xuất

Chọn **Cloudflare Workers Free + Telegram webhook + D1 + Queues + Cron**, gọi **DeepSeek V4 Flash qua OpenRouter**. Không thuê VPS cho pilot. Bot được tiếp nhận sự kiện trên hạ tầng cloud cả ngày khi máy cá nhân tắt; không cần một tiến trình chạy liên tục. Đây là thiết kế phục vụ 24/7 theo sự kiện, chưa phải cam kết uptime/SLA hoặc bằng chứng đã chạy được.

Thay đề xuất long polling trên VM bằng webhook ở production. Lõi nghiệp vụ vẫn độc lập adapter. Giới hạn pilot ở ghi task, cập nhật tiến độ, ghi ứng tuyển/chạy bộ, lập kế hoạch ngắn và nhắc lịch. Tác vụ chạy shell, coding agent, browser automation hoặc research dài cần executor riêng sau này.

## Giới hạn đã xác minh

| Thành phần | Free tier / giới hạn cần thiết kế theo | Nguồn |
|---|---|---|
| Workers | 100.000 request/ngày; HTTP và Cron 10 ms CPU; chờ fetch/database không tính CPU. Paid tối thiểu 5 USD/tháng nên vượt ngân sách | [Pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Limits](https://developers.cloudflare.com/workers/platform/limits/) |
| D1 | 5 triệu rows read/ngày; 100.000 rows written/ngày; 5 GB/account; một DB Free tối đa 500 MB; vượt quota đọc/ghi sẽ lỗi | [Pricing](https://developers.cloudflare.com/d1/platform/pricing/), [Limits](https://developers.cloudflare.com/d1/platform/limits/) |
| Queues | Free có 10.000 operations/ngày; thường 3 operations/message; retry cộng operations; retention 24 giờ | [Pricing](https://developers.cloudflare.com/queues/platform/pricing/) |
| Queue consumer | Wall time tối đa 15 phút; không đồng nghĩa CPU được chạy 15 phút. Đo CPU trên Free trước pilot, không mặc định dùng hạn mức Paid | [Limits](https://developers.cloudflare.com/queues/platform/limits/) |
| Cron | Dùng scheduled handler; lịch theo UTC; cấu hình thay đổi có thể cần 15 phút lan truyền | [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) |
| Recovery DB | D1 Free Time Travel 7 ngày; vẫn cần export riêng và thử restore | [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) |
| Endpoint | Dùng hostname workers.dev cho pilot, chưa cần mua domain | [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) |

Quota phải tính cả dev/test dùng chung account. Endpoint nhỏ, payload/context bị chặn kích thước, index cho truy vấn job đến hạn, và đo CPU thực tế là điều kiện triển khai. Không để một HTTP response đã trả xong rồi phụ thuộc vào tác vụ AI dài trong `waitUntil`: thời gian kéo dài sau response chỉ tối đa 30 giây. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)

## Luồng vận hành đề xuất

1. Telegram gọi HTTPS webhook. Kiểm tra secret header, user/chat ID được phép, chat riêng, loại update và kích thước. Telegram hỗ trợ `secret_token`, retry webhook thất bại và không cho dùng `getUpdates` đồng thời webhook. [Telegram setWebhook](https://core.telegram.org/bots/api#setwebhook)
2. Lưu inbox với unique `update_id` và job trong giao dịch D1 rồi trả 2xx. Nếu lưu lỗi, trả lỗi để Telegram thử lại. Không gọi AI trong webhook.
3. Gửi job ID vào Queue; consumer nhận lease trong D1, kiểm tra version và xử lý một bước ngắn. Queue là tín hiệu đánh thức; D1 giữ trạng thái bền vững. Cron quét job đến hạn/chưa dispatch để khắc phục khoảng hở giữa commit DB và publish Queue.
4. Kết quả nghiệp vụ và outbox được commit cùng nhau. Gửi Telegram qua bước riêng. Gửi tin thất bại không chạy lại nghiệp vụ hoặc gọi lại AI đã lưu kết quả.
5. Cron mỗi 5 phút chỉ chọn một batch nhỏ từ index, đưa job/outbox đến hạn vào Queue và ghi heartbeat. Reminder có khóa duy nhất theo cam kết + lần lịch; dùng Asia/Ho_Chi_Minh ở nghiệp vụ, UTC ở lưu trữ/lịch cloud.
6. Job có lease hết hạn, số lần thử tối đa, backoff và trạng thái cần kiểm tra. Queue Free chỉ giữ 24 giờ nên cron phải tìm lại job D1 chưa hoàn thành sau outage. Job hủy không được tự sống lại.

Đây là thiết kế đề xuất, không phải đảm bảo exactly-once của Telegram. Khi `sendMessage` timeout sau khi phía Telegram có thể đã nhận, trạng thái gửi phải là không chắc chắn; không hứa chống mọi tin nhắn trùng. Với việc nội bộ, unique key + transaction đảm bảo không đếm hai lần.

Web riêng tư không được dựa vào URL khó đoán. Bản đầu có thể chỉ chạy web trạng thái local; blueprint hiện đề xuất Cloudflare Access cho admin Worker riêng trước khi bật web cloud, với kiểm tra danh tính/quyền phía server. Dữ liệu cá nhân không nhúng vào static bundle. Không mặc định cần domain trả phí để triển khai auth.

## DeepSeek qua OpenRouter: giá và ngân sách cập nhật

Anh xác nhận dùng OpenRouter. Dự toán DeepSeek trực tiếp 1,386 USD/tháng trước đây không còn dùng để lập ngân sách cho route hiện tại.

Model ứng viên `deepseek/deepseek-v4-flash`; trang OpenRouter hiện gọi bản này là V4 Flash 0423. Không giả đây là cùng phiên bản với alias trên DeepSeek trực tiếp. Giá hiển thị thấp nhất lúc kiểm tra là 0,0679 USD/M input và 0,168 USD/M output; giá khác nhau theo provider và có ưu đãi. [Model và provider](https://openrouter.ai/deepseek/deepseek-v4-flash)

Ví dụ 900 request/tháng × 2.000 input + 500 output tính theo mức thấp nhất đó: `1,8 × 0,0679 + 0,45 × 0,168 = 0,19782 USD`. Đây là minh họa tại một route, không bảo đảm routing thực tế luôn có mức giá này; chưa gồm retry, reasoning thêm, phí nạp hoặc thuế. Trước pilot chọn endpoint phù hợp và giá trần, dự toán lại theo trần đó.

OpenRouter trừ chi phí inference từ credits và có phí khi mua credits. Trang FAQ đọc được xác nhận có phí nhưng không hiển thị đầy đủ con số; kiểm tra checkout để biết phí/mức nạp tối thiểu, không coi 1–2 USD chi tiêu tháng là số tiền chắc chắn có thể nạp lần đầu. [OpenRouter billing](https://openrouter.ai/docs/faq)

Giữ cap ứng dụng đề xuất 0,80 USD cho mức tổng 1 USD, hoặc 1,60 USD khi chọn tổng 2 USD. Reserve input upper bound + output/reasoning cap theo giá trần route, cộng cả mọi call/retry; timeout chưa rõ chi phí giữ reservation để đối soát. Lưu generation ID/provider/model/usage. Không auto top-up, đổi model hoặc nới giá trần. [Routing/max_price](https://openrouter.ai/docs/guides/routing/provider-selection)

Kiểm tra tham số reasoning và JSON schema trên endpoint được chọn; không chép `thinking` của DeepSeek trực tiếp sang OpenRouter. Nếu endpoint không tắt được reasoning, cần đo chi phí và chốt cấu hình trước pilot. `exclude` chỉ giấu nội dung, không tắt reasoning. [Reasoning controls](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens)

Hết budget vẫn lưu yêu cầu, phục vụ lệnh xác định và nhắc template; phần AI chờ. Endpoint dùng `https://openrouter.ai/api/v1/chat/completions`, secret `OPENROUTER_API_KEY`; không cần key DeepSeek trực tiếp cho đường này. [Quickstart](https://openrouter.ai/docs/quickstart)

## Phương án thay thế

| Phương án | Đánh giá |
|---|---|
| Oracle Always Free VM + long polling + SQLite | Dự phòng khi cần process thường trực; có thể thiếu capacity, VM idle có thể bị thu hồi. Không chọn làm đường chính trước khi có tài khoản/máy thực tế. [Oracle Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) |
| Máy cá nhân luôn bật | Hợp phát triển; với yêu cầu tắt laptop vẫn dùng được thì chưa đạt pilot. Điện/mạng và restart do mình vận hành |
| Workers Paid | Tối thiểu 5 USD/tháng riêng hạ tầng; chỉ xét khi người dùng tăng ngân sách. [Pricing](https://developers.cloudflare.com/workers/platform/pricing/) |

Không coi gói free hoặc credit trial bất kỳ là bảo đảm lâu dài. Oracle thường cần điện thoại/thẻ để đăng ký; chưa nâng cấp tài khoản nếu chưa có nhu cầu. [Oracle Free Tier](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm)

## Cổng kiểm chứng trước pilot

- Deploy thử endpoint, D1, Queue, Cron trên đúng account Free; đo CPU bằng payload tiếng Việt thực tế, batch một job/lần.
- Kiểm tra webhook thật và bot khác cho dev; không chuyển bot production sang local poller ngoài quy trình bảo trì.
- Một update gửi lại không tạo task/ứng tuyển/buổi chạy thứ hai; kiểm tra xử lý đồng thời, lease, nút cũ và crash giữa DB/queue.
- Giả lập AI timeout, hết budget, lỗi gửi Telegram, queue hết retention và khôi phục từ D1.
- Kiểm tra secrets không vào repo/log, chỉ user được phép truy cập; logs chỉ metadata và lỗi đã che dữ liệu.
- Export DB, restore vào DB thử rồi đối chiếu trạng thái; giữ backup ngoài public repo. Time Travel không thay thế kiểm chứng restore.
- Tắt laptop; gửi tin và nhận reminder qua điện thoại, kiểm tra heartbeat và backlog. Theo dõi hai tuần trước kết luận phù hợp 24/7.

Các kiểm chứng trên chưa được thực hiện; tài liệu này chỉ chốt phương án để bắt đầu coding có mục tiêu rõ.
