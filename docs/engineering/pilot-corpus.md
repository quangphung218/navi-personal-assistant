# Pilot conversation corpus

Corpus này là regression suite cho cách anh có thể nói với Navi trong pilot. Mỗi case là dữ liệu giả lập, không sao chép nội dung Telegram riêng tư hoặc credential.

## Hai tầng kiểm tra

- `pilotConversationCorpus`: câu đơn lẻ phải giữ đúng command kind. Các câu `unknown` là yêu cầu an toàn: chúng không được tự tạo hoặc sửa dữ liệu.
- `pilotReplyContextCorpus`: một câu source và một câu reply. Context pack phải đưa source được reply vào structured assistant với nhãn `Tin anh đang trả lời`.

## Cách bổ sung sau pilot

Khi Navi hiểu sai hoặc chậm bất thường, ghi một case đã khử định danh vào fixture cùng kết quả mong đợi: command kind, có cần xác nhận hay cần hỏi lại. Không ghi tên công ty, CV, URL riêng, ID Telegram, nội dung nhạy cảm hoặc toàn bộ transcript.

Nếu case chứng minh một parser rule mới, thêm test D1/Worker ở `tests/tasks.test.ts`. Nếu nó chỉ là trường hợp model cần trả lời, thêm vào reply-context corpus để kiểm tra context builder, không biến nó thành mutation local.
