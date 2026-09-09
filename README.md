# Navi

<img src="assets/brand/navi-hidden-path-transparent.png" alt="Navi — The Hidden Path" width="240" />

Ban trợ lý cá nhân theo module cho công việc, đời sống, thói quen và mục tiêu. Chat là nơi tương tác hằng ngày; web phục vụ xem tổng thể, chi tiết và quản trị.

Đã có lát cắt Telegram đầu tiên: ghép tài khoản riêng, thêm việc, xem danh sách và xác nhận hoàn thành. Navi có menu lệnh native, lập kế hoạch tuần, ghi nhận ứng tuyển/chạy bộ, báo tiến độ định lượng và nhắc tiến độ lúc 20:00 khi chỉ tiêu còn thiếu. Tin nhắn không khớp lệnh rõ ràng được trả lời tùy chọn bằng DeepSeek V4 Flash qua OpenRouter, có trần chi phí trong D1. Dữ liệu lưu D1; Queue xử lý và Cron khôi phục công việc chờ. Xem [hướng dẫn bản task](docs/engineering/task-pilot.md).

Bắt đầu: [hướng dẫn local và kết nối tài khoản](docs/engineering/local-setup.md). Chạy `npm run doctor`, `npm run check`, rồi `npm run dev`.

- [Bản thiết kế hiện hành — 08/09/2026](docs/personal-assistant-product.md): mục tiêu sản phẩm Navi, hành trình sử dụng, module, skill, điều phối, dữ liệu, thực thi và lộ trình.
- [Review hướng chat — 08/09/2026](docs/reviews/chat-first-review.md): các khoảng thiếu đã bổ sung, quyết định còn mở và tình huống nghiệm thu.
- [Nghiên cứu nền](docs/research/personal-operating-assistant.md): các hướng công nghệ đã khảo sát tháng 8; kiểm tra lại trước khi chọn phiên bản triển khai.
- [Các review trước](docs/reviews/council-synthesis.md): tài liệu tham khảo lịch sử. Hướng Founder SaaS và yêu cầu paid beta trong các review không áp dụng cho mục tiêu cá nhân hiện hành.

Lát cắt đầu tiên: xây chính chatbot này và public GitHub + ít nhất 5 hồ sơ ứng tuyển/tuần + chạy bộ 3 buổi/tuần → kế hoạch chung → thay đổi bất ngờ → điều phối lại → ghi nhận kết quả.

Bản tích hợp đầu gồm Telegram chat riêng, web tối giản và worker lưu trạng thái bền vững; yêu cầu chạy 24/7, anh chưa có VPS/server. Phát triển và kiểm thử local trước; đề xuất Cloudflare Free theo sự kiện cho pilot 24/7. Năm luồng cần kiểm chứng: bản tin sáng, giao việc, thêm cam kết, điều phối khi phát sinh và báo kết quả.

- [Phạm vi thử Telegram và tuần mẫu](docs/telegram-pilot.md): đầu vào đã xác nhận, kết nối đề xuất và phần cần chốt trước chạy thật.

## Chuẩn bị trước coding

- [Hạ tầng đề xuất](docs/engineering/infrastructure.md): Workers + webhook + D1 + Queues + Cron, thay VPS/long polling cho ngân sách hiện tại.
- [Review tech stack](docs/engineering/tech-stack-review.md): TypeScript, Hono, DeepSeek qua OpenRouter và rủi ro cần kiểm chứng.
- [Bộ skill cần chuẩn bị](docs/engineering/skills-preparation.md): skill đã có, hai skill Cloudflare đề xuất và capability chatbot.
- [Nhật ký phát triển](docs/engineering/development-log.md): nguồn ghi vết append-only để tổng hợp quyết định, bằng chứng và tiến độ sản phẩm.
- [Nguồn giá và hạn mức](docs/research/telegram-infrastructure-options.md): dự toán 1–2 USD/tháng, chưa phải chi phí thực đo.
