# Hội đồng dữ liệu & đánh giá: phản biện Decision Loop

_Ngày review: 2026-08-27_

_Góc nhìn phối hợp: experimentation scientist · causal inference/statistics expert · ML evaluation engineer · data architect · privacy engineer._

## Kết luận điều hành

Hội đồng đã cố gắng bác bỏ luận điểm trung tâm trước:

> “Nếu thu thập được chuỗi bối cảnh → dự báo → hành động → outcome → bài học, hệ thống sẽ tư vấn ngày càng tốt và outcome graph sẽ trở thành moat.”

**Kết quả: chưa bác bỏ được hướng đi, nhưng luận điểm hiện tại mạnh hơn bằng chứng cho phép.** Một outcome graph có thể trở thành tài sản dữ liệu tốt; nó chưa tự động là bằng chứng nhân quả, chưa tự động giúp personalization, và chưa phải moat nếu dữ liệu thưa, outcome mơ hồ, người dùng bỏ review hoặc schema chỉ lưu câu chuyện hậu nghiệm.

Phán quyết của hội đồng:

1. **Nên tiếp tục Decision Loop**, nhưng gọi đúng sản phẩm ban đầu là _decision journal có đo lường và eval_, chưa gọi là “AI tự học để ra quyết định tốt hơn”.
2. North-star `Completed Learning Loops` chỉ đo vòng lặp có được đóng hay không. Phải có thêm chỉ số **Evaluable Loops** và **Verified Improvement**; nếu không đội sẽ tối ưu việc điền form thay vì chất lượng quyết định.
3. Outcome phải được định nghĩa **trước hành động**, có cửa sổ quan sát, nguồn đo và trạng thái `pending / observed / censored / invalidated`; không ép mọi quyết định thành thắng/thua.
4. Chất lượng quy trình phải được chấm bằng thông tin có tại thời điểm quyết định và, khi có thể, **không cho người chấm thấy outcome**. Outcome tốt không cứu được quy trình tệ; outcome xấu không chứng minh lời khuyên tệ.
5. Trong MVP gần như không thể nói “POA gây ra outcome tốt hơn” cho từng quyết định. Chỉ được nói hệ thống giúp cấu trúc, cam kết, theo dõi hoặc cải thiện calibration; causal claim cần randomization/crossover và nhiều lần lặp tương đương.
6. `Personal Eval Vault` phải được xây ngay từ vertical slice. Nếu để sau, dữ liệu production sẽ nhiễm prompt hiện tại, rubric sẽ bị sửa theo lỗi đã thấy và mọi “cải thiện” sau đó dễ bị leakage.
7. Cross-user learning chỉ được làm bằng dữ liệu tối thiểu, consent riêng, cohort đủ lớn và privacy review. Không gom raw decision journal vào training pool mặc định.

Tóm lại:

> **Outcome graph chỉ đáng giá khi mỗi cạnh có provenance, thời gian, định nghĩa trước, mức quan sát được và giới hạn suy luận. Moat không phải số node; moat là tỷ lệ vòng lặp có thể đánh giá, chất lượng phản hồi và niềm tin rằng hệ thống không bịa ra causal story.**

---

## 1. Cố gắng bác bỏ data thesis

### 1.1 Outcome thường không quan sát được hoặc đến quá muộn

“Có nên đổi positioning?” có thể cần nhiều tháng mới biết; “có nên ship onboarding A?” có thể có signal trong một tuần. Nếu sản phẩm cho phép mọi loại quyết định nhưng review mặc định 7/30 ngày, nhiều record sẽ là proxy tùy tiện hoặc outcome chưa chín.

**Hệ quả:** MVP phải giới hạn vào quyết định có feedback cycle ngắn, action nằm trong quyền kiểm soát người dùng và signal quan sát được trong 1–4 tuần.

### 1.2 Outcome nhiễu bởi execution và ngoại cảnh

Một experiment tốt có thể thất bại vì triển khai kém, mùa vụ, acquisition mix hoặc một sự kiện thị trường. Một quyết định tệ có thể thắng nhờ may mắn. Record `recommendation → outcome` không đủ để gán công cho recommendation.

**Hệ quả:** lưu riêng `decision quality`, `execution fidelity`, `external shocks` và `observed outcome`; tuyệt đối không huấn luyện policy trực tiếp từ nhãn “thắng/thua” thô.

### 1.3 Không quan sát phản thực

Sau khi chọn A, hệ thống không biết B sẽ ra sao. Câu hỏi review “nếu chọn B thì sao?” chỉ tạo giả thuyết phản thực do người dùng hoặc AI kể lại, không phải dữ liệu thực nghiệm.

**Hệ quả:** counterfactual note được phép lưu như `hypothesis`, không được lưu như outcome. Chỉ A/B, rollout ngẫu nhiên, switchback hoặc repeated crossover mới hỗ trợ causal comparison đáng tin hơn.

### 1.4 Dữ liệu một người rất thưa và không đồng nhất

Một founder có thể có 3–10 quyết định/tuần nhưng thuộc nhiều domain, horizon và mức rủi ro khác nhau. Sau ba tháng có thể có 40–100 record nhưng chỉ vài case thực sự so sánh được. “Ba bằng chứng” đủ để nêu pattern thử nghiệm, không đủ để xác nhận quy luật cá nhân.

