# Phán quyết cuối cùng sau hai vòng hội đồng

> Cập nhật 08/09/2026: tài liệu này là review lịch sử theo giả định thương mại hóa. Mục tiêu hiện tại đã được làm rõ là ban trợ lý cá nhân theo module. Dùng [bản thiết kế cá nhân](../personal-assistant-product.md) cho triển khai tiếp theo; paid beta và founder SaaS không phải điều kiện triển khai cá nhân.

_Ngày: 2026-08-27_

_Tài liệu này tổng hợp sáu hội đồng độc lập và được ưu tiên khi có xung đột với blueprint/review trước._

## 1. Sáu hội đồng đã tham gia

### Vòng 1 — Sản phẩm và khả năng xây

1. Product, UX, behavioral decision science và skeptical founder.
2. AI architecture, distributed systems, privacy và security.
3. Learning science, executive coaching, AI strategy và futurist.

### Vòng 2 — Khả năng sống ngoài thị trường

4. GTM, pricing, SaaS growth và skeptical investor.
5. Human factors, cognitive science, HCI và AI ethics.
6. Experimentation, causal inference, ML evaluation, data architecture và privacy.

## 2. Phán quyết

**GO có điều kiện.**

Không xây Personal Operating Assistant toàn năng. Không bán “AI hiểu anh” hoặc “AI giúp anh quyết định đúng”.

Xây và kiểm chứng một wedge duy nhất:

> **Founder Experiment Copilot:** biến một quyết định product/growth đang bị kẹt thành một thí nghiệm 7 ngày có success signal trong dưới 5 phút, rồi đóng vòng bằng outcome và bài học.

Lời hứa đúng:

> “Trước khi build thêm một tuần, hãy xác định điều chưa biết và chạy phép thử nhỏ nhất.”

Không hứa:

- ra quyết định đúng trong hai phút;
- biết lựa chọn tốt nhất cho người dùng;
- hiểu toàn bộ con người;
- cải thiện outcome theo quan hệ nhân quả khi chưa có thử nghiệm;
- tự nâng cấp vô hạn.

## 3. Vì sao ý tưởng vẫn đáng làm

General AI có thể brainstorm và đưa lời khuyên, nhưng thường không bắt buộc:

```text
định nghĩa signal trước
→ timestamp prediction
→ commit experiment
→ quay lại đúng hạn
→ ghi outcome có nguồn
→ tách process khỏi luck
→ cập nhật belief có bằng chứng
```

Giá trị khác biệt nằm ở closed loop, không nằm ở model, prompt, memory hay giao diện card.

## 4. Sự thật thương mại cần chấp nhận

- Thị trường đã có nhiều sản phẩm dùng narrative “AI decision coach”, “decision journal”, “bias detection” và “decision OS”.
- ChatGPT + prompt là đối thủ mạnh nhất, không phải chỉ các startup khác.
- Decision quality là pain có thật nhưng có nguy cơ “được khen nhiều, dùng ít”.
- Đây có thể là niche SaaS bootstrapped tốt; chưa có bằng chứng venture-scale.
- Data moat không tồn tại trong 3–6 tháng đầu.

Do đó, phải thu tiền trước khi xây SaaS đầy đủ.

## 5. Beachhead customer

**English-speaking solo technical SaaS founder đã ship prototype, có 5–100 active users hoặc đang customer discovery, nhưng chưa có repeatable acquisition.**

Điều kiện qualify:

- có sản phẩm thật và mục tiêu 4–8 tuần;
- tự quyết product và growth;
- có ít nhất hai quyết định experimentable mỗi tuần;
- đã trả tiền cho AI/productivity tool;
- chấp nhận ghi metric nhỏ và review outcome trong 30–90 giây.

Chỉ phục vụ:

- nên build gì tiếp;
- giả định nào cần test trước;
- nên chạy growth/pricing/onboarding experiment nào;
- tiếp tục, sửa hay dừng một experiment.

## 6. Phạm vi an toàn

### Green — được đưa gợi ý có điều kiện

- product experiment;
- growth test với budget nhỏ đã chốt;
- technical approach có sandbox, test và rollback;
- time allocation ngắn hạn;
- quyết định chủ yếu ảnh hưởng chính người dùng;
- feedback cycle 1–4 tuần.

### Amber — chỉ hỗ trợ cấu trúc và evidence checklist

