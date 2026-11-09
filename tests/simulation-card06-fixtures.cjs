// QA backend only. The app never imports this module or the redacted response corpus.
const f=require('./simulation-card05-fixtures.cjs');
const records=require('./fixtures/simulation-card06-responses.json');
const pick=n=>structuredClone(Object.entries(records).find(([name])=>name.startsWith(String(n).padStart(3,'0')))[1].Body.data);
const ref=pick(10).preset, policy=pick(10).policy;
function preset(v){if(!v)return v;if(v.result){v.result=preset(v.result);return v;}if(v.sessionId&&v.policy)return {...v,mode:'PRESET',policy:{...policy},preset:{...ref},presetSetId:ref.presetSetId,presetVersionId:ref.presetVersionId,presetTitle:ref.title};return v;}
function harness(total=35){const h=f.harness(total);let publication=ref.presetVersionId,version=0,latest=null,activeFlag=false,failCreate=0,hideActive=false;const calls=h.calls;
 function detail(q){const raw=pick(4);raw.scope={...f.scope,licenseClass:q?.licenseClass??'B'};raw.preset.presetVersionId=publication;raw.activeSession=activeFlag?active(q):null;raw.canStart=!raw.activeSession;raw.unavailableReason=raw.canStart?null:'ACTIVE_SESSION_EXISTS';if(latest)Object.assign(raw.preset,{hasCompletedAttempt:true,latestCompletedSessionId:latest.sessionId,latestCompletedScore:latest.totalScore,latestCompletedPassed:latest.passed,latestCompletedAt:latest.completedAt,attemptStatus:latest.passed?'PASSED':'FAILED'});if(raw.activeSession?.mode==='PRESET'&&raw.activeSession.preset.presetVersionId===publication){raw.preset.activeSessionId=raw.activeSession.sessionId;raw.preset.attemptStatus='IN_PROGRESS';}return raw;}
 function active(q){return !hideActive&&h.state&&['IN_PROGRESS','READY_TO_SUBMIT'].includes(h.state.status)?preset({...structuredClone(h.state),scope:{...h.state.scope,licenseClass:q?.licenseClass??'B'}}):null;}
 const old=h.api;const api=Object.fromEntries(['get','post','put'].map(m=>[m,async(p,b,c)=>{
  if(m==='get'&&p.includes('/presets')){calls.push({method:m,path:p,body:structuredClone(b)});const d=detail(b.params);if(p.endsWith('/presets'))return {scope:d.scope,bankVersion:f.scope.bankVersion,totalPublishedSets:1,items:[d.preset],activeSession:d.activeSession};return d;}
  if(m==='post'&&p.endsWith('/sessions')){if(failCreate-->0){calls.push({method:m,path:p,body:structuredClone(b),config:structuredClone(c)});throw new (require('../src/lib/api/envelope.ts').ApiError)('timeout');}}
  let v=await old[m](p,b,c);if(m==='get'&&p.endsWith('/sessions/active')&&hideActive)return {session:null};
  if(v.session!==undefined)return {session:v.session?preset(v.session):null};
  v=preset(v);if(m==='post'&&p.endsWith('/sessions'))activeFlag=true;if(['COMPLETED','CANCELLED'].includes(v.status))activeFlag=false;if(v.status==='COMPLETED'&&p.endsWith('/submit'))latest=preset(f.result(total,h.state));return v;
 }]));
 return {h,api,calls,get state(){return h.state;},set state(s){h.state=s;},get active(){return activeFlag;},set active(v){activeFlag=v;h.active=v;},get publication(){return publication;},set publication(v){publication=v;},set failCreate(v){failCreate=v;},set hideActive(v){hideActive=v;},pick,ref,policy};
}
module.exports={...f,pick,ref,policy,preset,harness};
