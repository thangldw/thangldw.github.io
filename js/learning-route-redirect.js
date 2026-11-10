const destinations = {
  "ccar-f": "/claude-cert/"
};
const prefix = ['/cert/', '/apps/cert/'].find(value => location.pathname.startsWith(value));
if (prefix || ['/cert', '/apps/cert'].includes(location.pathname)) {
 const suffix = prefix ? location.pathname.slice(prefix.length).replace(/(?:\/)?index\.html$/, '').replace(/\/+$/, '') : '';
 if (Object.hasOwn(destinations, suffix)) {
  const target = new URL(destinations[suffix], location.origin);
  new URLSearchParams(location.search).forEach((value, key) => target.searchParams.set(key, value));
  target.hash = location.hash;
  location.replace(target.pathname + target.search + target.hash);
 }
}
