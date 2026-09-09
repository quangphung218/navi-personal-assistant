# Hội đồng kiến trúc & bảo mật: phản biện Personal Operating Assistant

_Ngày review: 2026-08-27_

_Góc nhìn: Principal AI Architect · Distributed Systems Engineer · Privacy/Security Engineer · Pragmatic CTO_

## Kết luận điều hành

Ý tưởng sản phẩm **đáng làm**, nhưng kiến trúc đề xuất trước đó đang chuẩn bị cho một hệ thống trưởng thành trước khi chứng minh được người dùng có quay lại dùng Decision Card hằng ngày hay không. Nếu triển khai nguyên stack Next.js + FastAPI + LangGraph + Postgres/pgvector + MCP + LiteLLM + Phoenix + OpenHands ngay, phần lớn thời gian 8–12 tuần đầu sẽ bị tiêu vào tích hợp, deployment và theo dõi hạ tầng thay vì cải thiện chất lượng quyết định.

Hội đồng thống nhất kiến trúc MVP như sau:

> **Một modular monolith TypeScript, một tiến trình ứng dụng, một file SQLite, một model provider, không tool có side effect, không agent framework.**

MVP chỉ làm tốt vòng lặp:

```text
Câu hỏi quyết định
→ lấy context đã được người dùng xác nhận
→ tạo Decision Card có cấu trúc
→ người dùng chọn/sửa/bỏ
→ đặt ngày review
→ ghi nhận outcome và regret
→ tạo hoặc cập nhật memory claim có nguồn
```

Các công nghệ khác không bị loại bỏ; chúng được **hoãn đến khi có tín hiệu kỹ thuật cụ thể**:

- thêm FastAPI/Python khi thực sự có workload Python riêng;
- thêm LangGraph khi có workflow phải pause/resume qua nhiều giờ hoặc có nhiều side effect;
- chuyển Postgres khi có concurrent writers, multi-user hoặc server luôn bật;
- thêm vector search khi bộ test chứng minh FTS không đủ;
- thêm MCP sau khi có capability broker và connector thứ hai;
- thêm LiteLLM khi có ít nhất hai provider thật;
- thêm Phoenix khi trace thủ công không còn đủ và đã có chính sách redaction/retention;
- tích hợp coding agent ở một tiến trình/sandbox tách biệt, không nhúng OpenHands vào lõi MVP.

Điểm cần bảo vệ lâu dài không phải framework. Đó là: **event gốc, quyết định và outcome, memory claim có provenance, policy, eval dataset và khả năng export/migrate dữ liệu**.

---

## 1. Những gì bản thiết kế trước làm đúng

Hội đồng đồng thuận với sáu nguyên tắc nền:

1. Sản phẩm là một vòng lặp quyết định–hành động–kết quả, không phải chatbot tổng quát.
2. Canonical memory không phải vector store hay đoạn chat tóm tắt.
3. Suy luận về người dùng phải có nguồn, scope, confidence, trạng thái và thời hạn xem lại.
4. Tool cần policy và approval; MCP tự nó không phải security boundary.
5. Coding nên dùng engine có sẵn, chạy trong môi trường cô lập.
6. “Tự nâng cấp” phải là đề xuất → replay/eval → canary → phê duyệt → rollback.

Đây là các quyết định có tính chống lỗi thời. Phản biện bên dưới chủ yếu nhắm vào **thời điểm đưa công nghệ vào**, không phủ nhận hướng đi.

---

## 2. Phản biện stack từng phần

