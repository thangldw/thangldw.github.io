//#region pmp-app/core.js
const DOMAINS = [
	"people",
	"process",
	"business-environment"
];
function domain(q) {
	return DOMAINS.find((d) => q.tags?.includes(d)) || {
		People: "people",
		Process: "process",
		"Business Environment": "business-environment"
	}[q.section?.name] || "other";
}
function grade(q, response) {
	if (!Array.isArray(q.correctAnswer) || !q.correctAnswer.length) return null;
	return JSON.stringify(["matching", "ordering"].includes(q.type) ? q.correctAnswer : [...q.correctAnswer].sort()) === JSON.stringify(["matching", "ordering"].includes(q.type) ? response : [...response].sort());
}
function shuffle(items, rng = Math.random) {
	let a = [...items];
	for (let i = a.length - 1; i > 0; i--) {
		let j = Math.floor(rng() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
function planExam(questions, rng = Math.random) {
	const quotas = [
		59,
		74,
		47
	];
	let selected = [];
	for (let i = 0; i < 3; i++) {
		let pool = questions.filter((q) => domain(q) === DOMAINS[i] && q.examEligible !== false && (q.hasKey ?? !!q.correctAnswer?.length));
		if (pool.length < quotas[i]) throw Error(`Chưa đủ câu cho ${DOMAINS[i]}`);
		selected.push(...shuffle(pool, rng).slice(0, quotas[i]));
	}
	return shuffle(selected, rng);
}
function remaining(session, now = Date.now()) {
	return Math.max(0, Math.ceil((session.deadline - now) / 1e3));
}
function summarize(session, questions) {
	let byId = new Map(questions.map((q) => [q.id, q])), domains = {}, correct = 0, scored = 0;
	for (let id of session.ids) {
		let q = byId.get(id);
		if (!q) continue;
		let result = grade(q, session.responses[id] || []);
		if (result === null) continue;
		scored++;
		if (result) correct++;
		let d = domain(q);
		domains[d] ??= {
			correct: 0,
			total: 0
		};
		domains[d].total++;
		if (result) domains[d].correct++;
	}
	return {
		correct,
		scored,
		percent: scored ? Math.round(correct / scored * 100) : null,
		domains
	};
}
function validateProgress(p) {
	if (p?.format !== "pmp-progress-v1" || !p.state || typeof p.state !== "object" || Array.isArray(p.state)) throw Error("Bản sao tiến độ không hợp lệ");
	const s = p.state, ids = (a) => Array.isArray(a) && a.length <= 2e4 && a.every((v) => typeof v === "string"), object = (v) => v && typeof v === "object" && !Array.isArray(v), integer = (v) => Number.isInteger(v) && v >= 0;
	if (!Array.isArray(s.history) || s.history.length > 100 || !ids(s.done) || !ids(s.bookmarks) || !object(s.notes) || Object.values(s.notes).some((n) => typeof n !== "string") || s.locale !== void 0 && !["vi", "en"].includes(s.locale)) throw Error("Tiến độ không hợp lệ");
	for (const h of s.history) if (!object(h) || !["practice", "exam"].includes(h.mode) || !Number.isFinite(h.date) || !integer(h.durationSeconds) || !integer(h.correct) || !integer(h.scored) || h.correct > h.scored || !(h.percent === null || integer(h.percent) && h.percent <= 100) || !ids(h.answeredIds) || !ids(h.wrongIds) || !object(h.domains) || Object.values(h.domains).some((d) => !object(d) || !integer(d.correct) || !integer(d.total) || d.correct > d.total)) throw Error("Lịch sử không hợp lệ");
	if (s.session) {
		const x = s.session;
		if (!ids(x.ids) || !x.ids.length || new Set(x.ids).size !== x.ids.length || !integer(x.index) || x.index >= x.ids.length || !object(x.responses) || Object.values(x.responses).some((v) => !ids(v)) || !ids(x.flags) || !["practice", "exam"].includes(x.mode) || !Number.isFinite(x.started) || x.mode === "exam" && !Number.isFinite(x.deadline)) throw Error("Phiên học không hợp lệ");
	}
	if (s.reviews !== void 0 && (!object(s.reviews) || Object.values(s.reviews).some((r) => !object(r) || !integer(r.level) || r.level > 3 || !Number.isFinite(r.due)))) throw Error("Lịch ôn không hợp lệ");
	if (s.questionProgress !== void 0 && (!object(s.questionProgress) || Object.keys(s.questionProgress).length > 2e4 || Object.values(s.questionProgress).some((r) => !object(r) || !integer(r.attempts) || !integer(r.correct) || r.correct > r.attempts || typeof r.firstCorrect !== "boolean" || typeof r.lastCorrect !== "boolean" || !integer(r.streak) || !Number.isFinite(r.due) || typeof r.sessionId !== "string" || r.sessionId.length > 240 || Object.keys(r).some((k) => ![
		"attempts",
		"correct",
		"firstCorrect",
		"lastCorrect",
		"streak",
		"due",
		"sessionId"
	].includes(k))))) throw Error("Tiến độ câu hỏi không hợp lệ");
	if (s.certImported !== void 0 && (!object(s.certImported) || !Number.isFinite(s.certImported.date) || !ids(s.certImported.answeredIds) || !ids(s.certImported.wrongIds) || !ids(s.certImported.dueIds) || typeof s.certImported.memo !== "string" || typeof s.certImported.examDate !== "string" || typeof s.certImported.hasUnfinished !== "boolean")) throw Error("Tiến độ cert không hợp lệ");
	return s;
}
function migrateProgress(state, aliases = {}) {
	const resolve = (id) => aliases[id]?.id || id, unique = (a) => [...new Set(a.map(resolve))];
	const result = structuredClone(state);
	result.bookmarks = unique(result.bookmarks);
	result.notes = {};
	for (const [id, note] of Object.entries(state.notes)) {
		const target = resolve(id);
		result.notes[target] = result.notes[target] ? result.notes[target] + "\n" + note : note;
	}
	for (const h of result.history) {
		h.answeredIds = unique(h.answeredIds);
		h.wrongIds = unique(h.wrongIds);
	}
	if (result.session) {
		const s = result.session, oldSelected = s.ids[s.index];
		s.ids = unique(s.ids);
		s.index = Math.max(0, s.ids.indexOf(resolve(oldSelected)));
		s.flags = unique(s.flags);
		const responses = {};
		for (const [id, value] of Object.entries(s.responses)) {
			const target = resolve(id);
			if (responses[target]?.length) continue;
			responses[target] = aliases[id] ? value.map((v) => aliases[id].choiceMap[v] ?? v) : value;
		}
		s.responses = responses;
	}
	return result;
}
function reviewLesson(state, id, confidence, now = Date.now()) {
	state.reviews ??= {};
	const previous = state.reviews[id]?.level || 0, level = confidence === "again" ? 0 : Math.min(previous + 1, 3), days = [
		0,
		1,
		3,
		7
	][level];
	state.reviews[id] = {
		level,
		due: now + (days || 10 / 1440) * 864e5
	};
	return state.reviews[id];
}
function importCertProgress(state, legacy, questionIds, now = Date.now()) {
	const result = structuredClone(state);
	if (result.certImported || !legacy || typeof legacy !== "object") return result;
	const known = new Set(questionIds), p = legacy.progress?.pmp || {}, answers = p.answers || {}, learning = p.learning || {};
	const answeredIds = Object.keys(answers).filter((id) => known.has(id));
	const wrongIds = Object.entries(learning).filter(([id, r]) => known.has(id) && ["wrong", "timeout"].includes(r?.lastOutcome)).map(([id]) => id);
	const dueIds = Object.entries(learning).filter(([id, r]) => known.has(id) && Number.isFinite(Date.parse(r?.dueAt)) && Date.parse(r.dueAt) <= now).map(([id]) => id);
	result.bookmarks = [.../* @__PURE__ */ new Set([
		...result.bookmarks,
		...wrongIds,
		...dueIds
	])];
	result.certImported = {
		date: now,
		answeredIds,
		wrongIds,
		dueIds,
		memo: typeof legacy.notes?.pmp === "string" ? legacy.notes.pmp : "",
		examDate: typeof legacy.examDates?.pmp === "string" ? legacy.examDates.pmp : "",
		hasUnfinished: !!legacy.unfinishedSessions?.pmp
	};
	return result;
}
function canonicalStudyId(id, known) {
	if (known.has(id)) return id;
	const match = /^[a-z]+-(\d+)(?:-(\d+))?$/.exec(id);
	if (!match) return id;
	const candidate = match[2] ? `pmp-study-${match[1]}-${match[2]}` : `pmp-lesson-${match[1]}`;
	return known.has(candidate) ? candidate : id;
}
function normalizeStudyProgress(state, bank) {
	const known = /* @__PURE__ */ new Set([
		...bank.questions.map((q) => q.id),
		...bank.lessons.map((l) => l.id),
		...Object.keys(bank.aliases || {})
	]), resolve = (id) => canonicalStudyId(id, known), s = structuredClone(state);
	s.done = s.done.map(resolve);
	s.bookmarks = s.bookmarks.map(resolve);
	const notes = {};
	for (const [id, value] of Object.entries(s.notes)) {
		const key = resolve(id);
		notes[key] = notes[key] ? notes[key] + "\n" + value : value;
	}
	s.notes = notes;
	if (s.reviews) s.reviews = Object.fromEntries(Object.entries(s.reviews).map(([id, r]) => [resolve(id), r]));
	if (s.questionProgress) s.questionProgress = Object.fromEntries(Object.entries(s.questionProgress).map(([id, r]) => [bank.aliases?.[resolve(id)]?.id || resolve(id), r]));
	for (const h of s.history) {
		h.answeredIds = h.answeredIds.map(resolve);
		h.wrongIds = h.wrongIds.map(resolve);
	}
	if (s.session) {
		s.session.ids = s.session.ids.map(resolve);
		s.session.flags = s.session.flags.map(resolve);
		s.session.responses = Object.fromEntries(Object.entries(s.session.responses).map(([id, r]) => [resolve(id), r]));
	}
	const migrated = migrateProgress(s, bank.aliases);
	migrated.done = [...new Set(migrated.done)];
	return migrated;
}
//#endregion
export { DOMAINS, canonicalStudyId, domain, grade, importCertProgress, migrateProgress, normalizeStudyProgress, planExam, remaining, reviewLesson, shuffle, summarize, validateProgress };
