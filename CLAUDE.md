# Training Log — Claude context

Single-user webapp for logging Nate's strength + mobility training. Hosted on GitHub Pages at https://nssharpe.github.io/training-log/. Repo `nssharpe/training-log`. Single user, single shared Firestore DB, no auth.

## Stack & conventions

- **Vanilla HTML/CSS/JS, no build step.** ES modules loaded directly. Firebase loaded via CDN at runtime.
- Don't introduce a bundler, framework, or `npm install`. Stay buildless — push to `main` deploys via GitHub Pages.
- Don't add auth. Firestore rules are intentionally wide-open (`allow read, write: if true;`) — see "Firebase" below for the rationale.
- Don't add the "Save session" button back — auto-save is the contract.
- Don't put Export CSV in the footer/header. It lives in the History tab only.
- Dark theme. Mobile-first cards; desktop (≥900px) is a full grid. Mobile breakpoint is in `css/styles.css` — see `@media (min-width: 900px)`.

## File map

```
index.html                  shell + tab nav + overlay scaffolding
cheatsheet.html             warmup/training tips page (linked via 📖)
css/styles.css              everything visual; theme tokens at top
js/
  app.js                    hash-based tab router (#mobility|#strength|#history)
  firebase-config.js        Firebase web config (committed; not secret — rules gate)
  store.js                  localStorage + Firestore. Debounced auto-save. Triggers header indicator.
  program-tab.js            shared renderer for mobility + strength. Mobile cards + desktop grid.
  mobility.js               thin: passes MOBILITY data to renderProgramTab
  strength.js               thin: passes STRENGTH data to renderProgramTab
  history.js                history list (rows clickable → edit; hover shows Delete + edit hint) + CSV export buttons
  csv.js                    flatten sessions → CSV rows
  timer.js                  rest countdown + metronome (Web Audio API, no audio files)
data/
  mobility-program.js       MOBILITY.groups[] sub-tabs: "Pike & H2T" (3 phases × 8 days/cycle) + "Shoulder Flexion" (2 phases, session-logged)
  strength-program.js       4 splits (Tue/Thu AM+PM, M/W/F AM+PM)
mockups/                    Phase 1 layout mockups (A/B/C/D). D is the chosen one.
```

## Data model

Firestore collection: `sessions/{id}` where `id = "{tab}__{programKey}[__d{day}]__{YYYY-MM-DD}"`.

Doc shape:
```js
{
  tab: "mobility" | "strength",
  programKey: "p1" | "p2" | "p3" | "sf" | "tt-am" | "tt-pm" | "mwf-am" | "mwf-pm",
  day: 1..8,             // Pike phases only; absent for "sf" (shoulder) and all strength
  date: "YYYY-MM-DD",
  entries: {
    [exerciseKey]: {
      // set fields depend on the exercise inputType:
      //   reps, weight, measurement  (repsWeightMeasurement)
      //   checked                    (check)
      //   time, notes                (timeNotes — per-set notes, distinct from entry.notes)
      sets: [{ reps, weight, measurement, checked, time, notes }, ...],
      notes: ""   // entry-level note (currently unused by UI)
    }
  },
  updatedAt: <ms>
}
```

localStorage mirrors every write under key `tlog:{id}`. On load, the doc with higher `updatedAt` wins.

## Date selection & editing past entries

- Hash params drive the editable session: `#mobility?p=p2&d=3&date=YYYY-MM-DD`. `date` is omitted when it's today.
- The selector row has a `<input type="date">` (defaults to local today). Changing it just rewrites the hash → `hashchange` → re-render. A "Today" reset button + "editing {date}" flag appear when not on today.
- **Editing an older entry = pick its date** (mobile or desktop). The mobile cards and the desktop grid's highlighted column both edit the `(programKey, day?, selectedDate)` session — same in-memory object.
- Fast shortcuts to old entries: clickable desktop grid history-column headers, and clickable History-tab rows. Both just set the hash.
- **"↤ Fill from last workout"** button: finds the most recent prior session for the same `(programKey, day?)` with data, and copies reps/weight/measurement into *empty* fields only (never overwrites; never auto-checks checkboxes). Then saves + re-renders.
- `todayISO()` in program-tab.js uses **local** calendar date (evening workouts log to today, not tomorrow-UTC).

