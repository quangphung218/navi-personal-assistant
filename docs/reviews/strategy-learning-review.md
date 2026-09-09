# Hội đồng chiến lược & khoa học học tập: phản biện Personal Operating Assistant

_Ngày review: 2026-08-27. Phạm vi: ý tưởng, kiến trúc và lộ trình trong `personal-operating-assistant.md`. Góc nhìn phối hợp: learning scientist, executive coach, AI-agent researcher, product strategist và futurist._

## Kết luận điều hành

Ý tưởng có một lõi tốt nhưng phạm vi hiện tại quá rộng. Nếu triển khai nguyên trạng, sản phẩm dễ trở thành **một dashboard đẹp bọc quanh general AI assistant**, cho cảm giác được thấu hiểu nhưng chưa chắc làm người dùng quyết định tốt hơn hoặc nâng năng lực thật.

Hội đồng khuyến nghị đổi cách định nghĩa sản phẩm:

> Không xây “AI biết mọi thứ về tôi”. Xây một **Outcome Learning System**: ghi lại mục tiêu, quyết định, hành động và kết quả; sau đó dùng chính bằng chứng đó để cải thiện một vòng lặp có giá trị cao.

Wedge đầu tiên nên là:

> **Decision-to-Action Loop dành cho builder/founder kỹ thuật:** biến một vấn đề thật thành quyết định có giả định kiểm chứng được, hành động trong 24–72 giờ, kết quả quan sát được và bài học tái sử dụng.

Daily Coach chỉ nên xuất hiện **bên trong công việc thật**, không phải một sản phẩm học tập song song. Khi người dùng làm task code, thiết kế hệ thống hoặc ra quyết định sản phẩm, coach chọn đúng một vi kỹ năng, giữ lại phần tư duy mà người dùng phải tự làm, chấm một artifact quan sát được, rồi kiểm tra lại trên task mới không có trợ giúp.

Các kết luận chính:

1. **Daily coaching có thể nâng trình, nhưng thiết kế hiện tại chưa đủ bằng chứng.** Hoàn thành bài tập, tốc độ giải và cảm giác hữu ích không chứng minh learning. Phải đo retention, transfer và khả năng tự làm khi AI rút hỗ trợ.
2. **Personalization rất dễ là ảo giác.** Một câu trả lời nhắc đúng sở thích nghe có vẻ cá nhân nhưng có thể không cải thiện lựa chọn. Mỗi can thiệp cá nhân hóa phải thắng một baseline không cá nhân hóa trong thử nghiệm.
3. **Self-improvement chỉ có nghĩa khi một metric ngoài chính AI tăng lên.** Self-critique, LLM judge và acceptance rate không đủ. Cần outcome thật, test ẩn, delayed test, counterfactual hoặc human audit.
4. **Memory, agent, scheduled actions và coding không còn là moat.** General assistants đang tích hợp chúng nhanh. ChatGPT đã có project memory, agent/deep research và long-horizon work; Gemini đã có scheduled actions và personalization. Cạnh tranh trực diện về độ thông minh tổng quát là không khả thi.
5. **Moat khả thi là outcome graph + intervention policy + personal eval set + trust.** Tức là dữ liệu nối “bối cảnh → khuyến nghị → hành động → kết quả”, biết can thiệp nào hiệu quả với người dùng nào và bằng chứng tích lũy theo thời gian.
6. **Không nên triển khai Today Cockpit trước khi Decision Loop tạo được tín hiệu thật.** Nếu chưa biết gợi ý nào giúp ích, morning brief chỉ tự động hóa sự tự tin giả.

## 1. Sản phẩm hiện tại đang hứa ba điều khác nhau

Blueprint gộp ba job-to-be-done:

| Job | Người dùng thật sự mua gì? | Outcome phải đo |
|---|---|---|
| Decision | Ít mơ hồ hơn, chốt đúng thời điểm | thời gian chốt, chất lượng quy trình, outcome/regret đã chuẩn hóa |
| Execution | Hoàn thành công việc tốt hơn/nhanh hơn | cycle time, defect/rework, acceptance, chi phí |
| Growth | Tăng năng lực độc lập | delayed retention, transfer sang task mới, giảm phụ thuộc vào hint |

