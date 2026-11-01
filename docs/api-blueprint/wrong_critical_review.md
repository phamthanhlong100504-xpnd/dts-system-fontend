# Ôn câu sai và câu điểm liệt

## Trang

`/practice/wrong`, `/practice/wrong/review`, `/practice/critical-questions`, `/practice/critical-questions/review`. Hai luồng có type/service riêng, không dùng chung ID hoặc giả định endpoint giống nhau.

## Nghiệp vụ

Overview được lấy theo GPLX. Câu cần ôn, số lần sai và trạng thái tiến độ do backend xác định. Tạo session trước khi làm; đọc lại phiên bằng sessionId khi mở route review. Mỗi câu gửi lựa chọn đến backend rồi dùng response để hiển thị đáp án/giải thích và cập nhật cache. Lưu cursor hỗ trợ tiếp tục; bookmark liên kết chương/câu trong ngân hàng đúng GPLX.

| Client | Method | Path |
| --- | --- | --- |
| practiceApi | GET | `/v1/questions/wrong/overview`, `/v1/questions/wrong` với licenseClass |
| practiceApi | POST | `/v1/wrong-questions/sessions` |
| practiceApi | GET | `/v1/wrong-questions/sessions/{sessionId}` |
| practiceApi | POST | `/v1/wrong-questions/sessions/{sessionId}/answers` |
| practiceApi | PUT | `/v1/wrong-questions/sessions/{sessionId}/cursor` |
| practiceApi | POST | `/v1/wrong-questions/sessions/{sessionId}/finish` |
| practiceApi | GET | `/v1/questions/critical/overview?licenseClass=...` |
| practiceApi | POST | `/v1/questions/critical/sessions` |
| practiceApi | GET | `/v1/questions/critical/sessions/{sessionId}` |
| practiceApi | POST | `/v1/questions/critical/answers` |
| practiceApi | PUT | `/v1/questions/critical/sessions/{sessionId}/cursor` |
| practiceApi | PUT | `/v1/learning/chapters/{chapterId}/bookmarks/{questionId}` |

Critical answer payload có sessionId và scope theo DTO; không tự thêm endpoint finish giống Wrong nếu service không định nghĩa. Hook cursor có optimistic cache và rollback khi lỗi. Không coi câu đúng lặp lại là EXP mới; việc ghi nhận EXP là trách nhiệm backend.

## Source đối chiếu

- `src/features/practice/wrong-questions-service.ts`
- `src/features/practice/wrong-question-session-service.ts`
- `src/features/practice/critical-progress-service.ts`
- `src/features/practice/critical-question-session-service.ts`
- `src/features/practice/use-wrong-question-session.ts`
- `src/features/practice/use-critical-question-session.ts`

Các đường dẫn trong bảng API là phần sau base URL của client được ghi trong bảng. DTO và xử lý hiện hành nằm trong các file source trên. Không lấy nội dung snapshot đã che thông tin để ghi đè source.