### 1.5 Người review tạo selection bias

Người dùng thường quay lại ghi outcome khi kết quả rất tốt, rất xấu hoặc khi reminder đúng lúc. Các quyết định bình thường dễ mất dữ liệu. Nếu chỉ học từ completed reviews, graph sẽ lệch.

**Hệ quả:** phải lưu denominator: mọi loop đã đến hạn, số được review, số censored và lý do mất follow-up. Không báo accuracy/calibration trên subset hoàn tất mà không báo missingness.

### 1.6 Outcome definition có thể bị sửa sau khi biết kết quả

Nếu người dùng hoặc AI thay success criterion sau experiment, sản phẩm tạo hindsight bias và làm đẹp lịch sử.

**Hệ quả:** prediction, metric, threshold, time window và decision timestamp phải versioned/locked khi commit. Sửa sau commit tạo revision mới, không overwrite bản cũ.

### 1.7 Personalization có thể chỉ là văn phong cá nhân

Model nhắc lại goal hoặc preference thường khiến câu trả lời “có vẻ hiểu mình”, nhưng không chứng minh lựa chọn tốt hơn. Acceptance có thể tăng vì hệ thống chiều người dùng.

### 1.8 Eval có thể bị nhiễm chính production data

Nếu lỗi production được thêm vào eval rồi prompt được sửa trực tiếp cho case đó, điểm tăng chỉ là memorization. Nếu một model vừa sinh decision card vừa làm judge, correlated bias rất cao.

### 1.9 Cross-user learning có thể phá trust trước khi tạo lợi ích

Decision journal chứa chiến lược sản phẩm, tài chính, weakness và dữ liệu nhạy cảm. Lợi ích thống kê ban đầu nhỏ trong khi rủi ro privacy, membership inference và rò rỉ nội dung cụ thể lớn.

### 1.10 General assistants có thể sao chép workflow

Schema Decision Card và reminder dễ sao chép. Outcome graph chỉ tạo defensibility nếu có dữ liệu chất lượng cao, continuity dài hạn, eval riêng và switching cost hợp pháp qua insight—không phải bằng lock-in hoặc giữ dữ liệu không cho export.

**Kết luận falsification:** data thesis sống sót như một **giả thuyết có điều kiện**, không phải kết luận. Điều kiện tối thiểu là review completion đủ cao, outcome có thể đánh giá, provenance đầy đủ, và policy mới chứng minh lift trên holdout/crossover.

---

## 2. Định nghĩa chính xác một Decision Loop

Không nên chỉ có một nhãn `completed`. Dùng state machine và ba cấp hoàn thành.

```text
captured
→ framed
→ committed
→ action_started
→ action_completed | action_abandoned
→ review_due
→ outcome_observed | outcome_pending | outcome_censored | outcome_invalidated
→ process_reviewed
→ lesson_recorded
```

### Cấp A — Committed Loop

Có đủ trước khi hành động:

- câu hỏi và scope quyết định;
- option đã chọn;
- hành động cụ thể;
- dự báo hoặc expected direction;
- metric/signal và threshold;
- cửa sổ quan sát;
- review date.

Đây là metric activation, **không phải learning**.

### Cấp B — Completed Loop

Có thêm:

- trạng thái action;
- review được thực hiện;
- outcome status;
- process review;
- lesson hoặc quyết định “chưa đủ bằng chứng để rút lesson”.

Một loop vẫn được tính completed nếu outcome bị censored, miễn trạng thái và lý do được ghi trung thực. Không nên ép người dùng bịa outcome để hoàn tất.

### Cấp C — Evaluable Loop

Completed Loop chỉ trở thành `evaluable` khi:

- metric/threshold/window được preregister trước action;
- outcome đến từ nguồn xác định;
- không có thay đổi định nghĩa outcome không được version;
- execution fidelity đủ để test giả định;
- outcome đã qua observation window;
- không có confound nghiêm trọng chưa ghi nhận;
- type của dự báo có scoring rule phù hợp.

Chỉ Evaluable Loop được dùng cho calibration, policy comparison hoặc claim “đã cải thiện”.

### Cấp D — Comparable Loop

Evaluable Loop chỉ `comparable` với loop khác khi cùng decision family, horizon, outcome semantics, risk/reversibility và mức hỗ trợ. Đây là tập con dùng cho N-of-1/crossover. Không pool mọi quyết định vào một con số chung.

---

## 3. Outcome: noisy, delayed và không phải lúc nào cũng nhị phân

### 3.1 Outcome contract phải được chốt trước

Mỗi commitment cần một `Outcome Contract`:

```text
construct: điều thực sự muốn học
metric: phép đo cụ thể
direction: tăng / giảm / nằm trong khoảng
threshold: mức nào đổi hành động tiếp theo
baseline: giá trị trước experiment nếu có
observation_start / observation_end
data_source
attribution_window
minimum_exposure
known_confounds
fallback_proxy
```

Ví dụ tốt:

> Construct: dấu hiệu người dùng tự quay lại. Metric: số trong 10 founder mở lại prototype trong 7 ngày mà không được nhắc. Threshold: ≥4/10. Source: product events. Minimum exposure: cả 10 người nhận đúng phiên bản.

