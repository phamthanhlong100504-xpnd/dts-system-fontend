# Backend cần đồng bộ với frontend

Frontend mới sử dụng các API đã bổ sung ở những repo dưới đây. Thành viên phải lấy nhánh/bản đã tích hợp chức năng tương ứng; pull `main` cũ của một service có thể không đủ.

| Repo | Nhánh đã dùng trong đợt bàn giao | Contract cần có |
| --- | --- | --- |
| dts-content-builder | `feature/2026-license-question-bank-media` | Nội dung, pagination, ngân hàng nội bộ theo GPLX, batch detail |
| dts-practice | `feature/2026-license-practice-exams` | Danh mục/config GPLX; thi thử/preset; học/ôn/cursor/bookmark; reference content; outbox |
| dts-media | `feature/traffic-sign-media` | URL media và policy traffic-sign WebP |
| dts-identity | `feature/content-builder-chapter-permissions` | Hồ sơ, selectedLicenseClass, role/permission quản trị |
| dts-gateway | `chore/backend-service-integration` | Đủ route service và giới hạn proxy Result |
| dts-progress | `feature/progress-backend-completion` | Learning overview và projection tiến độ chuẩn từ Practice |
| dts-examination | `feat/official-exam-workflow` | Student catalog, version/paper/session, release policy, admin workflow |
| dts-result | `fix/result-persistence-and-kafka-retry` | Owned history/source navigation, profile projection, EXP và normalized analytics |

Result cần được xuất bản và cấp quyền truy cập trước khi thành viên có thể lấy nhánh đó. Không coi việc frontend chạy được là chứng minh nhánh backend đã sẵn có trên remote. Khi các nhánh đã merge, dùng commit/tag tích hợp tương đương theo quy trình nhóm.

## Trách nhiệm dữ liệu

Mỗi backend sở hữu DB của nó. Chạy migration theo tài liệu backend và dùng file migration trong repo để đổi schema. Frontend không chạy SQL và không dùng Hibernate để tự tạo bảng. Import ngân hàng, manifest đề mẫu, dữ liệu biển báo/mẹo, object media và cấu hình public endpoint là bước riêng của service sở hữu.

Identity giữ tài khoản và GPLX. Practice giữ đáp án học, phiên ôn, phiên thi thử và bản ghi nguồn. Examination giữ paper/đáp án/quy tắc đã freeze, thời gian và phát hành kết quả chính thức. Progress đọc projection học. Result lưu lịch sử/read model, EXP và analytics từ sự kiện. Kafka/outbox có thể tạo khoảng trễ sau khi nộp bài; frontend refetch để đọc dữ liệu đã đồng bộ, không tạo thêm lượt nộp chỉ để ép lịch sử xuất hiện.

DB trắng không có lịch sử hay người dùng giống máy local. Repo frontend chỉ mang code, spec, tài liệu và asset tĩnh; không chứa dữ liệu phiên thật hoặc credential. Bảng entity/API legacy của backend có thể cần schema môi trường cũ; xem giới hạn migration trong tài liệu từng backend thay vì bật tự cập nhật schema.

## Bảo toàn màn hình đã duyệt

Gateway local cần đúng origin Progress 8083 và Examination 8088; đã từng có trường hợp API trực tiếp chạy nhưng proxy lỗi do origin khác môi trường. Media ở 8080, frontend ở 3000. Tên kỳ thi chính thức ưu tiên snapshot Result/Examination theo logic hiện có; không sửa record lịch sử để làm đẹp nhãn hiển thị.
