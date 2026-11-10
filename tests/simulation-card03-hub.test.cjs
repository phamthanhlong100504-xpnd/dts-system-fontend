/* Container/query harness; no browser or backend claim. */
require('./simulation-test-loader.cjs');
const {test,after}=require('node:test');const assert=require('node:assert/strict');const Module=require('node:module');const path=require('node:path');
const {JSDOM}=Module.createRequire(path.join(process.env.DTS_QA_NODE_MODULES,'../package.json'))('jsdom');
const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost/practice'});
for(const key of ['window','document','HTMLElement','Element','Event','MutationObserver'])global[key]=dom.window[key];
global.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react');const {act}=React;const {createRoot}=require('react-dom/client');const {QueryClient,QueryClientProvider}=require('@tanstack/react-query');
const f=require('./simulation-card03-fixtures.cjs');const {ApiError}=require('../src/lib/api/envelope.ts');
const {createSimulationHttpSource}=require('../src/features/simulations/simulation-http-source.ts');
let source,view;const load=Module._load;
Module._load=function(name,parent,...args){
 if(name==='@/stores/auth-store')return {useAuthStore:selector=>selector({user:{id:f.scope.userId}})};
 if(name==='./simulation-learning-service')return {simulationHttpSource:new Proxy({}, {get:(_,key)=>source?.[key]})};
 if(name==='./simulation-practice-hub')return {SimulationPracticeHub:props=>{view=props;return React.createElement('div',null,props.state?.status);}};
 return load.call(this,name,parent,...args);
};
const {SimulationHubContainer}=require('../src/features/simulations/components/simulation-hub-container.tsx');
after(()=>{Module._load=load;dom.window.close();});
async function setup(total){const host=document.createElement('div');document.body.appendChild(host);const root=createRoot(host);const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});let failed=false;const calls=[];const h=f.replayHarness();source=createSimulationHttpSource({get:async(p,c)=>{calls.push(p);if(p==='/v1/simulations/bookmarks/overview'){if(failed)throw new ApiError('Forbidden',403);return f.overview(total);}if(p==='/v1/simulations/review-needed/overview')return require('./simulation-card02-fixtures.cjs').overview();return h.api.get(p,c);}});async function flush(){for(let i=0;i<4;i++)await act(async()=>{await new Promise(r=>setTimeout(r,5));});}await act(async()=>root.render(React.createElement(QueryClientProvider,{client},React.createElement(SimulationHubContainer,{license:{code:'B',simulationReady:true,simulationBankVersion:f.scope.bankVersion}}))));await flush();return {client,calls,flush,get view(){return view;},set failed(value){failed=value;},async close(){await act(async()=>root.unmount());client.clear();host.remove();}};}
for(const total of [0,3])test(`hub uses bookmark overview, including real zero=${total}`,async()=>{const h=await setup(total);try{assert.equal(h.view.state.status,'ready');assert.equal(h.view.state.summary.bookmarkedCount,total);assert(h.calls.includes('/v1/simulations/bookmarks/overview'));assert(!h.calls.includes('/v1/simulations/bookmarks'));}finally{await h.close();}});
test('hub bookmark failure surfaces error; Retry refetches and restores server count',async()=>{const h=await setup(3);try{h.failed=true;await act(async()=>{await h.client.invalidateQueries({queryKey:['simulation-learning',f.scope.userId,'B','bookmarks-overview']});});await h.flush();assert.equal(h.view.state.status,'error');h.failed=false;await act(async()=>h.view.onRetry());await h.flush();assert.equal(h.view.state.status,'ready');assert.equal(h.view.state.summary.bookmarkedCount,3);}finally{await h.close();}});
