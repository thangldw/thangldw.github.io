// Loaded only by /404.html: forwards retired routes so old links keep working
// without redirect stub pages.
const learningDestinations = {
  "ccar-f": "https://claude.cert-apps.workers.dev/"
};
const prefix = ['/cert/', '/apps/cert/'].find(value => location.pathname.startsWith(value));
if (prefix || ['/cert', '/apps/cert'].includes(location.pathname)) {
 const suffix = prefix ? location.pathname.slice(prefix.length).replace(/(?:\/)?index\.html$/, '').replace(/\/+$/, '') : '';
 if (Object.hasOwn(learningDestinations, suffix)) {
  const target = new URL(learningDestinations[suffix], location.origin);
  new URLSearchParams(location.search).forEach((value, key) => target.searchParams.set(key, value));
  target.hash = location.hash;
  location.replace(target.href);
 }
}

// /apps/ and /community/ were merged into sections of the home page.
const section = location.pathname.match(/^\/(apps|community)(?:\/(?:index\.html)?)?$/)?.[1];
if (section) {
 const target = new URL('/', location.origin);
 target.search = location.search; // keeps ?group=, ?q= and ?lang=
 target.hash = location.hash && location.hash !== '#main' ? location.hash : '#' + section;
 location.replace(target.href);
}
