// Single source for the header and footer that Home, Apps, Community and Japan PR Guide share.
// `node scripts/sync-shell.mjs` writes these into the pages; `--check` fails when a page drifts.

const brand = '<a class="site-brand" href="/" aria-label="Thang Luu home"><span class="site-brand-mark" aria-hidden="true">t:&gt;</span><span>Thang Luu</span></a>';
const nav = '<nav class="site-nav" aria-label="Site"><a href="/apps/" data-site-nav="apps">Apps</a><a href="/community/" data-site-nav="community">Community</a></nav>';
const localeSwitch = '<div class="locale-switch" role="group" aria-label="Display language"><button type="button" data-lang="en" aria-label="English" aria-pressed="true">EN</button><button type="button" data-lang="vi" aria-label="Tiếng Việt" aria-pressed="false">VI</button><button type="button" data-lang="ja" aria-label="日本語" aria-pressed="false">JA</button><button type="button" data-lang="zh" aria-label="中文" aria-pressed="false">CN</button></div>';
const themeToggle = '<button type="button" class="site-theme-toggle" id="themeToggle" aria-label="Switch to dark theme"><i class="fa-solid fa-moon" aria-hidden="true"></i></button>';

// `localized` pages translate the shell through js/homepage.js; `plain` pages are English-only tools.
export function header(variant) {
  const lines = ['<header class="site-header home-header" id="siteHeader"><div class="site-shell-inner">', `  ${brand}${nav}`, '  <div class="header-actions">', '    <span id="supportSlot"></span>'];
  if (variant === 'localized') lines.push(`    ${localeSwitch}`);
  lines.push(`    ${themeToggle}`, '  </div>', '</div></header>');
  return lines.join('\n');
}

export function footer(variant) {
  const motto = variant === 'localized' ? '<span data-home="motto">' : '<span>';
  return `<footer class="home-foot"><p class="footer-signature">${motto}Crafted with care, stay steadfast, stay free</span><span>© <span data-footer-year>2026</span> Thang Luu</span></p></footer>`;
}
