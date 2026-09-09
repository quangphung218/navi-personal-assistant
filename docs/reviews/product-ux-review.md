# Hội đồng phản biện Product & UX: Personal Operating Assistant

_Ngày review: 2026-08-27_

_Góc nhìn: Chief Product Officer, UX Researcher, Behavioral Decision Scientist và Skeptical Founder._

## Kết luận điều hành

**Không nên triển khai Personal Operating Assistant theo phạm vi hiện tại.** Tài liệu đang mô tả cùng lúc một chatbot cá nhân, hệ thống quản lý công việc, công cụ ra quyết định, coach, coding agent, knowledge base, lớp tích hợp và nền tảng tự cải tiến. Đây là một tầm nhìn tốt, nhưng là một định nghĩa sản phẩm chưa đủ hẹp để kiểm chứng.

Hội đồng chỉ giữ lại một luận điểm có khả năng tạo giá trị khác biệt:

> **Giúp một solo founder/technical founder biến một quyết định đang bị kẹt thành một thí nghiệm có thể hành động trong dưới hai phút, rồi quay lại đo kết quả để lần sau tư vấn tốt hơn.**

Sản phẩm đầu tiên không nên là “Personal OS”. Nó nên là **Decision Loop** — một vòng lặp ra quyết định có trí nhớ về bằng chứng và kết quả.

Wedge MVP duy nhất gồm ba khoảnh khắc:

1. Người dùng ném vào một quyết định thật đang bị kẹt.
2. Hệ thống trả một card cực ngắn: khuyến nghị, giả định nguy hiểm nhất, thí nghiệm nhỏ nhất và ngày xem lại.
3. Đúng ngày, hệ thống hỏi kết quả, phân biệt chất lượng quy trình với may/rủi và cập nhật bài học.

Không xây Today Cockpit, Daily Coach, Idea Radar, task manager, coding agent, calendar/email automation hay “self-upgrade” trong MVP. Những phần này chỉ được mở lại nếu Decision Loop chứng minh được người dùng có quyết định lặp lại, quay lại ghi outcome và thấy chất lượng quyết định tăng.

## Phán quyết theo bốn vai trò

| Vai trò | Nhận định thẳng | Điều kiện để đồng ý đầu tư tiếp |
|---|---|---|
| Chief Product Officer | Thesis quá rộng, ICP chưa rõ, roadmap đi theo capability thay vì một hành vi tạo giá trị | Một phân khúc hẹp sử dụng ít nhất 2 quyết định/tuần và hoàn tất vòng outcome |
| UX Researcher | “Hiểu anh” đòi hỏi onboarding nặng; dashboard 30 giây vô giá trị nếu dữ liệu đầu vào sai hoặc cũ | Time-to-first-value dưới 5 phút, không cần kết nối app, không cần nhập profile dài |
| Behavioral Decision Scientist | Outcome/regret dễ dạy hệ thống sai vì outcome bias; khuyến nghị mạnh dễ tạo automation bias | Lưu dự báo và lý do trước quyết định, review cả process lẫn outcome, hiệu chỉnh độ tin cậy |
| Skeptical Founder | Đây có thể chỉ là prompt + database trong vỏ sản phẩm đắt tiền | Người dùng sẵn sàng trả tiền hoặc từ bỏ workflow hiện tại vì vòng follow-up tạo giá trị không dễ thay bằng chat |

---

## 1. Cố gắng bác bỏ ý tưởng trước

### 1.1 Sản phẩm chưa có một “job” duy nhất

Tài liệu hiện hứa hẹn:

- giúp biết hôm nay làm gì;
- giúp ra quyết định;
- giúp coding;
- giúp học hằng ngày;
- tạo ý tưởng;
- quản lý memory cá nhân;
- chủ động nhắc việc;
- tự nâng cấp;
- kết nối calendar, task, notes, email và browser.

