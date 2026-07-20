(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BJTDataUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var OPENING = { '(': ')', '（': '）', '[': ']', '【': '】', '〈': '〉', '「': '」', '『': '』' };
  var CLOSING = Object.keys(OPENING).reduce(function (result, key) {
    result[OPENING[key]] = key;
    return result;
  }, {});

  function isJapaneseCharacter(character) {
    return /[一-龯々〆ヵヶぁ-んァ-ヶー]/.test(character);
  }

  function hasJapanese(value) {
    return Array.from(value || '').some(isJapaneseCharacter);
  }

  function findLastTopLevelColon(value) {
    var stack = [];
    var result = -1;
    Array.from(value).forEach(function (character, index) {
      if (OPENING[character]) stack.push(character);
      else if (CLOSING[character] && stack[stack.length - 1] === CLOSING[character]) stack.pop();
      else if ((character === ':' || character === '：') && stack.length === 0) result = index;
    });
    return result;
  }

  function findJapaneseExampleStart(value) {
    var stack = [];
    var japaneseStart = -1;
    var seenVietnameseText = false;

    for (var index = 0; index < value.length; index += 1) {
      var character = value[index];
      if (OPENING[character]) {
        stack.push(character);
        continue;
      }
      if (CLOSING[character]) {
        if (stack[stack.length - 1] === CLOSING[character]) stack.pop();
        continue;
      }
      if (stack.length > 0) continue;
      if (/[A-Za-zÀ-ỹ]/.test(character)) seenVietnameseText = true;
      if (seenVietnameseText && isJapaneseCharacter(character)) {
        japaneseStart = index;
        break;
      }
    }

    if (japaneseStart < 1) return -1;

    // Preserve common prefixes that belong to the Japanese example, such as
    // 24時間, SNSに投稿する, x軸 and y軸.
    var prefix = value.slice(0, japaneseStart);
    var tokenMatch = prefix.match(/(?:[A-Z]{2,}|[0-9０-９]+|[xXyYeE])$/);
    if (tokenMatch) japaneseStart -= tokenMatch[0].length;

    var meaning = value.slice(0, japaneseStart).trim();
    var example = value.slice(japaneseStart).trim();
    if (!meaning || !hasJapanese(example) || !/[A-Za-zÀ-ỹ]/.test(meaning)) return -1;
    return japaneseStart;
  }

  function splitExampleTranslation(value) {
    var match = String(value || '').match(/^(.+?[。.!?！？])\s*([A-ZÀ-Ỹ][A-Za-zÀ-ỹ].+)$/);
    if (!match || !hasJapanese(match[1])) return { japanese: String(value || '').trim(), vietnamese: '' };
    return { japanese: match[1].trim(), vietnamese: match[2].trim() };
  }

  function parseVocabulary(entry) {
    entry = entry || {};
    var raw = String(entry.definition || '').replace(/\s+/g, ' ').trim();
    var bracketReading = raw.match(/^([^\[]+?)\s*\[([^\]]+)\]/);
    var plainReading = !bracketReading && raw.match(/^([ぁ-んァ-ヶー・]{2,})(?:\s+|(?=[「【A-Za-zÀ-ỹ0-9０-９]))/);
    var reading = entry.reading || (bracketReading ? bracketReading[1].trim() : plainReading ? plainReading[1].trim() : '');
    var sinoVietnamese = entry.sinoVietnamese || (bracketReading ? bracketReading[2].trim() : '');
    var consumed = bracketReading ? bracketReading[0].length : plainReading ? plainReading[0].length : 0;
    var remainder = raw.slice(consumed).trim();
    var meaning = entry.meaning || remainder;
    var exampleJa = entry.exampleJa || '';
    var exampleVi = entry.exampleVi || '';

    if (!entry.meaning || !exampleJa || !exampleVi) {
      var colon = findLastTopLevelColon(remainder);
      if (colon > 0) {
        var beforeColon = remainder.slice(0, colon).trim();
        var exampleStart = findJapaneseExampleStart(beforeColon);
        if (exampleStart > 0) {
          if (!entry.meaning) meaning = beforeColon.slice(0, exampleStart).trim();
          if (!exampleJa) exampleJa = beforeColon.slice(exampleStart).trim();
          if (!exampleVi) exampleVi = remainder.slice(colon + 1).trim();
        }
      } else {
        var suffixStart = findJapaneseExampleStart(remainder);
        var suffix = suffixStart > 0 ? remainder.slice(suffixStart).trim() : '';
        var japaneseCount = Array.from(suffix).filter(isJapaneseCharacter).length;
        if (suffixStart > 0 && japaneseCount >= 2) {
          var split = splitExampleTranslation(suffix);
          if (!entry.meaning) meaning = remainder.slice(0, suffixStart).trim();
          if (!exampleJa) exampleJa = split.japanese;
          if (!exampleVi) exampleVi = split.vietnamese;
        }
      }
    }

    return {
      reading: reading,
      sinoVietnamese: sinoVietnamese,
      meaning: meaning,
      exampleJa: exampleJa,
      exampleVi: exampleVi
    };
  }

  return {
    findLastTopLevelColon: findLastTopLevelColon,
    findJapaneseExampleStart: findJapaneseExampleStart,
    splitExampleTranslation: splitExampleTranslation,
    parseVocabulary: parseVocabulary
  };
});
