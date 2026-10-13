// Reuse the canonical JLPT compiler's explicit target extraction from translated prompts.
// Never use an answer, explanation or hint to determine what the question tests.
export function questionUnderlineTarget(question) {
  if (!String(question?.prompt || '').includes('下線語')) return null;
  const translatedPrompt = question.vietnamese?.question || question.vietnamese?.prompt || '';
  const target = translatedPrompt.match(/^Cách đọc của từ (.+?) trong câu là gì[?？]$/u)?.[1];
  if (!target) return null;
  const start = question.prompt.indexOf(target);
  if (start < 0 || question.prompt.indexOf(target, start + target.length) >= 0) return null;
  return target;
}
