import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const vocabulary = JSON.parse(fs.readFileSync(path.join(root, 'apps/bjt-study/data/vocabulary.json'), 'utf8'));
const grammar = JSON.parse(fs.readFileSync(path.join(root, 'apps/bjt-study/data/grammar.json'), 'utf8'));
const insights = JSON.parse(fs.readFileSync(path.join(root, 'apps/bjt-study/data/vocabulary-insights.json'), 'utf8'));
const errors = [];

const expect = (condition, message) => { if (!condition) errors.push(message); };
expect(vocabulary.terms.length === 1565, `Số từ vựng: ${vocabulary.terms.length}/1565`);
expect(grammar.terms.length === 84, `Số mẫu ngữ pháp: ${grammar.terms.length}/84`);
expect(insights.termsByIndex.length === vocabulary.terms.length, 'termsByIndex không khớp vocabulary');

vocabulary.terms.forEach((entry, index) => {
  const insight = insights.termsByIndex[index];
  expect(Boolean(entry.reading), `Thiếu cách đọc: #${index} ${entry.term}`);
  expect(Boolean(entry.meaning), `Thiếu ý nghĩa: #${index} ${entry.term}`);
  expect(Boolean(insight), `Thiếu insight: #${index} ${entry.term}`);
  if (!insight) return;
  expect(insight.term === entry.term, `Lệch index insight: #${index} ${entry.term}`);
  expect(insight.traps.length >= 3, `Thiếu ba bẫy đọc: #${index} ${entry.term}`);
  expect(insight.collocations.length >= 1, `Thiếu ngữ cảnh: #${index} ${entry.term}`);
  expect(insight.synonyms.length + insight.related.length >= 1 || insight.sourceTypes.synonyms === 'related-only', `Thiếu trạng thái từ liên quan: #${index} ${entry.term}`);
});

for (const [character, detail] of Object.entries(insights.characters)) {
  expect(detail.hanviet && detail.hanviet !== '—', `Thiếu Hán Việt: ${character}`);
  expect(Boolean(detail.on), `Thiếu On: ${character}`);
  expect(Boolean(detail.kun), `Thiếu Kun: ${character}`);
  expect(Boolean(detail.meaning), `Thiếu nghĩa chữ: ${character}`);
}

grammar.terms.forEach((entry, index) => {
  for (const field of ['meaning', 'explanationVi', 'exampleJa', 'exampleVi', 'formation', 'usageNote']) {
    expect(Boolean(entry[field]), `Ngữ pháp #${index} thiếu ${field}: ${entry.term}`);
  }
  expect(Array.isArray(entry.relatedPatterns), `Ngữ pháp #${index} relatedPatterns không phải array`);
});

expect(insights.sources.some((source) => source.name === 'KANJIDIC2'), 'Thiếu ghi nguồn KANJIDIC2');
expect(insights.sources.some((source) => source.name === 'JMdict'), 'Thiếu ghi nguồn JMdict');
expect(insights.sources.some((source) => source.name.includes('WordNet')), 'Thiếu ghi nguồn Japanese WordNet');

const report = {
  vocabulary: vocabulary.terms.length,
  grammar: grammar.terms.length,
  characters: Object.keys(insights.characters).length,
  humanJudgedSynonymEntries: insights.termsByIndex.filter((entry) => entry.synonyms.length).length,
  entriesWithOriginalExamples: vocabulary.terms.filter((entry) => entry.exampleJa).length,
  errors: errors.length
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) {
  console.error(errors.slice(0, 100).join('\n'));
  process.exit(1);
}
