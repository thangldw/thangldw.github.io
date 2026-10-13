import { ArrowDown, ArrowUp } from "@phosphor-icons/react";

import { normalizeResponse } from "./engine/question-response.js";

export const CUSTOM_RESPONSE_TYPES = new Set(["numeric_input", "ordered_steps", "matching", "written_response"]);

export function QuestionResponse({ disabled = false, onChange, question, value = [] }) {
  if (question.type === "numeric_input") {
    return <label className="question-response question-response--numeric"><span>Đáp án số{question.response?.unit ? ` (${question.response.unit})` : ""}</span><input disabled={disabled} inputMode="decimal" onChange={(event) => onChange?.([event.currentTarget.value])} type="text" value={value[0] || ""} /></label>;
  }
  if (question.type === "written_response" && question.response?.subquestions?.length) {
    const response = normalizeResponse(question, value);
    return <fieldset className="question-response question-response--written question-response--case" disabled={disabled}><legend>Trả lời từng câu hỏi con theo ngôn ngữ của đề</legend>{question.response.subquestions.map(item => <label key={item.id}><strong>{item.label}</strong><span lang="ja">{item.prompt}</span><small lang="vi">{item.promptVi}</small><textarea className="resize-none" disabled={disabled} aria-label={item.label} maxLength={item.maxLength} onChange={event => onChange?.([JSON.stringify({ ...response, [item.id]: event.currentTarget.value })])} rows={item.maxLength > 5 ? 3 : 1} value={response[item.id] || ""} /><small>{Array.from(response[item.id] || "").length} / {item.maxLength} ký tự</small></label>)}</fieldset>;
  }
  if (question.type === "written_response") {
    return <label className="question-response question-response--written"><span>Câu trả lời viết</span><textarea className="resize-none" disabled={disabled} maxLength={question.response?.maxLength || 4000} onChange={(event) => onChange?.([event.currentTarget.value])} rows={7} value={value[0] || ""} /></label>;
  }
  if (question.type === "ordered_steps") {
    const options = question.response?.orderedOptions || [];
    const order = value.length === options.length ? value : options.map((option) => option.id);
    const labels = new Map(options.map((option) => [option.id, option.text]));
    const move = (index, delta) => {
      const target = index + delta;
      if (target < 0 || target >= order.length) return;
      const next = [...order];
      [next[index], next[target]] = [next[target], next[index]];
      onChange?.(next);
    };
    return <div className="question-response question-response--ordered"><span>Sắp xếp các bước</span><ol>{order.map((id, index) => <li key={id}><span>{labels.get(id) || id}</span><button className="ui-icon-button" aria-label={`Đưa ${labels.get(id) || id} lên`} disabled={disabled || index === 0} onClick={() => move(index, -1)} type="button"><ArrowUp size={17} /></button><button className="ui-icon-button" aria-label={`Đưa ${labels.get(id) || id} xuống`} disabled={disabled || index === order.length - 1} onClick={() => move(index, 1)} type="button"><ArrowDown size={17} /></button></li>)}</ol></div>;
  }
  if (question.type === "matching") {
    const pairs = normalizeResponse(question, value);
    const right = question.response?.matchingRight || [];
    return <fieldset className="question-response question-response--matching" disabled={disabled}><legend>Ghép các mục</legend>{(question.response?.matchingLeft || []).map((item) => <label key={item.id}><span>{item.text}</span><select onChange={(event) => onChange?.([JSON.stringify({ ...pairs, [item.id]: event.currentTarget.value })])} value={pairs[item.id] || ""}><option value="">Chọn mục tương ứng</option>{right.map((option) => <option key={option.id} value={option.id}>{option.text}</option>)}</select></label>)}</fieldset>;
  }
  return null;
}
