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

const cap=patch=>({enabled:true,skipReason:null,skip:true,next:false,position:1,playbackEventId:f.uuid(100),startAtMs:0,...patch});
const button=(h,text)=>[...h.host.querySelectorAll('button')].find(b=>b.textContent.trim()===text);
test('background stalled event with healthy future data is not a video failure',async()=>{const h=await setup();try{await h.start();await h.fire('timeupdate',3);await h.fire('stalled');await h.fire('timeupdate',4);await h.tick();assert(!h.calls.some(c=>c[0]==='fault'));assert(h.calls.some(c=>c[0]==='heartbeat'&&c[1]===4000));}finally{await h.close();}});
test('a brief real wait pauses input/HB, resumes on playing, and never fabricates a response or completion',async()=>{const h=await setup();try{await h.start();await h.fire('waiting',3);await h.key();await h.tick();assert(!h.calls.some(c=>['fault','heartbeat','reaction','complete'].includes(c[0])));await h.fire('playing',3);await h.fire('timeupdate',3.2);await h.tick();assert(h.calls.some(c=>c[0]==='heartbeat'&&c[1]===3200));assert(!h.calls.some(c=>['fault','reaction','complete'].includes(c[0])));}finally{await h.close();}});
test('a long actual wait triggers one recovery instead of continuing with an invalid server clock',async()=>{const h=await setup();try{await h.start();await h.fire('waiting',3);await act(async()=>{await new Promise(r=>setTimeout(r,800));});assert.equal(h.calls.filter(c=>c[0]==='fault').length,1);assert(h.host.textContent.includes('Phiên phát video cần khôi phục'));await h.tick();await h.key();await h.fire('ended',27);assert(!h.calls.some(c=>['heartbeat','reaction','complete'].includes(c[0])));}finally{await h.close();}});
test('wait before START buffers video instead of starting a clock and then failing',async()=>{const h=await setup();try{let ready=1;Object.defineProperty(h.media,'readyState',{get:()=>ready,configurable:true});await h.start();assert(!h.calls.some(c=>c[0]==='start'));assert(!h.calls.some(c=>c[0]==='fault'));ready=4;await h.fire('canplay');await h.flush();assert.equal(h.calls.filter(c=>c[0]==='start').length,1);assert(h.calls.some(c=>c[0]==='native-play'));}finally{await h.close();}});
test('ungraded restarted video retains visible disabled Next and does not fake a reaction',async()=>{const h=await setup({props:{shortcuts:cap(),onSkipIntro:async()=>{},onAdvance:async()=>{throw Error('unconfirmed')}}});try{await h.start();assert(button(h,'Bỏ qua 10s'));assert(button(h,'Tiếp theo').disabled);await act(async()=>button(h,'Tiếp theo').click());assert(!h.calls.some(c=>c[0]==='reaction'||c[0]==='complete'));}finally{await h.close();}});
test('confirmed Next remains usable when the decoder fails, without replaying or completing the video',async()=>{let next=0;const h=await setup({props:{recorded:true,shortcuts:cap({next:true,skip:false}),onAdvance:async()=>next++}});try{await h.start();await h.fire('error',5);const b=button(h,'Tiếp theo');assert(b&&!b.disabled);await act(async()=>b.click());assert.equal(next,1);assert(!h.calls.some(c=>['complete','reaction'].includes(c[0])));}finally{await h.close();}});
test('confirmed Next can recover an owned frame even if the playback grant is missing',async()=>{let next=0;const h=await setup({props:{recorded:true,shortcuts:cap({next:true,skip:false}),onAdvance:async()=>next++}});try{await h.update({playback:null,phase:'video-error'});const b=button(h,'Tiếp theo');assert(b&&!b.disabled);await act(async()=>b.click());assert.equal(next,1);}finally{await h.close();}});
test('a real ended after a brief tail wait completes at the actual original duration once',async()=>{const h=await setup();try{await h.start();await h.fire('waiting',26.9);assert(!h.calls.some(c=>c[0]==='complete'));await h.fire('ended',27);assert.equal(h.calls.filter(c=>c[0]==='complete').length,1);assert.equal(h.calls.find(c=>c[0]==='complete')[1],27000);assert(!h.calls.some(c=>c[0]==='fault'));}finally{await h.close();}});