- downside đáng kể;
- nhiều stakeholder;
- context mâu thuẫn hoặc thiếu;
- khó rollback;
- competence/eval coverage chưa đủ.

### Red — không verdict

- y tế, mental health, legal, tax, investment/debt/insurance;
- tuyển dụng, sa thải, kỷ luật và quyền lợi người khác;
- quan hệ thân mật, coercion hoặc abuse;
- nguy hiểm thể chất hoặc crisis;
- hành động bất hợp pháp, deceptive hoặc discriminatory;
- production/security có thể ảnh hưởng dữ liệu, tiền hoặc người khác mà thiếu review;
- người dùng yêu cầu AI “quyết định hộ” khi đang distress, intoxicated hoặc kiệt sức;
- xung đột lợi ích với revenue/engagement của chính sản phẩm.

Safe output:

> “Hệ thống không nên chọn thay anh trong tình huống này vì hậu quả có thể lớn hoặc thông tin chưa đủ. Hệ thống có thể giúp liệt kê bằng chứng, chuẩn bị câu hỏi cho người phù hợp và xác định bước an toàn, có thể đảo ngược.”

## 7. Decision protocol cuối cùng

### Bước 0 — Triage

Xác định Green/Amber/Red trước khi model tạo recommendation.

### Bước 1 — User prior trước AI anchor

Người dùng ghi ngắn:

- mục tiêu;
- hướng đang nghiêng về;
- lý do mạnh nhất;
- confidence thấp/vừa/cao.

### Bước 2 — Evidence check

Xác định:

- evidence đang có;
- evidence còn thiếu;
- assumption có thể đổi kết luận;
- stakeholder;
- base rate và time pressure.

Nếu thiếu context quan trọng sau tối đa hai câu hỏi, hệ thống phải abstain.

### Bước 3 — Symmetric options

Ít nhất gồm:

- phương án gợi ý;
- alternative hợp lý;
- chờ thêm bằng chứng hoặc không làm nếu đó là option thật.

Không strawman alternative.

### Bước 4 — Conditional recommendation

Wording chuẩn:

> “Với mục tiêu X, ràng buộc Y và bằng chứng hiện có, A có vẻ phù hợp hơn nếu Z đúng. Mức chắc chắn thấp/vừa/cao vì… Khuyến nghị sẽ đổi nếu…”

### Bước 5 — Comprehension và autonomy

- accept, edit, reject và defer có visual weight/số thao tác tương đương;
- không preselect;
- người dùng sửa premise ngay trên card;
- người dùng xác định được risk lớn nhất trước commit.

### Bước 6 — Bounded experiment

Phải có:

- time/money/scope cap;
- success signal;
- stop condition;
- review date;
- không external action nếu chưa có approval riêng.

### Bước 7 — Blind process review trước outcome

1. Hiện lại prediction, assumptions và evidence lúc commit.
2. Review execution fidelity.
3. Review process quality.
4. Sau đó mới nhập outcome.
5. Ghi confounders.
6. Lesson là hypothesis; có thể kết luận “chưa học được gì đáng tin”.

## 8. Decision Card cuối cùng

Không dùng tiêu đề `NÊN LÀM GÌ?`. Dùng:

```text
GỢI Ý HIỆN TẠI
Chạy concierge test với 5 founder trước khi code onboarding.

DỰA TRÊN
• Điều chưa biết là họ có quay lại, không phải ta có build được không.
• Test mất 2 ngày và có thể rollback hoàn toàn.

CÒN THIẾU
Chưa có baseline từ các test acquisition trước.

LÝ DO MẠNH NHẤT ĐỂ KHÔNG LÀM
5 người được chọn có thể không đại diện đúng ICP.

THÍ NGHIỆM + STOP CONDITION
Gửi prototype cho 5 founder. Dừng nếu không tuyển đủ mẫu đúng ICP sau 2 ngày.
Signal: ≥3 người tự quay lại trong 7 ngày.

MỨC CHẮC CHẮN
Trung bình. Gợi ý sẽ đổi nếu baseline cho thấy nhóm này hiếm khi quay lại.

[Chọn] [Sửa giả định] [Hướng khác] [Chưa quyết định]
```

## 9. North-star và định nghĩa dữ liệu

North-star cuối cùng:

> **Evaluable Decision Loops per Activated User per 4 Weeks.**

Không dùng Completed Loops đơn thuần.

### Committed Loop

