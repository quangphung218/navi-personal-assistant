# Navi — Ban trợ lý cá nhân theo module

Ngày: 08/09/2026. Trạng thái: bản thiết kế sản phẩm để triển khai; chưa phải phần mềm đã chạy.

## 1. Mục tiêu và phạm vi đã sửa

Người dùng đầu tiên là anh. Hệ thống giúp anh giao việc, ra quyết định, giữ nhịp sống, theo đuổi mục tiêu và nhìn thấy quan hệ giữa các phần đó. Sản phẩm giao tiếp bằng tiếng Việt, có thể đọc nguồn và làm việc bằng ngôn ngữ khác khi cần.

Định nghĩa sản phẩm: **một trợ lý điều phối trung tâm sử dụng các module chuyên môn và skill để biến ý định thành kế hoạch, hành động và kết quả có thể kiểm tra.**

Các tài liệu tháng 8 đã chuyển hướng sang bán Founder Experiment Copilot mà chưa có quyết định từ người dùng. Tài liệu này thay thế hướng đó cho việc triển khai cá nhân. Paid beta, doanh thu, ICP và điều kiện phải có khách trả tiền không còn là điều kiện xây sản phẩm này. Decision Loop trở thành một khả năng bên trong ban trợ lý.

Giữ lại từ review cũ: dữ liệu có nguồn, kiểm tra kết quả thực thi, quyền rõ ràng, đo năng lực khi không có AI, dữ liệu xuất được và thay đổi có thể quay lại phiên bản trước.

“Siêu việt” được cụ thể hóa bằng khả năng phối hợp đúng, làm được việc và giảm gánh quản lý cho anh. Chưa có bằng chứng để gọi một thiết kế là hoàn hảo. Review bởi nhiều AI là phản biện theo các vai trò; đồng thuận của chúng không thay thế kiểm thử hoặc chuyên gia con người.

## 2. Bốn câu hỏi sản phẩm phải trả lời mỗi ngày

1. Anh đang hướng tới điều gì, tiến triển ra sao?
2. Hôm nay việc nào đáng làm, việc nào cần giữ chỗ, điều gì đang xung đột?
3. Ban trợ lý đang làm gì, đã làm xong gì, cần anh quyết định gì?
4. Anh cần thay đổi điều gì để tuần tới nhẹ hơn hoặc tiến bộ hơn?

Đời sống có cả trách nhiệm cần duy trì, thời gian nghỉ và điều có ý nghĩa nhưng không cần KPI. Không bắt mọi cuộc gặp gia đình hoặc sở thích phải chứng minh năng suất.

## 3. Các khái niệm dùng nhất quán

| Khái niệm | Nghĩa | Ví dụ |
|---|---|---|
| Lĩnh vực | Phần cuộc sống cần chăm sóc lâu dài | Công việc, gia đình, học tập |
| Mục tiêu | Kết quả muốn đạt, có cách nhận biết đã đạt | Hoàn thành bản dùng thử tháng này |
| Dự án | Tập công việc hữu hạn để tạo kết quả | Xây tính năng xuất báo cáo |
| Công việc | Một hành động có người chịu trách nhiệm | Viết test xuất báo cáo |
| Cam kết | Khoảng thời gian hoặc nghĩa vụ đã chốt | Đón người thân lúc 17:30 |
| Thói quen | Hành vi lặp lại theo điều kiện | Sau ăn trưa đi bộ 15 phút |
| Module | Phần chức năng sở hữu dữ liệu và quy tắc riêng | Module Thói quen |
| Skill | Quy trình tái sử dụng để làm một việc | Lập lịch tuần, review code |
| Tool | Khả năng thao tác cụ thể | Đọc lịch, chạy test, tạo bản nháp |
| Agent | Phiên AI được giao nhiệm vụ và quyền có giới hạn | Agent kiểm tra một lỗi |
| Workflow | Chuỗi bước phối hợp, có trạng thái và kết quả | Mục tiêu → kế hoạch → làm → kiểm chứng |

Module có thể gọi nhiều skill. Skill có thể dùng nhiều tool. Một agent có thể thực hiện skill trong một module. Module không cần một agent chạy thường trực; nhiều nghiệp vụ thực hiện bằng code thông thường.

## 4. Bức tranh tổng thể

**Chat là nơi tương tác hằng ngày; web phục vụ xem tổng thể, chỉnh sửa phức tạp và quản trị.** Bản đầu có một kênh Telegram chat riêng được liên kết với tài khoản của anh và web tối giản. Lõi điều phối độc lập với giao diện; không tạo một trợ lý có bộ nhớ riêng cho mỗi kênh.

```text
Chat riêng → Adapter kênh → Tiếp nhận bền vững + Danh tính + Hội thoại
Web đã đăng nhập ────────────────────────────────────────┘
                              ↓
                  Lõi điều phối và module nghiệp vụ
                              ↓
                  Dữ liệu chung + Job worker
                              ↓
                Kết quả có bằng chứng + Hàng đợi gửi
                              ↓
                   Chat / Web theo chính sách thông báo
```

Luồng nghiệp vụ bên trong lõi:


```text
Anh: nói / nhập / giao mục tiêu / xem kết quả
                         ↓
                Trợ lý điều phối
       hiểu yêu cầu · tìm ngữ cảnh · lập kế hoạch
       giải quyết xung đột · giao việc · kiểm chứng
                         ↓
    Mục tiêu · Công việc · Đời sống · Thói quen
           Học tập · Quyết định · Kiến thức
                         ↓
         Skill được chọn + tool được cấp quyền
                         ↓
                Kết quả và bằng chứng
                         ↓
        Bộ nhớ có nguồn + Bảng tổng quan cập nhật
```

