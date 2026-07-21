(function () {
  'use strict';

  var STORAGE_KEY = 'bjt-study-progress-v1';
  var appView = document.getElementById('appView');
  var loadingState = document.getElementById('loadingState');
  var toast = document.getElementById('toast');
  var datasets = { vocabulary: [], grammar: [] };
  var vocabularyInsights = { characters: {}, terms: {}, termsByIndex: [] };
  var itemsById = new Map();
  var currentView = 'path';
  var currentSession = null;
  var selectedAnswer = -1;
  var answered = false;
  var libraryQuery = '';
  var libraryCategory = 'all';
  var expandedVocabularyId = '';
  var libraryLimit = 40;
  var toastTimer = null;
  var subjectTabs = { vocabulary: 'knowledge', grammar: 'knowledge' };
  var practiceSize = 10;
  var practiceScope = 'mixed';
  var practiceSeconds = 30;
  var practiceTimer = null;

  var progress = emptyProgress();

  var MODULES = [
    { level: 'Giai đoạn 1', phase: 'Nền tảng', jp: '社内の基本', title: 'Giao tiếp nội bộ', subtitle: 'Chào hỏi, vai trò và quy trình công sở' },
    { level: 'Giai đoạn 1', phase: 'Nền tảng', jp: '電話応対', title: 'Điện thoại', subtitle: 'Tiếp nhận, chuyển máy và xác nhận' },
    { level: 'Giai đoạn 1', phase: 'Nền tảng', jp: 'メール', title: 'Email công việc', subtitle: 'Cấu trúc, kính ngữ và phản hồi' },
    { level: 'Giai đoạn 2', phase: 'Thực hành', jp: '会議', title: 'Họp và thảo luận', subtitle: 'Ý kiến, đồng thuận và biên bản' },
    { level: 'Giai đoạn 2', phase: 'Thực hành', jp: '報告・連絡・相談', title: 'Báo cáo và trao đổi', subtitle: 'Tiến độ, vấn đề và đề xuất' },
    { level: 'Giai đoạn 2', phase: 'Thực hành', jp: '顧客対応', title: 'Khách hàng', subtitle: 'Tiếp đón, khiếu nại và theo dõi' },
    { level: 'Giai đoạn 3', phase: 'Chuyên sâu', jp: '交渉', title: 'Đàm phán', subtitle: 'Điều kiện, thuyết phục và thỏa thuận' },
    { level: 'Giai đoạn 3', phase: 'Chuyên sâu', jp: '経営・契約', title: 'Quản trị và hợp đồng', subtitle: 'Chiến lược, pháp lý và tài chính' },
    { level: 'Giai đoạn 3', phase: 'Chuyên sâu', jp: '総合演習', title: 'Tổng hợp BJT', subtitle: 'Từ vựng và ngữ pháp trong ngữ cảnh' }
  ];

  var VOCAB_CATEGORIES = [
    { id: 'communication', label: 'Giao tiếp', jp: 'コミュニケーション', keywords: ['giao tiep', 'trao doi', 'noi chuyen', 'tro chuyen', 'phat bieu', 'trinh bay', 'tra loi', 'lien lac', 'dien thoai', 'email', 'thu tu', 'xin loi', 'cam on', 'chao hoi', 'thong bao', 'truyen dat', 'thuyet phuc', 'dam phan', 'than phien', 'kien nghi', 'thinh cau', 'khien trach', 'chi trich', 'thuc giuc', 'noi', 'hoi', 'reply', 'announce'] },
    { id: 'organization', label: 'Tổ chức & nhân sự', jp: '組織・人事', keywords: ['cong ty', 'doanh nghiep', 'to chuc', 'nhan vien', 'nhan su', 'cap tren', 'cap duoi', 'dong nghiep', 'tuyen dung', 'phong ban', 'chuc vu', 'giam doc', 'quan ly', 'nghi viec', 'thang chuc', 'chuyen cong tac', 'dai ngo', 'so yeu ly lich', 'cong doan', 'nghiep doan', 'tuoi ve huu', 'uy thac', 'thue ngoai', 'giao pho', 'nhan', 'staff', 'career', 'recruit', 'outsource', 'layoff'] },
    { id: 'meeting', label: 'Họp & báo cáo', jp: '会議・報告', keywords: ['cuoc hop', 'hoi nghi', 'bao cao', 'bien ban', 'tai lieu', 'ke hoach', 'du an', 'tien do', 'de xuat', 'quyet dinh', 'phe duyet', 'nghi quyet', 'thao luan', 'ket luan', 'project', 'draft'] },
    { id: 'finance', label: 'Tài chính', jp: '財務', keywords: ['tien te', 'gia ca', 'chi phi', 'doanh thu', 'loi nhuan', 'thua lo', 'ngan sach', 'thue', 'hoa don', 'thanh toan', 'tai chinh', 'ke toan', 'dau tu', 'co phieu', 'lai suat', 'dong yen', 'von', 'thu nhap', 'khoan no', 'tien luong', 'luong huu', 'tien thuong', 'tien lai', 'loi tuc', 'tai san', 'hoan tien', 'tien hoa hong', 'so du', 'cost', 'earnings', 'liabilities', 'salary', 'asset', 'deficit', 'surplus'] },
    { id: 'legal', label: 'Hợp đồng & pháp lý', jp: '契約・法務', keywords: ['hop dong', 'ky ket', 'dieu khoan', 'phap luat', 'luat', 'vi pham', 'quy dinh', 'nghia vu', 'quyen loi', 'kien cao', 'khieu nai', 'boi thuong', 'bao hiem'] },
    { id: 'customer', label: 'Khách hàng & dịch vụ', jp: '顧客・サービス', keywords: ['khach hang', 'khach', 'dich vu', 'tiep don', 'cua hang', 'ban hang', 'mua hang', 'don hang', 'phan nan', 'thuong hieu', 'customer', 'client'] },
    { id: 'production', label: 'Sản xuất & logistics', jp: '生産・物流', keywords: ['san xuat', 'nha may', 'hang hoa', 'san pham', 'nguyen lieu', 'van chuyen', 'giao hang', 'kho hang', 'dong goi', 'xuat hang', 'nhap hang', 'chat luong', 'may moc', 'san luong', 'hau can', 'trong tai', 'cho vao', 'cho ra', 'xep hang', 'boc do', 'gui hang', 'phi ship', 'logistics', 'package', 'supply'] },
    { id: 'technology', label: 'Công nghệ & dữ liệu', jp: '技術・データ', keywords: ['du lieu', 'he thong', 'phan mem', 'may tinh', 'internet', 'website', 'thong tin', 'ky thuat', 'thiet bi', 'dien tu', 'mang luoi', 'tep tin', 'cong nghe', 'truy cap', 'mang', 'phien ban', 'ao', 'bo dem', 'chuc nang', 'ky su', 'high tech', 'file', 'access', 'network', 'version', 'virtual', 'technology', 'engineer'] },
    { id: 'time', label: 'Thời gian & số lượng', jp: '時間・数量', keywords: ['thoi gian', 'ngay', 'thang', 'nam', 'thoi han', 'ky han', 'lich trinh', 'gio', 'so luong', 'muc do', 'ti le', 'phan tram', 'khoang', 'lan'] },
    { id: 'evaluation', label: 'Đánh giá & kiểm tra', jp: '評価・確認', keywords: ['danh gia', 'kiem tra', 'xem xet', 'xac nhan', 'nhan dinh', 'khao sat', 'dieu tra', 'phan tich', 'so sanh', 'phe binh', 'tham dinh', 'do luong', 'kiem', 'audit', 'survey'] },
    { id: 'change', label: 'Thay đổi & xử lý', jp: '変化・対応', keywords: ['thay doi', 'bien doi', 'dieu chinh', 'cai thien', 'xu ly', 'thuc hien', 'tien hanh', 'hoan thanh', 'duy tri', 'tiep tuc', 'tang len', 'giam xuong', 'them vao', 'loai bo', 'huy bo', 'khoi phuc', 'sap xep', 'bat dau', 'ket thuc', 'mo rong', 'tang', 'giam', 'chuyen', 'start', 'expand', 'reduce', 'transfer', 'launch'] },
    { id: 'risk', label: 'Vấn đề & rủi ro', jp: '問題・リスク', keywords: ['van de', 'rui ro', 'nguy hiem', 'kho khan', 'ton that', 'thiet hai', 'anh huong', 'thieu hut', 'sai sot', 'loi lam', 'khung hoang', 'tai nan', 'tro ngai', 'bat loi', 'hu hong', 'collapse', 'risk'] },
    { id: 'relationship', label: 'Quan hệ & thái độ', jp: '関係・態度', keywords: ['thai do', 'quan he', 'hop tac', 'giup do', 'ho tro', 'tin tuong', 'phan doi', 'dong y', 'nhuong bo', 'tu choi', 'thien chi', 'than thien', 'trach nhiem', 'ton trong'] },
    { id: 'sales', label: 'Kinh doanh & marketing', jp: '営業・マーケティング', keywords: ['kinh doanh', 'thuong mai', 'thi truong', 'marketing', 'quang cao', 'tiep thi', 'khuyen mai', 'xuc tien', 'ban le', 'ban buon', 'chi nhanh', 'cua hang', 'thuong vu', 'phan phoi', 'thi phan', 'nhu cau', 'chien luoc kinh doanh', 'nghien cuu thi truong', 'chao hang', 'dai ly', 'catalogue', 'catalog', 'canh tranh', 'mua vao', 'viec mua', 'purchase'] },
    { id: 'operations', label: 'Vận hành & nghiệp vụ', jp: '運営・業務', keywords: ['van hanh', 'hoat dong', 'nghiep vu', 'thu tuc', 'quy trinh', 'cong suat', 'tien hanh', 'thao tac', 'bo tri', 'sap xep cong viec', 'xu ly cong viec', 'cong viec hang ngay', 'ca lam', 'truc ca', 'tien do cong viec', 'hieu suat', 'nang suat', 'ket qua cong viec'] },
    { id: 'documents', label: 'Giấy tờ & hành chính', jp: '書類・事務', keywords: ['giay to', 'ho so', 'van ban', 'con dau', 'dong dau', 'chu ky', 'ky ten', 'danh ba', 'danh sach ten', 'bieu mau', 'ban ke', 'ban tuong trinh', 'bien lai', 'phieu', 'chung tu', 'giay phep', 'giay chung nhan', 'so sach', 'tai lieu kem theo', 'ban sao', 'ban goc', 'muc luc', 'danh muc', 'sach huong dan', 'so yeu ly lich', 'cv', 'resume', 'index', 'list'] },
    { id: 'health', label: 'Sức khỏe & an toàn', jp: '健康・安全', keywords: ['suc khoe', 'benh', 'bi om', 'kham benh', 'kham suc khoe', 'dieu tri', 'thuoc', 'binh phuc', 'chan thuong', 'vet thuong', 'dau nhuc', 'sung', 'cap cuu', 'benh vien', 'bao ho', 'an toan', 'phong chay', 'hoa hoan', 'chay no', 've sinh'] },
    { id: 'facilities', label: 'Địa điểm & di chuyển', jp: '場所・移動', keywords: ['dia diem', 'noi chon', 'toa nha', 'van phong', 'phong hop', 'cong truong', 'cong trinh', 'co so', 'mat bang', 'thiet bi', 'may moc', 'kho bai', 'nha kho', 'nha may', 'chi nhanh', 'quay', 'san bay', 'nha ga', 'bai do xe', 'chuyen xe', 'di chuyen', 'qua giang', 'du lich', 'tour', 'resort', 'ghe qua', 'di don', 'don tiep', 'trong nuoc'] },
    { id: 'events', label: 'Sự kiện & tiếp đón', jp: '行事・接待', keywords: ['su kien', 'buoi le', 'nghi le', 'tiec', 'tiep dai', 'tiep don', 'chao mung', 'tham du', 'hien dien', 'khai mac', 'be mac', 'chuc mung', 'can ly', 'uong', 'an uong', 'hoi cho', 'trien lam', 'hoi thao'] },
    { id: 'learning', label: 'Học tập & năng lực', jp: '学習・能力', keywords: ['hoc tap', 'dao tao', 'giao duc', 'kien thuc', 'ky nang', 'nang luc', 'kinh nghiem', 'thi cu', 'ky thi', 'bang cap', 'chuyen mon', 'thuc tap', 'huan luyen', 'ren luyen', 'thanh thao', 'hieu biet', 'bai hoc', 'khoa hoc', 'giao tai', 'tai lieu hoc', 'seminar', 'lecture', 'college', 'role play'] },
    { id: 'society', label: 'Xã hội & môi trường', jp: '社会・環境', keywords: ['xa hoi', 'moi truong', 'cong cong', 'dan so', 'cong dong', 'chinh sach', 'chinh phu', 'quoc gia', 'khu vuc', 'dia phuong', 'o nhiem', 'tai che', 'nang luong', 'khi hau', 'phuc loi', 'doi song', 'ho gia dinh'] },
    { id: 'quality', label: 'Trạng thái & tính chất', jp: '状態・性質', keywords: ['trang thai', 'tinh chat', 'dac tinh', 'dac diem', 'tinh hinh', 'tam thoi', 'lam thoi', 'dinh ky', 'thuong ky', 'tong the', 'rieng biet', 'can ke', 'song song', 'truc tiep', 'gian tiep', 'toan bo', 'mot phan', 'toi thieu', 'toi da', 'chu yeu', 'thuc te', 'cu the', 'khach quan', 'hieu qua', 'hop ly', 'chinh xac'] },
    { id: 'strategy', label: 'Quản trị & chiến lược', jp: '経営・戦略', keywords: ['quan tri', 'chien luoc', 'phuong cham', 'dinh huong', 'sang kien', 'chu so huu', 'lien minh', 'lien doanh', 'tai co cau', 'cai cach', 'doi moi', 'uy quyen', 'muc tieu', 'quy mo', 'nguon luc', 'resource', 'administration', 'initiative', 'alliance', 'innovation', 'guideline'] },
    { id: 'media', label: 'Thiết kế & truyền thông', jp: 'デザイン・広報', keywords: ['thiet ke', 'hinh anh', 'bo cuc', 'font chu', 'hien thi', 'trinh dien', 'trung bay', 'bai dang', 'bai viet', 'cong khai', 'truyen thong', 'chu de', 'sac thai', 'dat ten', 'to roi', 'pamphlet', 'display', 'design', 'image', 'publicity', 'demonstration'] },
    { id: 'mindset', label: 'Tư duy & cảm xúc', jp: '思考・感情', keywords: ['suy nghi', 'y tuong', 'quan ngai', 'lo ngai', 'lo lang', 'that vong', 'dong luc', 'hang hai', 'tinh than', 'niem tin', 'long tin', 'y thuc', 'ky vong', 'cam xuc', 'cam giac', 'co y', 'co tinh', 'hieu duoc', 'thoai mai', 'nghi van', 'doubt', 'idea', 'motivation', 'negative'] },
    { id: 'trend', label: 'Mức độ & xu hướng', jp: '程度・傾向', keywords: ['xu huong', 'khuynh huong', 'cap do', 'trinh do', 'muc do', 'gioi han', 'pham vi', 'tuong doi', 'tuong duong', 'vuot troi', 'ap dao', 'can bang', 'on dinh', 'pho bien', 'uu diem', 'nhuoc diem', 'do ben', 'cuong do', 'ty le', 'tieu chuan', 'hang dau', 'trend', 'level', 'balance', 'standard', 'merit', 'demerit'] },
    { id: 'action', label: 'Hành động & thao tác', jp: '行動・操作', keywords: ['rut lui', 'rut quan', 'tra lai', 'tra ve', 'gui den', 'gui tra', 'dem theo', 'mang theo', 'dua vao', 'lay ra', 'bo di', 'giu lai', 'gan vao', 'tach ra', 'thao roi', 'tap hop', 'thu thap', 'phan phat', 'cung cap', 'dien vao', 'ghi lai', 'luu lai', 'dang tai', 'thu nghiem', 'thu xem', 'sua chua', 'bao tri', 'khoi dong', 'day vao', 'che day', 'bao phu', 'phoi hop', 'ket hop', 'tu bo', 'giai quyet', 'tiep can', 'yeu cau', 'dat duoc', 'chuan bi', 'lua chon', 'return', 'fill in', 'record', 'maintenance', 'request'] },
    { id: 'expression', label: 'Cách nói & sắc thái', jp: '表現・ニュアンス', keywords: ['dai khai', 'qua loa', 'hoan toan', 'nhat dinh', 'tat yeu', 'bat buoc', 'co le', 'duong nhu', 'thuong thuong', 'thong thuong', 'dan dan', 'ngay lap tuc', 'mot cach', 'het suc', 'rat nhieu', 'khong the', 'de dang', 'manh dan', 'mao muoi', 'ngan gon', 'gon nhe', 'tron tru', 'linh hoat', 'tich cuc', 'tieu cuc', 'sac thai', 'nuance', 'smooth', 'flexible', 'positive'] },
    { id: 'modern-business', label: 'Thuật ngữ kinh doanh hiện đại', jp: 'ビジネス用語', keywords: [] },
    { id: 'concept', label: 'Khái niệm khác', jp: 'その他', keywords: [] }
  ];

  function emptyProgress() {
    return { seen: {}, correct: {}, wrong: {}, completedSteps: {} };
  }

  function normalizeProgress(saved) {
    saved = saved || {};
    return {
      seen: saved.seen || {},
      correct: saved.correct || {},
      wrong: saved.wrong || {},
      completedSteps: saved.completedSteps || {}
    };
  }

  function saveProgress() {
    if (window.LearningHistory) window.LearningHistory.saveCourseState('bjt', progress).catch(function () {});
    updateWrongCount();
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('vi-VN').format(value);
  }

  function dateKey() {
    var now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  function displayDate() {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
  }

  function hashString(value) {
    var hash = 2166136261;
    for (var i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededShuffle(list, seed) {
    var result = list.slice();
    var state = seed || 1;
    for (var i = result.length - 1; i > 0; i -= 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      var j = state % (i + 1);
      var temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function parseVocabulary(entry) {
    return window.BJTDataUtils.parseVocabulary(entry);
  }

  var GRAMMAR_GUIDES = {
    1: ['Diễn tả một quy định, lịch trình hoặc sự sắp xếp đã được tổ chức, công ty hay tập thể quyết định.', 'Theo quy định tuân thủ, không được đăng những nội dung liên quan đến công việc lên mạng xã hội.'],
    2: ['Nhấn mạnh chính danh từ đứng trước こそ với sắc thái “chính là” hoặc quyết tâm đặc biệt.', 'Năm nay nhất định tôi sẽ đỗ BJT J1+!'],
    3: ['Chỉ hạn cuối: một hành động phải hoàn tất trước khi thời điểm được nêu tới.', 'Tôi muốn đỗ BJT J2 trước khi bắt đầu tìm việc.'],
    4: ['Nêu nguyên nhân dẫn đến một kết quả; thường dùng trong cách nói tương đối trang trọng.', 'Vì hôm qua trời rất lạnh nên tôi đã bị cảm.'],
    5: ['Phủ định mức độ bằng cách nói sự việc chưa đến mức đáng để làm hoặc nói như vậy.', 'Nghe nói thành tích kinh doanh tốt nhỉ. — Chưa phải kết quả đáng để kể với người khác đâu.'],
    6: ['Nêu đánh giá rằng cả hai phía đều giống nhau, thường mang ý phê phán: A đã vậy thì B cũng thế.', 'Cha mẹ đã như vậy thì con cái cũng vậy.'],
    7: ['Nêu nguyên nhân dẫn đến kết quả không mong muốn, thường kèm sắc thái trách móc hoặc tiếc nuối.', 'Vì uống thuốc nên tôi bắt đầu buồn ngủ.'],
    8: ['Nêu nguyên nhân tạo ra kết quả tốt và thường thể hiện sự biết ơn.', 'Nhờ sự giúp đỡ của mọi người mà công việc đã tiến triển thuận lợi.'],
    9: ['Diễn tả thời điểm ngay trước một hành động, một sự thay đổi sắp xảy ra, hoặc nỗ lực định làm gì.', 'Khi tôi vừa định ăn cơm thì có khách tới.'],
    10: ['Đưa ra một ví dụ; với なんて／なんか còn có thể thể hiện thái độ xem nhẹ.', 'Tôi không biết người như tôi có làm tốt được không, nhưng tôi sẽ cố gắng.'],
    11: ['Diễn tả mong muốn, yêu cầu hoặc đề nghị người khác làm gì; không phù hợp khi nói trực tiếp với bề trên.', 'Tôi muốn bạn kiểm tra lại tài liệu này.'],
    12: ['Bộc lộ sự ngạc nhiên hoặc khó tin trước một sự việc không ngờ tới.', 'Không ngờ anh ấy lại là thủ phạm thật sự…'],
    13: ['Cho biết không cần thiết phải thực hiện hành động đó.', 'Nếu có ý kiến thì không cần phải ngại cả cấp trên.'],
    14: ['Nhấn mạnh rằng chỉ còn một việc duy nhất có thể làm hoặc chỉ đơn thuần là như vậy.', 'Những gì có thể làm tôi đã làm; giờ chỉ còn chờ kết quả.'],
    15: ['Mở rộng phạm vi với nghĩa “không chỉ A mà cả B”.', 'BJT không chỉ có thể thi ở Nhật Bản mà còn ở nước ngoài.'],
    16: ['Giới hạn vào duy nhất một người, vật, lần hoặc cơ hội.', 'Đời người chỉ có một lần, hãy làm điều mình muốn.'],
    17: ['Nói rằng kể từ lần cuối thực hiện hành động đó, trạng thái không thay đổi cho đến nay.', 'Từ chuyến công tác nước ngoài năm ngoái, tôi chưa ra nước ngoài thêm lần nào.'],
    18: ['Chỉ địa điểm, lĩnh vực, hoàn cảnh hoặc bối cảnh của một hành động; mang sắc thái trang trọng.', 'Cuộc họp dự kiến được tổ chức tại phòng 201.'],
    19: ['Diễn tả hành động đáp lại kỳ vọng, yêu cầu hoặc mong muốn của ai đó.', 'Anh ấy đã đáp lại kỳ vọng của cha mẹ và trở thành bác sĩ.'],
    20: ['Cho biết nội dung hoặc mức độ thay đổi phù hợp với điều kiện được nêu.', 'Giá cũng thay đổi tùy theo trọng lượng.'],
    21: ['Nêu chủ đề hoặc đối tượng mà lời nói, suy nghĩ hay hành động hướng tới.', 'Chúng ta sẽ trao đổi về kế hoạch mới.'],
    22: ['Cho biết kết quả thay đổi tùy theo tình hình hoặc điều kiện.', 'Tùy tình hình dịch bệnh mà việc có thể sang Nhật hay không sẽ thay đổi.'],
    23: ['Diễn tả việc làm theo một tiêu chuẩn, đường lối hoặc dọc theo một tuyến.', 'Tôi xin trình bày theo tài liệu đang có trong tay quý vị.'],
    24: ['Đưa ra một hành động cực đoan để nhấn mạnh mức độ, thường kèm đánh giá tiêu cực hoặc nghi vấn.', 'Tôi không định phản bội đồng nghiệp chỉ để được thăng chức.'],
    25: ['Cho biết hoàn cảnh không cho phép làm việc được nhắc đến.', 'Vì đang có rắc rối với khách hàng nên tôi không còn tâm trí ăn uống.'],
    26: ['Nêu thực tế hoàn toàn trái ngược với dự đoán hoặc kỳ vọng.', 'Không những không phiền, vì đang rảnh nên tôi còn thấy biết ơn.'],
    27: ['Khẳng định mạnh rằng nguyên nhân hoặc bản chất chỉ có thể là điều được nêu.', 'Thành công của dự án lần này chính là kết quả từ nỗ lực của anh ấy.'],
    28: ['Chỉ sự phân loại, nguyên nhân, tác nhân hoặc phương tiện tùy theo ngữ cảnh.', 'Nhờ sự hợp tác của mọi người, chúng ta đã đạt mục tiêu gây quỹ.'],
    29: ['Diễn tả việc buộc phải làm dù không mong muốn vì hoàn cảnh không cho phép lựa chọn khác.', 'Do thuế tiêu dùng tăng, có lẽ từ năm sau chúng tôi buộc phải tăng giá sản phẩm.'],
    30: ['Nói rằng kết quả không phụ thuộc vào điều kiện hay sự khác biệt được nêu.', 'Bất kể có uống được rượu hay không, phí tham gia vẫn là 3.000 yên.'],
    31: ['Nêu sự tương phản với một sự thật đã thừa nhận; là cách nói trang trọng hơn のに.', 'Dù hôm nay là ngày nghỉ, cảm ơn anh đã tới giúp.'],
    32: ['Thừa nhận A nhưng nêu thực tế B khác với điều được kỳ vọng từ A.', 'Dù năng lực của anh ấy không có gì phải nghi ngờ, tôi vẫn lo về sức khỏe.'],
    33: ['Từ chối một cách lịch sự rằng không thể đáp ứng; thường dùng trong kinh doanh.', 'Rất xin lỗi, nhưng phía công ty chúng tôi không thể thực hiện việc này.'],
    34: ['Cảnh báo khả năng một kết quả xấu có thể xảy ra.', 'Nếu cứ để mặc như vậy, sự việc có thể phát triển thành vấn đề lớn.'],
    35: ['Diễn tả cảm xúc hoặc hành động tự nhiên mạnh đến mức không thể kìm lại.', 'Khi thấy biển giảm giá một nửa, tôi không thể không bước vào cửa hàng.', '私は半額の看板を見たら、その店に入らずにはいられない。'],
    36: ['Phủ định mạnh một khả năng với nghĩa “không thể có chuyện đó”.', 'Không có chuyện bạn lại không làm được. Hãy can đảm thử sức với công việc ấy!', 'あなたにできないわけがない。勇気を持って、その仕事に挑戦してみてください！'],
    37: ['Cho biết không còn phương án nào khác ngoài hành động được nêu.', 'Lỡ chuyến tàu cuối rồi… chỉ còn cách về bằng taxi.', '終電逃しちゃった...タクシーで帰るしかないな。'],
    38: ['Coi một điều không đúng sự thật như đã xảy ra, hoặc giả vờ như vậy.', 'Anh ấy coi tài liệu đồng nghiệp chuẩn bị như do mình làm rồi trình bày ở cuộc họp ban điều hành.', '彼は同僚が準備した資料を、自分で作ったことにして役員会で発表しました。'],
    39: ['Diễn tả hai việc cùng xảy ra hoặc cùng thay đổi theo thời gian.', 'Cùng với việc chuyển công tác, tôi cũng chuyển nhà.', '転勤とともに、引越しした。'],
    40: ['Nêu đánh giá từ lập trường hoặc góc nhìn của người hay tổ chức được nhắc đến.', 'Đối với xã hội Nhật Bản, tỷ lệ sinh giảm là một vấn đề lớn.', '日本社会にとって、少子化は大きな問題だ。'],
    41: ['Dùng để đối chiếu hai phía hoặc chỉ đối tượng mà ý kiến, hành động hướng tới.', 'Hãy chịu trách nhiệm đàng hoàng đối với điều mình đã nói.', '自分が言ったことに対して、ちゃんと責任を持ちなさいよ！'],
    42: ['Cho biết cùng với sự thay đổi dần của A thì B cũng thay đổi.', 'Theo thời gian, cảm giác buồn bã cũng dần biến mất.', '時間が経つにつれて、悲しい気持ちも消えていきました。'],
    43: ['Diễn tả một thay đổi hoặc sự việc kéo theo thay đổi hay sự việc khác.', 'Cùng với việc số nhân viên trẻ tăng lên, số buổi nhậu cũng giảm.', '若い社員が増えるにともなって、飲み会の数も減ってきたな...'],
    44: ['Diễn tả sự thay đổi tiếp tục tiến theo một chiều hướng.', 'Cổ phiếu công ty A cứ tiếp tục giảm.', 'A社の株は下落する一方だ。'],
    45: ['Chỉ phạm vi rộng hoặc khoảng thời gian kéo dài từ đầu đến cuối.', 'Do ảnh hưởng của tuyết, tàu đã dừng suốt hai giờ.', '雪の影響により、２時間にわたって電車がストップしました。'],
    46: ['Diễn tả một trạng thái được để nguyên hoặc cứ tiếp diễn không ngừng.', 'Hôm nay tôi bị cấp trên phàn nàn suốt.', '今日は上司に文句を言われっぱなしだったな...'],
    47: ['Nhấn mạnh rằng nếu thiếu điều kiện A thì kết quả B không thể xảy ra.', 'Nếu không thảo luận, tôi nghĩ vấn đề sẽ không được giải quyết.', '話し合いなくしては、問題は解決しないと思います。'],
    48: ['Diễn tả hai hành động đồng thời, hoặc thừa nhận A nhưng thực tế vẫn B.', 'Dù nói rượu không tốt cho sức khỏe, tôi vẫn uống mỗi ngày.', 'お酒は体によくないと言いつつ（も）、毎日飲んでいる。'],
    49: ['Diễn tả một thay đổi đang tiến triển từ từ.', 'Số người sử dụng tàu thay vì xe máy đang dần tăng lên.', 'バイクではなく電車を利用する人が増えつつある。'],
    50: ['Nêu kết quả trái với dự đoán, kỳ vọng hoặc quy tắc.', 'Trái với dự đoán, kỳ thi BJT năm nay không khó.', '予想に反して、今年のBJTの試験は難しくなかった。'],
    51: ['Nêu thời điểm chuẩn bị hoặc thực hiện một việc quan trọng; mang sắc thái trang trọng.', 'Khi triển khai kế hoạch mới, chúng ta phải quyết định nhân sự cần thiết.', '新しい企画をするにあたり必要な人員を決めなければならない。'],
    52: ['Diễn tả hai hành động hoặc trạng thái lặp đi lặp lại.', 'Hôm nay trời cứ mưa rồi tạnh, tạnh rồi lại mưa.', '今日は、雨が降っては止み、止んでは降るが繰り返される変な天気だ。'],
    53: ['Chỉ thời điểm hoặc dịp làm việc gì, trang trọng hơn とき.', 'Khi có dịp trở lại Tokyo, xin hãy liên lạc với tôi.', 'また東京に来られる際は、ぜひ連絡ください。'],
    54: ['Mở rộng đối tượng với nghĩa “không chỉ riêng A”.', 'Vấn đề thiếu nhân lực trong y tế không chỉ ở nông thôn mà đã lan tới cả thành thị.', '医療の現場での人手不足という問題は、今や田舎に限らず都市部にまで及んでいる。'],
    55: ['Diễn tả việc dùng hết khả năng hoặc đạt tới giới hạn có thể.', 'Các cửa hàng đều hết sức gọi khách bằng tiếng “Kính chào quý khách!”.', 'どの店も声の限り「いらっしゃいませ！」とお客さんを呼ぼうとして、とても賑やかで活気があった。'],
    56: ['Đưa ra phán đoán trong phạm vi thông tin mà người nói biết hoặc quan sát được.', 'Theo những gì thấy trong ảnh thì có vẻ là bé trai, nhưng phải một tháng nữa mới biết chắc.', '写真を見る限りでは、男の子のようですが、もう１ヶ月経たないと、わからないですね。'],
    57: ['Thể hiện cảm xúc ở mức rất cao bằng lối nói trang trọng.', 'Tôi vô cùng vui vì dường như đã giúp ích được cho anh.', 'お力になれたようで、嬉しい限りです。'],
    58: ['Diễn tả trong suốt thời gian một điều kiện hoặc trạng thái còn tiếp diễn.', 'Chừng nào người đó còn làm trưởng phòng, thành tích của phòng này khó mà tăng.', 'あの人が課長でいる限り、この課の業績は上がらないだろう。'],
    59: ['Giới hạn một mốc thời gian, số lần hoặc phạm vi và coi đó là điểm cuối.', 'Hợp đồng với quý công ty sẽ kết thúc vào cuối tháng này.', '御社との契約は、今月末限りで終了させていただきます。'],
    60: ['Xác định thời điểm được nêu là lần cuối cùng.', 'Tôi định từ hôm nay sẽ bỏ thuốc lá.', '今日を限りに禁煙しようと思っている。'],
    61: ['Nêu việc xấu cứ xảy ra đúng vào lúc đó, hoặc bày tỏ niềm tin đặc biệt vào một người.', 'Cứ đúng ngày nghỉ học thì lại có bài kiểm tra quan trọng.', '学校を休んだ日に限って大事なテストがあるんだよな。'],
    62: ['Đưa ra lựa chọn tốt nhất hoặc giới hạn đối tượng duy nhất được áp dụng.', 'Quả nhiên mùa hè thì bia là tuyệt nhất.', 'やっぱり、夏はビールに限りますねー。'],
    63: ['Cho biết kết quả được quyết định tùy theo nội dung hay tình trạng của A; rất trang trọng.', 'Tùy kết quả kỳ thi lần này mà lớp mới sẽ được quyết định.', '今度の試験の成績いかんで新しいクラスが決まる。'],
    64: ['Diễn tả mức độ cực kỳ cao, thường dùng cho đánh giá tiêu cực trong văn viết.', 'Nhầm ngày lễ nhập học thì thật là bất cẩn hết sức.', '入式の日を間違えるなんて不注意極まる。'],
    65: ['Diễn tả trạng thái đạt tới cực điểm bằng lối nói trang trọng.', 'Được thầy khen là niềm vinh dự tột cùng.', '先生に褒めていただいて、光栄の至りです。'],
    66: ['Bày tỏ tiếc nuối, bất mãn hoặc phê phán vì kết quả trái mong đợi.', 'Nếu anh liên lạc thì tôi đã ra ga đón rồi, vậy mà…', '連絡してくだされば、駅まで迎えに行きましたものを。'],
    67: ['Diễn tả việc hoàn cảnh buộc ai đó phải làm, hoặc khiến một việc trở nên không thể tránh khỏi.', 'Vì bệnh nên tôi buộc phải về nước.', '病気で帰国を余儀なくされた。'],
    68: ['Cho biết việc quá đơn giản hoặc hiển nhiên nên không cần làm tới mức đó.', 'Việc này đã học nhiều lần nên có lẽ không cần giải thích nữa.', 'これは前に何度も勉強しましたから、説明するまでもないでしょう。'],
    69: ['Nêu rằng dù A có xảy ra hay không thì kết quả phía sau vẫn không thay đổi.', 'Dù anh Yamada có tới hay không, cứ 10 giờ là chúng ta bắt đầu họp.', '山田さんが来ようが来まいが、10時になったら会議を始めましょう。'],
    70: ['Nêu hành động hoặc kết luận được đưa ra sau khi cân nhắc căn cứ, tiền đề hay kinh nghiệm.', 'Tôi muốn mọi người thảo luận dựa trên diễn biến cho tới nay.', 'これまでの経緯を踏まえて議論して頂きたい。'],
    71: ['Khẳng định một hành động hoặc trạng thái là đương nhiên và thích đáng.', 'Nếu là sinh viên đại học thì đương nhiên phải đọc được sách chuyên ngành cỡ này.', '大学生ならこのくらいの専門書は読めてしかるべきだ。'],
    72: ['Diễn tả việc vẫn giữ nguyên trạng thái từ đầu trong khi thực hiện điều gì.', 'Nhờ Internet, có thể học ở đại học Mỹ ngay khi vẫn ở nhà.', 'インターネットを利用すると、居ながらにして米国の大学の授業も受けられる。'],
    73: ['Chỉ mốc kết thúc trang trọng, hoặc phương tiện và cách thức dùng để thực hiện.', 'Ông Nishimura sẽ nghỉ việc kể từ hết hôm nay.', '西村氏は本日をもって退職されます。'],
    74: ['Miêu tả dáng vẻ như sắp làm gì hoặc như muốn nói điều gì.', 'Cô ấy trừng mắt nhìn tôi với vẻ như muốn bảo tôi về nhanh đi.', '彼女は早く帰れと言わんばかりの顔で私を睨みつけた。'],
    75: ['Miêu tả thái độ hay dáng vẻ như thể đang nói điều đó dù thực tế không nói ra.', 'Anh ấy ngáp như thể muốn nói câu chuyện của tôi thật chán.', '彼は私の話が退屈だとばかりにあくびをした。'],
    76: ['Nêu một tình huống đặc biệt nên kết quả cũng khác với thông thường.', 'Vì đang là kỳ nghỉ hè nên bể bơi đầy trẻ em từ sáng.', '夏休みとあって、プールは朝から子供たちでいっぱいだ。'],
    77: ['Diễn tả hành động thứ hai xảy ra ngay lập tức sau hành động thứ nhất, thường bất ngờ.', 'John vừa ăn một miếng nattō đã nhổ ra ngay.', 'ジョンさんは納豆を一口食べるなり吐き出してしまった。'],
    78: ['Đưa ra các lựa chọn và thúc giục người nghe chọn một cách rõ ràng.', 'Có vẻ bạn bị cảm; nên uống thuốc hoặc đi bác sĩ.', '風邪をひいているみたいですね。薬を飲むなり、医者に行くなりしたほうがいいですよ。'],
    79: ['Diễn tả quá trình cuối cùng đạt tới một giai đoạn hoặc phạm vi lan tới tận một điểm.', 'Anh tôi làm việc ba tháng không nghỉ ngày nào và cuối cùng đã chết vì lao lực.', '兄は3か月間1日も休まず働き続け、過労死するに至った。'],
    80: ['Nêu rằng khi đạt tới một giai đoạn hoặc vị trí đặc biệt thì tình hình cũng khác.', 'Ngoại ngữ dù biết nghĩa, nhưng khi thực sự sử dụng vẫn thường mắc lỗi.', '外国語は、意味は知っていても、使うとなると間違えることも多い。'],
    81: ['Khen ngợi nét riêng hoặc năng lực chỉ A mới có.', 'Kyoto có sự trầm tĩnh chỉ riêng một thành phố cổ mới có.', '京都には古い町ならではの落ち着きがある。'],
    82: ['Diễn tả hành động tuân theo quy tắc, tiêu chuẩn hoặc truyền thống đã có.', 'Chúng tôi thi đấu theo đúng tinh thần thể thao.', 'スポーツマンシップに則って試合をする。'],
    83: ['Diễn tả việc áp dụng hoặc giải thích sát với hoàn cảnh, thực tế hay ví dụ cụ thể.', 'Tôi xin giải thích dựa theo một ví dụ cụ thể.', '具体例に即してご説明いたします。']
  };

  var GRAMMAR_EXAMPLES_JA = {
    1: 'コンプライアンス的に業務に関することをSNSにあげてはいけないことになっている。',
    2: '今年こそBJT J1＋に合格するぞ！',
    3: '就活を始めるまでに、BJT J2 に合格したいと思っています。',
    4: '昨日はとても寒かったために、カゼをひいてしまった。',
    5: '営業成績良かったらしいね。人に言えるほどの結果ではないよ。',
    6: '親が親なら、子も子だね。',
    7: '薬を飲んだせいで眠くなってきた。',
    8: '皆さんのおかげで、仕事が順調に進みました。',
    9: 'ごはんを食べようとした時、お客さんが来た。',
    10: '私などにきちんとできるかわかりませんが、がんばります。',
    11: 'この資料をもう一度確認してほしいです。',
    12: 'まさか、彼が本当の犯人だったとは．．．',
    13: '意見があるなら、上司にだって遠慮することはありません。',
    14: 'やれることはやった。あとはただ結果を待つのみだ。',
    15: 'BJTは日本国内のみならず、海外でも受験可能です。',
    16: '人生は一度きりですから、やりたいことをやりましょう！',
    17: '去年海外出張をしたきり、一度も海外へ行っていない。',
    18: '201号室において会議が行われる予定です。',
    19: '彼は両親の期待に応えて、医者になった。',
    20: '重量に応じて値段も変わる。',
    21: '新しい計画について話し合います。',
    22: 'コロナの状態次第で、日本にいけるかどうか変わってくる。',
    23: 'お手元の資料に沿ってご説明いたします。',
    24: '同僚を裏切ってまで出世しようとは思わない。',
    25: 'お客さんとのトラブルがあって、食事どころじゃないんですよ。',
    26: '暇だったから迷惑どころか、ありがたいぐらいだよ。',
    27: '今回のプロジェクトの成功は彼の努力の賜物に他ならない。',
    28: '皆様のご協力により募金の目標金額を達成しました。',
    29: '消費税が上がるというので、来年から商品の値上げをせざるを得ないと思います。',
    30: 'お酒が飲める、飲めないに関わらず、飲み会の参加費は3,000円だ。',
    31: '今日は休日にもかかわらず助けてくださって、ありがとうございました。',
    32: '彼の能力は疑いようがないものの健康面が心配だ。',
    33: '申し訳ございませんが、御社では出来かねます。',
    34: 'このまま放置しておくと大問題に発展しかねないので、何か対策を練らなければならない。'
  };

  function parseGrammar(entry, index) {
    var raw = String(entry.definition || '').replace(/\s+/g, ' ').trim();
    var guide = GRAMMAR_GUIDES[index] || [];
    var exampleJa = entry.exampleJa || guide[2] || GRAMMAR_EXAMPLES_JA[index] || '';
    var meaning = entry.meaning || raw.replace(/^【意味[^】]*】/, '').trim();
    var exampleOffset = exampleJa ? meaning.indexOf(exampleJa) : -1;
    if (exampleOffset > 0) meaning = meaning.slice(0, exampleOffset).trim();
    meaning = meaning.replace(/[Ⓜ✦■]\s*$/, '').trim();
    return {
      meaning: meaning,
      explanationVi: entry.explanationVi || guide[0] || 'Mẫu câu này dùng để diễn đạt sắc thái và quan hệ ý nghĩa nêu ở phần trên; hãy chú ý dạng từ đứng trước mẫu và mức độ trang trọng trong ngữ cảnh công việc.',
      exampleJa: exampleJa,
      exampleVi: entry.exampleVi || guide[1] || '',
      formation: entry.formation || entry.term,
      usageNote: entry.usageNote || '',
      relatedPatterns: entry.relatedPatterns || [],
      sourceTypes: entry.sourceTypes || {}
    };
  }

  function normalizeCategoryText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .toLocaleLowerCase('vi');
  }

  function categorizeVocabulary(entry, details) {
    var haystack = normalizeCategoryText([entry.term, details.meaning, details.exampleVi].join(' '));
    for (var index = 0; index < VOCAB_CATEGORIES.length - 1; index += 1) {
      var category = VOCAB_CATEGORIES[index];
      if (category.keywords.some(function (keyword) {
        if (keyword.indexOf(' ') !== -1) return haystack.indexOf(keyword) !== -1;
        var escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp('(^|[^a-z0-9])' + escaped + '([^a-z0-9]|$)').test(haystack);
      })) return category.id;
    }
    var surface = String(entry.term || '').replace(/[（(][^）)]*[）)]/g, '').replace(/[〜～\s]/g, '');
    if (/^[ァ-ヶー・]+$/.test(surface)) return 'modern-business';
    if (/する|（する）|\(する\)/.test(entry.term)) return 'action';
    if (/^[ぁ-んー・]+$/.test(surface)) {
      return /[るすむくぐうつぬぶ]$/.test(surface) ? 'action' : 'expression';
    }
    return 'concept';
  }

  function normalizeInsightTerm(value) {
    return String(value || '')
      .replace(/[（(][^）)]*[）)]/g, '')
      .replace(/する$/, '')
      .trim();
  }

  function vocabularyInsightFor(item) {
    if (!item || item.kind !== 'vocabulary') return { parts: [], term: null };
    var seen = {};
    var parts = (normalizeInsightTerm(item.term).match(/[\u3400-\u9fff々]/g) || []).map(function (kanji) {
      var detail = vocabularyInsights.characters[kanji];
      if (!detail || seen[kanji]) return null;
      seen[kanji] = true;
      return { kanji: kanji, detail: detail };
    }).filter(Boolean);
    return {
      parts: parts,
      term: (vocabularyInsights.termsByIndex || [])[item.index] || vocabularyInsights.terms[normalizeInsightTerm(item.term)] || null
    };
  }

  function renderVocabularyInsight(item, compact) {
    var insight = vocabularyInsightFor(item);
    if (!insight.parts.length && !insight.term) return '';
    var partRows = insight.parts.map(function (part) {
      return '<div class="kanji-cell kanji-glyph" lang="ja">' + escapeHtml(part.kanji) + '</div>' +
        '<div class="kanji-cell"><strong>' + escapeHtml(part.detail.hanviet || '—') + '</strong></div>' +
        '<div class="kanji-cell reading-on" lang="ja">' + escapeHtml(part.detail.on || '—') + '</div>' +
        '<div class="kanji-cell reading-kun" lang="ja">' + escapeHtml(part.detail.kun || '—') + '</div>' +
        '<div class="kanji-cell">' + escapeHtml(part.detail.meaning || '—') + '</div>';
    }).join('');
    var term = insight.term;
    var traps = term && term.traps && term.traps.length ? '<section class="insight-section insight-traps"><h4>Điểm dễ nhầm</h4><div class="insight-tags">' + term.traps.map(function (trap) {
      return '<span><b lang="ja">' + escapeHtml(trap.r) + '</b>' + escapeHtml(trap.meaning ? ' — ' + trap.meaning : '') + '</span>';
    }).join('') + '</div></section>' : '';
    var confusion = term && term.confuse ? '<section class="insight-section insight-warning"><h4>Lưu ý</h4><p>' + escapeHtml(term.confuse) + '</p></section>' : '';
    var collocations = term && term.collocations && term.collocations.length ? '<section class="insight-section insight-collocations"><h4>Cụm / ngữ cảnh dùng</h4><div class="insight-tags">' + term.collocations.map(function (value) { return '<span>' + escapeHtml(value) + '</span>'; }).join('') + '</div></section>' : '';
    var synonymItems = term ? (term.synonyms || []).concat(term.related || []) : [];
    var synonyms = synonymItems.length ? '<section class="insight-section insight-synonyms"><h4>Đồng nghĩa / từ liên quan</h4><div class="insight-tags">' + synonymItems.map(function (value) {
      if (typeof value === 'string') return '<span>' + escapeHtml(value) + '</span>';
      return '<span class="' + (value.kind === 'synonym' ? 'is-synonym' : 'is-related') + '"><b lang="ja">' + escapeHtml(value.term) + '</b>' + (value.meaning ? escapeHtml(' — ' + value.meaning) : '') + '<small>' + (value.kind === 'synonym' ? 'Đồng nghĩa đã đối chiếu' : 'Từ liên quan trong kho BJT') + '</small></span>';
    }).join('') + '</div></section>' : '<section class="insight-section insight-synonyms"><h4>Đồng nghĩa / từ liên quan</h4><p class="insight-empty">Chưa có từ tương đương đủ tin cậy trong nguồn đối chiếu.</p></section>';
    var provenance = term && term.sourceTypes ? '<p class="insight-provenance">Nguồn: BJT · KANJIDIC2/JMdict · Japanese WordNet. Bẫy đọc và mục “từ liên quan” là gợi ý tự động.</p>' : '';
    var kanjiSection = insight.parts.length
      ? '<section class="insight-section"><h4>Phân tích chữ Hán</h4><div class="kanji-grid" role="table" aria-label="Phân tích chữ Hán"><div class="kanji-head">Kanji</div><div class="kanji-head">Hán Việt</div><div class="kanji-head">Âm On</div><div class="kanji-head">Âm Kun</div><div class="kanji-head">Nghĩa</div>' + partRows + '</div></section>'
      : '<section class="insight-section"><h4>Phân tích cách viết</h4><p class="insight-empty">Từ này không dùng chữ Hán, vì vậy không có âm Hán Việt, On hoặc Kun.</p></section>';
    return '<div class="vocabulary-insight' + (compact ? ' is-compact' : '') + '">' + kanjiSection + confusion + traps + collocations + synonyms + provenance + '</div>';
  }

  function renderGrammarInsight(item, compact) {
    var details = item.details;
    var core = compact ? '' : '<dl class="study-details grammar-details insight-core">' +
      '<div class="detail-wide"><dt>Ý nghĩa</dt><dd lang="ja">' + escapeHtml(details.meaning) + '</dd></div>' +
      '<div class="detail-wide"><dt>Giải thích bằng tiếng Việt</dt><dd>' + escapeHtml(details.explanationVi) + '</dd></div>' +
      (details.exampleJa ? '<div class="detail-wide"><dt>Ví dụ</dt><dd><span lang="ja">' + escapeHtml(details.exampleJa) + '</span>' + (details.exampleVi ? '<small>' + escapeHtml(details.exampleVi) + '</small>' : '') + '</dd></div>' : '') + '</dl>';
    var related = details.relatedPatterns && details.relatedPatterns.length
      ? '<section class="insight-section insight-synonyms"><h4>Mẫu gần nghĩa / liên quan</h4><div class="insight-tags">' + details.relatedPatterns.map(function (pattern) { return '<span lang="ja">' + escapeHtml(pattern) + '</span>'; }).join('') + '</div></section>'
      : '<section class="insight-section"><h4>Mẫu gần nghĩa / liên quan</h4><p class="insight-empty">Chưa có mẫu đủ gần để ghép cặp an toàn.</p></section>';
    return '<div class="vocabulary-insight grammar-insight' + (compact ? ' is-compact' : '') + '">' + core +
      '<section class="insight-section"><h4>Cấu trúc</h4><div class="grammar-formation" lang="ja">' + escapeHtml(details.formation || item.term) + '</div></section>' +
      (details.usageNote ? '<section class="insight-section insight-warning"><h4>Cách dùng & điểm dễ nhầm</h4><p>' + escapeHtml(details.usageNote) + '</p></section>' : '') +
      related + '<p class="insight-provenance">Phần giải thích và ví dụ tiếng Việt đã được biên tập cho BJT; nhóm mẫu liên quan là gợi ý học tập tự động.</p></div>';
  }

  function normalizeTerms(terms, kind) {
    return terms
      .filter(function (entry) { return entry && entry.term && entry.definition; })
      .map(function (entry, index) {
        var details = kind === 'vocabulary' ? parseVocabulary(entry) : parseGrammar(entry, index);
        if (kind === 'vocabulary') details.category = categorizeVocabulary(entry, details);
        return {
          id: kind + ':' + index,
          kind: kind,
          index: index,
          term: String(entry.term).trim(),
          definition: String(entry.definition).replace(/\s+/g, ' ').trim(),
          details: details,
          module: index % MODULES.length
        };
      });
  }

  function shortDefinition(value, limit) {
    var clean = String(value)
      .replace(/【意味[^】]*】/g, '')
      .replace(/[✦Ⓜ■]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    var max = limit || 150;
    if (clean.length <= max) return clean;
    var sliced = clean.slice(0, max);
    var lastSpace = sliced.lastIndexOf(' ');
    return sliced.slice(0, lastSpace > max * .65 ? lastSpace : max).trim() + '…';
  }

  function makeQuestion(item, sessionSeed) {
    var pool = datasets[item.kind];
    var mode = item.kind === 'vocabulary' && item.details.reading && item.details.sinoVietnamese
      ? ['meaning', 'reading', 'sino'][item.index % 3]
      : 'meaning';
    var candidates = pool.filter(function (candidate) {
      if (candidate.id === item.id) return false;
      if (mode === 'reading') return Boolean(candidate.details.reading);
      if (mode === 'sino') return Boolean(candidate.details.sinoVietnamese);
      return Boolean(candidate.details.meaning);
    });
    var distractors = seededShuffle(candidates, hashString(item.id + ':' + sessionSeed)).slice(0, 3);
    var options = seededShuffle([item].concat(distractors), hashString('options:' + item.id + ':' + sessionSeed));
    return {
      item: item,
      options: options,
      mode: mode,
      correctIndex: options.findIndex(function (option) { return option.id === item.id; })
    };
  }

  function optionValue(item, mode) {
    if (mode === 'reading') return item.details.reading || item.details.meaning || item.definition;
    if (mode === 'sino') return item.details.sinoVietnamese ? '[' + item.details.sinoVietnamese + ']' : (item.details.meaning || item.definition);
    return item.details.meaning || item.definition;
  }

  function renderItemDetails(item) {
    var d = item.details;
    if (item.kind === 'vocabulary') {
      return '<dl class="study-details">' +
        '<div><dt>Từ vựng</dt><dd lang="ja">' + escapeHtml(item.term) + '</dd></div>' +
        (d.reading ? '<div><dt>Cách đọc</dt><dd lang="ja">' + escapeHtml(d.reading) + '</dd></div>' : '') +
        (d.sinoVietnamese ? '<div><dt>Âm Hán Việt</dt><dd>[' + escapeHtml(d.sinoVietnamese) + ']</dd></div>' : '') +
        '<div><dt>Ý nghĩa</dt><dd>' + escapeHtml(d.meaning) + '</dd></div>' +
        (d.exampleJa ? '<div class="detail-wide"><dt>Ví dụ</dt><dd><span lang="ja">' + escapeHtml(d.exampleJa) + '</span>' + (d.exampleVi ? '<small>' + escapeHtml(d.exampleVi) + '</small>' : '') + '</dd></div>' : '') +
      '</dl>' + renderVocabularyInsight(item, true);
    }
    return '<dl class="study-details grammar-details">' +
      '<div class="detail-wide"><dt>Mẫu câu</dt><dd lang="ja">' + escapeHtml(item.term) + '</dd></div>' +
      '<div class="detail-wide"><dt>Ý nghĩa</dt><dd lang="ja">' + escapeHtml(d.meaning) + '</dd></div>' +
      '<div class="detail-wide"><dt>Giải thích bằng tiếng Việt</dt><dd>' + escapeHtml(d.explanationVi) + '</dd></div>' +
      (d.exampleJa ? '<div class="detail-wide"><dt>Ví dụ</dt><dd><span lang="ja">' + escapeHtml(d.exampleJa) + '</span>' + (d.exampleVi ? '<small>' + escapeHtml(d.exampleVi) + '</small>' : '') + '</dd></div>' : '') +
    '</dl>' + renderGrammarInsight(item, true);
  }

  function questionHint(question) {
    if (question.item.kind === 'grammar') return 'Mẫu này diễn đạt ý nghĩa nào?';
    if (question.mode === 'reading') return 'Chọn cách đọc đúng của từ vựng này.';
    if (question.mode === 'sino') return 'Chọn âm Hán Việt phù hợp.';
    return 'Chọn ý nghĩa gần nhất của từ vựng này.';
  }

  function createCustomSession(options) {
    stopPracticeTimer();
    currentSession = {
      mode: options.mode,
      returnView: options.returnView || currentView,
      title: options.title,
      jp: options.jp,
      queue: options.queue,
      index: 0,
      score: 0,
      misses: 0,
      lastTimedOut: false,
      seed: hashString(options.mode + ':' + dateKey() + ':' + options.queue.map(function (item) { return item.id; }).join(',')),
      history: window.LearningHistory ? window.LearningHistory.startSession({
        courseId: 'bjt',
        courseTitle: 'BJT',
        mode: options.mode,
        contentType: options.jp === '語彙' ? 'Từ vựng' : (options.jp === '文法' ? 'Ngữ pháp' : 'Tổng hợp'),
        title: options.title,
        requestedCount: options.queue.length,
        timeLimitSeconds: 30
      }) : null
    };
    practiceSeconds = 30;
    selectedAnswer = -1;
    answered = false;
  }

  function closeCurrentSession(status) {
    if (!currentSession || !currentSession.history || !window.LearningHistory) return;
    window.LearningHistory.finishSession(currentSession.history, {
      status: status || 'completed',
      answeredCount: currentSession.history.answeredCount,
      correctCount: currentSession.score,
      wrongCount: currentSession.misses
    }).catch(function () {});
  }

  function currentQuestion() {
    if (!currentSession || !currentSession.queue.length || currentSession.index >= currentSession.queue.length) return null;
    return makeQuestion(currentSession.queue[currentSession.index], currentSession.seed + currentSession.index);
  }

  function sessionLabel() {
    if (currentSession.mode === 'exam' && (currentSession.returnView === 'vocabulary' || currentSession.returnView === 'grammar')) return 'BJT · Luyện theo dạng';
    if (currentSession.mode === 'exam') return 'BJT · Luyện tập tổng hợp';
    if (currentSession.mode === 'subject') return 'BJT · Luyện theo dạng';
    if (currentSession.mode === 'review') return 'BJT · Ôn lại lỗi sai';
    if (currentSession.mode === 'module') return 'BJT · Lộ trình gợi ý';
    if (currentSession.mode === 'single') return 'BJT · Luyện nhanh';
    return 'BJT Business Japanese Proficiency Test';
  }

  function stopPracticeTimer() {
    if (practiceTimer) window.clearInterval(practiceTimer);
    practiceTimer = null;
  }

  function startPracticeTimer() {
    stopPracticeTimer();
    practiceTimer = window.setInterval(function () {
      if (!currentSession || answered) return;
      practiceSeconds -= 1;
      var timer = document.getElementById('bjtQuestionTimer');
      var fill = document.getElementById('bjtTimerFill');
      if (timer) timer.textContent = practiceSeconds + 's';
      if (fill) fill.style.width = Math.max(0, practiceSeconds / 30 * 100) + '%';
      if (practiceSeconds <= 0) checkAnswer(true);
    }, 1000);
  }

  function renderPractice() {
    stopPracticeTimer();
    if (!currentSession) {
      currentView = 'path';
      renderPath();
      return;
    }
    var question = currentQuestion();
    if (!question) {
      renderSessionComplete();
      return;
    }

    var item = question.item;
    var percent = Math.round((currentSession.index / currentSession.queue.length) * 100);
    var optionHtml = question.options.map(function (option, index) {
      var classes = ['answer-option'];
      if (selectedAnswer === index) classes.push('is-selected');
      if (answered && index === question.correctIndex) classes.push('is-correct');
      if (answered && index === selectedAnswer && index !== question.correctIndex) classes.push('is-wrong');
      return '<button class="' + classes.join(' ') + '" type="button" data-answer="' + index + '"' + (answered ? ' disabled' : '') + '>' +
        '<span class="answer-key">' + String.fromCharCode(65 + index) + '</span>' +
        '<span class="answer-text">' + escapeHtml(shortDefinition(optionValue(option, question.mode), item.kind === 'grammar' ? 125 : 105)) + '</span>' +
      '</button>';
    }).join('');

    var feedbackHtml = '';
    if (answered) {
      var correct = selectedAnswer === question.correctIndex;
      feedbackHtml = '<div class="feedback' + (correct ? '' : ' is-wrong') + '">' +
        '<strong>' + (correct ? 'Chính xác' : (currentSession.lastTimedOut ? 'Hết 30 giây' : 'Chưa đúng')) + '</strong>' +
        renderItemDetails(item) +
      '</div>';
    }

    var actionLabel = answered
      ? (currentSession.index === currentSession.queue.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo')
      : 'Kiểm tra đáp án';

    appView.innerHTML = '<div class="view-shell is-single">' +
      '<section class="main-column">' +
        '<div class="date-line"><span>' + escapeHtml(sessionLabel()) + '</span><time datetime="' + dateKey() + '">' + displayDate() + '</time></div>' +
        '<h1 class="view-title">' + escapeHtml(currentSession.title) + ' <span class="jp-title" lang="ja">· ' + escapeHtml(currentSession.jp) + '</span></h1>' +
        '<div class="lesson-progress"><strong>Bài ' + (currentSession.index + 1) + ' <span>/ ' + currentSession.queue.length + '</span></strong><span class="score-status"><b>Đúng ' + currentSession.score + ' / ' + currentSession.queue.length + '</b> · ' + currentSession.misses + ' cần ôn</span><strong class="question-timer" id="bjtQuestionTimer">' + practiceSeconds + 's</strong><span class="progress-track"><span class="progress-fill" style="width:' + percent + '%"></span></span><span class="question-timer-track"><span id="bjtTimerFill" style="width:' + (practiceSeconds / 30 * 100) + '%"></span></span></div>' +
        '<p class="scenario">Chọn lời giải thích phù hợp nhất. Sau khi trả lời, app sẽ lưu lại tiến độ và đưa những mục chưa đúng vào phần Ôn sai.</p>' +
        '<div class="question-block">' +
          '<span class="question-type">' + escapeHtml(item.kind === 'grammar' ? 'Mẫu ngữ pháp' : 'Thuật ngữ BJT') + '</span>' +
          '<div class="question-heading"><h2 class="question-term" lang="ja">' + escapeHtml(item.term) + '</h2><button class="listen-icon" type="button" data-action="speak" aria-label="Nghe tiếng Nhật" title="Nghe tiếng Nhật"><span class="listen-glyph" aria-hidden="true"></span></button></div>' +
          '<p class="question-hint">' + escapeHtml(questionHint(question)) + '</p>' +
        '</div>' +
        '<div class="answer-list">' + optionHtml + '</div>' +
        feedbackHtml +
        '<button class="primary-action" type="button" data-action="primary"' + (!answered && selectedAnswer < 0 ? ' disabled' : '') + '><span>' + actionLabel + '</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>' +
      '</section>' +
    '</div>';
    if (!answered) startPracticeTimer();
  }

  function renderSessionComplete() {
    stopPracticeTimer();
    var total = currentSession.queue.length;
    var score = currentSession.score;
    var mode = currentSession.mode;
    closeCurrentSession('completed');
    appView.innerHTML = '<section class="main-column">' +
      '<span class="context-label">HOÀN THÀNH BUỔI HỌC</span>' +
      '<h1 class="view-title">Kết quả <span class="jp-title" lang="ja">· 学習結果</span></h1>' +
      '<p class="view-subtitle">Bạn đã hoàn thành ' + total + ' câu trong phần ' + escapeHtml(currentSession.title) + '.</p>' +
      '<div class="summary-grid">' +
        '<div class="summary-item"><strong>' + score + ' / ' + total + '</strong><span>câu trả lời đúng</span></div>' +
        '<div class="summary-item"><strong>' + currentSession.misses + '</strong><span>mục cần ôn</span></div>' +
        '<div class="summary-item"><strong>' + Math.round((score / Math.max(total, 1)) * 100) + '%</strong><span>độ chính xác</span></div>' +
      '</div>' +
      '<button class="primary-action" type="button" data-action="finish-session"><span>Quay lại</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>' +
    '</section>';
  }

  function renderPath() {
    var groups = [0, 1, 2].map(function (groupIndex) {
      var groupModules = MODULES.slice(groupIndex * 3, groupIndex * 3 + 3);
      var groupSeen = groupModules.reduce(function (sum, module, offset) {
        var moduleIndex = groupIndex * 3 + offset;
        return sum + Object.keys(progress.seen).filter(function (id) {
          var item = itemsById.get(id);
          return item && item.module === moduleIndex;
        }).length;
      }, 0);
      var groupTotal = datasets.vocabulary.concat(datasets.grammar).filter(function (item) {
        return item.module >= groupIndex * 3 && item.module < groupIndex * 3 + 3;
      }).length;
      var moduleHtml = groupModules.map(function (module, offset) {
        var moduleIndex = groupIndex * 3 + offset;
        return '<article class="module"><span class="module-index">' + (moduleIndex + 1) + '</span><h3 lang="ja">' + escapeHtml(module.jp) + '</h3><p>' + escapeHtml(module.title) + '<br>' + escapeHtml(module.subtitle) + '</p><button type="button" data-action="module" data-module="' + moduleIndex + '">Bắt đầu 10 câu</button></article>';
      }).join('');
      return '<section class="path-group"><div class="path-level"><strong>0' + (groupIndex + 1) + '</strong><span>' + escapeHtml(groupModules[0].phase) + '</span><small>' + groupSeen + ' / ' + groupTotal + ' mục đã học</small></div><div class="module-list">' + moduleHtml + '</div></section>';
    }).join('');

    appView.innerHTML = '<section class="main-column">' +
      '<span class="context-label">LỘ TRÌNH GỢI Ý</span>' +
      '<div class="section-head"><div><h1 class="view-title">Lộ trình BJT <span class="jp-title" lang="ja">· ビジネス日本語</span></h1><p class="view-subtitle">Đi từ ngôn ngữ công sở nền tảng tới các tình huống quản trị, đàm phán và tổng hợp.</p></div><span class="stat-inline">' + Object.keys(progress.seen).length + ' mục đã học</span></div>' +
      groups +
      '<p class="rail-note">Lộ trình này là cách sắp xếp học tập gợi ý từ hai bộ dữ liệu đã cung cấp, không phải phân loại cấp độ chính thức của kỳ thi BJT.</p>' +
    '</section>';
  }

  function subjectKindFromView() {
    return currentView.indexOf('grammar') === 0 ? 'grammar' : 'vocabulary';
  }

  function renderSubjectHub(kind) {
    currentView = kind;
    var isGrammar = kind === 'grammar';
    var count = datasets[kind].length;
    var activeTab = subjectTabs[kind];
    var title = isGrammar ? 'Ngữ pháp BJT' : 'Từ vựng BJT';
    var jp = isGrammar ? '文法' : '語彙';
    var description = isGrammar
      ? 'Học mẫu câu theo hệ thống: cấu trúc, ý nghĩa, giải thích tiếng Việt, ví dụ và bài luyện.'
      : 'Học thuật ngữ theo hệ thống: nhóm ý nghĩa, cách đọc, Hán Việt, cách dùng và bài luyện.';
    var tabs = [
      { id: 'knowledge', label: 'Học kiến thức' },
      { id: 'practice', label: 'Luyện theo dạng' },
      { id: 'mixed', label: 'Luyện tập' }
    ].map(function (tab) {
      return '<button class="subject-tab' + (activeTab === tab.id ? ' is-active' : '') + '" type="button" data-action="subject-tab" data-kind="' + kind + '" data-tab="' + tab.id + '">' + tab.label + '</button>';
    }).join('');
    var modules;
    if (activeTab === 'knowledge') {
      modules = [{
        index: '01',
        icon: isGrammar ? 'fa-book-open' : 'fa-language',
        title: isGrammar ? 'Kho ' + formatNumber(count) + ' mẫu ngữ pháp' : 'Kho ' + formatNumber(count) + ' thuật ngữ',
        description: isGrammar ? 'Tra cứu cấu trúc, sắc thái, giải thích và ví dụ dịch sang tiếng Việt.' : 'Tra cứu theo nhóm ý nghĩa, phân tích chữ Hán và cụm từ thường dùng.',
        action: 'open-library',
        label: 'Mở kho học'
      }];
    } else if (activeTab === 'practice') {
      modules = [{
        index: '01',
        icon: 'fa-file-lines',
        title: isGrammar ? 'Trắc nghiệm ngữ pháp' : 'Trắc nghiệm từ vựng',
        description: isGrammar ? 'Chọn 5, 10 hoặc 20 mẫu câu ngẫu nhiên để luyện ý nghĩa và ôn lại lỗi sai.' : 'Chọn 5, 10 hoặc 20 thuật ngữ để luyện nghĩa, cách đọc và âm Hán Việt.',
        action: 'open-subject-setup',
        label: 'Chọn số câu'
      }];
    } else {
      modules = [{
        index: '01',
        icon: 'fa-graduation-cap',
        title: 'Luyện tập tổng hợp BJT',
        description: 'Chọn 5, 10 hoặc 20 câu trộn từ vựng và ngữ pháp để tăng khả năng ghi nhớ.',
        action: 'open-subject-practice',
        label: 'Mở phần luyện tập'
      }];
    }
    var rows = modules.map(function (module) {
      return '<article class="subject-module-row"><span class="subject-module-index">' + module.index + '</span><span class="subject-module-icon"><i class="fa-solid ' + module.icon + '" aria-hidden="true"></i></span><span class="subject-module-copy"><strong>' + escapeHtml(module.title) + '</strong><small>' + escapeHtml(module.description) + '</small></span><button type="button" data-action="' + module.action + '" data-kind="' + kind + '">' + escapeHtml(module.label) + ' <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></article>';
    }).join('');
    appView.innerHTML = '<section class="main-column subject-hub">' +
      '<span class="context-label">BJT · ' + (isGrammar ? 'NGỮ PHÁP' : 'TỪ VỰNG') + ' · ' + jp + '</span>' +
      '<div class="section-head subject-head"><div><h1 class="view-title">' + title + ' <span class="jp-title" lang="ja">· ' + jp + '</span></h1><p class="view-subtitle">' + description + '</p></div><span class="stat-inline">' + formatNumber(count) + ' mục</span></div>' +
      '<div class="subject-tabs" role="tablist">' + tabs + '</div><div class="subject-module-list">' + rows + '</div>' +
    '</section>';
  }

  function renderLibrary(kind, query) {
    currentView = kind + '-library';
    libraryQuery = query == null ? libraryQuery : query;
    var source = datasets[kind];
    var categorySource = kind === 'vocabulary' && libraryCategory !== 'all'
      ? source.filter(function (item) { return item.details.category === libraryCategory; })
      : source;
    var normalized = libraryQuery.trim().toLocaleLowerCase('vi');
    var filtered = normalized ? categorySource.filter(function (item) {
      return (item.term + ' ' + item.definition).toLocaleLowerCase('vi').indexOf(normalized) !== -1;
    }) : categorySource;
    var visible = filtered.slice(0, libraryLimit);
    var rows = visible.map(function (item) {
      var summary = item.kind === 'vocabulary'
        ? [item.details.reading, item.details.sinoVietnamese ? '[' + item.details.sinoVietnamese + ']' : '', item.details.meaning].filter(Boolean).join(' · ')
        : item.details.meaning;
      var category = item.kind === 'vocabulary' ? VOCAB_CATEGORIES.find(function (entry) { return entry.id === item.details.category; }) : null;
      var insight = item.kind === 'vocabulary' ? vocabularyInsightFor(item) : { parts: [], term: item.details };
      var hasInsight = item.kind === 'grammar' || insight.parts.length || insight.term;
      var expanded = expandedVocabularyId === item.id;
      return '<article class="library-row' + (expanded ? ' is-expanded' : '') + '"><strong class="library-term" lang="ja">' + escapeHtml(item.term) + '</strong><span class="library-definition">' + escapeHtml(summary) + '</span>' +
        (category ? '<span class="library-category">' + escapeHtml(category.label) + ' · ' + escapeHtml(category.jp) + '</span>' : '') +
        '<div class="library-actions">' + (hasInsight ? '<button class="row-insight" type="button" data-action="vocab-insight" data-id="' + item.id + '" aria-expanded="' + expanded + '">' + (expanded ? 'Thu gọn' : (item.kind === 'grammar' ? 'Chi tiết' : 'Phân tích')) + '</button>' : '') + '<button class="row-practice" type="button" data-action="single" data-id="' + item.id + '">Luyện mục này</button></div>' +
        (expanded ? '<div class="library-insight">' + (item.kind === 'grammar' ? renderGrammarInsight(item, false) : renderVocabularyInsight(item, false)) + '</div>' : '') + '</article>';
    }).join('');
    var title = kind === 'grammar' ? 'Ngữ pháp · 文法' : 'Từ vựng · 語彙';
    var eyebrow = kind === 'grammar' ? '84 MẪU DÙNG TRONG NGỮ CẢNH' : '1.565 THUẬT NGỮ BUSINESS JAPANESE';
    var categoryFilters = '';
    if (kind === 'vocabulary') {
      var allButton = '<button type="button" data-action="vocab-category" data-category="all" aria-pressed="' + (libraryCategory === 'all') + '" class="category-chip' + (libraryCategory === 'all' ? ' is-active' : '') + '"><strong>Tất cả</strong><span>' + formatNumber(source.length) + '</span></button>';
      var renderCategoryButton = function (category) {
        var count = source.filter(function (item) { return item.details.category === category.id; }).length;
        return '<button type="button" data-action="vocab-category" data-category="' + category.id + '" aria-pressed="' + (libraryCategory === category.id) + '" class="category-chip' + (libraryCategory === category.id ? ' is-active' : '') + '"><strong>' + escapeHtml(category.label) + '</strong><small>' + escapeHtml(category.jp) + '</small><span>' + formatNumber(count) + '</span></button>';
      };
      var primaryCategories = VOCAB_CATEGORIES.slice(0, 14);
      var specializedCategories = VOCAB_CATEGORIES.slice(14);
      var primaryButtons = primaryCategories.map(renderCategoryButton).join('');
      var specializedButtons = specializedCategories.map(renderCategoryButton).join('');
      var specializedOpen = libraryCategory !== 'all' && specializedCategories.some(function (category) { return category.id === libraryCategory; });
      categoryFilters = '<div class="category-section"><div class="category-heading"><strong>Học theo nhóm ý nghĩa</strong><span>Mỗi từ được xếp theo nghĩa sử dụng chính trong công việc.</span></div>' +
        '<div class="category-filter" role="group" aria-label="Nhóm ý nghĩa chính">' + allButton + primaryButtons + '</div>' +
        '<details class="category-more"' + (specializedOpen ? ' open' : '') + '><summary>Mở rộng nhóm chuyên đề <span>' + specializedCategories.length + ' nhóm</span></summary><div class="category-filter" role="group" aria-label="Nhóm ý nghĩa chuyên đề">' + specializedButtons + '</div></details></div>';
    }

    appView.innerHTML = '<section class="main-column">' +
      '<button class="library-back" type="button" data-action="subject-hub" data-kind="' + kind + '">← ' + (kind === 'grammar' ? 'Ngữ pháp BJT' : 'Từ vựng BJT') + '</button>' +
      '<span class="context-label">' + eyebrow + '</span>' +
      '<div class="section-head"><div><h1 class="view-title">' + title + '</h1><p class="view-subtitle">' + (kind === 'vocabulary' ? 'Chọn nhóm ý nghĩa, tra cứu hoặc luyện từng thuật ngữ trong ngữ cảnh công việc.' : 'Tra cứu nhanh hoặc chọn một mục để bắt đầu luyện ngay.') + '</p></div><span class="stat-inline">' + formatNumber(filtered.length) + ' kết quả</span></div>' +
      categoryFilters +
      '<div class="search-row"><input class="search-input" id="librarySearch" type="search" value="' + escapeHtml(libraryQuery) + '" placeholder="Tìm tiếng Nhật, cách đọc hoặc nghĩa tiếng Việt…" aria-label="Tìm trong kho học"><button class="secondary-action" type="button" data-action="clear-search">Xóa tìm kiếm</button></div>' +
      (rows ? '<div class="library-list">' + rows + '</div>' : '<p class="empty-state">Không tìm thấy mục phù hợp.</p>') +
      (visible.length < filtered.length ? '<button class="primary-action" type="button" data-action="load-more"><span>Xem thêm ' + Math.min(40, filtered.length - visible.length) + ' mục</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>' : '') +
    '</section>';
    var input = document.getElementById('librarySearch');
    if (input && libraryQuery) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }

  function renderExamIntro() {
    stopPracticeTimer();
    var totalSeen = Object.keys(progress.seen).length;
    var totalCorrect = Object.keys(progress.correct).length;
    var accuracy = totalSeen ? Math.round((totalCorrect / totalSeen) * 100) : 0;
    var sizes = [5, 10, 20].map(function (size) {
      return '<button class="practice-size' + (practiceSize === size ? ' is-active' : '') + '" type="button" data-action="practice-size" data-size="' + size + '" aria-pressed="' + (practiceSize === size) + '"><strong>' + size + '</strong><span>câu hỏi</span></button>';
    }).join('');
    var scopeLabel = practiceScope === 'vocabulary' ? 'Từ vựng · 語彙' : (practiceScope === 'grammar' ? 'Ngữ pháp · 文法' : 'Từ vựng + Ngữ pháp');
    appView.innerHTML = '<section class="main-column practice-setup">' +
      '<span class="context-label">LUYỆN TẬP · ' + scopeLabel.toUpperCase() + '</span>' +
      '<h1 class="view-title">Luyện tập ghi nhớ <span class="jp-title" lang="ja">· 総合練習</span></h1>' +
      '<p class="view-subtitle">Chọn độ dài phù hợp. Mỗi câu có tối đa 30 giây; đáp án và giải thích xuất hiện ngay sau khi trả lời.</p>' +
      '<div class="practice-config"><div><span class="config-label">Số câu mỗi lượt</span><div class="practice-sizes" role="group" aria-label="Chọn số câu">' + sizes + '</div></div><div class="practice-rules"><span><i class="fa-solid fa-graduation-cap" aria-hidden="true"></i><span><strong>30 giây</strong> cho mỗi câu</span></span><span><i class="fa-solid fa-layer-group" aria-hidden="true"></i><span><strong>' + scopeLabel + '</strong></span></span><span><i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i><span><strong>Lưu lỗi sai</strong> để ôn lại</span></span></div></div>' +
      '<div class="summary-grid"><div class="summary-item"><strong>' + practiceSize + '</strong><span>câu trong lượt này</span></div><div class="summary-item"><strong>' + accuracy + '%</strong><span>độ chính xác đã ghi nhận</span></div><div class="summary-item"><strong>' + Object.keys(progress.wrong).length + '</strong><span>mục đang cần ôn</span></div></div>' +
      '<div class="exam-intro"><h2>Học để ghi nhớ, không mô phỏng đề thi</h2><p>Nội dung được tạo từ kho học BJT hiện có, không phải đề thi chính thức.</p></div>' +
      '<button class="primary-action" type="button" data-action="start-exam"><span>Bắt đầu ' + practiceSize + ' câu</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>' +
    '</section>';
  }

  function renderReview() {
    var wrongItems = Object.keys(progress.wrong).map(function (id) { return itemsById.get(id); }).filter(Boolean);
    var rows = wrongItems.map(function (item) {
      return '<article class="library-row"><strong class="library-term" lang="ja">' + escapeHtml(item.term) + '</strong><span class="library-definition">' + escapeHtml(item.details.meaning || item.definition) + '</span><button class="row-practice" type="button" data-action="single" data-id="' + item.id + '">Ôn mục này</button></article>';
    }).join('');
    appView.innerHTML = '<section class="main-column">' +
      '<span class="context-label">GHI NHỚ CHỦ ĐỘNG</span>' +
      '<div class="section-head"><div><h1 class="view-title">Ôn sai <span class="jp-title" lang="ja">· 復習</span></h1><p class="view-subtitle">Mỗi câu chưa đúng sẽ ở đây cho tới khi bạn trả lời đúng trong một lượt ôn.</p></div><span class="stat-inline">' + wrongItems.length + ' mục</span></div>' +
      (rows ? '<div class="library-list">' + rows + '</div><button class="primary-action" type="button" data-action="start-review"><span>Ôn tất cả lỗi sai</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>' : '<div class="empty-state"><strong>Chưa có lỗi sai cần ôn.</strong><p>Hãy bắt đầu một module trong Lộ trình hoặc làm một lượt luyện tập.</p></div>') +
    '</section>';
  }

  function renderHistory() {
    stopPracticeTimer();
    if (!window.LearningHistory) {
      appView.innerHTML = '<section class="main-column"><h1 class="view-title">Lịch sử học tập</h1><p class="view-subtitle">Trình duyệt này chưa hỗ trợ kho lịch sử học.</p></section>';
      return;
    }
    window.LearningHistory.renderDashboard(appView, {
      courseId: 'bjt',
      eyebrow: 'BJT · Lịch sử · 学習記録',
      title: 'Tiến bộ BJT',
      subtitle: 'Theo dõi từng phiên luyện, kết quả mỗi thuật ngữ và quá trình ghi nhớ theo thời gian.'
    });
  }

  function renderCurrentView() {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (currentView === 'path') {
      renderPath();
    } else if (currentView === 'vocabulary' || currentView === 'grammar') {
      renderSubjectHub(currentView);
    } else if (currentView === 'vocabulary-library' || currentView === 'grammar-library') {
      renderLibrary(subjectKindFromView(), libraryQuery);
    } else if (currentView === 'exam') {
      renderExamIntro();
    } else if (currentView === 'review') {
      renderReview();
    } else if (currentView === 'stats') {
      renderHistory();
    }
    updateNav();
  }

  function updateNav() {
    var activeView = currentView.replace('-library', '');
    document.querySelectorAll('.nav-item').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-view') === activeView);
    });
  }

  function updateWrongCount() {
    var count = Object.keys(progress.wrong).length;
    var badge = document.getElementById('wrongNavCount');
    badge.textContent = count;
    badge.hidden = count === 0;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    var button = document.getElementById('themeToggle');
    var nextTheme = theme === 'dark' ? 'light' : 'dark';
    var label = nextTheme === 'dark' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.querySelector('i').className = nextTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }

  function speakCurrent() {
    var question = currentQuestion();
    if (!question || !('speechSynthesis' in window)) {
      showToast('Trình duyệt này chưa hỗ trợ đọc tiếng Nhật.');
      return;
    }
    window.speechSynthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(question.item.term);
    utterance.lang = 'ja-JP';
    utterance.rate = .84;
    var voices = window.speechSynthesis.getVoices();
    var japanese = voices.find(function (voice) { return /^ja[-_]/i.test(voice.lang); });
    if (japanese) utterance.voice = japanese;
    window.speechSynthesis.speak(utterance);
  }

  function checkAnswer(timedOut) {
    var question = currentQuestion();
    if (!question || (selectedAnswer < 0 && !timedOut)) return;
    stopPracticeTimer();
    answered = true;
    var correct = selectedAnswer === question.correctIndex;
    currentSession.lastTimedOut = Boolean(timedOut);
    var id = question.item.id;
    progress.seen[id] = (progress.seen[id] || 0) + 1;
    if (correct) {
      currentSession.score += 1;
      progress.correct[id] = (progress.correct[id] || 0) + 1;
      if (currentSession.mode === 'review' || progress.wrong[id]) delete progress.wrong[id];
    } else {
      currentSession.misses += 1;
      progress.wrong[id] = (progress.wrong[id] || 0) + 1;
    }
    if (currentSession.history && window.LearningHistory) {
      window.LearningHistory.recordAnswer(currentSession.history, {
        itemId: id,
        contentType: question.item.kind === 'grammar' ? 'Ngữ pháp' : 'Từ vựng',
        prompt: question.item.term,
        selectedAnswer: selectedAnswer >= 0 ? optionValue(question.options[selectedAnswer], question.mode) : null,
        correctAnswer: optionValue(question.options[question.correctIndex], question.mode),
        isCorrect: correct,
        timedOut: timedOut,
        responseTimeSeconds: 30 - practiceSeconds
      }).catch(function () {});
    }
    saveProgress();
    renderPractice();
  }

  function advanceQuestion() {
    currentSession.index += 1;
    selectedAnswer = -1;
    answered = false;
    currentSession.lastTimedOut = false;
    practiceSeconds = 30;
    renderPractice();
  }

  document.querySelectorAll('.nav-item').forEach(function (button) {
    button.addEventListener('click', function () {
      stopPracticeTimer();
      if (currentSession && currentSession.history && currentSession.history.status === 'active') closeCurrentSession('abandoned');
      currentView = button.getAttribute('data-view');
      if (currentView === 'exam') practiceScope = 'mixed';
      libraryQuery = '';
      libraryCategory = 'all';
      libraryLimit = 40;
      currentSession = null;
      renderCurrentView();
      document.getElementById('primaryNav').classList.remove('is-open');
      document.getElementById('mobileNavToggle').setAttribute('aria-expanded', 'false');
    });
  });

  document.getElementById('mobileNavToggle').addEventListener('click', function () {
    var nav = document.getElementById('primaryNav');
    var open = nav.classList.toggle('is-open');
    this.setAttribute('aria-expanded', String(open));
  });

  document.getElementById('themeToggle').addEventListener('click', function () {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
  setTheme(document.documentElement.getAttribute('data-theme') || 'light');

  appView.addEventListener('input', function (event) {
    if (event.target.id !== 'librarySearch') return;
    libraryLimit = 40;
    renderLibrary(subjectKindFromView(), event.target.value);
  });

  appView.addEventListener('click', function (event) {
    var answerButton = event.target.closest('[data-answer]');
    if (answerButton && !answered) {
      selectedAnswer = Number(answerButton.getAttribute('data-answer'));
      renderPractice();
      return;
    }

    var actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    var action = actionButton.getAttribute('data-action');

    if (action === 'primary') {
      if (answered) advanceQuestion(); else checkAnswer(false);
    } else if (action === 'speak') {
      speakCurrent();
    } else if (action === 'single') {
      var item = itemsById.get(actionButton.getAttribute('data-id'));
      if (item) {
        createCustomSession({ mode: 'single', title: 'Luyện nhanh', jp: item.kind === 'grammar' ? '文法' : '語彙', queue: [item] });
        renderPractice();
      }
    } else if (action === 'load-more') {
      libraryLimit += 40;
      renderLibrary(subjectKindFromView(), libraryQuery);
    } else if (action === 'clear-search') {
      libraryQuery = '';
      libraryLimit = 40;
      renderLibrary(subjectKindFromView(), '');
    } else if (action === 'vocab-category') {
      libraryCategory = actionButton.getAttribute('data-category') || 'all';
      expandedVocabularyId = '';
      libraryLimit = 40;
      renderLibrary('vocabulary', libraryQuery);
    } else if (action === 'vocab-insight') {
      var insightId = actionButton.getAttribute('data-id');
      expandedVocabularyId = expandedVocabularyId === insightId ? '' : insightId;
      renderLibrary(subjectKindFromView(), libraryQuery);
    } else if (action === 'subject-tab') {
      var subjectKind = actionButton.getAttribute('data-kind');
      subjectTabs[subjectKind] = actionButton.getAttribute('data-tab');
      renderSubjectHub(subjectKind);
      updateNav();
    } else if (action === 'open-library') {
      var libraryKind = actionButton.getAttribute('data-kind');
      libraryQuery = '';
      libraryCategory = 'all';
      libraryLimit = 40;
      renderLibrary(libraryKind, '');
      updateNav();
    } else if (action === 'subject-hub') {
      renderSubjectHub(actionButton.getAttribute('data-kind'));
      updateNav();
    } else if (action === 'open-subject-setup') {
      practiceScope = actionButton.getAttribute('data-kind');
      currentView = 'exam';
      renderExamIntro();
      updateNav();
    } else if (action === 'open-subject-practice') {
      practiceScope = 'mixed';
      currentView = 'exam';
      renderExamIntro();
      updateNav();
    } else if (action === 'practice-size') {
      practiceSize = Number(actionButton.getAttribute('data-size'));
      renderExamIntro();
    } else if (action === 'module') {
      var moduleIndex = Number(actionButton.getAttribute('data-module'));
      var moduleItems = datasets.vocabulary.concat(datasets.grammar).filter(function (item) { return item.module === moduleIndex; });
      var queue = seededShuffle(moduleItems, hashString(dateKey() + ':module:' + moduleIndex)).slice(0, 10);
      createCustomSession({ mode: 'module', title: MODULES[moduleIndex].title, jp: MODULES[moduleIndex].jp, queue: queue });
      renderPractice();
    } else if (action === 'start-exam') {
      var practiceQueue;
      if (practiceScope === 'vocabulary' || practiceScope === 'grammar') {
        practiceQueue = seededShuffle(datasets[practiceScope], Date.now() >>> 0).slice(0, practiceSize);
      } else {
        var grammarCount = Math.max(1, Math.round(practiceSize * .25));
        var vocabCount = practiceSize - grammarCount;
        var vocab = seededShuffle(datasets.vocabulary, Date.now() >>> 0).slice(0, vocabCount);
        var grammar = seededShuffle(datasets.grammar, (Date.now() + 91) >>> 0).slice(0, grammarCount);
        practiceQueue = seededShuffle(vocab.concat(grammar), Date.now() >>> 0);
      }
      createCustomSession({ mode: 'exam', title: practiceScope === 'vocabulary' ? 'Luyện từ vựng' : (practiceScope === 'grammar' ? 'Luyện ngữ pháp' : 'Luyện tập tổng hợp'), jp: practiceScope === 'vocabulary' ? '語彙' : (practiceScope === 'grammar' ? '文法' : '総合練習'), queue: practiceQueue, returnView: practiceScope === 'mixed' ? 'exam' : practiceScope });
      renderPractice();
    } else if (action === 'start-review') {
      var reviewItems = Object.keys(progress.wrong).map(function (id) { return itemsById.get(id); }).filter(Boolean);
      createCustomSession({ mode: 'review', title: 'Ôn lại lỗi sai', jp: '復習', queue: seededShuffle(reviewItems, hashString(dateKey() + ':review')) });
      renderPractice();
    } else if (action === 'finish-session') {
      currentView = currentSession.returnView || 'path';
      currentSession = null;
      renderCurrentView();
    }
  });

  Promise.all([
    fetch('data/vocabulary.json?v=20260721g').then(function (response) {
      if (!response.ok) throw new Error('Không thể tải dữ liệu từ vựng');
      return response.json();
    }),
    fetch('data/grammar.json?v=20260721g').then(function (response) {
      if (!response.ok) throw new Error('Không thể tải dữ liệu ngữ pháp');
      return response.json();
    }),
    fetch('data/vocabulary-insights.json?v=20260721g').then(function (response) {
      if (!response.ok) throw new Error('Không thể tải dữ liệu phân tích chữ Hán');
      return response.json();
    }),
    window.LearningHistory ? Promise.all([
      window.LearningHistory.retireLegacyKeys('bjt', [STORAGE_KEY]),
      window.LearningHistory.loadCourseState('bjt', emptyProgress())
    ]).then(function (stateResults) { return stateResults[1]; }) : Promise.resolve(emptyProgress())
  ]).then(function (results) {
    vocabularyInsights = results[2] || vocabularyInsights;
    progress = normalizeProgress(results[3]);
    datasets.vocabulary = normalizeTerms(results[0].terms || [], 'vocabulary');
    datasets.grammar = normalizeTerms(results[1].terms || [], 'grammar');
    datasets.vocabulary.concat(datasets.grammar).forEach(function (item) { itemsById.set(item.id, item); });
    document.getElementById('vocabTotal').textContent = formatNumber(datasets.vocabulary.length);
    document.getElementById('grammarTotal').textContent = formatNumber(datasets.grammar.length);
    loadingState.hidden = true;
    appView.hidden = false;
    setTheme(document.documentElement.getAttribute('data-theme') || 'light');
    updateWrongCount();
    renderCurrentView();
  }).catch(function (error) {
    loadingState.innerHTML = '<p><strong>Không thể mở kho học.</strong><br>' + escapeHtml(error.message) + '. Hãy tải lại trang.</p>';
  });
})();
