/* HTML media-event harness, not real decoding, wall-clock acceptance or backend E2E. */
require('./simulation-test-loader.cjs');const {test,after}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{createRequire}=require('node:module');
const {JSDOM}=createRequire(path.join(process.env.DTS_QA_NODE_MODULES,'../package.json'))('jsdom');
const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost/'});for(const key of ['window','document','HTMLElement','Element','HTMLMediaElement','HTMLVideoElement','Event','KeyboardEvent','MouseEvent'])global[key]=dom.window[key];
global.IS_REACT_ACT_ENVIRONMENT=true;const timers=new Map();let timer=0;window.setInterval=fn=>{timers.set(++timer,fn);return timer;};window.clearInterval=id=>timers.delete(id);
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');const f=require('./simulation-card05-fixtures.cjs');
const Module=require('node:module'),load=Module._load;Module._load=function(name,parent,...args){if(name==='./simulation-feedback-modal')return {SimulationFeedbackModal:props=>props.message?React.createElement('div',{role:'alert'},props.message):null};return load.call(this,name,parent,...args);};
const {SimulationExamPlayer}=require('../src/features/simulations/components/simulation-exam-player.tsx');
after(()=>{Module._load=load;dom.window.close();});
async function setup(options={}){
 const host=document.createElement('div');document.body.appendChild(host);const root=createRoot(host),calls=[];
 let startHook=options.startHook,responseHook=options.responseHook;
 let props={playback:f.playback(),position:1,total:10,recorded:false,phase:options.review?'recorded':'ready',review:!!options.review,autoStart:!!options.autoStart,...options.props};
 const render=()=>root.render(React.createElement(SimulationExamPlayer,{...props,
  onStart:async owner=>{calls.push(['start',owner]);await startHook?.();props={...props,phase:props.recorded?'recorded':'playing'};render();},
  onHeartbeat:async(read,owner)=>calls.push(['heartbeat',read(),owner]),
  onRespond:async(ms,id,owner)=>{calls.push(['reaction',ms,id,owner]);props={...props,phase:'response-pending'};render();await responseHook?.();props={...props,phase:'recorded',recorded:true};render();},
  onComplete:async(ms,owner)=>calls.push(['complete',ms,owner]),
  onFault:owner=>{calls.push(['fault',owner]);props={...props,phase:'video-error'};render();},
  onRetry:()=>calls.push(['renew']),
 }));
 await act(async()=>render());const media=host.querySelector('video');let paused=true,ended=false,time=0,duration=27,rate=1;
 for(const [key,get]of Object.entries({readyState:()=>4,duration:()=>duration,paused:()=>paused,ended:()=>ended,seeking:()=>false,playbackRate:()=>rate}))Object.defineProperty(media,key,{get,configurable:true});
 Object.defineProperty(media,'currentTime',{get:()=>time,set:v=>time=v,configurable:true});
 media.play=async()=>{calls.push(['native-play']);paused=false;media.dispatchEvent(new Event('playing'));};media.pause=()=>{if(!paused){paused=true;media.dispatchEvent(new Event('pause'));}};media.load=()=>{};
 async function flush(){await act(async()=>{await new Promise(r=>setTimeout(r,5));});}
 async function fire(name,at){if(at!==undefined)time=at;await act(async()=>{if(name==='ended'){ended=true;paused=true;}media.dispatchEvent(new Event(name));});await flush();}
 await fire('loadedmetadata');
 return {host,media,calls,fire,flush,set rate(v){rate=v;},set duration(v){duration=v;},set startHook(v){startHook=v;},async start(){const b=host.querySelector('button[aria-label="Phát video bài thi"]')||host.querySelector('button[aria-label="Phát video xem lại"]');assert(b);await act(async()=>b.click());await flush();},async key(options={}){await act(async()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',...options})));await flush();},async tick(){await act(async()=>{for(const fn of timers.values())fn();});await flush();},async update(patch){props={...props,...patch};await act(async()=>render());await flush();},async close(){await act(async()=>root.unmount());host.remove();assert.equal(timers.size,0);}};
}

const capability=(patch={})=>({enabled:true,skipReason:null,skip:true,next:false,position:1,playbackEventId:f.uuid(100),startAtMs:0,...patch});
const button=(h,label)=>[...h.host.querySelectorAll('button')].find(b=>b.textContent.trim()===label);
test('active exam Skip uses measured 3012ms, quarantines pause/HB/reaction/ended and never directly seeks',async()=>{let release;const gate=new Promise(r=>release=r),requests=[];const h=await setup({props:{shortcuts:capability(),onSkipIntro:async(ms,owner)=>{requests.push([ms,owner]);await gate;}}});try{await h.start();await h.fire('timeupdate',3.012);const skip=button(h,'Bỏ qua 10s');assert(skip);await act(async()=>skip.click());assert.equal(requests[0][0],3012);assert.equal(h.media.paused,true);assert.equal(h.media.currentTime,3.012);await h.key();await h.tick();await h.fire('ended',27);assert(!h.calls.some(c=>['reaction','heartbeat','complete','fault'].includes(c[0])));await act(async()=>release());assert(!button(h,'Bỏ qua 10s'));}finally{await h.close();}});
test('active Next stays disabled with pending or missing proof and unlocks only for confirmed stored reaction',async()=>{let release;const gate=new Promise(r=>release=r),next=[];const h=await setup({responseHook:()=>gate,props:{shortcuts:capability(),onAdvance:async owner=>next.push(owner)}});try{await h.start();await h.fire('timeupdate',17.432);await h.key();assert(button(h,'Tiếp theo').disabled);await act(async()=>release());await h.flush();assert(button(h,'Tiếp theo').disabled);await h.update({shortcuts:capability({skip:false,next:true})});const b=button(h,'Tiếp theo');assert(b);await act(async()=>{b.click();b.click()});assert.equal(next.length,1);assert(!button(h,'Tiếp theo'));assert(!h.calls.some(c=>c[0]==='complete'));assert.equal(h.calls.find(c=>c[0]==='reaction')[1],17432);}finally{await h.close();}});
test('approved exam checkpoint seeks exactly 10000 before START ACK and never enables manual scrubbing',async()=>{let release;const gate=new Promise(r=>release=r);const h=await setup({startHook:()=>gate,props:{playback:{...f.playback(),restartAtMs:10000},shortcuts:capability({skip:false,startAtMs:10000})}});try{await h.start();assert.equal(h.media.currentTime,10);assert(!h.calls.some(c=>c[0]==='native-play'));await act(async()=>release());await h.flush();await h.fire('seeking',12);assert(h.calls.some(c=>c[0]==='fault'));}finally{await h.close();}});
test('unconfirmed stale media capability never exposes controls for a new nonce',async()=>{const h=await setup({props:{shortcuts:capability({playbackEventId:f.uuid(999),next:true}),recorded:true}});try{await h.start();assert(!button(h,'Bỏ qua 10s'));assert(!button(h,'Tiếp theo'));}finally{await h.close();}});
test('read-only playback has only Skip; Next is reserved for an active exam',async()=>{const h=await setup({review:true,props:{recorded:true,shortcuts:capability({next:true}),onAdvance:async()=>{throw Error('read-only')}}});try{assert(button(h,'Bỏ qua 10s'));assert(!button(h,'Tiếp theo'));}finally{await h.close();}});
