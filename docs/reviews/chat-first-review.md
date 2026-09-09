# Review thiết kế trợ lý qua chat

Ngày: 08/09/2026. Phạm vi: bản thiết kế cá nhân hiện hành sau khi bổ sung chat. Đây là rà soát tài liệu bởi một AI, không phải hội đồng độc lập, kiểm thử phần mềm hoặc xác minh khả năng của provider.

Nguồn nội bộ: [Bản thiết kế hiện hành](../personal-assistant-product.md). Review này bổ sung cho mục tiêu cá nhân; không áp dụng các điều kiện thương mại trong review tháng 8.

> Cập nhật sau review: anh đã chọn Telegram và yêu cầu 24/7. Đã kiểm tra tài liệu Bot API cho nhận update; xem [phạm vi thử](../telegram-pilot.md). Những mục “chọn kênh” bên dưới là ghi nhận tại thời điểm review và đã được giải quyết; host, ngân sách và thử kết nối thực tế còn mở.

> Review hạ tầng tiếp theo đã đề xuất Cloudflare Free/webhook theo ngân sách 1–2 USD; xem [bộ chuẩn bị coding](../engineering/infrastructure.md). Worker trong review này chỉ trách nhiệm xử lý nền, không bắt buộc process thường trực.

## Kết luận

Hướng chat phù hợp với mục tiêu giảm công quản lý hằng ngày. Giữ module nghiệp vụ và dữ liệu chung; thêm tiếp nhận hội thoại, liên kết danh tính và phân phối thông báo. Lõi điều phối phải dùng được từ cả chat và web. Worker và độ tin cậy của nhận/gửi thuộc bản tích hợp đầu.

Thiết kế đã đủ để bắt đầu chọn kênh và làm thử kết nối hẹp. Chưa đủ bằng chứng để cam kết vận hành 24/7, thời gian phản hồi hoặc độ ổn định trên một nền tảng cụ thể.

## Các khoảng thiếu đã bổ sung vào thiết kế

| Vấn đề phát hiện | Hệ quả nếu bỏ sót | Bổ sung trong bản thiết kế |
|---|---|---|
| Chưa phân vai chat/web | Hai luồng sản phẩm và hai trạng thái khác nhau | Mục 4, 7, 10: lõi và record dùng chung; chat hằng ngày, web chi tiết/quản trị |
| Chưa xác minh người dùng và cuộc trò chuyện đích | Dữ liệu/quyền gắn nhầm tài khoản | Mục 11, 13: liên kết từ web, ID ổn định, thu hồi kênh, V1 chat riêng |
| Đại từ và câu trả lời ngắn mơ hồ | Sửa hoặc duyệt nhầm việc | Mục 7, 13: reply/reference rõ, pending request, hỏi lại khi có nhiều đối tượng |
| Tin đến trễ, sai thứ tự, giờ tương đối | Sai lịch hoặc ghi đè dữ liệu mới | Mục 7, 12: thời điểm gửi/nhận, múi giờ, revision và xử lý xung đột |
| Tin/nút được gửi lại, worker khởi động lại | Nhân đôi task hoặc tác động | Mục 11, 12: inbox bền vững, khóa event, transaction và đối soát |
| Duyệt cũ hoặc quyền đã thu hồi | Chạy hành động khác nội dung đã duyệt | Mục 11, 13: payload bất biến, revision, hạn dùng, kiểm tra quyền lúc thực hiện |
| Trộn trạng thái công việc và thông báo | Retry gửi tin thành chạy lại công việc | Mục 11, 12: job và outbound delivery độc lập, outbox bền vững |
| Thông báo phân tán theo module | Spam và dồn nhắc việc quá hạn | Mục 10, 12: phân phối tập trung, gom tin, giờ yên lặng, kiểm tra tính còn phù hợp |
| Sửa/xóa tin bị hiểu là hoàn tác | Người dùng tưởng tác động đã được hủy | Mục 7: lệnh sửa/dừng rõ, phân biệt hủy với hoàn tác |
| Dữ liệu chat có bản sao bên ngoài | Hứa riêng tư/xóa dữ liệu vượt khả năng | Mục 13: gửi tối thiểu, link xác thực, retention và giới hạn xóa tại provider |
| Worker được làm quá muộn | Chat nhận việc nhưng mất tiến độ khi đóng web | Mục 12, 17, 18: worker cùng inbox/outbox từ chặng B |
| Nghiệm thu chỉ nhìn web | Không đo được giá trị giảm thao tác | Mục 19: năm luồng qua chat, hiểu nhầm, thông báo và độ trễ theo từng bước |

