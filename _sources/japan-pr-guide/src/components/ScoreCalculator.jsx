import { formatReferenceDate } from "../domain/historical";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  BookOpen,
  Briefcase,
  CalendarBlank,
  CaretDown,
  Check,
  CheckCircle,
  Circle,
  Clock,
  Code,
  CurrencyJpy,
  FileText,
  GraduationCap,
  Info,
  MagnifyingGlass,
  ShieldCheck,
  UserFocus,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import {
  INNOVATIVE_ASIA_SOURCE,
  searchInnovativeAsiaUniversities,
} from "../data/innovativeAsia";
import {
  formatFactorValue,
  getFactorDefinitions,
  pointRows,
} from "../scoreDefinitions";

export const activities = [
  { id: "a", title: "Academic research", vi: "Nghiên cứu học thuật", description: "Research, research guidance or education under a contract with a Japanese organization.", Icon: BookOpen },
  { id: "b", title: "Specialized / technical", vi: "Chuyên môn / kỹ thuật", description: "Specialized or technical work requiring advanced professional knowledge.", Icon: Code },
  { id: "c", title: "Business management", vi: "Kinh doanh / quản lý", description: "Business management of an organization in Japan.", Icon: Briefcase },
];

const steps = [
  ["Calculate score", "Estimate your HSP score"],
  ["Review claims", "Check your claims & proof"],
  ["Verify historical score", "Route-specific recalculation"],
  ["PR requirements", "What you must prove"],
  ["Application plan", "Your next steps"],
];

const warningCopy = {
  innovationDependency: "The supported-SME addition requires a qualifying employer innovation-support claim.",
  jicaOverlap: "JICA training that used Japanese university or graduate-school classes cannot be combined with Japanese-university graduation points.",
  multipleDegreeDependency: "Multiple-degree points require at least one qualifying master's, doctorate, MBA, or MOT degree.",
  n2Overlap: "JLPT N2 points cannot be combined with overlapping Japanese-language education claims.",
};

const iconByFactor = {
  age: CalendarBlank,
  assetManagement: Briefcase,
  advancedProject: Briefcase,
  degree: GraduationCap,
  experience: UserFocus,
  foreignAward: GraduationCap,
  foreignJapaneseMajor: BookOpen,
  income: CurrencyJpy,
  innovationSme: Briefcase,
  innovationSupport: Briefcase,
  innovativeAsiaUniversity: GraduationCap,
  investment: CurrencyJpy,
  japanUniversity: GraduationCap,
  japanese: BookOpen,
  jicaTraining: BookOpen,
  localSupport: Briefcase,
  multipleDegrees: GraduationCap,
  position: Briefcase,
  qualificationCount: Code,
  researchCount: BookOpen,
  smeResearch: Briefcase,
  universityBonus: GraduationCap,
};

export function CalculatorHeader() {
  return (
    <header className="app-header">
      <a className="app-brand" href="#calculator" aria-label="Japan PR Guide home">
        <img src={`${import.meta.env.BASE_URL}assets/jpg-mark.png`} alt="" />
        <strong>Japan PR Guide</strong>
      </a>
      <div className="header-actions">
        <a href="#official-updates">Official sources <ArrowSquareOut size={15} /></a>
      </div>
    </header>
  );
}

export function StepProgress({ currentStep, onNavigate }) {
  return (
    <nav className="workflow-steps" aria-label="Permanent residence assessment steps">
      {steps.map(([label, helper], index) => {
        const step = index + 1;
        const state = currentStep === step ? "active" : currentStep > step ? "complete" : "";
        return (
          <button className={state} disabled={step > currentStep} key={label} onClick={() => onNavigate?.(step)} type="button">
            <span>{state === "complete" ? <Check size={15} weight="bold" /> : step}</span>
            <span><strong>{label}</strong><small>{helper}</small></span>
          </button>
        );
      })}
    </nav>
  );
}

