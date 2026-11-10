# Card 01: tích hợp backend ngày 02/11/2026

Phạm vi: SIM-01 / SIM-02 / SIM-03. Tiếp tục `feature/video-simulation-integration`, source gốc `498612284b440b20363efecd4f13bb00fa010bfe`. Không thay các màn lý thuyết, CSS, header/footer hoặc giao diện admin. Chưa chốt hoàn thành Card 01.

## Nguồn và điểm nối

Hợp đồng: `DTS-Card01-Frontend-Handoff-20261102-v1(1).zip` do chủ dự án cung cấp. Đã kiểm tra HASHES.sha256 của cả sáu file nội dung. Gói patch giữ bản bàn giao bên ngoài source ở `backend-handoff/`.

`simulation-http-source.ts` dùng `practiceApi` chung: base `/api/practice` + `/v1/simulations`. Không thêm domain, token/session riêng hoặc dữ liệu mẫu. `.env.local`, `GATEWAY_API_URL` và rewrite hiện có được giữ nguyên. Adapter kiểm tra DTO, user/license/bank, UUID, attempt/nonce/result; dùng lỗi HTTP của client chung. Cache trong phiên chỉ chứa phản hồi đã xác thực, không lưu progress/score/bookmark/ticket vào localStorage. Cache riêng bị xóa khi logout/đổi user.

| Chức năng | API / hành vi |
|---|---|
| Capability | `/v1/exams/license-catalog`: simulationEnabled, simulationReady, simulationBankVersion; không suy ra từ nhóm ô tô hoặc bank lý thuyết. |
| SIM-01 | GET overview, tên chương/tổng số/tiến độ từ backend. Tiếp tục ôn đọc cursor cùng bank, giữ sourceAttemptId nếu có. |
| SIM-02 | GET chapter, filter/sort/page 0-based/size12; bestScore=0 vẫn là đã luyện. Luyện toàn chương dùng startScenarioId riêng với cursor. |
| Cursor | PUT với expectedRevision/eventId; xung đột đọc lại, không ghi đè mù. Mở tình huống thủ công mới ghi cursor. |
| Lượt luyện | GET detail chỉ đọc. Mutation tạo lượt sau read, eventId giữ trong query createEvent đến ACK; attemptId được đưa vào URL. Refetch không tạo lượt. Mở lại bằng attemptId đọc đúng lượt, pin bank của nó. |
| Video | GET playback thật; dùng URL/expiry/nonce/checkpoint được cấp. START sau metadata/seek checkpoint; heartbeat khoảng thời gian policy, lấy vị trí media thật. Không chờ GET phụ sau Start ACK. |
| Phản ứng | PUT response, giữ nguyên eventId/mediaTimeMs/nonce qua retry. Space repeat/input/control/dialog không phát lệnh ngoài ý muốn. |
| Hoàn tất | Vị trí cuối thật từ video ended, chờ phản ứng ACK. Điểm/timeline/gợi ý từ Result. Mất ACK đọc attempt; retry cùng complete payload. |
| Gián đoạn | Pause/waiting/error/seek/rate/offline/ẩn tab dừng liên tục và interrupt. Tải lại lấy nonce/checkpoint, Start ở checkpoint. Reload PLAYING yêu cầu khôi phục, không reset về0. |
| Bookmark | PUT trạng thái tuyệt đối, cập nhật sau ACK; không refetch làm reset player đang phát. Invalidate overview/chapter theo scope. |
| Thoát | Xác nhận trong modal cũ; đợi cancel ACK trước điều hướng. Unload là best effort; nếu request không gửi được, lần mở lại đọc trạng thái server rồi phục hồi. |

## Bảo toàn UI

Baseline gốc `ui-accepted-v10.json` và verifier gốc **không bị cập nhật**. 28/31 file UI vẫn nguyên byte chuẩn hóa; ba file thay đổi hành vi có chủ đích:

- `practice-hub-modules.tsx`: capability thật và truyền vào container.
- `simulation-practice-hub.tsx`: tổng quan chỉ hiển thị số liệu Card01 đã có; số liệu các card chưa bàn giao vẫn ở trạng thái chờ.
- `simulation-video-player.tsx`: nối lifecycle/media/heartbeat/interrupt/complete; không đổi CSS, cấu trúc tag hoặc chữ JSX tĩnh.

Kiểm tra AST đã đối chiếu className, tag sequence và chữ JSX tĩnh của ba file với Git gốc. Đây là kiểm tra source, không phải kiểm tra pixel hay bằng chứng video thật đã chạy trên browser. File delta riêng ghi đúng ba thay đổi dự kiến; không dùng nó để thay thế baseline được chủ dự án duyệt.

```powershell
python .\scripts\verify-simulation-ui-baseline.py
# Dự kiến exit1 và liệt kê đúng ba file trên vì callback/binding đã thay đổi.
python .\scripts\verify-simulation-card01-integration.py
# Kiểm tra 28 file nguyên gốc + đúng ba bản nối đã review, không tự sửa hash.
node --test .\tests\simulation-card01-contract.test.cjs
npm run build
```

Các test DOM/player/container cần jsdom trong thư mục QA ngoài repo, khai báo `DTS_QA_NODE_MODULES`. Không thêm dependency hoặc mock vào runtime. Kết quả và lệnh QA nằm trong `validation/` của ZIP.

## Mục chưa nghiệm thu

1. **GAP-BE-REPLAY:** bản backend bàn giao từ chối GET playback cho COMPLETED/CANCELLED. Kết quả vẫn đọc được; URL cũ còn hạn chỉ có thể phát lại trong phiên hiện tại. Sau reload/hết hạn, backend cần endpoint read-only playback riêng (cùng ownership/bank/result, không tạo attempt hoặc đổi tiến độ). Chưa có contract bổ sung nên frontend không đoán endpoint hoặc tạo lượt giả.
2. Gateway và video chạy tại localhost trên máy chủ dự án; không truy cập được từ môi trường kiểm tra frontend này. **WEB-01…28 chưa được đánh dấu PASS**, dù unit/contract/DOM/build đạt. Phải thực hiện checklist trên browser thật, với backend local đúng patch đã bàn giao và tài khoản có quyền; không gửi mật khẩu/token qua chat.
3. API global Card02/03, guide/admin Card04, thi thử Card05/06 và summary toàn module chưa được bàn giao trong gói Card01. Các getter/feature flag tương ứng vẫn chờ. Overview chỉ dùng cho số liệu ôn chương.

## Chạy trên máy dự án

Giữ Identity, Gateway, Practice, Content Builder, Media, MinIO và PostgreSQL theo bản backend đã Apply/Verify. Patch không chạy migration, install, restart hoặc thay Git. Dừng Next trước khi apply. Sau verify, chạy `npm run dev`, đăng nhập mới qua giao diện chung để nhận quyền hiện tại.

Đi từ `/practice` → Mô phỏng tình huống → Ôn theo chương. Kiểm tra đủ SIM-01, filter/page SIM-02, mở SIM-03, phát MP4 thật, Space/nút, hoàn tất 0/5 và có phản ứng, reload/gián đoạn/retry/bookmark/cursor/hai user/hạng khác theo ACCEPTANCE_CHECKLIST.md. Điểm từng ca phải lấy từ server, không dùng ví dụ của handoff.

Trả lại status/method/path/code/traceId/attemptId/bankVersion và bước lỗi, gỡ token/password/query chữ ký trước khi gửi. Không đổi hash baseline để làm xanh. `BackendEndToEndAccepted=false`, `FullCard01Accepted=false` cho tới khi browser checklist và gap bắt buộc được xử lý.
