/* Controlled QA backend only. Never imported by app source; no real-time/browser acceptance claim. */
const {uuid}=require('./simulation-card02-fixtures.cjs');
const scope={userId:uuid(1),licenseClass:'B',bankVersion:'qa-exam-bank'},sid=uuid(10);
const policy={totalScenarios:10,maxScenarioScore:5,maxTotalScore:50,passingScore:35,policyVersion:'qa-policy'};
const playbackPolicy={allowPause:false,allowSeek:false,allowFullscreen:true,allowHintsWhilePlaying:false,heartbeatIntervalMs:3000,maxHeartbeatGapMs:12000};
function session(){return {scope:{...scope},sessionId:sid,mode:'RANDOM',status:'IN_PROGRESS',bankVersion:scope.bankVersion,scoringVersion:'qa-scoring',policy:{...policy},totalScenarios:10,completedScenarios:0,currentPosition:1,maxTotalScore:50,responseRecorded:false,playbackEventId:uuid(100),playbackState:'NOT_STARTED',requiresRestart:false,playbackPolicy:{...playbackPolicy},positions:Array.from({length:10},(_,i)=>({position:i+1,status:i===0?'CURRENT':'NOT_STARTED'})),startedAt:'2026-11-03T00:00:00Z',completedAt:null};}
function playback(s=session(),pos=s.currentPosition){return {sessionId:s.sessionId,position:pos,playbackEventId:s.playbackEventId,videoUrl:`https://qa.invalid/video/${pos}`,expiresAt:'2099-01-01T00:00:00Z',mimeType:'video/mp4',durationMs:27000,responseRecorded:s.responseRecorded,restartAtMs:0};}
const scoreList=total=>Array.from({length:10},(_,i)=>Math.max(0,Math.min(5,total-i*5)));
function result(total=35,s=session()){return {scope:{...s.scope},sessionId:s.sessionId,mode:'RANDOM',status:'COMPLETED',bankVersion:s.bankVersion,scoringVersion:s.scoringVersion,policy:{...s.policy},totalScenarios:10,completedScenarios:10,totalScore:total,maxTotalScore:50,passingScore:s.policy.passingScore,passed:total>=s.policy.passingScore,resultStatus:total>=s.policy.passingScore?'PASSED':'FAILED',startedAt:s.startedAt,completedAt:'2026-11-03T00:10:00Z',items:scoreList(total).map((score,i)=>({position:i+1,score,maxScore:5}))};}
function review(total=35,s=session(),times=new Map()){const r=result(total,s);return {result:r,items:r.items.map((v,i)=>({...v,scenarioId:uuid(200+i),scenarioNumber:i+1,title:'QA reviewed scenario '+(i+1),chapterName:'QA chapter',responseRecorded:times.has(i+1),firstResponseMs:times.get(i+1)??null,durationMs:27000,scoringSegments:Array.from({length:5},(_,n)=>({startMs:17000+n*600,endMs:17600+n*600,score:5-n,endInclusive:n===4})),hazardSign:'QA hazard',recognitionTip:'QA hint',scoringVersion:s.scoringVersion,playbackPath:`/api/v1/simulation-exams/sessions/${s.sessionId}/review/${i+1}/playback`}))};}
function harness(total=35){let s=session(),active=false,override,nonce=100;const calls=[],times=new Map(),events=new Map(),creates=new Map();
 const {ApiError}=require('../src/lib/api/envelope.ts');
 function project(q){return {...structuredClone(s),scope:{...s.scope,licenseClass:q?.licenseClass??s.scope.licenseClass}};}
 async function dispatch(method,path,body,config){
  const q=method==='get'?body?.params:config?.params;
  if(method==='get'){
   if(path.endsWith('/preparation'))return {scope:{...scope,licenseClass:q?.licenseClass??'B'},bankVersion:scope.bankVersion,policy:{...policy},activeSession:active&&['IN_PROGRESS','READY_TO_SUBMIT'].includes(s.status)?project(q):null};
   if(path.endsWith('/sessions/active'))return {session:active&&['IN_PROGRESS','READY_TO_SUBMIT'].includes(s.status)?project(q):null};
   if(path.endsWith('/result')){if(s.status!=='COMPLETED')throw new ApiError('not completed',409,'NOT_COMPLETED');return {...result(total,s),scope:project(q).scope};}
   if(path.endsWith('/review')){if(s.status!=='COMPLETED')throw new ApiError('not completed',409,'NOT_COMPLETED');const v=review(total,s,times);v.result.scope=project(q).scope;return v;}
   const match=path.match(/\/review\/(\d+)\/playback$/);if(match){if(s.status!=='COMPLETED')throw new ApiError('not completed',409,'NOT_COMPLETED');const p=playback(s,Number(match[1]));p.responseRecorded=times.has(p.position);return p;}
   if(path.endsWith('/current/playback')){if(s.status!=='IN_PROGRESS')throw new ApiError('terminal',409,'SIMULATION_EXAM_TERMINAL');if(s.playbackState!=='PLAYING')s.playbackState='READY';return playback(s);}
   return project(q);
  }
  if(path.endsWith('/sessions')){const key=config.headers['Idempotency-Key'];if(creates.has(key))return project({licenseClass:body.licenseClass});if(active&&['IN_PROGRESS','READY_TO_SUBMIT'].includes(s.status))throw new ApiError('active',409,'ACTIVE_SESSION_EXISTS');s=session();s.scope.licenseClass=body.licenseClass;active=true;creates.set(key,body);return project({licenseClass:body.licenseClass});}
  const payload=JSON.stringify({method,path,body,query:q});if(events.has(body.eventId)){const old=events.get(body.eventId);if(old.payload!==payload)throw new ApiError('conflict',409,'SIMULATION_EXAM_EVENT_CONFLICT');return structuredClone(old.ack);}
  const kind=path.endsWith('/submit')?'SUBMIT':path.endsWith('/cancel')?'CANCEL':path.endsWith('/current/restart')?'RESTART':path.endsWith('/current/start')?'START':path.endsWith('/current/heartbeat')?'HEARTBEAT':path.endsWith('/reaction')?'REACTION':'COMPLETE_CURRENT';
  if(!['SUBMIT','CANCEL'].includes(kind)&&(body.position!==s.currentPosition||body.playbackEventId!==s.playbackEventId))throw new ApiError('stale',409,'SIMULATION_EXAM_PLAYBACK_CHANGED');
  if(kind==='RESTART'){s.playbackEventId=uuid(++nonce);s.playbackState='NOT_STARTED';s.requiresRestart=false;}
  else if(kind==='START'){if(s.playbackState!=='READY'||body.mediaTimeMs!==0)throw new ApiError('start',409,'SIMULATION_EXAM_PLAYBACK_REQUIRED');s.playbackState='PLAYING';}
  else if(kind==='HEARTBEAT'||kind==='REACTION'||kind==='COMPLETE_CURRENT'){
   if(s.playbackState!=='PLAYING')throw new ApiError('not playing',409,'SIMULATION_NOT_PLAYING');
   if(kind==='REACTION'){if(!times.has(s.currentPosition))times.set(s.currentPosition,body.mediaTimeMs);s.responseRecorded=true;}
   if(kind==='COMPLETE_CURRENT'){
    if(body.mediaTimeMs<26750)throw new ApiError('not finished',409,'SIMULATION_EXAM_VIDEO_NOT_FINISHED');
    s.completedScenarios++;s.positions=s.positions.map((p,i)=>({position:i+1,status:i<s.completedScenarios?'COMPLETED':i===s.completedScenarios?'CURRENT':'NOT_STARTED'}));
    if(s.completedScenarios===10){s.status='READY_TO_SUBMIT';s.playbackState='FINISHED';}
    else{s.currentPosition++;s.responseRecorded=false;s.playbackEventId=uuid(++nonce);s.playbackState='NOT_STARTED';}
   }
  }else if(kind==='SUBMIT'){if(s.status!=='READY_TO_SUBMIT')throw new ApiError('incomplete',409,'SIMULATION_EXAM_INCOMPLETE');s.status='COMPLETED';s.completedAt='2026-11-03T00:10:00Z';}
  else{s.status='CANCELLED';s.positions=s.positions.map((p,i)=>({position:i+1,status:i<s.completedScenarios?'COMPLETED':'NOT_STARTED'}));}
  const ack=project(q);events.set(body.eventId,{payload,ack:structuredClone(ack)});return ack;
 }
 const api=Object.fromEntries(['get','post','put'].map(method=>[method,async(path,body,config)=>{calls.push({method,path,body:structuredClone(body),config:structuredClone(config)});if(override){const v=await override(method,path,body,config);if(v!==undefined)return structuredClone(v);}return dispatch(method,path,body,config);} ]));
 return {api,calls,times,events,creates,dispatch,get state(){return s;},set state(v){s=v;},set override(v){override=v;},set active(v){active=v;}};
}
module.exports={uuid,scope,sid,policy,playbackPolicy,session,playback,result,review,harness};