Ví dụ kém:

> “Xem người dùng có thích không.”

### 3.2 Bốn loại outcome

1. **Binary:** đạt/không đạt một threshold đã chốt.
2. **Continuous:** cycle time, conversion, số lỗi; lưu raw value và baseline, không chỉ nhãn pass/fail.
3. **Ordinal:** regret 1–5, perceived usefulness; phải giữ wording/thang đo ổn định.
4. **Time-to-event:** thời gian đến lần quay lại, churn hoặc ship; cần trạng thái censored khi observation window kết thúc mà event chưa xảy ra.

### 3.3 Delayed outcome

- Không điền `failed` khi outcome chưa đến; dùng `pending`.
- Khi hết khả năng quan sát, dùng `censored` cùng lý do.
- Có thể ghi `leading_signal` sớm và `terminal_outcome` muộn; hai trường không được nhập làm một.
- Lesson sớm phải mang trạng thái `provisional`; chỉ promote khi terminal outcome hoặc thêm bằng chứng.

### 3.4 Missing outcome không được coi là neutral

Báo cáo luôn phải có:

```text
reviews_due
reviews_completed
outcomes_observed
pending
censored
invalidated
missing
```

Nếu missingness >30%, mọi calibration hoặc outcome trend phải gắn cảnh báo “có thể selection bias”; không dùng để rollout policy tự động.

---

## 4. Tách chất lượng quy trình khỏi may mắn

### 4.1 Process score không được dùng outcome làm đầu vào

Rubric 0–2 cho từng tiêu chí, chấm theo snapshot tại thời điểm commit:

| Tiêu chí | 0 | 1 | 2 |
|---|---|---|---|
| Frame | câu hỏi mơ hồ | scope tương đối | decision, owner, deadline rõ |
| Options | giả nhị phân/thiếu | ≥2 option | có cả do-nothing và option thực tế |
| Unknown | không nêu | nêu nhưng không ưu tiên | unknown lớn nhất có thể test |
| Evidence | không có | anecdote | source/baseline liên quan |
| Prediction | hậu nghiệm/mơ hồ | có hướng | xác suất/threshold + window |
| Experiment | không giảm bất định | có action | smallest valid test + stop rule |
| Risk | bỏ qua | nêu chung | downside, reversibility, guardrail |
| Commitment | không owner/date | thiếu một phần | owner, next action, review date |

Process score phục vụ coaching và QA. Không cộng nó với outcome thành một “decision quality score” duy nhất vì hai đại lượng trả lời hai câu hỏi khác nhau.

### 4.2 Blind review

Với eval quan trọng:

- reviewer thấy decision snapshot, evidence và recommendation;
- reviewer **không thấy outcome** khi chấm process;
- reviewer khác hoặc bước khác chấm outcome validity/execution;
- disagreement được lưu, không ép consensus bằng LLM.

### 4.3 Ma trận diễn giải

| Process | Outcome | Diễn giải được phép |
|---|---|---|
| Tốt | Tốt | process hợp lý, outcome thuận lợi; chưa chứng minh causal |
| Tốt | Xấu | process có thể vẫn đúng; xem forecast, execution, shock |
| Tệ | Tốt | may mắn là giả thuyết hợp lý; không reinforcement policy |
| Tệ | Xấu | ưu tiên sửa process; vẫn không gán toàn bộ lỗi cho AI |

---

## 5. Calibration và prediction

### 5.1 Chỉ yêu cầu xác suất khi người dùng hiểu câu hỏi

Không ép mọi decision card có `74% confidence`. Hai loại confidence cần tách:

- `forecast_probability`: xác suất một event xác định xảy ra trong window;
- `recommendation_confidence`: độ chắc của lời khuyên, thường không có ground truth trực tiếp.

Chỉ `forecast_probability` mới chấm bằng proper scoring rule. Recommendation confidence trong UI nên là thấp/vừa/cao kèm lý do thiếu dữ liệu.

### 5.2 Scoring

- Binary forecast: Brier score `(p - y)^2`.
- Multi-class mutually exclusive: multiclass Brier hoặc log loss nếu người dùng đủ hiểu; MVP ưu tiên Brier dễ giải thích.
- Continuous outcome: lưu prediction interval trước; đo coverage và absolute error, không biến tùy tiện thành binary.
- Calibration plot chỉ hiển thị khi có đủ forecast cùng nghĩa; không pool “ship đúng hạn” với “user quay lại”.

### 5.3 Sample-size realism cho calibration

Với một cá nhân:

- `<20` evaluable binary forecasts trong một family: chỉ hiển thị từng case và Brier mô tả, không kết luận “calibrated”.
- `20–49`: có thể hiển thị xu hướng rất sơ bộ; bucket calibration không ổn định.
- `50–99`: bắt đầu xem calibration theo 2–3 bin rộng với uncertainty rõ.
- `≥100`: mới hợp lý để thảo luận calibration curve cơ bản; subgroup vẫn có thể quá thưa.

Các mốc này là guardrail thực dụng, không phải ngưỡng chứng minh thống kê phổ quát.

---

## 6. Counterfactual và causal claims

