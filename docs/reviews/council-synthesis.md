# Kết luận hội đồng: Product Blueprint cho Personal Operating Assistant

_Ngày tổng hợp: 2026-08-27_

_Đầu vào: ba review độc lập về Product/UX, Architecture/Security và Strategy/Learning Science._

## 1. Phán quyết cuối cùng

**Nên tiếp tục, nhưng không xây “Personal Operating Assistant toàn năng” ngay.**

Tầm nhìn dài hạn vẫn đáng giữ:

> Một lớp điều hành cá nhân giúp người dùng chọn đúng việc, hành động, đo kết quả và nâng năng lực qua thời gian.

Sản phẩm đầu tiên phải hẹp hơn:

> **Decision Loop cho solo technical founder pre-PMF:** biến một quyết định đang bị kẹt thành một thí nghiệm có deadline trong dưới hai phút, rồi quay lại ghi outcome và bài học.

Đây không phải AI quyết định thay người dùng. Nó là hệ thống giúp người dùng:

1. chỉ ra điều chưa biết quan trọng nhất;
2. chọn phép thử nhỏ nhất để giảm bất định;
3. ghi dự báo trước khi biết kết quả;
4. quay lại review đúng hạn;
5. tích lũy bài học có bằng chứng.

## 2. Vì sao thu hẹp như vậy

Blueprint ban đầu gộp quá nhiều sản phẩm:

- cố vấn quyết định;
- dashboard ưu tiên hằng ngày;
- coding agent;
- daily coach;
- idea generator;
- personal memory;
- automation platform;
- self-improving agent.

Nếu làm đồng thời, đội có thể hoàn thành nhiều hạ tầng nhưng không biết người dùng quay lại vì điều gì. Ba hội đồng cùng xác định lợi thế khả dĩ không nằm ở chat, memory, dashboard hay multi-agent; nó nằm ở dataset nối:

```text
bối cảnh lúc quyết định
→ dự báo
→ hành động/thí nghiệm
→ kết quả quan sát được
→ bài học và cập nhật niềm tin
```

General assistant thường kết thúc ở câu trả lời. Sản phẩm này khác ở chỗ nó đóng vòng bằng outcome thật.

## 3. Khách hàng đầu tiên

### ICP

Solo technical founder hoặc indie builder đang pre-PMF:

- tự quyết phần lớn product, technical và growth priorities;
- có 3–10 quyết định đáng cân nhắc mỗi tuần;
- thường dùng AI để brainstorm;
- phần lớn quyết định có thể đảo ngược trong 1–4 tuần;
- outcome có thể quan sát: ship, user response, conversion, time saved, bug/rework;
- sẵn sàng dành 30–90 giây để review kết quả.

### Không phục vụ trong MVP

- quyết định y tế, pháp lý hoặc tài chính hệ trọng;
- tuyển dụng/sa thải và quyết định ảnh hưởng nghiêm trọng đến người khác;
- team lớn cần collaboration và compliance;
- người chỉ cần task manager hoặc calendar;
- người muốn AI tự quyết và tự hành động hoàn toàn.

### JTBD

> Khi tôi bị kẹt giữa vài hướng làm sản phẩm và đang lặp lại phân tích trong đầu, hãy giúp tôi xác định điều chưa biết, chọn một phép thử nhỏ và nhắc tôi xem lại đúng lúc, để tôi tiến lên mà không giả vờ rằng mình chắc chắn.

## 4. Trải nghiệm MVP

### Bước 1 — Capture

Màn hình đầu tiên chỉ hỏi:

> “Anh đang bị kẹt ở quyết định nào trong 7 ngày tới?”

Không personality quiz, không import calendar, không onboarding dài. Hệ thống hỏi tối đa hai câu bổ sung và chỉ hỏi nếu câu trả lời có khả năng đổi khuyến nghị.

### Bước 2 — Decision Card

