# DTS — tích hợp 4 trang dùng chung, frontend v8, 05/11/2026

## Nội dung đã nối

`/practice` giữ nguyên hai tab. Lựa chọn module được dùng chung cho `/practice/history` và `/progress`, lưu một tùy chọn điều hướng trong sessionStorage theo tài khoản/hạng để F5 giữ nội dung. Đổi module chỉ thay phạm vi đọc; không gọi complete/bookmark/cursor hay tạo phiên. Khi đổi tài khoản, tùy chọn cũ được xóa; hạng không bật mô phỏng luôn dùng lý thuyết. Không lưu kết quả, media URL, bookmark hay credential trong tùy chọn mới.

Lịch sử mô phỏng giữ phong cách bảng lý thuyết, lọc RANDOM/PRESET, Đạt/Chưa đạt, thời gian và phân trang. Lọc tại API; frontend không ghép danh sách từ hai nguồn. Hiển thị điểm gốc, ngày hoàn thành và đường kết quả đã kiểm tra đúng source/session/hạng. Bỏ cột thời gian làm nếu toàn bộ trang có durationSeconds=null; không lấy tổng thời lượng video thay thế. Khi sang trang tiếp theo, giữ marker/asOf đã nhận; đổi bộ lọc/Cập nhật bỏ mốc cũ. Tổng chưa xác nhận giữ dấu —, không tạo tổng 0.

Tiến độ mô phỏng có tổng đã luyện/tổng tình huống, phần trăm, Tình huống cần ôn lại, **Tình huống đã đánh dấu**, và danh sách chương do Progress trả. Số đang đánh dấu khác số đạt 5/5. Link ôn mở đúng chương hoặc Card02/03; chỉ mở khi ngân hàng hiện hành khớp ngân hàng đang hiển thị và sẵn sàng. Nếu ngân hàng cũ/tạm unavailable, giữ số liệu đã lưu và giải thích trạng thái, không mở nhầm chương thuộc bank mới.

`/results` và `/practice/leaderboard` chọn LEGACY_THEORY/COMBINED từ capability hạng, độc lập với tab ở `/practice`. COMBINED gồm điểm trung bình /100, tỷ lệ đạt, EXP tích lũy trong kỳ, số bài hoàn thành, xu hướng và kết quả gần đây giữ điểm gốc/nhãn module. Xếp hạng dùng EXP backend, chu kỳ tuần/tháng/toàn thời gian; không gọi profile/avatar riêng tư. Không tự cộng EXP, tổng hợp điểm hoặc suy PASSED/FAILED.

4 page hiện có chỉ bọc thêm `PerformancePage`. Toàn bộ component/hook/service của History, Leaderboard, ProgressLearning, ResultAnalytics và ResultPerformance lý thuyết giữ nguyên byte. API/client/auth, package/lock/config, file video và CSS Card01–06 không thay đổi. PracticeHub chỉ đổi nguồn lựa chọn tab, giữ nguyên JSX/CSS. Boundary bài thi chỉ thêm chế độ đọc kết quả/review đã lưu khi bankReady=false; tạo bài/luyện mới vẫn qua điều kiện sẵn sàng cũ. Scorer, Skip/Next và nonce không đổi.

## Hợp đồng API

| Trang | Client hiện có | GET path |
|---|---|---|
| Capability | Practice `/api/practice` | `/v1/exams/license-catalog` |
| Lịch sử mô phỏng | Result `/api/result` | `/v1/results/me/history/simulations` |
| Kết quả COMBINED | Result `/api/result` | `/v1/results/me/analytics/combined` |
| Xếp hạng COMBINED | Result `/api/result` | `/v1/leaderboards/combined` |
| Tiến độ mô phỏng | Progress `/api/progress` | `/v1/progress/simulations/learning-overview` |

Dùng JWT/client hiện có. Result trả DTO trực tiếp. Progress dùng envelope ApiResponse, client hiện có unwrap đúng một lần. Không thêm query userId. Capability bổ sung performanceMode, learningModules, performancePolicyVersion, simulationProgressScope; không hardcode danh sách hạng hoặc suy COMBINED từ readiness. Hạng mô phỏng thiếu policy mới báo chờ/lỗi chính sách, không âm thầm trả thống kê lý thuyết thay COMBINED.