### 6.1 Những gì không thể biết từ một loop

Từ một decision-outcome pair không thể biết chắc:

- option khác sẽ cho kết quả gì;
- recommendation gây ra outcome hay người dùng vốn đã chọn vậy;
- improvement đến từ card, reminder, accountability hay model;
- outcome tốt do quyết định hay do execution/market.

### 6.2 Evidence ladder cho causal inference

Từ yếu đến mạnh:

1. **Anecdote:** một case, self-report.
2. **Before/after:** cùng người nhưng khác thời gian; nhiễu bởi learning/trend.
3. **Matched repeated cases:** cùng decision family và độ khó gần nhau.
4. **Randomized micro-intervention:** random card variant, reminder, personalized context ở case rủi ro thấp.
5. **N-of-1 randomized crossover/switchback:** nhiều period A/B, thứ tự ngẫu nhiên, có washout khi cần.
6. **Multi-user randomized experiment:** đủ user và cluster/serial dependence được xử lý.

Chỉ cấp 4–6 mới dùng ngôn ngữ “gây ra/cải thiện do can thiệp” với phạm vi đúng. Cấp 1–3 dùng “liên quan”, “quan sát thấy”, “phù hợp với giả thuyết”.

### 6.3 N-of-1 thực dụng

N-of-1 phù hợp để thử:

- personalized context vs context-only;
- card ngắn vs card có phân tích;
- reminder timing;
- adaptive friction vs answer-first;

Không phù hợp khi decision không lặp, intervention có carryover dài, outcome mất nhiều tháng hoặc rủi ro cao.

Thiết kế tối thiểu:

```text
chọn một decision family lặp lại
→ định nghĩa metric trước
→ tạo ≥6–10 period/case mỗi condition nếu khả thi
→ randomize hoặc cân bằng AB/BA
→ giữ model/rubric ổn định trong block
→ ghi time trend, difficulty, carryover
→ báo từng case + effect estimate + uncertainty
```

Không dùng p-value máy móc trên 6 case. Với sample nhỏ, ưu tiên effect size, paired differences, randomization/permutation inference khi thiết kế cho phép và biểu đồ raw data.

---

## 7. Personalization experiment

### 7.1 Ba condition bắt buộc trong offline eval

- **A — Context-only:** chỉ dữ liệu của quyết định hiện tại.
- **B — Relevant personal context:** claim đúng, còn hiệu lực, có provenance.
- **C — Stale/wrong plausible context:** claim cũ hoặc không đúng scope.

Nếu B không thắng A, personalization chưa tạo utility. Nếu C không kém B, model có thể chỉ nhắc profile để trang trí. Nếu C gây recommendation đổi sai, cần stale-memory guardrail trước rollout.

### 7.2 Online experiment

Với một người dùng, randomize ở các decision case rủi ro thấp và có family lặp lại. Không randomize advice trong y tế, pháp lý, tài chính hệ trọng hoặc quyết định khó đảo ngược.

Primary metric phải chọn trước, ví dụ:

- số lần phải sửa context;
- process score blind-rated;
- time-to-commit;
- experiment completion;
- outcome metric trong family cụ thể.

Guardrails:

- regret;
- wrong-memory correction;
- confidence inflation;
- disagreement/override;
- privacy surprise.

Không dùng acceptance rate làm primary metric.

### 7.3 Sample-size realism

Với 10–20 beta users, không đủ sức chứng minh lift nhỏ về business outcome. Giai đoạn này chỉ nên:

- phát hiện harm lớn và usability failure;
- ước lượng review completion;
- thu distribution/effect range để thiết kế thử nghiệm sau;
- dùng paired/crossover cho metric gần như correction rate hoặc time-to-commit;
- báo interval và raw counts, không tuyên bố universal personalization effect.

Một power calculation phải dùng variance/effect tối thiểu thực tế từ pilot và được preregister trước paid beta lớn hơn. Không chọn sample size từ một con số đẹp chung cho mọi metric.

---

## 8. Eval leakage và giới hạn LLM judge

### 8.1 Các dạng leakage cần ngăn

- prompt được sửa sau khi dev xem toàn bộ holdout;
- cùng decision xuất hiện ở nhiều split dưới dạng paraphrase;
- outcome hoặc lesson hậu nghiệm lọt vào context dùng để replay recommendation;
- rubric chứa wording của answer tốt;
- model judge đã thấy candidate rationale hoặc version name;
- production case được thêm vào test rồi tiếp tục dùng như holdout;
- retrieval index chứa hidden eval answer;
- synthetic cases do chính model candidate sinh và tự chấm.

### 8.2 Split theo thời gian và decision family

Không random-row split đơn giản. Dùng:

- **Development set:** được xem, dùng để sửa prompt/code.
- **Regression set:** versioned, chạy thường xuyên; đội biết case.
- **Temporal holdout:** decision mới phát sinh sau ngày freeze.
- **Challenge set:** adversarial, stale memory, missing context, unsafe domain.
- **Human-audit sample:** lấy ngẫu nhiên từ production, blinded.

Các case cùng một decision hoặc cùng source artifact phải nằm cùng split.

### 8.3 LLM judge chỉ là tín hiệu phụ