Ba job này có thể hỗ trợ nhau, nhưng metric có thể xung đột:

- AI làm hộ code sẽ tăng execution hôm nay nhưng có thể giảm learning.
- Card càng dứt khoát càng giảm thời gian quyết định nhưng có thể tạo automation bias.
- Hỏi nhiều để coach tốt sẽ làm giảm tốc độ và tăng ma sát.
- Personalization mạnh có thể làm recommendation dễ được chấp nhận nhưng giảm khả năng phản biện người dùng.

Vì vậy không được dùng một north-star metric chung kiểu “engagement”, “daily active use” hoặc “recommendation acceptance”. Cần ba scorecard riêng và một policy xác định **lúc nào ưu tiên làm hộ, lúc nào ưu tiên dạy, lúc nào ưu tiên phản biện**.

### Quyết định chiến lược đề xuất

Trong 12 tuần đầu, chỉ tối ưu một lời hứa:

> “Mỗi tuần giúp anh đưa 3–5 quyết định sản phẩm/kỹ thuật quan trọng đến một hành động kiểm chứng được, và học từ kết quả thật.”

Execution và coaching chỉ phục vụ vòng này. Không bán cùng lúc “trợ lý toàn năng”, “coding agent” và “huấn luyện viên cả đời”.

## 2. Daily Coach có thật sự nâng trình không?

### Phán quyết

**Có tiềm năng, nhưng phiên bản mô tả hiện tại mới đo activity và assisted performance, chưa đo learning.**

Các cơ chế trong blueprint như bài tập nhỏ, rubric, retrieval sau 1/3/7/14 ngày và artifact thật là đúng hướng. Tuy nhiên ba lỗi đo lường lớn vẫn còn:

1. **Performance khi có AI ≠ năng lực khi không có AI.** Người dùng có thể hoàn thành task nhanh nhờ câu trả lời, nhưng không tái tạo được cách giải sau một tuần.
2. **Làm lại bài tương tự ≠ transfer.** Nhớ một pattern không chứng minh áp dụng được vào codebase hoặc bối cảnh mới.
3. **Tự đánh giá và LLM chấm ≠ ground truth.** Cả người học lẫn model đều dễ đánh giá cao câu trả lời trôi chảy.