Các module chia sẻ một mô hình về thời gian và cam kết của anh. Mỗi module chỉ đề xuất phần nó phụ trách; trợ lý điều phối tạo kế hoạch chung. Không có chuyện từng module tự lên lịch kín cả ngày.

## 5. Danh mục module

| Module | Trách nhiệm | Kết quả trả về | Giai đoạn |
|---|---|---|---|
| Mục tiêu | Kết quả mong muốn, mức ưu tiên, ràng buộc và mốc kiểm tra | Mục tiêu → dự án → bước tiếp theo | V1 |
| Công việc | Dự án, task, vướng mắc, người/agent phụ trách | Việc đang làm, artifact, trạng thái được kiểm chứng | V1 |
| Đời sống | Lịch cá nhân, việc nhà, cam kết, giờ nghỉ cần bảo vệ | Khoảng thời gian khả dụng và việc phải nhớ | V1 |
| Thói quen | Hành vi lặp, phiên bản tối thiểu, ghi nhận và điều chỉnh | Gợi ý vừa sức, lịch sử thực tế | V1 |
| Quyết định | Phương án, trade-off, bằng chứng và ngày xem lại | Gợi ý ngắn hoặc câu hỏi cần làm rõ | V1, mức cơ bản |
| Kiến thức | Note, nguồn tham khảo, bài học, tìm thông tin | Ngữ cảnh đúng nguồn và đúng thời điểm | V1, nhập chủ động |
| Học tập | Kỹ năng, bài luyện, rubric, bằng chứng tự làm | Bài luyện gắn với công việc và kiểm tra lại | V2 |
| Coding | Giao tác vụ cho executor, nhận patch/test/artifact | Kết quả code có giới hạn và bằng chứng | V2 |
| Ý tưởng & Research | Tìm nguồn, đề xuất hướng mới, kiểm tra giả định | Cơ hội có lý do liên quan và bước thử | V2 |
| Module thêm sau | Ví dụ hành chính cá nhân, du lịch, quản lý chi tiêu | Chỉ thêm theo nhu cầu thật | V3 |

Các nhóm này là logic trong cùng ứng dụng ở bản đầu. Không triển khai một máy chủ cho từng module.

## 6. Trải nghiệm một tuần — ví dụ giả định

### Đầu tuần

Anh nói: “Tuần này anh muốn hoàn thành bản demo, đi bộ ba buổi và giữ tối thứ Sáu cho gia đình.”

Hệ thống ghi ba ưu tiên, hỏi phần chưa rõ có ảnh hưởng tới kế hoạch. Module Công việc ước lượng còn 14 giờ; module Đời sống xác định 11 giờ trống dựa trên lịch đã nhập. Module Thói quen đề xuất ba buổi ngắn nằm trong các khoảng còn phù hợp.

Trợ lý điều phối trình:

> “Bản demo còn khoảng 14 giờ, tuần này có 11 giờ dành cho dự án. Em đề xuất giữ luồng chính, chuyển phần biểu đồ sang tuần sau. Ba buổi đi bộ và tối thứ Sáu vẫn được giữ. Anh có thể đổi phạm vi hoặc đổi hạn.”

Nếu số giờ mới là suy đoán, phải nói rõ. Khi hai ràng buộc cứng không thể cùng đạt, hệ thống hiển thị xung đột; không tự quyết bỏ gia đình hoặc giờ nghỉ.

### Trong ngày

Anh nói: “Chiều nay phát sinh hai tiếng họp.”

Hệ thống tính lại những việc bị ảnh hưởng, giữ phần đã hoàn thành, tránh thay đổi toàn bộ lịch. Nó trình một bản thay đổi: task nào dời, mốc nào bị chậm, vì sao. Các lịch bên ngoài chỉ thay khi nằm trong quyền anh đã cấp.

### Khi giao việc coding

Anh nói: “Làm phần xuất báo cáo giúp anh, giới hạn trong dự án này.”

Module Công việc tạo task và tiêu chí hoàn thành. Module Coding giao executor viết patch trong vùng riêng. Sau khi chạy test, hệ thống trả kết quả, file thay đổi, test đã chạy và phần chưa xác minh. Test thất bại thì task ở trạng thái cần sửa; không ghi đã xong chỉ vì model nói đã xong.

### Khi muốn học

Anh chọn chế độ “Cùng làm và dạy anh”. Module Học tập giữ lại một phần để anh thử trước, đưa gợi ý khi cần. Tuần sau có bài tương tự ở ngữ cảnh mới để xem anh tự làm được không. Chế độ “Làm giúp anh” không được ghi nhận như bằng chứng anh đã học được kỹ năng đó.

### Cuối tuần

Hệ thống tổng hợp kết quả demo, thời gian thực tế, buổi đi bộ đã ghi nhận, cam kết được giữ và điểm cần điều chỉnh. Không nhập thì hiển thị “chưa có dữ liệu”; không kết luận anh bỏ thói quen. Bài học về ước lượng thời gian là giả thuyết cần kiểm tra ở tuần tiếp theo.

## 7. Giao diện cho anh

### Chat hằng ngày và web khi cần

| Chat | Web |
|---|---|
| Giao việc, nhập ý tưởng và cam kết | Xem bản đồ mục tiêu và dự án |
| Hỏi hôm nay làm gì, báo hoàn thành/hoãn | Chỉnh kế hoạch tuần nhiều việc |
| Báo phát sinh và nhận phương án điều chỉnh | So sánh revision, lịch sử, artifact dài |
| Nhận kết quả, trả lời câu hỏi, duyệt hành động cụ thể | Quản lý quyền, kênh, module và bộ nhớ |

