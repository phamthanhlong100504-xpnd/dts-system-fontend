# Chức năng và nghiệp vụ frontend

Bảng dưới liên kết trang với nguồn dữ liệu và quy tắc hiện hành. Frontend chịu trách nhiệm trải nghiệm/điều phối, backend sở hữu tính đúng của nghiệp vụ.

| Nhóm | Route | Nguồn | Nghiệp vụ | Contract |
| --- | --- | --- | --- | --- |
| Chọn GPLX và auth | `/`, `/login`, `/register`, `/verify-email`, `/forgot-password/...` | Identity + Practice | Catalog 15 hạng từ backend; lưu hạng qua Identity; login/refresh/verify và điều hướng theo hồ sơ. | [Chi tiết](api-blueprint/auth_license.md) |
| Hub ôn luyện | `/practice` | Practice | Tổng quan và điểm vào thi/học/ôn; lấy config/active session thật, không dùng số câu local làm nguồn. | [Chi tiết](api-blueprint/practice_exams.md) |
| Thi thử và bộ đề | `/practice/exams`, `/practice/exam/[examId]`, `/practice/result/[examId]` | Practice | Ngẫu nhiên/preset, EXAM/PRACTICE, lưu đáp án/cursor/flag, pause/resume/finish/retry; chấm tại nguồn. | [Chi tiết](api-blueprint/practice_exams.md) |
| Học và ôn chương | `/practice/chapters`, `/practice/chapter/[chapterId]` | Practice | Tổng quan chương, học từng câu, bookmark/cursor, review session và giải thích. | [Chi tiết](api-blueprint/chapter_learning.md) |
| Ôn câu điểm liệt | `/practice/critical-questions`, `/practice/critical-questions/review` | Practice | Overview đúng GPLX, session riêng, feedback/cursor/bookmark từ backend. | [Chi tiết](api-blueprint/wrong_critical_review.md) |
| Ôn câu sai | `/practice/wrong`, `/practice/wrong/review` | Practice | Danh sách cần ôn, bắt đầu/tiếp tục session, trả lời, kết thúc và tổng kết. | [Chi tiết](api-blueprint/wrong_critical_review.md) |
| Biển báo và mẹo | `/practice/traffic-signs`, `/practice/memory-tips` | Practice + Media | Tìm/lọc/xem chi tiết biển báo, nhóm mẹo, ảnh từ URL/media hợp lệ. | [Chi tiết](api-blueprint/reference_content.md) |
| Thi chính thức | `/examination`, `/examination/[examId]`, `/run`, `/examination/result/[sessionId]` | Examination + Identity | Danh mục/quyền tham gia, phòng chờ, paper đã freeze, version/idempotency, phát hành/review theo backend. | [Chi tiết](api-blueprint/official_exam.md) |
| Lịch sử thi | `/practice/history` | Result + nguồn | Lịch sử hợp nhất theo owner, filter thời gian/GPLX/loại/kết quả, phân trang và source navigation. | [Chi tiết](api-blueprint/history.md) |
| Bảng xếp hạng | `/practice/leaderboard` | Result | EXP/rank và currentUser từ backend; giữ nullable profile. | [Chi tiết](api-blueprint/leaderboard_analytics.md) |
| Thống kê kết quả | `/results` | Result + nguồn | Normalized score, pass/accuracy, trend và recent result; không tính lại điểm. | [Chi tiết](api-blueprint/leaderboard_analytics.md) |
| Tiến độ học | `/progress` | Progress | Tổng quan học/câu sai/câu liệt/từng chương từ projection đúng GPLX. | [Chi tiết](api-blueprint/learning_progress.md) |
| Hồ sơ | `/profile` | Identity + Practice | Thông tin cá nhân, role, GPLX, đổi mật khẩu, xác minh email, theme. | [Chi tiết](api-blueprint/profile.md) |
| Quản trị nội dung | `/admin/dashboard`, `/admin/questions/...`, `/admin/chapters`, `/admin/programs/...` | Content Builder + Media | CRUD nội dung, block/reorder, đọc đủ pagination và dashboard nội dung tự tạo. | [Chi tiết](api-blueprint/admin_content.md) |
| Quản trị kỳ thi | `/admin/exams/...`, `/admin/exam-structures`, `/admin/exam-rules`, `/admin/exam-criteria` | Examination + Content Builder | Parent/version, AUTO_MATRIX/MANUAL, quota theo chương/câu liệt và publish có validation. | [Chi tiết](api-blueprint/admin_official_workflow.md) |
| Người dùng/role và khung admin | `/admin/users`, `/admin/roles`, `/admin/settings` | Identity; settings là UI hiện có | Quản trị user/role/permission qua API; trang settings chưa có thao tác lưu cấu hình backend. | [Chi tiết](api-blueprint/admin_content.md) |

## Nền tảng dùng chung

App shell/header/footer thích ứng route và phiên đăng nhập. Providers rehydrate store và đồng bộ GPLX có chống response cũ. HTTP client hỗ trợ token refresh/envelope/error, component MediaImage đọc URL media theo contract. Đây là phần phụ thuộc của nhiều trang, được gom thành commit nền tảng thay vì trộn ngẫu nhiên vào một trang.

## Dữ liệu và trạng thái rỗng

Loading, error và empty khác nhau. Cần backend tương ứng, migration/import hợp lệ và tài khoản có quyền. Source frontend không mang dữ liệu người dùng/đáp án của máy local; empty hợp lệ trên DB mới không chứng minh tính năng bị mất. Giữ các giới hạn/placeholder đang có, không thêm logic mới trong đợt đóng gói Git.
