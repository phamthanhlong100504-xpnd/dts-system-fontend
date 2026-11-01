# Bảng xếp hạng EXP và thống kê kết quả

## Trang và contract

`/practice/leaderboard` đọc EXP; `/results` đọc analytics chuẩn hóa. Cả hai qua Result, có GPLX và query key theo user. Không lấy leaderboard cũ trong Practice làm nguồn cho trang hiện tại.

| Client | Method | Path | Params |
| --- | --- | --- | --- |
| resultApi | GET | `/v1/leaderboards` | licenseClass, period, page, size |
| resultApi | GET | `/v1/results/me/analytics` | licenseClass, period |

Tabs WEEK/MONTH/ALL ánh xạ THIS_WEEK/THIS_MONTH/ALL_TIME. Backend trả thứ tự, rank, rankingScore (EXP), totalParticipants, totalPages và currentUser độc lập với trang đang xem. Frontend không tự tính lại EXP/rank hoặc gắn hạng của user theo vị trí trên trang. currentUser có thể rank=null và score=0 khi chưa có đóng góp được xếp hạng.

Hồ sơ AVAILABLE/PENDING/UNAVAILABLE có displayName/avatarUrl nullable; không lấy username giả để thay record backend. Giữ null là trạng thái hợp lệ và dùng nhãn hiển thị phù hợp.

## Analytics

Period là 7D/30D/ALL. summary chứa averageScore/maxScore, passRate, accuracyRate, attempts, correctCount/questionCount. Dữ liệu điểm có scoreBasis=NORMALIZED_CORRECT_COUNT; điểm nguồn vẫn ở sourceScore/sourceMaxScore của recent result. Không trộn thang điểm nguồn với điểm chuẩn hóa, không tính lại pass/fail từ điểm hiển thị và không lấy trung bình phần trăm thay accuracyRate có trọng số của backend.

SOURCE_POLICY_PENDING cho phép điểm chuẩn hóa/maxScore=null; counts và các tỷ lệ còn lại vẫn có thể dùng. READY không có lượt thi là trạng thái rỗng hợp lệ. Trend là DAILY_AVERAGE theo ngày backend trả; giữ metadata truncation, giới hạn và timezone. Không tạo ngày/điểm giả để làm chart đầy hơn.

Recent results dùng source navigation đã kiểm, title snapshot được ưu tiên. Với official cũ thiếu title, helper đọc owned history detail rồi student exam detail/version có kiểm ID và scope; lookup thất bại không làm hỏng trang analytics và không sửa dữ liệu nguồn. Xem result-performance-contract.ts cho toàn bộ DTO, nullable và đơn vị.

## Source đối chiếu

- `src/features/result-performance/result-performance-contract.ts`
- `src/features/leaderboard/leaderboard-service.ts`
- `src/features/leaderboard/use-leaderboard.ts`
- `src/features/result-analytics/result-analytics-service.ts`
- `src/features/result-analytics/use-result-analytics.ts`
- `src/features/result-analytics/recent-official-title.ts`

Các đường dẫn trong bảng API là phần sau base URL của client được ghi trong bảng. DTO và xử lý hiện hành nằm trong các file source trên. Không lấy nội dung snapshot đã che thông tin để ghi đè source.
