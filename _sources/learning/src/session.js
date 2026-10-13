import { readStoredStateWithHealth, writeStoredState } from './engine/storage.js';
// Reuse the canonical storage boundary without reading or migrating real learner progress.
const prefix = 'thangldw:learning-robot-prototype:v1:';
const adapter = (courseId='aws') => ({getItem:key=>localStorage.getItem(prefix+(courseId==='aws'?'':courseId+':')+key),setItem:(key,value)=>localStorage.setItem(prefix+(courseId==='aws'?'':courseId+':')+key,value),removeItem:key=>localStorage.removeItem(prefix+(courseId==='aws'?'':courseId+':')+key)});
export const freshSession = () => ({version:1,stage:'explore',started:false,recall:'',recallRevealed:false,recallRating:null,hintUsed:false,answers:{},checked:[],question:0,completedAt:null});
export function loadSession(courseId='aws'){
 const result=readStoredStateWithHealth(adapter(courseId));
 const s=result.state.prototype;
 const valid=s?.version===1 && ['explore','learn','recall','apply','review'].includes(s.stage) && typeof s.recall==='string' && s.answers && Array.isArray(s.checked);
 return {session:valid?{...freshSession(),...s}:freshSession(),health:result.health.status};
}
export function saveSession(session,courseId='aws'){return writeStoredState(adapter(courseId),{prototype:session});}