Phản hồi chat ưu tiên kết quả, thay đổi, điều cần anh quyết định và bước tiếp theo. Tác vụ dài báo “đã nhận” kèm mã việc sau khi lưu bền vững; chỉ báo “đã hoàn thành” sau kiểm chứng. Không gửi từng bước suy luận. Link chi tiết mở đúng task hoặc revision trên web và yêu cầu đăng nhập.

Năm luồng bắt buộc của bản đầu: bản tin sáng theo lịch đã chọn; giao việc; thêm cam kết; điều phối khi phát sinh; báo kết quả. Hoàn thành, hoãn, hỏi tiến độ và dừng việc phải làm được ngay trong chat. Nút bấm là tiện ích; có cách trả lời bằng chữ với mã việc nếu kênh không hỗ trợ nút.

Ví dụ “chiều nay bận thêm hai tiếng”: nếu chưa biết khoảng giờ và điều đó ảnh hưởng xếp lịch, hỏi giờ bắt đầu/kết thúc. Khi đủ dữ liệu, trả thay đổi dự kiến, xung đột và lựa chọn; cập nhật trong quyền đã cấp, không tự thay cam kết cứng.

### Ngữ cảnh và sửa sai trong hội thoại

Mỗi cuộc hội thoại lưu tham chiếu task/kế hoạch đang bàn, câu hỏi đang chờ và thời hạn còn hiệu lực. Reply vào tin cụ thể ưu tiên tham chiếu của tin đó. “Dời việc đó sang mai” chỉ thực hiện khi xác định được duy nhất đối tượng; nhiều việc hoặc nhiều yêu cầu duyệt đang mở thì hỏi rõ.

Ngày giờ được diễn giải theo múi giờ hồ sơ và thời điểm tin được gửi; lưu cả thời điểm gửi/nhận, múi giờ và thời gian tuyệt đối. Khi tin đến muộn hoặc diễn giải có thể đổi hành động, nhắc lại ngày giờ cụ thể trước khi sửa. Không dùng giờ server để tự hiểu “mai”.

Sửa/xóa một tin chat không tự hoàn tác hành động đã chạy. Hỗ trợ lệnh sửa/dừng rõ đối tượng; hiển thị phần còn hủy được và phần đã có tác động. Ghi nhớ dài hạn dùng quy tắc nguồn/xác nhận ở mục 11, không coi mọi câu hội thoại là sự thật lâu dài.


### Tổng quan

Một màn hình có năm phần đọc trong khoảng 1–2 phút:

- Hướng đi: mục tiêu đang hoạt động và mốc gần nhất.
- Hôm nay: tối đa ba việc ưu tiên, thời gian khả dụng và cam kết cần giữ.
- Ban trợ lý: đang làm, chờ anh, đã hoàn thành, lỗi/cần xử lý.
- Xung đột: điều quan trọng đang không thể cùng đạt và các cách giải quyết.
- Thay đổi đáng chú ý: dữ liệu mới hoặc kết quả làm kế hoạch thay đổi.

Mỗi trạng thái có thời điểm cập nhật. Nguồn lịch cũ thì hiển thị cũ, không trình kế hoạch như đã kiểm tra thời gian thực.

### Bản đồ tổng thể

Cho phép đi từ lĩnh vực → mục tiêu → dự án/thói quen → hành động → bằng chứng. Hiển thị các quan hệ hỗ trợ, phụ thuộc và xung đột. Ví dụ “demo phụ thuộc task export”, “task export cạnh tranh thời gian với buổi học”. Quan hệ xung đột được tính từ dữ liệu, không suy diễn rằng mọi sinh hoạt cá nhân là chướng ngại cho công việc.

### Bàn giao việc

Anh nhập yêu cầu và chọn khi cần: “Làm giúp”, “Cùng làm”, “Dạy anh”. Kết quả là kế hoạch và tiến độ thực thi; anh không cần lựa agent hoặc đọc tên tool.

### Các module

Bật/tắt, chỉnh phạm vi và xem module đang dùng dữ liệu nào. Tắt module ngăn công việc mới, xử lý tác vụ đang chạy có trạng thái rõ, giữ dữ liệu để có thể dùng lại. Xóa dữ liệu là lựa chọn riêng.

### Bộ nhớ & Lịch sử

Xem điều đã xác nhận, điều hệ thống đang suy luận và nguồn. Có sửa, vô hiệu hóa, xóa, xuất. Không có điểm phần trăm “AI hiểu anh”.

## 8. Trợ lý điều phối suy luận thế nào

1. Xác định kết quả anh muốn, giới hạn và chế độ làm việc.
2. Lấy dữ liệu liên quan từ module sở hữu dữ liệu; kiểm tra thời điểm và trạng thái.
3. Phân biệt thông tin đã biết, suy luận và chỗ thiếu có thể đổi kế hoạch.
4. Gọi các module thực sự liên quan để lấy đề xuất. Tác vụ đơn giản dùng một luồng; tác vụ có nhiều góc nhìn mới dùng nhánh phản biện.
5. Kiểm tra đề xuất bằng quy tắc: thời gian, deadline, dependencies, quyền và chi phí.
6. So sánh những trade-off quan trọng rồi đưa phương án kèm lý do ngắn.
7. Chuyển phần được giao thành job có tiêu chí hoàn thành và phạm vi rõ.
8. Kiểm chứng bằng kết quả tool, test hoặc xác nhận từ anh; cập nhật trạng thái dùng chung.

