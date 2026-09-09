# Nghiên cứu: Personal Operating Assistant chống lỗi thời

_Ngày nghiên cứu: 2026-08-26. Nguồn ưu tiên: specification, tài liệu chính thức, source repository và paper gốc._

## Kết luận điều hành

Nên xây một **Personal Operating Assistant (POA)** như “hệ điều hành quyết định và phát triển bản thân”, không phải một chatbot biết nhiều thứ. Giá trị cốt lõi là một vòng lặp khép kín:

> quan sát đúng dữ liệu → nén thành lựa chọn rõ ràng → giúp hành động → đo kết quả → học có kiểm soát

Thiết kế chống lỗi thời không đến từ việc chọn đúng một model hay agent framework. Nó đến từ năm ranh giới kiến trúc ổn định:

1. **Dữ liệu cá nhân thuộc về người dùng**, lưu local-first và xuất được dưới định dạng mở.
2. **Model có thể thay thế**, đi qua một model gateway thay vì gắn chặt vào một nhà cung cấp.
3. **Tool có thể thay thế**, tích hợp qua MCP hoặc adapter có schema/version.
4. **Workflow quan trọng là xác định và kiểm thử được**; agent chỉ được tự do trong phạm vi đã định.
5. **Mọi thay đổi “tự nâng cấp” phải qua đánh giá, phê duyệt và rollback**.

Khuyến nghị thực tế: **xây phần lõi mang tính cá nhân** (profile, decision system, skill graph, feedback/eval, policy) nhưng **adopt hạ tầng phổ biến** (SQLite/Postgres, LangGraph, MCP, OpenTelemetry/Phoenix, coding agent có sẵn). Không nên tự xây model, vector database, coding agent hay multi-agent platform từ đầu.

## Trải nghiệm sản phẩm nên có

### 1. Today Cockpit — nhìn 30 giây biết hôm nay phải làm gì

Chỉ hiển thị:

- 1 mục tiêu quan trọng nhất hôm nay;
- 3 hành động có đòn bẩy cao nhất;
- 1 quyết định đang chặn tiến độ;
- 1 bài tập nâng trình;
- cảnh báo lịch, năng lượng hoặc rủi ro nếu thật sự cần.

Mọi gợi ý phải kèm nguồn dữ liệu và mức tự tin. Không biến dashboard thành “bãi KPI”.

### 2. Decision Card — ra quyết định trong 1–2 phút

Mỗi quyết định được ép về một card cố định:

```text
Quyết định cần chốt: ...
Khuyến nghị: A
Vì sao (tối đa 3 ý): ...
So sánh: A / B / Không làm
Mức đảo ngược: dễ / vừa / khó
Rủi ro lớn nhất và cách chặn: ...
Điều gì sẽ làm em đổi khuyến nghị: ...
Bước tiếp theo trong 10 phút: ...
[Chọn A] [Chọn B] [Đào sâu]
```

Assistant phải mặc định đưa ra **một khuyến nghị**, không chỉ liệt kê lựa chọn. Quyết định đảo ngược được thì ưu tiên tốc độ và thí nghiệm nhỏ; quyết định khó đảo ngược thì tăng yêu cầu bằng chứng/phê duyệt. Sau 7/30 ngày, hệ thống hỏi kết quả để đo “decision regret” và hiệu chỉnh cách tư vấn.

### 3. Coding Partner — giao việc, kiểm chứng, giải thích

Không nên viết một coding agent mới. POA nên điều phối coding agent chuyên dụng qua adapter:

