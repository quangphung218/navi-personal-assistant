# Review tech stack trước coding

Ngày: 08/09/2026. Đầu vào: [sản phẩm](../personal-assistant-product.md), [pilot](../telegram-pilot.md), [hạ tầng](infrastructure.md). Đây là review lựa chọn công nghệ; chưa có code, benchmark hay lockfile. Không dùng skill code-review để giả lập review diff khi chưa có Git history.

## 1. Kết luận

Đề xuất **TypeScript + Hono + Cloudflare Workers/D1/Queues/Cron + DeepSeek V4 Flash qua OpenRouter**, web HTML nhẹ. Giữ modular monolith theo nghiệp vụ; triển khai ba entry point dùng chung code để tách webhook, processor và web riêng tư. Ngân sách và chat là giao diện chính làm Next.js + Node worker + SQLite trên VPS chưa còn là đường mặc định phù hợp nhất.

## 2. Quyết định từng phần

| Phần | Chọn cho pilot | Review / trade-off |
|---|---|---|
| Ngôn ngữ | TypeScript strict | Chung kiểu dữ liệu cho bot, lõi, web và test |
| Runtime cloud | Workers | Phù hợp sự kiện, quota Free; không có filesystem bền vững hoặc Node process thường trực |
| Toolchain local | Node.js 24 LTS + npm + lockfile | Node là công cụ phát triển; ứng dụng cloud chạy workerd. Chốt patch còn hỗ trợ khi scaffold |
| HTTP/web | Hono, HTML template nhẹ và CSS | Dùng ít giao diện, chưa cần React/Next.js; đổi khi UI thực sự cần nhiều tương tác |
| Telegram | Adapter hẹp qua HTTPS Bot API, webhook | V1 chỉ vài phương thức và update; native fetch + schema đủ. Cân nhắc grammY khi luồng Telegram phức tạp hơn, không viết một framework bot mới |
| AI | Native fetch tới OpenRouter, model `deepseek/deepseek-v4-flash`, ưu tiên tắt reasoning nếu endpoint hỗ trợ | Một adapter timeout/usage/schema; không thêm gateway đa provider trước nhu cầu thật |
| Validation | Zod | Kiểm tra input, output model và lệnh nội bộ; schema chỉ chứng minh cấu trúc, lõi vẫn phải kiểm tra nghiệp vụ/quyền |
| Database | D1, SQL migrations và prepared statements | Không ORM ở bản đầu; ít bảng critical cần kiểm soát atomicity rõ. Drizzle là ứng viên sau nếu query/schema lặp nhiều |
| Background | Queues consumer + Cron + job/outbox D1 | Không dùng `setInterval`/process daemon trên Workers. Queue đánh thức; DB giữ công việc |
| Search/memory | Truy vấn cấu trúc, context có nguồn và giới hạn | Chưa vector DB, embedding hay gửi toàn bộ lịch sử vào model |
| Auth web | Cloudflare Access cho admin, kiểm tra danh tính server | Bảo vệ cả URL preview; webhook ở Worker riêng không bị login chặn |
| Test | Vitest + Cloudflare Workers test integration | Fake external API; kiểm tra D1/queue tại runtime tương ứng. E2E browser chỉ cho auth và luồng web quan trọng |
| Build/deploy | Wrangler project-local | Sinh binding types; config và compatibility date có phiên bản; deploy dry-run rồi smoke test |
| CI | npm ci → typecheck → tests → build | Cấu hình khi khởi tạo Git; không dùng secret thật trong test hoặc PR không tin cậy |

