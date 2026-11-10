/** Official question editing is DRAFT-only. Every edit is validated against BE03 rules. */
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const licenses=new Set(['A1','A','B1','B','C1','C','D1','D2','D','BE','C1E','CE','D1E','D2E','DE']);
export type OfficialField={key:string;label:string;mode:'text'|'paragraph'|'json'|'integer'|'boolean'};
export const officialFields:readonly OfficialField[]=[
 {key:'questionText',label:'Nội dung câu hỏi',mode:'paragraph'},
 {key:'explanation',label:'Giải thích',mode:'paragraph'},
 {key:'chapterId',label:'Chương (1–6)',mode:'integer'},
 {key:'options',label:'Các phương án và đáp án đúng (JSON)',mode:'json'},
 {key:'isCritical',label:'Câu điểm liệt',mode:'boolean'},
 {key:'applicableLicenses',label:'Các hạng GPLX (JSON)',mode:'json'},
 {key:'criticalLicenses',label:'Các hạng GPLX có điểm liệt (JSON)',mode:'json'},
 {key:'mediaFileIds',label:'Media ID (JSON)',mode:'json'}
];
const record=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
export function initialOfficialFields(payload:Record<string,unknown>){
 return Object.fromEntries(officialFields.map(f=>[f.key,
   f.mode==='json'?JSON.stringify(payload[f.key]??[],null,2):
   f.mode==='boolean'?(payload[f.key]===true?'true':'false'):String(payload[f.key]??'')])) as Record<string,string>;
}
function parseJson(raw:string,label:string){try{return JSON.parse(raw) as unknown;}catch{throw Error(`${label}: JSON không hợp lệ.`);}}
export function changedOfficialFields(payload:Record<string,unknown>,values:Record<string,string>):Record<string,unknown>{
 const changes:Record<string,unknown>={};
 for(const f of officialFields){
  const raw=values[f.key];if(typeof raw!=='string'||raw.length>120000)throw Error(`${f.label}: vượt giới hạn ký tự.`);
  let val:unknown=raw;
  if(f.mode==='json')val=parseJson(raw,f.label);
  if(f.mode==='integer'){
    if(!/^[1-6]$/.test(raw))throw Error('Mã chương phải trong khoảng 1 đến 6.');val=Number(raw);
  }
  if(f.mode==='boolean')val=raw==='true';
  if(JSON.stringify(val)===JSON.stringify(payload[f.key]))continue;
  if(f.key==='questionText'&&(!raw.trim()||raw.length>50000))throw Error('Nội dung câu hỏi không hợp lệ.');
  if(f.key==='options'){
    const prior=payload.options;
    if(!Array.isArray(prior)||!Array.isArray(val)||prior.length!==val.length||val.length<2||val.length>50)
      throw Error('Số phương án phải giữ nguyên trong bản nháp này.');
    const originalIds=prior.map(x=>record(x)?x.id:null);
    const ids=val.map(x=>record(x)?x.id:null);
    if(ids.some(id=>typeof id!=='string'||!uuid.test(id))||new Set(ids).size!==ids.length||
       ids.some(id=>!originalIds.includes(id)))throw Error('Không thể thay ID phương án gốc.');
    const orders=new Set<number>();let correct=0;
    for(const opt of val){
      if(!record(opt)||typeof opt.content!=='string'||!opt.content.trim()||
         !Number.isSafeInteger(opt.sortOrder)||Number(opt.sortOrder)<0||orders.has(opt.sortOrder as number)||
         typeof opt.isCorrect!=='boolean')throw Error('Cấu trúc phương án, nội dung hoặc thứ tự không hợp lệ.');
      orders.add(opt.sortOrder as number);if(opt.isCorrect)correct++;
      const old=prior.find(x=>record(x)&&x.id===opt.id);
      if(!record(old)||Object.keys(opt).some(key=>!['content','sortOrder','isCorrect'].includes(key)&&
          JSON.stringify(opt[key])!==JSON.stringify(old[key])))throw Error('Không thể đổi metadata phương án.');
    }
    if(correct!==1)throw Error('Câu hỏi phải có một đáp án đúng.');
  }
  if(f.key==='applicableLicenses'||f.key==='criticalLicenses'){
    if(!Array.isArray(val)||val.some(x=>typeof x!=='string'||!licenses.has(x))||new Set(val).size!==val.length||
       (f.key==='applicableLicenses'&&val.length===0))throw Error('Danh sách hạng GPLX chưa hợp lệ.');
  }
  if(f.key==='mediaFileIds'&&(!Array.isArray(val)||val.length>20||val.some(x=>typeof x!=='string'||!uuid.test(x))||new Set(val).size!==val.length))
    throw Error('Media ID cần UUID hợp lệ và không trùng nhau.');
  changes[f.key]=val;
 }
 const finalCritical=Object.prototype.hasOwnProperty.call(changes,'criticalLicenses')?changes.criticalLicenses:payload.criticalLicenses;
 const finalFlag=Object.prototype.hasOwnProperty.call(changes,'isCritical')?changes.isCritical:payload.isCritical;
 const finalApplicable=Object.prototype.hasOwnProperty.call(changes,'applicableLicenses')?changes.applicableLicenses:payload.applicableLicenses;
 if(!Array.isArray(finalCritical)||!Array.isArray(finalApplicable)||finalCritical.some(x=>!finalApplicable.includes(x))||
    finalFlag!==(finalCritical.length>0))throw Error('Hạng GPLX có điểm liệt phải thuộc danh sách hạng, khớp cờ câu điểm liệt.');
 if(Object.keys(changes).length===0)throw Error('Không có thay đổi để lưu.');
 return changes;
}