export function ActivityCards({ selected, onSelect }) {
  return (
    <section className="activity-section" aria-labelledby="activity-title">
      <div className="section-heading"><div><h2 id="activity-title">Choose your HSP activity</h2><p>Chọn loại hoạt động HSP · Hồ sơ mẫu; thay bằng thông tin của bạn.</p></div><span>Step 1 of 5</span></div>
      <div className="activity-grid">
        {activities.map(({ id, title, vi, description, Icon }) => (
          <button aria-pressed={selected === id} className={selected === id ? "selected" : ""} key={id} onClick={() => onSelect(id)} type="button">
            <Icon size={30} />
            <strong>{title}</strong>
            <span>{vi}</span>
            <p>{description}</p>
            {selected === id ? <CheckCircle className="selected-check" size={23} weight="fill" /> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

export function UniversitySearch({ onSelect, selected, variant = "current" }) {
  const [query, setQuery] = useState(selected || "");
  const results = useMemo(() => searchInnovativeAsiaUniversities(query), [query]);

  useEffect(() => setQuery(selected || ""), [selected]);

  return (
    <div className={`university-search ${variant}`}>
      <label className="search-input">
        <MagnifyingGlass size={17} />
        <input
          aria-autocomplete="list"
          aria-expanded={Boolean(query && query !== selected && results.length)}
          aria-controls={`${variant}-university-results`}
          aria-label="Search Innovative Asia partner university"
          role="combobox"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query ? <button aria-label="Clear university search" onClick={() => { setQuery(""); onSelect(""); }} type="button"><X size={15} /></button> : null}
      </label>
      {query && query !== selected && results.length ? (
        <div className="university-results" id={`${variant}-university-results`} role="listbox">
          {results.map((entry) => (
            <button key={entry.name} onClick={() => { onSelect(entry.name); setQuery(entry.name); }} role="option" type="button">
              <span><strong>{entry.name}</strong><small>{entry.country} · Innovative Asia</small></span><b>+10</b>
            </button>
          ))}
        </div>
      ) : null}
      {selected ? (
        <div className="selected-university"><CheckCircle size={18} weight="fill" /><span><strong data-selected-university>{selected}</strong><small>Innovative Asia · official MOJ list</small></span><b>+10 pts</b></div>
      ) : <p className="university-empty">Search the official partner list to claim this addition.</p>}
      {selected === "Bangladesh University of Engineering & Technology (BUET)" && <p className="university-source-note">MOFA lists BUET; the ISA PDF uses イスラム・バングラデシュ工科大学. Confirm the exact institution with ISA before claiming this bonus. / Tên trường Bangladesh khác giữa hai nguồn; cần xác nhận trước khi cộng điểm.</p>}
      <a href={INNOVATIVE_ASIA_SOURCE.url} target="_blank" rel="noreferrer">ISA partner list · checked {INNOVATIVE_ASIA_SOURCE.reviewed} <ArrowSquareOut size={13} /></a>
    </div>
  );
}

function FactorControl({ activity, definition, factors, onChange, variant = "current" }) {
  const value = definition.kind === "university" ? factors.innovativeAsiaUniversity : factors[definition.id];
  if (definition.kind === "university") {
    return <UniversitySearch onSelect={(name) => onChange(definition, name)} selected={value} variant={variant} />;
  }
  if (definition.kind === "number") {
    return <span className="number-wrap"><input aria-label={definition.label} className="factor-number" min={definition.min} onChange={(event) => onChange(definition, event.target.value)} type="number" value={value} />{definition.id === "experience" ? <span>years</span> : null}</span>;
  }
  return (
    <span className="select-wrap">
      <select aria-label={definition.label} onChange={(event) => onChange(definition, event.target.value)} value={String(value)}>
        {definition.options.map(([optionValue, label]) => <option key={String(optionValue)} value={String(optionValue)}>{label}</option>)}
      </select>
      <CaretDown size={14} />
    </span>
  );
}

export function FactorTable({ activity, factors, onChange, onUniversitySelect, result }) {
  const definitions = getFactorDefinitions(activity);
  let currentGroup = "";
  return (
    <section className="factor-section" aria-labelledby="factor-title">
      <div className="factor-title-row">
        <div><h2 id="factor-title">Calculate your HSP score</h2><p>Toàn bộ hạng mục tính điểm theo hoạt động đã chọn</p></div>
        <a href="https://www.moj.go.jp/isa/content/001398882.pdf" target="_blank" rel="noreferrer">MOJ points table <ArrowSquareOut size={14} /></a>
      </div>
      <div className="factor-table-head"><span>Scoring criterion</span><span>Your answer</span><span>Maximum</span><span>Points now</span><span>Proof to prepare</span></div>
      <div className="factor-table">
        {definitions.map((definition) => {
          const Icon = iconByFactor[definition.id] || Circle;
          const groupChanged = currentGroup !== definition.group;
          currentGroup = definition.group;
          return (
            <div className="factor-block" key={definition.id}>
              {groupChanged ? <h3>{definition.group}</h3> : null}
              <div className="factor-row">
                <span className="factor-label"><i><Icon size={20} /></i><span><strong>{definition.label}</strong><small>{definition.vi}</small><em>{definition.note}</em></span></span>
                <FactorControl activity={activity} definition={definition} factors={factors} onChange={definition.kind === "university" ? (_, value) => onUniversitySelect(value) : onChange} />
                <strong className="max-points">{definition.maxPoints} pts</strong>
                <strong className={result.claims[definition.pointsKey] ? "awarded-points active" : "awarded-points"}>{result.claims[definition.pointsKey] || 0} pts</strong>
                <span className="proof-copy">{definition.proof}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function routeCopy(result) {
  if (result.hardStops.length) return { en: "Minimum remuneration not met", vi: "Chưa đạt điều kiện lương tối thiểu" };
  if (result.route === "hsp80") return { en: "Potential 1-year PR route", vi: "Lộ trình PR 1 năm tiềm năng" };
  if (result.route === "hsp70") return { en: "Potential 3-year PR route", vi: "Lộ trình PR 3 năm tiềm năng" };
  return { en: `${Math.max(0, 70 - result.score)} points to the 3-year route`, vi: "Cần thêm điểm để đánh giá lộ trình HSP" };
}

export function ScoreInspector({ onContinue, result }) {
  const copy = routeCopy(result);
  return (
    <aside className="score-inspector">
      <div className="score-inspector-inner">
        <h2>Your estimated HSP score</h2><p>Điểm HSP ước tính hiện tại</p>
        <div className="live-score"><strong data-live-score>{result.score}</strong><span> points</span></div>
        <div className="threshold-line"><span style={{ width: `${Math.min(result.score, 100)}%` }} /><i style={{ left: `${Math.min(result.score, 100)}%` }} /><b className="at-70">70</b><b className="at-80">80</b></div>
        <div className="threshold-copy"><span><strong>70 points</strong><small>3-year route</small></span><span><strong>80 points</strong><small>1-year route</small></span></div>
        <div className={`route-callout ${result.route || "none"}`}><strong>{copy.en}</strong><span>{copy.vi}</span></div>
        {result.warnings.length ? <ul className="score-warnings">{result.warnings.map((warning) => <li key={warning}>{warningCopy[warning] || "Review this scoring dependency."}</li>)}</ul> : null}
        <p className="guidance-note"><Info size={18} />Point thresholds open a potential assessment route; they do not determine PR eligibility.</p>
        <button className="primary-button" onClick={onContinue} type="button">Review score claims <ArrowRight size={18} /></button>
      </div>
    </aside>
  );
}

function ProofCoverage({ proofReady, rows }) {
  const active = rows.filter((row) => row.points > 0);
  const ready = active.filter((row) => proofReady[row.id]).length;
  return { active, ready, total: active.length };
}

export function ClaimsScreen({ activity, factors, onBack, onContinue, onToggleProof, proofReady, result }) {
  const rows = pointRows(activity, factors, result);
  const coverage = ProofCoverage({ proofReady, rows });
  return (
    <section className="claims-screen">
      <section className="screen-summary compact">
        <div><h1>Review score claims</h1><p>Kiểm tra từng hạng mục điểm và bằng chứng cần chuẩn bị</p></div>
        <div><small>Estimated HSP score at filing</small><strong>{result.score}</strong><span>points</span></div>
        <div><small>Selected route</small><strong>{result.route === "hsp80" ? "80+ points" : result.route === "hsp70" ? "70–79 points" : "Below 70"}</strong><span>{routeCopy(result).en}</span></div>
        <div><small>Proof coverage</small><strong>{coverage.ready} of {coverage.total}</strong><span>active claims documented</span></div>
      </section>
      <section className="claims-ledger">
        <header><h2>All scoring items</h2><p>Evidence status does not change the HSP point total.</p></header>
        <div className="claims-table-head"><span>Scoring item</span><span>Selected value</span><span>Maximum</span><span>Points</span><span>Proof coverage</span></div>
        {rows.map((row) => (
          <div className="claim-row" key={row.id}>
            <span><strong>{row.label}</strong><small>{row.vi}</small></span>
            <span>{row.value}</span><b>{row.maxPoints}</b><b className={row.points ? "active" : ""}>{row.points}</b>
            {row.points ? <label><input checked={Boolean(proofReady[row.id])} onChange={() => onToggleProof(row.id)} type="checkbox" /><span>{proofReady[row.id] ? "Documented" : row.proof}</span></label> : <span className="not-claimed">Not claimed</span>}
          </div>
        ))}
      </section>
      <div className="screen-actions"><button className="secondary-button" onClick={onBack} type="button"><ArrowLeft size={18} />Edit calculator</button><button className="primary-button" disabled={!result.route} onClick={onContinue} type="button">Continue to historical score <ArrowRight size={18} /></button></div>
    </section>
  );
}

function RouteChecklist({ coverage, historicalResult, meetsThreshold, reference, route }) {
  return (
    <aside className="route-checklist">
      <h2>Route checklist</h2><p>{route === "hsp80" ? "HSP threshold: 80+ · 1-year route" : "HSP threshold: 70+ · 3-year route"}</p>
      <ol>
        <li className="complete"><Check size={17} weight="bold" /><span><strong>Score now (today)</strong><small>Current threshold met</small></span><b>Complete</b></li>
        <li className={meetsThreshold ? "progress" : "warning"}><Clock size={18} /><span><strong>Historical score ({reference.label})</strong><small>{historicalResult.score} points mathematically · proof {coverage.ready}/{coverage.total}</small></span><b>{meetsThreshold ? "In progress" : "Below threshold"}</b></li>
        <li><Circle size={19} /><span><strong>Public duties</strong><small>Taxes, pension, insurance and notifications</small></span><b>Not started</b></li>
        <li><FileText size={19} /><span><strong>Documents checklist</strong><small>Prepare route-specific application evidence</small></span><b>Not started</b></li>
      </ol>
      <div className="potential-note"><WarningCircle size={25} /><strong>Potential route—final eligibility depends on PR requirements and official review.</strong></div>
    </aside>
  );
}

export function HistoricalScreen({
  assessmentDate,
  activity,
  currentFactors,
  currentResult,
  historicalFactors,
  historicalResult,
  meetsThreshold,
  onBack,
  onContinue,
  onHistoricalChange,
  onHistoricalUniversitySelect,
  onToggleProof,
  proofReady,
  reference,
}) {
  if (!reference || !historicalResult) {
    return <section className="historical-empty"><h1>Historical verification starts after you reach 70 points</h1><p>Return to the calculator and review the scoring items.</p><button className="primary-button" onClick={onBack} type="button">Back to score claims</button></section>;
  }
  const currentRows = pointRows(activity, currentFactors, currentResult);
  const historicalRows = pointRows(activity, historicalFactors, historicalResult);
  const coverage = ProofCoverage({ proofReady, rows: currentRows });
  return (
    <section className="historical-screen">
      <section className="historical-summary">
        <div className="summary-title"><h1>Route-Specific Historical Recalculation</h1><p>Recalculate each factor as of the historical checkpoint date to verify the potential route.</p></div>
        <div><small>Official estimated<br />HSP score at filing</small><strong>{currentResult.score}</strong><span> points</span></div>
        <div><small>Selected route</small><strong>{currentResult.route === "hsp80" ? "80+ points" : "70–79 points"}</strong><span>{routeCopy(currentResult).en}</span></div>
        <div><small>Required checkpoint</small><strong data-required-threshold>{reference.threshold}+ points</strong><span>on <b data-historical-date>{reference.label}</b></span></div>
        <div><small>Proof coverage</small><strong>{coverage.ready} of {coverage.total}</strong><span>claims documented</span></div>
      </section>
      <div className="historical-layout">
        <section className="historical-workspace">
          <div className="route-selector">
            <button aria-pressed={currentResult.route === "hsp70"} className={currentResult.route === "hsp70" ? "selected" : ""} disabled={currentResult.route !== "hsp70"} type="button"><span><i />3-year PR route (70–79 points)<small>Checkpoint: 70+ points three years before filing</small></span><b>{currentResult.route === "hsp70" ? "Selected" : "Unavailable"}</b></button>
            <button aria-pressed={currentResult.route === "hsp80"} className={currentResult.route === "hsp80" ? "selected" : ""} disabled={currentResult.route !== "hsp80"} type="button"><span><i />1-year PR route (80+ points)<small>{currentResult.route === "hsp80" ? `Checkpoint: 80+ points on ${reference.label}` : `You need ${Math.max(0, 80 - currentResult.score)} more points today`}</small></span><b>{currentResult.route === "hsp80" ? "Selected" : "Unavailable"}</b></button>
          </div>
          <div className="reference-logic"><Info size={22} /><p><strong>Reference-date logic:</strong> scores use your status on each specific date—age on that date, experience accumulated by then, remuneration contracted then, and only qualifications already obtained.</p></div>
          <div className="history-table-wrap">
            <table className="history-table">
              <thead><tr><th>Factor<br /><small>MOJ scoring item</small></th><th>Maximum</th><th colSpan="3" className="today-head">Assessment · {formatReferenceDate(assessmentDate)}</th><th colSpan="3" className="history-head">{reference.years} year{reference.years > 1 ? "s" : ""} ago · {reference.label}</th><th>Notes</th></tr><tr><th /><th>points</th><th>Your value</th><th>Points</th><th>Proof</th><th>Your value</th><th>Points</th><th>Proof</th><th /></tr></thead>
              <tbody>
                {currentRows.map((row, index) => {
                  const historicalRow = historicalRows[index];
                  const definition = getFactorDefinitions(activity)[index];
                  return (
                    <tr key={row.id}>
                      <th scope="row"><strong>{index + 1}. {row.label}</strong><small>{row.vi}</small></th>
                      <td>{row.maxPoints}</td>
                      <td>{row.value}</td><td className="score-cell">{row.points}</td><td>{row.points ? <span className={proofReady[row.id] ? "proof-ready" : "proof-needed"}>{proofReady[row.id] ? <CheckCircle size={16} weight="fill" /> : <WarningCircle size={16} />} {proofReady[row.id] ? "Documented" : "Proof needed"}</span> : "—"}</td>
                      <td className="historical-control"><FactorControl activity={activity} definition={definition} factors={historicalFactors} onChange={definition.kind === "university" ? (_, value) => onHistoricalUniversitySelect(value) : onHistoricalChange} variant="historical" /></td>
                      <td className="score-cell">{historicalRow.points}</td><td>{historicalRow.points ? <span className={proofReady[row.id] ? "proof-ready" : "proof-needed"}>{proofReady[row.id] ? <CheckCircle size={16} weight="fill" /> : <WarningCircle size={16} />} {proofReady[row.id] ? "Documented" : "Proof needed"}</span> : "—"}</td>
                      <td>{row.note}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr><th>Total points</th><td /><td colSpan="3"><strong data-current-total>{currentResult.score}</strong></td><td colSpan="3"><strong data-historical-total>{historicalResult.score}</strong></td><td /></tr></tfoot>
            </table>
          </div>
          <div className={meetsThreshold ? "history-result success" : "history-result warning"}><Info size={18} /><span>Your historical score is mathematically <strong>{historicalResult.score}</strong>. {meetsThreshold ? `It meets the ${reference.threshold}-point checkpoint; confirm supporting evidence next.` : `It is below the ${reference.threshold}-point checkpoint.`}</span></div>
        </section>
        <div className="historical-rail"><RouteChecklist coverage={coverage} historicalResult={historicalResult} meetsThreshold={meetsThreshold} reference={reference} route={currentResult.route} /><button className="primary-button" onClick={onContinue} type="button">Confirm historical evidence <ArrowRight size={18} /></button><button className="secondary-button" onClick={onBack} type="button">Back to score claims</button></div>
      </div>
    </section>
  );
}

const prRequirements = [
  ["conduct", "Good conduct and no serious legal or immigration issues", "Hạnh kiểm tốt và không có vấn đề nghiêm trọng"],
  ["livelihood", "Stable livelihood based on assets, skills, or household support", "Sinh kế ổn định"],
  ["publicDuties", "Taxes, pension, health insurance, and notifications completed correctly and on time", "Thuế, lương hưu, bảo hiểm và thông báo đúng hạn"],
  ["continuousStay", "Continuous stay in Japan for the applicable 1-year or 3-year HSP period", "Cư trú liên tục trong thời gian HSP tương ứng"],
  ["periodOfStay", "Current period of stay satisfies the MOJ permanent-residence guideline", "Thời hạn cư trú đáp ứng hướng dẫn MOJ"],
  ["historicalScore", "Required HSP score is evidenced at filing and the reference date; review the entire qualifying period", "Chứng minh điểm ở hai mốc; rà soát toàn bộ thời gian đủ điều kiện"],
];

const evidenceItems = [
  ["application", "Permanent residence application form", "Đơn xin vĩnh trú"],
  ["photo", "Photograph (4 cm × 3 cm)", "Ảnh 4 cm × 3 cm"],
  ["reasons", "Statement of reasons and Japanese translation if required", "Bản trình bày lý do"],
  ["residentRecord", "Household resident record", "Jūminhyō của toàn hộ"],
  ["occupation", "Employment or occupation proof", "Bằng chứng việc làm"],
  ["incomeTax", "Income and residence-tax certificates", "Chứng nhận thu nhập và thuế"],
  ["taxPayment", "Proof that required taxes were paid on time", "Bằng chứng nộp thuế đúng hạn"],
  ["pension", "Pension coverage and payment records", "Hồ sơ lương hưu"],
  ["healthInsurance", "Health-insurance coverage and payment records", "Hồ sơ bảo hiểm y tế"],
  ["currentPoints", "Current HSP points calculation table", "Bảng điểm HSP hiện tại"],
  ["historicalPoints", "HSP calculation at the historical reference date", "Bảng điểm HSP tại ngày lịch sử"],
  ["pointsEvidence", "Evidence supporting every claimed HSP point", "Bằng chứng cho từng điểm"],
  ["identity", "Passport and residence card", "Hộ chiếu và thẻ cư trú"],
  ["guarantor", "Letter of guarantee and guarantor identification", "Giấy bảo lãnh"],
];

export function RequirementsScreen({ confirmations, onBack, onContinue, onToggle, result }) {
  const confirmedCount = prRequirements.filter(([id]) => confirmations[id]).length;
  return (
    <section className="check-screen">
      <button className="back-link" onClick={onBack} type="button"><ArrowLeft size={18} />Back to historical score</button>
      <div className="check-heading"><div><h1>PR requirements</h1><p>Yêu cầu vĩnh trú</p></div><div><strong>{confirmedCount} of {prRequirements.length} confirmed</strong><span>{routeCopy(result).en}</span></div></div>
      <p className="check-intro">Confirm the non-score conditions that apply to your route. This is a planning self-check, not a legal determination.</p>
      <div className="requirements-list">{prRequirements.map(([id, label, vi]) => <label key={id}><input checked={Boolean(confirmations[id])} onChange={() => onToggle(id)} type="checkbox" /><span><strong>{label}</strong><small>{vi}</small></span></label>)}</div>
      <div className="screen-actions"><a href="https://www.moj.go.jp/isa/applications/resources/nyukan_nyukan50.html" target="_blank" rel="noreferrer">Read the MOJ PR guideline · before Apr 2027 <ArrowSquareOut size={14} /></a><button className="primary-button" onClick={onContinue} type="button">Continue to application plan <ArrowRight size={18} /></button></div>
    </section>
  );
}

export function ApplicationPlanScreen({ evidenceReady, onBack, onToggle, result }) {
  const ready = evidenceItems.filter(([id]) => evidenceReady[id]).length;
  return (
    <section className="check-screen application-plan">
      <button className="back-link" onClick={onBack} type="button"><ArrowLeft size={18} />Back to PR requirements</button>
      <div className="check-heading"><div><h1>Application plan</h1><p>Kế hoạch hồ sơ</p></div><div><strong>{ready} of {evidenceItems.length} ready</strong><span>{routeCopy(result).en}</span></div></div>
      <p className="check-intro">Prepare the current route-specific documents and confirm the live MOJ checklist before filing.</p>
      <div className="application-grid">{evidenceItems.map(([id, label, vi], index) => <label key={id}><input checked={Boolean(evidenceReady[id])} onChange={() => onToggle(id)} type="checkbox" /><b>{index + 1}</b><span><strong>{label}</strong><small>{vi}</small></span></label>)}</div>
      <div className="screen-actions"><a href="https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00131.html" target="_blank" rel="noreferrer">Open current MOJ application checklists <ArrowSquareOut size={14} /></a></div>
    </section>
  );
}

export function SourceFooter() {
  return (
    <footer className="source-footer"><ShieldCheck size={22} /><p><strong>Guidance only, not a legal determination.</strong><span>Chỉ mang tính hướng dẫn, không phải quyết định pháp lý.</span></p><a href="https://www.moj.go.jp/isa/content/001398882.pdf" target="_blank" rel="noreferrer">MOJ points table <ArrowSquareOut size={13} /></a><a href="https://www.moj.go.jp/isa/applications/resources/nyukan_nyukan50.html" target="_blank" rel="noreferrer">PR guideline · before Apr 2027 <ArrowSquareOut size={13} /></a><a href="https://www.moj.go.jp/isa/10_00279.html" target="_blank" rel="noreferrer">Published 2027 guideline <ArrowSquareOut size={13} /></a><p><strong>Sources checked 05 Oct 2026</strong><span>Đối chiếu nguồn ngày 05/10/2026</span></p></footer>
  );
}