Đây không phải một sản phẩm; đây là một danh mục sản phẩm. Mỗi lời hứa trên đã có đối thủ chuyên biệt, thói quen sử dụng khác nhau, metric khác nhau và rủi ro riêng.

Nếu xây theo roadmap hiện tại, đội ngũ có thể hoàn thành rất nhiều hạ tầng mà vẫn chưa biết người dùng quay lại vì lý do gì. Tình trạng dễ xảy ra là “demo ấn tượng, tuần thứ ba không còn lý do mở app”.

### 1.2 “Trợ lý hiểu mình” không còn là khác biệt đủ mạnh

ChatGPT Projects đã gom chat, file, instruction và memory theo một mục tiêu dài hạn; memory của ChatGPT cũng dùng saved memories và lịch sử trò chuyện để cá nhân hóa ([OpenAI Projects](https://help.openai.com/en/articles/10169521-projects-in-chatgpt), [OpenAI Memory](https://openai.com/index/memory-and-new-controls-for-chatgpt/)). Vì vậy, “nhớ mục tiêu và sở thích của tôi” sẽ nhanh chóng trở thành tính năng nền của model/platform, không phải moat.

Một product moat không thể chỉ là:

> Có memory + gọi model tốt + giao diện card đẹp.

Moat khả dĩ hơn là dữ liệu độc quyền về **quyết định trước khi xảy ra, dự báo, hành động, outcome sau đó và cách người dùng cập nhật niềm tin**. Dữ liệu này không tự có trong chat transcript và chỉ hình thành nếu sản phẩm tạo được ritual lặp lại.

### 1.3 Today Cockpit bước thẳng vào thị trường đỏ

Motion đã tự động ưu tiên, lên lịch và luôn chỉ ra việc quan trọng tiếp theo dựa trên deadline, priority và dependency ([Motion AI Task Manager](https://www.usemotion.com/features/ai-task-manager)). Sunsama đã có guided daily planning, objectives, shutdown và weekly review; AI assistant của họ có quyền truy cập task, calendar, backlog, objective và settings ([Sunsama Sunny](https://help.sunsama.com/docs/usage-guides/sunny/), [Sunsama Weekly Review](https://roadmap.sunsama.com/changelog/weekly-review-20)).

Vì thế, Today Cockpit không phải wedge hợp lý. Để tạo một brief sáng đáng tin, sản phẩm phải tích hợp nhiều nguồn, xử lý dữ liệu cũ, xung đột priority, estimate sai và thay đổi lịch liên tục. Đây là integration tax lớn trước khi chứng minh giá trị mới.

### 1.4 Coding Partner và Coach làm loãng lý do mua

Coding partner cạnh tranh với các coding agent chuyên dụng đang tiến rất nhanh. Coach lại là một sản phẩm học tập cần curriculum, rubric, assessment và motivation loop riêng. Hai phần này có liên hệ với tầm nhìn nhưng không có quan hệ nhân quả bắt buộc với Decision MVP.

Người dùng có thể thích Decision Card nhưng không muốn app đọc repository. Người dùng có thể muốn coach nhưng hiếm khi có quyết định chiến lược. Ghép các tính năng này sớm sẽ tạo onboarding, permission và navigation phức tạp mà không cải thiện activation cho job cốt lõi.

### 1.5 “Ra quyết định tốt hơn” rất khó đo

Outcome tốt không đồng nghĩa quyết định tốt. Một quyết định có quy trình tốt vẫn có thể cho kết quả xấu vì bất định; quyết định liều lĩnh vẫn có thể may mắn. Nghiên cứu replication về outcome bias cho thấy cùng một quy trình quyết định được đánh giá tốt hơn rõ rệt khi outcome thành công, kể cả ở người nói rằng outcome không nên ảnh hưởng đánh giá ([Aiyer et al., 2023](https://pubmed.ncbi.nlm.nih.gov/40951810/)).

Nếu hệ thống học trực tiếp từ `outcome` hoặc `regret_score`, nó có thể học sai:

- thưởng cho quyết định may mắn;
- phạt một thử nghiệm hợp lý vì thị trường biến động;
- tối ưu để người dùng ít hối tiếc thay vì học nhanh;
- chiều theo sở thích hiện tại và củng cố confirmation bias;
- đánh đồng “tôi chọn lời khuyên” với “lời khuyên hữu ích”.

Do đó, `recommendation acceptance > 60%` không phải metric chất lượng. Nó có thể cho thấy hệ thống dễ chiều lòng hoặc người dùng bị automation bias.

### 1.6 “Dưới hai phút” đang bị hiểu sai

Hai phút chỉ khả thi nếu:

- câu hỏi đã được đóng khung;
- dữ liệu đủ;
- decision tương đối đảo ngược được;
- người dùng chấp nhận mức bất định;
- card không giả vờ chắc chắn.

Với quyết định lớn, sản phẩm không nên ép ra kết luận trong hai phút. Giá trị đúng là **trong hai phút người dùng biết bước tiếp theo để giảm bất định**, không nhất thiết đã chốt quyết định cuối cùng.

### 1.7 Rủi ro niềm tin đi theo hai hướng đối nghịch

Một tổng quan 44 nghiên cứu, 122 task và gần 90.000 người tham gia ghi nhận algorithm aversion trong 75% số task được xem xét ([Task-specific algorithm advice acceptance review](https://doi.org/10.1016/j.dim.2023.100040)). Ngược lại, một số hoàn cảnh có thể khiến người dùng dựa quá nhiều vào AI. Vậy sản phẩm vừa có nguy cơ không được tin, vừa có nguy cơ được tin quá mức.

Decision Card hiện mặc định “một khuyến nghị rõ ràng”. Đây là UX tốt để giảm tải, nhưng nguy hiểm nếu nó khiến confidence ngôn ngữ cao hơn confidence bằng chứng. Nghiên cứu về recommendation acceptance cũng cho thấy giữ quyền tự chủ và có nhiều lựa chọn có thể tăng mức chấp nhận ([Fink, Newman & Haran, 2024](https://doi.org/10.1016/j.chb.2024.108244)). Vì vậy card nên có một khuyến nghị chính nhưng vẫn cho người dùng sửa premise, chọn phương án khác và xem evidence gap.

### 1.8 “Tự cải tiến” là câu chuyện hậu kỳ, không phải product value ban đầu

Người dùng không mua eval pipeline, provenance schema hay rollback. Họ mua một outcome. Tự cải tiến chỉ đáng làm sau khi có:

- hành vi lặp lại;
- dataset đủ sạch;
- metric đáng tin;
- biến thể để thử;
- baseline ổn định.

Trước đó, “self-improving” chủ yếu là một narrative kỹ thuật làm tăng scope và kỳ vọng.

## Kết luận phản bác

Nếu giữ nguyên thesis “hệ điều hành cá nhân cho quyết định, thực thi và phát triển”, hội đồng khuyến nghị **không build**. Chi phí tích hợp, độ rộng use case, trust burden và sự thiếu metric nhân quả khiến rủi ro sản phẩm cao hơn rủi ro kỹ thuật.

---

## 2. Phần thực sự đáng giữ

Sau khi bỏ các lớp bao quanh, còn bốn insight có giá trị:

1. **Chat hiện tại thường kết thúc ở câu trả lời**, không đóng vòng bằng outcome thực tế.
2. **Quyết định cần được ghi trước outcome**, gồm giả định, dự báo, confidence và điều kiện đổi ý.
3. **Khuyến nghị nên kết thúc bằng thí nghiệm nhỏ nhất**, đặc biệt với quyết định đảo ngược được.
4. **Memory đáng giá nhất không phải preference**, mà là decision pattern được nối với evidence và kết quả.

Đây là một wedge đủ rõ và có khả năng tạo dataset tăng giá trị theo thời gian.

## 3. Target user phải hẹp

### ICP đầu tiên

**Solo technical founder hoặc product-minded indie hacker đang vận hành một sản phẩm pre-PMF**, cụ thể:

- tự quyết phần lớn product/technical/growth priorities;
- có 3–10 quyết định đáng cân nhắc mỗi tuần;
- thường dùng AI để brainstorm hoặc phân tích;
- quyết định chủ yếu đảo ngược được trong 1–4 tuần;
- có outcome quan sát được: ship, user response, conversion, time saved, bug rate, interview signal;
- sẵn sàng dành 30–90 giây để review kết quả.

Không nhắm “mọi knowledge worker”. Không bắt đầu bằng quyết định y tế, pháp lý, tài chính cá nhân, tuyển dụng/sa thải hoặc quyết định khó đảo ngược có ảnh hưởng tới người khác.

### Anti-persona

- Người chỉ cần quản lý danh sách task hoặc lịch.
- Người muốn AI quyết định thay mình hoàn toàn.
- Người đưa ra ít hơn một quyết định có thể đo mỗi tuần.
- Team lớn cần approval, audit và collaboration ngay từ đầu.
- Người không sẵn sàng ghi outcome hoặc coi mọi kết quả là bí mật.

### JTBD chính

> **Khi tôi bị kẹt giữa vài hướng làm sản phẩm và đang lặp lại phân tích trong đầu, hãy giúp tôi đóng khung điều chưa biết, chọn một hành động nhỏ có thể kiểm chứng và nhắc tôi xem lại đúng lúc, để tôi tiến lên mà không giả vờ rằng mình chắc chắn.**

### Không phải JTBD

- “Quản lý cuộc đời tôi.”
- “Cho tôi nhiều ý tưởng.”
- “Tự động làm mọi việc.”
- “Hiểu toàn bộ con người tôi.”
- “Giúp tôi tăng trình mỗi ngày.”

Các câu này hấp dẫn về tầm nhìn nhưng không đủ cụ thể để thiết kế activation hay đánh giá product-market fit.

---

## 4. Wedge MVP duy nhất: Decision Loop

### Lời hứa sản phẩm

> **Từ một quyết định đang bị kẹt đến một thí nghiệm có deadline trong dưới hai phút — rồi không để bài học biến mất.**

### Một object cốt lõi

MVP chỉ cần một entity chính: `Decision`.

```text
Decision
├── question
├── context supplied by user
├── options (tối đa 3)
├── recommendation
├── unknown / riskiest assumption
├── smallest next experiment
├── predicted result + confidence
├── chosen action
├── review date
└── observed outcome + lesson
```

Goal, project và profile chỉ là metadata nhẹ. Không cần skill graph, knowledge graph, general event platform hay một ontology “toàn bộ con người”.

### Decision Card đề xuất

```text
NÊN LÀM GÌ?
Chạy concierge test với 5 founder trước khi code onboarding tự động.

VÌ SAO? (2 ý)
• Điều chưa biết lớn nhất là họ có quay lại, không phải ta có build được không.
• Test này mất 2 ngày và có thể đảo ngược hoàn toàn.

ĐIỀU CÓ THỂ KHIẾN LỜI KHUYÊN SAI
5 người được chọn không đại diện cho nhóm khách hàng mục tiêu.

THÍ NGHIỆM NHỎ NHẤT
Ngày mai gửi prototype cho 5 founder; thành công nếu ≥3 người tự quay lại lần hai trong 7 ngày.

ĐỘ TIN CẬY
62% — còn thiếu dữ liệu về cách anh đã tuyển người test trước đây.

[Chọn thí nghiệm này] [Sửa giả định] [Chọn hướng khác]
```

Sự khác biệt quan trọng với card cũ:

- không bắt buộc “chốt quyết định cuối” khi evidence yếu;
- ưu tiên giảm bất định;
- lưu một dự báo có thể kiểm tra;
- không dùng ba lý do như công thức cứng nếu chỉ có một lý do thật;
- confidence gắn với bằng chứng thiếu, không chỉ là con số trang trí;
- người dùng giữ quyền sửa premise.

### Điều tuyệt đối không có trong MVP

- Today dashboard;
- task/calendar/email integrations;
- coding execution;
- daily coach và skill graph;
- Idea Radar;
- vector search hoặc knowledge graph;
- multi-agent council hiển thị cho người dùng;
- autonomous action;
- auto-generated memory claim về tính cách;
- native mobile app;
- team workspace;
- self-modifying prompt/workflow.

Đây không phải cắt giảm tầm nhìn; đây là cách tạo bằng chứng để biết tầm nhìn có đáng tiếp tục hay không.

---

## 5. User journey tối thiểu

### 5.1 Activation: quyết định thật đầu tiên, không onboarding profile

**Màn hình đầu tiên:**

> “Anh đang bị kẹt ở quyết định nào trong 7 ngày tới?”

Cho phép nhập text/voice. Không yêu cầu tạo goals, constitution, import calendar hay trả lời personality quiz.

Hệ thống chỉ hỏi tối đa hai câu bổ sung, và chỉ khi câu trả lời có khả năng đổi khuyến nghị:

1. “Kết quả nào anh đang cố đạt được?”
2. “Ràng buộc cứng nhất là thời gian, tiền hay rủi ro?”

Sau đó trả Decision Card. Tổng thời gian mục tiêu: dưới 120 giây.

### 5.2 Commitment

Người dùng không chỉ bấm “A/B”. Họ chốt:

- hành động tiếp theo;
- định nghĩa signal thành công/thất bại;
- ngày review.

Nếu người dùng không chốt một hành động hoặc review date, vòng lặp chưa bắt đầu và không được tính activation.

### 5.3 Follow-up

Đến ngày review, gửi một prompt ngắn:

```text
Anh đã dự đoán ≥3/5 founder sẽ quay lại.
Thực tế chuyện gì xảy ra?

[Đạt] [Không đạt] [Chưa chạy]
```

Nếu “chưa chạy”, hỏi một lý do được chọn nhanh: quên, ưu tiên đổi, task quá lớn, recommendation không đáng tin, bị chặn bên ngoài.

### 5.4 Debrief chống outcome bias

Review tách hai lớp:

1. **Process quality:** với thông tin lúc đó, giả định và thí nghiệm có hợp lý không?
2. **Outcome:** dự báo đúng đến đâu và đã học được gì?

Hệ thống không nên hỏi chung chung “anh có hối tiếc không?” rồi dùng đó làm ground truth.

### 5.5 Return loop

Sau outcome, chỉ hiển thị một pattern nếu có ít nhất ba bằng chứng liên quan:

> “Trong 3 quyết định growth gần đây, anh thường ước lượng cao tỷ lệ người dùng quay lại. Lần tới em sẽ yêu cầu baseline trước khi dự báo.”

Đây là khoảnh khắc sản phẩm bắt đầu khác chatbot: nó không chỉ nhớ điều anh nói; nó kiểm tra điều hai bên đã dự báo.

---

## 6. UX “1–2 phút” nên được định nghĩa chính xác

### Mục tiêu không phải quyết định mọi thứ trong hai phút

Promise đúng:

- quyết định reversible: chốt action trong dưới hai phút;
- quyết định uncertain: chốt experiment trong dưới hai phút;
- quyết định high-stakes/irreversible: nhận checklist evidence và người cần tham vấn, không nhận verdict giả tạo.

### Progressive disclosure

Mặt trước card chỉ có:

1. Khuyến nghị.
2. Một đến hai lý do quyết định.
3. Unknown lớn nhất.
4. Next experiment.
5. Confidence + lý do thiếu tin cậy.

“Xem phân tích” mới mở options, assumptions, sources và phản biện. Không để nội dung model suy nghĩ dài chiếm trải nghiệm chính.

### Ngôn ngữ UI

Tránh anthropomorphic claim như “em hiểu anh 78%”. Dùng ngôn ngữ kiểm chứng được:

- “Dựa trên 3 quyết định growth trước…”
- “Chưa có dữ liệu về…”
- “Anh đã xác nhận nguyên tắc này…”
- “Đây là suy luận, chưa phải fact.”

### Trust calibration

- Không dùng confidence chính xác giả như `74%` nếu chưa có calibration data; bắt đầu bằng Low/Medium/High kèm lý do.
- Cho người dùng sửa assumptions trước khi xem recommendation mới.
- Nêu rõ khi nào hệ thống sẽ đổi ý.
- Với domain cấm/high-stakes, không đưa verdict.
- Không tối ưu acceptance; tối ưu khả năng người dùng nhận ra khi lời khuyên không phù hợp.

---

## 7. Khác biệt thật với chatbot và task manager

| Sản phẩm | Đơn vị giá trị | Kết thúc thường gặp | Decision Loop khác ở đâu |
|---|---|---|---|
| Chatbot | Câu trả lời/cuộc chat | Người dùng đọc xong, outcome mất khỏi hệ thống | Buộc chuyển advice thành forecast + experiment + review |
| Task manager | Task và deadline | Task done/overdue | Lưu vì sao chọn task, điều chưa biết và signal học được |
| Calendar/auto-scheduler | Slot thời gian | Lịch được tối ưu | Không tối ưu lịch; tối ưu giảm bất định của một quyết định |
| Journal | Reflection | Insight do người dùng tự rút | So sánh prediction trước sự kiện với outcome sau sự kiện |
| Coach | Lesson và practice | Hoàn thành bài học | Chỉ coaching “just in time” sau khi có pattern quyết định thật — không thuộc MVP |

Moat tiềm năng là **longitudinal decision dataset**, không phải general memory. Nó gồm:

```text
context-at-the-time → prediction → chosen experiment → observed outcome → belief update
```

Dataset này càng có giá trị khi người dùng hoàn tất nhiều vòng; nhưng chính vì thế, retention loop và outcome capture quan trọng hơn sophistication của agent.

---

## 8. Metric tree

### North-star cho giai đoạn validation

**Completed Learning Loops per Weekly Active User (CLL/WAU)**

Một loop chỉ được tính khi có đủ:

1. decision/uncertainty;
2. committed next action;
3. predicted signal;
4. review date;
5. observed outcome;
6. recorded lesson hoặc belief update.

Không dùng số chat, số card hay recommendation acceptance làm north-star.

### Activation

- `Time to first committed experiment`: median < 5 phút từ lúc vào sản phẩm.
- ≥60% người bắt đầu hoàn tất decision card đầu tiên.
- ≥50% đặt được metric/signal và review date.
- Qualitative: người dùng nói được “tôi sẽ làm gì tiếp” mà không cần đọc lại card.

### Engagement/retention

- ≥40% activated users tạo quyết định thứ hai trong 14 ngày.
- ≥30% activated users tạo ít nhất 4 decision loops trong 4 tuần.
- ≥50% scheduled reviews nhận outcome trong 72 giờ.
- Median ≥2 decisions/tuần ở nhóm retained.

### Value

- ≥50% loop giúp người dùng bắt đầu hành động sớm hơn self-reported baseline.
- Giảm median time-from-question-to-commitment ít nhất 30% so với workflow cũ.
- ≥40% review tạo ra một thay đổi cụ thể: stop, continue, revise experiment hoặc update assumption.
- ≥30% người dùng có ít nhất một pattern hữu ích được xác nhận sau 4 tuần.

### Trust và safety

- 100% card nêu evidence gap/unknown.
- 0 verdict ở domain bị cấm.
- Tỷ lệ user sửa premise/assumption được theo dõi; không xem sửa là failure.
- Overreliance audit: người dùng có thể giải thích vì sao chọn action, không chỉ nói “AI bảo vậy”.

### Metric cần tránh

- Recommendation acceptance rate như proxy duy nhất cho chất lượng.
- Regret trung bình mà không tách process/outcome.
- Số memory claim được tạo.
- Daily streak.
- Token/message volume.
- “Accuracy” của quyết định không có counterfactual.

---

## 9. Validation experiments trước và trong khi build

### Experiment 0 — Problem interview, không pitch giải pháp

**Mẫu:** 12–15 solo technical founders pre-PMF.

Yêu cầu họ kể lại ba quyết định gần nhất đã trì hoãn hoặc phân tích quá lâu. Thu thập:

- trigger;
- cách họ ra quyết định hiện nay;
- chi phí của delay;
- nơi quyết định được ghi lại;
- họ có quay lại review không;
- outcome nào quan sát được;
- điều gì khiến họ không muốn lưu dữ liệu.

**Pass:** ít nhất 8/15 có ≥2 quyết định/tuần phù hợp và ít nhất 6 người tự mô tả pain là đáng kể, không cần được dẫn dắt.

### Experiment 1 — Concierge Decision Loop

Không code app. Dùng một form đơn giản + người/AI phía sau để trả card trong 10 phút. Theo dõi 20–30 quyết định thật trong hai tuần.

**Cần học:** người dùng có cam kết experiment không, họ có phản hồi outcome không, card nào thực sự thay đổi hành động.

**Pass:** ≥60% decision dẫn tới committed action; ≥50% follow-up nhận outcome; ≥30% người dùng chủ động gửi decision thứ hai.

### Experiment 2 — A/B card structure

So sánh:

- A: một recommendation mạnh;
- B: recommendation + editable assumption + alternative.

Đo không chỉ acceptance mà còn comprehension, perceived autonomy, số assumption sai được bắt và action commitment.

**Pass:** variant thắng tăng commitment mà không tăng blind acceptance hoặc giảm khả năng giải thích rationale.

### Experiment 3 — Follow-up timing

So sánh follow-up đúng ngày người dùng chọn với reminder sau 24 giờ và weekly batch. Đo completion và annoyance.

**Pass:** tìm được cadence có outcome completion ≥50% và notification-dismiss <30%.

### Experiment 4 — Wizard-of-Oz personal pattern

Sau tối thiểu 4 loops/người, tạo thủ công một pattern dựa trên evidence. Hỏi:

- có đúng không;
- có bất ngờ không;
- có thay đổi quyết định tiếp theo không;
- có thấy creepy không.

**Pass:** ≥40% pattern được xác nhận là đúng và hữu ích; <10% bị đánh giá xâm phạm/khó chịu.

### Experiment 5 — Willingness to pay

Sau khi một người hoàn tất ≥3 loops, đưa paywall hoặc yêu cầu đặt cọc/thanh toán thật cho tháng tiếp theo. Không hỏi “anh có sẵn sàng trả không” theo kiểu survey.

**Pass sơ bộ:** ≥20% nhóm đạt aha moment trả mức giá thử nghiệm; hoặc có ít nhất 5 design partners trả tiền và dùng liên tục 6 tuần.

---

## 10. Kill criteria

Ngừng hoặc pivot nếu sau 6 tuần concierge + prototype, với ít nhất 15 người dùng phù hợp và 100 decision attempts:

1. Ít hơn 40% attempt tạo được committed next action.
2. Ít hơn 30% scheduled review nhận outcome.
3. Ít hơn 25% activated users tạo decision thứ hai trong 14 ngày.
4. Người dùng nói “ChatGPT prompt là đủ” và hành vi cho thấy họ không quay lại vì follow-up/history.
5. Phần lớn decision không có outcome quan sát được trong 1–4 tuần.
6. Hơn 30% recommendation phải sửa vì context quan trọng không thể thu thập trong flow ngắn.
7. Người dùng không muốn ghi data đủ cụ thể vì privacy/trust.
8. Không có willingness-to-pay thật sau aha moment.

### Pivot signals

- **Card có giá trị, follow-up không có:** pivot thành decision framing tool/session artifact; bỏ thesis learning loop.
- **Follow-up có giá trị, recommendation không có:** pivot thành decision journal + calibration coach; AI chỉ hỏi và tổng hợp, không advise.
- **Founders dùng chủ yếu để ưu tiên backlog:** cân nhắc wedge product-prioritization, nhưng không biến thành generic task manager.
- **Giá trị chủ yếu đến từ human facilitator:** cân nhắc service/productized coaching trước khi tiếp tục SaaS.

Kill criteria phải được thống nhất trước khi build để tránh tiếp tục vì sunk cost.

---

## 11. Lộ trình sản phẩm đã thu gọn

### Tuần 0–2: Discovery + concierge

- 12–15 problem interviews.
- 20 quyết định quá khứ để hiểu vocabulary, không dùng làm ground truth.
- 20–30 decision loops thật dạng concierge.
- Xác định domain allowlist/denylist.
- Kiểm chứng card và follow-up cadence.

**Gate:** đạt pass criteria Experiment 0 và 1.

### Tuần 3–5: Single-loop prototype

- Text/voice intake.
- Tối đa hai clarifying questions.
- Structured Decision Card.
- Commit action + predicted signal + review date.
- Notification và outcome capture.
- History timeline đơn giản.
- Instrumentation cho funnel.

**Gate:** activation và second-decision retention đạt ngưỡng.

### Tuần 6–8: Evidence-backed personalization

- Pattern chỉ xuất hiện sau ≥3 evidence points.
- User confirm/dispute pattern.
- Process/outcome review tách riêng.
- Confidence calibration theo loại decision.
- Export/delete dữ liệu.

**Gate:** pattern hữu ích, không creepy; outcome completion ổn định.

### Tuần 9–12: Paid beta

- 10–20 design partners.
- Paywall thật.
- Weekly decision review dạng digest.
- Eval set từ các failure thật.
- Chỉ thêm integration nào trực tiếp giảm friction của Decision Loop.

**Gate:** trả tiền + 6-week retention.

### Chỉ sau product evidence

Mở từng adjacent product bằng một giả thuyết riêng:

1. **Weekly Review** nếu outcome capture cần batch ritual.
2. **Read-only project context** nếu thiếu context là failure lớn nhất.
3. **Coding execution** nếu đa số committed experiments là code và handoff tạo friction đo được.
4. **Coach** nếu decision patterns thật sự dự đoán skill gaps và người dùng muốn luyện.
5. **Today view** nếu decision output cần được bảo vệ trên calendar/task list.

Không mở theo thứ tự “công nghệ đã sẵn sàng”. Mở theo bottleneck đã đo được.

---

## 12. Kết luận chung của hội đồng

Tầm nhìn “một người tham mưu có trí nhớ, giúp anh quyết định, thực thi và tiến bộ” hấp dẫn nhưng chưa phải sản phẩm có thể triển khai an toàn theo nguyên trạng. Nó đang nhầm lẫn giữa **future platform** và **first behavior**.

Bức tranh chung nên là:

```text
Tầm nhìn dài hạn
Personal advisor học từ hành động và kết quả thực
                         ↑
Moat có thể tích lũy
Dataset: context → prediction → action → outcome → belief update
                         ↑
Sản phẩm đầu tiên
Decision Loop cho solo technical founder pre-PMF
                         ↑
Khoảnh khắc giá trị
Trong 2 phút: từ bị kẹt → thí nghiệm nhỏ nhất có deadline
```

Quyết định đầu tư đề xuất: **Proceed, nhưng chỉ với wedge Decision Loop và dưới dạng validation-first.** Không phê duyệt roadmap Personal OS đầy đủ cho đến khi có bằng chứng về completed learning loops, 4–6 tuần retention và willingness-to-pay.

Một câu định vị cuối cùng:

> **Không phải AI quyết định thay anh. Đây là hệ thống giúp anh biến sự phân vân thành một phép thử, rồi không để bài học bị quên.**
