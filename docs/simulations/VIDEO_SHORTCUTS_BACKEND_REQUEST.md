# Bàn giao backend — Bỏ qua 10 giây mở đầu và Tiếp theo sau phản ứng

Ngày: 03/11/2026. Phạm vi: học một tình huống (Card01/02/03) và hai loại thi thử 10 tình huống RANDOM/PRESET (Card05/06). Đây là yêu cầu nghiệp vụ mới của chủ dự án, không phải lỗi parser của bản Card06.

## Yêu cầu đã nhận

1. Trong lượt luyện/thi đang chấm điểm, cho phép bỏ 10 giây mở đầu để bắt đầu quan sát sớm hơn. Mốc thời gian phản ứng vẫn là thời gian tuyệt đối của video gốc: bấm tại video 17,432 giây phải lưu 17432ms, không thành 7432ms và không cộng thêm 10 giây lần nữa.
2. Trong RANDOM/PRESET, sau khi backend đã xác nhận phản ứng đầu tiên, cho phép Tiếp theo để chuyển tình huống mà không phải đợi video kết thúc. Không hiện/cho phép khi phản ứng đang gửi, gửi lỗi hoặc chưa ghi nhận.
3. Giữ nguyên phản ứng đầu tiên, điểm/thang chấm, ngân hàng/scoringVersion, preset snapshot, lịch sử, thứ tự, quyền, owner, nonce và idempotency. Không gửi điểm hay kết quả tự tính từ frontend.
4. Hai nút nền trong, chữ trắng, ở trong video, cách phải và dưới 1,5cm. Frontend đã có component dùng chung và nút chỉ đọc trong xem lại; lượt đang chấm chưa bật khi backend chưa có hợp đồng hỗ trợ.

## Xung đột được xác nhận với hợp đồng hiện tại

`PLAYER_PROTOCOL.md` của gói bàn giao Card06, các mục “Một vị trí current” 3/4/6 và policy: START ở mediaTimeMs=0; allowSeek=false; heartbeat kiểm server elapsed và media liên tục; COMPLETE_CURRENT chỉ sau ended thật, thời gian video/elapsed tới cuối với dung sai250ms. Frontend hiện ngắt lượt khi nhận seeking. Bộ OpenAPI17 operations không có skip/advance-after-reaction. Tua currentTime hoặc gọi complete với duration giả sẽ vi phạm hợp đồng này. Thay allowSeek ở frontend không thay đổi kiểm tra server.

Vì vậy cần bổ sung thao tác backend có chủ ý. Không sử dụng cờ/hack để vô hiệu hóa kiểm tra elapsed, không gửi heartbeat giả, không phát ngầm phần đã bỏ để làm bằng chứng xem, không phát tốc độ nhanh rồi ghi thời gian khác và không đánh dấu COMPLETED ở client trước ACK.

## Đầu ra backend cần bàn giao

Tên endpoint/DTO bên dưới **chưa tồn tại**; backend chốt và cung cấp OpenAPI thực tế trước khi frontend nối. Không có HTTP request tới endpoint suy đoán trong bản frontend này.

### A. Thao tác bỏ đoạn mở đầu có kiểm soát

- Phân biệt skip-intro được cấp phép với seek tùy ý; chỉ một lần mỗi vị trí/nonce hoặc một intent được server quản lý. Chỉ cho phép trước phản ứng đầu tiên. Thời điểm đích là10.000ms của video gốc. Nếu chủ dự án muốn mỗi lần +10s thay vì bỏ đoạn mở đầu một lần, cần chốt riêng để tránh bỏ qua vùng chấm điểm.
- Server xác định đoạn mở đầu thật sự an toàn dựa trên scoring snapshot. Không mặc định mọi video đều có10s vô hại. Video ngắn hoặc vùng nguy hiểm/chấm bắt đầu trước10s phải trả khả năng/giới hạn phù hợp, không silently bỏ qua cơ hội lấy điểm.
- Request gồm exact attempt/session, current position, nonce, event UUID và thời điểm media thực tế khi bấm; query license như các command hiện tại. Không nhận duration, score, target ngoài giới hạn từ client để làm nguồn sự thật.
- ACK có snapshot/policy đủ để frontend đặt video tại checkpoint được server cho phép, nonce và trạng thái liên tục hợp lệ. Chốt rõ START có thể tại checkpoint10s hay skip chỉ diễn ra sau START0; không để frontend tự chọn.
- Cập nhật kiểm tra elapsed/heartbeat để đoạn bỏ được nhận diện chính xác mà vẫn chống seek khác. Bảo toàn đồng hồ video gốc, không rút10s khỏi scoring windows hoặc firstResponseMs.
- Nêu rõ giới hạn pause/waiting trong lúc chờ ACK/seeked, timer heartbeat, lỗi/nonce cũ, lost ACK, retry cùng event, reload, tái cấp URL và RESTART. Không cho response trong cửa sổ chuyển tiếp. Không lưu signed URL phía client.

