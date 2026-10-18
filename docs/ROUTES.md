# Route và module liên quan

Sinh từ các `src/app/**/page.tsx` trong snapshot đã duyệt. `[id]` là segment động, không là tên file rác. Các suffix rút gọn trong tài liệu khác phải được hiểu trong route cha tương ứng.

| Route web | File | Feature nhập trực tiếp |
| --- | --- | --- |
| `/admin/chapters` | `src/app/admin/chapters/page.tsx` | admin |
| `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` | admin |
| `/admin/exam-criteria` | `src/app/admin/exam-criteria/page.tsx` | admin |
| `/admin/exam-rules` | `src/app/admin/exam-rules/page.tsx` | admin |
| `/admin/exam-structures` | `src/app/admin/exam-structures/page.tsx` | admin |
| `/admin/exams/[examId]` | `src/app/admin/exams/[examId]/page.tsx` | admin, license |
| `/admin/exams` | `src/app/admin/exams/page.tsx` | admin, license, media |
| `/admin/exams/structures/create` | `src/app/admin/exams/structures/create/page.tsx` | admin, license |
| `/admin` | `src/app/admin/page.tsx` | route/layout/shared UI |
| `/admin/programs/[programId]` | `src/app/admin/programs/[programId]/page.tsx` | admin |
| `/admin/programs` | `src/app/admin/programs/page.tsx` | admin |
| `/admin/questions/create` | `src/app/admin/questions/create/page.tsx` | admin, media |
| `/admin/questions/edit/[id]` | `src/app/admin/questions/edit/[id]/page.tsx` | admin, media |
| `/admin/questions` | `src/app/admin/questions/page.tsx` | admin |
| `/admin/roles` | `src/app/admin/roles/page.tsx` | admin |
| `/admin/settings` | `src/app/admin/settings/page.tsx` | route/layout/shared UI |
| `/admin/users` | `src/app/admin/users/page.tsx` | admin |
| `/examination/[examId]` | `src/app/examination/[examId]/page.tsx` | examination |
| `/examination/[examId]/run` | `src/app/examination/[examId]/run/page.tsx` | examination |
| `/examination` | `src/app/examination/page.tsx` | examination |
| `/examination/result/[sessionId]` | `src/app/examination/result/[sessionId]/page.tsx` | examination |
| `/examination/result/[sessionId]/review` | `src/app/examination/result/[sessionId]/review/page.tsx` | examination |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | auth |
| `/forgot-password/reset` | `src/app/forgot-password/reset/page.tsx` | auth |
| `/forgot-password/verify` | `src/app/forgot-password/verify/page.tsx` | route/layout/shared UI |
| `/login` | `src/app/login/page.tsx` | auth |
| `/` | `src/app/page.tsx` | auth, license |
| `/practice/chapter/[chapterId]` | `src/app/practice/chapter/[chapterId]/page.tsx` | license, practice |
| `/practice/chapters` | `src/app/practice/chapters/page.tsx` | license, practice |
| `/practice/critical-questions` | `src/app/practice/critical-questions/page.tsx` | license, practice |
| `/practice/critical-questions/review` | `src/app/practice/critical-questions/review/page.tsx` | license, practice |
| `/practice/exam/[examId]` | `src/app/practice/exam/[examId]/page.tsx` | practice |
| `/practice/exams` | `src/app/practice/exams/page.tsx` | license, practice |
| `/practice/history` | `src/app/practice/history/page.tsx` | history, result |
| `/practice/leaderboard` | `src/app/practice/leaderboard/page.tsx` | leaderboard |
| `/practice/memory-tips` | `src/app/practice/memory-tips/page.tsx` | practice |
| `/practice` | `src/app/practice/page.tsx` | auth, license, practice |
| `/practice/result/[examId]` | `src/app/practice/result/[examId]/page.tsx` | practice |
| `/practice/traffic-signs` | `src/app/practice/traffic-signs/page.tsx` | practice |
| `/practice/wrong` | `src/app/practice/wrong/page.tsx` | license, practice |
| `/practice/wrong/review` | `src/app/practice/wrong/review/page.tsx` | license, practice |
| `/profile` | `src/app/profile/page.tsx` | profile |
| `/progress` | `src/app/progress/page.tsx` | progress-learning |
| `/register` | `src/app/register/page.tsx` | auth |
| `/results` | `src/app/results/page.tsx` | result-analytics |
| `/verify-email` | `src/app/verify-email/page.tsx` | route/layout/shared UI |

Page có thể gọi tiếp component/hook trong feature; bảng không khẳng định chỉ có một module phụ thuộc. Xem ARCHITECTURE và API blueprint trước khi thay route hoặc chuyển file.
