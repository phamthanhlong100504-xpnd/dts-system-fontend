# Client API, proxy, lỗi và ranh giới dữ liệu

## Quy ước chung

Browser gọi cùng origin với Next. API base của các client: Identity `/api/identity`, Practice `/api/practice`, Progress `/api/progress`, Content Builder `/api/content-builder`, Examination `/api/examination`, Result `/api/result`, Media `/api/v1/media`. Service truyền phần suffix, thường bắt đầu `/v1/`; riêng Media theo contract Media của repo. Next rewrite giữ `/api` và Gateway thực hiện phần route còn lại.

`GATEWAY_API_URL` là cấu hình của Next server/build, không phải URL public secret trong browser. `/question-images` có rewrite riêng. Các URL media nhận từ backend cần truy cập được từ trình duyệt; không chuyển chúng thành đường dẫn ổ D: của máy phát triển.

## Response và lỗi

`unwrap` bóc `data` khi object có field đó, chuyển success=false thành ApiError; object/array trực tiếp vẫn được giữ. HTTP error lấy message nếu có, `code` ưu tiên trước `errorCode`, giữ traceId khi có. Không thêm wrapper `.data` ở page khi service đã unwrap. Result có Spring Page content/number/totalElements; không giả định mọi service dùng items/page/total.

Request có Bearer token hiện hành và timeout 30 giây. 401 được retry tối đa một lần sau refresh theo luồng chung; refresh lỗi logout local. Quyền admin, owner tài nguyên, release/review policy vẫn ở backend; route guard frontend chỉ điều phối giao diện.

## ID và đơn vị

Question ID của Practice là số, câu Content Builder/Examination dùng UUID/string theo DTO. Result resultId, sourceId, examId, examVersionId và sessionId không hoán đổi. Practice có cấu hình durationMinutes; official session dùng durationSeconds; thời gian API là chuỗi ISO theo DTO. Điểm normalized của analytics, điểm nguồn và EXP là các giá trị khác nhau.

API spec trong `api-specs` chỉ có Identity/Practice/Progress đời source hiện có. Các DTO mới trong feature được giữ cạnh service; không tự regenerate hoặc đổi tên chỉ để làm sạch cấu trúc. Không copy file đã có marker REDACTED từ ZIP review về source thật.

## Source đối chiếu

- `next.config.ts`
- `src/lib/api/config.ts`
- `src/lib/api/index.ts`
- `src/lib/api/http.ts`
- `src/lib/api/envelope.ts`
- `src/lib/auth/auth-refresh.ts`

Các đường dẫn trong bảng API là phần sau base URL của client được ghi trong bảng. DTO và xử lý hiện hành nằm trong các file source trên. Không lấy nội dung snapshot đã che thông tin để ghi đè source.
