import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSession,loadSession,saveSession} from '../src/session.js';
import {STORAGE_KEY} from '../src/engine/storage.js';

test('switching courses preserves separate drafts and does not touch real study progress',()=>{
 const original=globalThis.localStorage;
 const entries=new Map([[STORAGE_KEY,'{"realProgress":"keep"}']]);
 globalThis.localStorage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)};
 try{
  saveSession({...freshSession(),started:true,stage:'recall',recall:'AWS draft'},'aws');
  assert.equal(loadSession('jlpt').session.started,false);
  saveSession({...freshSession(),started:true,stage:'recall',recall:'日本語の下書き'},'jlpt');
  assert.equal(loadSession('aws').session.recall,'AWS draft');
  assert.equal(loadSession('jlpt').session.recall,'日本語の下書き');
  assert.equal(entries.get(STORAGE_KEY),'{"realProgress":"keep"}');
 }finally{globalThis.localStorage=original}
});

test('unavailable browser storage reports failure instead of claiming a saved draft',()=>{
 const original=globalThis.localStorage;
 globalThis.localStorage={getItem:()=>{throw new Error('blocked')},setItem:()=>{throw new Error('quota')},removeItem:()=>{throw new Error('blocked')}};
 try{
  assert.equal(loadSession('jlpt').health,'unavailable');
  assert.equal(saveSession({...freshSession(),recall:'Keep in memory'},'jlpt').ok,false);
 }finally{globalThis.localStorage=original}
});
