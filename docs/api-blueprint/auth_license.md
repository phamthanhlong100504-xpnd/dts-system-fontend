# Đăng nhập, xác minh và chọn GPLX

## Trang và nguồn

`/`, `/login`, `/register`, `/verify-email`, `/forgot-password`, `/forgot-password/verify`, `/forgot-password/reset`. Identity sở hữu tài khoản, Practice cung cấp danh mục GPLX và thông số đề.

## Luồng nghiệp vụ

Login lưu auth response, đồng bộ selectedLicenseClass. Có hạng thì chuyển sang `/practice`, chưa có thì về `/`. Register đi đến xác minh email. Quên mật khẩu gửi identifier và đặt lại bằng mã + mật khẩu mới; server quyết định hạn dùng/rate limit. Refresh dùng luồng chung ở API client.

Chọn hạng đọc danh mục từ backend. Hook yêu cầu đủ 15 mã khác nhau, cơ cấu 3 mô tô/6 ô tô/6 rơ moóc và các số liệu hợp lệ. Không lấy số câu/thời gian cố định trong frontend thay cho catalog. Lưu lựa chọn qua Identity rồi cập nhật auth/license cache. Các lỗi catalog không được coi là danh mục rỗng.

| Client | Method | Path | Dữ liệu chính |
| --- | --- | --- | --- |
| identityApi | POST | `/v1/auth/login`, `/v1/auth/register` | Payload từ schema Identity |
| identityApi | POST | `/v1/auth/refresh`, `/v1/auth/logout` | Refresh/token theo luồng auth |
| identityApi | GET | `/v1/users/me` | Hồ sơ, selectedLicenseClass |
| identityApi | PUT | `/v1/users/me/license` | `{licenseClass}` |
| identityApi | POST | `/v1/auth/verify`, `/v1/auth/resend-verification` | identifier, type, code theo thao tác |
| identityApi | POST | `/v1/auth/forgot-password`, `/v1/auth/reset-password` | identifier; code và newPassword ở bước reset |
| practiceApi | GET | `/v1/exams/license-catalog` | bankVersion, counts, exam config và availability |

## Trạng thái và dữ liệu

Auth cache được hydrate trước khi dùng. Identity là nguồn xác nhận GPLX; cache trình duyệt không đủ để tham gia kỳ thi. Không đưa OTP, token hoặc bản localStorage vào tài liệu hay Git. Query `auth/me` có cơ chế đồng bộ riêng; xem Providers và use-auth trước khi thay cách điều hướng.

## Source đối chiếu

- `src/features/auth/auth-service.ts`
- `src/features/auth/use-auth.ts`
- `src/features/license/license-service.ts`
- `src/features/license/use-license.ts`
- `src/config/license.ts`
- `src/app/providers.tsx`

Các đường dẫn trong bảng API là phần sau base URL của client được ghi trong bảng. DTO và xử lý hiện hành nằm trong các file source trên. Không lấy nội dung snapshot đã che thông tin để ghi đè source.
