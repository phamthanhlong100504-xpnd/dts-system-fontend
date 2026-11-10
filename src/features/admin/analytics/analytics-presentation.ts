/** Vietnamese presentation of known Backend warnings, preserving technical details only on demand. */
export function backendWarning(warning:string):string{
 const rules:[RegExp,string][]=[
  [/backfill|not fully synchronized|projection.*not fully|not .*synchroniz/i,'Dữ liệu mô phỏng chưa đồng bộ đầy đủ; một số chỉ số chưa thể xác nhận.'],
  [/broker ack|producer.*delivery|consumer.*observation|outbox|producer.*acknowledge/i,'Chưa đủ bằng chứng xác nhận sự kiện đã được service nhận và áp dụng.'],
  [/minio|private bucket|object.*available/i,'Chưa xác minh được tài nguyên Media thực tế trong kho lưu trữ.'],
  [/current.*version|all versions|published.*versions/i,'Số liệu bao gồm nhiều phiên bản; không nên hiểu là số của phiên bản hiện hành.'],
  [/service.*unavailable|source.*not available|cannot.*load/i,'Chưa truy cập được một nguồn dữ liệu. Các nguồn còn lại vẫn hiển thị riêng.']
 ];
 for(const [pattern,vi] of rules)if(pattern.test(warning))return vi;
 return warning; // Unrecognized source warning stays visible; no loss of evidence.
}
export function vnTime(iso:string|null|undefined):string{
 if(!iso)return 'Chưa có thông tin';
 const time=new Date(iso);if(!Number.isFinite(time.getTime()))return 'Thời điểm chưa hợp lệ';
 return time.toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour12:false});
}
