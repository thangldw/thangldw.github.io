import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const vocabularyPath = path.join(repoRoot, 'apps/bjt-study/data/vocabulary.json');
const grammarPath = path.join(repoRoot, 'apps/bjt-study/data/grammar.json');
const insightPath = path.join(repoRoot, 'apps/bjt-study/data/vocabulary-insights.json');
const appPath = path.join(repoRoot, 'apps/bjt-study/app.js');
const dataUtils = (await import(path.join(repoRoot, 'apps/bjt-study/data-utils.js'))).default;

const resources = {
  kanjidic: {
    path: path.join(os.tmpdir(), 'bjt-kanjidic2.xml.gz'),
    url: 'https://www.edrdg.org/kanjidic/kanjidic2.xml.gz'
  },
  jmdict: {
    path: path.join(os.tmpdir(), 'JMdict_e.gz'),
    url: 'https://www.edrdg.org/pub/Nihongo/JMdict_e.gz'
  },
  wordnetWords: {
    path: path.join(os.tmpdir(), 'wnjpn-ok.tab.gz'),
    url: 'https://github.com/bond-lab/wnja/releases/download/v1.1/wnjpn-ok.tab.gz'
  },
  wordnetExamples: {
    path: path.join(os.tmpdir(), 'wnjpn-exe.tab.gz'),
    url: 'https://github.com/bond-lab/wnja/releases/download/v1.1/wnjpn-exe.tab.gz'
  },
  wordnetSynonyms: {
    path: path.join(os.tmpdir(), 'wnjpn-syn.zip'),
    url: 'https://github.com/bond-lab/wnja/releases/download/v1.1/wnjpn-syn-database.1.0.zip'
  }
};

