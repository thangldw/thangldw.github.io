const DB_NAME = "certification-library-strict-session";
const STORE_NAME = "keys";
const KEY_ID = "jlpt-timing-hmac-v1";
const verifiedTokens = new WeakSet();
let keyPromise = null;

export function requiresJlptTimingAuthentication(certification = {}, mode = "learn") {
  return certification?.id === "jlpt" && mode === "exam";
}

export function isRestorableJlptSessionSnapshot(snapshot) {
  return snapshot?.studyMode === "study" || (snapshot?.studyMode === "exam" && Boolean(snapshot.timingAnchor));
}

export function jlptTimingVerificationBankStatus(status) {
  return status === "unavailable"
    ? { state: "error", message: "Strict-session timing verification is temporarily unavailable. Retry resume." }
    : { state: "ready", message: "" };
}

function exactAnchor(anchor) {
  const keys = ["sessionId", "certId", "rehearsalId", "membershipOrderDigest", "startedAt", "signature"];
  return anchor && typeof anchor === "object" && !Array.isArray(anchor)
    && Object.keys(anchor).length === keys.length && Object.keys(anchor).every((key) => keys.includes(key))
    && /^[A-Za-z0-9][A-Za-z0-9_-]{15,127}$/u.test(anchor.sessionId || "")
    && anchor.certId === "jlpt"
    && anchor.rehearsalId === "jlpt-language-reading-2026-07-rehearsal"
    && /^[a-f0-9]{64}$/u.test(anchor.membershipOrderDigest || "")
    && Number.isFinite(Date.parse(anchor.startedAt || ""))
    && /^[A-Za-z0-9_-]{32,128}$/u.test(anchor.signature || "");
}

function anchorPayload(anchor) {
  return new TextEncoder().encode(JSON.stringify([
    anchor.sessionId, anchor.certId, anchor.rehearsalId, anchor.membershipOrderDigest, anchor.startedAt,
  ]));
}

function encodeSignature(value) {
  let binary = "";
  for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function decodeSignature(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function openKeyDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Strict-session key database is unavailable"));
  });
}

async function loadOrCreateKey() {
  if (typeof indexedDB === "undefined") throw new Error("Strict JLPT sessions require persistent IndexedDB timing authentication");
  const database = await openKeyDatabase();
  const existing = await new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(KEY_ID);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  if (existing) return existing;
  const key = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(key, KEY_ID);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  return key;
}

function timingKey() {
  keyPromise ||= loadOrCreateKey().catch((error) => {
    keyPromise = null;
    throw error;
  });
  return keyPromise;
}

export async function createPersistedJlptTimingAnchor(certification = {}, plan = {}, startedAt = null) {
  if (certification?.id !== "jlpt" || plan?.rehearsalId !== "jlpt-language-reading-2026-07-rehearsal" || !/^[a-f0-9]{64}$/u.test(plan.membershipOrderDigest || "") || !Number.isFinite(Date.parse(startedAt || ""))) return null;
  const anchor = { sessionId: crypto.randomUUID(), certId: "jlpt", rehearsalId: plan.rehearsalId, membershipOrderDigest: plan.membershipOrderDigest, startedAt };
  const signature = encodeSignature(await crypto.subtle.sign("HMAC", await timingKey(), anchorPayload(anchor)));
  return Object.freeze({ ...anchor, signature });
}

export async function createJlptSessionTimingAuthentication(certification = {}, plan = {}, startedAt = null, mode = "learn") {
  return requiresJlptTimingAuthentication(certification, mode)
    ? createPersistedJlptTimingAnchor(certification, plan, startedAt)
    : null;
}

export async function verifyPersistedJlptTimingAnchor(anchor) {
  if (!exactAnchor(anchor)) return Object.freeze({ status: "invalid", token: null });
  let signature;
  try {
    signature = decodeSignature(anchor.signature);
  } catch {
    return Object.freeze({ status: "invalid", token: null });
  }
  try {
    const verified = await crypto.subtle.verify("HMAC", await timingKey(), signature, anchorPayload(anchor));
    if (!verified) return Object.freeze({ status: "invalid", token: null });
    const token = Object.freeze({ anchor: Object.freeze({ ...anchor }) });
    verifiedTokens.add(token);
    return Object.freeze({ status: "verified", token });
  } catch {
    return Object.freeze({ status: "unavailable", token: null });
  }
}

export function verifiedJlptTimingAnchorMatches(token, certification = {}, plan = {}) {
  const anchor = token?.anchor;
  return verifiedTokens.has(token)
    && certification?.id === anchor.certId
    && plan?.rehearsalId === anchor.rehearsalId
    && plan?.membershipOrderDigest === anchor.membershipOrderDigest;
}
