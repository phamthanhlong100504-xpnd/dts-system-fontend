# Thi thử ngẫu nhiên, bộ đề và kết quả Practice

## Trang

`/practice` là hub; `/practice/exams` hiển thị bộ đề; `/practice/exam/[examId]` làm bài; `/practice/result/[examId]` đọc kết quả. Core service và exam store được dùng chung cho EXAM/PRACTICE/preset.

## Luồng

Lấy config theo examType, kiểm tra active attempt rồi mới bắt đầu hoặc tiếp tục theo tương tác của người dùng. Tạo đề chỉ gửi examType và mode cho ngẫu nhiên; backend quyết định số câu, thời gian, câu liệt và thang chấm. Preset bắt đầu bằng ID bộ đề từ API. Không tự tạo UUID nguồn hoặc bộ câu hỏi để giả phiên backend.

Backend sở hữu đáp án, cursor, flag, pause/resume và kết quả. Cache exam store hỗ trợ UI/reload; không là nguồn duy nhất để xác nhận bài đã hoàn thành. EXAM và PRACTICE có hành vi hiện đáp án/feedback khác nhau; giữ đúng mode trả về. Nộp lại/thi lại dùng endpoint chuyên biệt và ID nguồn đúng.

| Client | Method | Path | Ý nghĩa |
| --- | --- | --- | --- |
| practiceApi | GET | `/v1/exams/config?examType=...` | Config đề |
| practiceApi | GET | `/v1/exams/active?examType=...` | Phiên đang làm |
| practiceApi | POST | `/v1/exams` | Bắt đầu ngẫu nhiên `{examType,mode}` |
| practiceApi | GET | `/v1/exams/presets?licenseClass=...` | Bộ đề đúng GPLX |
| practiceApi | POST | `/v1/exams/presets/{id}/sessions` | Tạo phiên từ preset, mode và fullName nếu có |
| practiceApi | GET | `/v1/exams/{examId}` | Khôi phục trạng thái nguồn |
| practiceApi | POST | `/v1/exams/{examId}/answers` | Lưu lựa chọn |
| practiceApi | PUT | `/v1/exams/{examId}/cursor` | Lưu câu hiện tại |
| practiceApi | GET/PUT | `/v1/exams/{examId}/flags`, `/v1/exams/{examId}/questions/{questionId}/flag` | Đọc/cập nhật đánh dấu |
| practiceApi | POST | `/v1/exams/{examId}/pause`, `/resume`, `/finish`, `/retry` | Hành động trên phiên |
| practiceApi | GET | `/v1/exams/{examId}/result` | Kết quả chấm từ nguồn |

## Kết quả và đồng bộ

Không đổi score thành correctCount bằng phép chia suy đoán. Kết quả Practice và lịch sử hợp nhất là hai API khác nhau. Sau finish, history/EXP phụ thuộc worker/Kafka/Result; UI không được tạo thêm lần thi chỉ vì projection chưa xuất hiện. Bộ đề, bankVersion và availability cần data import ở Practice.

## Source đối chiếu

- `src/features/practice/practice-service.ts`
- `src/features/practice/use-practice.ts`
- `src/stores/exam-store.ts`
- `src/features/practice/preset-exam-service.ts`
- `src/features/practice/use-preset-exams.ts`
- `src/app/practice/exam/[examId]/page.tsx`
- `src/app/practice/result/[examId]/page.tsx`

Các đường dẫn trong bảng API là phần sau base URL của client được ghi trong bảng. DTO và xử lý hiện hành nằm trong các file source trên. Không lấy nội dung snapshot đã che thông tin để ghi đè source.
