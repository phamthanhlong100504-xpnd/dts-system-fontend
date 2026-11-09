# Frontend v7 — nối contract backend v2, 04/11/2026

Bản này tiếp nối frontend v6, giữ nguyên giao diện đã chỉnh. Không cài lại backend, không sửa video, công thức chấm điểm, dữ liệu, dependencies hay lịch sử Git.

## Những thay đổi mới

- Hướng dẫn học viên chấp nhận cả `MOCK_EXAM_RELEASED_V1` và `MOCK_EXAM_UNAVAILABLE_V1`. Trạng thái `bank.mockExam.available` phải khớp policy backend; giá trị lạ hoặc không nhất quán vẫn báo lỗi. Không dùng cờ frontend để ép mở thi thử. API `/v1/simulation-guide/current` trả DTO trực tiếp, dùng `document.content` hiện hành với scope được kiểm tra.
- Preview Admin lấy phần so sánh thi thử do server chiếu theo policy, giữ nguyên draft, bản đã phát hành, lịch sử và các nội dung đang chỉnh chưa lưu. Không tự Save/Publish để thay đổi thông báo.
- Điều khiển video bài thi bám theo từng `playbackEventId`. Khi RESTART một tình huống chưa có phản ứng, sau START 0 được xác nhận và video phát, frontend đọc lại capability để backend cho Skip lại. Phản ứng đã lưu, kể cả 0 ms, không mở lại Skip; Next dùng proof của nonce mới.
- Skip vẫn nhảy tới mốc 10000 ms được backend cho phép; phản ứng 17432 ms vẫn là 17432 ms trên video gốc. Không tạo ended, complete, thời lượng hay điểm giả. Retry cùng intent giữ eventId; receipt cũ không ghi đè state mới.

Chỉ có 5 file production thay đổi so với v6: types/wire/service/content của guide và khóa thế hệ của overlay trong exam player. CSS, JSX bố cục và nội dung tĩnh không thay đổi; nút vẫn cách mép phải **0,5 cm**, đáy `clamp(44px, 9vw, 2cm)`, chữ trắng và nền trong. Điều kiện Next, ordinary learning chỉ có Skip, read-only replay và các chỉnh sửa khoảng cách/tiêu đề của v6 được giữ nguyên.

## Bằng chứng và giới hạn

Gói backend đầu vào: `DTS-Video-Shortcuts-API-Handoff-v2-20261104(1).zip`, SHA-256 `04c7dafe2dd9f66fead88954f4bf9a6fb58fb13c73e35ea8189264ddb5a6e58c`. Đã đối chiếu đủ 31 checksum nội bộ. Handoff revision 2, follow-up `dts-video-shortcuts-restart-release-openapi-v1-20261104`, fingerprint `23d7c046a79d83dc4923724e863502e8814cc3fac5e9d038e5603cb547cfa7f7`.

Báo cáo owner backend kết thúc lúc `2026-11-04T15:19:19+0700` xác nhận đã xử lý cả ba gap: mở lại Skip sau unanswered RESTART, policy phát hành guide và OpenAPI (7/7 operations). Đây là kết quả **do owner báo cáo**. ZIP chứa 50 response thực tế trên máy owner không được đính kèm; các ví dụ restart trong handoff là đoạn minh họa, không phải HTTP capture đầy đủ. Không chạy lại backend/HTTP hay tính 1470 ca tổng hợp của backend thành ca kiểm tra frontend mới.

Yêu cầu backend trong `GUI_BACKEND_REOPEN_UNANSWERED_SKIP_V6.md` và các báo cáo v6 là lịch sử bất biến; trạng thái pending đó được thay thế bởi báo cáo backend v2 và lớp verifier v7. Frontend vẫn tuân thủ capability/rejection thật; không tự mở quyền khi backend cũ còn trả ALREADY_USED. Chưa nghiệm thu giải mã video hoặc luồng browser đăng nhập thực tế với bản frontend v7.

## Áp dụng

Giải nén ZIP frontend ra ngoài repo. Chạy wrapper `Apply-DtsSimulationContractV2V7.ps1` lần lượt `dry-run`, `apply`, `verify` với repo `D:\DTS\dts-system-fontend`, nhánh `feature/video-simulation-backend-integration`. Gói cộng dồn nhận đúng working tree đã review v3/v4/v5/v6, sao lưu byte gốc ngoài repo và dừng nếu phát hiện thay đổi không khớp. Không stage, commit, push, checkout, reset, cài package, chạy database hay khởi động lại service. Dừng terminal dev cũ bằng Ctrl+C trước khi áp dụng; chỉ chạy lại `npm run dev` sau khi verifier đạt.

Verifier hiện hành: `python .\scripts\verify-simulation-contract-v2-v7.py`. Các verifier cũ dùng để đối chiếu lịch sử, không dùng thay cho verifier v7 trên source mới.

## Test trên máy owner

1. Với RANDOM và PRESET: phát → Skip → gây lỗi/tải lại khi chưa phản ứng → phát từ đầu → Skip xuất hiện lại khi backend xác nhận. Sau Skip, nhấn Space và đối chiếu mili giây/điểm theo video gốc.
2. Với phản ứng đã lưu: Retry/F5 giữ thời điểm và điểm, Skip không mở lại; Next chỉ bật sau xác nhận phản ứng. Tình huống thứ 10 vẫn qua bước nộp bài hiện có, không tự tạo kết quả thứ hai.
3. Guide learner hiển thị đúng policy phát hành từ current API; thử policy unavailable trên môi trường cấu hình tương ứng. Admin draft/history không bị ghi lại. Kiểm tra giao diện v6 và vị trí nút 0,5 cm trên trình duyệt thật.

Chi tiết kiểm tra cục bộ và phạm vi chứng cứ nằm trong `evidence/verification.json` của gói.