```text
NÊN LÀM GÌ?
Chạy concierge test với 5 founder trước khi code onboarding tự động.

VÌ SAO?
• Điều chưa biết lớn nhất là họ có quay lại, không phải ta có build được không.
• Test mất 2 ngày và có thể đảo ngược hoàn toàn.

ĐIỀU CÓ THỂ KHIẾN LỜI KHUYÊN SAI
5 người thử không đại diện cho khách hàng mục tiêu.

THÍ NGHIỆM NHỎ NHẤT
Gửi prototype cho 5 founder; thành công nếu ≥3 người tự quay lại trong 7 ngày.

ĐỘ TIN CẬY
Trung bình — còn thiếu baseline từ các test trước.

[Chọn thí nghiệm] [Sửa giả định] [Chọn hướng khác]
```

Mặt trước card chỉ có khuyến nghị, lý do, unknown lớn nhất, experiment và confidence bằng ngôn ngữ thấp/vừa/cao. Phân tích chi tiết nằm sau “Xem thêm”.

### Bước 3 — Commitment

Người dùng phải chốt ba thứ:

- hành động tiếp theo;
- signal thành công/thất bại;
- ngày review.

Chưa đủ ba thứ thì chưa tính là một loop đã bắt đầu.

### Bước 4 — Outcome review

Đúng ngày, hệ thống hỏi:

```text
Anh dự đoán ≥3/5 founder sẽ quay lại.
Thực tế chuyện gì xảy ra?

[Đạt] [Không đạt] [Chưa chạy]
```

Review phải tách:

1. **Process quality:** với thông tin lúc đó, thí nghiệm có hợp lý không?
2. **Outcome:** dự báo đúng đến đâu, kết quả là gì?

Như vậy hệ thống không thưởng cho một quyết định tệ nhưng may mắn, hoặc phạt một quyết định tốt chỉ vì outcome xấu.

### Bước 5 — Evidence-backed pattern

Chỉ nêu pattern sau tối thiểu ba bằng chứng:

> “Trong ba quyết định growth gần đây, anh thường dự báo cao tỷ lệ quay lại. Lần tới nên yêu cầu baseline trước khi ước lượng.”

Người dùng có thể xác nhận, sửa hoặc bác bỏ.

## 5. Phạm vi MVP

### Xây

- intake text, voice là tùy chọn;
- tối đa hai clarifying questions;
- structured Decision Card;
- editable assumptions;
- commit action, predicted signal và review date;
- in-app follow-up;
- outcome/process review;
- history timeline;
- export/delete dữ liệu;
- metadata tracing, cost và latency;
- golden eval set.

### Không xây

- Today Cockpit;
- task/calendar/email integration;
- coding agent;
- Daily Coach;
- Idea Radar;
- vector search hoặc knowledge graph;
- multi-agent council trong product;
- external write actions;
- auto-generated personality profile;
- native mobile app;
- team workspace;
- autonomous self-improvement.

## 6. Kiến trúc cuối cùng cho MVP

```text
Browser
  ↓
Next.js TypeScript modular monolith
  ├─ Decision module
  ├─ Review module
  ├─ Evidence/Pattern module
  ├─ Policy module
  ├─ Eval module
  └─ One ModelProvider adapter
  ↓
SQLite WAL + FTS5 + artifact folder
  ↓
Encrypted backup + versioned export
```

### Stack chốt

| Phần | Lựa chọn MVP | Lý do |
|---|---|---|
| App | Next.js + TypeScript | Một runtime, đủ UI và server cho một người dùng |
| UI | Tailwind + accessible primitives | Xây nhanh, card-first |
| Data | SQLite WAL + migrations | Một người dùng, local, backup/export đơn giản |
| Search | SQL + FTS5 | Chưa cần embeddings |
| Model | Một provider adapter | Không cần gateway khi mới có một provider |
| Workflow | Explicit typed functions | Dễ test và debug hơn agent graph |
| Validation | Zod/JSON Schema | Model output không đi thẳng vào domain |
| Tests | Vitest + Playwright | Domain, integration và end-to-end |
| Logs | Metadata-only structured logs | Không lưu prompt/memory nhạy cảm mặc định |
| Deployment | Localhost/private network | Giảm attack surface |

### Hoãn và trigger nâng cấp

