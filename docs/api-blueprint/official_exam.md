# Danh mục, phòng chờ và phiên thi chính thức

## Trang

`/examination` → `/examination/[examId]` → `/examination/[examId]/run`. Kết quả và review dùng `/examination/result/[sessionId]` và `/examination/result/[sessionId]/review`.

## Danh mục và quyền tham gia

Tabs OPEN/UPCOMING/PARTICIPATED đọc API student. Backend xác nhận GPLX qua Identity; list service không gửi GPLX cache làm quyền quyết định. UI nhận title, examVersionId, serverTime, used/remainingAttempts, canStart, canResume, activeSessionId, reasonCode, retryAvailableAt. Null số lượt có thể biểu thị không giới hạn, không đổi thành 0.

Phòng chờ đọc rule, grading và instructions từ version. Start dùng examId/examVersionId, có thể nhận resumedExisting. UI không chọn lại paper từ ngân hàng khi đang thi; paper, đáp án và chính sách chấm đã được Examination freeze.

| Client | Method | Path | Điểm cần giữ |
| --- | --- | --- | --- |
| examinationApi | GET | `/v1/student/exams?tab=...&page=...&size=...` | Phân trang/availability từ server |
| examinationApi | GET | `/v1/student/exams/{examId}?examVersionId=...` | Version query tùy chọn |
| examinationApi | POST | `/v1/exam-sessions` | Bắt đầu/tiếp tục nguồn |
| examinationApi | GET | `/v1/exam-sessions/{sessionId}`, `/paper` | Trạng thái, version, paper |
| examinationApi | POST | `/v1/exam-sessions/{sessionId}/answers` | `{version,answers}` |
| examinationApi | PATCH | `/v1/exam-sessions/{sessionId}/questions/{questionId}/mark` | `{version,marked}` |
| examinationApi | PATCH | `/v1/exam-sessions/{sessionId}/navigation` | `{version,targetPosition}` |
| examinationApi | POST | `/v1/exam-sessions/{sessionId}/violations` | eventId, TAB_SWITCH/FULLSCREEN_EXIT |
| examinationApi | PATCH | `/v1/exam-sessions/{sessionId}/pause`, `/resume` | Server quyết định cho phép |
| examinationApi | POST | `/v1/exam-sessions/{sessionId}/submit` | Header `Idempotency-Key` |
| examinationApi | GET | `/v1/exam-sessions/{sessionId}/result`, `/review` | Tôn trọng release/review policy |

## Version, thời gian và công bố

Luôn giữ version mới từ response cho thao tác tiếp theo. Khi trạng thái/version xung đột, UI phải đọc lại nguồn theo logic hiện có; không ghi đè version tùy ý. Idempotency key được giữ theo session trong sessionStorage hoặc fallback Map trong tab, dùng lại khi retry submit. Đồng hồ trình duyệt phục vụ hiển thị; trạng thái/thời hạn từ server mới có thẩm quyền.

SUBMITTED chưa đồng nghĩa được xem điểm. Chỉ hiển thị summary khi resultPublished; MANUAL/AFTER_EXAM_END có thể chờ phát hành. Review có quyền riêng. Không dùng lịch sử Result để cấp quyền xem paper/đáp án của Examination. URL tên kết quả dùng sessionId, không dùng resultId của Result hay examId của kỳ thi.

## Source đối chiếu

- `src/features/examination/official-exam-service.ts`
- `src/features/examination/official-exam-detail-service.ts`
- `src/features/examination/examination-service.ts`
- `src/features/examination/components/official-exam-session/official-exam-session-content.tsx`
- `src/app/examination/result/[sessionId]/page.tsx`

Các đường dẫn trong bảng API là phần sau base URL của client được ghi trong bảng. DTO và xử lý hiện hành nằm trong các file source trên. Không lấy nội dung snapshot đã che thông tin để ghi đè source.
