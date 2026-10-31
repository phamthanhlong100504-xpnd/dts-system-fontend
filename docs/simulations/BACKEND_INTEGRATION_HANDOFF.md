# Module mô phỏng – Bàn giao frontend chờ backend

Ngày 28/10/2026: chủ dự án đã duyệt giao diện cả 6 card sau Spacing v10. Chỉ chốt giao diện; chưa nghiệm thu chức năng backend hoặc E2E.

## Source sau khi dọn

- Tiếp tục nhánh `feature/video-simulation-integration`; giữ nguyên phần lý thuyết đã chốt.
- Component hiển thị/CSS/video/modal/bảng điểm của 6 card được giữ nguyên byte. Banner duyệt thiết kế đã được gỡ khỏi các page/container.
- 27 file dữ liệu minh họa, toolbar và route `design-review` được lưu ngoài repo. Các URL `design-review` không còn là điểm vào thử nghiệm; dùng route thật để nghiệm thu backend.
- Bản nguồn của 31 file giao diện đã chốt được sao chép ra `accepted-ui/source` trong cùng thư mục lưu trữ để đối chiếu/khôi phục có chủ đích; các file này vẫn ở nguyên trong repo.
- Giữ types, validators, hooks, controller, query keys, navigation và các integration port. Không xóa file chỉ vì hiện chưa có dữ liệu backend.
- Không có API giả hoặc dữ liệu local thay cho backend. Ba getter nguồn vẫn trả `null`; các trạng thái chờ là đúng cho đến khi cấu hình nguồn thật.
- Dừng Next trước khi dọn. Cache `.next` và `tsconfig.tsbuildinfo` được chuyển ra bản sao lưu nếu có, tránh type cache còn trỏ các route đã chuyển đi. Next sẽ tạo lại cache khi build/dev; giữ nguyên `node_modules` và cấu hình môi trường.

## Ranh giới nối backend

| Phần | Điểm nối và quy tắc |
|---|---|
| Card01/02/03 | `simulation-learning-source.ts` / `SimulationLearningSource`: overview, chapter, scenario, command, reviewNeeded, bookmarks, bookmark. Các danh sách cá nhân và tổng số lấy từ backend theo scope. |
| Card04 | `simulation-guide-service.ts` / `SimulationGuideSource` trong `simulation-guide-types.ts`: current, admin, saveDraft, publish, history. Học viên đọc nội dung đã công bố, Admin có revision/ACL và bản nháp riêng. |
| Card05/06 | `simulation-exam-source.ts` / `SimulationExamSource`: preparation, create, session, playback, command, result, review, reviewPlayback; presets/presetPreparation là capability tùy contract bàn giao. |
| Tổng quan | `SimulationPracticeHub` hiện chưa được truyền summary thật. Khi tích hợp, bổ sung container/hook ánh xạ summary backend vào `SimulationHubState`, giữ nguyên JSX/CSS của view. `practice-hub-modules.tsx` hiện có phần điều phối tab và dữ liệu; nếu cần đổi props dữ liệu, kiểm tra diff riêng và duyệt thay đổi baseline có chủ đích. |
| Phát hành thi thử | `simulationMockExamUiReleased` trong `simulation-guide-service.ts` vẫn `false`; chỉ bật sau khi contract và luồng Card05/06 đã được test thành công. |

Đây là interface frontend để ánh xạ dữ liệu, không phải OpenAPI đã được backend chấp thuận. Không suy đoán URL/method/envelope hoặc tái dùng API lý thuyết. Đọc contract, commit/nhánh bàn giao, kết quả test và capability thật trước khi triển khai adapter. Dùng cấu hình Gateway/auth/client chung hiện có; không commit token hay signed URL.

## Trình tự tích hợp

1. Xác nhận backend đã bàn giao đủ contract/version, quyền truy cập, lỗi, pagination/filter/scope, media URL và quy tắc chấm điểm. Lập bảng interface frontend → endpoint bàn giao; phần thiếu ghi gap trước khi triển khai.
2. Viết adapter HTTP trong lớp source/service, ánh xạ DTO qua validators hiện có. Giữ component hiển thị và CSS đã chốt; không thay trạng thái thiếu dữ liệu bằng JSON local hay kết quả thành công tự tạo.
3. Bảo toàn scope user/license/bank/version, query invalidation, phản ứng đầu tiên, idempotency, reconciliation khi mất ACK, trạng thái terminal và đồng bộ khi tải lại trang.
4. Bảo toàn chế độ luyện mới/xem lại, đánh dấu độc lập với điểm, cần ôn lấy đúng điều kiện từ backend. Video lỗi/buffering không tự tính hoàn thành; thời điểm phản ứng từ media thực, backend kiểm chứng playback/chấm điểm.
5. Thi thử không lộ điểm/gợi ý trước submit được xác nhận. Passing score/policy/version và kết quả Đạt lấy từ backend. Bộ đề ngừng công bố/đổi phiên bản không làm mất kết quả cũ.
6. Chạy kiểm tra baseline, build/lint, contract tests và thử toàn luồng trên web thật. Kiểm tra cả trạng thái lỗi, retry, tải lại, hết hạn media, session đang làm, tài khoản/hạng khác; lưu bằng chứng kết quả test.

## Giữ giao diện đã duyệt

Chạy từ repo trước và sau tích hợp:

```powershell
python .\scripts\verify-simulation-ui-baseline.py
```

`ui-accepted-v10.json` ghi hash các component trình bày cùng CSS/header/footer chung. Kết quả khác baseline yêu cầu đọc diff và duyệt thay đổi có chủ đích; không tự cập nhật hash để làm kiểm tra xanh. Hash kiểm tra source, không thay thế duyệt UI với dữ liệu/video backend thật. Dữ liệu thật thay đổi nội dung/số lượng là bình thường, bố cục vẫn phải được kiểm tra responsive/overflow/empty/error.

## Route nghiệm thu

- `/practice` → tab Mô phỏng tình huống.
- `/practice/simulations/chapters`, `/chapters/[chapterId]`, `/scenarios/[scenarioId]`.
- `/practice/simulations/review-needed`, `/bookmarks`, `/guide`.
- `/admin/simulation-guide` cho draft/save/publish/history/ACL.
- `/practice/simulations/exams/random`, `/exams/presets`, `/exams/presets/[presetSetId]`.
- `/practice/simulations/exams/[sessionId]`, `/result`, `/review?position=1`.

Chỉ chốt hoàn thành chức năng từng card sau khi dữ liệu thật chạy đúng trên UI và có bằng chứng test. Giao diện được chủ dự án duyệt không đồng nghĩa backend đã hoàn chỉnh.
