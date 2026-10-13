const SUPPORTED_CERTIFICATIONS = new Set([
  "ap", "sg", "fe", "nw", "sc", "db",
  "fp2", "fp3",
  "boki1", "boki2", "boki3",
  "tokei-2",
]);

function questionValue(question, key) {
  return question?.[key] ?? question?.content?.[key] ?? "";
}

function sectionName(question) {
  return typeof question?.section === "string"
    ? question.section
    : question?.section?.name || "";
}

function choiceText(choice) {
  return typeof choice === "string" ? choice : choice?.text || "";
}

function searchableQuestionText(question) {
  return [
    sectionName(question),
    ...(question?.tags || []),
    questionValue(question, "prompt"),
    questionValue(question, "helper"),
    questionValue(question, "passage"),
    ...(question?.choices || []).map(choiceText),
  ].join("\n");
}

function explicitFreeResponse(question) {
  const type = String(question?.type || question?.responseType || "");
  return /(?:free[_ -]?response|constructed[_ -]?response|essay|written|numeric[_ -]?entry)/iu.test(type)
    || Boolean(question?.responseSchema || question?.rubric || question?.modelAnswer);
}

export function detectQuestionCapabilities(question) {
  const passage = String(questionValue(question, "passage") || "");
  const text = searchableQuestionText(question);
  const hasPassage = Boolean(passage.trim());
  const hasMarkdownTable = /^\s*\|.*\|\s*$\n^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/mu.test(passage);
  const hasMath = /\$[^$]+\$|\\\(|\\\[|\\(?:frac|sum|sqrt|mu|sigma|theta)\b|[∑√σμ]|\bP\s*\([^)]+\)\s*=/u.test(text);
  const hasCode = /```|(?:^|\n)\s*(?:if|else|for|while|repeat|return|case)\b|擬似(?:言語|コード)|疑似(?:言語|コード)|プログラム(?:コード|の処理|を実行)/imu.test(text);
  const structuredArtifacts = [];

  if (hasMarkdownTable) structuredArtifacts.push("table");
  if (hasCode) structuredArtifacts.push("code");
  if (/\b(?:IPv[46]|VLAN|OSPF|BGP|CIDR|interface|eth\d|route)\b|\b\d{1,3}(?:\.\d{1,3}){3}(?:\/\d{1,2})?\b|サブネット|ルーティング|ネットワーク構成|設定ファイル/iu.test(text)) {
    structuredArtifacts.push("network-config");
  }
  if (/インシデント|イベントログ|アクセスログ|監査ログ|脅威|攻撃|侵害|incident|threat|log entr/iu.test(text)) {
    structuredArtifacts.push("incident-log");
  }
  if (/\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE\s+TABLE|JOIN|SQL)\b|ER図|E-R図|正規化|関係スキーマ/iu.test(text)) {
    structuredArtifacts.push("sql-er");
  }
  if (/仕訳|総勘定元帳|元帳|試算表|精算表|貸借対照表|損益計算書|財務諸表/iu.test(text)) {
    structuredArtifacts.push("accounting-form");
  }
  if (hasMath || /計算式|公式|算式/iu.test(text)) structuredArtifacts.push("formula");
  if (/確率分布|正規分布|二項分布|ポアソン分布|標本分布|distribution/iu.test(text)) {
    structuredArtifacts.push("distribution");
  }

  return {
    hasPassage,
    hasMarkdownTable,
    hasMath,
    hasCode,
    hasFreeResponse: explicitFreeResponse(question),
    structuredArtifacts,
  };
}

function uniqueQuestionIds(questions) {
  return [...new Set((questions || []).map((question) => question?.id).filter(Boolean))];
}

function matchingIds(questions, matcher) {
  return uniqueQuestionIds((questions || []).filter((question) => matcher(question, detectQuestionCapabilities(question))));
}

function track(id, label, description, questionIds, evidenceMode = "mcq") {
  return { id, label, description, questionIds, questionCount: questionIds.length, evidenceMode };
}

function tool(id, label, description, evidenceMode = "learner-aid") {
  return { id, label, description, evidenceMode };
}

function complementIds(questions, selectedIds) {
  const selected = new Set(selectedIds);
  return uniqueQuestionIds(questions).filter((id) => !selected.has(id));
}

function ipaProfile(cert, questions) {
  const routeIsContext = (question, fallback) => Object.hasOwn(question || {}, "ipaPracticeRoute")
    ? question.ipaPracticeRoute === "context"
    : fallback;
  const caseMatcher = (question, capabilities) => routeIsContext(question, /科目B|ケース|事例|午後/u.test(sectionName(question))
    || capabilities.hasPassage);
  if (cert.id === "ap") {
    const writtenIds = matchingIds(questions, q => q.type === "written_response" || q.ipaResponseFormat === "written");
    const written = new Set(writtenIds);
    const selectable = questions.filter(q => !written.has(q.id));
    const officialIds = matchingIds(selectable, q => q.id.startsWith("ap-ipa-"));
    return {
      tracks: [
        track("knowledge", "科目A · Đề IPA chính thức", "Đề trắc nghiệm IPA theo chủ đề; luyện tập, không quy đổi thành điểm thi.", officialIds, "guided-selectable"),
        track("case-evidence", "Bài luyện bổ trợ", "Câu tự biên soạn hoặc phỏng theo; không phải đề IPA hay bài 科目B.", complementIds(selectable, officialIds), "guided-selectable"),
        ...(writtenIds.length ? [track("written-cases", "科目B · Bài tự luận IPA", "Giữ nguyên bài lớn và câu hỏi con; tự đối chiếu đáp án mẫu, không tự động chấm điểm.", writtenIds, "self-check")] : []),
      ],
      tools: [tool("evidence-map", "Evidence map", "Ghi căn cứ từ tình huống; không chấm điểm.", "guided-only"), tool("decision-checklist", "Decision checklist", "Kiểm tra điều kiện và giới hạn ký tự.", "guided-only"), tool("guided-notes", "Guided notes", "Ghi chú cá nhân; không quy đổi thành điểm thi.", "guided-only")],
    };
  }
  if (cert.id === "sg") {
    const caseIds = matchingIds(questions, caseMatcher);
    return {
      tracks: [
        track("knowledge", "Knowledge decisions", "Build the selectable knowledge base used by the current bank.", complementIds(questions, caseIds), "mcq"),
        track("case-evidence", "Case evidence", "Link each decision to facts in the supplied case material.", caseIds, "mcq"),
      ],
      tools: [
        tool("evidence-map", "Evidence map", "Capture claim, source fact, and rejected alternatives.", "learner-aid"),
        tool("decision-checklist", "Decision checklist", "Check constraints before committing the bank answer.", "learner-aid"),
        tool("guided-notes", "Guided notes", "Private learner notes; not scored evidence.", "learner-aid"),
      ],
    };
  }

  if (cert.id === "fe") {
    const codeIds = matchingIds(questions, (question, capabilities) => /科目B/u.test(sectionName(question)) || capabilities.hasCode);
    return {
      tracks: [
        track("knowledge", "科目A knowledge", "Review the current selectable knowledge questions.", complementIds(questions, codeIds)),
        track("code-trace", "科目B code trace", "Trace variables, branches, and loop state against supplied code.", codeIds),
      ],
      tools: [
        tool("trace-table", "Trace table", "Record variable state at each execution step."),
        tool("branch-checklist", "Branch checklist", "Account for conditions, boundaries, and termination."),
        tool("guided-notes", "Guided notes", "Private learner notes; not scored evidence."),
      ],
    };
  }

  const specialist = {
    nw: {
      trackId: "network-lab",
      trackLabel: "Network, subnet & config",
      matcher: (question, capabilities) => capabilities.structuredArtifacts.includes("network-config")
        || /ネットワーク|プロトコル|ルーティング/u.test(sectionName(question)),
      tools: [
        tool("subnet-sheet", "Subnet sheet", "Work CIDR, ranges, and route selection."),
        tool("config-diff", "Config checklist", "Compare intended and observed configuration."),
        tool("packet-path", "Packet path", "Trace hops, controls, and failure points."),
      ],
    },
    sc: {
      trackId: "incident-analysis",
      trackLabel: "Incident, log & control",
      matcher: (question, capabilities) => capabilities.structuredArtifacts.includes("incident-log")
        || /インシデント|セキュリティ/u.test(sectionName(question)),
      tools: [
        tool("incident-timeline", "Incident timeline", "Sequence signals, actions, and impact."),
        tool("log-evidence", "Log evidence", "Record observable facts separately from inference."),
        tool("control-map", "Threat-control map", "Map threats to preventive and detective controls."),
      ],
    },
    db: {
      trackId: "data-design",
      trackLabel: "ER, SQL & normalization",
      matcher: (question, capabilities) => capabilities.structuredArtifacts.includes("sql-er")
        || /データ|SQL|DB/u.test(sectionName(question)),
      tools: [
        tool("er-workpad", "ER workpad", "List entities, keys, cardinalities, and constraints."),
        tool("sql-workpad", "SQL workpad", "Trace rows, joins, grouping, and predicates."),
        tool("normalization-check", "Normalization check", "Record dependencies and decomposition decisions."),
      ],
    },
  }[cert.id];
  const specialistIds = matchingIds(questions, (question, capabilities) => routeIsContext(question, specialist.matcher(question, capabilities)));
  return {
    tracks: [
      track("knowledge", "Subject A-2 knowledge drill", "Guided selectable Subject A-2 practice.", complementIds(questions, specialistIds), "guided-selectable"),
      track(specialist.trackId, "Subject A-2 context drill", "Context-rich selectable Subject A-2 practice.", specialistIds, "guided-selectable"),
    ],
    tools: [
      ...specialist.tools.map((item) => ({ ...item, evidenceMode: "guided-only", description: `${item.description} Guided only: not scored and not readiness evidence.` })),
      tool("guided-notes", "Guided notes", "Private learner notes; not scored and not readiness evidence.", "guided-only"),
    ],
  };
}

export function resolveFp2PracticeRoute(question = {}) {
  if (Object.hasOwn(question, "fp2PracticeRoute")) {
    return question.fp2PracticeRoute === "academic"
      ? question.fp2PracticeRoute
      : null;
  }
  return "academic";
}

function fpProfile(certificationId, questions) {
  if (certificationId === "fp2") {
    return {
      tracks: [track("academic", "Academic practice", "Selectable FP2 Academic practice.", uniqueQuestionIds(questions), "guided-selectable")],
      tools: [
        tool("case-facts", "Case facts", "Separate facts, constraints, and requested outcome. Guided only: not scored and not readiness evidence.", "guided-only"),
        tool("calculation-sheet", "Calculation sheet", "Record formula, substitution, units, and result. Guided only: not scored and not readiness evidence.", "guided-only"),
        tool("table-reader", "Table reader", "Track row, column, period, and applicable rule. Guided only: not scored and not readiness evidence.", "guided-only"),
      ],
    };
  }
  const practicalIds = matchingIds(questions, (question, capabilities) => (
    /実技|ケース|事例|計算|資料/u.test(searchableQuestionText(question))
    || capabilities.hasPassage
    || capabilities.hasMarkdownTable
  ));
  return {
    tracks: [
      track("gakka", "学科", "Concept and rule selection using current bank items.", complementIds(questions, practicalIds), "mcq"),
      track("jitsugi", "実技", "Case, calculation, and table interpretation using current bank items.", practicalIds, "mcq"),
    ],
    tools: [
      tool("case-facts", "Case facts", "Separate client facts, constraints, and requested outcome."),
      tool("calculation-sheet", "Calculation sheet", "Record formula, substitution, units, and result."),
      tool("table-reader", "Table reader", "Track row, column, period, and applicable rule."),
    ],
  };
}

function bokiTrackId(question) {
  const text = searchableQuestionText(question);
  if (/精算表|財務諸表|貸借対照表|損益計算書|キャッシュフロー計算書|決算整理/u.test(text)) return "worksheet";
  if (/試算表/u.test(text)) return "trial-balance";
  if (/元帳|転記/u.test(text)) return "ledger";
  if (/仕訳|借方.+貸方|貸方.+借方/u.test(text)) return "journal";
  return "other-accounting";
}

function bokiProfile(questions) {
  const buckets = new Map([
    ["journal", []],
    ["ledger", []],
    ["trial-balance", []],
    ["worksheet", []],
    ["other-accounting", []],
  ]);
  for (const question of questions) {
    if (question?.id) buckets.get(bokiTrackId(question)).push(question.id);
  }
  return {
    tracks: [
      track("journal", "Journal entries", "Selectable-question topic drill for debit and credit decisions; no native journal response is scored.", buckets.get("journal"), "selectable-question"),
      track("ledger", "Ledger posting", "Selectable-question topic drill for posting and account balances; no native ledger response is scored.", buckets.get("ledger"), "selectable-question"),
      track("trial-balance", "Trial balance", "Selectable-question topic drill for reconciliation; no native trial-balance response is scored.", buckets.get("trial-balance"), "selectable-question"),
      track("worksheet", "Worksheet & statements", "Selectable-question topic drill for adjustments and statements; no native worksheet response is scored.", buckets.get("worksheet"), "selectable-question"),
      track("other-accounting", "Other choice-bank topics", "Selectable-question topic drill without an explicit journal, ledger, trial-balance, or worksheet cue.", buckets.get("other-accounting"), "selectable-question"),
    ],
    tools: [
      tool("journal-pad", "Journal pad", "Draft debit, credit, account, and amount. Guided only: not scored and not readiness evidence.", "guided-only"),
      tool("ledger-pad", "Ledger pad", "Track posting reference and running balance. Guided only: not scored and not readiness evidence.", "guided-only"),
      tool("balance-check", "Balance check", "Reconcile totals and adjustment flow. Guided only: not scored and not readiness evidence.", "guided-only"),
    ],
  };
}

function statisticsProfile(questions) {
  return {
    tracks: [
      track("descriptive", "Descriptive statistics", "Summaries, association, and data interpretation.", matchingIds(questions, (question) => /記述統計/u.test(sectionName(question)))),
      track("distribution", "Probability distributions", "Distribution choice and probability calculation.", matchingIds(questions, (question) => /確率分布/u.test(sectionName(question)))),
      track("inference", "Estimation & testing", "Assumptions, estimators, intervals, and hypothesis tests.", matchingIds(questions, (question) => /推定|仮説検定/u.test(sectionName(question)))),
    ],
    tools: [
      tool("formula-board", "Formula board", "Record formula, symbols, and substitutions."),
      tool("distribution-map", "Distribution map", "Connect assumptions, parameters, and target probability."),
      tool("assumption-check", "Assumption check", "Check sampling, independence, and model conditions."),
      tool("scratchpad", "Scratchpad", "Work calculations without changing MCQ evidence."),
    ],
  };
}

function readinessFor(kind, questions, certificationId) {
  const capabilities = questions.map(detectQuestionCapabilities);
  const freeResponseCount = capabilities.filter((item) => item.hasFreeResponse).length;
  const counts = {
    passage: capabilities.filter((item) => item.hasPassage).length,
    markdownTable: capabilities.filter((item) => item.hasMarkdownTable).length,
    math: capabilities.filter((item) => item.hasMath).length,
    code: capabilities.filter((item) => item.hasCode).length,
  };
  const hasFreeResponse = freeResponseCount > 0;
  const guidedOnly = kind === "ipa" || kind === "boki";
  const readiness = {
    status: hasFreeResponse ? "mixed-evidence" : guidedOnly ? "guided-only" : "mcq-ready",
    questionCount: uniqueQuestionIds(questions).length,
    freeResponseCount,
    hasFreeResponse,
    counts,
    primaryEvidence: "mcq-answer",
    workpadIsExamEvidence: false,
    workpadIsReadinessEvidence: false,
    message: hasFreeResponse
      ? "Structured responses exist, but only scored bank outcomes count as evidence."
      : "The current bank is 選択式 / MCQ. Workpads are guided learner aids, not written-response exam evidence.",
  };
  if (kind === "boki") {
    readiness.warning = "現在の問題バンクは選択式です。作業用ワークパッドの完了は試験再現性またはレディネス証拠として扱いません。";
  }
  if (certificationId === "fp2") {
    readiness.academicSelectableAvailable = questions.length > 0;
    readiness.message = "FP2 Academic selectable practice only; Exam is unavailable.";
  }
  if (["ap", "db", "nw", "sc"].includes(certificationId)) {
    const examEligibleCount = questions.filter((question) => question.examEligible !== false).length;
    readiness.subjectA = { available: questions.length > 0, timedAvailable: false, questionCount: questions.length, examEligibleCount };
    readiness.message = `${certificationId === "ap" ? "Subject A" : "Subject A-2"} selectable practice only; Exam is unavailable.`;
    if (certificationId === "ap") {
      const written = questions.filter(q => q.type === "written_response" || q.ipaResponseFormat === "written");
      readiness.subjectA.questionCount = questions.length - written.length;
      if (written.length) {
        readiness.subjectB = { available: true, questionCount: written.length, timedAvailable: false, autoScored: false };
        readiness.hasFreeResponse = true;
        readiness.freeResponseCount = written.length;
        readiness.message = "Subject A practice and Subject B written self-check; full Exam is unavailable.";
      }
    }
  }
  return readiness;
}

export function getSpecialistExperience(cert) {
  if (!cert || !SUPPORTED_CERTIFICATIONS.has(cert.id)) return null;
  const questions = Array.isArray(cert.questions) ? cert.questions : [];
  let kind;
  let profile;
  if (["ap", "sg", "fe", "nw", "sc", "db"].includes(cert.id)) {
    kind = "ipa";
    profile = ipaProfile(cert, questions);
  } else if (["fp2", "fp3"].includes(cert.id)) {
    kind = "fp";
    profile = fpProfile(cert.id, questions);
  } else if (["boki1", "boki2", "boki3"].includes(cert.id)) {
    kind = "boki";
    profile = bokiProfile(questions);
  } else {
    kind = "statistics";
    profile = statisticsProfile(questions);
  }

  return {
    kind,
    title: `${cert.short || cert.name || cert.id} specialist workspace`,
    tracks: profile.tracks,
    tools: profile.tools,
    dataReadiness: readinessFor(kind, questions, cert.id),
  };
}