| Công nghệ | Chỉ thêm khi |
|---|---|
| FastAPI/Python | Có workload Python riêng thật sự |
| LangGraph | Workflow phải pause/resume lâu, branch/retry phức tạp hoặc có nhiều side effect |
| Postgres | Multi-user, concurrent writers, server always-on hoặc HA |
| pgvector | Golden retrieval eval chứng minh FTS không đủ |
| MCP | Có capability broker và connector thứ hai |
| LiteLLM | Có ít nhất hai model provider production |
| Phoenix | Có 20–50 eval cases và privacy/redaction policy rõ |
| Codex/OpenHands adapter | Coding handoff là bottleneck đã đo được |
| Temporal | Workflow kéo dài nhiều ngày và cần durable execution thực sự |

## 7. Các module cần xây sâu

### Decision

```ts
createDecisionDraft(input)
commitDecision(draftId, choice)
recordOutcome(decisionId, outcome)
```

Module chịu trách nhiệm risk/reversibility, context selection, schema validation, card và review date. UI không biết prompt hay model steps.

### Evidence/Pattern

```ts
findRelevantEvidence(query, scope)
proposePattern(evidenceIds)
reviewPattern(patternId, action)
```

Pattern luôn có source, counterevidence, scope và trạng thái proposed/confirmed/disputed.

### Policy

```ts
authorize(intent, actor, context)
```

MVP từ chối mọi external write. Quyền không được đặt trong prompt.

### Model

```ts
generateStructured(request, schema, budget)
```

Có timeout, token/cost budget, parse validation và tối đa một repair call.

### Eval

```ts
runSuite(version, dataset)
compare(candidate, baseline)
```

Deterministic checks trước, human review sau, LLM judge chỉ là tín hiệu phụ.

## 8. Dữ liệu cốt lõi

### Canonical

- decisions và options;
- predictions/confidence;
- committed experiments;
- observed outcomes;
- process reviews và lessons;
- user-confirmed facts/patterns;
- source artifacts;
- policy và audit metadata.

### Derived, phải tái tạo được

- summaries;
- embeddings;
- search indexes;
- dashboard cards;
- model traces;
- LLM-judge scores;
- caches.

Moat là outcome graph và personal eval vault, không phải vector database.

## 9. Lộ trình đã giải quyết mâu thuẫn “validate hay build”

### Phase 0 — Tuần 1–2: Validation không code app

- Phỏng vấn 12–15 solo technical founders.
- Chạy concierge Decision Loop bằng form + AI/người phía sau.
- Theo dõi 20–30 quyết định thật.
- Thử hai cấu trúc Decision Card.
- Thử cadence follow-up.
- Thu willingness-to-pay thật sau aha moment.

**Gate để được phép build:**

- ≥60% decision dẫn đến committed action;
- ≥50% follow-up nhận outcome;
- ≥30% người dùng chủ động gửi quyết định thứ hai;
- ít nhất sáu người mô tả pain đáng kể mà không cần được dẫn dắt.

### Phase 1 — Tuần 3–6: Build vertical slice

**Tuần 3:** intake → model adapter → structured card → commit.

**Tuần 4:** review date → reminder → outcome/process review.

**Tuần 5:** history, evidence source, export/delete, backup/restore.

**Tuần 6:** 30–50 eval cases, hardening, privacy, cost/latency budget.

### Phase 2 — Tuần 7–10: Evidence-backed personalization

- Pattern sau ≥3 evidence points.
- Confirm/dispute/counterevidence.
- A/B context-only với personalized.
- Stale-memory challenge và forget test.
- Weekly decision digest.

**Gate:** personalized version phải thắng context-only về outcome hoặc giảm context correction; nếu không, bỏ personalization thay vì trang trí câu trả lời.

### Phase 3 — Tuần 11–14: Paid beta

- 10–20 design partners.
- Paywall hoặc đặt cọc thật.
- Đo retention 4–6 tuần.
- Chỉ thêm integration trực tiếp làm giảm friction của Decision Loop.

### Phase 4 — Chọn đúng một nhánh

Sau khi Decision Loop có evidence, chỉ chọn một:

1. **Embedded Coach** nếu pattern quyết định cho thấy skill gap rõ.
2. **Coding adapter** nếu phần lớn experiment trở thành code task và handoff gây chậm.
3. **Today view** nếu committed experiment thường bị task/calendar lấn át.

