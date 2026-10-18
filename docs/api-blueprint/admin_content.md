# Quản trị nội dung, câu hỏi, chương và chương trình

## Trang

`/admin/dashboard`, `/admin/questions`, `/admin/questions/create`, `/admin/questions/edit/[id]`, `/admin/chapters`, `/admin/programs`, `/admin/programs/[programId]`. Danh mục này dùng Content Builder; khác ngân hàng câu hỏi chuẩn đọc cho tạo kỳ thi.

## Luồng nghiệp vụ

Tạo câu hỏi draft hoặc published theo endpoint tương ứng; sửa/xóa qua ID và quyền backend. Chapter chứa question blocks; program chứa chapter blocks, có các thao tác thêm/xóa/reorder. Media upload/URL qua Media client, metadata câu hỏi vẫn thuộc Content Builder.

`readContentBuilderCollection` đọc từng trang size=100, tối đa 100 trang; hỗ trợ response array hoặc Spring Page. Nó kiểm array/totalPages và báo lỗi nếu vượt giới hạn, không im lặng cắt bộ dữ liệu ở trang đầu. Dashboard đếm nội dung tự tạo đọc được; không trộn câu hỏi chuẩn vào số liệu nội dung quản lý.

| Client | Method | Path |
| --- | --- | --- |
| contentBuilderApi | GET | `/v1/questions`, `/v1/chapters`, `/v1/learning-programs` |
| contentBuilderApi | GET | `/v1/questions/{id}?includeOptions=true` |
| contentBuilderApi | POST | `/v1/questions/draft`, `/v1/questions/published` |
| contentBuilderApi | PUT/DELETE | `/v1/questions/{id}` |
| contentBuilderApi | POST | `/v1/chapters/draft`, `/v1/chapters/published` |
| contentBuilderApi | PUT/DELETE | `/v1/chapters/{id}` |
| contentBuilderApi | POST/DELETE | `/v1/chapters/{id}/question-blocks`, `/question-blocks/{blockId}` |
| contentBuilderApi | PUT | `/v1/chapters/{id}/question-blocks/reorder` |
| contentBuilderApi | POST | `/v1/learning-programs/draft`, `/v1/learning-programs/published` |
| contentBuilderApi | PUT/DELETE | `/v1/learning-programs/{id}` |
| contentBuilderApi | POST/DELETE | `/v1/learning-programs/{id}/chapter-blocks`, `/chapter-blocks/{blockId}` |
| contentBuilderApi | PUT | `/v1/learning-programs/{id}/chapter-blocks/reorder` |

RequireAdmin là guard UI, backend vẫn kiểm permission. Trang users/roles dùng Identity ở module admin-service riêng. `/admin/settings` hiện là giao diện các nhóm cấu hình, chưa có API ghi cấu hình cho các nút này; không mô tả nó như trang quản trị DB/backup đã triển khai đầy đủ.

## Source đối chiếu

- `src/features/admin/content-builder-pagination.ts`
- `src/features/admin/admin-content-service.ts`
- `src/features/admin/admin-chapters-service.ts`
- `src/features/admin/admin-programs-service.ts`
- `src/features/admin/use-admin-content.ts`
- `src/features/admin/admin-service.ts`
- `src/app/admin/settings/page.tsx`

Các đường dẫn trong bảng API là phần sau base URL của client được ghi trong bảng. DTO và xử lý hiện hành nằm trong các file source trên. Không lấy nội dung snapshot đã che thông tin để ghi đè source.