Ba mức xử lý: nhanh cho ghi nhận/tìm kiếm; phân tích cho lập kế hoạch; phản biện sâu cho quyết định kiến trúc hoặc xung đột lớn. Mức sâu phải có ngân sách thời gian và chi phí, chỉ gọi thêm nhánh nếu còn câu hỏi cụ thể cần giải quyết. Nhiều agent đồng ý không được tính thành nhiều nguồn bằng chứng.

Anh được xem kết luận, dữ liệu dùng, giả định, phương án thay thế và giới hạn. Chất lượng suy luận được đo bằng khả năng phát hiện mâu thuẫn và hoàn thành tác vụ, không bằng độ dài giải thích.

## 9. Quy tắc giải quyết xung đột

Thứ tự đề xuất, anh có thể điều chỉnh trong hồ sơ ưu tiên:

1. Giữ các ràng buộc cứng anh đã xác nhận và những hành động đúng quyền.
2. Tôn trọng cam kết cố định, deadline thật và phụ thuộc giữa các việc.
3. Phân bổ thời gian cho mục tiêu đang ưu tiên; tránh mở thêm quá nhiều việc.
4. Chọn cách đáp ứng mềm: giảm phạm vi, đổi giờ, dùng phiên bản thói quen tối thiểu, dời việc ít ưu tiên.
5. Để khoảng trống cho phát sinh; tỷ lệ khoảng trống là giả định điều chỉnh theo dữ liệu sử dụng.

Nếu yêu cầu mới mâu thuẫn với ràng buộc cũ, trình điểm xung đột và cho anh quyết định sửa ràng buộc nào. Không tự chuyển ưu tiên từ công việc sang đời sống hoặc ngược lại dựa trên suy luận tính cách.

Ví dụ: 90 phút trống, task dự kiến 120 phút và đi bộ 20 phút. Hệ thống phải đưa phương án giảm task xuống một phần, dời task hoặc đổi hạn. Không xếp 140 phút vào 90 phút. Nếu ước lượng chưa chắc, hiển thị khoảng thay vì độ chính xác giả.

## 10. Hợp đồng module và skill

Mỗi module có một interface nhỏ: đọc tình trạng, đề xuất kế hoạch trong phạm vi của nó, thực hiện lệnh được cấp quyền và kiểm tra kết quả. Implementation ẩn việc dùng model, tìm kiếm hoặc connector bên trong. V1 chỉ cần đăng ký các module do dự án kiểm soát; chưa cần marketplace hay cài code tùy ý.

Hợp đồng module ghi: mã và phiên bản; dữ liệu sở hữu; đầu vào/đầu ra; dependency; quyền cần; sự kiện phát/nhận; hành vi khi lỗi hoặc bị tắt; migration và kiểm thử.

Hợp đồng skill ghi: mục đích; khi nào dùng; module hỗ trợ; dữ liệu bắt buộc; bước xử lý; tool được dùng; loại tác động; ngân sách; artifact đầu ra; cách biết đã xong; ví dụ kiểm thử và phiên bản. Skill mới không tự có thêm quyền chỉ vì được cài.

Ví dụ skill `weekly-plan`: nhận mục tiêu, task, cam kết và thói quen; trả kế hoạch khả thi, xung đột và câu hỏi cần giải quyết. Phiên bản đầu chỉ tạo bản nháp kế hoạch, không tự chỉnh lịch bên ngoài.

Ví dụ skill `implement-task`: nhận repo được cấp, tiêu chí hoàn thành và giới hạn thay đổi; trả patch, test report và phần còn thiếu. Task không xong thì không được phát sự kiện hoàn thành.

### Hợp đồng giao tiếp dùng chung

Lớp tiếp nhận chuẩn hóa yêu cầu từ chat và web thành: request ID, người dùng đã xác thực, kênh/cuộc hội thoại, message/event ID nguồn, loại sự kiện, thời điểm gửi/nhận, đối tượng được tham chiếu và nội dung. Adapter chỉ xử lý giao thức, định dạng và khả năng kênh; logic kế hoạch, quyền và hoàn thành việc nằm trong lõi.

Kết quả từ lõi gồm mã việc, trạng thái, tóm tắt, bằng chứng, lựa chọn hành động và tham chiếu chi tiết. Module phân phối chịu trách nhiệm định tuyến, giờ yên lặng, gom tin, retry và trạng thái giao tin. Không để từng module nghiệp vụ tự gửi thông báo.

V1 hỗ trợ văn bản và thao tác có cấu trúc, một kênh chat riêng. Voice, file và group chat để sau; nội dung chưa hỗ trợ phải được báo rõ. Trước khi chọn kênh, kiểm tra tài liệu chính thức về nhận sự kiện, xác thực, ID, hạn mức, gửi chủ động, lưu giữ dữ liệu và khả năng nút/link; chưa giả định nền tảng cụ thể có đủ các khả năng đó.

## 11. Dữ liệu dùng chung và quyền sở hữu

Các bảng logic chính: areas, goals, projects, tasks, commitments, habits, habit_occurrences, plans, plan_revisions, decisions, notes, sources, memory_claims, jobs, job_steps, artifacts, events, module_settings, skill_versions, grants, model_runs, eval_cases.

Bổ sung các record logic cho chat: channel_accounts, conversations, inbound_events, conversation_refs, approval_requests, notification_preferences, outbound_deliveries. Có thể gộp bảng khi triển khai nếu vẫn giữ các bất biến dưới đây:

