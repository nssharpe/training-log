# Training Log

A mobile + desktop webapp to log Nate's strength and mobility/flexibility training. Static, hosted on GitHub Pages.

## Phase 1 — layout mockups (current)

Three layout options for the day-view, in [`/mockups/`](./mockups/):

- **Mockup A** — row-per-exercise with inline prescription chip
- **Mockup B** — two-column split (prescription / input)
- **Mockup C** — full phase grid on desktop, single-day on mobile

Pick one (or mix elements) before Phase 2.

## Phase 2 — full app (planned)

- Mobility tab (MFTK Pike & H2T, 3 phases × 8 days)
- Strength tab (Tue/Thu AM+PM, M/W/F AM+PM)
- Firebase Firestore persistence (single shared DB, no auth — true cross-device sync)
- CSV export per tab
- Rest timer + metronome (Web Audio API)
- Linked exercise videos from the MFTK source
