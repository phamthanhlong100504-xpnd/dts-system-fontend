require('./simulation-test-loader.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict');
const examples=require('./fixtures/simulation-card06-responses.json');
const wire=require('../src/features/simulations/simulation-exam-wire.ts');
const {createSimulationExamHttpSource,examHttpError}=require('../src/features/simulations/simulation-exam-http-source.ts');
const {presetCreateIntent}=require('../src/features/simulations/simulation-preset-create-intent.ts');
const {sameExamOrigin}=require('../src/features/simulations/simulation-exam-validation.ts');
const {ApiError}=require('../src/lib/api/envelope.ts');
const f=require('./simulation-card05-fixtures.cjs');
const pick=n=>structuredClone(Object.entries(examples).find(([name])=>name.startsWith(String(n).padStart(3,'0')))[1].Body.data);
const scope=pick(1).scope, ref=pick(10).preset;
const apiFor=(response)=>{const calls=[];return {calls,api:Object.fromEntries(['get','post','put'].map(method=>[method,async(...args)=>{calls.push({method,args});return typeof response==='function'?response(method,...args):structuredClone(response);}]))};};
const source=h=>createSimulationExamHttpSource(h.api,()=>{},false);
for(const [name,record] of Object.entries(examples)) test(`actual redacted DTO ${name}`,async()=>{
 const raw=structuredClone(record.Body.data),h=apiFor(raw),s=source(h),p=record.Path.split('simulation-exams')[1].split('?')[0],sc=raw.scope??raw.result?.scope??scope;
 if(p==='/presets')await s.presets(sc);
 else if(p.startsWith('/presets/'))await s.presetPreparation(sc,p.split('/').at(-1));
 else if(p.endsWith('/result'))await s.result(sc,raw.sessionId);
 else if(p.endsWith('/review'))await s.review(sc,raw.result.sessionId);
 else if(p.endsWith('/playback')){
   // Credentials deliberately redacted by backend handoff. Only an in-memory QA URL substitution.
   raw.videoUrl='https://qa.invalid/redacted.mp4';
   wire.parseExamWire(wire.wireExamPlayback,raw);
   const sh=apiFor(raw),ss=source(sh);if(p.includes('/review/'))await ss.reviewPlayback(sc,raw.sessionId,raw.position);else await ss.playback(sc,raw.sessionId);
 }else await s.session(sc,raw.sessionId);
 assert.equal(h.calls.length,p.endsWith('/playback')?0:1);
});
test('latest sequence is 34,35,50,45,30 with each exact saved session, not best',async()=>{
 for(const [n,total,result]of [[22,34,17],[33,35,28],[44,50,39],[55,45,50],[70,30,65]]){const p=await source(apiFor(pick(n))).presets(scope),item=p.items.find(i=>i.presetSetId===ref.presetSetId);assert.equal(item.latestCompleted.score,total);assert.equal(item.latestCompleted.sessionId,pick(result).sessionId);}
});
test('active retake keeps latest result; cancellation leaves it unchanged',async()=>{const active=await source(apiFor(pick(57))).presets(scope),cancelled=await source(apiFor(pick(59))).presets(scope);const a=active.items.find(i=>i.presetSetId===ref.presetSetId),b=cancelled.items.find(i=>i.presetSetId===ref.presetSetId);assert(a.activeSession);assert.equal(b.activeSession,null);assert.deepEqual(a.latestCompleted,b.latestCompleted);});
test('zero completion, empty catalogue and server item order remain truthful',async()=>{const raw=pick(70),i=raw.items[0];i.latestCompletedScore=0;i.latestCompletedPassed=false;i.attemptStatus='FAILED';assert.equal((await source(apiFor(raw)).presets(scope)).items[0].latestCompleted.score,0);raw.items=[];raw.totalPublishedSets=0;assert.equal((await source(apiFor(raw)).presets(scope)).items.length,0);});
for(const mutate of [p=>p.scope.userId=f.uuid(99),p=>p.scope.licenseClass='CE',p=>p.bankVersion='foreign',p=>p.totalPublishedSets++,p=>p.items.reverse(),p=>p.items[0].latestCompletedAt=null,p=>p.items[0].latestCompletedScore=null,p=>p.items[0].passingScore=36,p=>p.items[0].scenarioIds=[f.uuid(2)],p=>p.items[0].attemptStatus='IN_PROGRESS',p=>p.items[0].activeSessionId=f.uuid(4)])test(`rejects malformed catalogue ${mutate}`,async()=>{const raw=pick(70);mutate(raw);await assert.rejects(source(apiFor(raw)).presets(scope));});
test('global RANDOM and historical PRESET active block a new preset without being assigned to it',async()=>{for(const old of [false,true]){const raw=pick(11),a=raw.activeSession;if(old){a.preset.presetVersionId=f.uuid(600);a.presetVersionId=a.preset.presetVersionId;}else{a.mode='RANDOM';delete a.preset;delete a.presetSetId;delete a.presetVersionId;delete a.presetTitle;}for(const i of raw.items){i.activeSessionId=null;i.attemptStatus=i.hasCompletedAttempt?(i.latestCompletedPassed?'PASSED':'FAILED'):'NOT_STARTED';}const p=await source(apiFor(raw)).presets(scope);assert(p.activeSession);assert(p.items.every(i=>i.activeSession===null));}});
test('create PRESET sends exact IDs/license/bank and original UUID header only',async()=>{const h=apiFor(pick(10)),s=source(h),r={mode:'PRESET',presetSetId:ref.presetSetId,presetVersionId:ref.presetVersionId,bankVersion:scope.bankVersion,idempotencyKey:f.uuid(800),userId:'omit',score:50};await s.create(scope,r);assert.deepEqual(h.calls[0].args,[ '/v1/simulation-exams/sessions',{mode:'PRESET',presetSetId:r.presetSetId,presetVersionId:r.presetVersionId,licenseClass:'B',bankVersion:r.bankVersion},{headers:{'Idempotency-Key':r.idempotencyKey}}]);});
test('create timeout reads active and never retries POST nor claims a similar session as own',async()=>{const h=apiFor((m)=>{if(m==='post')throw new ApiError('timeout');return {session:pick(10)};});await assert.rejects(source(h).create(scope,{mode:'PRESET',presetSetId:ref.presetSetId,presetVersionId:ref.presetVersionId,idempotencyKey:f.uuid(800)}),e=>e.code==='ACTIVE_SESSION_EXISTS');assert.deepEqual(h.calls.map(c=>c.method),['post','get']);});
for(const [code,want,status]of [['SIMULATION_PRESET_VERSION_CHANGED','PRESET_VERSION_CHANGED',409],['SIMULATION_PRESET_MEDIA_UNAVAILABLE','PRESET_UNAVAILABLE',503],['ACTIVE_SESSION_EXISTS','ACTIVE_SESSION_EXISTS',409],['SIMULATION_EXAM_BANK_CHANGED','BANK_CHANGED',409],['SIMULATION_EXAM_EVENT_CONFLICT','EVENT_CONFLICT',409],['forbidden','ACCESS_DENIED',403]])test(`typed error ${code} preserves status/code/trace`,()=>{const e=examHttpError(new ApiError('message',status,code,'trace'));assert.equal(e.code,want);assert.equal(e.status,status);assert.equal(e.apiCode,code);assert.equal(e.traceId,'trace');});
test('scope changed during preset GET discards late response; 404/503 never become empty',async()=>{let valid=true;const h=apiFor(()=>{valid=false;return pick(1);});const s=createSimulationExamHttpSource(h.api,()=>{if(!valid)throw Error('scope changed');});await assert.rejects(s.presets(scope));for(const status of [401,403,404,503])await assert.rejects(source(apiFor(()=>{throw new ApiError('error',status);})).presets(scope));});
for(const mutate of [s=>s.presetVersionId=f.uuid(901),s=>s.presetTitle='wrong',s=>s.preset.manifestSha256='bad',s=>s.policy.policyVersion='random',s=>s.title='teaching leak',s=>s.positions[0].score=5])test(`strict PRESET snapshot ${mutate}`,async()=>{const raw=pick(10);mutate(raw);await assert.rejects(source(apiFor(raw)).session(scope,raw.sessionId));});
test('RANDOM refuses preset metadata; commands pin all preset reference hashes',async()=>{const raw=f.session();raw.preset=ref;await assert.rejects(source(apiFor(raw)).session(f.scope,raw.sessionId));const a=pick(10),b=structuredClone(a);b.preset.sourceSha256='a'.repeat(64);assert.equal(sameExamOrigin(a,b),false);});
test('original intent survives refetched version, optional bank shape and terminal same-key ACK',async()=>{const detail=await source(apiFor(pick(4))).presetPreparation(scope,ref.presetSetId),intent=presetCreateIntent(scope,detail,f.uuid(99));const original=JSON.stringify(intent.request);detail.preset.presetVersionId=f.uuid(900);detail.bankVersion='new-publication';assert.equal(JSON.stringify(intent.request),original);intent.accept(pick(16));intent.accept({...pick(16),status:"CANCELLED"});assert.throws(()=>intent.accept({...pick(10),bankVersion:'changed'}));assert(Object.isFrozen(intent.request));});
