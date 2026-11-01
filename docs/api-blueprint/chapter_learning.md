# Học theo chương và phiên ôn chương

## Trang

`/practice/chapters` tổng hợp chương; `/practice/chapter/[chapterId]` học/ôn một chương. Route hiện chấp nhận chapterId nguyên từ 1 đến 6. Tham số `from=progress` giữ đường quay lại tổng quan tiến độ.

## Nghiệp vụ

Đọc câu hỏi đúng GPLX, đáp án đã học, bookmark và cursor từ Practice. Khi chọn đáp án, ghi lên backend và dùng feedback chuẩn để hiển thị đúng/sai/giải thích. Cursor và bookmark lưu riêng, không thay cho việc ghi nhận đã học. Chuyển chương hoặc quay lại cần giữ logic lưu/điều hướng hiện có.

Học thường và phiên review là hai luồng khác nhau. Review tạo session, đọc lại session sau start/answer/cursor/finish và sử dụng trạng thái IN_PROGRESS/COMPLETED. Không ghi đè đáp án học lịch sử bằng bộ nhớ tạm của trình duyệt.

| Client | Method | Path |
| --- | --- | --- |
| practiceApi | GET | `/v1/learning/chapters?licenseClass=...` |
| practiceApi | GET | `/v1/questions/chapter/{chapterId}?licenseClass=...` |
| practiceApi | GET/POST | `/v1/learning/chapters/{chapterId}/answers` |
| practiceApi | PUT | `/v1/learning/chapters/{chapterId}/cursor` |
| practiceApi | GET | `/v1/learning/chapters/{chapterId}/bookmarks?licenseClass=...` |
| practiceApi | PUT | `/v1/learning/chapters/{chapterId}/bookmarks/{questionId}` |
| practiceApi | POST | `/v1/learning/chapters/{chapterId}/review-sessions` |
| practiceApi | GET | `/v1/learning/chapters/{chapterId}/review-sessions/{sessionId}` |
| practiceApi | POST | `/v1/learning/chapters/{chapterId}/review-sessions/{sessionId}/answers` |
| practiceApi | PUT | `/v1/learning/chapters/{chapterId}/review-sessions/{sessionId}/cursor` |
| practiceApi | POST | `/v1/learning/chapters/{chapterId}/review-sessions/{sessionId}/finish` |

GET theo GPLX truyền query; mutation truyền GPLX/questionId/lựa chọn hoặc cursor theo interface cạnh service. Sau ghi nhận, hook cập nhật cache rồi invalidate overview/answers/bookmarks tương ứng. Lỗi lưu phải được hiển thị, không coi thao tác chưa được server nhận là đã đồng bộ.

## Source đối chiếu

- `src/features/practice/chapter-learning-service.ts`
- `src/features/practice/chapter-review-session-service.ts`
- `src/features/practice/use-chapter-session.ts`
- `src/features/practice/use-chapter-review-session.ts`
- `src/features/practice/components/chapters/chapter-session-content.tsx`

Các đường dẫn trong bảng API là phần sau base URL của client được ghi trong bảng. DTO và xử lý hiện hành nằm trong các file source trên. Không lấy nội dung snapshot đã che thông tin để ghi đè source.
