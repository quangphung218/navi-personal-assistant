# Bộ skill cần chuẩn bị

Ngày: 08/09/2026. Phân biệt skill của agent phát triển với khả năng chạy bên trong chatbot. Danh sách cài sẵn dựa trên catalog phiên làm việc và các SKILL.md đã đọc; Cập nhật triển khai: hai skill Cloudflare đã được cài vào `.agents/skills`; xem [local setup](local-setup.md). Các phần “chưa cài/chưa Git” dưới đây là trạng thái tại thời điểm review trước scaffold.

## 1. Skill cho anh em mình xây sản phẩm

| Skill | Hiện trạng | Dùng vào lúc nào |
|---|---|---|
| `research` | Có sẵn, đã dùng | Kiểm tra API, giá, hạn mức bằng nguồn chính thức; lưu findings vào repo |
| `codebase-design` | Có sẵn, đã dùng | Chốt interface module, tránh logic nghiệp vụ rải trong Telegram/web |
| `domain-modeling` | Có sẵn | Ghi glossary cho task/job/ứng tuyển/occurrence; ADR khi có trade-off lớn |
| `implement` | Có sẵn | Làm từng lát cắt theo spec; cần hiểu workflow test/review/commit của skill |
| `tdd` | Có sẵn | Các seam critical: chống trùng, quyền, budget, revision và phục hồi |
| `code-review` | Có sẵn | Sau có Git history, review từ mốc cụ thể theo Standards và Spec |
| `diagnosing-bugs` | Có sẵn | Khi có lỗi thật; tạo tái hiện trước khi sửa |
| `minimalist-ui` | Có sẵn, tùy chọn | Khi làm web trạng thái; không cần nhiều skill thiết kế cùng lúc |

Không cần cài lại các skill trên hoặc bật chúng ở mọi lượt. Chưa dùng `implement`/`tdd`/`code-review` như workflow thực thi trong lượt review hạ tầng này.