Khả năng được kiểm tra theo nguồn: [Hono Workers](https://hono.dev/docs/getting-started/cloudflare-workers), [Node release](https://github.com/nodejs/Release), [Zod](https://zod.dev/), [Workers testing](https://developers.cloudflare.com/workers/testing/vitest-integration/), [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch), [OpenRouter DeepSeek model](https://openrouter.ai/deepseek/deepseek-v4-flash). Bảng trên là đánh giá của dự án, không phải benchmark so sánh framework.

## 3. Những gì đổi so với stack cũ

- Next.js web + Node daemon → Hono web nhẹ + Worker theo sự kiện. Web vẫn dùng cùng lõi và dữ liệu với chat.
- Long polling → webhook ở pilot cloud. Local dùng fixture/fake adapter trước; không cần giữ poller riêng chỉ để phát triển.
- SQLite WAL file trên một host → D1 qua binding. Không mang cấu hình WAL/backup file hoặc transaction connection của SQLite sang D1.
- Worker process → queue consumer + scheduler, có lease và trạng thái bền vững. Yêu cầu không mất job khi đóng web vẫn giữ.
- Model chưa chốt → DeepSeek V4 Flash là ứng viên đã có giá và API; vẫn cần đánh giá tiếng Việt/schema trước khi chốt chất lượng.

Next.js/SQLite/VM vẫn hợp nếu sau này có máy hoặc ngân sách và cần executor dài. Việc quay lại cần thay adapter DB/runtime; không gọi đó là đổi một dòng config. Nếu dùng SQLite WAL về sau, kiểm tra bản engine thực tế: tài liệu hiện ghi lỗi WAL-reset đã sửa từ 3.51.3 hoặc bản backport tương ứng. [SQLite WAL](https://www.sqlite.org/wal.html)

## 4. Module và interface cần xác định trước implementation

| Module | Interface nghiệp vụ cần cung cấp | Bất biến chính |
|---|---|---|
| Tiếp nhận | Nhận request đã xác thực; trả receipt/job ID | Một event nguồn tạo tối đa một yêu cầu logic |
| Công việc | Tạo/sửa/hoàn thành và đọc trạng thái | Revision và bằng chứng/source rõ |
| Ứng tuyển | Ghi cơ hội, xác nhận gửi và đọc số đã gửi trong tuần | Draft không cộng count; gửi trùng không cộng hai lần |
| Thói quen | Ghi occurrence và đọc tổng theo tuần | Một habit chạy bộ, mục tiêu 3; thiếu ghi nhận khác thất bại |
| Kế hoạch | Đề xuất/sửa kế hoạch từ dữ liệu có revision | Không trùng thời gian; dữ liệu thiếu thì hỏi, không bịa giờ rảnh |
| Thực thi | Nhận job, claim, lưu bước và kết quả | Lease/fencing; retry có giới hạn; job thành công khác delivery thành công |
| Quyền và budget | Kiểm tra/cấp quyền có phạm vi; reserve/settle cost | Không phát hành tác động hoặc gọi model vượt quyền/hạn mức |
| Bộ nhớ | Lấy context có nguồn, sửa/xóa/export | Dữ liệu đã xóa không trở lại retrieval |

Adapter Telegram và web gọi cùng interface tiếp nhận. Adapter OpenRouter chỉ cung cấp diễn giải/đề xuất; không ghi DB hoặc gọi Telegram trực tiếp. Module Ứng tuyển là phần nhỏ trong Công việc ở pilot, chưa cần một service riêng.

Cấu trúc dự kiến khi scaffold:

```text
src/
  entrypoints/       ingress, processor, admin
  modules/           work, habits, planning, identity, execution, memory
  adapters/          telegram, openrouter, d1
  web/               templates, routes, assets
migrations/          SQL có phiên bản
tests/              fixture, integration, eval
docs/engineering/    blueprint và quy trình
```

Một package npm là đủ; chưa monorepo framework, Redis, Kubernetes, Terraform, vector DB, LangChain/LangGraph, MCP server hoặc Agents SDK. Không load tất cả module/skill vào mỗi request; bắt đầu với những nghiệp vụ có trong tuần mẫu.

## 5. Các rủi ro phải kiểm chứng

| Mức | Rủi ro | Cách giải quyết / điều kiện đạt |
|---|---|---|
| Cao | 10 ms CPU của HTTP/Cron Free không đủ cho payload/auth/UI | Đo runtime trên staging; giới hạn payload, template nhỏ, batch nhỏ; không tự nâng Paid |
| Cao | Queue giao lệnh hội thoại sai thứ tự | Sequence/lease mọi mutation; tham chiếu chưa tồn tại phải chờ/làm rõ; test tạo rồi hoàn thành khi delivery đảo thứ tự |
| Cao | Queue/D1 commit lệch nhau | DB inbox/job/outbox là gốc; cron reconcile; test crash ở giữa từng bước |
| Cao | D1 conditional update 0 dòng nhưng vẫn phát outbox | Atomic command/result guard, unique ID, test cạnh tranh hai request |
| Cao | Model hiểu sai “xong việc đó” hoặc “mai” | Schema + tham chiếu duy nhất + timezone + hỏi lại; output model không tự cấp quyền |
| Cao | Chi phí vượt do prompt/retry/thinking | Reasoning kiểm tra theo endpoint, input/output cap, reservation nguyên tử, timeout chưa biết phí giữ reserve |
| Vừa | Alias model thay phiên bản phía provider | Lưu model ID/prompt/skill version và thời điểm; không hứa pin weights nếu API không cho; chạy lại eval khi provider đổi |
| Vừa | Free tier outage/quota hoặc webhook mất tin lâu | Giám sát heartbeat/backlog, không giả có SLA; nguồn update chỉ lưu có hạn |
| Vừa | Public repo làm lộ dữ liệu | Fixture tổng hợp, secret/DB/export/log bị ignore; kiểm tra nội dung trước public |

Không có bug code đã được xác nhận vì chưa có implementation. Các mục trên là rủi ro thiết kế và tiêu chí chặn pilot.

## 6. Kiểm thử đầu tiên

Các seam đề xuất để chốt trước khi dùng workflow TDD: tiếp nhận → task; xử lý job → trạng thái/bằng chứng; ghi ứng tuyển/habit → tổng tuần; budget reserve → quyết định cho gọi; auth → đọc/ghi dữ liệu.

Bắt đầu bằng “Thêm việc viết README” → đọc việc → hoàn thành → khởi động lại vẫn đúng. Sau đó thêm update trùng, sửa đồng thời, AI timeout, hết tiền và gửi tin không rõ kết quả. Test dùng ID/thời gian cố định, fake DeepSeek/Telegram; eval tiếng Việt là kiểm tra riêng, không gọi API thật trong mỗi lần CI.

Phiên bản dependency chỉ được coi đã chốt sau install, lockfile, typecheck, runtime tests và dry-run trên máy. Chưa khẳng định các bản thư viện mới nhất tương thích với nhau.
