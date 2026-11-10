import type {EditorialKind} from '../admin03/source';

/** Only server-approved BE03 editorial fields. This is a draft editor, never a publisher. */
export type DraftField={id:string;label:string;mode:'text'|'paragraph'|'json'|'number'|'select';choices?:readonly string[]};
const editable:Record<EditorialKind,readonly DraftField[]>={
 CUSTOM_QUESTION:[
  {id:'content',label:'Nội dung câu hỏi',mode:'paragraph'},
  {id:'type',label:'Kiểu câu hỏi',mode:'select',choices:['SINGLE_CHOICE','TRUE_FALSE']},
  {id:'explanations',label:'Giải thích (JSON theo nguồn)',mode:'json'},
  {id:'options',label:'Các phương án, đáp án đúng và thứ tự (JSON)',mode:'json'},
  {id:'mediaFileIds',label:'Danh sách Media ID (JSON)',mode:'json'}],
 CHAPTER:[{id:'title',label:'Tên chương',mode:'text'},
          {id:'blocks',label:'Cấu trúc câu hỏi liên kết (JSON)',mode:'json'}],
 LEARNING_PROGRAM:[{id:'title',label:'Tên chương trình',mode:'text'},
                   {id:'description',label:'Mô tả',mode:'paragraph'},
                   {id:'blocks',label:'Cấu trúc chương liên kết (JSON)',mode:'json'}],
 TRAFFIC_SIGN:[{id:'name',label:'Tên biển báo',mode:'text'},
               {id:'category',label:'Loại biển báo',mode:'select',choices:['cam','nguy_hiem','hieu_lenh','chi_dan','phu']},
               {id:'categoryName',label:'Tên nhóm',mode:'text'},
               {id:'meaning',label:'Ý nghĩa',mode:'paragraph'},
               {id:'quickTip',label:'Mẹo nhận biết',mode:'paragraph'},
               {id:'sourceImage',label:'Tên ảnh nguồn',mode:'text'},
               {id:'mediaFileId',label:'Media UUID (chỉ bản nháp)',mode:'text'},
               {id:'applicableLicenses',label:'Các hạng GPLX (JSON)',mode:'json'}],
 MEMORY_TIP:[{id:'title',label:'Tiêu đề',mode:'text'},
             {id:'quickRule',label:'Mẹo ghi nhớ',mode:'paragraph'},
             {id:'explanation',label:'Giải thích',mode:'paragraph'},
             {id:'sortOrder',label:'Thứ tự',mode:'number'}]
};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function draftFieldDefinitions(kind:EditorialKind):readonly DraftField[]{return editable[kind];}
export function initialDraftFields(kind:EditorialKind,payload:Record<string,unknown>):Record<string,string>{
 const values:Record<string,string>={};
 for(const f of editable[kind]){
  const v=payload[f.id];
  values[f.id]=f.mode==='json'?JSON.stringify(v??null,null,2):
   f.mode==='number'?typeof v==='number'?String(v):'':typeof v==='string'?v:'';
 }
 return values;
}
function record(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
function keysStable(before:unknown,after:unknown,label:string){
 if(!Array.isArray(before)||!Array.isArray(after))throw Error(`${label} cần là mảng theo cấu trúc Backend.`);
 if(before.length!==after.length)throw Error(`${label}: chưa hỗ trợ thêm/xóa ID qua trình sửa thứ tự; cần nghiệp vụ riêng.`);
 const ids=(v:unknown[])=>v.map(x=>record(x)?x.id:null);
 const a=ids(before),b=ids(after);
 if(a.some(x=>typeof x!=='string'||!uuid.test(x))||b.some(x=>typeof x!=='string'||!uuid.test(x))||
    new Set(a).size!==a.length ||a.some(id=>!b.includes(id)))
   throw Error(`${label}: không được thay ID hoặc trộn nguồn liên kết.`);
}
/** Validate only edited values; untouched fields are NEVER sent to the API. */
export function parseDraftFieldChanges(kind:EditorialKind,before:Record<string,unknown>,input:Record<string,string>):Record<string,unknown>{
 const changes:Record<string,unknown>={};
 for(const field of editable[kind]){
  if(!Object.prototype.hasOwnProperty.call(input,field.id))continue;
  const raw=input[field.id];if(typeof raw!=='string'||raw.length>120000)throw Error(`Giá trị ${field.label} vượt giới hạn.`);
  // Unedited optional JSON fields must never be converted from missing to null.
  if(raw===initialDraftFields(kind,before)[field.id])continue;
  let next:unknown=raw;
  if(field.mode==='json'){
    try{next=JSON.parse(raw);}catch{throw Error(`${field.label}: JSON không hợp lệ.`);}
  }else if(field.mode==='number'){
    if(!/^[1-9]\d*$/.test(raw)||!Number.isSafeInteger(Number(raw)))throw Error(`${field.label}: nhập số nguyên dương.`);
    next=Number(raw);
  }else if(field.mode==='select'&&!field.choices?.includes(raw))throw Error(`${field.label}: giá trị không được hỗ trợ.`);
  if(JSON.stringify(next)===JSON.stringify(before[field.id]))continue;
  if(field.id==='options'){
    keysStable(before.options,next,'Phương án');
    if(!Array.isArray(next)||next.length<2||next.length>8)throw Error('Số phương án không hợp lệ.');
    let correct=0;const orders=new Set<number>();
    for(const o of next){
      if(!record(o)||typeof o.content!=='string'||!o.content.trim()||typeof o.isCorrect!=='boolean'||
        !Number.isSafeInteger(o.sortOrder)||Number(o.sortOrder)<0||orders.has(o.sortOrder as number))
        throw Error('Nội dung, đáp án hoặc thứ tự phương án không hợp lệ.');
      orders.add(o.sortOrder as number);if(o.isCorrect)correct++;
    }
    if(correct!==1)throw Error('Câu hỏi chỉ có đúng một phương án đúng.');
  }
  if(field.id==='blocks')keysStable(before.blocks,next,'Khối liên kết');
  if(field.id==='mediaFileIds'){
    if(!Array.isArray(next)||next.length>20||next.some(v=>typeof v!=='string'||!uuid.test(v)))
      throw Error('Danh sách Media chỉ được chứa UUID hợp lệ.');
  }
  if(field.id==='mediaFileId'&&next!==''&&typeof next==='string'&&!uuid.test(next))
    throw Error('Media ID phải là UUID. Không dùng tên file hoặc URL tạm.');
  if(field.id==='applicableLicenses'){
    if(!Array.isArray(next)||!next.length||next.some(v=>typeof v!=='string'||!/^[A-Z0-9]{1,10}$/.test(v))||new Set(next).size!==next.length)
      throw Error('Danh sách hạng GPLX không hợp lệ.');
  }
  if((field.mode==='text'||field.mode==='paragraph')&&typeof next==='string'&&next.length>50000)
    throw Error(`${field.label} quá dài.`);
  changes[field.id]=next;
 }
 if(!Object.keys(changes).length)throw Error('Không có trường nội dung thay đổi.');
 return changes;
}
