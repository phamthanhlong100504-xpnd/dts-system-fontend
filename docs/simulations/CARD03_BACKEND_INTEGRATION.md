# Card 03 — frontend/backend integration, 02/11/2026

Phạm vi SIM-05: Tình huống đã đánh dấu. Nối tiếp working tree Card01/02 trên `feature/video-simulation-backend-integration`, HEAD nền `498612284b440b20363efecd4f13bb00fa010bfe`. Không commit/push. Source nền được khôi phục nguyên byte từ Git và hai ZIP Card01/02 do chủ dự án cung cấp; tất cả prerequisite và payload hash của hai gói đều khớp.

## Contract và hành vi

- GET `/v1/simulations/bookmarks/overview` cấp số đã đánh dấu trên hub; GET `/v1/simulations/bookmarks` cấp danh sách, bộ lọc sáu chương và phân trang. Dùng `practiceApi` và session/refresh chung; không thêm userId vào request.
- Map `scope.bankVersion`, nested `page`, `datasetVersion`, thumbnail/expiry, tổng toàn bank và tổng sau lọc riêng biệt. Giữ null / 0 / 5, trạng thái đã luyện và completedAttemptCount thật; không chấm điểm, tính best hay lọc eligibility ở client.
- SCENARIO_ASC, size12, page0-based; pin bank/filter/page/token khi chuyển trang. 409 BOOKMARKS_CHANGED bỏ token cũ về page0, giữ filter/bank. Trang cuối bị thu hẹp chuyển về trang hợp lệ. Error khác không biến thành empty.
- PUT bookmark là trạng thái tuyệt đối, giữ scope đầy đủ và không thêm eventId. Chỉ bỏ item/count sau ACK và refetch. Chặn bấm lặp khi pending. Timeout/lỗi server có thể mất ACK: GET detail đúng scenario/scope để reconcile; chỉ xác nhận khi trạng thái server bằng trạng thái yêu cầu. 400/403/404 không bị coi là thành công. Retry giữ nguyên trạng thái mong muốn.
- Invalidate danh sách/hub cùng user/bank ở các hạng liên quan; giữ query scenario đang phát. Bookmark không bị xóa khi hoàn thành 0 hoặc 5. Bỏ dấu không sửa attempt/result/best/progress.
- Từ SIM-05 vào SIM-03 dùng engine/queue Card01, ý định BOOKMARK_NEW và bank đã pin, tạo đúng lượt sau hành động Luyện ngay/Ôn lại. Sau hoàn thành trở về filter/page cũ và đọc backend mới, không mang dataset token cũ. Replay COMPLETED tiếp tục dùng luồng chỉ đọc Card02.
- User thiếu simulations:learn vẫn đọc được khi đủ quyền read/media/catalogue; UI vô hiệu hóa ghi/luyện. Key có user/license/bank/filter/page/size/token, response đổi session bị loại; cache media riêng được dọn khi logout.

## Bảo toàn giao diện và kết quả đã chốt

31 file UI được đối chiếu với Card02: 30 nguyên vẹn; `simulation-bookmarks-view.tsx` chỉ thêm callback Retry cho modal sẵn có. CSS, className, thứ tự JSX tag, font/header/footer và các view khác giữ nguyên. `simulation-learning-pages.tsx` chỉ mở rộng việc pin bank cho context bookmark. Toàn bộ source ngoài feature simulations giữ nguyên, gồm lý thuyết và admin.

Không sửa baseline v10 hoặc delta/verifier lịch sử Card01/02 để làm xanh. Card03 có delta/verifier riêng, đối chiếu chuỗi lịch sử và source mới. Verifier cũ Card02 sẽ thấy callback mới của Card03; dùng verifier Card03 từ thời điểm này.

Chủ dự án đã xác nhận luồng ôn video Card01, luồng cần ôn Card02 và replay sau F5 vẫn phát/tua được, điểm/thời điểm phản ứng lưu giữ nguyên. GAP-BE-REPLAY được đóng theo xác nhận đó; đây không phải xác nhận đã chạy mọi ca lỗi/media expiry hay toàn bộ checklist lịch sử. Các báo cáo backend/QA cũ được giữ nguyên.

## Kiểm tra frontend

- 119 test contract/queue/player/container/hub đạt: 73 contract và 46 DOM harness. Test dùng dữ liệu QA riêng trong tests, không nhập vào source ứng dụng.
- TypeScript, lint 12 file source thay đổi và production build đủ 77/77 trang đạt. Build trong container QA dùng shim RSS ngoài repo do sandbox thiếu /proc; không đưa shim vào ứng dụng hoặc patch.
- 18 response backend đã redacted trong handoff được kiểm tra wire/mapping và mã lỗi. URL mẫu không dùng để phát media thật.
- Kiểm tra CSS/JSX/source là kiểm tra mã nguồn, không phải ảnh pixel hoặc browser E2E. Gateway/backend/session trên máy chủ dự án không truy cập được từ phiên QA này; browser Card03 và video thật vẫn cần chủ dự án chạy checklist C03-W01…24.

Từ repo sau áp dụng:

```powershell
python .\scripts\verify-simulation-card03-integration.py
node --test .\tests\simulation-card01-contract.test.cjs .\tests\simulation-card02-contract.test.cjs .\tests\simulation-card03-contract.test.cjs
npm run build
npm run dev
```

Các test DOM cần jsdom QA riêng và biến DTS_QA_NODE_MODULES; không thêm dependency runtime vào package/lock.

## Nghiệm thu web còn lại

Tham chiếu checklist nguyên bản trong ZIP ở `backend-handoff/ACCEPTANCE_CHECKLIST.md` và bảng `validation/WEB-acceptance.csv`, hiện NOT_RUN cho Card03. Tối thiểu kiểm: đánh dấu từ SIM-02 → SIM-05; chưa luyện/0/5; lọc chương; bỏ dấu và bỏ dấu cuối; lỗi/Retry; SIM-05 → luyện → kết quả → quay lại vẫn giữ dấu; hub/count và Card02 đồng bộ; reload/replay; hồi quy Card01/02. Ca nhiều trang/nhiều user cần fixture phù hợp và ghi BLOCKED nếu thiếu.

Chỉ chốt FullCard03Accepted sau nghiệm thu web và xác nhận chủ dự án. Không tự chuyển các cờ lịch sử false thành bằng chứng mới.