- Channel account liên kết provider + external user ID ổn định với người dùng nội bộ; lưu conversation đích đã xác minh và trạng thái thu hồi. Không dùng tên hiển thị làm danh tính.
- Inbound event có khóa duy nhất theo provider/account/event ID, trạng thái xử lý và request/job tương ứng. Conversation ref trỏ đến record nghiệp vụ và revision; lịch sử chat không sở hữu trạng thái task.
- Approval request giữ người duyệt, hành động/đích/nội dung bất biến, revision, hạn dùng và trạng thái đã sử dụng/thu hồi. Kiểm tra và nhận quyền thực hiện một lần bằng transaction; thao tác bên ngoài vẫn cần chống trùng/đối soát.
- Outbound delivery liên kết event/job, đích đã cấp quyền, khóa chống trùng, số lần thử, thời điểm thử tiếp, provider message ID và kết quả giao tin. Job thành công và gửi thông báo thành công là hai trạng thái riêng.

Một task có thể hỗ trợ nhiều mục tiêu nhưng chỉ có một record gốc. Công việc sở hữu trạng thái task; Thói quen sở hữu lần thực hiện; Đời sống sở hữu cam kết nhập nội bộ; Mục tiêu sở hữu tiêu chí và trạng thái mục tiêu. Điều phối sở hữu bản kế hoạch tổng hợp và tham chiếu các record đó.

Connector lưu source ID, revision và last_sync_at. Khi tích hợp lịch/task app, phải chọn nơi nào là dữ liệu gốc cho từng loại record. Không để hai chiều cùng sửa không có quy tắc xung đột.

Module khác gửi lệnh qua interface, không sửa trực tiếp bảng của nhau. Lưu domain change và event trong cùng transaction; nhận sự kiện trùng không được tạo task/thói quen/job trùng. Bản tổng quan có thể được tạo lại từ dữ liệu gốc.

Mỗi memory claim có nguồn, thời điểm đúng, phạm vi, trạng thái và phản chứng nếu có. Chỉ lấy ngữ cảnh cần thiết cho việc hiện tại. Executor coding nhận repo/task context, không cần nhật ký đời sống của anh.

Khi anh xóa dữ liệu, loại khỏi tìm kiếm, tóm tắt và eval liên quan theo chính sách đã công bố. Lịch sử phiên bản không được trở thành đường vòng để tiếp tục dùng thông tin đã xóa.

## 12. Thực thi, lịch nền và lỗi

Job đi qua queued → running → waiting_input/waiting_approval → verifying → succeeded/partial/failed/cancelled. Có trạng thái blocked khi thiếu dependency và unknown khi chưa rõ tác động ngoài hệ thống. Lưu bước đang thực hiện, input revision, budget, artifact và kết quả đã xác nhận. Khóa phiên bản model/prompt/skill cho từng run; nâng cấp áp dụng cho run mới hoặc migration có ghi nhận.

Có xử lý nền ngay trong bản chat tích hợp đầu (chặng B), cùng hàng đợi nhận/gửi lưu DB. Review ngân sách đề xuất Cloudflare queue consumer + cron, không phải Node process chạy thường trực. Đóng trình duyệt hoặc tắt laptop không làm dừng phần cloud đã triển khai. Bản local chưa đạt yêu cầu 24/7; khi nền tảng phục hồi, đối soát việc quá hạn từ DB. Xem blueprint mục 16.

Job claim có lease và thời hạn; worker chết thì có thể nhận lại. Retry hữu hạn. Tool có tác động bên ngoài dùng khóa chống trùng nếu được hỗ trợ; kết quả không rõ thì đối soát với hệ thống đích, không retry mù. Hủy job không đồng nghĩa hoàn tác việc đã gửi; UI phải phản ánh sự khác nhau.

Thông tin đã đổi trong khi agent làm: trước hành động quan trọng, so revision/điều kiện. Kế hoạch dựa trên dữ liệu cũ chuyển sang cần xem lại. Module lỗi thì kết quả chung đánh dấu phần thiếu, các phần độc lập vẫn có thể dùng.

Mỗi nhiệm vụ có ngân sách model calls, thời gian và chi phí. Agent con lấy ngân sách từ nhiệm vụ cha, không tạo thêm hạn mức. Chạm giới hạn thì lưu kết quả đang có và báo phần chưa làm. Nhắc việc theo lịch anh chọn, có giờ yên lặng và tắt/hoãn; không tăng tần suất vì anh chưa phản hồi.

### Độ tin cậy của chat

Lưu sự kiện đầu vào trước khi xác nhận đã nhận; chỉ xử lý nghiệp vụ một lần cho cùng event ID. Lưu thay đổi nghiệp vụ và sự kiện cần gửi trong cùng transaction, worker gửi sau. Sự kiện trùng hoặc nút bấm lặp không tạo thêm task/job/hành động. Hai tin khác ID có nội dung giống nhau không tự bị coi là trùng: người dùng có thể cố ý tạo hai việc.

Tin đến sai thứ tự không được ghi đè trạng thái mới bằng trạng thái cũ. Kiểm tra revision khi commit; hai yêu cầu trên chat và web cùng sửa một record phải phát hiện xung đột và tính lại hoặc hỏi anh. Worker khởi động lại tiếp tục từ trạng thái lưu, không chạy lại toàn bộ hội thoại.

Gửi tin retry hữu hạn với backoff theo hạn mức kênh. Khi không biết nhà cung cấp đã nhận tin chưa, dùng cơ chế đối soát/chống trùng nếu có; không hứa giao đúng một lần khi kênh không bảo đảm. Lỗi gửi chỉ retry thông báo, không chạy lại công việc. Khi kênh bị ngắt, giữ kết quả trên web, hiển thị lỗi kết nối và cho gửi lại sau khi nối lại. Tin quá hạn được bỏ hoặc gom thành tổng hợp mới, không dồn toàn bộ nhắc việc cũ.

