import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const vocabulary = require('../apps/bjt-study/data/vocabulary.json').terms;
const utils = require('../apps/bjt-study/data-utils.js');

assert.equal(vocabulary.length, 1565, 'Kho từ vựng phải có đủ 1.565 mục');

const parsed = vocabulary.map((entry) => ({ entry, details: utils.parseVocabulary(entry) }));
const byTerm = (term) => parsed.find((item) => item.entry.term === term)?.details;

assert.deepEqual(byTerm('ごねる'), {
  reading: 'ごねる',
  sinoVietnamese: '',
  meaning: 'Làm khó, gây khó dễ',
  exampleJa: '取引先にごねられて、結局、譲歩してしまった',
  exampleVi: 'Bị khách hàng gây khó dễ, cuối cùng thì cũng đã phải nhượng bộ.'
});

assert.deepEqual(byTerm('苦情'), {
  reading: 'くじょう',
  sinoVietnamese: 'KHỔ TÌNH',
  meaning: 'Than phiền (クレーム = 文句)',
  exampleJa: '常に苦情を言う人',
  exampleVi: 'Người hay càu nhàu'
});

assert.equal(byTerm('対').exampleJa, '', 'Không được nhầm dấu : trong tỉ số 3:2 là dấu tách ví dụ');
assert.equal(byTerm('稼働').exampleJa, '24時間稼働', 'Ví dụ bắt đầu bằng số phải được giữ nguyên');
assert.equal(byTerm('軸').exampleJa, 'x軸、y軸', 'Ví dụ bắt đầu bằng ký tự Latin phải được giữ nguyên');

const missedCandidates = [];
for (const { entry, details } of parsed) {
  const raw = String(entry.definition || '').replace(/\s+/g, ' ').trim();
  const colon = utils.findLastTopLevelColon(raw);
  const beforeColon = colon > 0 ? raw.slice(0, colon).trim() : raw;
  const candidate = utils.findJapaneseExampleStart(beforeColon);
  const suffix = candidate > 0 ? beforeColon.slice(candidate) : '';
  const japaneseCount = Array.from(suffix).filter((character) => /[一-龯々〆ヵヶぁ-んァ-ヶー]/.test(character)).length;
  if (candidate > 0 && japaneseCount >= 2 && !details.exampleJa) missedCandidates.push(entry.term);
}

assert.deepEqual(missedCandidates, [], `Còn ví dụ tiếng Nhật bị dính vào ý nghĩa: ${missedCandidates.join(', ')}`);

const emptyMeanings = parsed.filter(({ details }) => !details.meaning.trim()).map(({ entry }) => entry.term);
assert.deepEqual(emptyMeanings, [], `Còn mục thiếu ý nghĩa: ${emptyMeanings.join(', ')}`);

const exampleCount = parsed.filter(({ details }) => details.exampleJa).length;
const translatedExampleCount = parsed.filter(({ details }) => details.exampleJa && details.exampleVi).length;

console.log(`BJT vocabulary audit passed: ${vocabulary.length} entries, ${exampleCount} separated examples, ${translatedExampleCount} translated examples.`);
