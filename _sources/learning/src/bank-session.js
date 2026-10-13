import {readStoredStateWithHealth,writeStoredState} from './engine/storage.js';
const prefix='thangldw:learning-bank:v1:';
const adapter=cert=>({getItem:k=>localStorage.getItem(prefix+cert+':'+k),setItem:(k,v)=>localStorage.setItem(prefix+cert+':'+k,v),removeItem:k=>localStorage.removeItem(prefix+cert+':'+k)});
export const emptyBankSession=()=>({ids:[],position:0,responses:{},results:{},finished:false});
function project(session){
 const ids=Array.isArray(session?.ids)?session.ids.filter(id=>typeof id==='string').slice(0,20):[];
 const position=Number.isInteger(session?.position)&&session.position>=0&&session.position<ids.length?session.position:0;
 const responses=Object.fromEntries(ids.filter(id=>Array.isArray(session?.responses?.[id])).map(id=>[id,session.responses[id].filter(v=>typeof v==='string'||typeof v==='number').slice(0,20)]));
 const results=Object.fromEntries(ids.filter(id=>['correct','wrong','self_check_required'].includes(session?.results?.[id])).map(id=>[id,session.results[id]]));
 return {ids,position,responses,results,finished:session?.finished===true,...(typeof session?.sessionId==='string'&&session.sessionId.length<=100?{sessionId:session.sessionId}:{})};
}
export function readBankSession(cert){const r=readStoredStateWithHealth(adapter(cert));return {session:project(r.state.bank),available:r.health.status==='available'}}
function progressFrom(state){
 const progress={};
 for(const [id,item] of Object.entries(state.practiceProgress||{}).slice(0,20000)){
  if(['correct','wrong','self_check_required'].includes(item?.result)&&Number.isInteger(item.attempts)&&item.attempts>0&&typeof item.lastSessionKey==='string'&&item.lastSessionKey.length<=2048)progress[id]={result:item.result,attempts:item.attempts,lastSessionKey:item.lastSessionKey};
 }
 return mergeResults(progress,project(state.bank));
}
function mergeResults(progress,session){
 const key=session.sessionId||'legacy:'+session.ids.join('|');
 for(const [id,result] of Object.entries(session.results)){
  const previous=progress[id];
  progress[id]={result,attempts:(previous?.attempts||0)+(previous?.lastSessionKey===key?0:1),lastSessionKey:key};
 }
 return progress;
}
export function readBankProgress(cert){const r=readStoredStateWithHealth(adapter(cert));return {progress:progressFrom(r.state),available:r.health.status==='available'}}
export function writeBankSession(cert,session){const bank=project(session);const r=readStoredStateWithHealth(adapter(cert));return writeStoredState(adapter(cert),{bank,practiceProgress:mergeResults(progressFrom(r.state),bank)})}
