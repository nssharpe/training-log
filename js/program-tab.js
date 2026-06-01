// Shared rendering for the mobility and strength tabs.
// Both follow the same shape: a "programKey" group (phase or split) with exercises.
// A date picker (defaults to today) selects which calendar date you're editing —
// pick a past date to edit an older entry. On mobile we render one card per exercise
// for the selected (day,) date; on desktop a wide grid where the selected column is
// editable and the rest are read-only history you can click to jump to.

import { loadSession, saveSession, listSessions } from "./store.js";
import { startRest, parseRestSeconds, openMetronome } from "./timer.js";

// Local calendar date (so an evening workout logs to "today", not tomorrow-UTC).
const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

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
function hasWeightInput(ex) {
  return ex.inputType === "repsWeightMeasurement" || ex.inputType === "setsRepsWeight";
}

// ---------- session data accessors ----------
function ensureEntry(session, exKey, exercise) {
  if (!session.entries) session.entries = {};
  if (!session.entries[exKey]) {
    const sets = [];
    for (let i = 0; i < exercise.defaultSets; i++) sets.push({});
    session.entries[exKey] = { sets, notes: "" };
  }
  while (session.entries[exKey].sets.length < exercise.defaultSets) {
    session.entries[exKey].sets.push({});
  }
  return session.entries[exKey];
}

