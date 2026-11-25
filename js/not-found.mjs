// 404 page: shows the path that was requested and the closest real page. Output goes through textContent.
export const routes = [
  ['/', 'Home'],
  ['/apps/', 'Apps'],
  ['/community/', 'Open-source contributions'],
  ['/japan-pr-guide/', 'Japan PR Guide'],
  ['/ragops/', 'RAGOps'],
  ['/proofline/', 'Proofline'],
  ['/awesome-maintainer-defense/', 'Maintainer Defense Kit'],
];

const slug = path => path.toLowerCase().replace(/index\.html$/, '').replace(/^\/+|\/+$/g, '');

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}

// The nearest route to a mistyped path, or null when nothing is close enough to suggest.
export function closest(path) {
  const wanted = slug(path).split('/')[0];
  if (!wanted) return null;
  let best = null;
  for (const [route] of routes.slice(1)) {
    const name = slug(route);
    const score = name.startsWith(wanted) || wanted.startsWith(name) ? 0 : distance(wanted, name);
    if (score <= Math.max(2, Math.floor(name.length / 4)) && (!best || score < best.score)) best = { route, score };
  }
  return best?.route ?? null;
}

function line(parent, className, ...parts) {
  const row = document.createElement('p');
  row.className = className;
  for (const part of parts) row.append(part);
  parent.append(row);
  return row;
}

function render(root, path) {
  const shown = path.length > 60 ? `${path.slice(0, 57)}...` : path;
  const prompt = text => Object.assign(document.createElement('span'), { className: 'nf-prompt', textContent: text });
  const out = root.querySelector('[data-nf-output]');
  out.replaceChildren();
  line(out, 'nf-line', prompt('t:>'), ` open ${shown}`);
  line(out, 'nf-line nf-error', 'error: no page at that address');
  const near = closest(path);
  if (near) {
    const link = Object.assign(document.createElement('a'), { href: near, textContent: near });
    line(out, 'nf-line nf-hint', 'did you mean ', link, '?');
  }
  line(out, 'nf-line', prompt('t:>'), ' ls');
  const list = document.createElement('ul');
  list.className = 'nf-routes';
  for (const [route, title] of routes) {
    const item = document.createElement('li');
    const link = Object.assign(document.createElement('a'), { href: route, textContent: route });
    item.append(link, Object.assign(document.createElement('span'), { textContent: title }));
    list.append(item);
  }
  out.append(list);
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('[data-not-found]');
  if (root) render(root, decodeURIComponent(location.pathname));
}
