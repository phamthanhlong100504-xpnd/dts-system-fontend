# Lịch sử thi hợp nhất và điều hướng kết quả

## Trang và API

`/practice/history` dùng Result, gồm RANDOM_EXAM/PRESET_EXAM/OFFICIAL_EXAM đã được phép xuất hiện. `history-service` gửi targetType=EXAM, sort=completedAt,desc, activity/license/result filter và mốc from/to trước phân trang backend.

| Client | Method | Path | Ý nghĩa |
| --- | --- | --- | --- |
| resultApi | GET | `/v1/results/me/history` | Spring Page theo người đăng nhập |
| resultApi | GET | `/v1/results/me/history/{resultId}` | Chi tiết được kiểm owner |
| examinationApi | GET | `/v1/student/exams/{examId}` | Bổ sung nhãn cho official cũ thiếu title nếu được phép |

UI hiện dùng size=7, page bắt đầu 0. Filter ALL không được gửi như giá trị activity/result/GPLX cụ thể. Các khoảng 7/30/90 ngày được frontend đổi thành timestamp; không có query range tự tạo. Đổi filter hoặc khoảng thời gian đưa page về 0. Query key có user, GPLX, filter, from/to và trang.

## ID và nguồn

Result `id`/`resultId` khác `sourceId`. `sourceResult.resultPath` là route web. Resolver chỉ nhận pathname `/practice/result/{UUID}` cho PRACTICE_SESSION hoặc `/examination/result/{UUID}` cho EXAM_SESSION, đồng thời so sourceType/sourceId/activity/resultAvailable. Từ chối URL khác origin hoặc ID không khớp. Trang còn đọc owned detail trước khi điều hướng theo handler hiện hành.

Giữ nguyên 0/null, correctCount/questionCount, reviewAvailable/reasonCode, không suy số câu đúng từ điểm. Null review không có nghĩa tự cho xem. Title ưu tiên snapshot, có lookup hiển thị cho official cũ thiếu nhãn; không cập nhật record DB của Result.

## Quy tắc hiển thị đang có

Component hiện ẩn dòng có title khớp marker `DTS Screen13 runtime...`; đây là logic đã có, được giữ nguyên trong đợt Git. Vì lọc hiển thị sau response, có thể ít hơn 7 dòng/trang; trường hợp backend chỉ có một trang, displayTotal lấy số dòng còn hiển thị, nhiều trang vẫn dùng tổng từ backend. Không mô tả bộ đếm UI như tổng business đã được lọc server trong mọi tình huống.

Quay lại tab/Refresh cập nhật mốc thời gian và refetch để có dữ liệu mới do Kafka đồng bộ. Khi nguồn chưa phát hành hoặc không thuộc user, backend vẫn quyết định khả năng truy cập, không dùng lookup title để vượt quyền.

## Source đối chiếu

- `src/features/history/history-service.ts`
- `src/features/history/history-navigation.ts`
- `src/features/history/use-history.ts`
- `src/features/history/components/history-content.tsx`
- `src/app/practice/history/page.tsx`
- `src/features/result/result-service.ts`

Các đường dẫn trong bảng API là phần sau base URL của client được ghi trong bảng. DTO và xử lý hiện hành nằm trong các file source trên. Không lấy nội dung snapshot đã che thông tin để ghi đè source.
