import { normalizeTimedEvidenceIdentity } from "./timed-evidence-identity.js";
import { sanitizeBjtPersistedState } from "./bjt-session-boundary.js";
import { sanitizeHskPersistedState } from "./hsk-session-boundary.js";

export const STORAGE_KEY = "thangldw:apps:certification-library:state:v3";

export const MIGRATION_SOURCE_KEYS = [
  "thangldw:apps:cert:progress:v2",
  "thangldw:apps:cert:progress:v1",
  "cert-ready-progress",
];

function normalizeStoredSessionEvidence(state) {
  const sessions = state?.sessions;
  if (!sessions || typeof sessions !== "object" || Array.isArray(sessions)) return state;
  const normalized = Object.fromEntries(Object.entries(sessions).map(([certId, entries]) => [
    certId,
    Array.isArray(entries)
      ? entries.map((entry) => normalizeTimedEvidenceIdentity(entry, certId))
      : entries,
  ]));
  return { ...state, sessions: normalized };
}

export function readStoredStateWithHealth(storage) {
  try {
    for (const key of [STORAGE_KEY, ...MIGRATION_SOURCE_KEYS]) {
      const serialized = storage.getItem(key);
      if (!serialized) continue;
      try {
        const parsed = JSON.parse(serialized);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return { state: sanitizeHskPersistedState(sanitizeBjtPersistedState(normalizeStoredSessionEvidence(parsed))), health: { status: "available", operation: "read" } };
        }
      } catch {
        // Continue to the next migration source when one stored payload is malformed.
      }
    }
    return { state: {}, health: { status: "available", operation: "read" } };
  } catch {
    return { state: {}, health: { status: "unavailable", operation: "read" } };
  }
}

export function readStoredState(storage) {
  return readStoredStateWithHealth(storage).state;
}

export function writeStoredState(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    MIGRATION_SOURCE_KEYS.forEach((key) => storage.removeItem(key));
    return { ok: true, health: { status: "available", operation: "write" } };
  } catch {
    return { ok: false, health: { status: "unavailable", operation: "write" } };
  }
}
