# Quản trị kỳ thi chính thức, ma trận và phiên bản

## Trang và dữ liệu

`/admin/exams`, `/admin/exams/[examId]`, `/admin/exams/structures/create`, `/admin/exam-structures`, `/admin/exam-rules`, `/admin/exam-criteria`. Examination sở hữu exam/version/rule/criteria/structure. Content Builder cung cấp snapshot ngân hàng, không thay Examination lưu phiên bản đã xuất bản.

## Quy trình

Chọn GPLX/bankVersion, cấu hình lịch và quy tắc, tạo parent exam, tạo version theo AUTO_MATRIX hoặc MANUAL, rồi publish qua workflow version. UI không gán parent PUBLISHED để vượt quy trình validate/publish của backend. Những cấu hình đã được tham chiếu có thể bị backend từ chối sửa/xóa; không tạo record giả hoặc tự bỏ reference để vượt guard.

Ma trận được đọc từ file JSON đã có và đối chiếu ngày theo Asia/Ho_Chi_Minh. `official-matrix-policy` kiểm tổng câu, nhóm chương, quota câu liệt; phần CRITICAL là section tách riêng. MANUAL dùng lựa chọn theo quota từng section, giải quyết chương nguồn và câu có nhiều chương; không chỉ đếm đủ tổng câu rồi cho hoàn thành. Chọn Tất cả ở bộ lọc không thay đổi quota.

| Client | Method | Path | Vai trò |
| --- | --- | --- | --- |
| contentBuilderApi | GET | `/v1/internal/questions/bank?bankVersion=...&licenseClass=...` | Metadata snapshot đúng scope |
| contentBuilderApi | POST | `/v1/internal/questions/batch` | Chi tiết câu theo batch |
| examinationApi | GET/POST | `/v1/exams` | Danh sách/tạo parent |
| examinationApi | PATCH | `/v1/exams/{id}`, `/v1/exams/{id}/status` | Metadata/trạng thái theo quyền |
| examinationApi | GET/POST | `/v1/exams/{id}/versions` | Liệt kê/tạo version |
| examinationApi | PATCH/DELETE | `/v1/exam-versions/{id}` | Sửa draft/xóa khi hợp lệ |
| examinationApi | POST | `/v1/exam-versions/{id}/publish`, `/clone`, `/archive` | Workflow phiên bản |
| examinationApi | GET/POST | `/v1/exam-structures`, `/v1/exam-rules`, `/v1/exam-criterias` | Cấu hình |
| examinationApi | PATCH/DELETE | `/v1/exam-structures/{id}`, `/v1/exam-rules/{id}`, `/v1/exam-criterias/{id}` | Quản trị theo guard backend |

Các endpoint internal của ngân hàng vẫn được Content Builder kiểm quyền phía backend; chữ internal không có nghĩa browser được gửi secret nội bộ. Source hiện dùng JWT admin và route đã cấu hình. Frontend không tạo migration hoặc ghi DB trực tiếp khi lưu cấu hình.

File `tests/manual-matrix-logic-check.cjs` là mã kiểm tra tái sử dụng cho lựa chọn quota, được giữ trong repo; không phải report tạm. Cơ cấu JSON là dữ liệu chức năng, giữ nguyên byte local khi chuẩn bị Git và đối chiếu nội dung staged theo quy tắc Git hiện có.

## Source đối chiếu

- `src/features/admin/admin-examination-service.ts`
- `src/features/admin/official-bank-service.ts`
- `src/features/admin/official-matrix-policy.ts`
- `src/features/admin/manual-matrix-selection.ts`
- `src/features/admin/data/exam-matrix-policy.json`
- `src/features/admin/components/official-bank-browser.tsx`
- `tests/manual-matrix-logic-check.cjs`

Các đường dẫn trong bảng API là phần sau base URL của client được ghi trong bảng. DTO và xử lý hiện hành nằm trong các file source trên. Không lấy nội dung snapshot đã che thông tin để ghi đè source.