Thông báo mặc định chỉ gồm câu hỏi cần trả lời, kết quả việc đã giao và bản tin theo lịch anh chọn. Gom thay đổi ít quan trọng, không gửi đồng thời nhiều kênh; trước lúc gửi kiểm tra quyền, giờ yên lặng và tính còn phù hợp. Không tự vượt giờ yên lặng nếu chưa có loại ngoại lệ anh cấu hình.

## 13. Mức tự chủ của ban trợ lý

| Mức | Hành vi | Ví dụ |
|---|---|---|
| Gợi ý | Đọc nguồn được cấp, phân tích và tạo phương án | Kế hoạch tuần |
| Chuẩn bị | Tạo artifact trong phạm vi đã giao | Bản nháp, patch, danh sách mua sắm |
| Thực hiện giới hạn | Chạy tác vụ theo quyền thường trực rõ | Chạy test, ghi task nội bộ, nhắc theo lịch đã chọn |
| Duyệt tác động | Trình nội dung/đích cụ thể trước hành động cần duyệt | Gửi email, đổi lịch có người khác, thanh toán, deploy |

Quyền có phạm vi dữ liệu, loại hành động, giới hạn và hạn dùng. Không hỏi đi hỏi lại cho các thao tác đã được cấp quyền trong phạm vi. Thay nội dung hoặc đích của hành động đã duyệt cần kiểm tra quyền lại. Có thể thu hồi quyền và dừng module.

Không mặc định bật thu âm, đọc màn hình liên tục hoặc nhập toàn bộ inbox để “hiểu anh”. Đời sống có thể bắt đầu từ các cam kết do anh nhập. Trong các tình huống cần chuyên môn, trợ lý vẫn hữu ích để tổ chức dữ liệu và chuẩn bị câu hỏi; mức tự chủ được xét theo hành động thực tế.

### Danh tính, duyệt và dữ liệu trên kênh chat

Liên kết kênh từ phiên web đã đăng nhập bằng mã một lần có hạn dùng; xác minh tài khoản và cuộc trò chuyện đích trước khi gửi dữ liệu cá nhân. Xác thực sự kiện theo cơ chế chính thức của provider, giới hạn lưu lượng và từ chối tài khoản chưa liên kết. V1 chỉ nhận chat riêng; group chat chưa được cấp quyền. Thu hồi kênh chặn đầu vào, gửi ra và các yêu cầu duyệt đang chờ của kênh đó; anh quản lý lại từ web.

Mỗi lần duyệt kiểm tra người gửi, quyền hiện tại, đúng hành động, revision, hạn dùng và trạng thái chưa sử dụng. “OK” chỉ là duyệt khi hội thoại tham chiếu duy nhất một yêu cầu hợp lệ; còn mơ hồ thì hỏi lại. Yêu cầu cũ hoặc nội dung đã đổi phải được trình lại. Hành động trong quyền thường trực vẫn chạy mà không hỏi lại.

Nội dung trích dẫn, tin chuyển tiếp và tài liệu đính kèm là dữ liệu, không tự cấp quyền hoặc trở thành chỉ thị từ anh. Token kênh lưu phía server, không đưa vào prompt/log nội dung; có cách thay token khi thu hồi.

Chat qua bên thứ ba có thêm bản sao dữ liệu ngoài ứng dụng. Mặc định gửi tóm tắt tối thiểu; dữ liệu nhạy cảm và artifact dài xem qua web đã đăng nhập, không dùng link công khai như quyền truy cập. Chính sách xóa phân biệt bản sao trong hệ thống với lịch sử tại provider; không hứa xóa được bản sao ngoài quyền kiểm soát. Chốt thời hạn lưu chat thô trước dùng thật, giữ provenance tối thiểu theo chính sách xóa đã công bố.

## 14. Học về anh và cải thiện chính hệ thống

Ba vòng riêng:

- Hiểu ngữ cảnh: cập nhật deadline, mục tiêu, lịch và kết quả có nguồn. Suy luận về sở thích hiển thị là đề xuất, cho anh sửa.
- Điều chỉnh cách hỗ trợ: thử nhịp nhắc, độ dài báo cáo, cách ước lượng và cách dạy. So với cách cũ trên tác vụ tương đương; dữ liệu ít chỉ kết luận thăm dò.
- Nâng cấp skill/module: phát hiện lỗi → đề xuất phiên bản → kiểm thử hồi quy và tình huống mới → chạy thử có giới hạn → phát hành trong quyền được cấp → quay lại nếu kém hơn.

Không fine-tune trên nhật ký cá nhân trong V1. Không để candidate đổi tiêu chí chấm của chính nó. Lời khen, accept hoặc tự phê bình của AI chỉ là tín hiệu, không phải bằng chứng chất lượng độc lập.

## 15. Ý tưởng khác biệt đáng làm

**Một việc phục vụ nhiều mục tiêu:** khi task thật có cơ hội luyện kỹ năng, hệ thống gắn một bài tập ngắn vào task đó và chỉ tính một lần thời gian. Anh chọn làm nhanh hoặc học sâu.

**Xem tác động trước khi nhận thêm việc:** nhập “thêm dự án 6 giờ/tuần”, hệ thống chỉ ra mục tiêu/cam kết nào sẽ mất thời gian và đưa phương án. Đây là phân tích theo giả định công khai, không dự báo chắc chắn cuộc sống.

**Chế độ ngày ít sức:** từ check-in chủ động của anh, rút kế hoạch xuống việc bắt buộc và phiên bản tối thiểu của thói quen. Ngày hôm sau không tự bù bằng lịch quá tải.

