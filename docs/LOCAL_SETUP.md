# Chạy DTS Frontend trên máy thành viên

## 1. Điều kiện

Git, Node.js 22 và npm; đây cũng là dòng Node được Dockerfile sử dụng. Repo có `package-lock.json`, dùng `npm ci` để cài theo lockfile. Không copy `node_modules`, `.next`, `.env.local`, localStorage hay volume DB từ máy người khác vào Git.

Lấy nhánh chứa các chức năng đã bàn giao của cả frontend và backend. Frontend hiện được chuẩn bị trên `feat/user-ui-redesign`; các nhánh backend và contract cần có ở [BACKEND_COMPATIBILITY.md](BACKEND_COMPATIBILITY.md). `main` backend cũ có thể thiếu API dù frontend compile được.

## 2. Dịch vụ cần chạy

| Service trên Windows | Port host | Dùng cho |
| --- | --- | --- |
| Identity | 8081 | Auth, hồ sơ, hạng GPLX, quyền quản trị |
| Content Builder | 8082 | Nội dung, câu hỏi/chương/chương trình, ngân hàng cho admin |
| Progress | 8083 | Tổng quan học và tiến độ |
| Result | 8086 | Lịch sử hợp nhất, EXP, bảng xếp hạng, analytics |
| Practice | 8087 | Danh mục GPLX, học/ôn, thi thử, đề mẫu, biển báo/mẹo |
| Examination | 8088 | Danh mục kỳ thi, phiên thi chính thức, quản trị đề thi |
| Media | 8080 | Upload và URL media |
| Gateway | 8888 | Điểm nhận API của Next proxy |
| Frontend | 3000 | Web trên trình duyệt |

Chạy backend theo tài liệu riêng: database đúng tên/port, migration versioned, import ngân hàng/đề mẫu/biển báo/mẹo nếu cần, Redis/Kafka/MinIO theo chức năng. Frontend không tạo schema, seed dữ liệu hay tự khởi động các service. Dữ liệu lịch sử/EXP hiển thị sau khi nguồn đã lưu, outbox được phát và Result tiêu thụ; không sửa DB hoặc tạo số liệu giả để bù lúc Kafka chưa đồng bộ.

## 3. Gateway đủ các origin local

Mở terminal riêng cho Gateway, nạp credential/JWT theo tài liệu Gateway và dùng origin bên dưới. Không đặt `/api` hay `/v1` vào cuối origin.

```powershell
Set-Location 'D:\DTS\dts-gateway'
$gatewayArgs = @(
    '--server.port=8888'
    '--IDENTITY_SERVICE_URL=http://localhost:8081'
    '--PRACTICE_SERVICE_URL=http://localhost:8087'
    '--PROGRESS_SERVICE_URL=http://localhost:8083'
    '--CONTENT_BUILDER_SERVICE_URL=http://localhost:8082'
    '--EXAMINATION_SERVICE_URL=http://localhost:8088'
    '--RESULT_SERVICE_URL=http://localhost:8086'
    '--MEDIA_SERVICE_URL=http://localhost:8080'
)
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=$($gatewayArgs -join ' ')"
```

Terminal Gateway phải có cấu hình JWT tương thích Identity. Khi backend chạy trên Windows, hostname Docker như `examination` hoặc `dts-progress` không phải origin host-local thích hợp. Nếu API trực tiếp trả 200 nhưng Gateway trả 500, kiểm tra origin hiệu lực của process Gateway và service đích trước. Không chỉ dựa vào default ghi trong source.

## 4. Frontend local

```powershell
Set-Location 'D:\DTS\dts-system-fontend'
if (-not (Test-Path -LiteralPath '.env.local')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
}
npm ci
npm run dev -- --port 3000
```

Mở `.env.local` và đặt đúng `GATEWAY_API_URL=http://localhost:8888`. Không ghi JWT secret, mật khẩu DB hoặc MinIO secret vào biến frontend. Tài khoản đăng nhập phải tồn tại trong Identity của môi trường đang trỏ đến. GPLX đang học được đọc/lưu qua Identity, không chỉnh localStorage để thay quyền hay dữ liệu backend.

Cổng 8080 đang dành cho Media trong sơ đồ local này; chạy Next ở 3000 để tránh trùng cổng. Khi đổi cấu hình của Next hoặc origin, khởi động lại đúng process frontend theo nhu cầu vận hành; tài liệu này không tự restart gì.

## 5. Browser → Next → Gateway

| URL browser gọi | Client | Gateway chuyển tới |
| --- | --- | --- |
| `/api/identity/v1/...` | `identityApi` | Identity |
| `/api/practice/v1/...` | `practiceApi` | Practice |
| `/api/progress/v1/...` | `progressApi` | Progress |
| `/api/content-builder/v1/...` | `contentBuilderApi` | Content Builder |
| `/api/examination/v1/...` | `examinationApi` | Examination |
| `/api/result/v1/...` | `resultApi` | Result |
| `/api/v1/media/...` | `mediaApi` | Media |
| `/question-images/...` | Rewrite trong Next | Gateway image route |

`/api/:path*` được rewrite thành `${GATEWAY_API_URL}/api/:path*`; không có proxy trực tiếp theo từng service trong cấu hình Next hiện tại. Media có thể trả URL truy cập trực tiếp/presigned URL; endpoint đó còn phải truy cập được từ trình duyệt.

## 6. Build và Docker khi cần triển khai

Chạy local không cần Docker frontend. Khi chủ động tạo production build: `npm run build`, sau đó `npm run start -- --port 3000`. Dockerfile có standalone runner; phải truyền `GATEWAY_API_URL` ở **build stage** vì rewrites được đưa vào bản build. Đổi environment của container runner đơn thuần không bảo đảm thay được rewrite đã build.

```powershell
docker build --build-arg GATEWAY_API_URL=http://dts-gateway:8888 -t dts-frontend:local .
```

Origin minh họa trên chỉ dùng khi hostname `dts-gateway` truy cập được từ network triển khai. Dockerfile hiện có default origin khác local; phải truyền origin đúng môi trường. `docker-compose.prod.yml` dùng external network `dts-network` và image; không tự build hoặc tự đưa DB/MinIO vào Git. Workflow/deployment đang có được giữ nguyên.

## 7. Cách đọc lỗi

401: phiên đăng nhập/JWT/backend auth. 403: quyền hoặc quy tắc truy cập từ backend. 404: route hoặc tài nguyên không nhìn thấy theo owner. 409: trạng thái phiên, version hoặc chưa được phát hành kết quả. 500/502 qua proxy: xem Gateway, backend và URL hiệu lực; không kết luận mất dữ liệu chỉ vì một trang không tải được. UI có loading/error/empty riêng, lỗi API không phải danh sách rỗng hợp lệ.
