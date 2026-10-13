import { isValidJlptStrictAssistancePolicy, JLPT_STRICT_ASSISTANCE_POLICY } from "./jlpt-delivery.js";

const FP2_TIMED_EVIDENCE_KIND = "selectable-academic";
const IPA_TIMED_EVIDENCE_KIND = "subject-a-selectable";
const IPA_TIMED_CERTIFICATIONS = new Set(["db", "nw", "sc"]);
const JLPT_REHEARSAL_ID = "jlpt-language-reading-2026-07-rehearsal";
const JLPT_REHEARSAL_DIGEST = "a444ae6fe21551f369a6a854a91df616af0a437ca114d7135a10289f0208592c";
const JLPT_REHEARSAL_ORDER_DIGEST = "a444ae6fe21551f369a6a854a91df616af0a437ca114d7135a10289f0208592c";

function certificationId(certification) {
  return typeof certification === "string" ? certification : certification?.id;
}

export function hasPinnedTimedEvidenceIdentity(session = {}, certification = null) {
  const id = certificationId(certification);
  if (session.strategy !== "timed-section") return true;
  if (id === "jlpt") {
    return session.evidenceKind === "section-rehearsal"
      && session.rehearsalId === JLPT_REHEARSAL_ID
      && session.membershipDigest === JLPT_REHEARSAL_DIGEST
      && session.membershipOrderDigest === JLPT_REHEARSAL_ORDER_DIGEST
      && session.durationMinutes === 110
      && session.fullMockEvidenceEligible === false
      && session.timedFullExamEvidenceEligible === false
      && isValidJlptStrictAssistancePolicy(session.assistancePolicy);
  }
  if (id === "ap" || IPA_TIMED_CERTIFICATIONS.has(id) || id === "fp2") return false;
  return true;
}

export function normalizeTimedEvidenceIdentity(session = {}, certification = null) {
  const id = certificationId(certification);
  if (session.strategy !== "timed-section") return session;
  if (id === "jlpt") {
    const identityValid = hasPinnedTimedEvidenceIdentity(session, certification);
    const hasCompletionCounts = Object.hasOwn(session, "questionCount")
      || Object.hasOwn(session, "attemptedCount")
      || Object.hasOwn(session, "correctCount")
      || Object.hasOwn(session, "accuracyPercent");
    const countsValid = !hasCompletionCounts || (
      Number.isInteger(session.questionCount)
      && session.questionCount === 50
      && Number.isInteger(session.attemptedCount)
      && session.attemptedCount >= 0
      && session.attemptedCount <= session.questionCount
      && Number.isInteger(session.correctCount)
      && session.correctCount >= 0
      && session.correctCount <= session.attemptedCount
      && session.accuracyPercent === Math.round((session.correctCount / session.questionCount) * 100)
    );
    return {
      ...session,
      evidenceEligible: identityValid && countsValid && session.evidenceEligible !== false,
      evidenceKind: "section-rehearsal",
      rehearsalId: JLPT_REHEARSAL_ID,
      membershipDigest: JLPT_REHEARSAL_DIGEST,
      membershipOrderDigest: JLPT_REHEARSAL_ORDER_DIGEST,
      durationMinutes: 110,
      fullMockEvidenceEligible: false,
      timedFullExamEvidenceEligible: false,
      assistancePolicy: JLPT_STRICT_ASSISTANCE_POLICY,
    };
  }
  if (id === "ap" || IPA_TIMED_CERTIFICATIONS.has(id)) {
    return {
      ...session,
      evidenceEligible: false,
      evidenceKind: IPA_TIMED_EVIDENCE_KIND,
      subjectBFormatEvidenceEligible: false,
    };
  }
  if (id !== "fp2") return session;
  return {
    ...session,
    evidenceEligible: false,
    evidenceKind: FP2_TIMED_EVIDENCE_KIND,
    practicalFormatEvidenceEligible: false,
  };
}
