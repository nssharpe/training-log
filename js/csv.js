// Flatten sessions to CSV rows.

const FIELDS = [
  "date", "tab", "programKey", "day",
  "exerciseOrder", "exerciseName",
  "set", "reps", "weight", "measurement", "checked", "notes",
];

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function sessionsToCsv(sessions, programLookup) {
  const rows = [FIELDS.join(",")];
  for (const s of sessions) {
    const entries = s.entries || {};
    for (const [exKey, entry] of Object.entries(entries)) {
      const ex = programLookup(s.programKey, exKey) || { order: exKey, name: exKey };
      const sets = entry.sets || [];
      if (sets.length === 0) {
        rows.push(FIELDS.map((f) => csvEscape({
          date: s.date, tab: s.tab, programKey: s.programKey, day: s.day,
          exerciseOrder: ex.order, exerciseName: ex.name,
          set: 1, reps: null, weight: null, measurement: null, checked: null,
          notes: entry.notes,
        }[f])).join(","));
      }
      sets.forEach((set, i) => {
        rows.push(FIELDS.map((f) => csvEscape({
          date: s.date, tab: s.tab, programKey: s.programKey, day: s.day,
          exerciseOrder: ex.order, exerciseName: ex.name,
          set: i + 1,
          reps: set.reps, weight: set.weight, measurement: set.measurement, checked: set.checked,
          notes: i === 0 ? entry.notes : null,
        }[f])).join(","));
      });
    }
  }
  return rows.join("\n");
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
