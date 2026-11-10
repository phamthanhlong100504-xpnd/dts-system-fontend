# Video layout v4 — 04/11/2026

Parent: frontend UI controls v3 (2026-11-03), giữ working tree chưa commit trên feature/video-simulation-backend-integration. Không sửa HTTP/wire/service/controller/queue/API, thang điểm, dữ liệu, package/lock/config hoặc các manifest trước đó.

## Các thay đổi theo yêu cầu

- Chỉ nút Bỏ qua10s được nâng0.5cm và dịch trái1cm từ vị trí v3. Wrapper/Next vẫn ở vị trí cũ1.5cm phải/dưới. Khi chỉ có Skip, khoảng cách hiệu dụng là2.5cm phải và2cm dưới. Nền transparent/chữ trắng giữ nguyên.
- Skip chuyển đến mốc tuyệt đối00:10 của video gốc, chỉ khi còn trước mốc đó và video dài hơn10s. Không cộng thêm10s vào vị trí đang xem. Nếu10s mở đầu của video là đếm ngược thì thao tác này đi thẳng qua đoạn đếm ngược; không tự nhận diện nội dung hình ảnh hoặc tạo một bộ đếm mới.
- Trong xem lại chỉ đọc, Skip ẩn sau lần thực hiện thành công cho video hiện tại; vẫn ẩn khi tua lại trước00:10 và khi lỗi/tái cấp URL của cùng video. Video mới có trạng thái riêng. Chưa thành công thì giữ khả năng thử lại. Hai thao tác có khóa bấm đúp và xử lý ACK bất đồng bộ theo mediaKey cũ để không ẩn nút của video khác.
- Next trong review cũng ẩn sau khi callback điều hướng được chấp nhận. Vẫn chỉ hiện khi đã có phản ứng lưu và còn tình huống sau. Đây là chọn item review, không phải lệnh hoàn tất lượt thi.
- Ở trang danh sách presets bỏ hẳn cặp tiêu đề/mô tả đầu trang và cặp “Danh sách bộ đề / Chọn một bộ đề…”. Giữ card giới thiệu, tổng số bộ đề và danh sách thật. Bỏ margin-top của grid vốn dành cho hai dòng đã bỏ.
- Ở trang guide học viên bỏ hẳn title/description đầu trang ở mọi trạng thái. Nội dung CMS vẫn lưu đầy đủ; bản preview Admin dùng component chung vẫn giữ title/description theo mặc định.
- Ở hai trang chuẩn bị RANDOM và PRESET bỏ hẳn cặp title/description đầu trang. PRESET chuyển tên bộ đề thật vào “Thông tin bài thi thử - {tên bộ đề}”; không hardcode số1. RANDOM giữ tên card thông tin chung.
- Khối nội dung đầu của đúng bốn nhóm trang trên cách mép dưới vùng nút Quay lại1cm. Exam session/result/review và các trang khác giữ cách hiển thị intro trước đó. Main có aria-label khi bỏ h1.

## Gói HTTP backend mới

Đã đọc ZIP DTS-Video-Shortcuts-HTTP-run-20261104-083800-1f286777.zip. SourcePatchId: dts-controlled-video-shortcuts-v1-20261103. Backend tự báo1361 checks đều đạt;160 response được audit offline.28 receipt skip thành công đều checkpoint10000; state còn cùng vị trí/nonce xác nhận startAtMs10000 và ALREADY_USED.19 receipt advance có completion reason đúng. Receipt của lần retry cũ có thể đi kèm state hiện tại đã ở vị trí/nonce mới (ví dụ048.json); không áp checkpoint của receipt cũ vào video hiện tại.

ZIP này chỉ có result.json và160 file dạng Check/Http/Response. Không chứa URL/method/request body hoặc controller/request DTO/OpenAPI đầy đủ. OpenApiIssueResolved=false và VideoDecodingAccepted=false là các giá trị thật trong result, không được đổi thành true. Do đó bằng chứng xác nhận backend đã chạy được các thao tác, nhưng chưa đủ để nối một request mới chính xác trong frontend.

Gói v4 hoàn tất chỉnh giao diện/điều khiển xem lại. Các nút trong lượt đang chấm điểm chưa được nối, giữ luồng legacy tương thích chưa opt-in. Cần bàn giao gói patch/source/API của SourcePatchId trên: route/method/query/body/header, ENABLE, GET state, SKIP_INTRO, ADVANCE_AFTER_REACTION, cách dùng reaction acknowledgement, revision/fingerprint nếu bắt buộc, lỗi và recovery. Controller/DTO cùng ví dụ request đúng là đủ; không cần chạy lại HTTP-run hoặc chờ sửa Swagger500 chỉ để gửi hợp đồng.

Không suy đoán route/body từ tên Check, không đưa [REDACTED] vào parser sản phẩm, không bật seek tùy ý hoặc giả complete/heartbeat. Sau khi có hợp đồng thực tế, nối server capability/ALREADY_USED để trạng thái trong lượt đang chấm được giữ đúng cả sau F5.

## Kiểm tra

DOM/media callback regression kiểm: các dòng yêu cầu thực sự không render, khoảng cách class1cm, tên bộ đề lấy từ dữ liệu, nút Start/selection vẫn gọi đúng; Admin preview không mất nội dung; skip từ giây5 đến giây10, ẩn một lần theo video, giữ điểm/phản ứng, giữ paused/playing và không phát exam/learning command; khóa đúp và ACK trễ; trạng thái ẩn qua URL renewal. Kết quả thực tế, build, TypeScript/lint và guard được ghi trong evidence của ZIP bàn giao.

Phạm vi: DOM/CSSOM/callback và build, không phải nghiệm thu video/đo pixel trên browser của chủ dự án. Không truy cập backend của chủ dự án, không chạy lại bài runtime, DB hoặc migration. Các kiểm tra1361/996 thuộc bằng chứng backend cung cấp, không tính vào test frontend chạy ở đây.
