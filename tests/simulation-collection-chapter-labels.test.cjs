/* Render the real Card02/Card03 lists with synthetic DTOs; no backend writes. */
require('./simulation-test-loader.cjs');
const {test,after}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{createRequire}=require('node:module');
const {JSDOM}=createRequire(path.join(process.env.DTS_QA_NODE_MODULES,'../package.json'))('jsdom');
const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost/practice/simulations/review-needed'});
for(const k of ['window','document','HTMLElement','Element','Event','MouseEvent'])global[k]=dom.window[k];
global.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');
const f=require('./simulation-card02-fixtures.cjs'),b=require('./simulation-card03-fixtures.cjs');
const {createSimulationReviewSource}=require('../src/features/simulations/simulation-review-source.ts');
const {createSimulationBookmarksSource}=require('../src/features/simulations/simulation-bookmarks-source.ts');
const {SimulationReviewNeededView}=require('../src/features/simulations/components/simulation-review-needed-view.tsx');
const {SimulationBookmarksView}=require('../src/features/simulations/components/simulation-bookmarks-view.tsx');
after(()=>dom.window.close());
const roman={1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI'};
for(const kind of ['review','bookmarks'])test(`${kind}: chapter names appear once in cards, tooltips and filters; counts, IDs and action data stay intact`,async()=>{
 const isReview=kind==='review',raw=isReview?f.list():b.list(),reads=[];
 for(const c of raw.chapters)c.chapterName=`Chương ${c.chapterNumber}: Giao thông QA ${c.chapterNumber}`;
 for(const i of raw.items)i.chapterName=`Chương ${i.chapterNumber}: Giao thông QA ${i.chapterNumber}`;
 const original=structuredClone(raw),criteria={chapterId:null,sort:isReview?'BEST_SCORE_ASC':'SCENARIO_ASC',page:0};
 const api={get:async(p)=>{reads.push(p);return raw;}};
 const data=isReview?await createSimulationReviewSource(api,()=>{}).reviewNeeded(f.scope,criteria):await createSimulationBookmarksSource(api,()=>{}).bookmarks(f.scope,criteria);
 const mapped=structuredClone(data),opened=[],bookmarked=[],filtered=[];
 const C=isReview?SimulationReviewNeededView:SimulationBookmarksView;
 const host=document.createElement('div');document.body.appendChild(host);const root=createRoot(host);
 try{
  await act(async()=>root.render(React.createElement(C,{state:{status:'ready',data},criteria,onOpen:i=>opened.push(i),onBookmark:i=>bookmarked.push(i),onChapter:id=>filtered.push(id)})));
  const cards=[...host.querySelectorAll('article')];assert.equal(cards.length,data.items.length);
  for(const [index,card] of cards.entries()){
   const item=data.items[index],expected=`Chương ${roman[item.chapterNumber]} · Giao thông QA ${item.chapterNumber}`;
   const label=card.querySelector('p[title]');assert(label);assert.equal(label.textContent,expected);assert.equal(label.title,expected);
   assert(card.textContent.includes(item.title));
   if(item.isPracticed)assert(card.textContent.includes(`${item.bestScore}/${item.maxScore}`));
  }
  const select=host.querySelector('select[aria-label="Lọc chương mô phỏng"]');assert(select);
  for(const [index,c] of data.chapters.entries()){
   const count=isReview?c.needReviewCount:c.bookmarkedCount;
   assert.equal(select.options[index+1].textContent,`Chương ${roman[c.number]} · Giao thông QA ${c.number} (${count})`);
   assert.equal(select.options[index+1].value,c.id);
  }
  await act(async()=>{cards[0].querySelector('button').click();cards[0].querySelector('button[aria-pressed]').click();select.value='2';select.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(opened[0],data.items[0]);assert.equal(bookmarked[0],data.items[0]);assert.deepEqual(filtered,['2']);
  assert.deepEqual(raw,original);assert.deepEqual(data,mapped);assert.equal(reads.length,1);
  assert(!host.textContent.includes('Chương 1:'));
 }finally{await act(async()=>root.unmount());host.remove();}
});