**Bản đồ việc chưa khép lại:** gom những việc chờ người khác, chờ kết quả, quyết định sắp hết hiệu lực và tác vụ AI chưa xác minh. Mỗi mục có chủ sở hữu và bước tiếp theo, giảm việc anh phải nhớ trong đầu.

## 16. Stack đề xuất sau review ngân sách

Đề xuất hiện hành: **TypeScript + Hono + Cloudflare Workers Free + D1 + Queues + Cron + DeepSeek V4 Flash qua OpenRouter**. Web nhẹ dùng cùng lõi và dữ liệu với Telegram. Đây là hướng triển khai đề xuất sau khi anh chốt ngân sách 1–2 USD/tháng; chưa provision hoặc kiểm chứng runtime.

- Telegram nhận webhook; ingress chỉ xác thực và lưu inbox/job, không chờ model.
- Queue consumer xử lý bước ngắn; D1 giữ job/outbox, cron mỗi 5 phút phục hồi dispatch thiếu và nhắc đến hạn.
- D1 thay SQLite file/WAL trên host; dùng batch/conditional SQL và kiểm thử atomicity tương ứng.
- Hono thay Next.js ở pilot chat là chính; admin Worker được bảo vệ riêng bằng Access.
- DeepSeek gọi qua OpenRouter adapter có schema, timeout và budget; chọn ưu tiên tắt reasoning nếu endpoint hỗ trợ rõ, chưa cần multi-agent runtime.
- Node.js LTS là toolchain local; cloud chạy Workers. Coding executor dài cần hạ tầng khác ở chặng sau.

Phương án Next.js + Node worker + SQLite WAL trên VM trước đây là lựa chọn dự phòng khi có host/ngân sách phù hợp, không còn là mặc định pilot. Không coi cloud DB là local-first; khả năng xuất/xóa dữ liệu vẫn bắt buộc.

Tài liệu để bắt đầu coding:

- [Blueprint hạ tầng](engineering/infrastructure.md): topology, tài nguyên, secrets, job/queue, quyền, backup và phát hành.
- [Review tech stack](engineering/tech-stack-review.md): lựa chọn, trade-off, module và rủi ro cần kiểm chứng.
- [Chuẩn bị skill](engineering/skills-preparation.md): skill phát triển, skill bổ sung và capability chatbot.
- [Nghiên cứu giá/hạn mức](research/telegram-infrastructure-options.md): nguồn chính thức, ví dụ chi phí, phương án dự phòng.

Chưa có benchmark, package hoặc lockfile; chỉ pin phiên bản sau scaffold và các kiểm tra tương thích. 24/7 theo sự kiện không đồng nghĩa một process hoặc agent liên tục chạy; free tier chưa có bằng chứng đạt uptime cho pilot.

## 17. Lộ trình tạo giá trị tích hợp

Các mốc dưới là ước lượng sơ bộ cho một người phát triển quen stack có AI hỗ trợ, cần điều chỉnh theo dữ liệu và connector thật.

| Chặng | Thời lượng dự kiến | Bàn giao | Điều kiện chuyển tiếp |
|---|---|---|---|
| A. Chốt dữ liệu và kênh | Ước lượng lại sau chọn kênh | Một tuần mẫu, kênh chat riêng, múi giờ, nhịp thông báo, quyền và nơi chạy | Xác minh khả năng kênh, liên kết danh tính và dữ liệu tối thiểu |
| B. Bản chat tích hợp đầu | Ước lượng sau thử kết nối | Goals + Work + Life + Habits ở độ sâu nhỏ; chat, web tối giản, worker, inbox/outbox bền vững | Năm luồng chat chạy trọn; restart, sự kiện trùng, duyệt cũ và sửa đồng thời được kiểm tra |
| C. Mở rộng thực thi | Sau khi B đạt nghiệm thu | Skill registry, một skill tạo artifact, quản lý lỗi và hạn mức | Job có evidence; lỗi gửi tin không chạy lại công việc |
| D. Coding và học tập | Ước lượng theo executor | Một executor coding, một kỹ năng cần luyện, hai chế độ làm/học | Task có patch/test; học có bài tự làm để đối chiếu |
| E. Kết nối và tối ưu | Theo nhu cầu thực, từng kết nối | Calendar/notes/tasks, memory refinement, skill versions | Mỗi kết nối giảm thao tác thực và không làm mất quyền kiểm soát |

Chặng B xây một hành trình xuyên module. Web ban đầu chỉ cần hôm nay, kế hoạch, chi tiết job và cài đặt quyền/kênh; bản đồ đầy đủ tăng độ sâu sau. Ước lượng cũ chưa bao gồm vận hành kênh chat nên không dùng làm cam kết cho phạm vi mới.

## 18. Các hạng mục triển khai theo thứ tự

1. Chọn một kênh, xác minh nhận/gửi và khả năng triển khai; chốt timezone, lưu giữ dữ liệu, nơi chạy và ngân sách.
2. Domain records và fixture một tuần; thiết kế request/job ID, revision, danh tính, grants và approval records.
3. Liên kết/thu hồi kênh; adapter văn bản, inbox/outbox bền vững và worker tối thiểu; xác nhận nhận việc sau khi lưu.
4. Nhập nhanh qua chat/web; giải quyết tham chiếu, ngày giờ, câu hỏi chờ; sửa/dừng rõ đối tượng.
5. Timeline và kiểm tra xung đột deterministic; planner có nguồn, revision và lý do thay đổi.
6. Hoàn thành năm luồng chat; web tối giản dùng cùng lõi và dữ liệu; cấu hình thông báo, giờ yên lặng, link có xác thực.
7. Kiểm tra sự kiện trùng, sai thứ tự, restart, lỗi kênh, thu hồi quyền, duyệt cũ và cập nhật đồng thời trước dùng thật.
8. Skill tạo artifact có verify; module registry bật/tắt; hạn mức job và chống trùng tác động ngoài.
9. Hoàn tất sửa/xóa/export bộ nhớ và chat theo chính sách; backup/restore tôn trọng dữ liệu đã xóa và quyền đã thu hồi.
10. Chạy thật hai tuần, ghi thao tác gây phiền và lỗi điều phối; chọn extension tiếp theo từ kết quả.