Query tách theo user/hạng/policy/bank/loại trang/bộ lọc. Guard kiểm tra user/hạng trước và sau GET; response cũ không hiển thị cho tài khoản/hạng mới. Cache đọc cá nhân gcTime=0, refetch khi vào lại/focus, không placeholder từ scope trước. Chỉ 503 được retry thêm một lần với backoff; 400/403/schema lỗi vẫn là lỗi. Khi dữ liệu BACKFILLING/SYNCING/STALE/CATALOG_PENDING, giữ null và trạng thái; dữ liệu đã nhận có thể hiển thị với thông báo partial. Refresh lỗi trên cùng query giữ dữ liệu đã nhận.

Không so EXP rolling30D với tháng lịch. Hàm đối chiếu chỉ nhận scope khớp license/from/to/asOf/watermark/rule/fingerprint. Các trường mốc đồng bộ không xuất hiện như thông tin kỹ thuật trong luồng học viên.

## Nguồn và phạm vi nghiệm thu

Contract: `DTS-Simulation-Performance-FRONTEND-Handoff-20261105-021731-3f806195.zip`, SHA256 `24a5035bfd6843bccbe86958dd7362250a505d7118449061f35168eace5e09aa`. Đã đối chiếu đủ 14 checksum. Backend patchId `dts-simulation-performance-v1-20261104`, fingerprint `e3d6db92742791f35248717ac2e0eb2b073514bcfbd1905864f4f7b1fae944f5`.

BACKEND_STATUS.json ghi source/contract và schema đã được kiểm, nhưng **ActualHttpKafkaBackfillAccepted=false, FrontendBrowserAccepted=false, FullFeatureAccepted=false**; service chưa được runner rebuild/restart. 1041 ca backend là chứng cứ XML đã revalidate, không phải ca mới chạy ở frontend. Các JSON `.actual` là export từ PostgreSQL/JDBC/MockMvc với fixture riêng, không phải tài khoản DTS thật. Contract gốc được giữ nguyên trong thư mục `contract/` của gói áp dụng.

Frontend được kiểm bằng contract, HTTP adapter, React DOM/query/store, hồi quy Card01–06, TypeScript/lint/build, SSR và patch guard. Các kiểm tra này không thay thế nghiệm thu JWT/Gateway/Kafka, số liệu nhập bù và video/browser trên máy owner. Không cài/chạy lại migration, service backend hay test HTTP dài từ gói frontend này.

## Áp dụng và nghiệm thu

Giải nén ngoài repo, dùng `APPLY_COMMANDS.txt`: Ctrl+C terminal Next cũ, dry-run → apply → verify, chạy `python .\scripts\verify-simulation-performance-v8.py`, rồi `npm run dev`. Nhánh dự kiến `feature/video-simulation-backend-integration`, HEAD `498612284b440b20363efecd4f13bb00fa010bfe`. Gói nhận đúng các working tree đã review v3/v4/v5/v6/v7, sao lưu byte gốc ngoài repo và dừng nếu có drift chưa được review. Không stage, commit, push, checkout, reset, cài package, chạy database hoặc tự restart service.

Sau khi backend mới chạy đủ: chọn hạng hỗ trợ mô phỏng → tab mô phỏng → Lịch sử/Tiến độ đúng nguồn → F5 giữ module. Đổi tab lý thuyết kiểm tra giao diện/chức năng cũ; đổi hạng không mô phỏng dùng nguyên legacy. Kết quả/Xếp hạng luôn COMBINED cho hạng được bật bất kể tab. Kiểm tra lọc/phân trang, kết quả cũ/new/0 điểm, bookmark set/unset, luyện0→5, null/partial/503, đổi tài khoản/hạng/bank, bankReady=false và đường xem kết quả/review. Đối chiếu số với backend theo cùng scope/asOf; không tự sửa dữ liệu để làm test xanh.
