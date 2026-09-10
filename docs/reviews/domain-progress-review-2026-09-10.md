# Review mô hình và tiến độ Navi — 10/09/2026

Phạm vi: đọc code và schema tại commit `1191cd6`, đối chiếu yêu cầu hội thoại và phần thuật ngữ trong `docs/personal-assistant-product.md`. Đây là review tĩnh, chưa chạy test tái hiện các lỗi mới và chưa thay đổi runtime hoặc dữ liệu pilot.

## Kết luận

Đủ để thử luồng Telegram cơ bản nhưng chưa đủ chắc để mở rộng mô hình mục tiêu, task và thói quen. Ưu tiên tính đúng của dữ liệu trước thêm chart. Những test đã qua ở lượt trước chưa chứng minh các trường hợp dưới đây.

## Phát hiện ưu tiên cao

1. **Chưa có task thuộc mục tiêu.** Bảng `tasks` và các migration hiện có không có liên kết goal/project; hai đường tạo task trong `store.ts` đều tạo task độc lập. Không thể truy vấn việc tiếp theo của một mục tiêu hay phân biệt task riêng bằng dữ liệu thật.
2. **Ngưỡng thói quen chỉ được hiển thị.** `dailyHabitRule` đọc số phút để tạo câu, còn `stageCheckIn` ghi 1 ngày cho mọi câu khớp habit. “Thiền 2 phút” có thể được tính đạt ngưỡng 5 phút. Cần lưu lượng thực hiện, đơn vị và tiêu chí đạt; thiếu lượng thì hỏi hoặc ghi nhận thực hiện nhưng chưa xác định đạt ngưỡng.
3. **Cadence bị ép thành hằng ngày.** `planItemValues` và `ensurePlanItems` cố định target 7, kể cả tiêu đề “chạy bộ 3 buổi”. Việc đọc tiến độ còn ghi lại target trong DB. Hằng ngày nên là mặc định, cần giữ lịch khác được người dùng chỉ định; chuyển đổi phải có bước migration rõ ràng.
4. **Ngày thực hiện, chuỗi ngày và chống trùng chưa thống nhất.** `habitStreaks` chỉ đọc một tuần và bắt đầu từ hôm nay, nên chưa check-in đầu ngày đã hiện 0 và không nối qua tuần. Ngày được suy lại từ note. Sửa note trong luồng xác nhận thay `normalized_note` bằng văn bản, làm mất khóa chống trùng `habit:date`; check-in lại có thể cộng thêm. Cần ngày thực hiện độc lập với note và uniqueness tại DB.
5. **Đo tiến độ vẫn đoán từ số đầu tiên.** `metricFor` và `checkInQuantity` lấy số đầu tiên trong văn bản. Tên phiên bản/số phút/số trang có thể trở thành target hoặc số lượng kết quả sai. Cần cấu trúc measurement có unit và xác nhận cách đo khi tạo mục.

## Lỗi tương thích và vận hành liên quan

- Truy vấn legacy trong `/progress` thiếu `source_update` dù phía sau dùng trường đó để lọc các lượt đã chuyển sang check-in. Khai báo type không thêm cột SQL; lịch sử đã chuyển có thể xuất hiện hai lần. Dùng `NOT EXISTS` trên toàn bộ check-in thay vì so với danh sách chỉ lấy 21 dòng.
- `ensurePlanItems` chép lại các lượt legacy mỗi khi đọc; xoá một check-in đã chuyển mà giữ sự kiện gốc có thể khiến lượt đó xuất hiện lại. Cần đánh dấu migration hoặc tombstone, không tự tái tạo dữ liệu đã xoá.
- `/progress` ghép tối đa 20 note cùng tiêu đề mục lặp lại và lịch sử legacy thành một delivery. Không có giới hạn tổng chuỗi ở đây; payload dài có thể bị Telegram từ chối. Cần phân trang hoặc tách tổng quan và lịch sử.
- Parser câu thiền/nghe có ngày chưa gắn `command.date`, nên kiểm tra ngày/tuần ở luồng xử lý không chạy như câu chạy bộ có ngày. Cần chung một parser ngày cho mọi habit và giữ ngày gốc qua bước chọn mục.

