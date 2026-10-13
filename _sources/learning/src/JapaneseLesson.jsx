import React from 'react';
import {BookOpen,Lightbulb} from '@phosphor-icons/react';
export function AssistedText({text}){return <details className="translation"><summary>Giải thích tiếng Việt</summary><p lang="vi">{text}</p></details>}
export function JapaneseLesson(){return <>
 <p className="eyebrow">HIỂU · Ý NGHĨA TRONG NGỮ CẢNH</p>
 <h1 lang="ja" className="japanese-text">否定の範囲を読み取る</h1>
 <p className="lead">Thay đổi nhỏ trong cách phủ định làm thay đổi ý nghĩa của cả câu.</p>
 <div className="lesson-pair"><article><BookOpen size={30}/><h2 lang="ja">必ずしも〜ない</h2><p lang="ja" className="japanese-text">「いつもそうだ」「全部そうだ」とは言えない、という限定です。</p><p>Không nhất thiết / không phải lúc nào cũng vậy. Vẫn có thể có ngoại lệ.</p><strong lang="ja" className="japanese-text">便利なものが、必ずしも使いやすいとは限らない。</strong><AssistedText text="Một thứ tiện lợi chưa chắc đã dễ dùng. Câu không nói mọi thứ tiện lợi đều khó dùng."/></article>
 <article><BookOpen size={30}/><h2 lang="ja">全く〜ない</h2><p lang="ja" className="japanese-text">その文脈で、全体を否定する表現です。</p><p>Hoàn toàn không. Phủ định mạnh hơn trong ngữ cảnh đang nói.</p><strong lang="ja" className="japanese-text">この説明は、私には全く分からない。</strong><AssistedText text="Tôi hoàn toàn không hiểu lời giải thích này. Đây không chỉ là nói có phần chưa hiểu."/></article></div>
 <div className="comparison-wrap"><table><caption>So sánh phạm vi phủ định</caption><thead><tr><th>Câu</th><th>Điều gì bị phủ định?</th><th>Điều gì vẫn có thể đúng?</th></tr></thead><tbody><tr><th lang="ja" className="japanese-text">全部が正しいわけではない。</th><td>Nhận định rằng tất cả đều đúng.</td><td>Một phần vẫn có thể đúng.</td></tr><tr><th lang="ja" className="japanese-text">全部が間違っている。</th><td>Tính đúng của tất cả các mục.</td><td>Câu khẳng định tất cả đều sai.</td></tr></tbody></table></div>
 <div className="scope-note"><Lightbulb/><p><strong>Dễ nhầm:</strong> Phủ định một phần không có nghĩa tất cả đều sai. Đọc cả câu thay vì chỉ nhìn đuôi phủ định.</p></div>
 <details><summary>Ví dụ tự biên soạn trong ngữ cảnh</summary><div lang="ja" className="japanese-text"><p>毎日長い時間勉強すれば、必ずしもよく覚えられるとは限らない。短い時間でも、何を覚えたか自分で確かめることが大切だ。</p></div><AssistedText text="Học lâu mỗi ngày chưa chắc đã nhớ tốt. Dù học ngắn, tự kiểm tra mình nhớ gì vẫn quan trọng. Đây là ví dụ tự biên soạn cho bài học, không phải câu trích từ đề thi."/></details>
 <p className="muted">Ôn ngữ pháp liên cấp độ. Ví dụ và bài tập tự biên soạn, không phải câu hỏi hoặc danh mục ngữ pháp chính thức của JLPT.</p>
 </>}
