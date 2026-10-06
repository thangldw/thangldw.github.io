import { PolicyOverview, FilingNotes } from "./components/PolicyOverview";
import { useMemo, useState } from "react";
import {
  ActivityCards,
  ApplicationPlanScreen,
  CalculatorHeader,
  ClaimsScreen,
  FactorTable,
  HistoricalScreen,
  RequirementsScreen,
  ScoreInspector,
  SourceFooter,
  StepProgress,
} from "./components/ScoreCalculator";
import {
  ASSESSMENT_DATE,
  calculateHistoricalScenario,
  deriveHistoricalFactors,
  historicalReferenceForRoute,
} from "./domain/historical";
import { calculateScore, toScoringInput } from "./domain/scoring";
import {
  initialFactors,
  parseFactorValue,
} from "./scoreDefinitions";

const initialActivity = "b";
const initialResult = calculateScore(
  toScoringInput({ ...initialFactors, activity: initialActivity }),
);
const initialReference = historicalReferenceForRoute(initialResult.route);
const initialHistoricalFactors = deriveHistoricalFactors(
  initialFactors,
  initialReference?.years || 0,
);

export function App() {
  const [assessmentDate, setAssessmentDate] = useState(ASSESSMENT_DATE);
  const [activity, setActivity] = useState(initialActivity);
  const [factors, setFactors] = useState(initialFactors);
  const [historicalFactors, setHistoricalFactors] = useState(
    initialHistoricalFactors,
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [requirements, setRequirements] = useState({});
  const [evidenceReady, setEvidenceReady] = useState({});
  const [proofReady, setProofReady] = useState({});

  const currentResult = useMemo(
    () => calculateScore(toScoringInput({ ...factors, activity })),
    [activity, factors],
  );

  const historicalScenario = useMemo(
    () =>
      calculateHistoricalScenario({
        activity,
        factors,
        historicalFactors,
        route: currentResult.route,
        today: assessmentDate,
      }),
    [activity, assessmentDate, currentResult.route, factors, historicalFactors],
  );

  function resetHistorical(nextActivity, nextFactors) {
    const nextResult = calculateScore(
      toScoringInput({ ...nextFactors, activity: nextActivity }),
    );
    const reference = historicalReferenceForRoute(nextResult.route, assessmentDate);
    setHistoricalFactors(
      deriveHistoricalFactors(nextFactors, reference?.years || 0),
    );
  }

  function updateFactor(definition, value) {
    const parsed = parseFactorValue(definition, value);
    const nextFactors = { ...factors, [definition.id]: parsed };
    setFactors(nextFactors);
    resetHistorical(activity, nextFactors);
  }

  function updateUniversity(name) {
    const nextFactors = {
      ...factors,
      innovativeAsiaManual: Boolean(name),
      innovativeAsiaUniversity: name,
    };
    setFactors(nextFactors);
    resetHistorical(activity, nextFactors);
  }

  function updateHistoricalFactor(definition, value) {
    setHistoricalFactors((current) => ({
      ...current,
      [definition.id]: parseFactorValue(definition, value),
    }));
  }

  function updateHistoricalUniversity(name) {
    setHistoricalFactors((current) => ({
      ...current,
      innovativeAsiaManual: Boolean(name),
      innovativeAsiaUniversity: name,
    }));
  }

  function changeActivity(nextActivity) {
    setActivity(nextActivity);
    resetHistorical(nextActivity, factors);
  }

  function navigateToStep(step) {
    setCurrentStep(step);
    window.requestAnimationFrame(() => {
      const content = document.querySelector(".workflow-content");
      if (typeof content?.scrollIntoView === "function") {
        content.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  function toggleChecklistItem(setter, id) {
    setter((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <div className="calculator-shell" id="calculator">
      <CalculatorHeader />
      <PolicyOverview assessmentDate={assessmentDate} onDateChange={(date) => {
        setAssessmentDate(date);
        resetHistorical(activity, factors);
        setRequirements({});
        setEvidenceReady({});
        setProofReady({});
      }} />
      <StepProgress currentStep={currentStep} onNavigate={navigateToStep} />

      {currentStep === 1 ? (
        <section className="calculator-layout workflow-content">
          <div className="calculator-main">
            <ActivityCards selected={activity} onSelect={changeActivity} />
            <FactorTable
              activity={activity}
              factors={factors}
              onChange={updateFactor}
              onUniversitySelect={updateUniversity}
              result={currentResult}
            />
          </div>
          <ScoreInspector
            onContinue={() => navigateToStep(2)}
            result={currentResult}
          />
        </section>
      ) : null}

      {currentStep === 2 ? (
        <div className="workflow-content">
          <ClaimsScreen
            activity={activity}
            factors={factors}
            onBack={() => navigateToStep(1)}
            onContinue={() => navigateToStep(3)}
            onToggleProof={(id) => toggleChecklistItem(setProofReady, id)}
            proofReady={proofReady}
            result={currentResult}
          />
        </div>
      ) : null}

      {currentStep === 3 ? (
        <div className="workflow-content">
          <HistoricalScreen
            assessmentDate={assessmentDate}
            activity={activity}
            currentFactors={factors}
            currentResult={currentResult}
            historicalFactors={historicalFactors}
            historicalResult={historicalScenario.result}
            meetsThreshold={historicalScenario.meetsThreshold}
            onBack={() => navigateToStep(2)}
            onContinue={() => navigateToStep(4)}
            onHistoricalChange={updateHistoricalFactor}
            onHistoricalUniversitySelect={updateHistoricalUniversity}
            onToggleProof={(id) => toggleChecklistItem(setProofReady, id)}
            proofReady={proofReady}
            reference={historicalScenario.reference}
          />
        </div>
      ) : null}

      {currentStep === 4 ? (
        <div className="workflow-content">
          <FilingNotes assessmentDate={assessmentDate} />
          <RequirementsScreen
            confirmations={requirements}
            onBack={() => navigateToStep(3)}
            onContinue={() => navigateToStep(5)}
            onToggle={(id) => toggleChecklistItem(setRequirements, id)}
            result={currentResult}
          />
        </div>
      ) : null}

      {currentStep === 5 ? (
        <div className="workflow-content">
          <FilingNotes assessmentDate={assessmentDate} />
          <ApplicationPlanScreen
            evidenceReady={evidenceReady}
            onBack={() => navigateToStep(4)}
            onToggle={(id) => toggleChecklistItem(setEvidenceReady, id)}
            result={currentResult}
          />
        </div>
      ) : null}

      <SourceFooter />
      <a className="app-explore-link" href="/apps/">Explore more apps →</a>
    </div>
  );
}
