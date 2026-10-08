const API='https://pmp-content-api.bizroll-game.workers.dev';
export async function openPublicLibrary({fetcher=globalThis.fetch,endpoint=API}={}) {
 let token,closed=false,recoveringScore=false,opening=null;
 const reissued=new Set(),inflight=new Map(),feedbackCache=new Map(),sessionKey='pmp-studio-api-session-v1';
 try{token=sessionStorage.getItem(sessionKey)}catch{}
 async function call(path,input={},retry=true) {
  if(closed)throw Error('Thư viện đã đóng');
  if(!token){
   opening??=(async()=>{const r=await fetcher(endpoint+'/session',{method:'POST',cache:'no-store'}),v=await r.json();if(!r.ok)throw Object.assign(Error(v.error),{status:r.status});if(closed)throw Error('Thư viện đã đóng');token=v.token;try{sessionStorage.setItem(sessionKey,token)}catch{}})();
   try{await opening}finally{opening=null}
  }
  const usedToken=token,r=await fetcher(endpoint+path,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Authorization':'Bearer '+usedToken},body:JSON.stringify(input)}),v=await r.json();
  if(r.status===401&&retry){if(token===usedToken){token=null;reissued.clear();recoveringScore=false}return call(path,input,false)}
  if(!r.ok)throw Object.assign(Error(v.error+(r.status===429?` (${r.headers.get('Retry-After')||60}s)`:'')),{status:r.status});
  if(closed)throw Error('Thư viện đã đóng');return v;
 }
 const pack=await call('/index'),byId=new Map(pack.questions.map(q=>[q.id,q])),prompts=new Map(),lessonCache=new Map();
 async function hydrateQuestions(ids) {
  ids=[...new Set(ids)];if(ids.length>20)throw Error('Chỉ mở tối đa 20 câu mỗi lần');
  const waiting=ids.filter(id=>inflight.has(id)).map(id=>inflight.get(id));if(waiting.length)await Promise.all(waiting);
  const missing=ids.filter(id=>!prompts.has(id));
  if(missing.length){
   const request=(async()=>{for(const q of await call('/questions',{ids:missing})){const target=byId.get(q.id);if(!target)throw Error('Câu hỏi không thuộc thư viện');Object.assign(target,q,{correctAnswer:null,loaded:true});prompts.set(q.id,true)}
    while(prompts.size>12){const id=prompts.keys().next().value;prompts.delete(id);const q=byId.get(id);for(const key of Object.keys(q))if(!['id','type','tags','section','sourceGroup','lessonId','lessonIds','answerBasis','examEligible','hasKey'].includes(key))delete q[key];Object.assign(q,{content:{prompt:''},choices:[],correctAnswer:null})}
   })();
   missing.forEach(id=>inflight.set(id,request));
   try{await request}finally{missing.forEach(id=>{if(inflight.get(id)===request)inflight.delete(id)})}
  }
  // Revisiting a prompt keeps it recent; answers remain bounded by the same cache.
  for(const id of ids)if(prompts.has(id)){prompts.delete(id);prompts.set(id,true)}
  return ids.map(id=>byId.get(id));
 }
 async function loadLesson(id){if(!lessonCache.has(id)){const lesson=await call('/lesson',{id});Object.assign(pack.lessons.find(l=>l.id===id),lesson);lessonCache.set(id,true);while(lessonCache.size>4){const old=lessonCache.keys().next().value;lessonCache.delete(old);Object.assign(pack.lessons.find(l=>l.id===old),{html:'',keyPoints:undefined,recall:undefined,studyBasis:undefined})}}}
 async function hydrate(ids,response){
  if(ids.length!==1)throw Error('Chấm điểm toàn phiên trên máy chủ');const q=byId.get(ids[0]),input={id:q.id,response:response||[]},cacheKey=JSON.stringify(input);
  let feedback=feedbackCache.get(cacheKey);
  if(!feedback){try{feedback=await call('/feedback',input)}catch(e){if(e.status!==403)throw e;await call('/questions',{ids:[q.id]});feedback=await call('/feedback',input)}feedbackCache.set(cacheKey,feedback);while(feedbackCache.size>12)feedbackCache.delete(feedbackCache.keys().next().value)}
  q.correctAnswer=feedback.correctAnswer;q.answerBasis=feedback.answerBasis;q.answerReview=feedback.answerReview;q.content.explanation=feedback.content.explanation;
  for(const [locale,text]of Object.entries(feedback.translations||{})){q.translations??={};q.translations[locale]??={};Object.assign(q.translations[locale],text)}return[q];
 }
 async function score(session){const input={ids:session.ids,responses:session.responses};try{const result=await call('/score',input);recoveringScore=false;reissued.clear();return result}catch(e){if(e.status!==403)throw e;if(!recoveringScore){recoveringScore=true;reissued.clear()}const needed=session.ids.filter(id=>session.responses[id]?.length&&!reissued.has(id));for(let offset=0;offset<needed.length;offset+=20){const chunk=needed.slice(offset,offset+20);await call('/questions',{ids:chunk});for(const id of chunk)reissued.add(id)}const result=await call('/score',input);recoveringScore=false;reissued.clear();return result}}
 return{pack,hydrate,hydrateQuestions,loadLesson,terms:(query,offset=0)=>call('/terms',{query,offset}),guide:()=>call('/guide'),score,close(){closed=true;token=null;prompts.clear();lessonCache.clear();feedbackCache.clear()}};
}