## 19. Tiêu chí nghiệm thu thực dụng

Các ngưỡng dưới là mục tiêu thử nghiệm, không phải kết quả đã đạt:

- Anh đọc tổng quan trong tối đa hai phút và biết việc tiếp theo, việc AI đang làm và điều cần mình quyết định.
- Thay một cam kết phản ánh sang kế hoạch các module liên quan; không trùng slot hoặc đếm thời gian hai lần.
- Ràng buộc cố định không bị đổi âm thầm; kế hoạch không khả thi phải hiển thị rõ.
- Mọi task đánh dấu AI đã làm xong có artifact hoặc bằng chứng phù hợp.
- Đóng browser và khởi động worker lại vẫn thấy đúng trạng thái; tool kết quả mơ hồ không bị lặp mù.
- Tắt Thói quen vẫn dùng Công việc được; bật lại không nhân đôi habit occurrences.
- Dữ liệu cũ/thiếu được hiển thị đúng; không đoán anh đã tập, ngủ hay học.
- Skill mới dùng được hợp đồng chung mà không cần sửa lõi điều phối chỉ để biết tên skill đó.
- Các thao tác ngoài quyền bị chặn trong test; thao tác đã cấp quyền hợp lệ không liên tục hỏi lại.
- Xóa memory làm nó biến mất khỏi retrieval và summary; backup restore có quy tắc xóa rõ.

- Năm luồng hằng ngày hoàn tất qua chat; chỉ mở web khi cần chi tiết hoặc quản trị.
- Tin trùng/nút bấm lặp không nhân đôi tác động; tin đến muộn và sửa đồng thời không ghi đè revision mới.
- Nút duyệt cũ, hết hạn, sai tài khoản hoặc đã thu hồi không thực thi; “OK” mơ hồ không được hiểu thành duyệt.
- Kênh ngắt hoặc gửi tin thất bại không làm mất kết quả và không chạy lại job đã xong.
- Giờ yên lặng được giữ; nối lại không gửi dồn nhắc việc hết hạn; link chi tiết không bỏ qua đăng nhập.
- “Mai” quanh nửa đêm, tin đến trễ, đổi múi giờ và sửa/xóa tin nguồn có fixture hành vi rõ.

Đánh giá chat sau 14 ngày: tỷ lệ luồng hoàn tất không cần web, số lần phải sửa hiểu nhầm, số thông báo không hữu ích theo anh đánh giá, thời gian từ nhận đến phản hồi/kết quả và số tác động trùng. Tách độ trễ model/job khỏi độ trễ giao tin; chưa đặt ngưỡng tốc độ trước khi đo Telegram và DeepSeek trên hạ tầng pilot.

Đánh giá sau 14 ngày bằng thời gian anh phải dùng để điều hành hệ thống, số lần sửa kế hoạch, cam kết bị bỏ sót, việc thật hoàn tất và sự hữu ích anh đánh giá. Sau 4–6 tuần, đo thêm kỹ năng tự làm và tính bền vững của thói quen. Không gộp công việc, gia đình và nghỉ ngơi thành một điểm hiệu suất cuộc sống.

## 20. Đầu vào đã chốt và quyết định còn mở

Cập nhật từ anh ngày 08/09/2026: dùng Telegram, yêu cầu hoạt động 24/7 trong giai đoạn thử; mục tiêu xây chính chatbot này và public lên GitHub, cam kết tìm và apply ít nhất 5 job/tuần, thói quen chạy bộ 3 buổi/tuần. Hiện chỉ có một thói quen được xác nhận; không cần thêm thói quen thứ hai để bắt đầu.

[Phạm vi thử Telegram và tuần mẫu](telegram-pilot.md) ghi chi tiết dữ liệu, lựa chọn kết nối và điều kiện vận hành. Yêu cầu 24/7 đã chốt; anh chưa có VPS/server, anh chọn DeepSeek qua OpenRouter với khoảng 1–2 USD/tháng (tạm hiểu tổng server + API), Cloudflare Free là đề xuất sau review, tài khoản/tài nguyên và triển khai thực tế chưa có. Chưa xác nhận phạm vi bản công bố/deadline chatbot, tiêu chí job, lịch rảnh, thời lượng chạy, giờ bản tin, retention và quyền thường trực. Apply 5 job/tuần là chỉ tiêu định kỳ; chưa phải năm lịch hẹn cố định.

Bản đầu dùng nhập chủ động; không tự gửi hồ sơ tuyển dụng hoặc public repo từ việc ghi nhận mục tiêu này. Tác động ngoài cần nội dung/đích và quyền tương ứng theo mục 13. Chưa hỗ trợ voice/file/group chat.

Bản review bổ sung: [Review hướng chat — 08/09/2026](reviews/chat-first-review.md). Kiểm tra tài liệu Telegram đã được bổ sung vào phạm vi thử; chưa thử bot thực tế hoặc kiểm thử phần mềm.

Tài liệu này xác định hướng sản phẩm hiện hành. Phần mềm, tích hợp và khả năng tự cải thiện cần được triển khai và kiểm chứng theo từng chặng.
