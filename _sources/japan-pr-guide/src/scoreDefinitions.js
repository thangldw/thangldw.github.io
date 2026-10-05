const yesNoOptions = [[false, "No / Không"], [true, "Yes / Có"]];
const jicaTrainingOptions = [
  ["none", "No / Not claimed"],
  ["noUniversityClasses", "Yes — no Japanese university classes"],
  ["usedUniversityClasses", "Yes — used Japanese university classes"],
];

export const incomeOptions = [
  [2.9, "Below ¥3,000,000 / Dưới ¥3.000.000"],
  [3.5, "¥3,000,000 to ¥3,999,999"],
  [4.5, "¥4,000,000 to ¥4,999,999"],
  [5.5, "¥5,000,000 to ¥5,999,999"],
  [6.5, "¥6,000,000 to ¥6,999,999"],
  [7.5, "¥7,000,000 to ¥7,999,999"],
  [8.5, "¥8,000,000 to ¥8,999,999"],
  [9.5, "¥9,000,000 to ¥9,999,999"],
  [10, "¥10,000,000 to ¥14,999,999"],
  [15, "¥15,000,000 to ¥19,999,999"],
  [20, "¥20,000,000 to ¥24,999,999"],
  [25, "¥25,000,000 to ¥29,999,999"],
  [30, "¥30,000,000 or more / trở lên"],
];

const degreeOptions = {
  a: [["none", "No qualifying degree / Không"], ["bachelor", "Bachelor's / Cử nhân"], ["master", "Master's / Thạc sĩ"], ["doctor", "Doctorate / Tiến sĩ"]],
  b: [["none", "No qualifying degree / Không"], ["bachelor", "Bachelor's / Cử nhân"], ["master", "Master's / Thạc sĩ"], ["doctor", "Doctorate / Tiến sĩ"], ["mbaMot", "MBA / MOT"]],
  c: [["none", "No qualifying degree / Không"], ["bachelor", "Bachelor's / Cử nhân"], ["master", "Master's / Thạc sĩ"], ["doctor", "Doctorate / Tiến sĩ"], ["mbaMot", "MBA / MOT"]],
};

export const initialFactors = {
  degree: "master",
  experience: 7,
  age: 32,
  income: 6.5,
  position: 0,
  multipleDegrees: false,
  researchCount: 0,
  qualificationCount: 0,
  japanese: "0",
  japanUniversity: false,
  foreignJapaneseMajor: false,
  universityBonus: 0,
  innovativeAsiaManual: true,
  innovativeAsiaUniversity: "Vietnam-Japan University",
  innovationSupport: false,
  innovationSme: false,
  localSupport: false,
  smeResearch: false,
  foreignAward: false,
  advancedProject: false,
  jicaTraining: "none",
  assetManagement: false,
  investment: false,
};

