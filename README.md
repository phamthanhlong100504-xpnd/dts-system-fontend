# DTS Frontend

Frontend cho hệ thống luyện thi bằng lái xe (DTS). Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + TanStack Query + Zustand + React Hook Form + Zod.

## Kiến trúc

```
dts-frontend/
├─ api-specs/                  → OpenAPI của 3 backend (identity/practice/progress)
├─ src/
│  ├─ types/*.generated.ts     → Type sinh tự động từ OpenAPI (KHÔNG sửa tay)
│  ├─ lib/api/                 → Axios client + interceptor (token, refresh queue, unwrap envelope)
│  ├─ lib/auth/                → Refresh token logic
│  ├─ stores/auth-store.ts     → Zustand: accessToken, refreshToken, user (persist localStorage)
│  ├─ features/                → Mỗi service một module: auth, practice, progress
│  └─ app/                     → App Router pages
```

### Cách FE gọi backend (không cần CORS)

Không có CORS/gateway ở backend hiện tại, nên Next proxy mọi request `/api/...` tới từng service qua `rewrites` trong `next.config.ts` (browser gọi cùng origin → không bị chặn). Khi có API Gateway, chỉ cần đổi `IDENTITY_API_URL`/`PRACTICE_API_URL`/`PROGRESS_API_URL`.

| FE gọi | Proxy sang | Backend |
|---|---|---|
| `/api/identity/*` | `IDENTITY_API_URL` (8081) | dts-identity |
| `/api/practice/*` | `PRACTICE_API_URL` (8087) | dts-practice |
| `/api/progress/*` | `PROGRESS_API_URL` (8083) | dts-progress |

### Luồng dữ liệu

Mọi response đều bọc trong envelope `ApiResponse<T> = { success, message, data, errorCode, timestamp }`. Axios interceptor:
1. Gắn `Authorization: Bearer <token>` từ auth store.
2. Bóc envelope → component nhận thẳng `data`.
3. Nhận 401 → tự refresh token (chỉ gọi refresh 1 lần, queue các request đang chờ) → replay. Refresh fail → logout.

## Chạy local

```bash
# 1. Chạy các backend (mỗi service có docker-compose.infra.yml / docker-compose.yml riêng)
#    dts-identity: 8081, dts-practice: 8087, dts-progress: 8083

# 2. Frontend
npm install
npm run dev        # http://localhost:3000
```

## Sinh lại types khi backend đổi

Cập nhật spec mới vào `api-specs/` rồi chạy:

```bash
npm run gen:types
```

## Project structure — thêm feature mới

1. Tạo `src/features/<name>/<name>-service.ts` — gọi API qua `identityApi`/`practiceApi`/`progressApi`.
2. Tạo hook trong `src/features/<name>/use-<name>.ts` — React Query (`useQuery`/`useMutation`).
3. Tạo page trong `src/app/<route>/page.tsx`, bọc `RequireAuth` nếu cần đăng nhập.