LLM judge có thể hữu ích cho formatting, coverage và triage quy mô lớn; không phải ground truth độc lập cho recommendation quality. Rủi ro gồm position bias, verbosity/style bias, self-preference, correlated error giữa generator/judge và nhạy với prompt.

Quy tắc:

- deterministic validation trước;
- outcome/test/human rubric ưu tiên hơn;
- judge không thấy model/version identity;
- randomize order khi pairwise;
- dùng ít nhất một tập human-labeled để đo agreement;
- báo disagreement và confidence;
- không rollout chỉ vì judge score tăng;
- đổi judge model/prompt phải version và re-calibrate.

---

## 9. Personal Eval Vault

Vault là tài sản kiểm soát chất lượng riêng của người dùng, không phải kho chat dump.

### 9.1 Nội dung tối thiểu mỗi eval case

```text
case_id, owner_id, created_at, frozen_at
decision_family, risk_class, horizon
input_snapshot_id
allowed_context_ids
forbidden_context_ids
expected_invariants
human_rubric_version
reference_notes (optional, không coi là đáp án duy nhất)
outcome_contract_id
observed_outcome_id (ẩn khi replay)
provenance
split: dev | regression | holdout | challenge
sensitivity, consent_scope, retention_policy
```

### 9.2 Quy tắc vận hành

- Replay luôn dùng snapshot “as-of decision time”; không retrieval dữ liệu tương lai.
- Outcome/lesson bị mask khỏi generator và chỉ mở cho evaluator phù hợp.
- Case freeze là immutable về mặt đánh giá; correction tạo version mới.
- Không promote case vào holdout sau khi đội đã tối ưu trực tiếp trên nó.
- Mọi suite lưu dataset version, prompt/policy/model version, seed nếu có, result và reviewer.
- Personal vault mặc định không rời khỏi trust boundary của user.
- Export và delete theo manifest; derived traces/index bị rebuild hoặc purge.

---

## 10. Minimum viable data model

Không cần graph database. SQLite quan hệ + event history đủ cho MVP. “Outcome graph” là cách nhìn logic, có thể dựng từ khóa ngoại và relation table.

### 10.1 Canonical entities

#### `decisions`

```text
id, user_id, title, question, decision_family
domain, risk_class, reversibility
status, created_at, committed_at, closed_at
schema_version, current_revision_id
```

#### `decision_revisions`

Snapshot versioned của context, frame, constraints, options, evidence available và missing information. Mỗi revision có `valid_from`, `created_by`, `reason` và content hash.

#### `recommendations`

```text
id, decision_revision_id, run_id, policy_version
recommended_option_id, rationale, falsifier
recommendation_confidence_band
context_receipt_id, created_at
```

#### `commitments`

```text
id, decision_id, chosen_option_id
next_action, owner, due_at
review_at, stop_rule, committed_at
```

#### `forecasts`

```text
id, commitment_id, target_definition
forecast_type, probability/value/interval
unit, window_start, window_end
made_at, forecaster: user | assistant | joint
locked_at
```

#### `outcome_contracts`

Construct, metric, direction, threshold, baseline, minimum exposure, source, window, known confounds và fallback proxy.

#### `actions`

Trạng thái started/completed/abandoned, timestamps, execution fidelity, deviation reason và artifact references.

#### `outcome_observations`

```text
id, outcome_contract_id
status: observed | pending | censored | invalidated
raw_value, normalized_value, unit
observed_at, source_type, source_ref
collector, confidence, confound_notes
```

Không overwrite observation; correction tạo record mới và `supersedes_id`.

#### `process_reviews`

Rubric version, item scores, reviewer type, blind flag, notes, reviewed_at. Không lưu outcome trong payload dùng để chấm process.

#### `lessons`

```text
id, decision_id, text
status: provisional | supported | disputed | retired
scope, created_at, review_at
```

#### `claims` và `claim_evidence`

Fact/preference/strategy tách loại; provenance many-to-many; supporting và counterevidence; scope, temporal validity, status, sensitivity và consent.

#### `events`

```text
id, aggregate_type, aggregate_id
event_type, occurred_at, recorded_at
actor, correlation_id, causation_id
schema_version, payload_ref, sensitivity
```

#### `model_runs` / `eval_runs`

Metadata về provider/model/prompt/policy/schema version, context receipt, latency, token/cost, parse/repair/error, dataset version và result reference. Không log raw sensitive content mặc định.

#### `consents`, `deletion_manifests`, `exports`

Lưu purpose, data categories, scope, granted/revoked time, retention; theo dõi purge canonical/derived/backup và portability manifest.

### 10.2 Provenance rule

Mọi field ảnh hưởng recommendation phải truy được:

```text
recommendation
→ context receipt
→ exact source revision/artifact
→ timestamp + user/model origin
→ consent/scope + validity at that time
```

Nếu không truy được nguồn, field chỉ được dùng như untrusted note, không làm constraint.

### 10.3 Dữ liệu derived

Summaries, embeddings, calibration charts, pattern scores, LLM judge scores và dashboard aggregates phải tái tạo được. Không dùng derived summary làm canonical evidence khi source gốc còn tồn tại.

---

## 11. Instrumentation plan

