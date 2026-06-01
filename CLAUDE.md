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
  history.js                history list + CSV export buttons
  csv.js                    flatten sessions → CSV rows
  timer.js                  rest countdown + metronome (Web Audio API, no audio files)
data/
  mobility-program.js       MFTK Pike & H2T: 3 phases × N exercises × 8 days/cycle
  strength-program.js       4 splits (Tue/Thu AM+PM, M/W/F AM+PM)
mockups/                    Phase 1 layout mockups (A/B/C/D). D is the chosen one.
```

## Data model

Firestore collection: `sessions/{id}` where `id = "{tab}__{programKey}[__d{day}]__{YYYY-MM-DD}"`.

Doc shape:
```js
{
  tab: "mobility" | "strength",
  programKey: "p1" | "p2" | "p3" | "tt-am" | "tt-pm" | "mwf-am" | "mwf-pm",
  day: 1..8,             // mobility only
  date: "YYYY-MM-DD",
  entries: {
    [exerciseKey]: {
      sets: [{ reps, weight, measurement, checked }, ...],
      notes: ""
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

Each exercise:
```js
{
  key: "unique-stable-id",      // never rename — used as session entry key
  order: "A1",                  // display label
  name: "Pike Block Crush — Standing",
  inputType: "check" | "repsWeightMeasurement" | "setsRepsWeight",
  prescription: { reps, tempo, sets, rest },
  defaultSets: 3,
  measurement: { type: "text" | "number", label } | undefined,
  videoUrl: "https://link.matthewismith.com/..." | undefined,
}
```

`"check"` = N checkboxes (one per set), no numeric input.
`"repsWeightMeasurement"` = reps + weight + measurement per set (mobility).
`"setsRepsWeight"` = reps + weight per set (strength default).

**To add or rename an exercise, change `data/*.js` only.** Renderers are data-driven. If you rename a `key`, existing logged entries for that exercise will orphan — only do it during a deliberate migration.

## Firebase

- Project: `training-log-225de` on `nssharpe@gmail.com` (Spark free tier).
- Firestore rules wide-open. Rationale: single user, personal training data (low stakes), apiKey ships client-side anyway. CSV exports serve as backup.
- If you ever need real privacy, switch to email-link auth and per-user partition the collection. **Don't** introduce anon auth as a security layer — it doesn't gate anything.

## Auto-save behavior

- Every input change → `saveSession()` in `store.js`.
- localStorage write is synchronous and immediate (no debounce).
- Firestore write is debounced ~600ms after the last keystroke, and force-flushed on input blur, `visibilitychange` (tab hidden), and `beforeunload`.
- Header indicator: empty → "saving…" → "saved ✓". `"local ✓"` shown when Firebase isn't configured.

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
