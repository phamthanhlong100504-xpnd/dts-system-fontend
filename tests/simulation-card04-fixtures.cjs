/* Isolated QA data. No production module imports tests. */
const {uuid}=require('./simulation-card02-fixtures.cjs');
const scope={userId:uuid(1),licenseClass:'B',bankVersion:'qa-current-bank'},actor=uuid(2);
const order=['OVERVIEW','PRACTICE_STEPS','SCORING','RECOGNITION','MODE_COMPARISON','PRACTICE_NOTES','CTA'];
const item=key=>({key,title:'QA '+key,description:'QA description '+key});
function content(){return {title:'QA Guide',description:'QA Description',overview:{description:'QA Overview'},
 steps:{title:'QA Steps',items:['SELECT_SCENARIO','OBSERVE','FIRST_RESPONSE','REVIEW'].map(item)},
 scoring:{title:'QA Scoring',description:'QA scoring text',illustrationTitle:'QA labels',illustrationNote:'QA note',items:['FIRST_ONLY','SCORE_WINDOW','ZERO_SCORE'].map(item),important:'QA Important'},
 recognition:{title:'QA Recognition',items:['HAZARD_SIGN','RECOGNITION_TIP'].map(item),policy:item('HINT_POLICY')},
 comparison:{title:'QA Comparison',practice:{badge:'QA Practice',title:'QA Practice title',items:['PRACTICE_SCOPE','PRACTICE_RESULT','PRACTICE_BOOKMARK'].map(item)},exam:{badge:'QA raw exam badge',title:'RAW EXAM TITLE',items:['EXAM_AVAILABILITY','EXAM_PLAN'].map(item)}},
 notes:{title:'QA Notes',items:['STABLE_CONNECTION','NORMAL_PLAYBACK','RESULT_CONFIRMATION','REPLAY_ONLY'].map(item)},cta:{title:'QA Start',description:'QA CTA Description',buttonLabel:'QA Start chapters'}};}
function revision(status='DRAFT',number=1,c=content()){return {pageKey:'SIMULATION_GUIDE',schemaVersion:1,revision:number,status,content:structuredClone(c),updatedAt:'2026-11-02T00:00:00Z',updatedBy:'SYSTEM',publishedAt:status==='DRAFT'?null:'2026-11-02T00:01:00Z',publishedBy:status==='DRAFT'?null:actor,sectionOrder:[...order]};}
function safe(c){const next=structuredClone(c);next.comparison.exam={badge:'Chưa khả dụng QA',title:'SAFE EXAM TITLE',items:['EXAM_AVAILABILITY','EXAM_PLAN'].map(item)};return next;}
function snapshot(){const draft=revision();return {actorId:actor,revision:1,draft,published:revision('PUBLISHED'),template:content(),bank:{bankVersion:scope.bankVersion,chapterCount:7,scenarioCount:140,scoringLabels:['Sớm','5','4','3','2','1','Muộn'],mockExam:{available:false,notice:'QA unavailable'}},preview:{...structuredClone(draft),content:safe(draft.content)},contentPolicy:'MOCK_EXAM_UNAVAILABLE_V1'};}
function current(s=snapshot(),licenseClass='B'){return {scope:{...scope,licenseClass,bankVersion:s.bank.bankVersion},document:{...structuredClone(s.published),content:safe(s.published.content)},bank:structuredClone(s.bank),contentPolicy:s.contentPolicy};}
function reordered(v){if(Array.isArray(v))return v.map(reordered);if(!v||typeof v!=='object')return v;return Object.fromEntries(Object.entries(v).reverse().map(([k,x])=>[k,reordered(x)]));}
function harness(){let state=snapshot(),override;const calls=[];const archives=[revision('ARCHIVED',1)];
 const api=Object.fromEntries(['get','put','post'].map(method=>[method,async(path,body)=>{
  calls.push({method,path,body:structuredClone(body)});if(override){const v=await override(method,path,body);if(v!==undefined)return v;}
  if(method==='get'){
   if(path.endsWith('/current'))return current(state,body?.params?.licenseClass);
   if(path.endsWith('/admin/preview'))return structuredClone(state.preview);
   if(path.endsWith('/admin/versions'))return {actorId:actor,versions:[structuredClone(state.published),...archives].filter((v,i,a)=>v&&a.findIndex(x=>x?.revision===v.revision)===i).sort((a,b)=>b.revision-a.revision)};
   if(/\/versions\/\d+$/.test(path)){const n=Number(path.split('/').at(-1));return structuredClone([state.published,...archives].find(v=>v?.revision===n));}
   return structuredClone(state);
  }
  if(body.expectedRevision!==state.revision){const {ApiError}=require('../src/lib/api/envelope.ts');throw new ApiError('conflict',409,'GUIDE-409');}
  if(method==='put'){
   state={...state,revision:state.revision+1,draft:revision('DRAFT',state.revision+1,body.content)};
   state.preview={...structuredClone(state.draft),content:safe(state.draft.content)};
  }else if(state.published?.revision!==state.revision){if(state.published)archives.push({...structuredClone(state.published),status:'ARCHIVED'});state={...state,published:revision('PUBLISHED',state.revision,state.draft.content)};}
  return reordered(structuredClone(state));
 }]));
 return {api,calls,archives,get state(){return state;},set state(v){state=v;},set override(v){override=v;}};
}
module.exports={uuid,scope,actor,order,item,content,revision,safe,snapshot,current,reordered,harness};
