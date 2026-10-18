# Hồ sơ, email, bảo mật và GPLX

## Trang và nguồn

`/profile` sử dụng Identity cho hồ sơ và role, Practice/Identity cho đổi hạng, next-themes cho giao diện. Các card thông tin cá nhân, học tập, GPLX, bảo mật và appearance được tách trong feature profile.

| Client | Method | Path | Dữ liệu |
| --- | --- | --- | --- |
| identityApi | GET | `/v1/users/me`, `/v1/users/me/roles` | Hồ sơ/role hiện hành |
| identityApi | PUT | `/v1/users/me` | Các field được form/service hỗ trợ |
| identityApi | PUT | `/v1/users/me/license` | `{licenseClass}` |
| identityApi | POST | `/v1/auth/resend-verification` | identifier, type=CHANGE_EMAIL |
| identityApi | POST | `/v1/auth/verify` | identifier, code, type=CHANGE_EMAIL |
| identityApi | POST | `/v1/auth/change-password` | Schema ChangePasswordRequest |

Mở trang đọc lại profile, đồng bộ user store nếu đúng user hiện hành và chỉ cập nhật GPLX nếu response có trường selectedLicenseClass. Query roles chỉ bật khi có profile.id. Sau cập nhật, giữ dữ liệu mới trong auth cache và invalidate `auth/me`; không chỉ sửa tên trên giao diện rồi coi đã lưu backend.

UI đổi mật khẩu dùng auth hook, lỗi password/rate limit thuộc Identity. Đổi email có bước xác minh CHANGE_EMAIL riêng; không đổi trạng thái verified bằng localStorage. Appearance là lựa chọn trình duyệt/theme, khác dữ liệu hồ sơ nghiệp vụ. Không đưa dữ liệu mật khẩu hoặc form bảo mật vào log, tài liệu hay Git.

Payload interface giữ tên `birthOfDate` theo source đang có. Không tự đổi DTO cho thống nhất tên trong đợt dọn Git; khi mở rộng form phải đối chiếu cả service/hook và backend.

## Source đối chiếu

- `src/features/profile/profile-service.ts`
- `src/features/profile/use-profile.ts`
- `src/features/profile/components/profile-content.tsx`
- `src/features/profile/components/profile-email-verification-dialog.tsx`
- `src/features/profile/components/profile-security-card.tsx`
- `src/app/profile/page.tsx`

Các đường dẫn trong bảng API là phần sau base URL của client được ghi trong bảng. DTO và xử lý hiện hành nằm trong các file source trên. Không lấy nội dung snapshot đã che thông tin để ghi đè source.
