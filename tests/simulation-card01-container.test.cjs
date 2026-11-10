/* React Query/container harness; no real backend or browser media. */
require('./simulation-test-loader.cjs');
const {test,after} = require('node:test');
const assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const Module=require('node:module');const path=require('node:path');
const qa=process.env.DTS_QA_NODE_MODULES;
if(!qa)throw new Error('Set DTS_QA_NODE_MODULES to an external jsdom installation.');
const {JSDOM}=createRequire(path.join(qa,'../package.json'))('jsdom');
const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost/practice/simulations/scenarios/s'});
for(const k of ['window','document','HTMLElement','Element','HTMLAnchorElement','MouseEvent'])global[k]=dom.window[k];
global.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react');const {act}=React;const {createRoot}=require('react-dom/client');
const {QueryClient,QueryClientProvider}=require('@tanstack/react-query');
let source,router,view,allowLearn=true;
const load=Module._load;
Module._load=function(name,parent,...args){
 if(name==='next/navigation')return {useRouter:()=>router};
 if(name==='@/components/require-auth')return {RequireAuth:({children})=>children};
 if(name==='@/features/auth/use-auth')return {useMe:()=>({data:{id:'u',selectedLicenseClass:'B'},isPending:false,isError:false})};
 if(name==='@/features/license/use-license')return {useLicenseByCode:()=>({license:{group:'car',simulationEnabled:true,simulationReady:true,simulationBankVersion:'v'},isLoading:false,isError:false})};
 if(name==='@/stores/auth-store')return {useAuthStore:selector=>selector({user:{id:'u',permissions:allowLearn?['simulations:read','simulations:learn','media:read']:['simulations:read','media:read']}})};
 if(name==='./simulation-learning-service')return {simulationHttpSource:new Proxy({}, {get:(_,key)=>source?.[key]})};
 if(name==='./simulation-scenario-view')return {SimulationScenarioView:props=>{view=props;return React.createElement('div',{'data-phase':props.state.data?.phase});}};
 return load.call(this,name,parent,...args);
};
const {SimulationScenarioPage}=require('../src/features/simulations/components/simulation-learning-pages.tsx');
const {simulationLearningKeys}=require('../src/features/simulations/use-simulation-learning.ts');
function model(extra={}) {return {scope:{userId:'u',licenseClass:'B',bankVersion:'v'},scenario:{id:'s',number:1,title:'Backend',chapterId:'1',chapterNumber:1,chapterName:'Backend',positionLabel:'1',durationMs:27000,isBookmarked:false},phase:'ready',attemptId:null,playbackEventId:null,videoUrl:null,posterUrl:null,responseRecorded:false,firstResponseMs:null,result:null,policy:{allowPause:false,allowSeek:false,allowFullscreen:true,allowHintsWhilePlaying:false},hintPreview:null,previousScenarioId:null,nextScenarioId:'next',...extra};}
async function setup(attemptId,canLearn=true,extra={},reviewContext) {
 allowLearn=canLearn;
 const host=document.createElement('div');document.body.appendChild(host);const root=createRoot(host);
 const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0},mutations:{retry:false,gcTime:0}}});
 let current=model({...(reviewContext?.bankVersion?{scope:{userId:'u',licenseClass:'B',bankVersion:reviewContext.bankVersion}}:{}),...attemptId?{attemptId,playbackEventId:'p',videoUrl:'https://test.invalid/video'}:{},...extra});
 let props={scenarioId:'s',chapterId:'1',...(reviewContext?{reviewContext}:{}),...(attemptId?{attemptId}:{})};const calls=[];const reads=[];let failComplete=false;
 source={scenario:async(...args)=>{reads.push(args);return structuredClone(current);},overview:async()=>{throw Error('unused');},chapter:async()=>{throw Error('unused');},
 bookmark:async(_,id,value)=>({scenarioId:id,bookmarked:value}),
 command:async(_,input)=>{
  calls.push(structuredClone(input));
  if(input.kind==='NEW_ATTEMPT')current={...current,attemptId:'a',playbackEventId:'p',videoUrl:'https://test.invalid/video'};
  if(input.kind==='START')current={...current,phase:'playing'};
  if(input.kind==='RESPONSE')current={...current,phase:'recorded',responseRecorded:true,firstResponseMs:input.mediaTimeMs};
  if(input.kind==='COMPLETE'){
   if(failComplete){failComplete=false;throw Error('ACK lost before write');}
   current={...current,phase:'completed',result:{status:'COMPLETED',attemptId:'a',bankVersion:current.scope.bankVersion,scoringVersion:'score',score:0,maxScore:5,responseRecorded:false,firstResponseMs:null,durationMs:27000,scoringSegments:[],hazardSign:'Backend',recognitionTip:'Backend'}};
  }
  if(input.kind==='CANCEL')current={...current,phase:'video-error'};
  return structuredClone(current);
 }};
 const render=()=>root.render(React.createElement(QueryClientProvider,{client},React.createElement(SimulationScenarioPage,props)));
 const pushed=[];
 router={push:url=>pushed.push(url),replace:url=>{const u=new URL(url,'http://localhost');window.history.replaceState(null,'',u);props={...props,attemptId:u.searchParams.get('attempt')||undefined};render();}};
 await act(async()=>{render();await new Promise(r=>setTimeout(r,15));});
 await act(async()=>{await new Promise(r=>setTimeout(r,15));});
 return {client,calls,reads,pushed,setFailComplete:()=>{failComplete=true;},async action(run){await act(async()=>{await run();await new Promise(r=>setTimeout(r,5));});},get view(){return view;},async close(){await act(async()=>root.unmount());client.clear();host.remove();}};
}
after(()=>{Module._load=load;dom.window.close();});
test('initial read prepares exactly one attempt, pins ACK id in URL and avoids create on invalidation',async()=>{const h=await setup();try{assert.equal(h.calls.filter(c=>c.kind==='NEW_ATTEMPT').length,1);assert.equal(h.view.state.data.attemptId,'a');assert.equal(new URL(window.location.href).searchParams.get('attempt'),'a');await h.action(()=>h.client.invalidateQueries());assert.equal(h.calls.filter(c=>c.kind==='NEW_ATTEMPT').length,1);}finally{await h.close();}});
test('start, response and complete bridge measured positions into source commands',async()=>{const h=await setup('a');try{await h.action(()=>h.view.actions.start(8000));await h.action(()=>h.view.actions.respond(17432,'fixed-response'));await h.action(()=>h.view.actions.complete(26992));assert.equal(h.calls.find(c=>c.kind==='START').mediaTimeMs,8000);assert.equal(h.calls.find(c=>c.kind==='RESPONSE').mediaTimeMs,17432);assert.equal(h.calls.find(c=>c.kind==='COMPLETE').mediaTimeMs,26992);}finally{await h.close();}});
test('complete retry reconciles first and resends exact original event/body',async()=>{const h=await setup('a');try{h.setFailComplete();await h.action(async()=>{await assert.rejects(h.view.actions.complete(26992));});await h.action(()=>h.view.actions.reconcileResult());const completes=h.calls.filter(c=>c.kind==='COMPLETE');assert.equal(completes.length,2);assert.deepEqual(completes[0],completes[1]);assert(h.calls.findIndex(c=>c.kind==='RECONCILE_RESULT')<h.calls.lastIndexOf(completes[1]));assert.equal(h.view.state.data.phase,'completed');}finally{await h.close();}});
test('bookmark updates ACK without refetching/resetting the active scenario',async()=>{const h=await setup('a');try{await h.action(()=>h.view.actions.start(0));const count=h.reads.length;await h.action(()=>h.view.actions.bookmark());assert.equal(h.reads.length,count);assert.equal(h.view.state.data.phase,'playing');assert.equal(h.view.state.data.scenario.isBookmarked,true);}finally{await h.close();}});
test('exit waits for cancel ACK before navigation',async()=>{const h=await setup('a');try{await h.action(()=>h.view.onBack());assert.equal(h.view.exitOpen,true);assert.equal(h.pushed.length,0);await h.action(()=>h.view.onConfirmExit());assert.equal(h.calls.at(-1).kind,'CANCEL');assert.equal(h.pushed.length,1);}finally{await h.close();}});
test('query keys separate user/license/bank and view filters',()=>{const s={userId:'u',licenseClass:'B',bankVersion:'v'};const key=simulationLearningKeys.read(s,'chapter','1','ALL',0);for(const patch of [{userId:'other'},{licenseClass:'C'},{bankVersion:'new'}])assert.notDeepEqual(key,simulationLearningKeys.read({...s,...patch},'chapter','1','ALL',0));assert.notDeepEqual(key,simulationLearningKeys.read(s,'chapter','1','PRACTICED',0));});
test('read-only account can renew known result without learning callbacks or automatic create',async()=>{const result={status:'COMPLETED',attemptId:'a',bankVersion:'v',scoringVersion:'score',score:0,maxScore:5,responseRecorded:false,firstResponseMs:null,durationMs:27000,scoringSegments:[],hazardSign:'Backend',recognitionTip:'Backend'};const h=await setup('a',false,{phase:'completed',readOnly:true,result});try{assert.equal(h.calls.length,0);for(const key of ['start','respond','complete','heartbeat','interrupt','newAttempt','bookmark'])assert.equal(h.view.actions[key],undefined,key);assert.equal(typeof h.view.actions.renewPlayback,'function');await h.action(()=>h.view.actions.renewPlayback());assert.deepEqual(h.calls.map(c=>c.kind),['RENEW_PLAYBACK']);}finally{await h.close();}});

test('bookmark-origin learning pins bank, preserves bookmark and returns to the same filter/page',async()=>{const context={origin:'bookmarks',chapterId:'2',sort:'SCENARIO_ASC',page:3,bankVersion:'previous-bank'};const h=await setup(undefined,true,{scenario:{...model().scenario,isBookmarked:true}},context);try{assert.equal(h.reads[0][0].bankVersion,'previous-bank');assert.equal(h.reads[0][3],'BOOKMARK_NEW');assert.equal(h.calls.filter(c=>c.kind==='NEW_ATTEMPT').length,1);await h.action(()=>h.view.actions.start(0));await h.action(()=>h.view.actions.complete(26992));assert.equal(h.view.state.data.scenario.isBookmarked,true);await h.action(()=>h.view.onBack());const u=new URL(h.pushed.at(-1),'http://localhost');assert.equal(u.pathname,'/practice/simulations/bookmarks');assert.equal(u.searchParams.get('bank'),'previous-bank');assert.equal(u.searchParams.get('chapter'),'2');assert.equal(u.searchParams.get('page'),'3');assert.equal(u.searchParams.get('dataset'),null);}finally{await h.close();}});
