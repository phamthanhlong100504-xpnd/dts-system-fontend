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
async function setup(extra={}, failResponse=false, skipHook) {
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
 if (extra.shortcuts) {
  actions.refreshShortcuts=async()=>calls.push(['capability-read']);
  actions.skipIntro=async ms=>{calls.push(['skip',ms]);await skipHook?.();model={...model,phase:'ready',playbackEventId:'p2',videoUrl:'https://test.invalid/approved-skip',resumeAtMs:10000,shortcuts:{...extra.shortcuts,skip:false,playbackEventId:'p2',startAtMs:10000}};render();};
 }
 await act(async()=>render());
 media=host.querySelector('video');let paused=true,ended=false,time=0;
 for(const [key,get] of Object.entries({readyState:()=>4,duration:()=>27,paused:()=>paused,ended:()=>ended,seeking:()=>false}))Object.defineProperty(media,key,{get,configurable:true});
 Object.defineProperty(media,'currentTime',{get:()=>time,set:v=>{time=v;},configurable:true});
 media.play=async()=>{paused=false;media.dispatchEvent(new Event('playing'));};
 media.pause=()=>{if(!paused){paused=true;media.dispatchEvent(new Event('pause'));}};
 media.load=()=>{ended=false;};
 const fire=async(name,at)=>{if(at!==undefined)time=at;await act(async()=>{if(name==='ended')ended=true;media.dispatchEvent(new Event(name));});};
 const click=async text=>{const b=[...host.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')===text||x.textContent.includes(text));assert(b,`button ${text}`);await act(async()=>{b.click();await new Promise(r=>setTimeout(r,5));});};
 return {host,media,calls,fire,click,async start(){await click('Phát video tình huống');for(let i=0;i<30&&media.paused;i++)await act(async()=>{await new Promise(r=>setTimeout(r,2));});assert.equal(media.paused,false,'actual playing event must precede test media events');},async close(){await act(async()=>root.unmount());host.remove();}};
}

const cap={skip:true,next:false,position:1,playbackEventId:'p',startAtMs:0};
const flush=async()=>{for(let n=0;n<8;n++)await act(async()=>{await new Promise(r=>setTimeout(r,5))});};
test('scored learning Skip waits for server ACK then starts approved ten, keeping original reaction timestamp',async()=>{let release;const gate=new Promise(r=>release=r),h=await setup({shortcuts:cap},false,()=>gate);try{await h.start();await h.fire('timeupdate',3.012);await h.click('Bỏ qua 10s');assert.equal(h.media.currentTime,3.012);assert.equal(h.media.paused,true);assert.deepEqual(h.calls.filter(c=>['skip','start'].includes(c[0])),[['start',0],['skip',3012]]);await h.fire('ended',27);assert(!h.calls.some(c=>['complete','interrupt'].includes(c[0])));await h.fire('timeupdate',3.012);await act(async()=>release());await flush();assert.equal(h.media.currentTime,10);assert.deepEqual(h.calls.filter(c=>c[0]==='start'),[['start',0],['start',10000]]);assert(![...h.host.querySelectorAll('button')].some(b=>b.textContent.includes('Bỏ qua 10s')||b.textContent.trim()==='Tiếp theo'));await h.fire('timeupdate',17.432);await h.click('Phát hiện nguy hiểm');assert.equal(h.calls.find(c=>c[0]==='response')[1],17432);}finally{await h.close();}});
test('unmount while learning skip is pending cannot START or play the detached media',async()=>{let release;const gate=new Promise(r=>release=r),h=await setup({shortcuts:cap},false,()=>gate);await h.start();await h.fire('timeupdate',3);await h.click('Bỏ qua 10s');await h.close();await act(async()=>release());await flush();assert.equal(h.calls.filter(c=>c[0]==='start').length,1);});
