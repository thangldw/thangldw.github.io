import {readFile,mkdir,writeFile,rm,cp} from 'node:fs/promises';
const client=new URL('../dist/client/',import.meta.url);
const pages=new URL('../dist/pages/',import.meta.url);
const template=await readFile(new URL('index.html',client),'utf8');
const catalog=JSON.parse(await readFile(new URL('../src/bank-api/catalog.json',import.meta.url),'utf8'));
// Pages serves shared chrome from the portfolio root, outside the Learning bundle.
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function portfolioPage(html, name, route) {
 const label=escapeHtml(name);
 const title=escapeHtml(`${name} — Thang Luu`);
 const description=escapeHtml(`Học và luyện ${name} bằng tiếng Việt, với câu hỏi theo chủ đề, giải thích và tiến độ lưu riêng trong trình duyệt.`);
 const canonical=`https://thangldw.github.io/${route}/`;
 const fallback=`<div id="root"><div class="site-page prototype">
      <a class="skip-link" href="#learning-main">Đến nội dung chính</a>
      <header class="site-header"><div class="site-shell-inner"><div class="brand-group">
        <a class="site-brand" href="/" aria-label="Trang chủ Thang Luu"><span class="site-brand-mark" aria-hidden="true">t:&gt;</span><span>thang.</span></a>
        <span class="bank-header-label">${label}</span>
      </div></div></header>
      <main id="learning-main" class="learning-directory" tabindex="-1" data-learning-fallback>
        <h1>${label}</h1><p>${description}</p>
        <p role="status">Đang tải không gian học… Nếu trang chưa hiển thị, hãy <a href="${canonical}">tải lại trang</a>.</p>
        <noscript><p>Bật JavaScript để sử dụng không gian học. Tiến độ được lưu trong trình duyệt của bạn.</p></noscript>
        <p><a href="/learning/">Danh sách chứng chỉ</a> · <a href="/">Trang chủ</a></p>
      </main>
    </div></div>`;
 return html
  .replace(/<title>[^<]*<\/title>/,`<title>${title}</title>`)
  .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${description}">`)
  .replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${canonical}">`)
  .replace(/<link rel="stylesheet" href="\/css\/site-shell\.css(?:\?[^"<]*)?"\s*\/?>(?:\s*)/g,'')
  .replace(/<script src="\/js\/site-shell\.js(?:\?[^"<]*)?"><\/script>/g,'')
  .replace('</head>', `    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="https://thangldw.github.io/assets/social-apps.jpg">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="preload" href="/assets/fonts/InterVariable.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/css/compact-footer.css?v=20261103-portfolio">
    <link rel="stylesheet" href="/css/support-dialog.css?v=20261105-qr">
    <link rel="stylesheet" href="/css/site-shell.css?v=20261011vi">
    <script defer src="/js/site-shell.js?v=20261103-footer"></script>
    <script defer src="/js/support-dialog.js?v=20261106-i18n"></script>
  </head>`)
  .replace('<body>', '<body class="site-page" data-page-kind="product" data-analytics="off" data-support-links>')
  .replace('<div id="root"></div>',fallback)
  .replace('</body>', `  <footer class="site-foot compact-footer" id="footer">
      <p class="footer-signature"><span><strong translate="no">${label}</strong> © <span data-footer-year>${new Date().getFullYear()}</span> <a href="/">thang.</a></span> <span lang="en" translate="no">crafted with care. stay steadfast, stay free</span></p>
    </footer>
  </body>`);
}
// The generated deployment tree has a directory page and root certification routes.
await rm(pages,{recursive:true,force:true});
await mkdir(pages,{recursive:true});
await cp(client,new URL('learning/',pages),{recursive:true});
await writeFile(new URL('learning/index.html',pages),portfolioPage(template,'Learning','learning'));
for(const cert of catalog.certifications){
 if(cert.id==='pmp')continue; // Keep the dedicated production PMP workspace.
 if(!/^[a-z0-9-]+$/.test(cert.slug))throw Error('Invalid certification route');
 const directory=new URL(`${cert.slug}/`,pages);
 await mkdir(directory,{recursive:true});
 await writeFile(new URL('index.html',directory),portfolioPage(template,cert.shortName,cert.slug));
}
console.log(`Prepared /learning/ directory and ${catalog.certifications.filter(cert=>cert.id!=='pmp').length} root certification routes in dist/pages`);