Có question, option, action, prediction, metric/threshold, observation window và review date.

### Completed Loop

Có action status, review, outcome status, process review và lesson hoặc “chưa đủ bằng chứng”.

### Evaluable Loop

Chỉ được tính nếu:

- metric, threshold và window được chốt trước hành động;
- outcome có nguồn;
- execution đủ fidelity;
- không đổi định nghĩa outcome hậu nghiệm;
- observation window đã chín;
- confound nghiêm trọng được ghi;
- forecast có scoring rule phù hợp.

### Comparable Loop

Chỉ so sánh khi cùng decision family, horizon, risk, outcome semantics và mức hỗ trợ.

## 10. Outcome Contract bắt buộc

Mỗi experiment phải định nghĩa trước:

```text
construct
metric
direction
threshold
baseline
observation window
data source
minimum exposure
known confounds
fallback proxy
```

Outcome có thể là `observed`, `pending`, `censored` hoặc `invalidated`. Không ép pending thành failed và không ép người dùng bịa lesson.

## 11. Claims được phép và bị cấm

### Được phép

- “X/Y review được hoàn tất trong 72 giờ.”
- “Median time-to-commit giảm từ A xuống B trong cùng decision family.”
- “Pattern này xuất hiện ở 3/4 case và đang là hypothesis.”
- “Candidate thắng baseline ở X/Y blinded eval cases.”

### Bị cấm khi chưa có thiết kế thực nghiệm

- “AI đưa ra quyết định đúng X%.”
- “Outcome tốt vì làm theo AI.”
- “Hệ thống hiểu anh hơn mỗi tuần.”
- “Ba evidence chứng minh pattern ổn định.”
- “Acceptance cao nghĩa là recommendation tốt.”
- “Outcome graph tự động là moat.”

## 12. Personal Eval Vault phải có từ vertical slice

Mỗi case lưu:

- decision family, risk, horizon;
- input snapshot `as-of decision time`;
- allowed/forbidden context;
- invariants;
- rubric version;
- outcome contract;
- outcome ẩn khi replay;
- provenance;
- split: dev/regression/holdout/challenge;
- consent, sensitivity và retention.

Không cho future outcome/lesson lọt vào context khi replay. Không dùng model candidate tự sinh test và tự chấm nó.

## 13. Tech stack cuối cùng không đổi

MVP vẫn là:

- Next.js + TypeScript modular monolith;
- SQLite WAL + FTS5;
- một model provider adapter;
- Zod/JSON Schema;
- explicit deterministic pipeline;
- metadata-only logs;
- Vitest + Playwright;
- localhost/private network;
- encrypted backup và versioned export.

Chưa cần FastAPI, LangGraph, Postgres, pgvector, MCP, LiteLLM, Phoenix runtime, OpenHands hoặc Temporal.

Nhưng schema phải thêm ngay:

- decision revisions và locked snapshots;
- commitments và forecasts;
- outcome contracts;
- actions/execution fidelity;
- outcome observations;
- blind process reviews;
- provisional lessons;
- context receipts;
- consents, deletion manifests và eval runs.

## 14. Go-to-market trước code

### Offer

**6-week Founder Decision Sprint — $149 một lần**, tối đa 15 qualified founders.

Bao gồm:

- baseline onboarding 30 phút;
- Decision Loop cho product/growth;
- follow-up và outcome review;
- weekly digest;
- calibration report cuối kỳ;
- concierge support được công khai rõ.

### Gate để được build vertical slice

- ít nhất 5/15 người trả đủ $149;
- ≥60% decision tạo committed experiment;
- ≥50% review due nhận outcome;
- ≥50% paid users hoàn tất ít nhất 3 loops;
- ≥40% đồng ý renew ở $29–39/tháng;
- cohort Decision Loop phải thắng ChatGPT + prompt ít nhất 20 điểm phần trăm về completed/evaluable loops hoặc tạo khác biệt sản phẩm rõ tương đương.

Nếu không đạt, không được dùng “người dùng thích demo” để tiếp tục build.

## 15. Pricing và business verdict

Sau paid beta, test tuần tự:

- $19/tháng self-serve;
- $39/tháng với weekly digest/calibration;
- $99/tháng human-assisted review.

Nếu phải chọn một mức giá SaaS sau beta: **$29/tháng hoặc $290/năm**.

Business verdict:

- 1.000 users × $29/tháng có thể tạo bootstrap business tốt;
- 5.000 users × $35/tháng có thể tạo niche SaaS mạnh;
- chưa có evidence cho 25.000 users hoặc venture-scale;
- expansion path khả dĩ: solo founder → co-founder pair → small product team → accelerator/venture studio.

## 16. Roadmap 90 ngày cuối cùng

### Tuần 1–2 — Definition và paid validation

- chọn 3–5 decision families;
- viết Green/Amber/Red policy;
- Outcome Contract và metric registry;
- freeze Eval Vault v0;
- phỏng vấn và Decision Clinic;
- bán 6-week sprint trước khi app tồn tại.

### Tuần 3–6 — Concierge evidence

- phục vụ cohort thủ công;
- test card structure, user prior và reminder cadence;
- đối đầu ChatGPT + prompt;
- thu payment, renew intent và outcome missingness;
- không build ngoài intake/card/follow-up prototype cần thiết.

### Tuần 7–10 — Chỉ build nếu qua commercial gate

- instrumented vertical slice;
- canonical schema + revision/event model;
- context receipt và snapshot;
- review/pending/censored flow;
- Eval Vault + deterministic/challenge suites;
- export/delete/forget/restore.

### Tuần 11–13 — Pilot và first controlled test

- mục tiêu 30–50 real loops, ≥20 evaluable;
- blind process audit;
- randomized/crossover một micro-intervention rủi ro thấp;
- paid continuation checkout;
- công bố nội bộ raw counts, uncertainty và failures.

### Gate ngày 90

Tiếp tục nếu:

- ≥5 paid customers;
- review completion ≥50%;
- ≥50% completed loops evaluable;
- ≥40% muốn renew;
- user tạo loop lặp lại;
- product thắng prompt baseline ở closed-loop behavior;
- Eval Vault bắt được ít nhất một regression thật;
- không có critical safety/privacy/provenance incident.

## 17. Ethical stop-ship conditions

Rollback/dừng ngay nếu:

- một high-stakes verdict lọt qua;
- wording coercive, guilt hoặc emotional dependency;
- sensitive inference được lưu/dùng không consent;
- deletion/opt-out không có hiệu lực;
- acceptance tăng nhưng comprehension/calibration giảm;
- người dùng nói không thể quyết định nếu thiếu app;
- notification tiếp tục sau opt-out;
- evidence thiếu bị che giấu hoặc nguồn bị dựng.

## 18. Commercial kill criteria

Kill hoặc pivot nếu:

- không bán được 5 suất $149 sau 20 qualified offers;
- <40% muốn renew $29/tháng;
- <30% scheduled review có outcome;
- <25% activated users gửi decision thứ hai trong 14 ngày;
- prompt baseline tương đương trong 10 điểm phần trăm;
- cần human coaching >30 phút/tuần/user để tạo value;
- decision frequency trung vị <2/tháng;
- privacy khiến context không đủ;
- evaluable rate <40% sau hai chu kỳ;
- không tìm được channel có CAC payback dự kiến <3 tháng.

## 19. Expansion chỉ theo bottleneck

Sau khi Decision-to-Experiment Loop đứng vững, chỉ chọn một:

1. **Embedded Coach** nếu repeated decision evidence chỉ ra một micro-skill gap và transfer test khả thi.
2. **Coding adapter** nếu đa số experiment trở thành code task và handoff là bottleneck đo được.
3. **Today view** nếu committed experiment thường bị lịch/task khác lấn át.
4. **Team workflow** nếu ≥20% retained users tự chia sẻ artifact với co-founder/advisor.

Không mở tất cả cùng lúc. Không mở vì technology “hay”.

## 20. Kết luận một câu

> **Hãy bán một thí nghiệm 7 ngày được đóng vòng, đo một Evaluable Decision Loop thật và chứng minh nó thắng ChatGPT + prompt; chỉ sau đó mới xây Personal Operating Assistant.**

## Báo cáo nguồn

- [Council Synthesis vòng 1](./council-synthesis.md)
- [Product & UX](./product-ux-review.md)
- [Architecture & Security](./architecture-security-review.md)
- [Strategy & Learning](./strategy-learning-review.md)
- [GTM & Business](./gtm-business-review.md)
- [Human Factors & Ethics](./human-factors-ethics-review.md)
- [Data & Evaluation](./data-evaluation-review.md)
- [Research nền](../research/personal-operating-assistant.md)
