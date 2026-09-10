# Review sau triển khai nền dữ liệu — 10/09/2026

Phạm vi: review tĩnh commit `191ea55`, đối chiếu migration 0018 và luồng xử lý trong `src/modules/execution/store.ts`. Không chạy lại test hoặc kiểm tra dữ liệu production trong lượt này. 43 tests pass ở lần triển khai trước không bao phủ hết các tình huống dưới đây.

## Cần sửa trước khi mở rộng

1. **P1 — Sửa ghi chú làm thay đổi kết quả ngoài ý định.** Nhánh xác nhận sửa check-in (khoảng dòng 776) ghi lại `actual_value` và `met_threshold` từ note mới. Đổi “thiền 5 phút” thành “thiền buổi sáng” khiến giá trị về NULL và đạt ngưỡng về 0; ngày đã được tính biến mất khỏi tổng. Cũng không tính lại `weekly_plan_items.status` sau sửa. Tách sửa ghi chú khỏi sửa lượng/ngày; thay đổi bằng chứng cần preview rõ ảnh hưởng và tính lại trạng thái trong cùng transaction.

2. **P1 — Chống trùng chưa bao phủ dữ liệu cũ.** Migration 0018 thêm `local_date` nhưng không backfill. Dữ liệu cũ dùng khóa `habit:date` còn được tra cứu, nhưng sau sửa note khóa này bị thay bằng văn bản. Bản ghi legacy chạy bộ được copy với khóa ISO và `local_date=NULL` cũng không khớp khóa `habit:date` của lần ghi mới. Cùng ngày có thể có hai occurrence. Cần backfill có đối soát, giải quyết trùng trước đặt ràng buộc và giữ ngày độc lập với note.

3. **P1 — Lịch và thời lượng vẫn bị đoán sai.** `habitSpec` (dòng 75) trả ngay cadence daily khi thấy phút: “Thiền 5 phút, 3 buổi/tuần” thành 7 ngày. “Chạy 1 lần mỗi ngày” cũng bị hiểu thành 1 lần/tuần. `targetFrom`/`checkInQuantity` vẫn lấy số đầu tiên: phiên bản “Navi 2” có thể trở thành chỉ tiêu 2. Parse tần suất, lượng và đơn vị độc lập; hiện cách hiểu khi xác nhận kế hoạch, không suy số bất kỳ thành tiến độ.

4. **P1 — Lịch sử legacy vẫn có thể hiện hai lần.** Query `/progress` (khoảng dòng 659) chưa SELECT `source_update` nhưng dùng nó để đối chiếu check-in. Thêm trường chưa đủ vì danh sách check-in bị giới hạn 21: nên dùng `NOT EXISTS` trên toàn bộ tập dữ liệu liên quan. `ensurePlanItems` còn gắn mọi legacy apply vào cam kết hiện tại dù cam kết đã đổi ý nghĩa; chỉ chuyển khi có bằng chứng tương ứng.

## Hoàn thiện trải nghiệm sau khi số liệu đúng

- `habitStreaks` bắt đầu từ hôm nay: sáng chưa check-in đã hiện 0 dù hôm qua còn chuỗi. Giữ chuỗi đến hôm qua khi hôm nay chưa kết thúc; hiển thị trạng thái hôm nay riêng. Truy vấn qua tuần yêu cầu cùng `habit_id`, nhưng migration không backfill tuần đã lưu trữ; đổi tên còn tạo ID mới do dùng normalized title làm khóa tìm danh tính.
- Khi thiếu số phút, Navi hỏi nhưng không lưu một yêu cầu bổ sung đo lường riêng. Câu trả lời ngắn “5 phút” chưa có đường deterministic nối vào habit vừa hỏi. Lưu pending context có scope và hạn hiệu lực, kiểm tra qua nửa đêm.
- `/progress` ghép overview, tối đa 20 check-in và legacy vào một tin, chưa giới hạn tổng độ dài; `/list` cũng thêm tên goal vào từng task. Cần phân trang lịch sử và budget độ dài ở formatter, kèm test nội dung dài. Bỏ các dòng apply/chạy lặp với bảng chung.
- `/today` vẫn là tổng quan tuần cộng tối đa 6 task, chưa thể hiện riêng habit đã ghi hôm nay hay việc ưu tiên do người dùng chọn.
- `goals`/`habit_definitions` mới là nền: trạng thái goal chưa được cập nhật đồng bộ khi hoàn thành mục tiêu tuần, danh tính vẫn phụ thuộc tên; đọc tiến độ vẫn thực hiện nhiều ghi dữ liệu trong `ensurePlanItems`. Chuyển việc khởi tạo/liên kết sang lúc xác nhận kế hoạch và dùng ID khi chọn lại mục cũ.
- Task–goal hiện thêm được bằng cú pháp rõ ràng, nhưng chưa có thao tác gắn/bỏ gắn task đã tồn tại hoặc tổng task hỗ trợ theo goal. Hoàn thành task không tự chứng minh đạt kết quả mục tiêu.

## Nhóm việc đề xuất kế tiếp

**Nhóm A — Tin cậy dữ liệu:** sửa note không đổi measurement; backfill ngày/ID có đối soát; chống trùng sau sửa và với legacy; parse lịch cùng thời lượng; tính lại trạng thái và streak. Test hồi quy bằng các ví dụ trên trước deploy.

**Nhóm B — Hội thoại và hiển thị:** pending số phút; tổng quan ngắn và lịch sử phân trang; trạng thái habit hôm nay; bỏ số liệu lặp, giới hạn độ dài cho cả list và progress.

**Nhóm C — Hoàn thiện vòng đời mục tiêu:** chọn lại goal/habit bằng ID, gắn/bỏ gắn task, đồng bộ trạng thái kết quả; tách quy tắc miền khỏi formatter và D1 orchestration. Chưa cần thêm dịch vụ hay chart ảnh để hoàn thành các nhóm này.