function sessionHasData(s) {
  return Object.values(s?.entries || {}).some((e) =>
    (e.sets || []).some((set) =>
      set.reps != null || set.weight != null ||
      (set.measurement != null && set.measurement !== "") || set.checked));
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

  const restSec = parseRestSeconds(exercise.prescription.rest);
  const controls = el("div", { class: "controls" },
    el("button", { onClick: () => startRest(restSec || 60) }, `⏱ Rest ${restSec || 60}s`),
    el("button", { onClick: openMetronome }, "♩ Metronome"),
  );

  let body;
  if (exercise.inputType === "check") {
    body = el("div", { class: "checkbox-block" });
    for (let i = 0; i < exercise.defaultSets; i++) {
      const cb = el("input", { type: "checkbox" });
      setVal(cb, entry.sets[i]?.checked);
      bindAutoSave(cb, () => { entry.sets[i] = { checked: cb.checked }; triggerSave(); });
      body.append(el("label", {}, cb, ` Set ${i + 1}`));
    }
  } else {
    const hasWeight = hasWeightInput(exercise);
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

  return el("section", { class: "exercise" }, rxCol, el("div", { class: "input-col" }, controls, body));
}

// ---------- desktop grid ----------
// columns: [{ label, editable, session, navHash }]. Only the editable column writes,
// using editableMeta; the rest are read-only and (if navHash) clickable in the header.
function renderGridRow(exercise, columns, editableMeta, onChange) {
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
  for (const col of columns) {
    const isEd = col.editable;
    const cell = el("td", { class: "day-col" + (isEd ? " today" : " done") });
    const entry = ensureEntry(col.session, exercise.key, exercise);

    if (exercise.inputType === "check") {
      const wrap = el("div", { class: "check-cell" });
      for (let i = 0; i < exercise.defaultSets; i++) {
        if (isEd) {
          const cb = el("input", { type: "checkbox" });
          setVal(cb, entry.sets[i]?.checked);
          bindAutoSave(cb, () => {
            entry.sets[i] = { checked: cb.checked };
            saveSession(editableMeta, { entries: col.session.entries });
            onChange?.();
          });
          wrap.append(el("label", {}, cb, ` S${i + 1}`));
        } else {
          wrap.append(el("label", { class: "small muted" }, entry.sets[i]?.checked ? "✓" : "—", ` S${i + 1}`));
        }
      }
      cell.append(wrap);
    } else {
      const hasWeight = hasWeightInput(exercise);
      const hasMeasurement = exercise.measurement != null;
      const inputClass = `set-inputs ${hasWeight && hasMeasurement ? "rwm" : hasWeight ? "rw" : "rm"}`;
      for (let i = 0; i < exercise.defaultSets; i++) {
        const repsIn = el("input", { type: "number", placeholder: "r", readonly: isEd ? null : true });
        const wIn = hasWeight ? el("input", { type: "number", placeholder: "lb", readonly: isEd ? null : true }) : null;
        const mIn = hasMeasurement
          ? el("input", { type: exercise.measurement.type === "number" ? "number" : "text", placeholder: hasWeight ? "depth" : "m", readonly: isEd ? null : true })
          : null;
        setVal(repsIn, entry.sets[i]?.reps);
        if (wIn) setVal(wIn, entry.sets[i]?.weight);
        if (mIn) setVal(mIn, entry.sets[i]?.measurement);
        if (isEd) {
          const onChg = () => {
            entry.sets[i] = {
              reps: getVal(repsIn),
              ...(hasWeight ? { weight: getVal(wIn) } : {}),
              ...(hasMeasurement ? { measurement: getVal(mIn) } : {}),
            };
            saveSession(editableMeta, { entries: col.session.entries });
            onChange?.();
          };
          bindAutoSave(repsIn, onChg);
          if (wIn) bindAutoSave(wIn, onChg);
          if (mIn) bindAutoSave(mIn, onChg);
        }
        cell.append(el("div", { class: "set-cell" },
          el("span", { class: "set-label" }, String(i + 1)),
          el("span", { class: inputClass }, repsIn, wIn, mIn)));
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
export async function renderProgramTab(opts) {
  const { tab, container, programs } = opts;
  container.innerHTML = "";
  const today = todayISO();

  // selected program/day/date from URL hash (date defaults to today)
  const hashParams = new URLSearchParams(location.hash.split("?")[1] || "");
  const program = programs.find((p) => p.id === hashParams.get("p")) || programs[0];
  const programKey = program.id;
  let day = parseInt(hashParams.get("d"), 10);
  if (!Number.isFinite(day)) day = 1;
  let selectedDate = hashParams.get("date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate || "")) selectedDate = today;
  const isToday = selectedDate === today;

  // When no day is explicitly chosen, resume at the day AFTER the most recently
  // logged one (wrapping 8 -> 1), so landing on the tab lands on "what's next".
  if (program.daysPerCycle && !hashParams.has("d")) {
    const prior = await listSessions({ tab, programKey });
    const last = prior.find((s) => s.day != null && sessionHasData(s));
    if (last) day = (last.day % program.daysPerCycle) + 1;
  }

  const hashFor = ({ p = programKey, d = day, date = selectedDate } = {}) => {
    let h = `#${tab}?p=${p}`;
    if (program.daysPerCycle) h += `&d=${d}`;
    if (date && date !== today) h += `&date=${date}`;
    return h;
  };
  const rerender = () => renderProgramTab(opts);

  // ----- selector row -----
  const programGroup = el("div", { class: "group" });
  for (const p of programs) {
    programGroup.append(el("button", {
      class: "pill" + (p.id === programKey ? " active" : ""),
      // omit day/date so the new program lands on its own "next day", today
      onClick: () => { location.hash = `#${tab}?p=${p.id}`; },
    }, p.name));
  }
  const selectors = el("div", { class: "selectors" },
    el("span", { class: "label" }, tab === "mobility" ? "Phase" : "Split"),
    programGroup,
  );

  if (program.daysPerCycle) {
    const daysWrap = el("div", { class: "day-switch" });
    for (let d = 1; d <= program.daysPerCycle; d++) {
      daysWrap.append(el("button", {
        class: d === day ? "today" : "",
        onClick: () => { location.hash = hashFor({ d }); },
      }, String(d)));
    }
    selectors.append(el("span", { class: "label" }, "Day"), daysWrap);
  }

  // date picker + today reset
  const dateInput = el("input", { type: "date", class: "date-input", value: selectedDate });
  dateInput.addEventListener("change", () => {
    location.hash = hashFor({ date: dateInput.value || today });
  });
  const dateGroup = el("div", { class: "group" }, el("span", { class: "label" }, "Date"), dateInput);
  if (!isToday) {
    dateGroup.append(el("button", { class: "btn-sm", onClick: () => { location.hash = hashFor({ date: today }); } }, "Today"));
  }
  selectors.append(dateGroup);

  // fill-from-last-workout
  selectors.append(el("button", {
    class: "btn-sm fill-btn",
    title: "Copy reps/weight/measurement from your previous session into empty fields",
    onClick: () => fillFromLast(),
  }, "↤ Fill from last workout"));

  if (!isToday) {
    selectors.append(el("span", { class: "editing-flag" }, `editing ${selectedDate}`));
  }

  container.append(selectors);

  // ----- load the editable session for (programKey, day?, selectedDate) -----
  const meta = { tab, programKey, day: program.daysPerCycle ? day : undefined, date: selectedDate };
  const session = (await loadSession(meta)) || { ...meta, entries: {} };

  // mobile view (cards) — same session object as the desktop editable column
  const mobile = el("div", { class: "mobile-view" });
  for (const ex of program.exercises) mobile.append(renderExerciseCard(ex, session, meta));

  // desktop view (grid)
  const desktop = el("div", { class: "desktop-view" });
  await renderDesktopGrid({ tab, program, day, today, selectedDate, session, meta, hashFor, mount: desktop });

  container.append(mobile, desktop);

  // ----- fill from last workout -----
  async function fillFromLast() {
    const all = await listSessions({ tab, programKey });
    const prev = all.find((s) =>
      (program.daysPerCycle ? s.day === day : true) &&
      (s.date || "") < selectedDate &&
      sessionHasData(s));
    if (!prev) { alert("No earlier workout found to copy from."); return; }

    let filled = 0;
    for (const ex of program.exercises) {
      if (ex.inputType === "check") continue; // don't pre-check boxes you haven't done
      const cur = ensureEntry(session, ex.key, ex);
      const src = prev.entries?.[ex.key];
      if (!src) continue;
      for (let i = 0; i < cur.sets.length; i++) {
        const ss = src.sets?.[i];
        if (!ss) continue;
        const cs = cur.sets[i] || (cur.sets[i] = {});
        for (const f of ["reps", "weight", "measurement"]) {
          const empty = cs[f] == null || cs[f] === "";
          if (empty && ss[f] != null && ss[f] !== "") { cs[f] = ss[f]; filled++; }
        }
      }
    }
    if (!filled) {
      alert(`Found your last workout (${prev.date}) but every field already has a value — nothing to fill.`);
      return;
    }
    saveSession(meta, { entries: session.entries });
    rerender();
  }
}

async function renderDesktopGrid({ tab, program, day, today, selectedDate, session, meta, hashFor, mount }) {
  const all = await listSessions({ tab, programKey: program.id });
  const columns = [];
  const editLabel = selectedDate === today ? "today" : selectedDate;

  if (program.daysPerCycle) {
    // most-recent session per day-of-cycle (list is sorted desc by date)
    const byDay = new Map();
    for (const s of all) if (s.day != null && !byDay.has(s.day)) byDay.set(s.day, s);
    for (let d = 1; d <= program.daysPerCycle; d++) {
      if (d === day) {
        columns.push({ label: `Day ${d} · ${editLabel}`, editable: true, session });
      } else {
        const s = byDay.get(d);
        columns.push({
          label: `Day ${d}${s ? ` · ${s.date}` : ""}`,
          editable: false,
          session: s || { tab, programKey: program.id, day: d, date: null, entries: {} },
          navHash: s ? hashFor({ d, date: s.date }) : null,
        });
      }
    }
  } else {
    columns.push({ label: `${selectedDate} · ${editLabel === "today" ? "today" : "editing"}`, editable: true, session });
    const recent = all.map((s) => s.date).filter((d) => d && d !== selectedDate);
    for (const d of recent.slice(0, 3)) {
      columns.push({
        label: d,
        editable: false,
        session: all.find((s) => s.date === d),
        navHash: hashFor({ date: d }),
      });
    }
  }

  const headTr = el("tr", {}, el("th", {}, "Exercise"));
  for (const col of columns) {
    const th = el("th", { class: "day" + (col.editable ? " today" : "") + (col.navHash ? " clickable" : "") }, col.label);
    if (col.navHash) {
      th.title = "Click to edit this entry";
      th.addEventListener("click", () => { location.hash = col.navHash; });
    }
    headTr.append(th);
  }

  const tbody = el("tbody");
  for (const ex of program.exercises) tbody.append(renderGridRow(ex, columns, meta));

  mount.append(
    el("div", { class: "grid-wrap" }, el("table", { class: "grid" }, el("thead", {}, headTr), tbody)),
    el("p", { class: "hint" }, program.daysPerCycle
      ? "The highlighted column is editable. Other days show your most recent entry — click a column header to edit it, or pick a date above to edit a past session."
      : "The highlighted column is editable. Click another column's header, or pick a date above, to edit a past session."),
  );
}
