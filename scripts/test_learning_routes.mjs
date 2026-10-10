import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('assets/learning/certifications-manifest.json', root), 'utf8'));
const script = await readFile(new URL('js/learning-route-redirect.js', root), 'utf8');
assert.equal(manifest.certificationCount, 23);
await assert.rejects(access(new URL('cert/', root)));
for (const entry of manifest.certifications) {
  assert.match(entry.href, /^\/[a-z0-9-]+\/$/);
  await access(new URL(`${entry.href.slice(1)}index.html`, root));
  for (const prefix of ['/cert/', '/apps/cert/']) {
    let redirected;
    vm.runInNewContext(script, {URL, URLSearchParams, location:{origin:'https://thangldw.github.io', pathname:`${prefix}${entry.slug}/index.html`,search:'?view=practice&module=example', hash:'#saved', replace: value=>redirected=value}});
    assert.equal(redirected, `${entry.href}?view=practice&module=example#saved`);
  }
}
let unknown;
vm.runInNewContext(script, {URL,URLSearchParams,location:{pathname:'/cert/not-a-real-test/',origin:'https://thangldw.github.io',search:'?target=https://example.com',hash:'',replace:value=>unknown=value}});
assert.equal(unknown, undefined);
console.log('Passed all 23 root destinations, 46 legacy deep links with query/hash, unknown-route refusal, and /cert removal.');