- **Aider** phù hợp pair-programming: repo map, nhiều ngôn ngữ, tích hợp Git và model cloud/local ([source repo](https://github.com/Aider-AI/aider)).
- **OpenHands** phù hợp task tự chủ hơn; paper và platform nhấn mạnh sandboxed execution, lifecycle và benchmark ([paper](https://arxiv.org/abs/2407.16741), [source org](https://github.com/OpenHands)).

Mọi task code chạy trên branch/worktree hoặc container riêng; bắt buộc test/lint/diff review. Assistant có thể tạo patch và PR, nhưng không tự merge/deploy production hay mở rộng quyền.

### 4. Daily Coach — tiến bộ phải đo được

Coach không nên chỉ gửi lời khuyên. Nó duy trì một **skill graph** gồm kỹ năng → vi kỹ năng → bài tập → bằng chứng → mức thành thạo. Chu kỳ hằng ngày:

1. chẩn đoán một lỗ hổng nhỏ từ công việc thật;
2. giao bài tập 20–40 phút ở độ khó vừa vượt ngưỡng hiện tại;
3. yêu cầu sản phẩm quan sát được: code, giải thích, thiết kế, quyết định;
4. chấm bằng rubric cố định và test khi có thể;
5. hỏi lại ngắn sau 1/3/7/14 ngày;
6. cập nhật mức thành thạo dựa trên bằng chứng, không dựa trên cảm giác.

Metric nên theo dõi: tỷ lệ hoàn thành, test pass, số lần cần hint, thời gian tự giải, khả năng giải thích lại, mức chuyển giao sang task mới và xu hướng 4 tuần. Gamification/streak chỉ là phụ.

### 5. Idea Radar — nhiều ý tưởng nhưng không gây nhiễu

Ý tưởng được sinh theo “portfolio” thay vì danh sách vô hạn:

- 2 ý tưởng khai thác thế mạnh hiện tại;
- 2 ý tưởng mở rộng gần;
- 1 ý tưởng moonshot;
- mỗi ý tưởng có upside, chi phí, bằng chứng, giả định nguy hiểm nhất và thí nghiệm 1–3 ngày.

Hệ thống học từ ý tưởng được chọn/bỏ và kết quả thí nghiệm, nhưng không suy diễn một lần từ chối thành sở thích vĩnh viễn.

## Kiến trúc đề xuất

```text
Today / Decision / Coach / Ideas / Build UI
                  |
        Personal Operating Core
  goals | decisions | skills | projects | policy
                  |
      Deterministic workflow + agent graph
        LangGraph; Temporal khi cần always-on
                  |
 Capability broker ----- Model gateway
 MCP + approval policy    LiteLLM / provider adapters
                  |
 Coding | Calendar | Notes | Browser | Email | Tasks
                  |
        Local-first personal data plane
 events + artifacts + profile + memories + embeddings
                  |
        Traces + evals + feedback + audit
       OpenTelemetry + Phoenix/Inspect AI
```

### A. Personal data plane: local-first và có provenance

Tư tưởng local-first coi bản local là bản chính, cloud chỉ là bản phụ để đồng bộ; mục tiêu là quyền sở hữu, offline, riêng tư và bảo tồn lâu dài ([Ink & Switch paper](https://www.inkandswitch.com/essay/local-first/)). SQLite phù hợp MVP vì là thư viện in-process, transactional, single-file, zero-configuration, có format ổn định và cam kết hỗ trợ dài hạn ([SQLite official](https://sqlite.org/about.html)).

Đề xuất dữ liệu chuẩn:

- `events`: log append-only của cuộc hội thoại, quyết định, tool call, feedback, outcome;
- `entities`: người, dự án, mục tiêu, kỹ năng, ràng buộc;
- `facts`: fact + nguồn + thời điểm đúng + confidence + expiry + trạng thái confirmed/disputed;
- `decisions`: options, recommendation, decision, rationale, outcome, regret;
- `skills`: skill graph, rubric, evidence, mastery history;
- `artifacts`: file, note, code diff, link, transcript với checksum/provenance;
- `policies`: quyền tool và yêu cầu approval;
- `memory_views`: các bản tóm tắt có thể tái tạo từ event gốc.

Phân tách memory theo ba loại là hữu ích: **semantic** (facts), **episodic** (trải nghiệm), **procedural** (cách làm/instruction). LangGraph cũng mô tả đúng ba nhóm này và lưu long-term memory dưới dạng JSON document ([official memory docs](https://docs.langchain.com/oss/python/concepts/memory)).

Retrieval nên đi theo tầng:

1. exact/structured query và full-text trước;
2. vector search khi exact không đủ;
3. graph traversal chỉ cho câu hỏi quan hệ/thời gian phức tạp;
4. luôn trả provenance về event/artifact gốc.

Ở quy mô cá nhân, SQLite + full-text có thể đủ trong giai đoạn đầu. Khi cần semantic retrieval offline, Qdrant có local/embedded mode không cần network ([official docs](https://qdrant.tech/documentation/)). Khi cần nhiều người/thiết bị, chuyển canonical store sang Postgres + pgvector; pgvector lưu vector cùng dữ liệu và hỗ trợ exact/approximate nearest-neighbor ([source repo](https://github.com/pgvector/pgvector)).

**Knowledge graph là tùy chọn, không phải nền móng MVP.** Graphiti đáng thử cho memory biến đổi theo thời gian vì giữ validity windows, provenance, incremental update và hybrid retrieval ([source repo](https://github.com/getzep/graphiti)). Nhưng đây vẫn là lớp emerging và đòi hỏi vận hành graph database. Microsoft GraphRAG hiện tự ghi là research project, largely maintenance mode và indexing có thể tốn kém; không chọn làm dependency lõi ([source repo](https://github.com/microsoft/graphrag)).

### B. Orchestration: workflow-first, agent-second

LangGraph là lựa chọn mặc định hợp lý cho runtime điều phối vì tập trung vào durable execution, persistence, streaming và human-in-the-loop, đồng thời không buộc phải dùng toàn bộ LangChain ([official docs](https://langchain-ai.github.io/langgraph/index.html)).

Quy tắc thiết kế:

- bước có business rule, permission, chi tiền, ghi dữ liệu: deterministic node;
- bước cần tổng hợp, sinh ý tưởng, critique, chọn tool: agentic node;
- output giữa các node dùng schema rõ ràng;
- giới hạn số vòng, token, thời gian và chi phí;
- checkpoint trước mọi side effect.

Khi workflow chạy nhiều giờ/ngày, có retry phức tạp hoặc cần survive crash, cân nhắc Temporal. Temporal là nền tảng open-source durable execution, ghi lại trạng thái để workflow tiếp tục sau crash/network failure ([official docs](https://docs.temporal.io/)). MVP cá nhân chưa cần Temporal; scheduler + LangGraph checkpoint đủ nhẹ hơn.

Không chọn AutoGen cho dự án mới: repository chính thức hiện ghi framework ở maintenance mode và khuyên dự án mới dùng Microsoft Agent Framework ([source repo](https://github.com/microsoft/autogen)). CrewAI hợp prototype multi-agent nhanh và có flow/state/HITL ([official docs](https://docs.crewai.com/index)), nhưng abstraction “crew/role” không nên trở thành domain model của POA.

### C. Interoperability: MCP qua capability broker

MCP chuẩn hóa ba bề mặt chính — resources, prompts và tools — trên base protocol JSON-RPC ([official specification](https://modelcontextprotocol.io/specification/2024-11-05/basic)). Đây là seam tốt để thay connector mà không đổi assistant core.

Tuy nhiên MCP không tự làm hệ thống an toàn. Specification yêu cầu user consent/control và cảnh báo việc truy cập dữ liệu, thực thi code ([security principles](https://modelcontextprotocol.io/specification/2024-11-05/index)); authorization HTTP dựa trên OAuth 2.1 và cấm token passthrough, yêu cầu audience validation ([authorization spec](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)).

Vì vậy không cho model gọi MCP server trực tiếp. Dùng **capability broker** ở giữa để:

- allowlist server/tool/version;
- cấp quyền tối thiểu theo user/project;
- validate schema, URL/path và dữ liệu đầu ra;
- redact secret/PII khỏi prompt và trace;
- yêu cầu approval theo risk tier;
- log immutable audit trail;
- rate limit, timeout, budget và kill switch.

### D. Model gateway: tránh khóa nhà cung cấp

Model được chọn theo task (fast/cheap cho routing và extraction; mạnh cho decision/coding; local cho dữ liệu nhạy cảm). LiteLLM cung cấp unified interface cho hơn 100 provider, retry/fallback, spend tracking và proxy hooks cho auth/logging/rate limit ([official docs](https://docs.litellm.ai/)). Cần giữ prompt, tool schema và output schema độc lập với provider; không dựa vào behavior riêng của một model nếu không có adapter/test.

### E. Observability và eval: “tự nâng cấp” phải có bằng chứng

Chuẩn hóa trace bằng OpenTelemetry semantic conventions để không khóa observability vendor ([OpenTelemetry docs](https://opentelemetry.io/docs/concepts/semantic-conventions/)). Phoenix là lựa chọn OSS nhẹ cho tracing, datasets, experiments và evaluations, nhận trace qua OpenTelemetry/OpenInference ([official docs](https://arize.com/docs/phoenix)). Langfuse là lựa chọn thay thế khi cần prompt management/collaboration và có thể self-host ([official self-host docs](https://langfuse.com/self-hosting)).

Eval suite tối thiểu gồm:

- 30–50 decision cases thật của người dùng;
- 20 memory retrieval cases (đúng fact, đúng thời điểm, có provenance);
- 20 coaching cases với rubric;
- coding tasks nhỏ có test;
- tool-permission và prompt-injection tests;
- regression về latency, token, cost và approval rate.

Inspect AI của UK AI Security Institute là framework OSS cho eval coding, agentic behavior, tool use và sandboxing ([official docs](https://inspect.aisi.org.uk/)). Dùng nó cho safety/capability eval định kỳ; dùng Phoenix cho trace và experiment hằng ngày.

## Tự hiểu người dùng đúng cách

Profile không phải một đoạn “AI nghĩ anh là người thế nào”. Nó là tập claim có cấu trúc:

```text
claim: "Ưu tiên tốc độ hơn độ hoàn hảo cho prototype"
scope: "side project"
source: decision #D-104, feedback #F-22
confidence: 0.78
valid_from: 2026-08-01
expires/review_at: 2026-11-01
status: inferred | confirmed | disputed
```

Các nguyên tắc bắt buộc:

- phân biệt người dùng **nói**, assistant **suy ra** và hành vi **chứng minh**;
- preference có scope, confidence và thời hạn xem lại;
- fact nhạy cảm chỉ lưu khi có lý do rõ ràng và dễ xóa;
- có màn hình “What I know about you” để sửa/xóa/export;
- không dùng một output do AI tạo làm bằng chứng độc lập cho chính nó;
- memory summary luôn tái tạo được từ event gốc.

## Tự nâng cấp có kiểm soát

Các paper Reflexion và Self-Refine cho thấy feedback/reflection trong memory hoặc vòng critique–refine có thể cải thiện kết quả mà không cần cập nhật model weights ([Reflexion](https://arxiv.org/abs/2303.11366), [Self-Refine](https://arxiv.org/abs/2303.17651)). Đây là cơ sở cho cải tiến **ở test time**, không phải bằng chứng rằng agent nên tự sửa production vô hạn.

Chia thành ba vòng:

1. **Learning loop — tự động:** cập nhật episodic memory, confidence, preference candidate và outcome.
2. **Optimization loop — eval-gated:** đề xuất prompt/routing/retrieval policy mới, chạy offline eval, chỉ canary khi vượt baseline và không làm safety/cost xấu đi.
3. **Evolution loop — human-gated:** thay code/schema/tool/permission bằng branch + tests + security scan + review + rollback plan.

Những việc agent **không được tự làm**:

- thay constitution/policy hoặc tăng quyền của chính nó;
- xóa raw event/audit để “làm sạch memory”;
- tự merge/deploy code production;
- tự chi tiền, ký cam kết, gửi nội dung nhạy cảm;
- dùng secret hoặc dữ liệu private để train ngoài phạm vi đã đồng ý;
- tự coi self-critique là ground truth.

Áp dụng vòng quản trị `Govern → Map → Measure → Manage` theo NIST AI RMF; NIST cũng có Generative AI Profile dành riêng cho rủi ro GenAI ([NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework), [NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)).

## Ma trận trưởng thành công nghệ

| Hạng mục | Trưởng thành / nên dùng | Emerging / thử có điều kiện | Tránh làm lõi |
|---|---|---|---|
| Canonical data | SQLite; Postgres khi scale | CRDT sync đa thiết bị | chỉ lưu vector hoặc chat transcript |
| Retrieval | SQL + full-text + vector có eval | temporal knowledge graph / Graphiti | graph hóa mọi thứ từ ngày đầu |
| Agent runtime | LangGraph; deterministic workflows | Microsoft Agent Framework, CrewAI flows | AutoGen cho dự án mới (maintenance) |
| Long-running jobs | scheduler/checkpoint; Temporal khi thật sự cần | always-on proactive agent | vòng agent vô hạn |
| Interop | MCP + adapter schema/version | MCP ecosystem còn thay đổi nhanh | model gọi tool không qua policy broker |
| Coding | Aider/OpenHands/Codex qua adapter + sandbox | multi-agent coding team | tự viết coding agent mới |
| Observability | OpenTelemetry + Phoenix/Langfuse | GenAI semantic conventions còn tiến hóa | log prompt thô chứa secret/PII |
| Evals | unit/integration/golden set + Inspect AI | LLM-as-judge với calibration | “cảm thấy tốt hơn” hoặc chỉ benchmark công khai |
| Self-improvement | feedback, reflection, eval-gated config | autonomous memory/ontology evolution | tự sửa code/quyền/deploy không approval |

## Build vs adopt

### Phải tự xây — đây là moat cá nhân

- domain model: goals, decisions, projects, skills, constraints, energy;
- Decision Card và logic đo outcome/regret;
- skill graph, rubric và coaching scheduler;
- memory policy, confidence/provenance/expiry;
- capability/risk policy và approval UX;
- personal eval dataset;
- Today Cockpit và feedback loop.

### Nên adopt

- LangGraph cho orchestration;
- MCP SDK/connectors, nhưng bọc qua capability broker;
- SQLite → Postgres/pgvector khi cần;
- Qdrant embedded nếu retrieval evaluation chứng minh cần;
- LiteLLM hoặc provider adapters cho model routing;
- OpenTelemetry + Phoenix; Inspect AI cho eval;
- Aider/OpenHands/Codex cho coding;
- Temporal chỉ khi workflow always-on thực sự cần độ bền cao.

## Lộ trình đề xuất

### Giai đoạn 0 — 1 tuần: đo baseline trước khi build

- thu 20 quyết định gần đây, 10 task code, 10 mục tiêu học;
- đo thời gian quyết định, regret, task completion, lỗi lặp lại;
- viết constitution, risk tiers và data-retention policy;
- xác định 5 workflow có ROI cao nhất.

**Gate:** nếu không có baseline và outcome, chưa xây “self-improving”.

### Giai đoạn 1 — 3–4 tuần: Personal OS tối thiểu

- local-first event store + profile có provenance;
- Today Cockpit và Decision Card;
- goals/projects/decisions/skills schema;
- model gateway và trace;
- explicit feedback + weekly review.

**Thành công:** median time-to-decision < 2 phút cho quyết định loại nhỏ; >60% recommendation được chọn hoặc giúp thu hẹp rõ ràng; 100% claim cá nhân có source/status.

### Giai đoạn 2 — 4–6 tuần: Coding + Coaching

- coding-agent adapter, sandbox/worktree, tests và diff review;
- skill graph + daily micro-practice + rubric;
- retrieval exact/full-text, thêm vector chỉ khi eval cần;
- eval suite và release gate.

**Thành công:** giảm thời gian hoàn thành task code lặp lại 25–40%; xu hướng 4 tuần tăng ở 1–2 kỹ năng mục tiêu; không có unapproved external side effect.

### Giai đoạn 3 — 6–10 tuần: Proactive Assistant

- calendar/task/note/email read connectors;
- morning brief, pre-meeting brief, decision follow-up, weekly review;
- risk-tier approvals và notification budget;
- background memory consolidation.

**Thành công:** proactive suggestion acceptance >30%; <10% notification bị đánh dấu noise; mọi write action có audit.

### Giai đoạn 4 — sau khi có dữ liệu: controlled evolution

- candidate prompt/policy generation;
- offline replay trên personal eval set;
- canary + rollback;
- thử temporal graph nếu các câu hỏi thời gian/quan hệ còn thất bại;
- Temporal nếu workload dài ngày vượt khả năng checkpoint hiện tại.

## Risk tiers đề xuất

| Tier | Ví dụ | Default |
|---|---|---|
| R0 — read/reason | đọc dữ liệu được cấp, tóm tắt, tạo idea | tự động, có trace |
| R1 — local reversible | tạo draft, note, branch, test | tự động + thông báo |
| R2 — external reversible | gửi lịch, comment, email draft-to-send, cập nhật task | approval mỗi action/batch rõ ràng |
| R3 — high impact | tiền, pháp lý, production deploy, xóa dữ liệu, thay quyền | human approval bắt buộc; nhiều việc cấm tự động hoàn toàn |

## Năm quyết định kiến trúc nên chốt ngay

1. **Canonical memory là event + fact có provenance, không phải vector store.**
2. **Workflow-first trên LangGraph; không bắt đầu bằng swarm/multi-agent.**
3. **MCP chỉ là protocol; capability broker mới là security boundary.**
4. **Coding dùng agent có sẵn trong sandbox, POA giữ context và outcome.**
5. **Self-improvement = đề xuất + eval + approval + rollback, không phải tự sửa vô hạn.**

Nếu làm đúng năm điều này, hệ thống có thể thay model, framework, vector store và connector trong tương lai mà vẫn giữ tài sản quan trọng nhất: lịch sử quyết định, bằng chứng kỹ năng, dữ liệu cá nhân và cơ chế đo chất lượng.
