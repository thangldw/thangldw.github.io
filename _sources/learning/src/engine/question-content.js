function speechLanguage(certId, locale) {
  if (certId === "toeic" || String(locale).startsWith("en")) return "en-US";
  if (String(locale).startsWith("zh")) return "zh-CN";
  return "ja-JP";
}

function passageText(question = {}) {
  return question.passage || question.content?.passage || "";
}

export function questionPassageIdentity(question = {}) {
  const passage = passageText(question);
  if (typeof passage !== "string" || passage.length === 0) return null;
  if (typeof question.caseId === "string" && question.caseId.length > 0) return `case:${question.caseId}`;
  return `passage:${passage}`;
}

export function transitionPassageScroll(element, previousIdentity, nextIdentity, positions) {
  if (!element || !(positions instanceof Map) || previousIdentity === nextIdentity) return;
  if (previousIdentity) positions.set(previousIdentity, element.scrollTop);
  element.scrollTop = nextIdentity && positions.has(nextIdentity) ? positions.get(nextIdentity) : 0;
}

function cells(line) {
  return line
    .trim()
    .replace(/^\||\|$/gu, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line) {
  const values = cells(line);
  return values.length > 1 && values.every((cell) => /^:?-{3,}:?$/u.test(cell));
}

function paragraphBlock(lines) {
  const text = lines.join("\n").trim();
  const hasMath = /\$[^$]+\$|\\\(|\\\[|\\begin\{|√|[σμρΣχ]|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]|[₀-₉ₓₐ-ₜ]|[≤≥≦≧≠±×÷]/u.test(text);
  return text ? { type: "paragraph", text, hasMath } : null;
}

export function parseRichBlocks(value) {
  const lines = String(value || "").replace(/\r\n?/gu, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  const flushParagraph = () => {
    const block = paragraphBlock(paragraph);
    if (block) blocks.push(block);
    paragraph = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.includes("|") && isTableSeparator(lines[index + 1] || "")) {
      flushParagraph();
      const headers = cells(line);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(cells(lines[index]));
        index += 1;
      }
      index -= 1;
      blocks.push({ type: "table", headers, rows });
    } else if (!line.trim()) {
      flushParagraph();
    } else {
      paragraph.push(line);
    }
  }
  flushParagraph();
  return blocks;
}

export function buildQuestionContentModel(
  question = {},
  cert = {},
  { assistancePolicy = null } = {},
) {
  const transcriptAllowed = assistancePolicy?.transcript !== false;
  const synthesisAllowed = assistancePolicy?.synthesis !== false;
  const rawAudioText = question.audioText || question.media?.audioText || question.media?.transcript || "";
  const audioUrl = (question.audioUrl || question.media?.audioUrl || "").replace(/^\/apps\/cert\//, "/assets/learning/");
  const imageUrl = (question.imageUrl || question.media?.imageUrl || "").replace(/^\/apps\/cert\//, "/assets/learning/");
  const imageAlt = question.imageAlt || question.media?.imageAlt || "Question reference";
  const locale = question.locale || cert.contentLocale || "ja";
  const certId = cert.certId || cert.id;
  const sourceAudioModel = audioUrl ? {
    kind: "source",
    label: "Play source audio",
    src: audioUrl,
    text: transcriptAllowed ? rawAudioText : "",
    language: speechLanguage(certId, locale),
  } : null;
  const fallbackAudioModel = !sourceAudioModel && synthesisAllowed && transcriptAllowed && rawAudioText ? {
    kind: "synthesized",
    label: "Play synthesized transcript",
    src: "",
    text: transcriptAllowed ? rawAudioText : "",
    language: speechLanguage(certId, locale),
  } : null;
  return {
    audio: sourceAudioModel || fallbackAudioModel,
    transcript: null,
    image: imageUrl ? { src: imageUrl, alt: imageAlt } : null,
    blocks: parseRichBlocks(passageText(question)),
    translatedBlocks: parseRichBlocks(
      question.vietnamese?.passage || question.translations?.vi?.passage || "",
    ),
    passageIdentity: questionPassageIdentity(question),
    locale,
  };
}