Retrieval practice có nền tảng bằng chứng mạnh: meta-analysis trên 48.478 người học và 222 nghiên cứu cho thấy quizzing cải thiện thành tích ở mức trung bình, nhưng hiệu quả phụ thuộc vào feedback, số lần lặp và độ tương đồng giữa practice/test ([meta-analysis](https://pubmed.ncbi.nlm.nih.gov/33683913/)). Spacing cũng hỗ trợ retention trong bối cảnh lớp học ([review](https://pubmed.ncbi.nlm.nih.gov/40564553/)). Nhưng “deliberate practice” không giải thích toàn bộ khác biệt thành tích; một meta-analysis báo cáo tỷ lệ variance giải thích thấp trong education và professions ([Macnamara et al.](https://www.psychologicalscience.org/journals/psychological-science/0956797614535810/)). Không nên biến coaching thành lời hứa chắc chắn kiểu “mỗi ngày giỏi lên rõ rệt”.

### Coaching loop có bằng chứng nên dùng

```text
1. Chọn outcome công việc thật trong tuần
2. Tách một micro-skill có thể quan sát
3. Đo baseline không có trợ giúp
4. Giao một task vừa vượt ngưỡng hiện tại
5. Người dùng phải dự đoán/giải thích trước khi nhận hint
6. Hint theo thang, không đưa đáp án ngay
7. Tạo artifact thật và chấm bằng rubric + test khách quan
8. Yêu cầu tự giải thích lỗi và nguyên tắc rút ra
9. Sau 3–7 ngày: retrieval không nhìn đáp án
10. Sau 1–3 tuần: transfer task khác bề mặt, cùng nguyên lý
11. Giảm dần hỗ trợ nếu đạt; đổi chiến lược nếu không đạt
```

Thiết kế hint nên theo **guidance fading**: novice có worked example; sau đó bớt dần các bước; người đã thành thạo phải tự giải. Đây là cách tránh “expertise reversal” — một kiểu hỗ trợ có thể tốt cho novice nhưng cản người đã giỏi ([tổng quan](https://doi.org/10.1007/s11251-009-9102-0), [meta-analysis 2025](https://doi.org/10.1016/j.learninstruc.2025.102142)).

### Một ví dụ đủ cụ thể

Mục tiêu không nên là “học system design”. Chọn micro-skill: **xác định consistency boundary trong workflow thanh toán**.

- Baseline: đưa một scenario mới, yêu cầu người dùng vẽ boundary và giải thích không có AI.
- Work task: trong feature thật, AI chỉ hỏi “state nào phải thay đổi cùng nhau?” trước khi đưa hint.
- Artifact: ADR + schema/sequence diagram + test failure mode.
- Rubric: correctness, trade-off, failure handling, giải thích.
- Delayed retrieval: ba ngày sau mô tả lại nguyên lý bằng ví dụ khác.
- Transfer: một tuần sau áp dụng vào inventory reservation.
- Mastery chỉ tăng khi transfer pass, không tăng vì đã đọc lời giải hay task production chạy được.

### Metrics coaching bắt buộc

**Leading metrics** dùng để vận hành, không tuyên bố thành công:

- completion rate;
- thời gian vào bài;
- số hint và cấp hint;
- rubric score trong task có trợ giúp;
- tỷ lệ chủ động yêu cầu đáp án.

**Learning metrics** mới là bằng chứng:

- pre-test → delayed post-test delta;
- unaided accuracy;
- transfer score trên task chưa từng thấy;
- time-to-solution không có AI;
- mức hint giảm theo thời gian ở độ khó tương đương;
- calibration gap: confidence cá nhân so với kết quả thật;
- tỷ lệ lỗi cũ tái diễn trong công việc thật.

**Guardrails**:

- không tăng defect/rework;
- không tăng thời gian làm task quá mức đã cam kết;
- người dùng vẫn có thể giải thích code/decision do AI hỗ trợ;
- có “AI-off assessment” định kỳ.

### Thử nghiệm coaching tối thiểu

Dùng single-person crossover, vì sản phẩm ban đầu cho chính người dùng sáng lập:

- Tuần A: general assistant + workflow hiện tại.
- Tuần B: POA coach với hint ladder và delayed test.
- Chọn các micro-skill tương đương, đảo thứ tự để giảm learning/order effect.
- Chấm bằng hidden tests hoặc rubric được định nghĩa trước.
- Sau 2–3 tuần, cho transfer task không báo trước.

Không kết luận từ một tuần. Chỉ mở rộng nếu ít nhất 2 micro-skill cho thấy transfer tốt hơn baseline mà cycle time không xấu đi quá ngưỡng cho phép.

## 3. Hệ thống hiểu người dùng thật hay chỉ diễn personalization?

### Phán quyết

Schema claim + provenance + confidence + expiry là một điểm mạnh thật. Nhưng nó mới giải quyết **memory correctness**, chưa chứng minh **personalization utility**.

Phải phân biệt bốn lớp:

| Lớp | Ví dụ | Cách xác nhận |
|---|---|---|
| Fact | “Deadline là 30/9” | nguồn trực tiếp / user confirm |
| Preference | “Thích card dưới 150 từ” | lựa chọn lặp lại theo scope |
| Strategy | “Khi prototype nên ưu tiên validation” | outcome qua nhiều case |
| Identity inference | “Anh là người thích rủi ro” | rất nguy hiểm; không dùng mặc định |

General assistants cũng đã tăng tốc mạnh về memory. ChatGPT Projects có project memory và có thể dùng chat/files trong project; hệ thống memory mới của ChatGPT nhắm tới freshness, continuity và relevance ở quy mô nhiều năm ([Projects](https://help.openai.com/en/articles/10169521-projects-in-chatgpt), [memory update](https://openai.com/index/chatgpt-memory-dreaming/)). Gemini cũng công khai hướng đến memory/personalization từ hội thoại. Vì thế “nhớ anh” không còn đủ khác biệt.

### Test chống personalization theater

Mỗi feature cá nhân hóa phải trả lời được: **Nếu bỏ profile cá nhân đi, kết quả có kém hơn không?**

Chạy ba biến thể ẩn:

- A: không có profile, chỉ context hiện tại;
- B: profile chính xác;
- C: profile plausible nhưng sai hoặc của tuần cũ.

Đo:

- lựa chọn cuối có phù hợp goal/constraint hơn không;
- outcome sau 7/30 ngày;
- số lần người dùng phải sửa context;
- confidence calibration;
- recommendation có thay đổi vì dữ liệu cá nhân liên quan hay chỉ chèn câu “vì anh thích…”;
- harm khi profile stale/sai.

Nếu B không thắng A, personalization chưa có giá trị. Nếu C không kém B, hệ thống chỉ đang **trang trí câu trả lời bằng memory**. Nếu personalization chỉ tăng acceptance nhưng không tăng outcome, có thể nó đang chiều lòng thay vì tham mưu.

### Memory policy nên sửa

- Chỉ facts đã xác nhận mới được dùng như constraint cứng.
- Preference suy luận phải có scope và decay; tối thiểu hai evidence độc lập trước khi ảnh hưởng recommendation.
- Strategy chỉ cập nhật từ outcome, không từ lời nói hay acceptance đơn lẻ.
- Identity inference không được dùng để ra quyết định nếu chưa được người dùng xác nhận rõ.
- Recommendation phải hiển thị “memory nào đã thực sự thay đổi kết luận”.
- Mỗi claim cần `counterevidence`, không chỉ `supporting evidence`.
- Cho phép chạy “forget test”: xóa claim rồi replay để xác nhận hệ thống thực sự ngừng dùng nó.

## 4. Self-improvement có đo được không?

### Phán quyết

Thiết kế `đề xuất → offline eval → canary → approval → rollback` là đúng. Nhưng blueprint chưa định nghĩa đủ rõ **đơn vị cải thiện**, **đối chứng** và **ground truth**.

Phải tách ba thứ thường bị gọi chung là self-improvement:

1. **User-model learning:** cập nhật facts/preferences/strategy về người dùng.
2. **Policy optimization:** thay prompt, retrieval, routing hoặc notification policy.
3. **Capability evolution:** thay code, schema, tool và model.

Mỗi thay đổi phải có changelog:

```text
hypothesis
target metric
baseline version
candidate version
evaluation dataset/version
result + confidence interval hoặc số case thắng/thua
guardrail result
approved_by
rollout scope
rollback trigger
```

### Không được dùng làm bằng chứng chính

- AI tự nói câu trả lời mới tốt hơn;
- một LLM judge chưa hiệu chỉnh;
- user click “accept”;
- feedback “hay” ngay sau câu trả lời;
- tăng số cuộc hội thoại;
- giảm token/latency nếu outcome không đổi;
- chính dữ liệu do candidate sinh ra để chấm candidate.

### Ground truth theo module

| Module | Ground truth ưu tiên |
|---|---|
| Decision | outcome, regret đã chuẩn hóa, prediction calibration, process quality checklist |
| Coding | hidden tests, code review, production defect/rework |
| Coaching | delayed unaided test, transfer task, rubric human-calibrated |
| Memory | fact accuracy theo source, temporal validity, user-confirmed correction |
| Today | task completion của priority cao, suggestion acceptance nhưng có holdout |

### Cách thử nghiệm thực dụng

- Shadow mode: candidate tạo output nhưng không hiển thị; so với phiên bản hiện tại.
- Interleaving/A-B trong những case rủi ro thấp.
- N-of-1 crossover cho một người dùng; cohort experiment khi có nhiều người.
- Holdout memory: giữ lại một phần lịch sử để đánh giá retrieval và tránh leakage.
- Freeze một personal eval set theo version; bổ sung case mới nhưng không sửa điểm cũ để “làm đẹp” kết quả.
- Dùng human review theo mẫu cho các case ảnh hưởng lớn.

“Tự cải thiện” chỉ được công bố khi candidate tăng target outcome trên case mới, không vi phạm guardrail và hiệu quả còn giữ sau một khoảng trì hoãn phù hợp.

## 5. Moat thật sự là gì?

### Những thứ không phải moat bền

- chat UI;
- Today dashboard;
- vector memory;
- LangGraph/MCP/LiteLLM;
- multi-agent debate;
- Decision Card template;
- gọi Codex/OpenHands;
- prompt tạo coach;
- model routing.

Tất cả đều có thể bị sao chép hoặc bị nền tảng hấp thụ. ChatGPT hiện đã kết hợp memory, projects, deep research, agent và long-horizon work ([deep research](https://openai.com/index/introducing-deep-research/), [ChatGPT Work](https://openai.com/index/chatgpt-for-your-most-ambitious-work/)); Gemini có scheduled actions cho brief và công việc lặp lại ([Google](https://blog.google/products-and-platforms/products/gemini/scheduled-actions-gemini-app/)). Khoảng cách capability sẽ tiếp tục thu hẹp.

### Moat khả thi theo thứ tự

1. **Outcome graph độc quyền của người dùng**

   Không chỉ chat history mà là dữ liệu có cấu trúc: bối cảnh → dự đoán → recommendation → lựa chọn → hành động → outcome → regret → lesson. General assistants có thể nhớ hội thoại, nhưng chưa mặc định đo vòng causal này theo domain.

2. **Intervention policy học được từ bằng chứng**

   Biết khi nào nên hỏi, phản biện, đưa hint, im lặng, hay đề xuất thí nghiệm; policy này được đánh giá bằng outcome chứ không phải độ trôi chảy.

3. **Personal eval set tích lũy lâu dài**

   Bộ test đại diện đúng các quyết định, codebase, lỗi lặp lại và chuẩn chất lượng của người dùng. Đây là switching cost tốt nếu portable và thuộc về người dùng.

4. **Trust architecture**

   Provenance, uncertainty, audit, approval, export/erase và khả năng giải thích memory nào ảnh hưởng quyết định. Trust không sexy nhưng khó làm tốt xuyên suốt.

5. **Workflow/domain specialization**

   Tập trung founder/builder kỹ thuật: product bet, architecture choice, experiment design, coding outcome và skill transfer. Chiều sâu của loop tạo khác biệt hơn chiều rộng connector.

6. **Benchmark/learning corpus được đồng ý sử dụng**

   Khi có nhiều người dùng, dữ liệu ẩn danh về loại can thiệp nào cải thiện decision quality hoặc learning transfer có thể tạo network learning. Chỉ làm với consent, privacy và governance rõ ràng.

Moat không nên dựa vào lock-in dữ liệu. Dữ liệu phải export được. Lợi thế phải đến từ **chất lượng mô hình hóa và kết quả**, không phải giữ dữ liệu làm con tin.

## 6. Cạnh tranh với general AI assistants

### Không nên cạnh tranh ở đâu

- chất lượng model tổng quát;
- breadth của web/app connectors;
- coding capability thô;
- tốc độ research;
- voice/multimodal cơ bản;
- memory hội thoại chung;
- long-horizon execution chung.

Các nền tảng sẽ thắng nhờ model, distribution, hạ tầng và ecosystem.

### Nên đứng ở đâu trong stack

POA nên là **personal outcomes layer** chạy trên nhiều model/agent:

```text
General models/agents: suy luận, research, coding, thao tác
                         ↓
POA: mục tiêu, decision protocol, outcome graph, coaching policy,
     eval, permissions, learning history
                         ↓
Nguồn sự thật cá nhân: artifacts, task, code, calendar, feedback
```

Nói cách khác: không thay ChatGPT/Codex/Claude/Gemini. POA **thuê** chúng làm engines, so sánh chúng trên personal evals và giữ lớp hiểu outcome bên ngoài provider.

### Định vị ngắn gọn

> “General AI giúp anh làm một task. POA giúp anh chọn đúng task, đo kết quả, và đảm bảo sau nhiều tuần anh tự làm tốt hơn.”

Đây là định vị có thể tồn tại khi model tiếp tục mạnh lên.

## 7. Ý tưởng tương lai nhưng thực dụng

### Nên làm sớm

**Counterfactual Decision Review**  
Khi review, không chỉ hỏi outcome tốt/xấu mà hỏi: “Nếu chọn phương án B thì bằng chứng nào cho thấy khác?” Hệ thống phân biệt outcome do quyết định với outcome do may mắn. Không tuyên bố causal nếu không có bằng chứng.

**Adaptive Friction**  
AI chủ động tạo ma sát ở nơi cần học/kiểm soát: yêu cầu dự đoán trước hint, viết rationale trước approval, hoặc tự giải thích diff. Ở việc lặp lại ít giá trị học, AI tự động hóa mạnh. Đây là lợi thế sản phẩm quan trọng hơn “AI luôn nhanh”.

**Personal Eval Vault**  
Mỗi lỗi, quyết định và review tốt tạo thành một test ẩn cho phiên bản tương lai. Đây vừa là cơ chế chất lượng vừa là tài sản chống lỗi thời.

**Recommendation Receipt**  
Mỗi khuyến nghị có dữ liệu dùng, dữ liệu bỏ qua, uncertainty, điều kiện đảo chiều và ngày review. Sau này hệ thống tự đối chiếu dự đoán với thực tế.

**AI-off Day / Skill Escrow**  
Định kỳ yêu cầu người dùng tự hoàn thành một task đại diện. Nó phát hiện dependency sớm và chứng minh năng lực được giữ lại.

**Decision Half-life**  
Quyết định ghi rõ giả định nào sẽ hết hạn. Chỉ đánh thức lại khi giả định thay đổi hoặc đến review date, tránh notification noise.

### Nên thử sau khi có dữ liệu

**Personal Board of Directors** chỉ nên là nhiều lenses/rubrics, không nhất thiết nhiều agents. Multi-agent debate làm tăng token và vẻ thuyết phục nhưng không đảm bảo correctness. Chỉ dùng nếu replay eval chứng minh giảm lỗi đáng kể.

**Temporal knowledge graph** chỉ thêm khi SQL/event query thất bại ở một lớp câu hỏi có ROI rõ. Không biến ontology thành sản phẩm.

**Cross-user intervention learning** có thể mạnh, nhưng chỉ sau khi có consent và cohort đủ lớn. Học policy chung rồi fine-tune bằng dữ liệu cá nhân; không gom dữ liệu nhạy cảm mặc định.

**Outcome prediction market for self**: hệ thống yêu cầu người dùng và AI cùng dự đoán xác suất trước quyết định, sau đó chấm Brier score. Thực dụng cho calibration, nhưng chỉ phù hợp người dùng chịu được thao tác định lượng.

### Không nên làm

- AI tạo một “digital twin” khẳng định hiểu nhân cách người dùng;
- agent tự sửa production hoặc tự tăng quyền;
- daily stream vô hạn các ý tưởng;
- gamification/streak làm north-star;
- graph hóa toàn bộ cuộc đời;
- suy luận sức khỏe/tâm lý/identity nếu không có nhu cầu và consent chuyên biệt;
- “board of agents” tạo đồng thuận giả từ cùng một model.

## 8. Feature sequence đã chỉnh lại

### Phase 0 — 1–2 tuần: xác định wedge và baseline

- Chọn duy nhất 1 persona: founder/builder kỹ thuật tự vận hành sản phẩm.
- Thu 20–30 quyết định thật và outcome có thể quan sát.
- Chọn 2 micro-skill cần nâng, mỗi skill có rubric và transfer task.
- Đo workflow hiện tại khi dùng general assistant.
- Viết Personal Constitution, risk policy và data policy.

**Gate:** không có outcome và baseline thì dừng lời hứa “self-improving”.

### Phase 1 — 2–4 tuần: Decision Journal trước Decision AI

- Capture nhanh bối cảnh, options, prediction, confidence, reversibility, next experiment.
- Review outcome 7/30 ngày.
- Calibration dashboard đơn giản.
- Chưa tự khuyến nghị ở mọi case; ban đầu giúp cấu trúc và hỏi đúng câu.

**Gate:** người dùng ghi và review tối thiểu 3 quyết định/tuần; dữ liệu đủ sạch để rút bài học.

### Phase 2 — 3–5 tuần: Decision Intervention

- Recommendation Card với evidence, uncertainty và falsifier.
- A/B personalized vs context-only ở case rủi ro thấp.
- Recommendation receipt và replay eval.
- Đo time-to-decision + outcome + calibration, không chỉ acceptance.

**Gate:** cải thiện ít nhất một outcome chính so với workflow general assistant mà không tăng regret/automation bias.

### Phase 3 — 4–6 tuần: Embedded Coach

- Chỉ 1–2 micro-skill.
- Baseline, hint ladder, artifact rubric, delayed retrieval, transfer.
- AI-off assessment.
- Coach xuất hiện trong decision/code task thật.

**Gate:** transfer tốt hơn baseline ở ít nhất hai chu kỳ; mức hint giảm; không tăng defect.

### Phase 4 — 3–5 tuần: Execution adapters

- Kết nối Codex/OpenHands qua worktree/sandbox.
- Lưu rationale, tests, diff, rework và skill evidence.
- Adaptive friction: auto với việc thấp giá trị học; coaching gate với skill mục tiêu.

**Gate:** cycle time hoặc chất lượng tăng mà unaided skill không giảm.

### Phase 5 — sau khi loop đã có precision: Today & proactive

- Today chỉ dựa trên goals/decisions đã xác nhận.
- Notification budget và half-life.
- Calendar/task read-only trước; write action sau approval.
- Đo incremental value bằng holdout days.

**Gate:** proactive suggestion tạo hành động giá trị cao, noise thấp, và thắng ngày không có brief.

### Phase 6 — controlled optimization

- Candidate prompt/retrieval/policy.
- Shadow → offline replay → canary → rollout.
- Personal eval vault versioned.
- Không tự sửa permission, constitution hoặc production.

## 9. Scorecard sản phẩm đề xuất

### North-star cho wedge đầu tiên

**Verified Decision Loops per week**: số quyết định quan trọng đi trọn vòng `framed → chosen → acted → outcome reviewed`, đạt ngưỡng chất lượng process.

Không dùng số card được tạo. Một loop chỉ được tính khi có action và review.

### Outcome scorecard

| Trục | Metric |
|---|---|
| Decision | median time-to-commit theo loại quyết định; calibration/Brier score; normalized regret; experiment completion |
| Execution | cycle time; defect/rework; review acceptance; cost per accepted artifact |
| Growth | delayed unaided score; transfer score; hint dependency; repeated-error rate |
| Personalization | lift B so với A; stale-memory harm; correction rate; provenance coverage |
| Trust | override rate; audit completeness; unauthorized action = 0; deletion/forget correctness |
| Product | weekly verified loops; 4/8-week retention; time saved ròng sau mọi thao tác |

### Guardrail chống “nghiện trợ lý”

- user confidence không được tăng nhanh hơn accuracy;
- định kỳ đo performance không AI;
- recommendation disagreement được khuyến khích ở case uncertainty cao;
- không tối ưu acceptance rate độc lập;
- theo dõi tỷ lệ AI viết rationale mà người dùng không giải thích lại được.

## 10. Các giả định nguy hiểm nhất

| Giả định | Vì sao nguy hiểm | Cách kiểm chứng rẻ nhất |
|---|---|---|
| Người dùng sẽ ghi outcome đều | Không có outcome thì không có learning loop | concierge 4 tuần, đo tỷ lệ follow-up hoàn tất |
| Quyết định có thể đánh giá tốt/xấu sau 7/30 ngày | Nhiều outcome trễ, nhiễu và phản thực khó biết | chọn domain có feedback cycle ngắn trước |
| Một hệ thống có thể đồng thời làm nhanh và dạy sâu | Automation có thể lấy mất cognitive work | crossover AI-full vs adaptive-friction |
| Personalization tăng chất lượng | Có thể chỉ tăng cảm giác thân thuộc | A/B context-only vs profile đúng/sai |
| LLM judge đủ chấm coaching | Judge có bias và leakage | hiệu chỉnh với human rubric + hidden test |
| User muốn bị phản biện hằng ngày | Ma sát cao dễ bỏ dùng | đo opt-in, snooze, override theo thời điểm |
| Daily habit là cần thiết | Giá trị có thể theo event/decision, không theo ngày | so event-triggered với daily brief |
| General assistants không làm outcome loop | Nền tảng có thể nhanh chóng tích hợp | thiết kế provider-independent và domain depth |
| Local-first luôn tiện | Sync, backup, mobile UX có thể làm giảm adoption | prototype luồng recovery/multi-device sớm |
| Một persona “anh” đại diện thị trường | Founder-useful chưa chắc product-market fit | sau dogfood, phỏng vấn 10–15 builder tương tự |
| Nhiều memory càng tốt | Dữ liệu stale làm recommendation tệ hơn | retention/decay policy + stale-memory challenge |
| Recommendation outcome phản ánh năng lực AI | Luck và execution confound mạnh | prediction, falsifier, process score, repeated cases |

## 11. Nguyên tắc chống lỗi thời

1. **Outcome over model:** tài sản cốt lõi là outcome graph và eval, model chỉ là engine thay thế được.
2. **Protocol over persona:** lưu claim, evidence và policy; không đóng băng người dùng thành một “tính cách AI nghĩ ra”.
3. **Behavior over eloquence:** output đẹp không được tính là tốt nếu không cải thiện action/learning.
4. **Tests over self-reflection:** self-critique chỉ sinh hypothesis; external eval mới quyết định rollout.
5. **Transfer over task completion:** coaching thành công khi người dùng tự làm được việc mới.
6. **Adaptive friction over maximum automation:** tự động hóa việc ít giá trị học; giữ lại phần tư duy tạo năng lực.
7. **Portable data over lock-in:** event, claims, decisions, rubrics và evals xuất được dưới format mở.
8. **Deterministic safety boundary:** model không quyết định quyền, tiền, deletion hay deploy.
9. **Small surface, deep loop:** mở rộng connector sau khi một loop chứng minh giá trị.
10. **Provider competition:** định kỳ chạy cùng personal eval trên nhiều model; chọn theo quality/cost/privacy.

## 12. Quyết định cuối cùng của hội đồng

### Nên tiếp tục, với điều kiện đổi trọng tâm

Ý tưởng đáng xây nếu được thu hẹp từ “hệ điều hành cá nhân toàn năng” thành:

> **Một hệ thống giúp technical founder biến quyết định thành thí nghiệm, nối kết quả trở lại lời khuyên và biến công việc thật thành bằng chứng năng lực.**

### Chưa nên triển khai ngay

- full Today Cockpit;
- Idea Radar rộng;
- calendar/email write automation;
- knowledge graph;
- multi-agent board;
- autonomous self-improvement;
- coaching nhiều kỹ năng.

### Cần triển khai đầu tiên

1. Decision Journal có outcome và prediction.
2. Review loop 7/30 ngày.
3. Personal eval vault.
4. Recommendation Card có evidence/falsifier.
5. Một embedded coaching loop cho đúng một micro-skill.
6. A/B personalization và AI-off transfer test.

Nếu sau 8–12 tuần hệ thống không chứng minh được ít nhất một trong hai điều — **decision loop tốt hơn general assistant** hoặc **transfer skill cao hơn cách học hiện tại** — nên dừng mở rộng và xem lại wedge. Nếu chứng minh được, lúc đó memory, coding adapters và proactive brief sẽ là bộ khuếch đại mạnh thay vì các feature rời rạc.

## Tài liệu tham chiếu chính

- [Blueprint Personal Operating Assistant](../research/personal-operating-assistant.md)
- [Testing boosts classroom learning — meta-analysis](https://pubmed.ncbi.nlm.nih.gov/33683913/)
- [Distributed practice in classroom learning — meta-analysis](https://pubmed.ncbi.nlm.nih.gov/40564553/)
- [Deliberate practice and performance — meta-analysis](https://www.psychologicalscience.org/journals/psychological-science/0956797614535810/)
- [Expertise reversal and adaptive guidance](https://doi.org/10.1007/s11251-009-9102-0)
- [Future of personalized learning with AI](https://doi.org/10.1016/j.lindif.2025.102813)
- [ChatGPT Projects and project memory](https://help.openai.com/en/articles/10169521-projects-in-chatgpt)
- [ChatGPT memory evolution](https://openai.com/index/chatgpt-memory-dreaming/)
- [ChatGPT agent and deep research](https://openai.com/index/introducing-deep-research/)
- [Gemini scheduled actions](https://blog.google/products-and-platforms/products/gemini/scheduled-actions-gemini-app/)

