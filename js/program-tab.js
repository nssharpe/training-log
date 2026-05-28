// Shared rendering for the mobility and strength tabs.
// Both follow the same shape: a "programKey" group (phase or split) with exercises;
// on mobile we render one card per exercise for the selected day/date,
// on desktop we render a wide grid (one column per recent date).

import { loadSession, saveSession, listSessions } from "./store.js";
import { startRest, parseRestSeconds, openMetronome } from "./timer.js";

const todayISO = () => new Date().toISOString().slice(0, 10);

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v != null && v !== false) e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}

// ---------- input helpers ----------
function bindAutoSave(input, onChange) {
  let t;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(onChange, 250);
  });
  input.addEventListener("blur", () => { clearTimeout(t); onChange(); });
  input.addEventListener("change", onChange);
}

function setVal(input, v) {
  if (input.type === "checkbox") input.checked = !!v;
  else input.value = v == null ? "" : v;
}
function getVal(input) {
  if (input.type === "checkbox") return input.checked;
  if (input.type === "number") return input.value === "" ? null : Number(input.value);
  return input.value || "";
}

// ---------- session data accessors ----------
function ensureEntry(session, exKey, exercise) {
  if (!session.entries) session.entries = {};
  if (!session.entries[exKey]) {
    const sets = [];
    for (let i = 0; i < exercise.defaultSets; i++) sets.push({});
    session.entries[exKey] = { sets, notes: "" };
  }
  // pad if exercise grew defaultSets
  while (session.entries[exKey].sets.length < exercise.defaultSets) {
    session.entries[exKey].sets.push({});
  }
  return session.entries[exKey];
}

// ---------- exercise card (mobile) ----------
function renderExerciseCard(exercise, session, saveMeta) {
  const entry = ensureEntry(session, exercise.key, exercise);
  const triggerSave = () => saveSession(saveMeta, { entries: session.entries });

  const rxDl = el("dl", { class: "rx-grid" });
  for (const [k, label] of [["reps", "Reps"], ["tempo", "Tempo"], ["sets", "Sets"], ["rest", "Rest"]]) {
    const v = exercise.prescription[k];
    if (v && v !== "—") rxDl.append(el("dt", {}, label), el("dd", {}, v));
  }

  const rxCol = el("div", { class: "rx-col" },
    el("div", { class: "order" }, exercise.order),
    el("div", { class: "name" }, exercise.name),
    exercise.videoUrl
      ? el("a", { class: "video", href: exercise.videoUrl, target: "_blank", rel: "noopener" }, "▶ Watch video")
      : null,
    rxDl,
    exercise.verify ? el("div", { class: "verify-flag" }, "⚠ verify against PDF") : null,
  );

  // input column
  const restSec = parseRestSeconds(exercise.prescription.rest);
  const controls = el("div", { class: "controls" },
    restSec
      ? el("button", { onClick: () => startRest(restSec) }, `⏱ Rest ${restSec}s`)
      : el("button", { onClick: () => startRest(60) }, "⏱ Rest 60s"),
    el("button", { onClick: openMetronome }, "♩ Metronome"),
  );

  let body;
  if (exercise.inputType === "check") {
    body = el("div", { class: "checkbox-block" });
    for (let i = 0; i < exercise.defaultSets; i++) {
      const cb = el("input", { type: "checkbox" });
      setVal(cb, entry.sets[i]?.checked);
      bindAutoSave(cb, () => { entry.sets[i] = { checked: cb.checked }; triggerSave(); });
      const lab = el("label", {}, cb, ` Set ${i + 1}`);
      body.append(lab);
    }
  } else {
    const hasWeight = exercise.inputType === "repsWeightMeasurement" || exercise.inputType === "setsRepsWeight";
    const hasMeasurement = exercise.measurement != null;
    const headRow = el("tr", {},
      el("th", {}, "#"),
      el("th", {}, "Reps"),
      hasWeight ? el("th", {}, "Weight") : null,
      hasMeasurement ? el("th", {}, exercise.measurement.label) : null,
    );
    const tbody = el("tbody");
    for (let i = 0; i < exercise.defaultSets; i++) {
      const repsIn = el("input", { type: "number", placeholder: exercise.prescription.reps?.replace(/[^\d]/g, "") || "" });
      const wIn = hasWeight ? el("input", { type: "number", placeholder: "lb" }) : null;
      const mIn = hasMeasurement
        ? el("input", { type: exercise.measurement.type === "number" ? "number" : "text", placeholder: exercise.measurement.label.toLowerCase() })
        : null;
      setVal(repsIn, entry.sets[i]?.reps);
      if (wIn) setVal(wIn, entry.sets[i]?.weight);
      if (mIn) setVal(mIn, entry.sets[i]?.measurement);
      const onChg = () => {
        entry.sets[i] = {
          reps: getVal(repsIn),
          ...(hasWeight ? { weight: getVal(wIn) } : {}),
          ...(hasMeasurement ? { measurement: getVal(mIn) } : {}),
        };
        triggerSave();
      };
      bindAutoSave(repsIn, onChg);
      if (wIn) bindAutoSave(wIn, onChg);
      if (mIn) bindAutoSave(mIn, onChg);
      tbody.append(el("tr", {},
        el("td", {}, String(i + 1)),
        el("td", {}, repsIn),
        hasWeight ? el("td", {}, wIn) : null,
        hasMeasurement ? el("td", {}, mIn) : null,
      ));
    }
    body = el("table", { class: "sets" }, el("thead", {}, headRow), tbody);
  }

  const inputCol = el("div", { class: "input-col" }, controls, body);
  return el("section", { class: "exercise" }, rxCol, inputCol);
}

