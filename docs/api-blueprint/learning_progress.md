# Tổng quan tiến độ học tập

## Trang và API

`/progress` dùng `progressApi GET /v1/progress/learning-overview?licenseClass=...`. GPLX được trim/uppercase; response phải cùng scope. Phân biệt với trang `/results`: Progress là tiến độ học/ngân hàng câu hỏi, Result analytics là lượt thi và kết quả.

## Nghiệp vụ

Tổng quan thể hiện số câu đã học/tổng câu, completionPercent, số câu cần ôn, câu liệt đã học và tiến độ từng chương. Service ánh xạ learnedQuestions thành studiedQuestions để UI dùng. RemainingQuestions là totalQuestions-studiedQuestions sau khi kiểm count hợp lệ.

Mapper kiểm response có overall/review/critical/chapters, bankVersion và licenseClass; count là số nguyên không âm, percent 0..100, trạng thái NOT_STARTED/IN_PROGRESS/COMPLETED, chapterId dương và không trùng. Learned không được lớn hơn tổng. Lỗi scope/contract phải là lỗi tải, không hiển thị completion=0 như một response hợp lệ.

Hook dùng key theo GPLX, staleTime 30 giây, refetch khi mount/focus. Không khẳng định key này đã chứa user ID; nó giữ đúng implementation đang chạy. Điều hướng học chương có `from=progress` để quay lại đúng trang. Backend cập nhật projection từ Practice; frontend không PATCH tiến độ giả sau mỗi card chỉ để đẩy phần trăm.

## Source đối chiếu

- `src/features/progress-learning/progress-learning-service.ts`
- `src/features/progress-learning/progress-learning-types.ts`
- `src/features/progress-learning/use-progress-learning.ts`
- `src/features/progress-learning/components/progress-learning-content.tsx`
- `src/app/progress/page.tsx`

Các đường dẫn trong bảng API là phần sau base URL của client được ghi trong bảng. DTO và xử lý hiện hành nằm trong các file source trên. Không lấy nội dung snapshot đã che thông tin để ghi đè source.
