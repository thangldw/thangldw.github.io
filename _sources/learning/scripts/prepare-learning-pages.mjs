import {readFile,mkdir,writeFile,rm,cp} from 'node:fs/promises';
const client=new URL('../dist/client/',import.meta.url);
const pages=new URL('../dist/pages/',import.meta.url);
const template=await readFile(new URL('index.html',client),'utf8');
const catalog=JSON.parse(await readFile(new URL('../src/bank-api/catalog.json',import.meta.url),'utf8'));
// The generated deployment tree has a directory page and root certification routes.
await rm(pages,{recursive:true,force:true});
await mkdir(pages,{recursive:true});
await cp(client,new URL('learning/',pages),{recursive:true});
for(const cert of catalog.certifications){
 if(cert.id==='pmp')continue; // Keep the dedicated production PMP workspace.
 if(!/^[a-z0-9-]+$/.test(cert.slug))throw Error('Invalid certification route');
 const directory=new URL(`${cert.slug}/`,pages);
 await mkdir(directory,{recursive:true});
 await writeFile(new URL('index.html',directory),template.replace('https://thangldw.github.io/learning/"',`https://thangldw.github.io/${cert.slug}/"`));
}
console.log(`Prepared /learning/ directory and ${catalog.certifications.filter(cert=>cert.id!=='pmp').length} root certification routes in dist/pages`);
