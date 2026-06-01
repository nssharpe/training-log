import { listSessions } from "./store.js";
import { sessionsToCsv, downloadCsv } from "./csv.js";
import { MOBILITY } from "../data/mobility-program.js";
import { STRENGTH } from "../data/strength-program.js";

function programLookup(programKey, exerciseKey) {
  for (const p of MOBILITY.phases) {
    if (p.id !== programKey) continue;
    return p.exercises.find((e) => e.key === exerciseKey);
  }
  for (const s of STRENGTH.splits) {
    if (s.id !== programKey) continue;
    return s.exercises.find((e) => e.key === exerciseKey);
  }
  return null;
}

function programName(tab, programKey) {
  if (tab === "mobility") return MOBILITY.phases.find((p) => p.id === programKey)?.name || programKey;
  if (tab === "strength") return STRENGTH.splits.find((s) => s.id === programKey)?.name || programKey;
  return programKey;
}

function summarize(session) {
  const entries = Object.values(session.entries || {});
  const totalSets = entries.reduce((a, e) => a + (e.sets?.length || 0), 0);
  const filledSets = entries.reduce((a, e) => a + (e.sets?.filter((s) =>
    s.reps != null || s.weight != null || s.measurement || s.checked
  ).length || 0), 0);
  return `${entries.length} exercises · ${filledSets}/${totalSets} sets logged`;
}

export async function renderHistory(container) {
  container.innerHTML = "";

  const toolbar = document.createElement("div");
  toolbar.className = "history-toolbar";

  const btnMob = document.createElement("button");
  btnMob.textContent = "↓ Export mobility CSV";
  btnMob.onclick = async () => {
    const sessions = await listSessions({ tab: "mobility", limit: 5000 });
    if (!sessions.length) return alert("No mobility sessions yet.");
    downloadCsv(`mobility-log-${new Date().toISOString().slice(0, 10)}.csv`, sessionsToCsv(sessions, programLookup));
  };

  const btnStr = document.createElement("button");
  btnStr.textContent = "↓ Export strength CSV";
  btnStr.onclick = async () => {
    const sessions = await listSessions({ tab: "strength", limit: 5000 });
    if (!sessions.length) return alert("No strength sessions yet.");
    downloadCsv(`strength-log-${new Date().toISOString().slice(0, 10)}.csv`, sessionsToCsv(sessions, programLookup));
  };

  toolbar.append(btnMob, btnStr);
  container.append(toolbar);

  const list = document.createElement("div");
  list.className = "history-list";
  container.append(list);

  const all = await listSessions({ limit: 500 });
  if (!all.length) {
    list.append(Object.assign(document.createElement("div"), {
      className: "history-empty",
      textContent: "No sessions logged yet. Enter data on the Mobility or Strength tab and it'll show up here.",
    }));
    return;
  }

  const span = (cls, text) => {
    const el = document.createElement("span");
    if (cls) el.className = cls;
    el.textContent = text;
    return el;
  };

  for (const s of all) {
    const row = document.createElement("div");
    row.className = "history-row";
    const tag = s.tab === "mobility" ? "🤸" : "💪";
    const dayBit = s.day != null ? ` · Day ${s.day}` : "";
    row.append(
      span("date", s.date || "?"),
      span(null, `${tag} ${programName(s.tab, s.programKey)}${dayBit}`),
      span("summary", summarize(s)),
    );

    // click to open this session for editing on its tab
    if (s.tab && s.programKey && s.date) {
      let hash = `#${s.tab}?p=${s.programKey}`;
      if (s.day != null) hash += `&d=${s.day}`;
      hash += `&date=${s.date}`;
      row.className = "history-row clickable";
      row.title = "Open to view / edit";
      row.append(span("edit-hint", "edit ✎"));
      row.addEventListener("click", () => { location.hash = hash; });
    }

    list.append(row);
  }
}
