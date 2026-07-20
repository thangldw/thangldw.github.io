import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(repoRoot, 'apps/n1-kanji-analysis/index.html');
const vocabularyPath = path.join(repoRoot, 'apps/bjt-study/data/vocabulary.json');
const outputPath = path.join(repoRoot, 'apps/bjt-study/data/vocabulary-insights.json');

const normalizeTerm = (value) => String(value || '')
  .replace(/[（(][^）)]*[）)]/g, '')
  .replace(/する$/, '')
  .trim();

const source = fs.readFileSync(sourcePath, 'utf8');
const dataStart = source.indexOf('const DATA = ');
const dataEnd = source.indexOf(';\n\nlet currentRound', dataStart);
if (dataStart < 0 || dataEnd < 0) throw new Error('Không tìm thấy DATA trong n1-kanji-analysis.');

const analysisRows = JSON.parse(source.slice(dataStart + 'const DATA = '.length, dataEnd));
const bjtVocabulary = JSON.parse(fs.readFileSync(vocabularyPath, 'utf8')).terms || [];
const bjtTerms = new Set(bjtVocabulary.map((entry) => normalizeTerm(entry.term)));
const characters = {};
const terms = {};

for (const row of analysisRows) {
  for (const part of row.parts || []) {
    if (!part.kanji || characters[part.kanji]) continue;
    characters[part.kanji] = {
      hanviet: part.hanviet || '',
      on: part.on || '',
      kun: part.kun || '',
      meaning: part.meaning || ''
    };
  }

  const key = normalizeTerm(row.k);
  if (!bjtTerms.has(key) || terms[key]) continue;
  terms[key] = {
    reading: row.r || '',
    meaning: row.m || '',
    example: row.ex || '',
    confuse: row.confuse || '',
    traps: row.wrong_explained || [],
    collocations: row.collocations || [],
    synonyms: row.synonyms || []
  };
}

const relevantCharacters = {};
for (const entry of bjtVocabulary) {
  for (const character of normalizeTerm(entry.term).match(/[\u3400-\u9fff々]/g) || []) {
    if (characters[character]) relevantCharacters[character] = characters[character];
  }
}

const output = {
  generatedFrom: 'apps/n1-kanji-analysis/index.html',
  characters: relevantCharacters,
  terms
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Đã tạo ${Object.keys(relevantCharacters).length} chữ Hán và ${Object.keys(terms).length} mục phân tích đầy đủ.`);