Lưu ý workflow đã đọc: `tdd` yêu cầu thống nhất seam trước khi viết test; danh sách đề xuất ở [review stack](tech-stack-review.md#6-kiểm-thử-đầu-tiên) chưa phải anh đã xác nhận. `code-review` cần fixed point Git và spec; `implement` có bước commit. Hiện thư mục chưa có `.git`, nên các bước đó chưa sẵn sàng chạy nguyên flow. Không tạo commit hoặc đăng issue trong lượt này.

## 2. Hai skill bổ sung sát nhu cầu

Nguồn chính thức: [cloudflare/skills](https://github.com/cloudflare/skills). Đã đọc SKILL.md của hai skill; nội dung yêu cầu đối chiếu tài liệu, kiểm tra runtime/config và xác định đúng môi trường. Đây là lý do chọn, không chỉ dựa trên lượt cài.

| Skill | Lượt cài quan sát 08/09/2026 | Vai trò |
|---|---:|---|
| [workers-best-practices](https://skills.sh/cloudflare/skills/workers-best-practices) | 72,8K | Runtime, binding types, vòng đời promise, secret và review Workers |
| [wrangler](https://skills.sh/cloudflare/skills/wrangler) | 79,6K | Cấu hình/local/deploy/migration; phân biệt DB local với remote |

Các số lấy từ `npx skills find cloudflare`, có thể đổi. Đã kiểm tra leaderboard và repo chính thức. GitHub không trả số stars trong trang đọc được, API bị rate limit; chưa xác minh số stars nên không dùng số đó làm bằng chứng chất lượng. Không cần cài toàn bộ Agents SDK, Sandbox hoặc MCP skill cho pilot.

Lệnh chuẩn bị khi chọn cài vào dự án, chạy từ repo (chưa thực hiện):

```sh
npx skills add cloudflare/skills@workers-best-practices
npx skills add cloudflare/skills@wrangler
```

Chọn scope dự án trong trình cài nếu có lựa chọn; review diff và ghi nguồn/revision thực tế sau cài. Cài skill không tạo tài nguyên Cloudflare hoặc cấp quyền deploy. Nội dung tham chiếu: [Workers SKILL.md](https://github.com/cloudflare/skills/blob/main/skills/workers-best-practices/SKILL.md), [Wrangler SKILL.md](https://github.com/cloudflare/skills/blob/main/skills/wrangler/SKILL.md).

## 3. Hồ sơ dự án cần có khi bắt đầu coding

Trong lượt này đã có blueprint, stack review, research, pilot và tiêu chí kiểm chứng. Trạng thái kiểm tra máy: có Node/npm/git trong PATH; chưa kiểm tra phiên bản/tương thích, chưa có package.json, lockfile hoặc .git trong thư mục hiện tại. Khi scaffold cần tạo:

- `AGENTS.md`: nguồn spec hiện hành, lệnh check/test/build, quy tắc module, quyền và dữ liệu cá nhân. Chưa tạo để tránh ghi các lệnh chưa tồn tại thành hướng dẫn đang hoạt động.
- `CONTEXT.md`: glossary ngắn, tái dùng mục 3 bản thiết kế và bổ sung ứng tuyển; không sao chép toàn bộ spec.
- Một ADR ghi lý do chọn Workers thay VPS với ngân sách hiện tại; trạng thái đề xuất cho đến khi quyết định được tiếp nhận.
- Backlog local có tiêu chí hoàn thành cho từng lát cắt; chuyển GitHub Issues sau khi repo remote được chốt.
- Git/remote, ignore secret/DB/backup, coding standards và lockfile. Kiểm tra không nằm trong repo cha trước khi khởi tạo Git.

Skill `setup-matt-pocock-skills` có sẵn cho tracker/labels/domain layout. Chưa chạy setup vì lượt này là chuẩn bị và review; có thể chọn workflow đó khi cần tích hợp đầy đủ nhóm skill, không phải dependency runtime của chatbot.

## 4. Skill bên trong chatbot

Các capability dưới sẽ là handler/workflow có schema và version trong code, không tự nạp SKILL.md từ máy phát triển. Không cần framework plugin để có chúng.

| Capability pilot | Đầu vào → kết quả | Khi nào cần model | Cách biết hoàn thành |
|---|---|---|---|
| `capture-work` | Câu nhắn/lệnh → task hoặc câu hỏi làm rõ | Khi nhập tự nhiên | Task ID, nội dung đã ghi, source |
| `update-work` | Task reference + thay đổi → revision mới | Chỉ khi tham chiếu/ý định cần diễn giải | Trạng thái lưu đúng; không ghi nhầm task |
| `record-application` | Vị trí + trạng thái gửi + ngày → ghi nhận ứng tuyển | Không cần với form/lệnh rõ | Chỉ lượt đã gửi được cộng, có nguồn |
| `record-run` | Ngày/lần chạy → habit occurrence | Không cần với nút/lệnh | Tổng tuần không trùng; mục tiêu 3 |
| `daily-brief` | Dữ liệu hôm nay → tối đa 3 ưu tiên và việc chờ | Template trước; AI tùy nhu cầu | Có nguồn/thời điểm, không bịa thiếu dữ liệu |
| `weekly-review` | Tuần → tiến độ chatbot, ≥5 ứng tuyển, 3 buổi chạy | Tùy chọn tổng hợp ngắn | Phân biệt thiếu ghi nhận với chưa làm |
| `replan-week` | Phát sinh + dữ liệu có revision → thay đổi dự kiến | Có, khi cần đề xuất | Kiểm tra xung đột trước áp dụng |

Mỗi capability ghi: input/output schema, quyền, ngân sách, timeout, source, cách verify, lỗi và phiên bản. Chỉ build `capture-work`/`update-work` ở lát cắt đầu; phần còn lại theo backlog. Không ghi “AI đã apply” hoặc “đã public GitHub” khi mới tạo bản nháp.

## 5. Điều cần anh chuẩn bị

Để coding local: chưa cần thanh toán hoặc secret thật. Để thử trên cloud: tài khoản Cloudflare Free, bot Telegram, OpenRouter API key và mức cap được chọn. Secret nhập qua cấu hình riêng, không gửi vào tài liệu/chat công khai. Email dùng cho admin Access và Telegram account được liên kết là đầu vào onboarding.

Chưa cần VPS, domain trả phí hoặc một bộ skill lớn. Nạp tiền OpenRouter tối thiểu/phí thanh toán phải kiểm tra trong tài khoản; mức chi hàng tháng khác số tiền nạp lần đầu.