### 11.1 Event taxonomy tối thiểu

```text
decision_capture_started
decision_capture_abandoned
decision_framed
clarification_requested / answered
recommendation_generated / failed / repaired
recommendation_viewed
context_receipt_opened
assumption_edited
option_selected / recommendation_overridden
commitment_created
action_started / completed / abandoned
review_due / reminder_sent / reminder_opened
review_started / completed
outcome_observed / pending / censored / invalidated
process_review_completed
lesson_recorded / revised
claim_proposed / confirmed / disputed / deleted
export_requested / completed
deletion_requested / completed
eval_run_started / completed
```

### 11.2 Common event envelope

```text
event_id, event_name, schema_version
occurred_at, recorded_at
anonymous_or_user_id, session_id
decision_id, correlation_id, causation_id
app_version, policy_version, model_version
experiment_id, assignment
source: user | system | model | connector
privacy_classification
```

### 11.3 Metric definitions phải nằm trong registry

Mỗi metric có owner, numerator, denominator, exclusions, time window, version và query test. Ví dụ:

```text
Review completion rate =
reviews completed within 72h of due date
/
all reviews that became due and were eligible
```

Không loại những case khó khỏi denominator sau khi nhìn kết quả. Bot/test traffic và user-deleted data có rule cố định.

### 11.4 Data quality monitors

- duplicate/missing event IDs;
- impossible state transitions;
- timestamp inversion;
- commitment thiếu outcome contract;
- observed outcome thiếu source/window;
- review không có due event;
- model run không có version/context receipt;
- future information xuất hiện trong replay snapshot;
- deletion manifest còn dangling derived records;
- metric drift do schema version.

---

## 12. Statistical claims: được phép và không được phép

### Được phép trong MVP

- “X% committed loops được review trong 72 giờ,” kèm numerator/denominator.
- “Median time-to-commit giảm từ A xuống B trong các case cùng family,” ghi rõ observational hay randomized.
- “Trong N evaluable forecasts loại X, Brier score là Y,” không gọi calibrated nếu N nhỏ.
- “Ở N paired cases, condition B có median difference D; uncertainty lớn.”
- “Pattern này xuất hiện trong 3/4 case đã quan sát,” gọi là hypothesis/provisional.
- “Phiên bản candidate pass toàn bộ deterministic checks và human reviewers ưu tiên ở X/Y blinded cases.”

### Chỉ được phép khi có thiết kế thực nghiệm phù hợp

- “Personalization giảm correction rate” nếu assignment ngẫu nhiên/crossover, metric preregistered và guardrail đạt.
- “Reminder làm tăng review completion” nếu randomized timing/holdout hoặc thiết kế quasi-experimental đủ mạnh.
- “POA cải thiện outcome” nếu có comparator, repeated comparable cases/users, attribution window và confounds được xử lý.

### Không được phép từ dữ liệu hiện tại

- “AI đưa ra quyết định đúng X%.”
- “Outcome tốt vì chọn theo khuyến nghị.”
- “Hệ thống hiểu anh hơn qua mỗi tuần.”
- “Ba evidence chứng minh đây là pattern ổn định.”
- “Người dùng giỏi hơn vì hoàn thành nhiều loop.”
- “Acceptance cao nghĩa là recommendation tốt.”
- “Judge score tăng nghĩa là model tốt hơn.”
- “Outcome graph tự động trở thành moat.”
- “Một experiment thành công có thể tổng quát sang decision family khác.”

---

## 13. Eval ladder và quality gates

### Level 0 — Schema & safety

- JSON/schema valid;
- required field coverage;
- no unsupported/high-risk advice;
- no external action;
- context only from allowed receipt;
- latency/cost budget.

**Gate:** 100% deterministic safety invariants; parse success ≥99% sau tối đa một repair; unauthorized action = 0.

### Level 1 — Retrieval & provenance

- source precision/recall trên golden cases;
- temporal validity;
- stale/wrong-memory challenge;
- citation/source traceability;
- forget/delete replay.

**Gate:** 100% recommendation-affecting claims có provenance; future leakage = 0; deleted claim không xuất hiện trong replay; stale memory không âm thầm làm hard constraint.

### Level 2 — Card/process quality

- unknown, options, falsifier, experiment, stop rule;
- blind human rubric;
- inter-rater agreement;
- correction burden và comprehension.

**Gate:** không regression so với baseline trên frozen set; zero critical omissions trong high-risk allowlist; human win/tie rate được báo cùng disagreement, không chỉ average judge score.

### Level 3 — Workflow behavior

- committed action rate;
- time-to-commit;
- experiment completion;
- review completion/missingness;
- net user time including data entry.

**Gate để paid beta:** ≥50% due reviews có response, missingness được phân tích; median time-to-commit <5 phút; ít nhất 30–50 real loops và ≥20 evaluable loops để hiểu failure modes, không phải để chứng minh causal lift.

### Level 4 — Predictive validity

- scoring rule theo forecast family;
- calibration trend;
- outcome contract validity;
- process/outcome separation.

**Gate:** không claim calibration trước minimum sample guardrail; forecast definitions ổn định; censored/missing được báo; process scoring blinded trên audit sample.

### Level 5 — Incremental value

