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
