import {readFile,mkdir,writeFile,rm,cp} from 'node:fs/promises';
const client=new URL('../dist/client/',import.meta.url);
const pages=new URL('../dist/pages/',import.meta.url);
const template=await readFile(new URL('index.html',client),'utf8');
const catalog=JSON.parse(await readFile(new URL('../src/bank-api/catalog.json',import.meta.url),'utf8'));
// Pages serves these assets from the portfolio root, outside the Learning bundle.
function portfolioPage(html, name) {
 const label=name.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 return html.replace('</head>', `    <link rel="preload" href="/assets/fonts/InterVariable.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/css/compact-footer.css?v=20261103-portfolio">
    <link rel="stylesheet" href="/css/support-dialog.css?v=20261103-learning">
    <script defer src="/js/support-dialog.js?v=20261103-learning"></script>
  </head>`)
  .replace('<body>', '<body class="site-page" data-support-links>')
  .replace('</body>', `  <footer class="compact-footer" id="footer">
      <p class="footer-signature"><span><strong translate="no">${label}</strong> © <span data-footer-year>${new Date().getFullYear()}</span> <a href="/">thang.</a></span> <span lang="en" translate="no">crafted with care. stay steadfast, stay free</span></p>
    </footer>
  </body>`);
}
// The generated deployment tree has a directory page and root certification routes.
await rm(pages,{recursive:true,force:true});
await mkdir(pages,{recursive:true});
await cp(client,new URL('learning/',pages),{recursive:true});
await writeFile(new URL('learning/index.html',pages),portfolioPage(template,'Learning'));
for(const cert of catalog.certifications){
 if(cert.id==='pmp')continue; // Keep the dedicated production PMP workspace.
 if(!/^[a-z0-9-]+$/.test(cert.slug))throw Error('Invalid certification route');
 const directory=new URL(`${cert.slug}/`,pages);
 await mkdir(directory,{recursive:true});
 const entry=template.replace('https://thangldw.github.io/learning/"',`https://thangldw.github.io/${cert.slug}/"`);
 // The public /bjt/ URL belongs to the standalone Cert Studio BJT project.
 await writeFile(new URL('index.html',directory),cert.slug==='bjt'?entry:portfolioPage(entry,cert.shortName));
}
console.log(`Prepared /learning/ directory and ${catalog.certifications.filter(cert=>cert.id!=='pmp').length} root certification routes in dist/pages`);