const sharedDefinitions = [
  { group: "Core", id: "degree", label: "Highest qualifying degree", vi: "Bằng cấp cao nhất đủ điều kiện", kind: "select", max: { a: 30, b: 25, c: 25 }, options: degreeOptions, pointsKey: "degree", proof: "Degree certificate", note: "Must be obtained by the reference date." },
  { group: "Core", id: "experience", label: "Relevant professional experience", vi: "Kinh nghiệm nghề nghiệp liên quan", kind: "number", min: 0, max: { a: 15, b: 20, c: 25 }, pointsKey: "experience", proof: "Employment records", note: "Count only experience accumulated by each date." },
  { group: "Core", id: "age", label: "Age at assessment date", historicalLabel: "Age at reference date", vi: "Tuổi tại ngày tham chiếu", kind: "number", min: 18, max: 15, pointsKey: "age", proof: "Passport / date of birth", activities: ["a", "b"], note: "Use age on each specific reference date." },
  { group: "Core", id: "position", label: "Corporate position", vi: "Chức vụ doanh nghiệp", kind: "select", max: 10, options: [[0, "Other / none"], [5, "Director / executive officer"], [10, "Representative director / equivalent"]], pointsKey: "position", proof: "Corporate registry / appointment", activities: ["c"], note: "Position must apply at the reference date." },
  { group: "Core", id: "income", label: "Expected annual remuneration", vi: "Mức lương dự kiến hàng năm", kind: "select", max: { a: 40, b: 40, c: 50 }, options: incomeOptions, pointsKey: "income", proof: "Employment contract / payslips", note: "Use remuneration contracted for the assessed activity at that date." },
  { group: "Education & achievements", id: "multipleDegrees", label: "Advanced degrees in multiple fields", vi: "Nhiều bằng cấp cao ở các lĩnh vực khác nhau", kind: "select", max: 5, options: yesNoOptions, pointsKey: "multipleDegrees", proof: "Degree certificates", note: "Requires eligible advanced degrees." },
  { group: "Education & achievements", id: "researchCount", label: "Qualifying research-achievement categories", vi: "Nhóm thành tích nghiên cứu đủ điều kiện", kind: "select", max: { a: 25, b: 15 }, options: [[0, "None / Không"], [1, "One category / Một nhóm"], [2, "Two or more / Từ hai nhóm"]], pointsKey: "research", proof: "Publication / award evidence", activities: ["a", "b"], note: "Activity-specific category caps apply." },
  { group: "Education & achievements", id: "qualificationCount", label: "Qualifying national / notified IT qualifications", vi: "Chứng chỉ quốc gia / CNTT đủ điều kiện", kind: "select", max: 10, options: [[0, "None / Không"], [1, "One / Một"], [2, "Two or more / Từ hai"]], pointsKey: "qualification", proof: "Qualification certificate", activities: ["b"], note: "Only qualifications on the notified list count." },
  { group: "Language & university", id: "japanese", label: "Japanese language ability", vi: "Năng lực tiếng Nhật", kind: "select", max: 15, options: [["0", "Not included / Chưa tính"], ["n2", "JLPT N2 / BJT 400+"], ["n1", "JLPT N1 / BJT 480+"]], pointsKey: "japanese", proof: "JLPT / BJT certificate", note: "N2 may not stack with overlapping education claims." },
  { group: "Language & university", id: "japanUniversity", label: "Graduated from a Japanese university", vi: "Tốt nghiệp đại học tại Nhật", kind: "select", max: 10, options: yesNoOptions, pointsKey: "japanUniversity", proof: "Degree certificate", note: "Only overlaps with JICA training that used Japanese university classes." },
  { group: "Language & university", id: "foreignJapaneseMajor", label: "Foreign university Japanese major", vi: "Chuyên ngành tiếng Nhật tại đại học nước ngoài", kind: "select", max: 15, options: yesNoOptions, pointsKey: "foreignJapaneseMajor", proof: "Transcript / degree certificate", note: "Shares the Japanese-language award with N1." },
  { group: "Language & university", id: "universityBonus", label: "Qualifying university category", vi: "Nhóm trường đại học đủ điều kiện", kind: "select", max: 10, options: [[0, "None / Không"], [10, "Top 300 / SGU category"]], pointsKey: "universityBonus", proof: "Degree certificate and official list", note: "University categories are capped at 10 points." },
  { group: "Language & university", id: "innovativeAsiaUniversity", label: "Innovative Asia partner university", vi: "Trường đối tác Innovative Asia", kind: "university", max: 10, pointsKey: "innovativeAsia", proof: "Degree certificate + graduation date", note: "Search and select a school from the official MOJ partner list." },
  { group: "Employer & innovation", id: "innovationSupport", label: "Employer receives qualifying innovation support", vi: "Doanh nghiệp nhận hỗ trợ đổi mới đủ điều kiện", kind: "select", max: 10, options: yesNoOptions, pointsKey: "innovationSupport", proof: "Employer support certification", note: "The support measure must be active and qualifying." },
  { group: "Employer & innovation", id: "innovationSme", label: "Supported employer is also a qualifying SME", vi: "Doanh nghiệp hỗ trợ đồng thời là SME đủ điều kiện", kind: "select", max: 10, options: yesNoOptions, pointsKey: "innovationSme", proof: "SME and support evidence", note: "Requires the parent innovation-support claim." },
  { group: "Employer & innovation", id: "localSupport", label: "Qualifying local-government support measure", vi: "Biện pháp hỗ trợ địa phương đủ điều kiện", kind: "select", max: 10, options: yesNoOptions, pointsKey: "localSupport", proof: "Local-government certification", note: "Only designated measures count." },
  { group: "Employer & innovation", id: "smeResearch", label: "SME with R&D above 3% of revenue", vi: "SME có R&D trên 3% doanh thu", kind: "select", max: 5, options: yesNoOptions, pointsKey: "smeResearch", proof: "Financial and R&D records", note: "R&D ratio must exceed the official threshold." },
  { group: "Other additions", id: "foreignAward", label: "Recognized foreign qualification or award", vi: "Chứng chỉ hoặc giải thưởng nước ngoài được công nhận", kind: "select", max: 5, options: yesNoOptions, pointsKey: "foreignAward", proof: "Award / qualification evidence", note: "Must appear on the recognized list." },
  { group: "Other additions", id: "advancedProject", label: "Designated advanced growth-field project", vi: "Dự án tăng trưởng tiên tiến được chỉ định", kind: "select", max: 10, options: yesNoOptions, pointsKey: "advancedProject", proof: "Project designation evidence", note: "Project must be designated at the reference date." },
  { group: "Other additions", id: "jicaTraining", label: "Qualifying JICA Innovative Asia training", vi: "Đào tạo JICA Innovative Asia đủ điều kiện", kind: "select", max: 5, options: jicaTrainingOptions, pointsKey: "jicaTraining", proof: "JICA training certificate", note: "A qualifying program lasts at least one year; overlap applies only if it used Japanese university or graduate-school classes." },
  { group: "Other additions", id: "assetManagement", label: "Designated investment-management work", vi: "Công việc quản lý đầu tư được chỉ định", kind: "select", max: 10, options: yesNoOptions, pointsKey: "assetManagement", proof: "Employment / activity evidence", activities: ["b", "c"], note: "Only designated work qualifies." },
  { group: "Other additions", id: "investment", label: "Invested ¥100 million or more", vi: "Đầu tư từ 100 triệu yên", kind: "select", max: 5, options: yesNoOptions, pointsKey: "investment", proof: "Investment evidence", activities: ["c"], note: "Business-management activity only." },
];

