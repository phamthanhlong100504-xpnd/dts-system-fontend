/* Isolated QA data only. Production source never imports this file. */
const uuid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const scope={userId:uuid(1),licenseClass:'B',bankVersion:'qa-bank'};
const dataset='a'.repeat(64);
const chapters=()=>Array.from({length:6},(_,i)=>({chapterId:i+1,chapterNumber:i+1,chapterName:`Backend chapter ${i+1}`,needReviewCount:i<2?1:0}));
const item=(score=0,chapterId=1,number=1)=>({scenarioId:uuid(number+10),scenarioNumber:number,chapterId,chapterNumber:chapterId,chapterName:`Backend chapter ${chapterId}`,title:`Backend item ${number}`,durationMs:27000,thumbnailUrl:'https://qa.invalid/thumbnail',thumbnailExpiresAt:'2099-01-01T00:00:00Z',bestScore:score,maxScore:5,isPracticed:true,isBookmarked:false,completedAttemptCount:2});
const overview=()=>({scope:{...scope},scoringVersion:'qa-score',practicedScenarios:3,totalNeedReview:2,chapters:chapters(),datasetVersion:dataset});
const list=()=>({...overview(),chapterId:null,sort:'BEST_SCORE_ASC',filteredCount:2,items:[item(0,1,1),item(4,2,2)],page:{number:0,size:12,totalElements:2,totalPages:1}});
const policy={allowPause:false,allowSeek:false,allowFullscreen:true,allowHintsWhilePlaying:false,heartbeatIntervalMs:3000,maxHeartbeatGapMs:12000};
function replayHarness(){
 let a={attemptId:uuid(3),scenarioId:uuid(11),bankVersion:scope.bankVersion,scoringVersion:'qa-score',status:'COMPLETED',playbackEventId:uuid(4),videoDurationMs:27000,resumeAtMs:27000,responseRecorded:true,firstResponseMs:17432,requiresResume:false,createdAt:'2026-11-02T00:00:00Z',startedAt:'2026-11-02T00:00:00Z',completedAt:'2026-11-02T00:01:00Z',policy,result:null};
 const result=()=>({attemptId:a.attemptId,scenarioId:a.scenarioId,status:'COMPLETED',score:5,maxScore:5,responseRecorded:a.responseRecorded,firstResponseMs:a.firstResponseMs,videoDurationMs:a.videoDurationMs,bankVersion:a.bankVersion,scoringVersion:a.scoringVersion,scoringSegments:[{startMs:17000,endMs:20000,score:5,endInclusive:true}],hazardSign:'Backend hazard',recognitionTip:'Backend tip'});
 a.result=result();const calls=[];let override;
 const replay=()=>({attemptId:a.attemptId,scenarioId:a.scenarioId,bankVersion:a.bankVersion,scoringVersion:a.scoringVersion,videoUrl:'https://qa.invalid/replay',expiresAt:'2099-01-01T00:00:00Z',mimeType:'video/mp4',durationMs:a.videoDurationMs,readOnly:true,policy:{allowPause:true,allowSeek:true,allowFullscreen:true}});
 const api=Object.fromEntries(['get','put','post','patch','delete'].map(method=>[method,async(path,body)=>{
  calls.push({method,path,body});if(override){const value=await override(method,path,body);if(value!==undefined)return value;}
  if(method!=='get')throw Error('No writes expected in replay fixture');
  if(path.endsWith('/replay'))return replay();
  if(path.endsWith('/result'))return result();
  if(path.endsWith('/overview'))return {scope:{...scope,bankVersion:a.bankVersion},totalScenarios:2,practicedScenarios:1,completionPercent:50,chapters:[{chapterId:1,chapterNumber:1,chapterName:'Backend chapter 1',totalScenarios:2,practicedScenarios:1,completionPercent:50,status:'IN_PROGRESS'}]};
  if(path.includes('/scenarios/'))return {scope:{...scope,bankVersion:a.bankVersion},scenario:{...item(0),scenarioId:a.scenarioId},hintPreview:null,policy,latestAttempt:a,previousScenarioId:null,nextScenarioId:null};
  return structuredClone(a);
 }]));
 return {api,calls,replay,result,get a(){return a;},set a(value){a=value;},set override(value){override=value;}};
}
module.exports={uuid,scope,dataset,chapters,item,overview,list,policy,replayHarness};
