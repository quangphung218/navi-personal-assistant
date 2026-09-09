> Cập nhật 09/09/2026: đã có bản task triển khai cloud; xem [task-pilot.md](task-pilot.md). Phần probe local bên dưới vẫn chỉ kiểm tra môi trường.

# Môi trường local và bước kết nối tài khoản

Ngày: 08/09/2026. Anh đã tạo bot Telegram và tài khoản Cloudflare. Tình trạng OpenRouter key chưa được xác nhận.

## Đã chuẩn bị

- Git local nhánh main; chưa có remote, commit hoặc public GitHub.
- npm project TypeScript/Hono, Wrangler và lockfile; Node mục tiêu 24.20.0, không đổi Node 26 đang có trên máy.
- Hai skill Cloudflare trong `.agents/skills` và hướng dẫn dự án `AGENTS.md`.
- Worker kiểm tra môi trường local, route `/health` kiểm tra truy cập D1.
- `.dev.vars` riêng trên máy, quyền file 600, đã bị Git ignore; mẫu công khai `.dev.vars.example` chỉ chứa tên biến và giá trị rỗng.

Đây là bước chuẩn bị môi trường, chưa có luồng tạo task, xử lý queue, auth web hoặc gọi AI. `/webhooks/telegram` trả 503 để không nhận mất tin khi nghiệp vụ chưa sẵn sàng. Chưa tạo DB/Queue/Worker remote.

## Chạy trên máy

Từ thư mục dự án:

```sh
npm ci
npm run doctor
npm run check
npm run dev
```

Mở `http://127.0.0.1:8787/health`. Nếu cần chạy đúng Node mục tiêu khi chưa có version manager:

```sh
npm exec --yes --package=node@24 -- npm run check
npm exec --yes --package=node@24 -- npm run dev
```

`npm run build` chỉ dry-run; không deploy. Không dùng `wrangler.local.jsonc` cho cloud. D1 local do Wrangler tạo dưới `.wrangler`, không phải DB đã tạo trong tài khoản Cloudflare. Chưa có remote binding hoặc lệnh tạo tài nguyên tự động.

## Anh cần thao tác

1. Đăng nhập CLI qua trình duyệt bằng `npm run cloudflare:login`; chọn tài khoản Cloudflare vừa tạo. Sau đó `npm run cloudflare:whoami` kiểm tra kết nối.
2. Mở `.dev.vars` trên máy, điền `TELEGRAM_BOT_TOKEN` lấy từ BotFather. Không dán token vào chat hoặc file mẫu.
3. Khi có OpenRouter key, điền `OPENROUTER_API_KEY` trong cùng file. Có thể để trống trong lúc chuẩn bị local; chưa có request mất phí ở bước này.

`TELEGRAM_WEBHOOK_SECRET` để em tạo khi cấu hình webhook thật. File local không tự trở thành Cloudflare Secrets; bước upload secret sẽ được làm đúng Worker sau khi ứng dụng sẵn sàng. [Cloudflare local secrets](https://developers.cloudflare.com/workers/local-development/environment-variables/)

## Em tiếp tục làm

Sau bước môi trường: dựng schema và luồng task local, kiểm thử trùng/restart; nối Telegram/OpenRouter; tạo cấu hình cloud với ID tài nguyên thật; kiểm tra auth và ngân sách rồi mới đưa pilot lên cloud. Anh không cần tự tạo D1, Queue, webhook hoặc mua domain trong dashboard.

## Kết quả kiểm tra môi trường

Đã chạy: sinh binding types, TypeScript check, Wrangler build dry-run, HTTP `/health` trả D1 reachable, webhook chưa triển khai trả 503. npm audit khi cài không báo lỗ hổng. Chưa có test nghiệp vụ hoặc request Telegram/OpenRouter thật.

Wrangler 4.129.1 đã cài project-local; đã khởi động OAuth login trên trình duyệt. Chỉ coi tài khoản CLI đã kết nối sau khi nhận callback và kiểm tra `whoami`; tạo tài khoản trên web không tự đăng nhập CLI.

## Xác nhận kết nối — 09/09/2026

Telegram getMe và OpenRouter key metadata đã trả HTTP 200, xác thực thành công; chưa gọi inference mất phí hoặc gửi tin. Cloudflare OAuth đã hoàn tất và `npm run cloudflare:whoami` xác nhận CLI đăng nhập, đọc được một account. Không lưu token hoặc thông tin định danh tài khoản trong tài liệu. Chưa tạo tài nguyên cloud hoặc deploy chatbot.
