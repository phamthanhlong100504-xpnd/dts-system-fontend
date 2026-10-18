# Kiến trúc frontend và cách làm việc

## Phân lớp

Route trong `src/app` xác định địa chỉ web và điều phối trạng thái. `features/<nghiệp-vụ>` giữ service, types, hook và component của chức năng. Component trình bày nhận dữ liệu/handler, không tự tạo kết quả chấm thi. `components/ui` và `components/app-shell` là phần dùng chung. Alias `@/` trỏ vào `src/` theo `tsconfig.json`.

`lib/api/index.ts` tạo client theo prefix Gateway. `createApiClient` có timeout 30 giây, thêm Bearer token, unwrap response nếu object có trường `data`, giữ response trực tiếp nếu không có envelope. Lỗi HTTP được chuyển thành `ApiError` với status, message, `code` hoặc `errorCode`, và traceId nếu backend có gửi. Không giả định tất cả backend đều trả cùng một envelope.

## Auth và hydration

Auth store persist dưới key `dts-auth`; license store là `dts-license`. Exam store cũng được rehydrate bởi Providers. Đây là cache trình duyệt; backend vẫn xác nhận người dùng, phiên và GPLX. `skipHydration` tránh lấy localStorage ngay khi render phía server. `RequireAuth`/`RequireAdmin` điều phối UI, không thay thế phân quyền backend.

HTTP client chỉ refresh một lần cho request bị 401, không refresh đệ quy các endpoint login/refresh/logout. Refresh dùng axios riêng và một Promise dùng chung, cập nhật token/user, đồng bộ GPLX khi response có trường đó. Logout qua hook xóa exam/license cache và query cache; frontend không xuất các giá trị localStorage ra repo.

Providers đồng bộ selectedLicenseClass từ Identity khi chuyển route, focus và chu kỳ 60 giây ở tab đang hiển thị. Nó tránh route auth/admin/chọn hạng và phiên đang làm bài, chống response cũ ghi đè thao tác mới. Không diễn giải cache GPLX là quyền thi.

## Query và source dữ liệu

Hook ghép query key theo tham số của tính năng. History/Leaderboard/Analytics có thêm user ID và chỉ bật khi auth đã hydrate, có token. Các hook cũ và hook Progress/learning dùng key khác; không khẳng định mọi query đều có cùng cách scope. Logout chủ động clear query cache.

Sau mutation, hook cập nhật cache có kiểm soát và invalidate đúng phạm vi. Các thao tác lưu đáp án/cursor/bookmark và chuyển phiên cần giữ logic hiện có: không refactor chỉ để gom commit. Không suy điểm từ phần trăm hoặc tự quyết định pass/fail khi backend đã trả kết quả.

## Cấu trúc trang

AppChrome chọn header theo route/auth. Header chung ẩn khi làm bài, route quản trị có layout riêng. Home chọn GPLX không dùng header mặc định. AppFooter, modal xác nhận phiên, các card câu hỏi/navigator/explanation được tái sử dụng; không coi component không trực tiếp nằm trong page là file dư.

## Phát triển tiếp

Thêm chức năng vào feature tương ứng, định nghĩa type cạnh service khi spec cũ chưa bao phủ, giữ việc gọi backend ở service/hook. Route chỉ nhập các component/hook cần thiết. Khi backend đổi contract, cập nhật spec/types có chủ đích; `npm run gen:types` có thể ghi lại ba file generated nên không chạy như thao tác dọn Git.

Không chuyển các bản backup UI vào `src`; không stage `node_modules`, `.next`, `.env.local`, cache hoặc output kiểm tra. Mã kiểm tra tái sử dụng trong `tests/` là source phục vụ bảo trì, khác với report/log phát sinh. Các file cũ chưa được chứng minh không dùng được giữ nguyên để bảo toàn chức năng.
