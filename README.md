# DTS Frontend

Giao diện học lý thuyết và thi GPLX của DTS, gồm khu học viên và quản trị. Source đang dùng Next.js 16.3.0, React 19.2.8, TypeScript, Tailwind v4, TanStack Query và Zustand. Giữ nguyên `package.json` cùng `package-lock.json` đã được sử dụng local; Node 22 phù hợp với Dockerfile của repo.

## Đọc theo thứ tự

- [Chạy local](docs/LOCAL_SETUP.md): cài dependency, biến môi trường, Gateway và dịch vụ cần có.
- [Nghiệp vụ từng chức năng](docs/FRONTEND_FEATURES.md) và [route thực tế](docs/ROUTES.md).
- [Kiến trúc và cách phát triển](docs/ARCHITECTURE.md).
- [Phiên bản backend cần đồng bộ](docs/BACKEND_COMPATIBILITY.md).
- [API blueprint theo nhóm trang](docs/api-blueprint/README.md).

## Chạy nhanh khi backend đã sẵn sàng

```powershell
Set-Location 'D:\DTS\dts-system-fontend'
if (-not (Test-Path -LiteralPath '.env.local')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
}
npm ci
npm run dev -- --port 3000
```

Mở `http://localhost:3000`. `.env.local` đặt `GATEWAY_API_URL=http://localhost:8888`. Browser gọi cùng origin của Next; Next proxy đến Gateway, Gateway định tuyến sang backend. Không còn dùng các biến `IDENTITY_API_URL`, `PRACTICE_API_URL`, `PROGRESS_API_URL` trong `next.config.ts` hiện hành.

Pull source không mang theo database, người dùng, phiên làm bài, media trong MinIO hay credential của máy người phát triển. Phải dùng đúng backend, chạy migration/import theo tài liệu từng repo và được cấp cấu hình tương ứng. Không bật chế độ tự sửa schema để thay cho migration.

## Cấu trúc

| Thư mục | Trách nhiệm |
| --- | --- |
| `src/app/` | Route App Router, layout và điều phối trang |
| `src/features/` | Service gọi API, kiểu dữ liệu, hook và component theo nghiệp vụ |
| `src/components/` | UI dùng chung, app shell, xác thực và quản trị |
| `src/config/` | Danh mục điều hướng và ánh xạ danh mục GPLX từ backend |
| `src/stores/` | Cache trình duyệt cho auth, GPLX và phiên Practice |
| `src/lib/api/`, `src/lib/auth/` | Client HTTP, envelope, error và refresh token |
| `api-specs/`, `src/types/` | OpenAPI đã có và kiểu sinh tự động |
| `public/` | Asset tĩnh của frontend |
| `docs/` | Hướng dẫn và contract của bản source hiện hành |

Các API spec cũ không bao phủ mọi DTO được bổ sung; kiểu feature chuyên biệt vẫn nằm cạnh service. Không chạy `gen:types` chỉ để chuẩn bị commit. `DTS-HUONG-DAN-DU-AN.md` là tài liệu tổng hệ thống đã có, được giữ nguyên; cấu hình frontend hiện hành xem trong `docs/LOCAL_SETUP.md`.

## Giới hạn hiện có

Backend quyết định danh tính, quyền, chấm điểm, số lần thi, thời gian và phát hành kết quả. Guard hoặc hiển thị nút của frontend không thay thế kiểm tra backend. Trang `/admin/settings` hiện trình bày các mục cấu hình; chưa có API lưu cấu hình cho các nút đó. Việc đóng gói Git không bổ sung logic cho những mục này.
