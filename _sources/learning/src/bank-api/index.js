import {content} from './api.js';

// Share only index metadata in memory; protected prompts and feedback are never cached here.
const entries=new Map();
const ttl=5*60*1000;
export function loadBankIndex(certId){
 const now=Date.now();const previous=entries.get(certId);
 if(previous&&now<previous.expires)return previous.promise;
 if(entries.size>=24&&!entries.has(certId))entries.delete(entries.keys().next().value);
 const entry={expires:now+ttl,promise:null};
 entry.promise=content('/index',{certId}).catch(error=>{if(entries.get(certId)===entry)entries.delete(certId);throw error});
 entries.set(certId,entry);
 return entry.promise;
}
