# Card 02 và replay — tích hợp frontend 02/11/2026

Tiếp tục working tree `feature/video-simulation-backend-integration`, HEAD nền `498612284b440b20363efecd4f13bb00fa010bfe`. Card 01 đã được chủ dự án chốt luồng luyện chính, chấp nhận để GAP-BE-REPLAY xử lý cùng Card 02. Không commit/push cho tới khi chủ dự án chốt đủ các card.

## Contract và phạm vi

Nguồn: `DTS-Card02-Frontend-Handoff-20261102(1).zip`. Đã kiểm tra checksum toàn bộ 20 file nội dung; 12 response thực tế đã redacted khớp wire schemas. Backend báo 586 JUnit / 341 API runtime đạt; đó là bằng chứng backend, không phải test browser của frontend.

Ba API mới qua client `practiceApi` hiện có:

| Nguồn | API | Mapping / quy tắc |
|---|---|---|
| Hub cần ôn | GET `/v1/simulations/review-needed/overview` | User/license/bank và số liệu thực; không suy ra từ danh sách một trang. |
| SIM-04 | GET `/v1/simulations/review-needed` | Sáu chương, global total, filteredCount và page object riêng; điểm0 được giữ, sort BEST_SCORE_ASC rồi scenarioNumber. |
| Result replay | GET `/v1/simulations/attempts/{id}/replay` | readOnly=true, policy/expiry/MP4 URL theo server; phải khớp attempt/scenario/bank/scoring/duration. Không gọi `/playback` cho COMPLETED. |

Không đưa api-examples vào runtime. Không thay Gateway/auth/refresh, .env, migration, package hoặc service backend. Card03 bookmark toàn module, Card04 guide/admin, Card05/06 thi thử vẫn chưa bật nguồn bằng contract này.

## Luồng Card 02

- Danh sách phân biệt chưa luyện, những tình huống đã luyện đều từng đạt5, lọc chương rỗng, trang vượt dữ liệu và lỗi HTTP. Không suy ra đã xong toàn bộ ngân hàng khi totalNeedReview=0.
- Request page sau gửi expectedDatasetVersion lấy từ response trước. 409 REVIEW_CHANGED không được retry với hash cũ; về page0 giữ chapter/sort/bank và bỏ token cũ. Dữ liệu giảm ở trang cuối được điều chỉnh về trang hợp lệ rồi fetch lại.
- Counts trên list lấy cùng response list. Không ghép overview cũ vào list mới. Cache key gồm user/license/bank/chapter/sort/page/size/dataset; response của query cũ không thay được view mới.
- Ôn lại là ý định mới: dùng create/queue/player Card01, pin bank từ SIM-04; URL giữ return context. Quay về giữ filter/sort/page/bank, bỏ token dataset cũ và refetch. Không xóa item theo điểm do client tính hoặc theo ended.
- Sau ACK hoàn tất/bookmark, invalidate list/overview của cùng user+bank, kể cả hạng ô tô khác cùng bank. Active scenario được cập nhật từ ACK; không bị background refetch reset video.
- Thumbnail expiry được đọc từ backend, refetch có giới hạn thời gian hợp lệ của timer. Không dựng URL MinIO hoặc tự thay bucket.

## Replay và quyền

- Đọc đúng attempt COMPLETED đã biết; latestAttempt không được dùng để đoán lượt best hay lịch sử. Lấy replay mới sau reload bằng cùng ID.
- Replay không có callback start/heartbeat/response/complete/interrupt/cursor. Player chặn các event ghi khi readOnly/completed, kể cả Space/seek/pause/waiting/ended. Luyện lại là một nút có ý định riêng và cần quyền learn.
- Hết hạn/lỗi media: xin replay mới cùng ID, giữ vị trí xem cục bộ khi thay src. Không thay result hoặc tăng số lượt. Lỗi dependency replay không đổi kết quả COMPLETED đã lưu thành save-error.
- User thiếu simulations:learn vẫn đọc SIM-04/replay, các nút luyện/bookmark bị khóa. Quyền hiển thị lấy từ session Identity hoặc claim permissions trong JWT hiện có; không suy ra quyền từ role Admin. Backend tiếp tục là nơi kiểm tra quyền/ownership.
- Shell danh mục chung vẫn cần practice:read như contract Card01; tài khoản test read-only cần quyền chung này cùng simulations:read và media:read.

Backend đã bổ sung GAP-BE-REPLAY và frontend đã nối endpoint. Việc đóng nghiệm thu replay trên web vẫn chờ browser với URL/video thật; không ghi PASS dựa trên mock hoặc response mẫu.

## Bảo toàn source/UI và kiểm tra

Giữ nguyên CSS/header/footer/fonts/layout, các view Card01/Card02 và các màn lý thuyết. Trong 31 file UI baseline, riêng `simulation-video-player.tsx` đổi thêm lifecycle replay và câu lỗi video theo chế độ; className và cấu trúc tag giữ nguyên. Các page/container/types/source/hooks đổi phần nghiệp vụ theo contract.

Giữ nguyên `ui-accepted-v10.json`, `card01-integration-delta.json` và verifier Card01. Verifier Card01 hiện dự kiến phát hiện player đổi tiếp do Card02; không cập nhật hash cũ để làm xanh. Delta Card02 riêng ghi before=Card01 đã tích hợp, after=bản hiện tại, và xác nhận 30/31 file UI không đổi so với checkpoint Card01.

```powershell
python .\scripts\verify-simulation-card02-integration.py
node --test .\tests\simulation-card01-contract.test.cjs .\tests\simulation-card02-contract.test.cjs
npm run build
npm run dev
```

Các test DOM cần jsdom ở thư mục QA ngoài repo và biến `DTS_QA_NODE_MODULES`; không thay dependency runtime. Gói ZIP kèm lệnh, output, diff, bản contract và checklist C02-W01…26. Bộ test có ca wire/parser, pagination stale, scope/permissions, replay và hồi quy Card01; không phải phát MP4 trên browser.

Chạy API/backend thật trên máy dự án trước khi nghiệm thu web. Từ `/practice` → Mô phỏng → Tình huống cần ôn lại; test Ôn lại → hoàn tất → quay về danh sách. Test thêm reload kết quả COMPLETED → phát replay → tua/tạm dừng → hết hạn URL; kiểm tra Network chỉ có GET replay trong lúc xem. Không gửi token/password/query chữ ký trong log hoặc ảnh.

`RuntimeUiAcceptanceCompleted=false`, `FullCard02Accepted=false` cho tới khi chủ dự án kiểm tra web và chốt. Các lỗi nhỏ Card01 đã gom để sửa sau vẫn giữ nguyên phạm vi đó.
