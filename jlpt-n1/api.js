const ENDPOINT=globalThis.CERT_CONTENT_API||'https://cert-content-api.bizroll-game.workers.dev';
let token=null,opening=null;
export async function content(route,input={},retry=true){
 if(!token){opening ||= (async()=>{const r=await fetch(ENDPOINT+'/session',{method:'POST',cache:'no-store'});const d=await r.json();if(!r.ok)throw Object.assign(Error(d.error||'Không mở được phiên học.'),{status:r.status});token=d.token;})();try{await opening;}finally{opening=null;}}
 const r=await fetch(ENDPOINT+route,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(input)});
 const d=await r.json();if(r.status===401&&retry){token=null;return content(route,input,false);}if(!r.ok)throw Object.assign(Error(d.error||'Không tải được nội dung.'),{status:r.status});return d;
}
