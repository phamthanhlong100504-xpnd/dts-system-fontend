# Frontend follow-up — khoảng cách đầu trang và điều khiển xem lại

Bản nền: Card06 integration v1, giữ các manifest/đầu ra Card01–06 trước đó. Không commit, stage, push, đổi nhánh, package hoặc API/backend trong bản này.

## Khoảng cách

- ExamShell dùng pageIntro ở mọi màn chuẩn bị RANDOM/PRESET, danh sách bộ đề, phiên thi, kết quả và review. CSS ghép .headingDescription.pageIntro cố định row-gap0.6cm, không phụ thuộc thứ tự import hoặc class preparationHeading từng ghi đè0.7cm.
- Guide, review-needed, bookmarks, danh sách chương/tình huống và tiêu đề/mô tả ở trang luyện dùng cùng cặp đầu trang. Hai filter ở review/bookmarks vẫn cùng hàng mô tả, không thêm lại khối đếm hay tiêu đề danh sách đã bỏ.
- Các cặp heading/description của trang bộ đề cũng dùng quy tắc này. preparationHeading trở về0.6cm; khoảng cách nội dung bên trong ba info-card0.7cm được giữ vì đây là nhóm nội dung khác.
- Trình duyệt hỗ trợ text-box-trim được trim hai mép chữ đối diện, giữ line-height giữa các dòng khi text wrap. Điều này bỏ phần half-leading vốn cộng thêm vào khoảng trống nhìn thấy; fallback vẫn có line-box gap0.6cm. Không đổi font size hay đặt line-height=1 làm chồng dấu tiếng Việt.
- Cơ sở CSS: https://developer.chrome.com/blog/css-text-box-trim . Đây là thay đổi source đã kiểm build/DOM; chưa có chứng nhận đo pixel trên trình duyệt của chủ dự án.

## Phần chạy được ngay: xem lại chỉ đọc

- Component overlay nền transparent, chữ trắng, cách lề phải/dưới1.5cm. Bỏ qua10s trong video xem lại tăng currentTime thật10s, chặn vượt duration, giữ paused/playing, không gọi play/pause/source action và không dispatch ended giả.
- Card01/02/03 kết quả: nút chỉ xuất hiện khi phase completed và policy cho seek; giữ score/firstResponseMs/attempt. Metadata chưa có hoặc URL đang reload thì nút chờ.
- RANDOM/PRESET review: có Bỏ qua10s; Tiếp theo chỉ khi item có phản ứng đã lưu và còn position sau. Chọn lại dùng callback review hiện có, chỉ GET; không phát lệnh exam. Ở position10 không hiện Tiếp theo. Lỗi media vẫn có retry và bộ chọn review như trước.
- Thời gian xem lại dùng clock video gốc, không cộng/trừ10s vào marker hay dữ liệu kết quả.

## Phần chưa thể bật: đang luyện/thi có chấm điểm

Yêu cầu chủ dự án là bỏ10s mở đầu và chuyển tình huống ngay sau ACK phản ứng trong phiên đang chấm. Backend hiện tại cấm seek, START0, heartbeat liên tục, complete sau ended thật. Gói Card06 không có command skip/advance-after-reaction. Bản này **không** giả complete, heartbeat, thời lượng hoặc nới policy client để ép chạy. Không hiển thị nút chết trong lượt đang chấm; phần này vẫn dùng luồng đã nghiệm thu.

Đã chuẩn bị `VIDEO_SHORTCUTS_BACKEND_REQUEST.md` gồm thay đổi hợp đồng và nghiệm thu cần bàn giao. Cần backend source/OpenAPI đúng bản đang chạy hoặc hợp đồng mới từ nhóm backend trước khi nối hai nút trong lượt đang chấm. Không gọi endpoint tự đoán. ActiveScoredSkipEnabled=false; ActiveScoredNextEnabled=false; RequestedFeatureFullyCompleted=false.

## Kiểm tra và giới hạn

- Hồi quy toàn bộ Card01–06 và UI, thêm kiểm tra media-event cho skip/read-only next, giữ timestamp và không mutate; kiểm view review thật để bảo đảm callback ordinal đúng.
- Loader QA CSS được sửa __esModule=false để default-import trả đúng class map. Đây là sửa bộ test, không thay CSS loader của ứng dụng.
- Full webpack build/TypeScript/lint và patch guard được ghi trong evidence. DOM/media harness không tương đương browser/video/backend thực tế. Môi trường thử headless cục bộ không khởi chạy được; không có screenshot hay chứng nhận pixel/media từ đó.
- Không chạm source HTTP, wire/validation/service/controller, queue, API, payload DTO, scoring, dữ liệu backend, nội dung lý thuyết, raw flags, lịch sử snapshot trước đó. Manifest follow-up mới và verifier mới là điểm kiểm tra cuối sau khi áp dụng.