## Program data structure

`renderProgramTab` accepts either `programs` (flat — strength) or `groups` (sub-tabbed — mobility).
A `group = { id, name, defaultProgramId?, programs[] }` renders a sub-tab row; the active group's `programs` fill the phase/split pills (pills hidden when a group has only one program). `defaultProgramId` picks which program is active when the hash has no `p=` (currently `p3` for Pike, `sf2` for Shoulder — the phases Nate is on); pill order stays the array order, so bump this instead of reordering phases. Hash gains `g=<groupId>` for groups (e.g. `#mobility?g=shoulder`, `#mobility?g=pike&p=p2&d=3`). Legacy `#mobility?p=p1&d=3` (no `g`) still works — defaults to the first group.

Exercises may carry an optional `note` (coaching cue) rendered under the prescription. A `repsWeightMeasurement` exercise with NO `measurement` field shows reps+weight only (used for the Shoulder dumbbell raises).

Each exercise:
```js
{
  key: "unique-stable-id",      // never rename — used as session entry key
  order: "A1",                  // display label
  name: "Pike Block Crush — Standing",
  inputType: "check" | "repsWeightMeasurement" | "setsRepsWeight" | "timeNotes",
  prescription: { reps, tempo, sets, rest },
  defaultSets: 3,
  measurement: { type: "text" | "number", label } | undefined,
  note: "coaching cue shown under the prescription" | undefined,
  videoUrl: "https://... (YouTube or link.matthewismith.com)" | undefined,
}
```

`"check"` = N checkboxes (one per set), no numeric input.
`"repsWeightMeasurement"` = reps + weight per set; adds a measurement column only if `measurement` is set.
`"setsRepsWeight"` = reps + weight per set (strength default).
`"timeNotes"` = Time (s) number + Notes text per set, no weight (used for Shoulder D1 hanging). Per-set values stored as `set.time` / `set.notes`.

