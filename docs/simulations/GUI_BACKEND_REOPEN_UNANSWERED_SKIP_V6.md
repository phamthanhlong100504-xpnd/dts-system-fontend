# Gửi backend: mở lại Bỏ qua 10s sau RESTART khi chưa lưu phản ứng

Frontend đã tích hợp `dts-controlled-video-shortcuts-v1-20261103`, backend kit revision 3/V34. Chủ dự án muốn: tình huống thi RANDOM/PRESET bị lỗi video → Thử tải lại → nếu chưa có phản ứng đầu tiên được lưu, có thể dùng lại Bỏ qua 10s. Frontend v6 đã sửa báo lỗi quá nhạy, tách lỗi GET capabilities khỏi lỗi video, và dùng capability server làm quyết định. Không cần đổi payload frontend nếu backend phản ánh quyền mới qua API hiện tại.

Hiện `SimulationExamService.restart(...)` quay về 0, xoay nonce, giữ first response. `SimulationShortcutRules.intro(...)` trả ALREADY_USED nếu `Protocol.skipped` còn chứa ordinal; cờ này vẫn giữ qua RESTART dù `frame.responseMs == null`. Frontend không thể tự bỏ qua kiểm tra đó hoặc tự tua mà bảo toàn đồng hồ chấm điểm.

## Thay đổi cần thực hiện

1. Chỉ target EXAM đã opt-in, IN_PROGRESS, đúng frame hiện tại chưa hoàn thành và **first response thực sự null** mới được mở lại Skip khi một RESTART mới hợp lệ được chấp nhận. Null khác 0: phản ứng tại 0 ms vẫn đã được lưu.
2. Cùng transaction/lock hiện tại, sau kiểm tra owner/license/position/nonce/event, RESTART về checkpoint 0 và xoay nonce như cũ; mở lại Skip cho đúng ordinal chưa phản ứng. Giữ event/receipt/history, vị trí khác, completion reasons và bank/scoring/preset snapshots.
3. Retry cùng RESTART event phải idempotent; receipt cũ không được reset cờ Skip của segment mới hơn. Không reset qua GET, cấp/đổi URL, heartbeat, role hay userId do client gửi.
4. GET state trả nonce/checkpoint mới. Trước START vẫn NOT_PLAYING. Sau resolve playback + START 0, `skipIntro.available=true` nếu duration/cửa sổ điểm cho phép và chưa phản ứng. Skip mới dùng event mới, nonce mới; checkpoint vẫn đúng 10000. Chặn Skip hai lần trong cùng segment.
5. Nếu first response đã lưu: giữ nguyên thời điểm/event/điểm; không mở lại Skip. Trả xác nhận mới đúng nonce cho Next; API Next hiện tại đã đủ để chốt/chuyển một phản ứng đã lưu dù decoder lỗi. Không cho Next chuyển một tình huống chưa phản ứng.
6. Không thay cửa sổ/công thức điểm, policy 35/50, duration, timestamp gốc, thứ tự/preset version, active-session slot hay luồng học lẻ/read-only. Không xóa phản ứng để “làm lại”, không tạo server elapsed giả, không cộng/trừ 10000 vào reaction, không COMPLETE giả tới duration.
7. Giữ API shape/URL hiện có nếu được. Revision/fingerprint phản ánh trạng thái mới; receipt cũ bất biến và khi retry phải đi kèm fresh current state. Client không lấy checkpoint của receipt cũ để tua lùi.
8. Không migration nếu V34 đã đủ lưu trạng thái. Giữ legacy/target chưa opt-in hoạt động như cũ; schema thiếu không được query ghi bảng không tồn tại.

## Nghiệm thu và bàn giao

- RANDOM và PRESET: Skip ở ~3s → START 10000 → chưa phản ứng → gián đoạn → RESTART → resolve + START 0 → Skip lại được một lần trên nonce mới; cùng session/position/bank/preset.
- Phản ứng 0 hoặc 17432 ms đã lưu → RESTART: giữ first response/event, Skip vẫn khóa; Next dùng proof mới và chấm/chuyển đúng một tình huống.
- Tình huống chưa từng Skip → RESTART vẫn dùng được Skip sau START. Video ngắn hoặc cửa sổ điểm trước 10s vẫn bị chặn.
- Bỏ ACK thành công của RESTART/Skip rồi retry chính event/body: không reset hoặc Skip trùng, không quay về checkpoint cũ. Retry receipt sau một segment mới hơn phải giữ state mới nhất.
- Race RESTART với Skip/Reaction/Next/Complete: transaction có thứ tự hợp lệ; không mở lại Skip sau reaction đã commit; không thay phản ứng hoặc chuyển hai ordinal.
- So sánh điểm cùng timestamp gốc giữa xem tự nhiên, Skip một lần và Skip sau unanswered restart. Media 17.432s luôn là 17432 ms, không phải 7432 hoặc 27432.
- GET/review không ghi dữ liệu; cross-user/license bị chặn. Không ghi token, URL ký hoặc reactionAcknowledgement vào log.

Trả lại patch có dry-run/apply/verify, hash/prerequisite và kết quả test PostgreSQL/transaction + HTTP runtime. Giữ code đang làm trên nhánh hiện tại; không stage/commit/push/reset hoặc tự đổi migration/dữ liệu ngoài phạm vi. Frontend sẽ tiếp tục khóa Skip khi backend còn trả ALREADY_USED.
