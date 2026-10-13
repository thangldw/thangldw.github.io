import {readStoredStateWithHealth,writeStoredState} from './engine/storage.js';
const prefix='thangldw:learning-bank:v1:';
const adapter=cert=>({getItem:k=>localStorage.getItem(prefix+cert+':'+k),setItem:(k,v)=>localStorage.setItem(prefix+cert+':'+k,v),removeItem:k=>localStorage.removeItem(prefix+cert+':'+k)});
export const emptyBankSession=()=>({ids:[],position:0,responses:{},results:{},finished:false});
function project(session){
 const ids=Array.isArray(session?.ids)?session.ids.filter(id=>typeof id==='string').slice(0,20):[];
 const position=Number.isInteger(session?.position)&&session.position>=0&&session.position<ids.length?session.position:0;
 const responses=Object.fromEntries(ids.filter(id=>Array.isArray(session?.responses?.[id])).map(id=>[id,session.responses[id].filter(v=>typeof v==='string'||typeof v==='number').slice(0,20)]));
 const results=Object.fromEntries(ids.filter(id=>['correct','wrong','self_check_required'].includes(session?.results?.[id])).map(id=>[id,session.results[id]]));
 return {ids,position,responses,results,finished:session?.finished===true};
}
export function readBankSession(cert){const r=readStoredStateWithHealth(adapter(cert));return {session:project(r.state.bank),available:r.health.status==='available'}}
export function writeBankSession(cert,session){return writeStoredState(adapter(cert),{bank:project(session)})}