| Công nghệ/ý tưởng | Nhận định hội đồng | Quyết định cho MVP | Khi nào đưa vào |
|---|---|---|---|
| Next.js | Phù hợp UI và có đủ server capability cho app một người dùng. App Router có độ phức tạp riêng nhưng chấp nhận được nếu đội đã quen React. | **Giữ**, dùng full-stack thay vì chỉ frontend. | Ngay từ đầu. Nếu đội mạnh Python hơn React, FastAPI + server-rendered UI cũng hợp lý; không chạy hai stack chỉ vì “best practice”. |
| FastAPI | Tốt, nhưng Next.js + FastAPI tạo hai runtime, hai hệ type/schema, CORS/auth và hai pipeline deploy. MVP chưa nhận được lợi ích tương xứng. | **Hoãn**. | Khi có worker Python, ML/data pipeline hoặc SDK Python không có tương đương đáng tin cậy. |
| LangGraph | Có checkpoint, durable execution và HITL thật; nhưng low-level graph runtime là dependency mạnh, checkpoint schema dễ len vào domain. Tài liệu chính thức cũng định vị nó cho workflow stateful/long-running và yêu cầu chú ý idempotency khi resume ([overview](https://docs.langchain.com/oss/python/langgraph/overview), [interrupt rules](https://docs.langchain.com/oss/python/langgraph/interrupts)). | **Không dùng cho Decision MVP**. Viết pipeline explicit bằng hàm/use case. | Khi một run cần sống qua restart, pause nhiều giờ/ngày, có branching/retry phức tạp hoặc từ hai side effect trở lên. Canonical state vẫn nằm ngoài checkpoint. |
| PostgreSQL | Rất tốt khi có concurrent access, server deployment và hệ sinh thái backup. Với một người dùng local, nó thêm daemon, credential, backup và migration ops. | **SQLite WAL + migrations**. | Khi cần multi-user, nhiều writer, HA, cloud canonical store hoặc job concurrency vượt SQLite. |
| pgvector | Dễ vận hành hơn vector DB riêng nhưng embeddings tạo coupling với model/dimension và dễ che lấp retrieval kém. | **Không dùng**. Bắt đầu structured query + SQLite FTS5. | Chỉ khi golden retrieval set chứng minh semantic search tăng recall đáng kể. Embedding là index tái tạo được, không phải dữ liệu gốc. |
| MCP | Chuẩn connector hữu ích, nhưng remote MCP kéo theo OAuth, token audience, confused deputy, prompt injection và supply-chain risk. Spec cấm token passthrough và yêu cầu audience validation ([MCP authorization](https://modelcontextprotocol.io/specification/draft/basic/authorization)). | **Không cho model gọi MCP trực tiếp**; MVP chưa cần MCP. | Sau capability broker, connector allowlist/version pinning và threat tests. Dùng adapter nội bộ trước; MCP là adapter ở seam ngoài. |
| LiteLLM | Unified gateway hữu ích ở quy mô nhiều provider, nhưng proxy + database + master key tạo thêm một control plane nhạy cảm. Một wrapper nhỏ cho một provider sâu hơn một proxy vận hành sớm. | **Provider adapter tối thiểu trong code**, một provider. | Khi có ít nhất hai provider hoạt động, nhu cầu fallback/routing/spend policy đo được hoặc nhiều app cùng dùng gateway. |
| Phoenix | Có giá trị cho trace/eval. Nhưng trace có thể chứa toàn bộ prompt, tài liệu và memory. Self-host mặc định có auth tắt ở lần triển khai ban đầu và retention mặc định vô hạn; phải chủ động bật auth và retention ([authentication](https://arize.com/docs/phoenix/deployment/authentication), [retention](https://arize.com/docs/phoenix/settings/data-retention)). | **Structured log đã redaction + bảng run metadata**. Phoenix tùy chọn ở môi trường dev, không phải dependency runtime. | Khi đã có 20–50 eval cases, cần so sánh experiment và có redaction, access control, retention ≤30 ngày. |
| OpenHands | Là platform coding agent lớn, có runtime/sandbox/lifecycle riêng. Nhúng ngay sẽ làm POA kiêm luôn nhiệm vụ vận hành coding platform. | **Không nhúng vào MVP**. | Giai đoạn coding: adapter gọi Codex/Aider/OpenHands như external executor trong worktree/container; chỉ nhận task manifest và trả patch/test report. |
| Docker Compose | Giúp reproducibility nhưng một app + SQLite không cần orchestration container. Volume, permission và networking có thể làm local install khó hơn. | **Tùy chọn cho dev/CI**, không bắt buộc cho người dùng đầu tiên. | Khi thêm Postgres, worker hoặc observability stack. |
| OpenTelemetry | Chuẩn tốt, ít lock-in nếu dùng vừa đủ. Full tracing sớm dễ thu PII. | **Giữ tối thiểu**: run id, bước, latency, token, cost, error; content mặc định không log. | Mở rộng khi có policy field-level và công cụ trace đã bảo vệ. |

### Kết luận về ngôn ngữ

Không nên duy trì TypeScript frontend và Python backend chỉ để “đúng hệ sinh thái AI”. Model API, structured output, FTS, job scheduler và eval cơ bản đều làm được trong TypeScript. Hãy thêm Python như **một adapter/worker tại seam thật** khi đã có implementation thứ hai cần nó. Theo deletion test, xóa FastAPI khỏi MVP hiện tại làm biến mất nhiều complexity nhưng gần như không đẩy logic có giá trị về nơi khác; vậy module đó đang nông và chưa kiếm được chỗ đứng.

---

## 3. Kiến trúc MVP tối giản nhưng có đường tiến hóa

### 3.1 Topology

```text
Trình duyệt trên máy tin cậy
          │ localhost / private network
          ▼
┌───────────────────────────────────────────┐
│ Next.js modular monolith                  │
│                                           │
│ UI                                       │
│  └─ Today / Decide / Memory / Review      │
│                                           │
│ Application modules                       │
│  ├─ Decision                             │
│  ├─ Memory                               │
│  ├─ Review                               │
│  ├─ Policy                               │
│  └─ Eval                                 │
│                                           │
│ Adapters                                  │
│  ├─ ModelProvider                         │
│  ├─ Clock                                 │
│  └─ Notification (in-app only)            │
└──────────────┬────────────────────────────┘
               │
        SQLite + FTS5
        artifact directory
               │
       encrypted backup

External boundary: one outbound HTTPS model call,
with explicit field selection and no raw secret/tool access.
```

### 3.2 Năm deep modules

Không chia theo framework folder trước; chia theo hành vi sản phẩm. Mỗi module có interface nhỏ, implementation có thể thay mà caller không biết chi tiết.

#### Decision module

Interface đề xuất:

```ts
createDecisionDraft(input): Promise<DecisionDraft>
commitDecision(draftId, choice): Promise<Decision>
recordOutcome(decisionId, outcome): Promise<DecisionReview>
```

Module tự chịu trách nhiệm: phân loại reversibility/risk, chọn context, tạo options, validate output, tạo card, đặt review date và ghi events. Không phơi ra “node graph” hay prompt steps cho UI.

#### Memory module

```ts
findRelevantContext(query, scope): Promise<SourcedContext[]>
proposeClaims(evidenceIds): Promise<ClaimProposal[]>
reviewClaim(claimId, action): Promise<MemoryClaim>
```

Module ẩn retrieval strategy. Hôm nay là SQL/FTS; ngày mai có thể thêm vector adapter mà Decision module không đổi.

#### Policy module

```ts
authorize(intent, actor, context): AuthorizationDecision
```

Trong MVP, module luôn từ chối external writes. Sau này capability broker dùng cùng interface; không nhét quyền vào system prompt.

#### Model module

```ts
generateStructured<T>(request, schema, budget): Promise<ModelResult<T>>
```

Interface phải quy định timeout, retry tối đa, token/cost budget, lỗi parse, data classification và provider metadata. Prompt/provider cụ thể nằm trong adapter.

#### Eval module

```ts
runSuite(version, dataset): Promise<EvalReport>
compare(candidate, baseline): ReleaseDecision
```

Module đo deterministic checks trước, human review sau, LLM judge cuối cùng. Không để cùng một model vừa sinh vừa tự tuyên bố mình tốt hơn mà không calibration.

### 3.3 Pipeline Decision không cần agent framework

```text
1. Validate câu hỏi + mục tiêu + deadline
2. Query confirmed facts/goals/recent relevant decisions
3. Assemble context budget có source IDs
4. Một model call trả structured DecisionDraft
5. Deterministic validation:
   - 2–3 options
   - đúng source IDs
   - có uncertainty / reversibility / largest risk
   - next action cụ thể
   - length budget
6. Nếu invalid: một repair call; vẫn invalid thì trả lỗi rõ ràng
7. Hiển thị draft; chưa ghi là quyết định của người dùng
8. Người dùng chọn/sửa/bỏ → append event
9. Scheduler nội bộ tạo review reminder
```

Một model call tốt hơn một chuỗi “planner → critic → judge → summarizer” trong MVP: ít latency, ít cost, ít nondeterminism và dễ xác định bước nào sai. Chỉ tách call khi eval cho thấy một lỗi cụ thể không sửa được bằng schema/context/prompt.

---

## 4. Mô hình dữ liệu: giữ được lâu và migrate được

### 4.1 Dữ liệu canonical

Chỉ bốn nhóm là canonical:

1. **Events:** điều gì thực sự xảy ra — user submitted, assistant recommended, user chose, outcome recorded, claim reviewed.
2. **Domain records:** goals, projects, decisions, options, reviews.
3. **Source artifacts:** note/file/link được người dùng đưa vào, kèm checksum và classification.
4. **User-approved policy/profile:** constitution, risk preferences và confirmed claims.

Các dữ liệu sau **không canonical và phải tái tạo được**:

- embeddings;
- FTS index;
- summaries;
- Today cards;
- model traces;
- LangGraph checkpoints (nếu có sau này);
- scores do LLM judge sinh;
- cache.

### 4.2 Event không đồng nghĩa “không bao giờ xóa”

“Append-only immutable log” xung đột với quyền xóa dữ liệu cá nhân. Thiết kế thực dụng:

- event là append-only trong luồng nghiệp vụ thông thường;
- payload nhạy cảm tham chiếu sang artifact/secret record có thể xóa;
- khi xóa, tạo tombstone và xóa payload/index/embedding/cache liên quan;
- audit chỉ giữ event type, timestamp, stable ID và hash không thể đảo ngược nếu thực sự cần;
- backup có retention hữu hạn và deletion manifest để dữ liệu không tự sống lại khi restore.

### 4.3 Quy tắc schema chống lock-in

- UUID/ULID do app cấp, không dùng ID của provider/framework.
- Mọi event có `schema_version`, `occurred_at`, `recorded_at`, `actor`, `correlation_id`.
- Lưu raw model output tối đa ngắn hạn để debug; canonical record phải qua schema validation.
- `memory_claim` tách `claim_text` khỏi `status`, `scope`, `confidence`, `valid_from/to`, `review_at` và bảng nguồn nhiều-nhiều.
- Confidence không được dùng như xác suất toán học nếu chưa calibration; UI nên gọi là thấp/vừa/cao.
- Export định kỳ thành JSONL + Markdown/CSV + artifact files, có manifest/checksum và version.
- Migration phải có forward test và restore test trên bản copy database.

### 4.4 “Local-first” cần gọi đúng tên

Một web app với database trên một máy chủ riêng là **single-authority self-hosted**, chưa phải local-first multi-device. Local-first thật đòi hỏi mỗi thiết bị có bản dữ liệu hoạt động offline và cơ chế merge/sync/conflict. MVP không nên xây CRDT.

Quyết định đúng cho giai đoạn đầu:

> Máy cá nhân tin cậy giữ canonical SQLite; cloud model chỉ nhận context tối thiểu cho từng request; backup được mã hóa. Khi nhu cầu đa thiết bị xuất hiện, chọn server-authoritative sync trước, không nhảy thẳng sang CRDT.

---

## 5. Threat model tối thiểu

### 5.1 Tài sản cần bảo vệ

- mục tiêu, lịch sử quyết định, cảm xúc/sở thích và weakness profile;
- source artifacts, code, email/calendar nếu kết nối sau này;
- model/API tokens, OAuth refresh tokens;
- Personal Constitution và policy;
- audit/eval data;
- quyền thực thi code, gửi nội dung, deploy hoặc chi tiền.

### 5.2 Trust zones

```text
[Người dùng + thiết bị tin cậy]
             │
       [POA application]
       /       |         \
[Local DB] [Model API] [Future connector/tool]
  trusted      untrusted/processor     untrusted
```

Mọi nội dung lấy từ email, web, tài liệu, issue, MCP server và output của model là **untrusted data**, không phải instruction. Provider model cũng không phải nơi giữ secret hay policy cuối cùng.

### 5.3 Failure modes và kiểm soát

| Failure mode | Hậu quả | Kiểm soát bắt buộc |
|---|---|---|
| Direct/indirect prompt injection | Tài liệu/email dụ agent lộ data hoặc gọi tool | Tách instruction/data; không đưa tool quyền cao cho model; allowlist intent; output schema; injection tests. |
| Memory poisoning | Một câu nói hoặc tài liệu ác ý trở thành “sự thật về anh” | Chỉ tạo claim proposal; provenance; source type; confirmation cho sensitive/high-impact claim; expiry; contradiction detection. |
| Approval fatigue | Người dùng bấm đồng ý vì card mơ hồ hoặc quá nhiều prompt | Không có write tool ở MVP; sau này batch nhỏ, preview exact diff/recipient/payload/cost; approval hết hạn; không dùng nút “Approve all”. |
| TOCTOU sau approval | Payload/recipient thay đổi giữa xem và thực thi | Approval ký trên canonical action hash; execute đúng payload đã duyệt; sửa gì phải xin duyệt lại. |
| Retry/replay side effect | Resume/retry gửi email, tạo lịch hoặc trả tiền hai lần | Idempotency key, outbox, unique constraint, state machine; side effect đặt sau checkpoint. LangGraph cũng cảnh báo side effect trước interrupt phải idempotent ([interrupt rules](https://docs.langchain.com/oss/python/langgraph/interrupts)). |
| Confused deputy / token passthrough | Connector dùng quyền người dùng sai audience | OAuth token per resource; audience validation; không chuyển tiếp token; connector identity riêng. |
| Secret/PII trong trace | Toàn bộ hồ sơ cá nhân bị sao chép sang observability | Content logging off mặc định; field redaction; synthetic eval; auth; encryption; retention ≤30 ngày; audit access. |
| SSRF/path traversal/shell injection | Tool đọc mạng/file hoặc chạy lệnh ngoài scope | URL/domain/path allowlist; canonicalize path; argv array thay shell string; deny symlink escape; network egress policy. |
| Coding sandbox escape/exfiltration | Agent đọc secret hoặc gửi source code ra ngoài | Ephemeral container/worktree; no host socket; read/write mounts tối thiểu; egress deny/default; secrets broker; resource/time limits. |
| Supply-chain/tool poisoning | MCP/plugin/update thay description hoặc hành vi | Pin version/digest; signed provenance nếu có; review manifest/diff; tool inventory; revoke/kill switch. |
| Cross-project leakage | Context dự án A lộ sang B | Scope bắt buộc ở query; row-level tests; no “retrieve all then ask model to filter”. |
| Backup leakage/restore resurrection | Database xóa rồi nhưng backup còn plaintext | Encrypted backup, key tách riêng, retention, restore drills, deletion manifest. |
| Session/CSRF nếu mở mạng | Người khác truy cập POA hoặc phê duyệt action | Bind localhost mặc định; nếu remote thì auth mạnh, secure cookies, CSRF, TLS/Tailscale, rate limit, session re-auth cho R3. |

OWASP xếp prompt injection và excessive agency vào các rủi ro trọng yếu; excessive agency đặc biệt nguy hiểm khi input độc hại gặp function, permission hoặc autonomy quá rộng ([OWASP LLM Top 10 2025](https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf)). Approval chỉ là một lớp; **least privilege và deterministic enforcement** mới là lớp chính.

### 5.4 Những gì tuyệt đối không lưu trong prompt/memory

- API key, refresh token, password, recovery code;
- khóa backup/encryption;
- private key;
- secret production;
- dữ liệu không cần thiết cho quyết định hiện tại;
- suy luận y tế/tài chính/tâm lý nhạy cảm chưa được người dùng chủ động xác nhận lưu.

Secrets nằm trong OS keychain/secret manager; database chỉ giữ reference và metadata.

---

## 6. Deployment topology theo từng nấc

### Nấc 0 — MVP một người, một máy

- Next.js bind `127.0.0.1`.
- SQLite WAL trên ổ đĩa đã mã hóa của hệ điều hành.
- API key trong OS keychain hoặc environment injection, không vào `.env` được commit.
- Một scheduled process nội bộ cho review reminders; job có unique key.
- Backup mã hóa hằng ngày, retention 7 daily + 4 weekly; restore thử mỗi tháng.
- Outbound network chỉ đến model provider đã chọn.
- Không Phoenix production, không public port, không connector write.

### Nấc 1 — dùng từ điện thoại/laptop khác

- Vẫn một canonical server; truy cập qua Tailscale/private network.
- Bắt buộc auth/session, TLS private, CSRF và device revoke.
- Không copy thẳng SQLite qua Dropbox/Drive khi app đang chạy.
- Nếu concurrency vẫn thấp, SQLite vẫn dùng được; backup qua SQLite backup mechanism/snapshot nhất quán.

### Nấc 2 — always-on hoặc multi-user

- Application container + managed/self-host Postgres.
- Worker riêng + durable queue/outbox.
- Object storage mã hóa cho artifacts.
- Reverse proxy, SSO/MFA, secret manager, monitoring và tested restore.
- Chỉ lúc này cân nhắc Phoenix self-host; tài liệu Phoenix xác nhận SQLite phù hợp single-user còn Postgres phù hợp production/multi-user ([deployment architecture](https://arize.com/docs/phoenix/self-hosting/deployment)).

### Nấc 3 — agent có external actions

- Capability broker tách khỏi model orchestration.
- Connector credentials tách theo connector/resource.
- Sandboxed executor pool không chứa canonical database credential.
- Egress proxy, action outbox, approval service, immutable action receipt và kill switch.
- Temporal/LangGraph chỉ được thêm nếu workflow durability thực sự cần; không thay database domain bằng checkpoint store.

---

## 7. Build vs buy

| Hạng mục | Build | Adopt/buy | Lý do |
|---|---|---|---|
| Decision Card/domain rules | **Build** | | Đây là giá trị sản phẩm và dữ liệu học riêng. |
| Outcome/regret review | **Build** | | Moat nằm ở feedback loop, không ở chat UI. |
| Memory claim/provenance/deletion | **Build** | | Policy cá nhân và trust UX phải kiểm soát được. |
| Personal Constitution/risk policy | **Build** | | Không giao enforcement cho prompt/framework. |
| Eval dataset + release gates | **Build** | Dùng thư viện test/LLM judge hỗ trợ | Dataset cá nhân là tài sản; harness có thể thay. |
| Authentication | | **Adopt** thư viện/provider chuẩn | Tự viết auth làm tăng rủi ro. MVP localhost chưa cần tài khoản giả. |
| Model | | **Adopt API/local model** | Không train/fine-tune trước khi có dataset. |
| Database | | **SQLite → Postgres** | Công nghệ trưởng thành; không tự xây store. |
| Search | | FTS5; vector extension sau | Embedding/index là hạ tầng thay được. |
| Coding agent | | **Codex/Aider/OpenHands qua adapter** | Không cạnh tranh xây coding engine. |
| MCP connectors | | Adopt server đã review, bọc policy | Không tự xây ecosystem nhưng phải tự giữ security seam. |
| Observability | Structured metrics build nhỏ; **Phoenix/OTel adopt** khi cần | | Tránh tự làm trace UI. |
| Workflow runtime | Explicit code trước; **LangGraph/Temporal adopt** sau | | Không tự xây durable runtime, cũng không mang nó vào quá sớm. |

---

## 8. Self-improvement: giới hạn chính xác

### Được tự động

- tính lại retrieval index;
- cập nhật thống kê outcome, latency, cost;
- tạo claim proposal từ evidence;
- đề xuất prompt/config candidate;
- chạy offline eval trên dữ liệu đã redaction;
- báo regression và đề nghị rollback.

### Cần người dùng duyệt

- xác nhận claim nhạy cảm hoặc ảnh hưởng nhiều quyết định;
- đổi Personal Constitution/risk threshold;
- promote prompt/model/retrieval policy mới sang production;
- bật connector, tăng scope hoặc retention;
- merge code/schema migration/deploy.

### Bị cấm

- tự tăng quyền;
- tự thay eval rubric để “đạt điểm”;
- dùng production interaction làm training ngoài phạm vi consent;
- xóa event/audit nhằm che regression;
- tự sửa và chạy production code;
- tự coi lời tự phê bình của model là evidence độc lập.

Mỗi candidate phải có version, owner, hypothesis, changed fields, dataset version, baseline report, safety delta, cost delta và rollback target. “Tốt hơn” phải là một claim có số liệu, không phải nhận xét của model.

---

## 9. Quality gates

### Gate A — trước khi coding

- Có ít nhất 20 quyết định thật, trong đó 10 quyết định đã biết outcome.
- Personal Constitution v0 và data classification v0 được viết.
- Định nghĩa “Decision Card tốt” bằng rubric 1 trang.
- Chốt danh sách data không được gửi ra model provider.

### Gate B — trước khi dùng hằng ngày

- 100% output parse được theo schema; repair tối đa một lần.
- 100% source citation trong card trỏ tới record tồn tại và đúng scope.
- Không có claim inferred nào hiển thị như confirmed.
- Median card ≤250 từ; đọc thử bởi người dùng ≤2 phút.
- Backup và restore thành công trên máy sạch.
- Export/import round-trip không mất decision, outcome, claim source.

### Gate C — trước khi thêm proactive/read connectors

- Ít nhất 4 tuần sử dụng thật.
- ≥30 decision outcomes đã review.
- Recommendation usefulness đạt ngưỡng do người dùng đặt; đề xuất ban đầu: ≥60% “giúp chọn hoặc thu hẹp quyết định”.
- Memory precision qua human audit ≥90%; 100% claim có source.
- Notification budget và data retention đã được chốt.
- Prompt-injection suite cho external content đạt 100% ở các invariant “không lộ secret/không external write”.

### Gate D — trước external write/coding autonomy

- Capability policy test 100% deny-by-default.
- Exact action preview + signed action hash + expiry.
- Idempotency/replay tests; cùng action chạy lại không tạo side effect thứ hai.
- Sandbox escape/path traversal/SSRF/shell injection tests.
- Egress allowlist và secret isolation được kiểm tra thực tế.
- Kill switch hoạt động và audit receipt được tạo cho mọi action.
- Không merge/deploy/chi tiền tự động.

### Gate E — trước “self-improvement” production

- Golden set ≥50 case đại diện, có frozen holdout.
- Candidate không giảm safety/invariant metric nào.
- Quality tăng có ý nghĩa theo rubric/human pairwise review, không chỉ LLM judge.
- Cost và p95 latency không tăng quá budget đã chốt.
- Canary có giới hạn traffic/time và rollback một thao tác.

---

## 10. Chi phí vận hành thường bị đánh giá thấp

### Chi phí trực tiếp

- model calls: chuỗi multi-agent 5 bước có thể tốn 5–15 lần một structured call;
- embeddings khi re-index hoặc đổi embedding dimension;
- observability lưu full prompt/trace, thường lớn hơn domain data;
- server/VPS, Postgres, object storage, backup và egress;
- coding sandbox CPU/RAM và model token.

### Chi phí kỹ thuật

- nâng version Next.js, Python, LangGraph, MCP SDK, LiteLLM, Phoenix và OpenHands cùng lúc;
- debug qua hai ngôn ngữ và nhiều queue/checkpoint store;
- schema drift giữa Pydantic, TypeScript, tool schema và database;
- credential rotation cho từng connector;
- restore/retention/deletion propagation;
- eval dataset cũ theo thời gian hoặc bị leak vào prompt tuning.

### Ngân sách MVP đề xuất

- một model call chính + tối đa một repair call/Decision Card;
- timeout 30–45 giây; không loop vô hạn;
- hard token budget cho input/context/output;
- cache chỉ cho dữ liệu không nhạy cảm hoặc cache được mã hóa;
- theo dõi cost/run và cost/decision-reviewed, không chỉ cost/token;
- alert khi ngày/tuần vượt budget; fail closed thay vì âm thầm gọi model đắt hơn.

---

## 11. Các ADR phải chốt

| ADR | Quyết định hiện tại | Trigger xem lại |
|---|---|---|
| ADR-001 Product scope | MVP chỉ Decision + Memory + Review; Today là view dẫn xuất. | 4 tuần retention tốt và outcome loop có giá trị. |
| ADR-002 Application shape | Next.js TypeScript modular monolith. | Workload Python riêng hoặc team structure đòi deploy độc lập. |
| ADR-003 Canonical store | SQLite WAL, một writer logic, migrations/versioned export. | Multi-user/concurrency/HA/always-on cloud. |
| ADR-004 Memory model | Event + domain record + sourced claim; summary/index là derived. | Không đổi; chỉ mở rộng schema có migration. |
| ADR-005 Retrieval | Structured SQL + FTS5. | Golden retrieval eval cho thấy recall không đạt ngưỡng. |
| ADR-006 Model integration | Một provider adapter, structured output, budget/timeout. | Provider thứ hai chạy production hoặc cần centralized routing. |
| ADR-007 Workflow | Explicit deterministic pipeline; không LangGraph. | Pause/resume dài hạn, branching/retry hoặc nhiều side effect. |
| ADR-008 Tool policy | Deny all external writes; in-app/local reversible only. | Capability broker + Gate D đạt. |
| ADR-009 Observability | Metadata-only logs; content off; Phoenix dev optional. | Debug/eval cần experiment UI và privacy controls đã có. |
| ADR-010 Data locality | Single-authority self-hosted, không tuyên bố multi-device local-first. | Offline multi-device là nhu cầu thật. |
| ADR-011 Deletion/retention | Tombstone + purge derived data/backups theo retention. | Có yêu cầu pháp lý/đa người dùng cụ thể. |
| ADR-012 Self-improvement | Candidate offline, human promote, rollback bắt buộc. | Có đủ golden set và canary infrastructure; invariant không nới lỏng. |
| ADR-013 Coding execution | External adapter, isolated worktree/container, patch-only. | Sau Gate D; production merge/deploy vẫn human-only. |
| ADR-014 Deployment | Localhost + encrypted disk/backup. | Remote access → private network + auth; multi-user → Postgres. |

Mỗi ADR nên có: context, decision, alternatives rejected, consequences, security/privacy impact, migration/rollback và review trigger. Không ghi ADR chỉ để mô tả công nghệ đang dùng.

---

## 12. Lộ trình triển khai đã rút gọn

### Tuần 0 — dữ liệu và chuẩn chất lượng

- thu 20 quyết định thật;
- viết constitution/data classification;
- tạo 20 golden cases;
- chốt rubric và baseline: time-to-decision, usefulness, regret follow-up.

### Tuần 1 — vertical slice hoàn chỉnh

- một trang nhập câu hỏi;
- một model adapter;
- DecisionDraft schema + validation;
- SQLite decisions/options/events;
- chọn/sửa/bỏ recommendation;
- log metadata/cost/latency.

**Demo cuối tuần:** từ câu hỏi đến quyết định được commit và xem lại lịch sử.

### Tuần 2 — outcome loop

- review date;
- in-app reminder;
- record outcome/regret/lesson;
- weekly review;
- export JSONL/CSV/Markdown;
- backup/restore test.

### Tuần 3 — memory có trust

- confirmed/inferred/disputed claim;
- source links, scope, expiry;
- review/edit/delete UI;
- structured + FTS retrieval;
- deletion propagation và contradiction tests.

### Tuần 4 — hardening và pilot

- 30–50 eval cases;
- prompt injection, cross-scope và invalid-output tests;
- privacy redaction;
- p95 latency/cost budget;
- dùng thật 7 ngày, loại bỏ tính năng không tạo quyết định tốt hơn.

Sau tuần 4, chỉ chọn **một** nhánh mở rộng dựa trên dữ liệu: Today, Coaching hoặc Coding. Không làm cả ba song song.

---

## Phán quyết cuối cùng

Sản phẩm tốt nhất không phải hệ thống có nhiều agent nhất, mà là hệ thống tạo được **niềm tin lặp lại**: nó nhớ đúng, chỉ dùng dữ liệu đúng phạm vi, nói rõ điều chưa biết, đưa ra khuyến nghị đủ ngắn, và học từ outcome thật mà không tự viết lại lịch sử.

Kiến trúc nên tối ưu cho câu hỏi đầu tiên:

> Sau 4 tuần, liệu anh có ra quyết định nhanh hơn và ít hối tiếc hơn không?

Nếu chưa trả lời được câu đó, LangGraph, pgvector, MCP, LiteLLM, Phoenix và OpenHands chỉ làm sản phẩm trông “AI-native” hơn chứ chưa làm nó hữu ích hơn. Nếu trả lời được, các seam trên cho phép thêm từng công nghệ mà không làm mất tài sản cốt lõi hoặc phải migration toàn bộ dữ liệu.
