const suffix = location.pathname.slice('/apps/cert/'.length).replace(/index\.html$/, '');
const target = suffix === 'pmp/' || suffix === 'pmp' ? '/pmp/' : '/cert/' + suffix;
location.replace(target + location.search + location.hash);