// ---------- desktop grid ----------
function renderGridRow(exercise, sessionsByDate, todayDate, saveMeta, onChange) {
  const ex = el("td", { class: "ex" },
    el("div", { class: "order" },
      exercise.order,
      exercise.videoUrl ? " · " : "",
      exercise.videoUrl ? el("a", { class: "video", href: exercise.videoUrl, target: "_blank", rel: "noopener" }, "▶") : null,
    ),
    el("div", { class: "name" }, exercise.name),
    el("div", { class: "rx" }, formatPrescription(exercise.prescription)),
  );

  const cells = [ex];
  for (const date of sessionsByDate.dates) {
    const session = sessionsByDate.byDate.get(date) || { date, entries: {} };
    const isToday = date === todayDate;
    const cellClass = isToday ? "day-col today" : "day-col done";
    const cell = el("td", { class: cellClass });
    const entry = ensureEntry(session, exercise.key, exercise);

    if (exercise.inputType === "check") {
      const wrap = el("div", { class: "check-cell" });
      for (let i = 0; i < exercise.defaultSets; i++) {
        if (isToday) {
          const cb = el("input", { type: "checkbox" });
          setVal(cb, entry.sets[i]?.checked);
          bindAutoSave(cb, () => {
            entry.sets[i] = { checked: cb.checked };
            saveSession({ ...saveMeta, date }, { entries: session.entries });
            onChange?.();
          });
          wrap.append(el("label", {}, cb, ` S${i + 1}`));
        } else {
          wrap.append(el("label", { class: "small muted" }, entry.sets[i]?.checked ? "✓" : "—", ` S${i + 1}`));
        }
      }
      cell.append(wrap);
    } else {
      const hasWeight = exercise.inputType === "repsWeightMeasurement" || exercise.inputType === "setsRepsWeight";
      const hasMeasurement = exercise.measurement != null;
      const inputClass = `set-inputs ${hasWeight && hasMeasurement ? "rwm" : hasWeight ? "rw" : "rm"}`;
      for (let i = 0; i < exercise.defaultSets; i++) {
        const repsIn = el("input", { type: "number", placeholder: "r", readonly: isToday ? null : true });
        const wIn = hasWeight ? el("input", { type: "number", placeholder: "lb", readonly: isToday ? null : true }) : null;
        const mIn = hasMeasurement
          ? el("input", { type: exercise.measurement.type === "number" ? "number" : "text", placeholder: hasWeight ? "depth" : "m", readonly: isToday ? null : true })
          : null;
        setVal(repsIn, entry.sets[i]?.reps);
        if (wIn) setVal(wIn, entry.sets[i]?.weight);
        if (mIn) setVal(mIn, entry.sets[i]?.measurement);
        if (isToday) {
          const onChg = () => {
            entry.sets[i] = {
              reps: getVal(repsIn),
              ...(hasWeight ? { weight: getVal(wIn) } : {}),
              ...(hasMeasurement ? { measurement: getVal(mIn) } : {}),
            };
            saveSession({ ...saveMeta, date }, { entries: session.entries });
            onChange?.();
          };
          bindAutoSave(repsIn, onChg);
          if (wIn) bindAutoSave(wIn, onChg);
          if (mIn) bindAutoSave(mIn, onChg);
        }
        const inputs = el("span", { class: inputClass }, repsIn, wIn, mIn);
        cell.append(el("div", { class: "set-cell" }, el("span", { class: "set-label" }, String(i + 1)), inputs));
      }
    }
    cells.push(cell);
  }
  return el("tr", {}, ...cells);
}

function formatPrescription(p) {
  const bits = [];
  if (p.reps && p.reps !== "—") bits.push(p.reps);
  if (p.tempo && p.tempo !== "—") bits.push(p.tempo);
  if (p.sets && p.sets !== "—") bits.push(`${p.sets} sets`);
  if (p.rest && p.rest !== "—") bits.push(`rest ${p.rest}`);
  return bits.join(" · ");
}

