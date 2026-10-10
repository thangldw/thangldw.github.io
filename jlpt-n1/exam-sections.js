// Official N1 language-knowledge/reading sections; existing skill IDs remain authoritative.
const sections = [
  ['kanji-reading','漢字読み','Đọc Kanji'],
  ['vocabulary-context','文脈規定','Từ vựng trong ngữ cảnh'],
  ['vocabulary-paraphrase','言い換え類義','Diễn đạt tương đương'],
  ['vocabulary-usage','用法','Cách dùng từ'],
  ['grammar-choice','文の文法１','Chọn mẫu ngữ pháp'],
  ['grammar-order','文の文法２','Sắp xếp câu'],
  ['grammar-text','文章の文法','Ngữ pháp văn bản'],
  ['reading-short','内容理解（短文）','Đọc đoạn ngắn'],
  ['reading-medium','内容理解（中文）','Đọc đoạn vừa'],
  ['reading-long','内容理解（長文）','Đọc đoạn dài'],
  ['reading-integrated','統合理解','Đối chiếu văn bản'],
  ['reading-thematic','主張理解（長文）','Quan điểm tác giả'],
  ['reading-information','情報検索','Tra cứu thông tin'],
];
export function examSection(id) {
  const index = sections.findIndex(row => row[0] === id);
  return index < 0 ? null : {number:index+1,japanese:sections[index][1],label:sections[index][2],group:index<4?'Từ vựng':index<7?'Ngữ pháp':'Đọc hiểu'};
}
export function practiceTitle(skill) {
  const section=examSection(skill.id);
  return section ? `問題 ${section.number} · ${section.japanese} — ${section.label}` : skill.title;
}