## Mô hình đề xuất

| Khái niệm | Ý nghĩa | Cấu trúc tối thiểu |
|---|---|---|
| Mục tiêu | Kết quả muốn đạt | ID bền qua tuần, tiêu chí đạt, hạn nếu có, cách đo có đơn vị |
| Task | Hành động cụ thể | ID, trạng thái, hạn/giờ nhắc, goal_id tuỳ chọn |
| Task thuộc mục tiêu | Task có goal_id | Cùng luồng tạo/hoàn thành task độc lập |
| Task độc lập | Task chưa gắn mục tiêu | Không bắt người dùng tạo mục tiêu trước |
| Thói quen | Hành vi lặp theo lịch | ID bền qua tuần, cadence, ngưỡng, đơn vị, ngày bắt đầu |
| Check-in thói quen | Bằng chứng thực hiện một ngày | habit_id, local_date, lượng thực tế, nguồn, note, trạng thái đạt |
| Kế hoạch tuần | Các mục được chọn để tập trung | Tham chiếu mục tiêu/task/habit; không tạo lại danh tính habit mỗi tuần |

Cam kết hiện mang hai nghĩa: nghĩa vụ có thời điểm trong tài liệu và chỉ tiêu apply theo tuần trong code. Cần thống nhất trước mở rộng: chỉ tiêu tuần có thể là tiêu chí của mục tiêu; không bắt nhập lại cùng nội dung ở cả mục tiêu và cam kết. Không tự gộp dữ liệu đang có.

## Góc nhìn Telegram

- `/today`: 1–3 việc ưu tiên có lý do rõ ràng (do anh chọn hoặc theo hạn), task thuộc mục tiêu, task độc lập, thói quen đến lịch hôm nay. Dùng “chưa ghi nhận”, không suy thành bỏ lỡ.
- `/progress`: kết quả mục tiêu, số task hỗ trợ đã xong được ghi riêng, lịch thực hiện thói quen theo ngày. Hoàn thành mọi task không tự chứng minh đã đạt mục tiêu.
- Lịch sử chi tiết ở thao tác riêng/phân trang. Bỏ các dòng tóm tắt apply/chạy bị lặp với bảng chung. Thanh tiến độ chỉ hiện khi có mẫu số mang nghĩa rõ ràng.
- Chuỗi ngày là thông tin phụ; trọng tâm là hôm nay cần gì và đã thực hiện gì. Quy tắc chuỗi phải xét ngày đến lịch và cho hôm nay cơ hội hoàn thành trước khi coi là đứt chuỗi.

## Trình tự triển khai đề xuất

1. Sửa dữ liệu và phép tính habit: ngày thực hiện, ngưỡng, lịch, chống trùng khi sửa/xoá, streak qua tuần; giữ nguyên bằng chứng cũ, không suy diễn thêm check-in.
2. Thêm liên kết task–goal tuỳ chọn và danh tính mục tiêu/habit bền qua tuần. Migration bổ sung, kiểm tra đối soát lịch sử trước chuyển cách đọc.
3. Làm gọn `/today` và `/progress`, phân trang lịch sử, loại bỏ số liệu lặp và giới hạn độ dài tin nhắn.
4. Test các tình huống thực: dưới/đủ ngưỡng, hai câu cùng ngày, sửa note rồi check-in lại, qua nửa đêm/qua tuần, lịch 3 ngày/tuần, xoá dữ liệu legacy, task độc lập và task thuộc mục tiêu, lịch sử dài.

Không cần thêm dịch vụ, microservice hay AI để tính các số liệu này. Tách quy tắc measurement/habit/task và định dạng Telegram khỏi bộ xử lý D1 để thay đổi một quy tắc không phải sửa nhiều nhánh hội thoại.