## Quyết định cần chốt trước triển khai liên quan

| Quyết định | Cách chốt | Thời điểm |
|---|---|---|
| Một kênh chat đầu tiên | Ưu tiên kênh anh dùng; kiểm tra tài liệu chính thức và thử nhận/gửi, danh tính, hạn mức, gửi chủ động, nút/link | Chặng A |
| Máy chạy và cách nhận sự kiện | Chọn cách nhận được provider hỗ trợ, thử mất kết nối/restart; chốt chạy liên tục hay theo giờ | Chặng A |
| Truy cập web từ điện thoại | Chọn địa chỉ truy cập có xác thực; thử mở link task từ điện thoại ngoài máy phát triển | Trước dùng thật |
| Nhịp thông báo và múi giờ | Anh chọn bản tin, giờ yên lặng và ngoại lệ nếu có | Onboarding |
| Quyền thường trực | Ghi rõ loại việc được tự chạy, giới hạn và cách thu hồi | Trước bật thực thi |
| Lưu giữ dữ liệu | Chốt hạn lưu chat thô, log, backup và cách xử lý xóa/khôi phục | Trước nhập dữ liệu thật |
| Ngân sách | Chốt hạn mức model/job và ứng xử khi chạm hạn mức | Trước bật worker AI |

Không cần chọn nhiều kênh, voice, file, group chat hoặc framework điều phối mới để thử hành trình đầu. Chỉ mở rộng khi dữ liệu sử dụng cho thấy cần.

## Bộ tình huống nghiệm thu đề xuất

Các case dưới chưa được chạy; dùng làm đầu vào triển khai và kiểm thử.

1. Nhắn tạo task; nhận lại cùng event ba lần; chỉ có một task và một job logic.
2. Hai tin khác ID cùng nội dung; không tự loại bỏ yêu cầu thứ hai như sự kiện trùng.
3. Worker dừng sau commit trước khi gửi phản hồi; khởi động lại giữ đúng task và tiếp tục giao kết quả.
4. Provider timeout khi gửi kết quả; task vẫn hoàn thành, không thực thi lại; delivery ghi nhận mức chắc chắn thực tế.
5. Chat và web cùng sửa một task; request dùng revision cũ không ghi đè thay đổi mới.
6. Có hai task và hai yêu cầu duyệt; nhắn “OK” hoặc “dời việc đó” không gây hành động nếu thiếu tham chiếu duy nhất.
7. Duyệt kế hoạch đã sửa, hết hạn, bấm lặp hoặc sau thu hồi kênh; không tạo tác động trái quyền hoặc tác động thứ hai.
8. Nhắn “mai” trước nửa đêm nhưng nhận sau nửa đêm; kiểm tra ngày cụ thể theo múi giờ và thời điểm tin gốc, xử lý mơ hồ trước hành động.
9. Ngắt kênh trong giờ yên lặng rồi nối lại; kết quả vẫn xem trên web, không dồn nhắc việc quá hạn.
10. Sửa/xóa tin nguồn sau khi tạo cam kết; không âm thầm hủy cam kết; lệnh sửa/dừng riêng cho biết tác động thực tế.
11. Tài khoản chưa liên kết, group chat hoặc link task chưa đăng nhập; không đọc/sửa dữ liệu cá nhân.
12. Tin trích dẫn yêu cầu mở rộng quyền; không trở thành chỉ thị được cấp quyền.
13. Xóa bộ nhớ/chat theo chính sách rồi restore backup; dữ liệu đã xóa không trở lại retrieval, quyền đã thu hồi không được khôi phục hiệu lực.
14. Chạy năm luồng bản tin sáng/giao việc/thêm cam kết/phát sinh/báo kết quả trên một tuần mẫu; đo chỗ phải mở web và chỗ phải sửa hiểu nhầm.

## Giới hạn của review

Chưa kiểm tra API, điều khoản hoặc hạn mức của nền tảng nào; cần làm sau khi chọn kênh. Chưa có code nên chưa chứng minh chống trùng, quyền, khôi phục hoặc độ trễ. Các thay đổi ở đây là yêu cầu thiết kế và tiêu chí kiểm chứng, không phải tính năng đã hoàn thành.