async function ensureResource(resource) {
  if (fs.existsSync(resource.path) && fs.statSync(resource.path).size > 1000) return;
  console.log(`Tải ${resource.url}`);
  const response = await fetch(resource.url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Không tải được ${resource.url}: HTTP ${response.status}`);
  fs.writeFileSync(resource.path, Buffer.from(await response.arrayBuffer()));
}

await Promise.all(Object.values(resources).map(ensureResource));

const xmlDecode = (value) => String(value || '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const stripTags = (value) => xmlDecode(String(value || '').replace(/<[^>]+>/g, ''));
const uniq = (values) => [...new Set(values.filter(Boolean))];
const normalizeTerm = (value) => String(value || '')
  .replace(/[（(][^）)]*[）)]/g, '')
  .replace(/する$/, '')
  .trim();
const kanjiOf = (value) => String(value || '').match(/[\u3400-\u9fff]/g) || [];
const kanaOnly = (value) => /^[ぁ-んァ-ヶー・]+$/.test(String(value || ''));

const READING_SUPPLEMENT = {
  '万障繰り合わせの上、ご臨席を賜りますようお願い申し上げます': 'ばんしょうくりあわせのうえ、ごりんせきをたまわりますようおねがいもうしあげます',
  '公的な': 'こうてきな', '圧倒的な': 'あっとうてきな', '一時的な': 'いちじてきな',
  '一般的な': 'いっぱんてきな', '一方的な': 'いっぽうてきな', '違法な': 'いほうな',
  '懐疑的な': 'かいぎてきな', '画期的な': 'かっきてきな', '既存の': 'きそんの',
  '期中': 'きちゅう', '基本的な': 'きほんてきな', '客観的な': 'きゃっかんてきな',
  '急速に': 'きゅうそくに', '具体的な': 'ぐたいてきな', '経済的な': 'けいざいてきな',
  '形式的な': 'けいしきてきな', '劇的な': 'げきてきな', '決定的な': 'けっていてきな',
  '現実的な': 'げんじつてきな', '現実点': 'げんじつてん', '建設的な': 'けんせつてきな',
  '効果的な': 'こうかてきな', '効率的な': 'こうりつてきな', '合理的な': 'ごうりてきな'
};

function parseKanjidic() {
  const xml = zlib.gunzipSync(fs.readFileSync(resources.kanjidic.path)).toString('utf8');
  const result = new Map();
  for (const match of xml.matchAll(/<character>([\s\S]*?)<\/character>/g)) {
    const body = match[1];
    const literal = stripTags(body.match(/<literal>(.*?)<\/literal>/)?.[1]);
    if (!literal) continue;
    const on = [...body.matchAll(/<reading r_type="ja_on">(.*?)<\/reading>/g)].map((item) => stripTags(item[1]));
    const kun = [...body.matchAll(/<reading r_type="ja_kun">(.*?)<\/reading>/g)].map((item) => stripTags(item[1]));
    const meanings = [...body.matchAll(/<meaning>(.*?)<\/meaning>/g)].map((item) => stripTags(item[1]));
    result.set(literal, { on, kun, meanings });
  }
  return result;
}

function parseJmdict() {
  const xml = zlib.gunzipSync(fs.readFileSync(resources.jmdict.path)).toString('utf8');
  const result = new Map();
  for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const body = match[1];
    const writings = [...body.matchAll(/<keb>(.*?)<\/keb>/g)].map((item) => stripTags(item[1]));
    const readings = [...body.matchAll(/<r_ele>([\s\S]*?)<\/r_ele>/g)].map((item) => {
      const readingBody = item[1];
      return {
        value: stripTags(readingBody.match(/<reb>(.*?)<\/reb>/)?.[1]),
        restricted: [...readingBody.matchAll(/<re_restr>(.*?)<\/re_restr>/g)].map((entry) => stripTags(entry[1]))
      };
    });
    const pos = [...body.matchAll(/<pos>&([^;]+);<\/pos>/g)].map((item) => item[1]);
    for (const writing of writings) {
      const reading = readings.find((item) => !item.restricted.length || item.restricted.includes(writing))?.value;
      if (!result.has(writing) && reading) result.set(writing, { reading, pos });
    }
    for (const reading of readings) {
      if (!result.has(reading.value)) result.set(reading.value, { reading: reading.value, pos });
    }
  }
  return result;
}

function parseWordnet() {
  const synsetWords = new Map();
  const wordsText = zlib.gunzipSync(fs.readFileSync(resources.wordnetWords.path)).toString('utf8');
  for (const line of wordsText.split('\n')) {
    const [synset, word] = line.split('\t');
    if (!synset || !word) continue;
    if (!synsetWords.has(synset)) synsetWords.set(synset, []);
    synsetWords.get(synset).push(word);
  }
  const wordSynsets = new Map();
  for (const [synset, words] of synsetWords) {
    for (const word of words) {
      if (!wordSynsets.has(word)) wordSynsets.set(word, []);
      wordSynsets.get(word).push(synset);
    }
  }
  const examples = new Map();
  const exampleText = zlib.gunzipSync(fs.readFileSync(resources.wordnetExamples.path)).toString('utf8');
  for (const line of exampleText.split('\n')) {
    const [synset, , , japanese] = line.split('\t');
    if (synset && japanese) {
      if (!examples.has(synset)) examples.set(synset, []);
      examples.get(synset).push(japanese);
    }
  }
  const judgedPairs = new Map();
  const pairText = execFileSync('unzip', ['-p', resources.wordnetSynonyms.path, 'wnjpn-syn-database.1.0/jwn_synonyms.ver.1.0'], { encoding: 'utf8' });
  for (const line of pairText.split('\n')) {
    const [, left, , right] = line.split('\t');
    if (!left || !right) continue;
    if (!judgedPairs.has(left)) judgedPairs.set(left, []);
    if (!judgedPairs.has(right)) judgedPairs.set(right, []);
    judgedPairs.get(left).push(right);
    judgedPairs.get(right).push(left);
  }
  return { synsetWords, wordSynsets, examples, judgedPairs };
}

// Bổ sung có kiểm duyệt cho các chữ không xuất hiện trong trường [Hán Việt]
// của dữ liệu BJT. 込 là quốc tự Nhật; dùng NHẬP như một gợi nhớ theo ngữ cảnh.
const HANVIET_SUPPLEMENT = {
  '込': 'NHẬP', '月': 'NGUYỆT', '駆': 'KHU', '召': 'TRIỆU', '団': 'ĐOÀN', '塊': 'KHỐI',
  '泣': 'KHẤP', '草': 'THẢO', '尋': 'TẦM', '並': 'TỊNH', '臨': 'LÂM', '願': 'NGUYỆN',
  '囲': 'VI', '械': 'GIỚI', '語': 'NGỮ', '赤': 'XÍCH', '以': 'DĨ', '維': 'DUY',
  '刻': 'KHẮC', '依': 'Y', '頼': 'LẠI', '鑑': 'GIÁM', '刷': 'LOÁT', '象': 'TƯỢNG',
  '輸': 'THÂU', '響': 'HƯỞNG', '延': 'DIÊN', '円': 'VIÊN', '卸': 'TẢ', '御': 'NGỰ',
  '国': 'QUỐC', '降': 'GIÁNG', '片': 'PHIẾN', '環': 'HOÀN', '関': 'QUAN', '係': 'HỆ',
  '幹': 'CÁN', '兆': 'TRIỆU', '術': 'THUẬT', '憩': 'KHẾ', '争': 'TRANH', '額': 'NGẠCH',
  '緊': 'KHẨN', '黒': 'HẮC', '系': 'HỆ', '劇': 'KỊCH', '欠': 'KHIẾM', '究': 'CỨU',
  '康': 'KHANG', '修': 'TU', '討': 'THẢO', '級': 'CẤP', '座': 'TỌA', '渉': 'THIỆP'
};

function extractLocalHanviet(vocabulary, oldInsights) {
  const candidates = new Map();
  const add = (character, value, weight) => {
    if (!character || !value) return;
    if (!candidates.has(character)) candidates.set(character, new Map());
    const scores = candidates.get(character);
    scores.set(value, (scores.get(value) || 0) + weight);
  };
  for (const [character, detail] of Object.entries(oldInsights.characters || {})) add(character, detail.hanviet, 4);
  for (const entry of vocabulary) {
    const characters = kanjiOf(entry.term);
    const bracket = String(entry.definition || '').match(/\[([^\]]+)\]/);
    const syllables = bracket ? bracket[1].trim().split(/\s+/).filter(Boolean) : [];
    if (characters.length && characters.length === syllables.length) {
      characters.forEach((character, index) => add(character, syllables[index], 2));
    }
  }
  for (const [character, value] of Object.entries(HANVIET_SUPPLEMENT)) add(character, value, 1);
  return new Map([...candidates].map(([character, scores]) => [character, [...scores].sort((a, b) => b[1] - a[1])[0][0]]));
}

function readingTraps(reading, parts) {
  const values = [];
  const add = (value, note) => {
    value = String(value || '').replace(/[.\-]/g, '');
    if (value && value !== reading && !values.some((item) => item.r === value)) values.push({ r: value, meaning: note });
  };
  if (parts.length > 1 && parts.every((part) => part.on.length)) {
    add(parts.map((part) => part.on[0].replace(/[.\-]/g, '').replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))).join(''), 'Ghép máy móc âm On của từng chữ; không phải cách đọc của từ này.');
  }
  const swaps = { 'か': 'が', 'き': 'ぎ', 'く': 'ぐ', 'け': 'げ', 'こ': 'ご', 'さ': 'ざ', 'し': 'じ', 'す': 'ず', 'せ': 'ぜ', 'そ': 'ぞ', 'た': 'だ', 'ち': 'ぢ', 'つ': 'づ', 'て': 'で', 'と': 'ど', 'は': 'ば', 'ひ': 'び', 'ふ': 'ぶ', 'へ': 'べ', 'ほ': 'ぼ', 'が': 'か', 'ぎ': 'き', 'ぐ': 'く', 'げ': 'け', 'ご': 'こ', 'ざ': 'さ', 'じ': 'し', 'ず': 'す', 'ぜ': 'せ', 'ぞ': 'そ', 'だ': 'た', 'で': 'て', 'ど': 'と', 'ば': 'は', 'び': 'ひ', 'ぶ': 'ふ', 'べ': 'へ', 'ぼ': 'ほ' };
  const chars = [...reading];
  const swapIndex = chars.findIndex((char) => swaps[char]);
  if (swapIndex >= 0) {
    const altered = chars.slice(); altered[swapIndex] = swaps[altered[swapIndex]];
    add(altered.join(''), 'Nhầm hiện tượng biến âm (dakuten).');
  }
  if (reading.includes('っ')) add(reading.replace('っ', ''), 'Bỏ mất âm ngắt っ.');
  else if (reading.length > 2) add(reading.slice(0, 1) + 'っ' + reading.slice(1), 'Thêm nhầm âm ngắt っ.');
  if (/[おこそとのほもよろごぞどぼぽ]う/.test(reading)) add(reading.replace(/う/, ''), 'Bỏ mất trường âm う.');
  else add(reading + 'う', 'Thêm nhầm trường âm う.');
  if (reading.includes('じ')) add(reading.replace('じ', 'し'), 'Nhầm âm đục じ thành し.');
  if (reading.includes('し')) add(reading.replace('し', 'じ'), 'Nhầm âm し thành じ.');
  const fallback = ['しゅう', 'しょう', 'じょう', 'こう', 'けい', 'かん'];
  for (const value of fallback) add(value, 'Cách đọc gây nhiễu; không phải cách đọc của từ này.');
  return values.slice(0, 3);
}

const normalizeVi = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
const STOP = new Set('la va cua cho mot nhung duoc trong voi den tu hay su viec nguoi khi theo nay do ra vao de co khong'.split(' '));
function viTokens(value) {
  return new Set(String(value || '').toLocaleLowerCase('vi').replace(/[^a-zà-ỹ0-9 ]/g, ' ').split(/\s+/).filter((token) => token.length > 2 && !STOP.has(normalizeVi(token))));
}

function relatedVocabulary(index, enriched) {
  const current = enriched[index];
  const tokens = viTokens(current.meaning);
  const chars = new Set(kanjiOf(current.term));
  const ranked = enriched.map((other, otherIndex) => {
    if (otherIndex === index || other.term === current.term) return null;
    let score = 0;
    for (const token of viTokens(other.meaning)) if (tokens.has(token)) score += 3;
    for (const character of kanjiOf(other.term)) if (chars.has(character)) score += 1;
    return score >= 4 ? { term: other.term, meaning: other.meaning, score } : null;
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.term.length - b.term.length);
  const seen = new Set();
  return ranked.filter((item) => {
    if (seen.has(item.term)) return false;
    seen.add(item.term);
    return true;
  }).slice(0, 3);
}

function readLiteralObject(source, name) {
  const start = source.indexOf(`var ${name} = `);
  if (start < 0) return {};
  const objectStart = source.indexOf('{', start);
  const end = source.indexOf('\n  };', objectStart);
  if (end < 0) return {};
  return vm.runInNewContext(`(${source.slice(objectStart, end + 4)})`);
}

const vocabularyFile = JSON.parse(fs.readFileSync(vocabularyPath, 'utf8'));
const grammarFile = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
const oldInsights = JSON.parse(fs.readFileSync(insightPath, 'utf8'));
const kanjidic = parseKanjidic();
const jmdict = parseJmdict();
const wordnet = parseWordnet();
const hanviet = extractLocalHanviet(vocabularyFile.terms, oldInsights);

const enrichedVocabulary = vocabularyFile.terms.map((entry) => {
  const parsed = dataUtils.parseVocabulary(entry);
  const normalized = normalizeTerm(entry.term);
  const dictionary = jmdict.get(entry.term) || jmdict.get(normalized);
  const suffixMatch = !dictionary && normalized.match(/^(.*?)(な|の|に)$/);
  const stemDictionary = suffixMatch ? jmdict.get(suffixMatch[1]) : null;
  const kanaSurface = normalized.replace(/[\s〜～]/g, '');
  const reading = parsed.reading || READING_SUPPLEMENT[entry.term] || (kanaOnly(kanaSurface) ? kanaSurface : dictionary?.reading || (stemDictionary ? stemDictionary.reading + suffixMatch[2] : ''));
  return {
    ...entry,
    reading,
    sinoVietnamese: parsed.sinoVietnamese || kanjiOf(normalized).map((character) => hanviet.get(character) || '').filter(Boolean).join(' '),
    meaning: parsed.meaning,
    exampleJa: parsed.exampleJa,
    exampleVi: parsed.exampleVi
  };
});

const relevantCharacters = {};
for (const entry of enrichedVocabulary) {
  for (const character of kanjiOf(normalizeTerm(entry.term))) {
    if (relevantCharacters[character]) continue;
    const dictionary = kanjidic.get(character) || { on: [], kun: [], meanings: [] };
    const existing = oldInsights.characters?.[character];
    const contextual = enrichedVocabulary
      .filter((item) => normalizeTerm(item.term).includes(character) && item.meaning)
      .sort((a, b) => normalizeTerm(a.term).length - normalizeTerm(b.term).length)[0];
    relevantCharacters[character] = {
      hanviet: hanviet.get(character) || '—',
      on: uniq(dictionary.on).join('・') || existing?.on || '—',
      kun: uniq(dictionary.kun).join('・') || existing?.kun || '—',
      meaning: existing?.meaning || (contextual ? `Trong ${normalizeTerm(contextual.term)}: ${contextual.meaning}` : dictionary.meanings.slice(0, 3).join(', ')),
      source: existing ? 'BJT/N1 hiện có + KANJIDIC2' : 'BJT theo ngữ cảnh + KANJIDIC2'
    };
  }
}

const termsByIndex = enrichedVocabulary.map((entry, index) => {
  const key = normalizeTerm(entry.term);
  const parts = kanjiOf(key).map((character) => ({ character, ...(kanjidic.get(character) || { on: [], kun: [] }) }));
  const synonyms = uniq(wordnet.judgedPairs.get(key) || []).slice(0, 4);
  const synsets = wordnet.wordSynsets.get(key) || [];
  const corpusExamples = uniq(synsets.flatMap((synset) => wordnet.examples.get(synset) || [])).filter((value) => value.includes(key)).slice(0, 2);
  const compounds = enrichedVocabulary
    .filter((other, otherIndex) => otherIndex !== index && other.term !== entry.term && normalizeTerm(other.term).includes(key) && key.length > 1)
    .slice(0, 2).map((other) => `${other.term} — ${other.meaning}`);
  const related = synonyms.length ? [] : relatedVocabulary(index, enrichedVocabulary);
  const collocations = uniq([entry.exampleJa && `${entry.exampleJa}${entry.exampleVi ? ` — ${entry.exampleVi}` : ''}`, ...corpusExamples, ...compounds]);
  if (!collocations.length) collocations.push(`${entry.term} — dùng trong ngữ cảnh: ${entry.meaning}`);
  const confuse = parts.length
    ? `Đọc toàn từ là ${entry.reading || 'chưa có cách đọc chuẩn trong dữ liệu nguồn'}. Hãy học theo đơn vị từ; không ghép máy móc âm On/Kun của từng chữ.`
    : `Từ viết bằng ${/[ァ-ヶー]/.test(key) ? 'Katakana' : 'Kana'}, không có chữ Hán để phân tích. Cách đọc là ${entry.reading || key}.`;
  return {
    term: entry.term,
    reading: entry.reading,
    meaning: entry.meaning,
    example: entry.exampleJa,
    confuse,
    traps: readingTraps(entry.reading || key, parts),
    collocations: collocations.slice(0, 4),
    synonyms: synonyms.map((term) => ({ term, kind: 'synonym', source: 'Japanese WordNet Synonyms Database 1.0' })),
    related: related.map((item) => ({ term: item.term, meaning: item.meaning, kind: 'related', source: 'BJT semantic match' })),
    sourceTypes: {
      reading: entry.reading ? 'BJT/JMdict' : 'unresolved',
      traps: 'generated',
      collocations: entry.exampleJa ? 'BJT example' : corpusExamples.length ? 'Japanese WordNet 1.1' : compounds.length ? 'BJT compound match' : 'generated context',
      synonyms: synonyms.length ? 'human-judged' : 'related-only'
    }
  };
});

vocabularyFile.terms = enrichedVocabulary;
vocabularyFile.count = enrichedVocabulary.length;
vocabularyFile.enrichment = {
  version: 2,
  generated_at: new Date().toISOString(),
  structured_fields: ['reading', 'sinoVietnamese', 'meaning', 'exampleJa', 'exampleVi'],
  note: 'Dữ liệu có nguồn và dữ liệu suy ra được phân biệt trong vocabulary-insights.json.'
};

const appSource = fs.readFileSync(appPath, 'utf8');
const grammarGuides = readLiteralObject(appSource, 'GRAMMAR_GUIDES');
const grammarExamples = readLiteralObject(appSource, 'GRAMMAR_EXAMPLES_JA');
const grammarStop = new Set('mau cau dien ta dung de mot duoc cho theo trong khi voi rang viec hanh dong dieu'.split(' '));
const grammarTokens = (value) => new Set(String(value || '').toLocaleLowerCase('vi').replace(/[^a-zà-ỹ0-9 ]/g, ' ').split(/\s+/).filter((token) => token.length > 2 && !grammarStop.has(normalizeVi(token))));
const GRAMMAR_RELATIONS = [
  ['ことにしている', 'ことになっている'], ['せいで', 'おかげで'], ['のみならず', 'に限らず'],
  ['ざるを得ない', 'しかない', '余儀なく'], ['かかわらず', 'ものの'],
  ['に応えて', 'に応じて'], ['について', 'に対して'], ['に沿って', 'に則って', 'に即して'],
  ['次第', 'いかん'], ['限り', 'に限って', 'に限る'], ['とともに', 'にともなって', 'につれて'],
  ['と言いつつ', 'つつある'], ['にあたり', '際'], ['なり', 'なり～なり']
];

grammarFile.terms = grammarFile.terms.map((entry, index, entries) => {
  const guide = grammarGuides[index] || [];
  const exampleJa = entry.exampleJa || guide[2] || grammarExamples[index] || '';
  let meaning = entry.meaning || String(entry.definition || '').replace(/^【意味[^】]*】/, '').trim();
  const offset = exampleJa ? meaning.indexOf(exampleJa) : -1;
  if (offset > 0) meaning = meaning.slice(0, offset).trim();
  const explanationVi = entry.explanationVi || guide[0] || 'Diễn đạt quan hệ ý nghĩa nêu trên; cần chú ý hình thức từ đứng trước và sắc thái của ngữ cảnh.';
  const currentTokens = grammarTokens(explanationVi);
  const explicitRelated = GRAMMAR_RELATIONS.find((group) => group.some((needle) => entry.term.includes(needle))) || [];
  const explicitIndexes = entries.map((other, otherIndex) => explicitRelated.some((needle) => otherIndex !== index && other.term.includes(needle)) ? other.term : '').filter(Boolean);
  const semanticRelated = entries.map((other, otherIndex) => {
    if (otherIndex === index) return null;
    const otherGuide = grammarGuides[otherIndex] || [];
    let score = 0;
    for (const token of grammarTokens(otherGuide[0] || other.definition)) if (currentTokens.has(token)) score += 1;
    return score >= 2 ? { pattern: other.term, score } : null;
  }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 3).map((item) => item.pattern);
  const relatedPatterns = uniq(explicitIndexes.length ? explicitIndexes : semanticRelated).slice(0, 3);
  return {
    ...entry,
    meaning: meaning.replace(/[Ⓜ✦■]\s*$/, '').trim(),
    explanationVi,
    exampleJa,
    exampleVi: entry.exampleVi || guide[1] || '',
    formation: entry.term,
    usageNote: /trang trọng|kinh doanh/i.test(explanationVi)
      ? 'Ưu tiên dùng trong văn viết hoặc ngữ cảnh công việc trang trọng; kiểm tra kỹ quan hệ giữa hai vế.'
      : 'Chú ý đúng dạng từ đứng trước mẫu và sắc thái của câu; không chỉ học bằng bản dịch từng chữ.',
    relatedPatterns,
    sourceTypes: { explanationVi: 'BJT editorial guide', relatedPatterns: 'generated semantic match' }
  };
});
grammarFile.count = grammarFile.terms.length;
grammarFile.enrichment = { version: 2, generated_at: new Date().toISOString(), complete: true };

const output = {
  version: 2,
  generatedAt: new Date().toISOString(),
  sources: [
    { name: 'KANJIDIC2', url: 'https://www.edrdg.org/kanjidic/kanjd2index_legacy.html', license: 'CC BY-SA 4.0', usage: 'Âm On/Kun' },
    { name: 'JMdict', url: 'https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project', license: 'CC BY-SA 4.0', usage: 'Cách đọc từ' },
    { name: 'Japanese WordNet 1.1', url: 'https://bond-lab.github.io/wnja/jpn/downloads.html', license: 'Japanese WordNet license', usage: 'Cặp đồng nghĩa đã duyệt và ví dụ' },
    { name: 'BJT source dataset', usage: 'Âm Hán Việt, nghĩa và ví dụ tiếng Việt' }
  ],
  methodology: {
    verified: 'On/Kun, cách đọc từ, cặp đồng nghĩa WordNet và dữ liệu BJT gốc',
    generated: 'Bẫy đọc, gợi ý ngữ cảnh và từ liên quan; luôn có sourceTypes ở từng mục'
  },
  characters: relevantCharacters,
  termsByIndex
};

fs.writeFileSync(vocabularyPath, `${JSON.stringify(vocabularyFile, null, 2)}\n`);
fs.writeFileSync(grammarPath, `${JSON.stringify(grammarFile, null, 2)}\n`);
fs.writeFileSync(insightPath, `${JSON.stringify(output, null, 2)}\n`);

const unresolvedReadings = enrichedVocabulary.filter((entry) => kanjiOf(entry.term).length && !entry.reading);
const unresolvedHanviet = Object.entries(relevantCharacters).filter(([, detail]) => detail.hanviet === '—');
console.log(JSON.stringify({
  vocabulary: enrichedVocabulary.length,
  vocabularyInsights: termsByIndex.length,
  characters: Object.keys(relevantCharacters).length,
  grammar: grammarFile.terms.length,
  unresolvedReadings: unresolvedReadings.map((entry) => entry.term),
  unresolvedHanviet: unresolvedHanviet.map(([character]) => character),
  humanJudgedSynonyms: termsByIndex.filter((entry) => entry.synonyms.length).length,
  originalExamples: enrichedVocabulary.filter((entry) => entry.exampleJa).length
}, null, 2));
