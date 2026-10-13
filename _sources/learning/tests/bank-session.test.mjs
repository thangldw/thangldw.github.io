import test from 'node:test';
import assert from 'node:assert/strict';
import {readBankSession,writeBankSession} from '../src/bank-session.js';
test('bank resume persists only learner queue/response/result metadata, never protected payloads',()=>{
 const previous=globalThis.localStorage;const data=new Map();
 globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 try{
  const session={ids:['q1','q2'],position:1,responses:{q1:[0],q2:[2]},results:{q1:'wrong'},finished:false,prompt:'protected prompt',answer:[1],explanation:'protected explanation',token:'secret-token',feedback:{answer:[1]}};
  assert.equal(writeBankSession('aws',session).ok,true);
  const recovered=readBankSession('aws').session;
  assert.deepEqual(recovered,{ids:['q1','q2'],position:1,responses:{q1:[0],q2:[2]},results:{q1:'wrong'},finished:false});
  const serialized=[...data.values()].join('');
  for(const secret of ['protected prompt','protected explanation','secret-token','feedback'])assert.equal(serialized.includes(secret),false);
  assert.equal(readBankSession('jlpt').session.ids.length,0);
 }finally{globalThis.localStorage=previous}
});
test('bank write failure returns unavailable instead of a false saved state',()=>{
 const previous=globalThis.localStorage;globalThis.localStorage={getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('quota')},removeItem:()=>{throw Error('blocked')}};
 try{assert.equal(writeBankSession('aws',{ids:['q1']}).ok,false);assert.equal(readBankSession('aws').available,false)}finally{globalThis.localStorage=previous}
});

test('practice history survives new queues, counts feedback reload once, and isolates certifications', async()=>{
 const {readBankProgress}=await import('../src/bank-session.js');
 const previous=globalThis.localStorage;const data=new Map();
 globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 try{
  const first={ids:['q1','q2'],position:0,responses:{q1:[0]},results:{q1:'wrong'},finished:false,sessionId:'first'};
  writeBankSession('aws',first);writeBankSession('aws',first);
  assert.equal(readBankProgress('aws').progress.q1.attempts,1);
  writeBankSession('aws',{ids:[],results:{},responses:{},position:0,finished:false});
  assert.equal(readBankProgress('aws').progress.q1.result,'wrong');
  writeBankSession('aws',{...first,sessionId:'second',results:{q1:'correct',q2:'self_check_required'}});
  assert.equal(readBankProgress('aws').progress.q1.attempts,2);
  assert.equal(readBankProgress('aws').progress.q1.result,'correct');
  assert.equal(readBankProgress('aws').progress.q2.result,'self_check_required');
  assert.deepEqual(readBankProgress('jlpt').progress,{});
 }finally{globalThis.localStorage=previous}
});

test('legacy stored session contributes known results without fabricating earlier history',async()=>{
 const {readBankProgress}=await import('../src/bank-session.js');
 const previous=globalThis.localStorage;const data=new Map();
 const legacy={bank:{ids:['q1'],position:0,responses:{q1:[0]},results:{q1:'wrong'},finished:false}};
 data.set('thangldw:learning-bank:v1:aws:thangldw:apps:certification-library:state:v3',JSON.stringify(legacy));
 globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 try{
  assert.equal(readBankProgress('aws').progress.q1.attempts,1);
  writeBankSession('aws',readBankSession('aws').session);
  assert.equal(readBankProgress('aws').progress.q1.attempts,1);
 }finally{globalThis.localStorage=previous}
});
