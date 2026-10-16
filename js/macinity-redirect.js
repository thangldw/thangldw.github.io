(() => {
  const current = new URL(location.href);
  if (current.pathname !== '/toolbox' && !current.pathname.startsWith('/toolbox/')) return;
  current.pathname = '/macinity' + current.pathname.slice('/toolbox'.length);
  location.replace(current.href);
})();