- randomized/crossover personalization;
- card vs general assistant baseline;
- reminder/adaptive friction interventions;
- effect estimate + uncertainty + guardrails.

**Gate để nói “cải thiện”:** primary metric preregistered thắng baseline trên temporal holdout/online experiment, effect đủ có ý nghĩa sản phẩm, không làm regret/privacy/confidence inflation xấu đi. Một pilot 10–20 người thường chỉ đủ quyết định có tiếp tục thử nghiệm, không đủ quảng bá efficacy rộng.

### Level 6 — Controlled optimization

- candidate replay;
- shadow;
- canary;
- monitoring/rollback;
- audit decision.

**Gate:** candidate không được tự sửa rubric, split, permission hoặc success threshold; rollout có version và rollback trigger; performance giữ trên case mới sau freeze.

---

## 14. Scorecard tối thiểu

Không gộp thành một “AI score”. Báo năm nhóm cạnh nhau.

| Nhóm | Primary | Guardrails/diagnostics |
|---|---|---|
| Adoption | evaluable loops/user/4 tuần | attempts, committed, completed, missing, second-loop rate |
| Decision process | blind process rubric; time-to-commit | correction count, override, comprehension, net time |
| Outcome/prediction | family-specific raw outcome; Brier/error khi đủ N | execution fidelity, confounds, pending/censored |
| Personalization | paired lift vs context-only | stale-memory harm, wrong-context rate, privacy surprise |
| Trust/data | provenance coverage; deletion correctness | export success, audit completeness, unauthorized action, retention breach |

### North-star đề xuất sửa

**Evaluable Decision Loops per Activated User per 4 Weeks**, không phải Completed Loops đơn thuần.

Nhưng north-star này vẫn là chỉ số học được từ dữ liệu, không phải chứng minh người dùng có outcome tốt hơn. Do đó dashboard phải đặt cạnh:

- review completion và missingness;
- blind process quality;
- một outcome metric theo decision family;
- trust guardrails.

### Pilot thresholds thực dụng

Cho concierge + early beta, coi các ngưỡng là go/no-go sản phẩm, không phải statistical proof:

- ≥60% intake hợp lệ thành commitment;
- ≥50% reviews due nhận phản hồi trong 72 giờ;
- ≥70% completed loops có outcome status hợp lệ;
- ≥50% completed loops đạt `evaluable` trong allowlisted families;
- provenance coverage = 100% cho context ảnh hưởng recommendation;
- future/outcome leakage trong replay = 0;
- deletion/forget tests = 100%;
- critical privacy/safety incident = 0.

Nếu tỷ lệ evaluable <40% sau hai chu kỳ sản phẩm, moat thesis bị đe dọa trực tiếp: graph đang tích lũy narrative chứ không tích lũy evidence.

---

## 15. Privacy, portability và cross-user learning

### 15.1 Privacy architecture

- Raw journal là dữ liệu nhạy cảm mức cao theo mặc định.
- Data minimization theo purpose: model chỉ nhận context được chọn cho run.
- Content logging opt-in; production log mặc định metadata-only.
- Encryption at rest và in transit; secret tách khỏi DB/app logs.
- Retention riêng cho canonical, raw model output, trace, backup và eval.
- Consent tách biệt cho: model processing, analytics, personal eval, product improvement và cross-user learning.
- Revocation dừng sử dụng tương lai; deletion manifest purge canonical, index, cache, trace và backup theo retention contract.
- Không suy luận mental health, protected traits hoặc identity profile cho personalization mặc định.

### 15.2 Portability

Export phải đủ để rời sản phẩm:

- versioned JSONL cho entities/events;
- Markdown/CSV đọc được;
- artifact files;
- schema dictionary;
- manifest/checksum;
- provenance links và revision history;
- không bắt buộc export embeddings/derived cache vì có thể rebuild.

Quarterly restore test trên bản copy. Portability tốt làm giảm lock-in nhưng tăng trust; moat phải đến từ service quality, không đến từ giữ dữ liệu.

### 15.3 Cross-user learning theo nấc

**Nấc 0 — mặc định:** không dùng raw data người A cho người B; chỉ personal eval local.

**Nấc 1 — product telemetry:** aggregate tối thiểu về latency, parse error, funnel; không có journal content.

**Nấc 2 — consented de-identified eval:** người dùng chọn từng case hoặc category để đóng góp; human privacy review; loại identifiers, secrets và rare details; purpose/retention rõ.

**Nấc 3 — cohort policy learning:** chỉ khi cohort đủ lớn để tránh kể ngược về cá nhân; feature được coarse hóa; threshold chống rare cohort; access và audit chặt.

**Nấc 4 — formal privacy mechanisms:** nếu cần publish/share aggregate hoặc train rộng, đánh giá differential privacy/federated approaches. Không quảng cáo “federated = private” nếu updates vẫn có thể rò rỉ; cần threat model và secure aggregation phù hợp.

Không fine-tune trên raw decision text mặc định. Với giai đoạn đầu, lợi ích lớn hơn đến từ rubric/eval chung và pattern taxonomy, không phải pooling nội dung cá nhân.

---

## 16. Outcome graph có thật sự tạo moat không?

### Phán quyết

