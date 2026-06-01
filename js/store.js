// Session store: localStorage (instant) + Firestore (debounced cross-device sync).
//
// Data shape — one doc per (tab, programKey, date):
//   { tab: "mobility"|"strength", programKey: "p1"|"tt-am"|..., day?: number, date: "YYYY-MM-DD",
//     entries: { [exerciseKey]: { sets: [{reps, weight, measurement, checked}], notes } },
//     updatedAt: number }

import { FIREBASE_CONFIG, isFirebaseConfigured } from "./firebase-config.js";

const LS_PREFIX = "tlog:";
const lsKey = (id) => LS_PREFIX + id;

let db = null;
let firestore = null;

async function initFirestore() {
  if (!isFirebaseConfigured()) return null;
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js");
    firestore = await import("https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js");
    const app = initializeApp(FIREBASE_CONFIG);
    db = firestore.getFirestore(app);
    return db;
  } catch (e) {
    console.warn("Firestore init failed; running localStorage-only", e);
    return null;
  }
}
const dbReady = initFirestore();

// ---------- save indicator events ----------
const indicator = document.getElementById("save-indicator");
let savedTimer = null;
function setStatus(status, text) {
  if (!indicator) return;
  indicator.className = "save-indicator " + status;
  indicator.textContent = text;
  if (status === "saved") {
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => {
      indicator.textContent = "saved ✓";
    }, 50);
  }
}
setStatus("", "");

// ---------- doc id ----------
export function docId({ tab, programKey, day, date }) {
  const parts = [tab, programKey];
  if (day != null) parts.push(`d${day}`);
  parts.push(date);
  return parts.join("__");
}

// ---------- read ----------
export async function loadSession({ tab, programKey, day, date }) {
  const id = docId({ tab, programKey, day, date });
  const local = localStorage.getItem(lsKey(id));
  const localDoc = local ? JSON.parse(local) : null;

  await dbReady;
  if (db) {
    try {
      const ref = firestore.doc(db, "sessions", id);
      const snap = await firestore.getDoc(ref);
      if (snap.exists()) {
        const remote = snap.data();
        if (!localDoc || (remote.updatedAt || 0) >= (localDoc.updatedAt || 0)) {
          localStorage.setItem(lsKey(id), JSON.stringify(remote));
          return remote;
        }
      }
    } catch (e) {
      console.warn("Firestore load failed; using local", e);
    }
  }
  return localDoc;
}

// List recent sessions for the history tab and grid history columns.
// Loads from localStorage immediately and merges Firestore results when available.
export async function listSessions({ tab, programKey, limit = 200 } = {}) {
  const out = new Map();
  // localStorage scan
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(LS_PREFIX)) continue;
    try {
      const doc = JSON.parse(localStorage.getItem(k));
      if (!doc || !doc.tab) continue;
      if (tab && doc.tab !== tab) continue;
      if (programKey && doc.programKey !== programKey) continue;
      out.set(k.slice(LS_PREFIX.length), doc);
    } catch {}
  }

  await dbReady;
  if (db) {
    try {
      const col = firestore.collection(db, "sessions");
      const filters = [];
      if (tab) filters.push(firestore.where("tab", "==", tab));
      if (programKey) filters.push(firestore.where("programKey", "==", programKey));
      const q = filters.length
        ? firestore.query(col, ...filters, firestore.orderBy("date", "desc"), firestore.limit(limit))
        : firestore.query(col, firestore.orderBy("date", "desc"), firestore.limit(limit));
      const snap = await firestore.getDocs(q);
      snap.forEach((d) => {
        const data = d.data();
        const cur = out.get(d.id);
        if (!cur || (data.updatedAt || 0) > (cur.updatedAt || 0)) {
          out.set(d.id, data);
          localStorage.setItem(lsKey(d.id), JSON.stringify(data));
        }
      });
    } catch (e) {
      console.warn("Firestore list failed; using local", e);
    }
  }
  return [...out.values()].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

// ---------- write (debounced auto-save) ----------
const pendingTimers = new Map(); // id -> timeout
const pendingDocs = new Map();   // id -> latest data

function flushNow(id) {
  const data = pendingDocs.get(id);
  if (!data) return Promise.resolve();
  pendingDocs.delete(id);
  clearTimeout(pendingTimers.get(id));
  pendingTimers.delete(id);
  return writeRemote(id, data);
}

async function writeRemote(id, data) {
  await dbReady;
  if (!db) return;
  setStatus("saving", "saving…");
  try {
    const ref = firestore.doc(db, "sessions", id);
    await firestore.setDoc(ref, data, { merge: false });
    setStatus("saved", "saved ✓");
  } catch (e) {
    console.warn("Firestore write failed", e);
    setStatus("error", "offline · local only");
  }
}

export function saveSession(meta, data) {
  const id = docId(meta);
  const doc = { ...meta, ...data, updatedAt: Date.now() };
  // localStorage: instant, synchronous
  localStorage.setItem(lsKey(id), JSON.stringify(doc));
  if (!isFirebaseConfigured()) {
    setStatus("saved", "local ✓");
    return;
  }
  // Firestore: debounce
  setStatus("saving", "saving…");
  pendingDocs.set(id, doc);
  clearTimeout(pendingTimers.get(id));
  pendingTimers.set(id, setTimeout(() => flushNow(id), 600));
}

// ---------- delete ----------
export async function deleteSession(metaOrId) {
  const id = typeof metaOrId === "string" ? metaOrId : docId(metaOrId);
  localStorage.removeItem(lsKey(id));
  // cancel any pending write for this doc
  clearTimeout(pendingTimers.get(id));
  pendingTimers.delete(id);
  pendingDocs.delete(id);
  await dbReady;
  if (db) {
    setStatus("saving", "deleting…");
    try {
      await firestore.deleteDoc(firestore.doc(db, "sessions", id));
      setStatus("saved", "deleted ✓");
    } catch (e) {
      console.warn("Firestore delete failed", e);
      setStatus("error", "offline · local only");
    }
  }
}

// flush on tab hide / unload
function flushAll() {
  for (const id of [...pendingDocs.keys()]) flushNow(id);
}
window.addEventListener("visibilitychange", () => { if (document.hidden) flushAll(); });
window.addEventListener("beforeunload", flushAll);
window.addEventListener("pagehide", flushAll);
