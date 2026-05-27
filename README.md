# Training Log

A mobile + desktop webapp to log Nate's strength and mobility/flexibility training. Static HTML/CSS/JS — no build step. Hosted on GitHub Pages.

**Live:** https://nssharpe.github.io/training-log/

## Features

- **Mobility tab** — MFTK Pike & H2T (3 phases × 8 days), prescribed reps/tempo/sets/rest shown alongside today's input.
- **Strength tab** — Tue/Thu AM+PM and M/W/F AM+PM splits.
- **Responsive layout** — exercise cards on mobile; full phase grid on desktop (≥900px), with today highlighted and editable.
- **Auto-save** — every change is saved immediately to localStorage and flushed to Firestore. No "Save" button. A small "saved ✓" indicator lives in the header.
- **Linked exercise videos** for each mobility exercise.
- **Rest timer + metronome** — built-in, audible, Web Audio API (no audio files, works offline).
- **CSV export** — per-tab download from the History tab for offline analysis.
- **Warmup &amp; tips cheatsheet** — linked from the header (📖).

## Firebase setup (for cross-device sync)

Until you wire up Firebase, the app runs in **localStorage-only mode** — fully usable on one device, just no sync. To enable sync:

1. Go to <https://console.firebase.google.com>, create a new project (Analytics not needed).
2. **Build → Firestore Database → Create database → Start in production mode**, pick a region near you.
3. Open the **Rules** tab and paste:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} { allow read, write: if true; }
     }
   }
   ```

   Personal log, single user, low stakes — wide-open rules are fine. No auth required.

4. **Project settings ⚙ → Your apps → Web (`</>`) → register** an app. Copy the `firebaseConfig` object.
5. Paste it into [`js/firebase-config.js`](js/firebase-config.js), commit, and push. The next page load will start syncing.

The Firebase API key is safe to commit — it's not a secret. Firestore rules are what control access.

## Data shape

One document per `(tab, programKey, day, date)`. Stored under the `sessions/` collection:

```js
{
  tab: "mobility" | "strength",
  programKey: "p1" | "tt-am" | ...,
  day: 1..8,            // mobility only
  date: "YYYY-MM-DD",
  entries: {
    [exerciseKey]: {
      sets: [{ reps, weight, measurement, checked }, ...],
      notes: ""
    }
  },
  updatedAt: <ms-since-epoch>
}
```

CSV export flattens this into one row per (date × exercise × set).

## Local development

Open `index.html` via any static server (or just `start index.html` on Windows). The Firebase SDK is loaded from a CDN at runtime, so no `npm install`.

## Layout mockups

The three layout mockups used to design the app live in [`/mockups/`](./mockups/) for reference.

## Notes on transcribed data

Several mobility entries are flagged `verify: true` in [`data/mobility-program.js`](data/mobility-program.js) — these had ambiguous column extraction in the source PDF. Spot-check against the PDF and edit the data file as needed.
