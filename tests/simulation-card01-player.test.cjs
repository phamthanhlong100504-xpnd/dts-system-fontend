/* DOM/media-event harness only, not a browser or proof of real video playback.
 * Set DTS_QA_NODE_MODULES to an external QA installation containing jsdom. */
require('./simulation-test-loader.cjs');
const {createRequire} = require('node:module');
const path = require('node:path');
const {test,after} = require('node:test');
const assert = require('node:assert/strict');
const qa = process.env.DTS_QA_NODE_MODULES;
if (!qa) throw new Error('Set DTS_QA_NODE_MODULES to an external jsdom installation (no application dependency changes).');
const {JSDOM} = createRequire(path.join(qa,'../package.json'))('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/'});
for(const k of ['window','document','HTMLElement','Element','HTMLMediaElement','HTMLVideoElement','Event','KeyboardEvent','MouseEvent'])global[k]=dom.window[k];
global.IS_REACT_ACT_ENVIRONMENT=true;
global.requestAnimationFrame=cb=>setTimeout(cb,0);
const ticks = new Map();let tickId=0;
window.setInterval=cb=>{ticks.set(++tickId,cb);return tickId;};
window.clearInterval=id=>ticks.delete(id);
const React=require('react');const {act}=React;const {createRoot}=require('react-dom/client');
const {SimulationVideoPlayer}=require('../src/features/simulations/components/simulation-video-player.tsx');
let clock=10000;const originalNow=Date.now;Date.now=()=>clock;
after(()=>{Date.now=originalNow;dom.window.close();});
function baseModel(extra={}) {return {scope:{userId:'u',licenseClass:'B',bankVersion:'v'},scenario:{id:'s',number:1,title:'Backend',chapterId:'1',chapterNumber:1,chapterName:'Backend',positionLabel:'1',durationMs:27000,isBookmarked:false},phase:'ready',attemptId:'a',playbackEventId:'p',videoUrl:'https://test.invalid/video',posterUrl:null,resumeAtMs:0,responseRecorded:false,firstResponseMs:null,result:null,policy:{allowPause:false,allowSeek:false,allowFullscreen:true,allowHintsWhilePlaying:false,heartbeatIntervalMs:3000},hintPreview:null,previousScenarioId:null,nextScenarioId:null,...extra};}
async function setup(extra={}, failResponse=false) {
 const host=document.createElement('div');document.body.appendChild(host);const root=createRoot(host);
 let model=baseModel(extra);const calls=[];let media;
 const render=()=>root.render(React.createElement(SimulationVideoPlayer,{model,actions}));
 const actions={
  start:async ms=>{calls.push(['start',ms]);model={...model,phase:model.responseRecorded?'recorded':'playing'};render();},
  respond:async(ms,id)=>{calls.push(['response',ms,id]);if(failResponse){failResponse=false;throw Error('lost ACK');}model={...model,phase:'recorded',responseRecorded:true,firstResponseMs:ms};render();},
  complete:async ms=>{calls.push(['complete',ms]);model={...model,phase:'completed'};render();},
  heartbeat:async ms=>calls.push(['heartbeat',ms]),
  interrupt:async reason=>{calls.push(['interrupt',reason]);model={...model,phase:'video-error'};render();},
  renewPlayback:async()=>{calls.push(['renew']);model={...model,phase:model.phase==='completed'?'completed':'ready',replayUnavailable:false,videoUrl:'https://test.invalid/renewed',playbackExpiresAt:'2099-01-01T00:00:00Z'};render();},
 };
 await act(async()=>render());
 media=host.querySelector('video');let paused=true,ended=false,time=0;
 for(const [key,get] of Object.entries({readyState:()=>4,duration:()=>27,paused:()=>paused,ended:()=>ended,seeking:()=>false}))Object.defineProperty(media,key,{get,configurable:true});
 Object.defineProperty(media,'currentTime',{get:()=>time,set:v=>{time=v;},configurable:true});
 media.play=async()=>{paused=false;media.dispatchEvent(new Event('playing'));};
 media.pause=()=>{if(!paused){paused=true;media.dispatchEvent(new Event('pause'));}};
 media.load=()=>{};
 const fire=async(name,at)=>{if(at!==undefined)time=at;await act(async()=>{if(name==='ended')ended=true;media.dispatchEvent(new Event(name));});};
 const click=async text=>{const b=[...host.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')===text||x.textContent.includes(text));assert(b,`button ${text}`);await act(async()=>{b.click();await new Promise(r=>setTimeout(r,5));});};
 return {host,media,calls,fire,click,async start(){await click('Phát video tình huống');for(let i=0;i<30&&media.paused;i++)await act(async()=>{await new Promise(r=>setTimeout(r,2));});assert.equal(media.paused,false,'actual playing event must precede test media events');},async close(){await act(async()=>root.unmount());host.remove();}};
}
test('start seeks to server checkpoint and submits actual currentTime, not zero',async()=>{const h=await setup({resumeAtMs:8000});try{await h.start();assert.deepEqual(h.calls[0],['start',8000]);assert.equal(h.media.currentTime,8);}finally{await h.close();}});
test('first response and retry preserve identical id and media time after clock moves',async()=>{const h=await setup({},true);try{await h.start();await h.fire('timeupdate',17.432);await h.click('Phát hiện nguy hiểm');await h.fire('timeupdate',21);await h.click('Thử gửi lại phản ứng');const r=h.calls.filter(c=>c[0]==='response');assert.equal(r.length,2);assert.deepEqual(r[0],r[1]);assert.equal(r[0][1],17432);}finally{await h.close();}});
test('Space repeat/control targets do not send duplicate first reaction',async()=>{const h=await setup();try{await h.start();await h.fire('timeupdate',17.1);const input=document.createElement('input');h.host.appendChild(input);await act(async()=>{input.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',repeat:true}));});assert.equal(h.calls.filter(c=>c[0]==='response').length,0);await act(async()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space'})));assert.equal(h.calls.filter(c=>c[0]==='response').length,1);}finally{await h.close();}});
test('open modal prevents Space reaction',async()=>{const h=await setup();const modal=document.createElement('div');modal.setAttribute('role','dialog');modal.setAttribute('data-state','open');try{await h.start();document.body.appendChild(modal);await act(async()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space'})));assert.equal(h.calls.filter(c=>c[0]==='response').length,0);}finally{modal.remove();await h.close();}});
test('heartbeat samples current media time only while playback is continuous',async()=>{const h=await setup();try{await h.start();await h.fire('timeupdate',3.141);clock+=3100;await act(async()=>{for(const tick of ticks.values())tick();});assert.deepEqual(h.calls.find(c=>c[0]==='heartbeat'),['heartbeat',3141]);await h.fire('waiting',4);clock+=5000;await act(async()=>{for(const tick of ticks.values())tick();});assert.equal(h.calls.filter(c=>c[0]==='heartbeat').length,1);assert(h.calls.some(c=>c[0]==='interrupt'&&c[1]==='NETWORK'));}finally{await h.close();}});
test('ended completes with actual final position and only after playing',async()=>{const h=await setup();try{await h.start();await h.fire('ended',26.992);assert.deepEqual(h.calls.find(c=>c[0]==='complete'),['complete',26992]);}finally{await h.close();}});
test('error followed by ended never completes',async()=>{const h=await setup();try{await h.start();await h.fire('error',10);await h.fire('ended',27);assert(!h.calls.some(c=>c[0]==='complete'));assert(h.calls.some(c=>c[0]==='interrupt'));}finally{await h.close();}});
test('pause interrupts instead of retaining a continuous segment',async()=>{const h=await setup();try{await h.start();await act(async()=>h.media.pause());assert(h.calls.some(c=>c[0]==='interrupt'&&c[1]==='PAUSED'));}finally{await h.close();}});
test('seek interrupts; no synthetic complete/score follows',async()=>{const h=await setup();try{await h.start();await h.fire('seeking',20);assert(h.calls.some(c=>c[0]==='interrupt'&&c[1]==='SEEK'));assert(!h.calls.some(c=>c[0]==='complete'));}finally{await h.close();}});
test('read-only playback Space/seek/pause/waiting/ended never call learning actions',async()=>{const h=await setup({phase:'completed',readOnly:true,policy:{allowPause:true,allowSeek:true,allowFullscreen:true,allowHintsWhilePlaying:false}});try{await h.click('Xem lại video');await h.fire('timeupdate',8);await act(async()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space'})));await h.fire('seeking',12);await h.fire('waiting');await h.fire('canplay');await act(async()=>h.media.pause());await h.fire('ended',27);clock+=5000;await act(async()=>{for(const tick of ticks.values())tick();});assert.deepEqual(h.calls,[]);}finally{await h.close();}});
test('expired replay URL renews through replay action without start or reaction',async()=>{const h=await setup({phase:'completed',readOnly:true,playbackExpiresAt:'1970-01-01T00:00:01Z'});try{await h.click('Xem lại video');await act(async()=>{await new Promise(r=>setTimeout(r,10));});assert.deepEqual(h.calls,[['renew']]);assert.equal(h.media.getAttribute('src'),'https://test.invalid/renewed');}finally{await h.close();}});
test('replay error/reload preserves local viewing position and completed state',async()=>{const h=await setup({phase:'completed',readOnly:true});try{await h.click('Xem lại video');await h.fire('timeupdate',8.75);await h.fire('error');await h.click('Thử tải lại');await h.fire('loadedmetadata');assert.equal(h.media.currentTime,8.75);assert.deepEqual(h.calls,[['renew']]);assert(h.host.textContent.includes('Lượt luyện đã hoàn thành.'));}finally{await h.close();}});
test('read-only intro skip jumps to absolute ten once and preserves saved result/pause',async()=>{const saved={score:5,firstResponseMs:17432};const h=await setup({phase:'completed',readOnly:true,result:saved,policy:{allowPause:true,allowSeek:true,allowFullscreen:true,allowHintsWhilePlaying:false}});try{await h.fire('loadedmetadata');await h.fire('timeupdate',5);assert.equal(h.media.paused,true);await h.click('Bỏ qua 10s');assert.equal(h.media.currentTime,10);assert.equal(h.media.paused,true);assert(![...h.host.querySelectorAll('button')].some(b=>b.textContent.includes('Bỏ qua 10s')));await h.fire('timeupdate',2);assert(![...h.host.querySelectorAll('button')].some(b=>b.textContent.includes('Bỏ qua 10s')));assert.deepEqual(saved,{score:5,firstResponseMs:17432});assert.deepEqual(h.calls,[]);}finally{await h.close();}});
test('scored lesson never exposes a seek unsupported by its current backend policy',async()=>{const h=await setup();try{assert(![...h.host.querySelectorAll('button')].some(b=>b.textContent.includes('Bỏ qua 10s')));await h.start();await h.fire('timeupdate',17.432);await h.click('Phát hiện nguy hiểm');assert.equal(h.calls.find(c=>c[0]==='response')[1],17432);assert(!h.calls.some(c=>c[0]==='complete'));}finally{await h.close();}});
test('replay skip waits for actual metadata and resets availability during URL reload',async()=>{const h=await setup({phase:'completed',readOnly:true,policy:{allowPause:true,allowSeek:true,allowFullscreen:true,allowHintsWhilePlaying:false}});try{const button=[...h.host.querySelectorAll('button')].find(b=>b.textContent.includes('Bỏ qua 10s'));assert.equal(button.disabled,true);await h.fire('loadedmetadata');assert.equal(button.disabled,false);await h.fire('loadstart');assert.equal(button.disabled,true);assert.deepEqual(h.calls,[]);}finally{await h.close();}});
test('used intro skip remains hidden through same-video error and replay URL renewal',async()=>{const h=await setup({phase:'completed',readOnly:true,policy:{allowPause:true,allowSeek:true,allowFullscreen:true,allowHintsWhilePlaying:false}});try{await h.fire('loadedmetadata');await h.click('Bỏ qua 10s');await h.fire('timeupdate',2);await h.fire('error');await h.click('Thử tải lại');await h.fire('loadedmetadata');assert(![...h.host.querySelectorAll('button')].some(b=>b.textContent.includes('Bỏ qua 10s')));assert.deepEqual(h.calls,[['renew']]);}finally{await h.close();}});