**Weight is a text input** (not number) so values like "bw" / "red band" work; stored as a string. `sessionHasData()` treats `weight === ""` as empty (so a blank text weight doesn't count as logged data). Reps/time stay numeric.

Renderers branch on `inputType` in THREE places — keep them in sync: `renderExerciseCard` (mobile), `renderGridRow` (desktop), and the `fillFromLast` field list (`["reps","weight","measurement","time","notes"]`). CSV `FIELDS` in `csv.js` must also include any new per-set field.

## Mobile card layout (program-tab.js)

- Card = `.ex-head` (prescription left, action buttons `.ex-controls` right-justified) + `.ex-body` (the sets).
- Sets render **horizontally**: one `.set-col` per set (`Set 1 / Set 2 …`), each stacking its labelled fields (`field()` + `setCol()` helpers). Field order is **weight then reps** (then measurement) everywhere — mobile cards, desktop grid (`set-inputs` classes `wr`/`wrm`/`rm`), and CSV `FIELDS`. `"check"` exercises render as a horizontal `.checkbox-row`. The desktop grid still stacks sets vertically within each day-column.
- **Hold timer:** `parseHoldSeconds(prescription.reps)` detects when reps *is* a time (`90s`, `20s`, `30–90s`, `90s per side` → upper bound, e.g. `30–90s` → 90; a rep count like `8`/`5–8` → null). When set, a "⏳ Timer Ns" button calls `startRest(n, "Hold")` (same overlay as Rest, title swapped). The overlay has −30s / +30s buttons to adjust the running time (−30s floors at 5s remaining) — that's how you shorten a ranged hold. Auto-detected — no data field needed.
- **Supersets:** exercises whose `order` shares a leading letter (A1/A2 → "A") get a shared colored left border, only when 2+ share the letter. `computeSupersets()` assigns palette index per letter; `.ss .ss-0…ss-5` in CSS. Applied to mobile cards and desktop grid rows (`tr.ss td.ex`).

**To add or rename an exercise, change `data/*.js` only.** Renderers are data-driven. If you rename a `key`, existing logged entries for that exercise will orphan — only do it during a deliberate migration.

## Firebase

- Project: `training-log-225de` on `nssharpe@gmail.com` (Spark free tier).
- Firestore rules wide-open. Rationale: single user, personal training data (low stakes), apiKey ships client-side anyway. CSV exports serve as backup.
- If you ever need real privacy, switch to email-link auth and per-user partition the collection. **Don't** introduce anon auth as a security layer — it doesn't gate anything.
- **No composite indexes.** `listSessions()` queries with equality filters only (no `orderBy`/`limit` in the Firestore query) and sorts + caps client-side. This avoids needing composite indexes (which would otherwise error with `failed-precondition`). Don't add `orderBy` back to those queries.

## Auto-save behavior

- Every input change → `saveSession()` in `store.js`.
- localStorage write is synchronous and immediate (no debounce).
- Firestore write is debounced ~600ms after the last keystroke, and force-flushed on input blur, `visibilitychange` (tab hidden), and `beforeunload`.
- Header indicator: empty → "saving…" → "saved ✓". `"local ✓"` shown when Firebase isn't configured.
- On a failed cloud write/delete the indicator shows `"offline · local only"` and a **Reconnect** button appears (`#reconnect-btn`). Failed ids are queued in `failedWrites`/`failedDeletes`; `reconnect()` (in store.js) re-attempts them (reading latest from localStorage), re-inits Firebase if needed, and runs a connectivity probe when the queue is empty. Success → "reconnected ✓ · N uploads"; failure → "couldn't connect" then reverts to offline. **Data is never lost on failure** — it's always in localStorage.
- Firestore reserves doc ids matching `__...__`; the connectivity probe uses `"connectivity-probe"` (no double underscores) to avoid an `invalid-argument` error.

## Deleting sessions

- History rows have a **Delete** button (hover-revealed, left of the edit hint). Calls `deleteSession(docId)` in store.js → removes from localStorage + Firestore, then re-renders the list. A failed Firestore delete queues in `failedDeletes` for the Reconnect flow.

## Local preview (testing changes)

- No build step, but ES modules need a server (not file://). The Claude Code preview tool reads `.claude/launch.json` at the **workspace root** (the parent "Mobility and Flexibility Toolkit" folder), not the repo root. There's also a committed `Nate Training App/.claude/launch.json` for the repo.
- Python `http.server` sends no cache headers, so the browser serves **stale ES modules** across reloads. To test a JS change, bump the port (fresh origin) rather than reloading. The live config is real Firebase, so preview writes hit the real DB — clean up test sessions via the History delete button afterward.

## Common tweak recipes

- **Fix a prescription value** (reps/tempo/sets/rest): edit `data/mobility-program.js` or `data/strength-program.js`, push.
- **Add a new exercise**: append an entry to the right phase/split's `exercises` array. Pick a unique `key`. Push.
- **Change input type for an exercise** (e.g., turn a check into repsMeasurement): change `inputType` and add/remove `measurement`. Existing logged data may have a mismatched shape — handle gracefully or ignore.
- **Adjust mobile/desktop breakpoint**: `css/styles.css`, search `min-width: 900px` — that's the swap point.
- **Change rest-timer defaults**: `js/timer.js`. Metronome accent is every 4th beat in `startMetronome`.
- **CSV columns**: `js/csv.js` `FIELDS` array.

## Deploying

`git push origin main` deploys. Pages rebuild takes ~1 min. No PR workflow.

## Known limitations (intentional — don't "fix" without asking)

- No service worker / offline shell. Data persists offline (localStorage) but the page itself needs the network on first load.
- Resizing across the 900px breakpoint mid-edit can show stale data in the alt view — refresh fixes it. Acceptable tradeoff vs. dual-binding both views to the same in-memory session.
- Some mobility entries use a number input where the prescription is "90s" (a hold time). User just types the number of seconds they held; the "s" is contextual.

## Things to double-check on review

- Any change that touches an exercise `key` breaks history continuity.
- Any change to `docId()` in `store.js` orphans previously-saved sessions.
- Adding fields to entries: backward-compat is fine since renderers read with defaults.