export function getFactorDefinitions(activity) {
  return sharedDefinitions
    .filter((definition) => !definition.activities || definition.activities.includes(activity))
    .map((definition) => ({
      ...definition,
      maxPoints: typeof definition.max === "object" ? definition.max[activity] : definition.max,
      options: definition.options?.[activity] || definition.options,
    }));
}

export function parseFactorValue(definition, value) {
  if (definition.kind === "number") return Number(value);
  if (definition.id === "degree" || definition.id === "japanese" || definition.id === "jicaTraining") return value;
  if (definition.options === yesNoOptions) return value === "true";
  return Number(value);
}

export function formatFactorValue(definition, value, activity) {
  if (definition.kind === "university") return value || "Not selected";
  if (definition.id === "experience") {
    const years = Number(value || 0);
    const terminal = 7;
    return years >= terminal ? `${years}+ years` : `${years} years`;
  }
  if (definition.id === "age") {
    const age = Number(value || 0);
    if (age < 30) return `${age} · under 30`;
    if (age < 35) return `${age} · 30–34`;
    if (age < 40) return `${age} · 35–39`;
    return `${age} · 40+`;
  }
  return definition.options?.find(([optionValue]) => String(optionValue) === String(value))?.[1] || String(value ?? "");
}

export function pointRows(activity, factors, result) {
  return getFactorDefinitions(activity).map((definition) => ({
    ...definition,
    points: Number(result?.claims?.[definition.pointsKey] || 0),
    value: formatFactorValue(definition, factors[definition.id], activity),
  }));
}
