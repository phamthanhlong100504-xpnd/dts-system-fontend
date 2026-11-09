/* Synthetic state machine for the handed-over shortcut contract, never application data. */
const f = require('./simulation-card05-fixtures.cjs');
const {ApiError}=require('../src/lib/api/envelope.ts');
function examHarness(mode='RANDOM', options={}) {
 const h=f.harness(), receipts=new Map(), used=new Set(), reasons={};
 let enabled=false, revision=0, checkpoint=0, nonce=2000, hook;
 if(mode==='PRESET'){
  const preset={...require('./simulation-card06-fixtures.cjs').ref,title:'QA Đề số 1'};
  h.state={...h.state,mode:'PRESET',preset,presetSetId:preset.presetSetId,presetVersionId:preset.presetVersionId,presetTitle:preset.title,policy:{...f.policy,policyVersion:'simulation-preset-10-v1-pass35'}};
 }
 const proof=()=>h.state.responseRecorded ? (h.state.playbackEventId.replaceAll('-','')+'b'.repeat(32)) : null;
 const state=()=>({targetKind:'EXAM',targetId:f.sid,licenseClass:h.state.scope.licenseClass,supported:true,enabled,canEnable:!enabled&&h.state.completedScenarios===0&&h.state.playbackState==='NOT_STARTED'&&!h.state.responseRecorded,protocolVersion:enabled?'video-shortcuts-v1':'legacy-v1',reason:enabled?null:'NOT_ENABLED',shortcutRevision:revision,stateFingerprint:'a'.repeat(64),position:h.state.currentPosition,playbackEventId:h.state.playbackEventId,startAtMs:checkpoint,
  skipIntro:{available:enabled&&h.state.status==='IN_PROGRESS'&&h.state.playbackState==='PLAYING'&&!used.has(h.state.currentPosition)&&!h.state.responseRecorded,targetMs:10000,maxSafeTargetMs:10000,reason:enabled&&h.state.playbackState==='PLAYING'&&!used.has(h.state.currentPosition)&&!h.state.responseRecorded?null:h.state.responseRecorded?'REACTION_ALREADY_RECORDED':used.has(h.state.currentPosition)?'ALREADY_USED':'NOT_PLAYING'},
  advanceAfterReaction:{available:enabled&&h.state.status==='IN_PROGRESS'&&h.state.responseRecorded,reason:enabled&&h.state.status==='IN_PROGRESS'&&h.state.responseRecorded?null:'REACTION_ACK_REQUIRED'},reactionAcknowledgement:enabled&&h.state.status==='IN_PROGRESS'?proof():null,completionReason:reasons[h.state.currentPosition]??null,completionReasons:{...reasons},attempt:null,session:structuredClone(h.state)});
 function advance(){const s=h.state;reasons[s.currentPosition]='ADVANCE_AFTER_REACTION';s.completedScenarios++;s.positions=s.positions.map((p,i)=>({position:i+1,status:i<s.completedScenarios?'COMPLETED':i===s.completedScenarios?'CURRENT':'NOT_STARTED'}));if(s.completedScenarios===10){s.status='READY_TO_SUBMIT';s.playbackState='FINISHED';}else{s.currentPosition++;s.responseRecorded=false;s.playbackEventId=f.uuid(++nonce);s.playbackState='NOT_STARTED';}checkpoint=0;}
 h.override=async(method,path,body,config)=>{
  if(path.endsWith('/shortcuts')&&method==='get') {const raw=state();return hook ? (await hook(method,path,body,raw))??raw:raw;}
  if(path.includes('/shortcuts/')&&method==='post'){
   const operation=path.endsWith('/enable')?'ENABLE':path.endsWith('/skip-intro')?'SKIP_INTRO':'ADVANCE_AFTER_REACTION';
   const key=JSON.stringify({path,body,query:config?.params});let receipt=receipts.get(body.eventId);
   if(receipt){if(receipt.key!==key)throw new ApiError('conflict',409,'SIMULATION_SHORTCUT_EVENT_CONFLICT');}
   else{
    if(body.position!==h.state.currentPosition||body.playbackEventId!==h.state.playbackEventId)throw new ApiError('stale',409,'SIMULATION_SHORTCUT_PLAYBACK_CHANGED');
    if(operation==='ENABLE'){if(!state().canEnable)throw new ApiError('locked',409,'SIMULATION_SHORTCUT_POLICY_LOCKED');enabled=true;}
    else if(operation==='SKIP_INTRO'){if(!state().skipIntro.available||body.mediaTimeMs>=10000)throw new ApiError('used',409,'SIMULATION_SHORTCUT_ALREADY_USED');used.add(body.position);h.state.playbackEventId=f.uuid(++nonce);h.state.playbackState='NOT_STARTED';checkpoint=10000;}
    else {if(!state().advanceAfterReaction.available||body.reactionAcknowledgement!==proof())throw new ApiError('unconfirmed',409,'SIMULATION_SHORTCUT_REACTION_ACK_REQUIRED');advance();}
    revision++;receipt={key,value:{eventId:body.eventId,operation,targetKind:'EXAM',targetId:f.sid,position:body.position,playbackEventId:body.playbackEventId,resultingPlaybackEventId:h.state.playbackEventId,checkpointMs:operation==='SKIP_INTRO'?10000:0,appliedRevision:revision,appliedAt:'2026-11-04T00:00:00Z'}};receipts.set(body.eventId,receipt);
   }
   const raw={receipt:receipt.value,state:state()};return hook?(await hook(method,path,body,raw))??raw:raw;
  }
  if(path.endsWith('/current/playback')&&method==='get'){const p=await h.dispatch(method,path,body,config);p.restartAtMs=checkpoint;return p;}
  if(path.endsWith('/current/start')&&method==='post'){
   if(body.mediaTimeMs!==checkpoint)throw Error('Unapproved checkpoint');h.state.playbackState='PLAYING';return structuredClone(h.state);
  }
  if(path.endsWith('/current/restart')&&method==='post') {
   const replay=h.events.has(body.eventId),unanswered=!h.state.responseRecorded;
   const raw=await h.dispatch(method,path,body,config);
   if(!replay){checkpoint=0;if(options.restartRearm&&enabled&&unanswered&&used.delete(body.position))revision++;}
   return hook?(await hook(method,path,body,raw))??raw:raw;
  }
  if(hook){const raw=await h.dispatch(method,path,body,config);return (await hook(method,path,body,raw))??raw;}
 };
 return {h,state,used,receipts,advance,get checkpoint(){return checkpoint},set hook(v){hook=v},set enabled(v){enabled=v}};
}
module.exports={...f,examHarness};
