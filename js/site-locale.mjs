const preference = 'portfolio.site.locale';
const supported = new Set(['en', 'vi', 'ja', 'zh']);

function savedLocale() {
  try { return sessionStorage.getItem(preference); } catch { return null; }
}

function rememberLocale(language) {
  try { sessionStorage.setItem(preference, language); } catch { /* Keep the selection on this page. */ }
}

export function bindLocaleSwitch(render, { updateUrl = false } = {}) {
  const requested = new URLSearchParams(location.search).get('lang');
  const saved = savedLocale();
  const restoringSession = performance.getEntriesByType('navigation')[0]?.type === 'back_forward' && supported.has(saved);
  let language = restoringSession ? saved : supported.has(requested) ? requested : supported.has(saved) ? saved : 'en';
  if (supported.has(requested) && !restoringSession) rememberLocale(language);

  function syncUrl() {
    const url = new URL(location.href);
    if (updateUrl || url.searchParams.has('lang')) {
      url.searchParams.set('lang', language);
      history.replaceState(history.state, '', url);
    }
  }

  document.querySelectorAll('.locale-switch button').forEach(button => {
    button.addEventListener('click', () => {
      const selected = button.dataset.lang || button.lang;
      if (!supported.has(selected)) return;
      language = selected;
      rememberLocale(language);
      syncUrl();
      render(language);
    });
  });

  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    // A cached page may predate a choice made elsewhere in this tab.
    const saved = savedLocale();
    if (supported.has(saved)) language = saved;
    syncUrl();
    render(language);
  });
  if (restoringSession) syncUrl();
  render(language);
}
