# Card 04 — Hướng dẫn mô phỏng SIM-06, frontend integration — 02/11/2026

Nối tiếp source Card01/02/03 trên `feature/video-simulation-backend-integration`, HEAD nền `498612284b440b20363efecd4f13bb00fa010bfe`. Giữ toàn bộ thay đổi local, chưa add/commit/push. Card03 đã được chủ dự án áp dụng/verify và chạy73 contract test; đây không thay cho xác nhận tất cả ca browser Card03.

## API và dữ liệu

Học viên: `/practice/simulations/guide`. Quản trị: `/admin/simulation-guide`. Source dùng `contentBuilderApi` hiện có, auth/JWT/refresh chung, path `/v1/simulation-guide/...`; DTO trực tiếp, không unwrap `data.data` hoặc dùng JSON mẫu làm nội dung chạy.

Đủ7 operation: current, admin snapshot, saved preview, save draft, publish, publication history và version theo revision. Scope current lấy user/hạng/bank hiện hành từ catalogue, không lấy bank lịch sử của lượt luyện. GUIDE-409-BANK làm mới catalogue dùng chung một lần, remount query theo bank mới; không sửa attempt hay vòng lặp retry. Counts/labels/availability lấy API, không hardcode6/120, timestamp điểm hoặc nội dung mẫu.

Wire schema kiểm đầy đủ schema1, fixed sectionOrder/item keys/thứ tự/số lượng, plain text, giới hạn12.000 UTF-16/trường và200.000/tài liệu, metadata audit/actor, trạng thái publication và bank. Nháp cho phép chữ rỗng, publication yêu cầu đủ chữ. Body lưu chỉ expectedRevision/schemaVersion/content, body công bố chỉ expectedRevision; không gửi actorId/userId, bank counts hoặc setting runtime.

Client HTTP dùng chung chỉ được bổ sung nhánh đọc `error: GUIDE-*` cho base Content Builder. Cách unwrap thành công, refresh/auth và mã lỗi của service khác giữ nguyên; có test adapter Axios thật cho nhánh này. Thay đổi này được khai báo trong payload/guard thay vì giấu ngoài phạm vi.

## Editor, preview, save/publish

- So nội dung theo cấu trúc: object keys không phụ thuộc thứ tự JSONB, array vẫn giữ thứ tự. Không còn dirty/echo/publish-needed giả do thứ tự key.
- Raw draft/publication/template giữ riêng. Preview nháp đã lưu dùng server preview. Với chữ chưa lưu hoặc publication preview, clone nội dung và chỉ thay comparison.exam bằng mode an toàn từ server preview. Không mất chữ đang nhập ở các khu vực khác, không sửa raw editor. Release flag thi thử mô phỏng vẫn false.
- Save xác nhận revision tăng đúng1, raw content echo và publication cũ không đổi. Publish chỉ sau save, đúng revision/content của draft, không tự tăng counter hay sửa audit. Có lock chống click lặp và chặn edit trong write pending.
- Không auto-retry mutation. Timeout/503 hoặc ACK không xác nhận được: đọc GET admin một lần trước mọi thử lại. Chỉ báo thành công khi content/revision trùng; trường hợp chưa rõ kết quả giữ input và chặn ghi tiếp cho tới khi người dùng chấp nhận tải/đối chiếu lại. 409 giữ input và không tự lấy revision mới để ghi đè.
- Query refetch không thay chữ đang nhập. Reload/restore/rời trang khi dirty đi qua hộp xác nhận hiện có. Logout/đổi actor dọn query guide, response/ACK muộn không đưa nội dung tài khoản cũ trở lại cache.
- Quyền UI dùng role Admin và permission Identity tương ứng read/update/publish; backend vẫn quyết định quyền. Read-only không có callback edit/save/publish/restore. Nếu JWT cũ chưa có quyền sau Identity V13, đăng nhập/refresh theo luồng hiện có.

History chỉ publication/archive, tối đa100, revision giảm dần và không trùng. Mở nội dung phiên bản trong disclosure hiện có. Nút “Dùng nội dung phiên bản này” đọc version chính xác, nạp raw content vào editor, giữ revision đang làm; người dùng lưu thành nháp mới rồi preview/publish. Không active lại revision cũ, không DELETE/PATCH lịch sử. Source hỗ trợ GET revision cũ ngoài danh sách100; không thêm màn tra cứu lịch sử mới.

## Bảo toàn UI/source

30/31 file UI nguyên so với Card03. Chỉ `simulation-guide-admin-view.tsx` đổi bindings preview/permission/restore; nút restore nằm trong nội dung lịch sử đã mở và dùng style nút phụ sẵn có. Các tag/className hiện hữu, CSS, font, header/footer và layout không đổi. Trang học viên vẫn dùng view đã chốt.

Không sửa source/Card01–03, các view lý thuyết/admin khác hoặc các baseline/delta lịch sử. Ngoại lệ chung duy nhất là nhánh mã lỗi GUIDE trong `src/lib/api/http.ts`, được guard và kiểm hồi quy. Test loader thêm fileName khi transpile để phân biệt generic TS với JSX; không phải thay đổi runtime ứng dụng. Package/lock/config/env giữ nguyên.

Card04 thêm delta/verifier riêng, nối chuỗi v10→Card01→Card02→Card03→Card04. Từ đây dùng `verify-simulation-card04-integration.py`; verifier cũ không biết bindings mới.

## Validation và nghiệm thu

- 163 test frontend đạt:97 contract/queue/HTTP và66 DOM/player/container/hub; gồm hồi quy Card01–03 và44 test Card04. Axios transport được stub có kiểm soát, không gọi backend thật trong test.
- Typecheck, lint và production build đủ77/77 trang. Container QA dùng shim RSS ngoài repo do thiếu /proc; không đưa shim vào payload.
- 26 response backend thật đã pseudonymize khớp wire/mapping; evidence backend331 test/541 runtime check được giữ nguyên, không biến thành bằng chứng browser frontend.
- Source/AST kiểm tag/className/CSS, không phải pixel hoặc browser E2E. SSR smoke chỉ kiểm shell không đăng nhập. Checklist `backend-handoff/ACCEPTANCE_CHECKLIST.md` có24 ca frontend vẫn NOT_RUN trên browser trong phiên này.

Sau áp dụng có thể chạy:

```powershell
python .\scripts\verify-simulation-card04-integration.py
node --test .\tests\simulation-card01-contract.test.cjs .\tests\simulation-card02-contract.test.cjs .\tests\simulation-card03-contract.test.cjs .\tests\simulation-card04-contract.test.cjs .\tests\simulation-card04-http.test.cjs
npm run build
npm run dev
```

Test tối thiểu trên máy dự án: learner current đúng scope/counts; Admin sửa→save→learner còn publication cũ; preview giữ chữ chưa lưu và exam chưa khả dụng; publish→learner reload nhận chữ mới; history→nạp phiên bản→lưu nháp mới; conflict/timeout giữ input; kiểm quyền và hồi quy Card01–03. Ca lỗi dùng fixture/request interception có kiểm soát, không xóa dữ liệu thật để tạo lỗi. Chỉ chốt FullCard04Accepted sau nghiệm thu browser/chủ dự án.
