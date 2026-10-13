export const sources = [
  ['Multi-AZ DB instance deployments', 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html'],
  ['Working with read replicas', 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html'],
];
export const domains = [
  { title:'Secure architectures', weight:30, icon:'Shield', summary:'Identity, access, network boundaries and data protection.' },
  { title:'Resilient architectures', weight:26, icon:'Database', summary:'Availability, fault tolerance and recovery.', topics:['Multi-AZ vs read replicas','Availability','Backup','Disaster recovery'] },
  { title:'High-performing architectures', weight:24, icon:'Gauge', summary:'Compute, storage, databases and performance.' },
  { title:'Cost-optimized architectures', weight:20, icon:'Wallet', summary:'Resource choices and cost trade-offs.' },
];
export const questions = [
 {id:'availability',prompt:'A production RDS PostgreSQL DB instance must recover automatically if its Availability Zone fails. It does not need extra read capacity. Which option directly meets that goal?',choices:['Multi-AZ DB instance with one synchronous standby','A read replica used only for reporting','A larger Single-AZ DB instance'],answer:0,why:['A standby in another AZ supports automatic failover. It is not a read-scaling endpoint.','A read replica serves read traffic. This reporting-only replica does not provide the requested automatic failover.','A larger instance changes capacity but leaves the AZ failure boundary unchanged.']},
 {id:'read-scale',prompt:'A database is available, but reporting queries overload the primary. Some replication lag is acceptable. Which feature best offloads read traffic?',choices:['Send reporting queries to the single Multi-AZ standby','Use a read replica and route reporting queries to its endpoint','Run the reports against a backup snapshot'],answer:1,why:['The single standby in a Multi-AZ DB instance deployment does not serve read traffic.','Read replicas receive asynchronous updates and can serve reporting queries through a separate endpoint.','A backup supports recovery; it is not a live read-serving endpoint.']},
];
export const referenceAnswer = 'Choose a Multi-AZ DB instance deployment with a synchronous standby in a different Availability Zone for high availability and automatic failover. Choose a read replica to offload read traffic; replication is asynchronous, so lag can occur. The single standby does not serve reads. This comparison does not describe Multi-AZ DB clusters, whose reader instances have different capabilities.';

const aws = {
 id:'aws', name:'AWS SAA', title:'AWS Certified Solutions Architect — Associate',badge:'SAA-C03',
 guide:'AWS ACADEMY FIELD GUIDE',outline:'Official domain outline · one learning topic available in this prototype.',
 domains,sources,questions,referenceAnswer,language:'en',topic:'Multi-AZ DB instance vs read replicas',shortTopic:'Multi-AZ vs read replicas',
 subtitle:'High availability and read scaling.',category:'RESILIENT / DATABASE AVAILABILITY',
 takeaway:['Multi-AZ DB instance: synchronous standby and automatic failover.','Read replica: offload reads with asynchronous replication.','A single standby is not a read endpoint.'],
 prerequisite:'Database primary, read/write traffic and Availability Zones.',
 scopeRows:[['Availability','Failover boundaries','Standby ≠ read endpoint','Lesson available'],['Backup','Recovery objectives','Replica ≠ backup','Outline only'],['Disaster recovery','Regional recovery','Multi-AZ ≠ cross-Region','Outline only']],
 recallTitle:'Explain the difference.',recallPrompt:'Your database needs automatic failover. Which approach fits, and why? How would your choice change for reporting reads?',
 hint:'Separate continuity during failure from the need for more read capacity. Using this hint marks recall as assisted.',
 applyTitle:'Choose for the requirement.', scope:'One topic in Resilient architectures',
 retry:'Revisit the difference between failure recovery and read scaling, then try again.',
};
const jlpt = {
 id:'jlpt',name:'JLPT Japanese',title:'Japanese Language — JLPT preparation',badge:'Cross-level review',language:'ja',
 guide:'JAPANESE ACADEMY FIELD GUIDE',outline:'Study groups, not exam sections or weights · one original grammar / reading lesson.',
 domains:[
  {title:'Vocabulary & kanji',icon:'BookOpen',summary:'Meaning, form and usage in context.'},
  {title:'Grammar in context',icon:'Notebook',summary:'Interpret meaning, scope and speaker intention.'},
  {title:'Reading comprehension',icon:'BookmarkSimple',summary:'Claims, evidence and information in a passage.'},
  {title:'Listening',icon:'Headphones',summary:'Understand spoken meaning. Audio material is not available here.'},
 ],
 topic:'部分否定を読み取る',shortTopic:'必ずしも〜ない / 全く〜ない',subtitle:'Not always is different from never.',
 category:'GRAMMAR / READING · NEGATION SCOPE',
 takeaway:['必ずしも〜ない: a generalization does not always hold.','全く〜ない: complete negation in the stated context.','Read the whole sentence before deciding what is denied.'],
 prerequisite:'Basic negative forms, sentence context and quantifiers such as 全部・いつも.',
 scopeRows:[['Negation scope','What is denied?','Not all ≠ none','Lesson available'],['Speaker intention','Claim vs exception','Qualification ≠ rejection','Outline only'],['Sentence connections','Contrast and reason','Read beyond one keyword','Outline only']],
 recallTitle:'Recall the meaning, not just the pattern.',
 recallPrompt:'Explain the difference between 「全部が正しいわけではない」 and 「全部が間違っている」. Then write one original Japanese sentence using 必ずしも〜ない, with its intended meaning.',
 hint:'A denial of “all are correct” can leave some items correct. It does not establish that all are wrong. Using this hint marks recall as assisted.',
 referenceAnswer:'「全部が正しいわけではない」は、「全部が正しい」という見方を否定します。正しいものがある可能性は残ります。「全部が間違っている」は、すべてが間違っているという主張です。例：便利な道具が、必ずしも使いやすいとは限らない。便利さから使いやすさを一律に推測しない表現です。',
 sources:[['Japan Foundation — 必ずしも…否定','https://www.kyozai.jpf.go.jp/kyozai/material/BMA00015/ja/render.do'],['JLPT — official item types and sections','https://www.jlpt.jp/e/guideline/testsections.html']],
 applyTitle:'Read the intended meaning.',scope:'One negation-scope lesson · grammar + short reading',
 retry:'Revisit what each expression denies. Look for the scope of 全部 and the qualification 必ずしも before trying again.',
 questions:[
  {id:'jp-partial',prompt:'文の意味として最も適切なものを選んでください。\n「値段が高いものが、必ずしも使いやすいとは限らない。」',choices:['値段が高いものは、どれも使いにくい。','値段が高くても、使いやすいとは言い切れない。','使いやすいものは、必ず値段が高い。'],answer:1,why:['「必ずしも〜とは限らない」は一般化を否定します。「どれも使いにくい」という全面的な否定ではありません。','価格の高さだけでは使いやすさを保証できない、という限定です。原文の否定の範囲に合います。','原文とは推論の向きが逆です。使いやすさから価格を必然的に判断していません。'],vi:['Câu chỉ phủ định việc khái quát; không nói mọi món đắt đều khó dùng.','Giá cao chưa đảm bảo dễ dùng. Đáp án giữ đúng phạm vi phủ định.','Đáp án đảo chiều suy luận. Câu gốc không nói dễ dùng thì nhất định đắt.']},
  {id:'jp-reading',passage:'新しい学習アプリを使えば、必ずしも勉強が続くとは限らない。毎日短い時間でも、自分で思い出して使うことが大切だ。アプリは、その習慣を助ける道具として選びたい。',prompt:'筆者の考えに最も近いものを選んでください。',choices:['学習アプリを使っても、勉強は全く続かない。','新しいアプリを選ぶだけで、学習習慣が身につく。','自分で思い出して使う習慣を、アプリで支えることが大切だ。'],answer:2,why:['「必ずしも続くとは限らない」は「全く続かない」という断定ではありません。','第1文はアプリだけで継続できるという保証を否定しています。','第2文の自分で思い出して使うことと、第3文の習慣を助ける道具という考えをまとめています。'],vi:['Không đảm bảo duy trì không có nghĩa hoàn toàn không duy trì được.','Câu đầu phủ định sự đảm bảo rằng chỉ có app mới là sẽ học đều.','Đáp án kết hợp đúng hai ý: tự nhớ và dùng kiến thức; app hỗ trợ thói quen đó.']},
 ],
};
export const courses={aws,jlpt};

// Interface and study guidance target Vietnamese learners; source questions remain unchanged.
Object.assign(aws, {
 title:'AWS Solutions Architect — Associate',guide:'KHÔNG GIAN ÔN LUYỆN AWS',outline:'Phạm vi theo hạng mục kỳ thi · bản thử nghiệm có một chủ đề học.',
 subtitle:'Tính sẵn sàng và khả năng mở rộng đọc.',category:'KHẢ NĂNG PHỤC HỒI / DATABASE',
 takeaway:['Multi-AZ DB instance: standby đồng bộ và tự động failover.','Read replica: giảm tải đọc bằng sao chép bất đồng bộ.','Single standby không phải endpoint phục vụ đọc.'],
 prerequisite:'Database primary, truy vấn đọc/ghi và Availability Zone.',
 scopeRows:[['Tính sẵn sàng','Phạm vi failover','Standby ≠ endpoint đọc','Có bài học'],['Sao lưu','Mục tiêu khôi phục','Replica ≠ backup','Chỉ có đề mục'],['Khôi phục thảm họa','Khôi phục theo Region','Multi-AZ ≠ cross-Region','Chỉ có đề mục']],
 recallTitle:'Giải thích điểm khác biệt.',recallPrompt:'Database cần tự động failover. Bạn chọn cách nào, vì sao? Nếu cần giảm tải truy vấn báo cáo thì lựa chọn thay đổi thế nào?',
 hint:'Phân biệt khả năng tiếp tục hoạt động khi lỗi với nhu cầu tăng năng lực đọc. Mở gợi ý sẽ đánh dấu phần nhớ lại là có hỗ trợ.',
 applyTitle:'Chọn theo yêu cầu.',scope:'Một chủ đề thuộc hạng mục Khả năng phục hồi',retry:'Ôn lại sự khác biệt giữa khôi phục khi lỗi và mở rộng đọc, rồi thử lại.',
});
aws.domains.forEach((d,i)=>Object.assign(d,[
 {title:'Kiến trúc bảo mật',summary:'Danh tính, quyền truy cập, mạng và bảo vệ dữ liệu.'},
 {title:'Kiến trúc có khả năng phục hồi',summary:'Tính sẵn sàng, khả năng chịu lỗi và khôi phục.'},
 {title:'Kiến trúc hiệu năng cao',summary:'Compute, storage, database và hiệu năng.'},
 {title:'Kiến trúc tối ưu chi phí',summary:'Lựa chọn tài nguyên và đánh đổi về chi phí.'},
][i]));
Object.assign(jlpt, {
 name:'JLPT tiếng Nhật',title:'Tiếng Nhật — ôn luyện JLPT',badge:'Ôn liên cấp độ',guide:'KHÔNG GIAN ÔN LUYỆN TIẾNG NHẬT',outline:'Các nhóm kiến thức để học · không phải trọng số thi · một bài ngữ pháp và đọc hiểu.',
 subtitle:'Không phải lúc nào cũng vậy khác với hoàn toàn không.',category:'NGỮ PHÁP / ĐỌC HIỂU · PHẠM VI PHỦ ĐỊNH',
 takeaway:['必ずしも〜ない: một nhận định không đúng trong mọi trường hợp.','全く〜ない: phủ định hoàn toàn trong ngữ cảnh đang nói.','Đọc cả câu trước khi xác định điều gì bị phủ định.'],
 prerequisite:'Dạng phủ định cơ bản, ngữ cảnh và các từ như 全部・いつも.',
 scopeRows:[['Phạm vi phủ định','Điều gì bị phủ định?','Không phải tất cả ≠ không có gì','Có bài học'],['Ý định người nói','Khẳng định và ngoại lệ','Giới hạn ≠ bác bỏ toàn bộ','Chỉ có đề mục'],['Liên kết câu','Tương phản và lý do','Đọc vượt ra ngoài một từ khóa','Chỉ có đề mục']],
 recallTitle:'Nhớ ý nghĩa, không chỉ nhớ mẫu câu.',recallPrompt:'Giải thích sự khác biệt giữa 「全部が正しいわけではない」 và 「全部が間違っている」. Sau đó viết một câu tiếng Nhật với 必ずしも〜ない và giải thích ý bạn muốn diễn đạt.',
 hint:'Phủ định “tất cả đều đúng” vẫn cho phép một phần đúng. Không thể suy ra tất cả đều sai. Mở gợi ý sẽ đánh dấu phần nhớ lại là có hỗ trợ.',
 applyTitle:'Đọc đúng ý nghĩa muốn diễn đạt.',scope:'Một bài về phạm vi phủ định · ngữ pháp và đoạn đọc ngắn',retry:'Ôn lại phạm vi phủ định. Chú ý 全部 và ý giới hạn của 必ずしも trước khi thử lại.',
});
jlpt.domains.forEach((d,i)=>Object.assign(d,[
 {title:'Từ vựng & kanji',summary:'Ý nghĩa, hình thức và cách dùng trong ngữ cảnh.'},
 {title:'Ngữ pháp trong ngữ cảnh',summary:'Đọc ý nghĩa, phạm vi và ý định người nói.'},
 {title:'Đọc hiểu',summary:'Luận điểm, dẫn chứng và thông tin trong đoạn văn.'},
 {title:'Nghe hiểu',summary:'Hiểu thông tin nghe. Bản thử nghiệm chưa có audio.'},
][i]));
aws.sources[0][0]='AWS — triển khai Multi-AZ DB instance';aws.sources[1][0]='AWS — sử dụng read replica';
jlpt.sources[0][0]='Japan Foundation — phủ định với 必ずしも';jlpt.sources[1][0]='JLPT — cấu trúc và dạng câu hỏi chính thức';
aws.referenceAnswer='Dùng Multi-AZ DB instance với standby đồng bộ ở AZ khác khi cần tính sẵn sàng và tự động failover. Dùng read replica để giảm tải đọc; sao chép bất đồng bộ có thể tạo độ trễ dữ liệu. Single standby không phục vụ đọc. Bài này không mô tả Multi-AZ DB cluster có reader instance.';
