# Biển báo và mẹo ghi nhớ

## Trang và nguồn

`/practice/traffic-signs` và `/practice/memory-tips` là giao diện đọc dữ liệu do Practice cung cấp. Trang biển báo có danh sách, bộ lọc và drawer chi tiết; mẹo có nhóm/accordion.

| Client | Method | Path | Nội dung |
| --- | --- | --- | --- |
| practiceApi | GET | `/v1/traffic-signs` | Tìm/lọc/phân trang theo GetTrafficSignsParams |
| practiceApi | GET | `/v1/traffic-signs/{id}` | Chi tiết biển báo |
| practiceApi | GET | `/v1/memory-tips` | Nhóm mẹo và các mục mẹo |

Danh sách rỗng hợp lệ phải khác lỗi mạng/contract. MediaImage hỗ trợ imageUrl và mediaFileId theo logic hiện có; MinIO/URL public phải truy cập được từ browser. Source frontend không chứa toàn bộ nội dung biển báo/mẹo hoặc object media; import theo tài liệu Content Builder/Practice/Media. Các tham số phân trang và filter lấy từ service/type chuyên biệt, không suy từ OpenAPI cũ của Practice.

## Source đối chiếu

- `src/features/practice/traffic-sign-service.ts`
- `src/features/practice/traffic-sign-types.ts`
- `src/features/practice/memory-tip-service.ts`
- `src/features/practice/components/traffic-signs/traffic-signs-content.tsx`
- `src/features/practice/components/memory-tips/memory-tips-content.tsx`
- `src/components/ui/media-image.tsx`

Các đường dẫn trong bảng API là phần sau base URL của client được ghi trong bảng. DTO và xử lý hiện hành nằm trong các file source trên. Không lấy nội dung snapshot đã che thông tin để ghi đè source.
