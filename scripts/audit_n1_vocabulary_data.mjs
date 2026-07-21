import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';

const EXPECTED_COUNT = 648;
const EXPECTED_CONTENT_HASH = '30dad99e8fa344fe253ece9455d85d27948e906d6a24aedefc9bedc2f404c248';
const dataUrl = new URL('../apps/n1-vocabulary-exams/data.js', import.meta.url);
const source = fs.readFileSync(dataUrl, 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(source.replace('const V=', 'V='), context);

const entries = context.V;
const errors = [];
if (!Array.isArray(entries) || entries.length !== EXPECTED_COUNT) {
  errors.push(`Expected ${EXPECTED_COUNT} entries, found ${entries?.length ?? 'invalid data'}.`);
}

for (const [index, entry] of entries.entries()) {
  const label = `#${index} ${entry.k || '(missing headword)'}`;
  if (!String(entry.k || '').trim()) errors.push(`${label}: missing headword.`);
  if (!String(entry.vi || '').trim()) errors.push(`${label}: missing Vietnamese meaning.`);
  if (!Array.isArray(entry.ops) || entry.ops.length < 2) errors.push(`${label}: invalid answer options.`);
  if (!Number.isInteger(entry.a) || entry.a < 0 || entry.a >= (entry.ops?.length || 0)) {
    errors.push(`${label}: answer index is out of range.`);
  }
  if (/�|Ã.|â€|ï¿½/.test(JSON.stringify(entry))) errors.push(`${label}: possible mojibake.`);
}

const contentOnly = entries.map(({ vi, ...entry }) => entry);
const contentHash = crypto.createHash('sha256').update(JSON.stringify(contentOnly)).digest('hex');
if (contentHash !== EXPECTED_CONTENT_HASH) {
  errors.push('Question, option, answer, or metadata content changed outside the Vietnamese meaning field.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Vocabulary data OK: ${entries.length}/${EXPECTED_COUNT} entries have Vietnamese meanings.`);
console.log(`Non-Vietnamese content hash: ${contentHash}`);