Không mở cả ba cùng lúc.

## 10. Metrics và kill criteria

### North-star

**Completed Learning Loops per Weekly Active User.**

Một loop chỉ tính khi có đủ:

```text
decision → committed action → prediction → review date
→ observed outcome → recorded lesson/belief update
```

### Metrics chính

- median time to committed experiment <5 phút từ lúc mở app;
- ≥40% activated users tạo quyết định thứ hai trong 14 ngày;
- ≥50% scheduled reviews nhận outcome trong 72 giờ;
- ≥30% activated users hoàn tất bốn loops trong bốn tuần;
- time-from-question-to-commitment giảm ≥30% so với workflow cũ;
- 100% card nêu unknown/evidence gap;
- unauthorized external action = 0.

### Kill hoặc pivot nếu sau validation + pilot

- <40% attempt tạo committed action;
- <30% review nhận outcome;
- <25% người dùng tạo quyết định thứ hai trong 14 ngày;
- đa số nói ChatGPT prompt là đủ và hành vi sử dụng xác nhận điều đó;
- >30% card sai vì thiếu context không thể thu thập trong flow ngắn;
- người dùng không muốn lưu outcome;
- không có willingness-to-pay thật sau aha moment.

## 11. Coaching sẽ được thêm như thế nào

Coach không phải một tab bài học độc lập. Nó phải nằm trong công việc thật:

```text
work task
→ chọn một micro-skill
→ baseline không trợ giúp
→ người dùng dự đoán/giải thích trước
→ hint theo thang
→ artifact + rubric/test
→ delayed retrieval sau 3–7 ngày
→ transfer task sau 1–3 tuần
```

Coaching chỉ được coi là thành công khi người dùng tự làm tốt hơn ở task mới, không phải khi hoàn thành bài có AI trợ giúp.

## 12. Self-improvement thực dụng

```text
failure pattern
→ candidate prompt/policy
→ offline replay trên personal eval vault
→ shadow/canary
→ human approval
→ rollout có version
→ rollback nếu guardrail xấu đi
```

AI không được tự:

- tăng quyền;
- đổi Personal Constitution;
- sửa eval rubric để tự đạt điểm;
- xóa lịch sử thất bại;
- merge/deploy production;
- coi self-critique là ground truth.

## 13. Đội ngũ triển khai tối thiểu

### Giai đoạn validation

- **Founder/Product Lead:** phỏng vấn, concierge, định nghĩa rubric và quyết định scope.
- **Product Designer/Researcher bán thời gian:** card comprehension, autonomy, follow-up friction.
- **AI Product Engineer bán thời gian:** prompt/schema prototype và instrumentation nhẹ.

### Giai đoạn build

- **1 Senior Product Engineer:** Next.js, domain, SQLite, tests và deployment.
- **1 Product/UX Lead:** user research, card, metrics và paid beta.
- **AI/Eval specialist 0.25–0.5 FTE:** golden set, provider adapter, regression testing.
- **Security/privacy reviewer theo milestone:** threat review trước remote access, connector và coding execution.

Không cần data engineer, ML platform engineer, DevOps full-time hoặc multi-agent team trong MVP.

## 14. Năm quyết định cần chốt ngay

1. ICP duy nhất có phải solo technical founder pre-PMF không?
2. Chọn 12–15 design partners nào để phỏng vấn/concierge?
3. Domain allowlist/denylist cho quyết định là gì?
4. Một Completed Learning Loop được tính chính xác như thế nào?
5. Mức giá nào sẽ được dùng để kiểm chứng willingness-to-pay thật?

## 15. Kết luận một câu

> **Đừng bắt đầu bằng một AI hiểu cả cuộc đời. Hãy bắt đầu bằng một hệ thống không để một quyết định quan trọng kết thúc mà không có hành động, kết quả và bài học.**

## Tài liệu hội đồng

- [Product & UX Review](./product-ux-review.md)
- [Architecture & Security Review](./architecture-security-review.md)
- [Strategy & Learning Review](./strategy-learning-review.md)
- [Research nền](../research/personal-operating-assistant.md)