// ---------- public: render a "program tab" ----------
// opts = {
//   tab, container, programs, getKey, getDayCount?, dayLabel?, headerLabel
// }
export async function renderProgramTab(opts) {
  const { tab, container, programs } = opts;
  container.innerHTML = "";

  // selected program/day from URL hash or sane default
  const hashParams = new URLSearchParams(location.hash.split("?")[1] || "");
  let programKey = hashParams.get("p") || programs[0].id;
  let day = parseInt(hashParams.get("d"), 10);
  if (!Number.isFinite(day)) day = 1;
  const program = programs.find((p) => p.id === programKey) || programs[0];
  programKey = program.id;

  // selector row
  const programGroup = el("div", { class: "group" });
  for (const p of programs) {
    programGroup.append(el("button", {
      class: "pill" + (p.id === programKey ? " active" : ""),
      onClick: () => {
        location.hash = `#${tab}?p=${p.id}&d=1`;
      },
    }, p.name));
  }
  const selectors = el("div", { class: "selectors" },
    el("span", { class: "label" }, tab === "mobility" ? "Phase" : "Split"),
    programGroup,
  );

  // day switcher (mobility only)
  let daysWrap = null;
  if (program.daysPerCycle) {
    daysWrap = el("div", { class: "day-switch" });
    for (let d = 1; d <= program.daysPerCycle; d++) {
      const isToday = d === day;
      daysWrap.append(el("button", {
        class: isToday ? "today" : "",
        onClick: () => { location.hash = `#${tab}?p=${programKey}&d=${d}`; },
      }, String(d)));
    }
    selectors.append(el("span", { class: "label" }, "Day"), daysWrap);
  }

  container.append(selectors);

  // load today's session
  const today = todayISO();
  const meta = { tab, programKey, day: program.daysPerCycle ? day : undefined, date: today };
  const session = (await loadSession(meta)) || { ...meta, entries: {} };

  // mobile view (cards)
  const mobile = el("div", { class: "mobile-view" });
  for (const ex of program.exercises) {
    mobile.append(renderExerciseCard(ex, session, meta));
  }

  // desktop view (grid)
  const desktop = el("div", { class: "desktop-view" });
  await renderDesktopGrid({ tab, program, day, today, mount: desktop });

  container.append(mobile, desktop);
}

async function renderDesktopGrid({ tab, program, day, today, mount }) {
  // For mobility: render columns = each day of the cycle (1..N), today's column highlighted.
  // For strength: render columns = last 4 sessions of this split by date.
  let dates = [];
  const byDate = new Map();
  let dateLabels = new Map();

  if (program.daysPerCycle) {
    // load each day's most recent session
    const all = await listSessions({ tab, programKey: program.id });
    // map day -> latest session
    const byDay = new Map();
    for (const s of all) {
      if (!byDay.has(s.day)) byDay.set(s.day, s);
    }
    for (let d = 1; d <= program.daysPerCycle; d++) {
      const isToday = d === day;
      const existing = byDay.get(d);
      const dateForCol = isToday ? today : (existing?.date || `day-${d}`);
      dates.push(dateForCol);
      dateLabels.set(dateForCol, `Day ${d}${isToday ? " · today" : ""}`);
      if (existing && existing.date === dateForCol) byDate.set(dateForCol, existing);
    }
    if (!byDate.has(today)) byDate.set(today, { tab, programKey: program.id, day, date: today, entries: {} });
  } else {
    // strength: last 4 sessions
    const all = await listSessions({ tab, programKey: program.id });
    const recent = all.slice(0, 3).map((s) => s.date);
    dates = [today, ...recent.filter((d) => d !== today)].slice(0, 4);
    for (const s of all) if (!byDate.has(s.date)) byDate.set(s.date, s);
    for (const d of dates) {
      dateLabels.set(d, d === today ? `${d} · today` : d);
      if (!byDate.has(d)) byDate.set(d, { tab, programKey: program.id, date: d, entries: {} });
    }
  }
  // Mobility: keep today first/highlighted but show all days in order 1..N (left-to-right).
  // dates already ordered 1..N for mobility; reorder so today is highlighted in place.

  const headTr = el("tr", {}, el("th", {}, "Exercise"));
  for (const d of dates) {
    const isToday = d === today;
    headTr.append(el("th", { class: "day" + (isToday ? " today" : "") }, dateLabels.get(d) || d));
  }

  const tbody = el("tbody");
  const sessionsByDate = { dates, byDate };
  for (const ex of program.exercises) {
    tbody.append(renderGridRow(ex, sessionsByDate, today, { tab, programKey: program.id, day: program.daysPerCycle ? day : undefined }));
  }

  const wrap = el("div", { class: "grid-wrap" },
    el("table", { class: "grid" }, el("thead", {}, headTr), tbody),
  );
  mount.append(wrap,
    el("p", { class: "hint" }, program.daysPerCycle
      ? "Today's column is editable. Past days show the most recent entry for each day of the phase."
      : "Today's column is editable. Other columns show your most recent sessions for this split."),
  );
}
