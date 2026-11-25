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