### B. Thao tác chuyển sớm sau phản ứng đã xác nhận

- Chỉ áp dụng exam RANDOM/PRESET khi current position đã có phản ứng đầu tiên được server lưu. Không dựa vào optimistic button state. Serialize với heartbeat/reaction/restart/complete/submit.
- Backend cố định firstResponseMs và điểm của current theo scoringVersion snapshot, hoàn tất vị trí theo một completion reason riêng (ví dụ người dùng chuyển sau phản ứng), tăng đúng1 vị trí và cấp nonce mới. Không ghi giả video đã xem hết hoặc complete mediaTimeMs bằng duration chưa phát.
- Cùng event/payload trả đúng ACK idempotent; bấm đúp, timeout trước/sau commit, heartbeat/ended cũ, retry và response về trễ không được chuyển2 vị trí hoặc sửa phản ứng/điểm.
- Vị trí10 trả READY_TO_SUBMIT; SUBMIT vẫn là lệnh riêng, chỉ khi COMPLETED mới đọc result. Không nộp dở hoặc tạo phiên mới tự động.
- Giữ snapshot/title/bank/scoring/policy, preset manifest/source hashes, mode, quyền và owner. Xem kết quả/review vẫn chỉ GET. Lượt tạo dưới policy cũ phải giữ policy cũ hoặc có quy tắc chuyển đổi được bàn giao rõ ràng.

### C. Capability và tương thích

Cần field/khả năng phân biệt server hỗ trợ thao tác mới trong lesson, RANDOM, PRESET và các phiên cũ. Không biến allowSeek=true thành cấp quyền seek vô hạn. Khi không hỗ trợ, frontend giữ luồng hiện tại, không tự gửi lệnh mới. Các trường mới cần schema/parser, ví dụ error codes, typed ACK/reconciliation và bài test hồi quy. Không thay gói/thang điểm hay dữ liệu đã chốt chỉ để bật nút.

## Nghiệm thu tối thiểu

- 0s→skip10s→phản ứng17,432s lưu17432ms và cùng điểm với xem liên tục rồi bấm tại17,432s. Zero/null vẫn phân biệt; không cộng/trừoffset.
- Skip sau khi đã phản ứng, bấm đúp, late ACK, seek tùy ý, skip qua vùng chấm, short video, mất mạng/reload/restart/renew được chặn hoặc khôi phục theo policy được công bố.
- Tiếp theo chỉ sau ACK phản ứng. Lỗi/lostACK không tạo ý định mới hoặc tự chuyển. Ended/heartbeat cũ sau chuyển không tác động vị trí mới.
- Duyệt đủ10 vị trí với Next ở từng vị trí, READY_TO_SUBMIT trước SUBMIT, score/result/review không khác khi firstResponseMs giống luồng cũ.
- RANDOM/PRESET, active slot chung, owner/license, latest50→45→30 và cancel giữ kết quả cũ đều hồi quy đạt.
- Cung cấp source backend **đúng working tree đang chạy**, OpenAPI/DTO, ví dụ response/error, policy/schema version, test và lệnh xác minh. Không migrate DB hoặc sửa dữ liệu thật chỉ để tạo ca UI nếu không cần.

Trạng thái: giao diện khoảng cách và xem lại chỉ đọc đã chuẩn bị; skip/next trong lượt chấm điểm **BLOCKED_ON_BACKEND_CONTRACT**. Chưa nghiệm thu chức năng này và không được báo đã hoạt động trên toàn bộ lượt luyện/thi.