**Có thể, nhưng không phải trong 3–6 tháng đầu và không chỉ vì graph lớn lên.**

Outcome graph chỉ có giá trị defensible khi đạt đồng thời:

1. **Coverage:** phần đáng kể quyết định đi đến outcome status thật.
2. **Evaluability:** metric được preregister, provenance tốt, missing/censoring minh bạch.
3. **Longitudinal depth:** cùng người và cùng decision family có đủ lần lặp.
4. **Intervention history:** biết recommendation/policy nào được hiển thị, user chọn gì và mức tuân thủ.
5. **Eval leverage:** dữ liệu chuyển thành hidden tests, calibration và policy comparison.
6. **Trust/continuity:** user sẵn sàng duy trì vì kiểm soát, export/delete rõ và insight có ích.
7. **Actionable learning:** có bằng chứng một policy mới tốt hơn baseline; không chỉ có summary hay pattern text.

### Bốn outcome graph giả

- nhiều record nhưng phần lớn không review;
- outcome chỉ là self-report “tốt/xấu” hậu nghiệm;
- không lưu option/recommendation version và exposure;
- pool các decision không thể so sánh rồi sinh “insight” tự tin.

### Moat thực tế theo thời gian

- **0–6 tháng:** workflow + trust + eval discipline; chưa có data moat.
- **6–18 tháng:** personal eval vault và continuity có thể tạo switching value cho từng user.
- **18+ tháng:** nếu có consented, sufficiently large, well-typed cohorts, intervention policy learning có thể tạo network data advantage.

General assistants có thể sao chép UI và schema. Khó sao chép hơn là lịch sử intervention-outcome đã version, eval holdout theo thời gian và trust earned. Tuy nhiên nếu review completion hoặc evaluable rate thấp, toàn bộ moat thesis thất bại.

---

## 17. Kế hoạch triển khai dữ liệu 90 ngày

### Tuần 1–2 — Definition before collection

- chốt 3–5 decision families có feedback trong 1–4 tuần;
- viết metric registry và Outcome Contract template;
- định nghĩa state machine, completed/evaluable/comparable;
- tạo process rubric và chấm thử blinded trên 10 case;
- chốt data classification, retention, consent và export schema;
- freeze Personal Eval Vault v0.

### Tuần 3–6 — Instrumented vertical slice

- triển khai canonical schema + revision/event model;
- context receipt và as-of snapshot;
- event instrumentation + data quality checks;
- due/pending/censored flow;
- deterministic eval + regression/challenge sets;
- export/delete/restore/forget tests.

### Tuần 7–10 — Concierge/pilot evidence

- thu 30–50 real loops, mục tiêu ≥20 evaluable;
- audit 100% outcome contracts giai đoạn đầu;
- blind process review trên sample;
- đo missingness và lý do drop-off;
- không chạy personalization online nếu family chưa đủ repeated cases;
- sửa UX để tăng evaluability, không chỉ completion.

### Tuần 11–13 — First controlled tests

- chọn một micro-intervention gần: card length, clarification hoặc reminder;
- preregister primary metric/guardrails;
- randomized/crossover ở case rủi ro thấp;
- chạy temporal holdout cho candidate policy;
- công bố nội bộ raw counts, effect range, uncertainty và failure cases.

### Gate ngày 90

Tiếp tục đầu tư vào outcome graph nếu:

- review completion ≥50%;
- ≥50% completed loops evaluable trong allowlisted families;
- người dùng tạo loop lặp lại;
- blind process quality hoặc friction metric tốt hơn baseline;
- Personal Eval Vault phát hiện regression thật ít nhất một lần;
- không có critical privacy/provenance failure.

Nếu không đạt, thu hẹp decision family hoặc pivot sang accountability/journal workflow. Không tiếp tục quảng bá “AI tự hiểu và tự nâng cấp”.

---

## 18. Quyết định cuối cùng của hội đồng

### Nên làm ngay

1. Đổi north-star từ `Completed Learning Loops` sang `Evaluable Decision Loops`, kèm scorecard cân bằng.
2. Định nghĩa Outcome Contract và state machine trước khi schema/app được xây.
3. Tách process review, execution fidelity, outcome và lesson thành bốn record riêng.
4. Freeze Personal Eval Vault v0 và quy tắc chống future/outcome leakage.
5. Chỉ thu decision families có feedback cycle ngắn trong MVP.
6. Xây provenance, export/delete và consent ngay trong vertical slice.

### Chưa được làm

- tuyên bố causal từ before/after hoặc một vài case;
- gọi ba evidence là “đã hiểu người dùng”;
- dùng acceptance, regret hoặc LLM judge làm ground truth duy nhất;
- pool mọi outcome thành một decision score;
- train cross-user trên raw journal mặc định;
- tự tối ưu prompt/rubric bằng chính holdout đã nhìn thấy;
- gọi outcome graph là moat trước khi chứng minh coverage và evaluability.

### Phán quyết một câu

> **Hãy xây một hệ thống biết chính xác mình đã quan sát được gì và chưa thể kết luận gì; sự khiêm tốn thống kê đó mới là nền móng để Decision Loop trở thành sản phẩm đáng tin và, về lâu dài, thành lợi thế dữ liệu.**

