// MFTK Pike & H2T mobility program — transcribed from
// "MFTK Pike & H2T Program PYSYIRNV3.pdf"
//
// Entries marked `verify: true` had ambiguous column layout in the source
// PDF — open the PDF and spot-check reps/tempo/sets before relying on them.
//
// inputType values:
//   "check"                  — single checkbox per set (no numeric input)
//   "repsMeasurement"        — reps + measurement per set
//   "repsWeightMeasurement"  — reps + weight + measurement per set
//
// measurement: { type: "text" | "number", label: string }   (omit for "check")

export const MOBILITY = {
  phases: [
    {
      id: "p1",
      name: "Phase 1",
      daysPerCycle: 8,
      exercises: [
        {
          key: "p1-rolling-feet",
          order: "A1",
          name: "Rolling Feet",
          inputType: "check",
          prescription: { reps: "90s per side", tempo: "—", sets: "1", rest: "as needed" },
          defaultSets: 2, // left + right
          videoUrl: "https://link.matthewismith.com/rolling-feet",
        },
        {
          key: "p1-calf-stretch-sls",
          order: "A2 / B1",
          name: "Calf Stretch — Single Leg Standing",
          inputType: "repsWeightMeasurement",
          prescription: { reps: "8", tempo: "—", sets: "1–2", rest: "as needed" },
          defaultSets: 2,
          measurement: { type: "text", label: "Depth" },
          videoUrl: "https://link.matthewismith.com/calfstretch-standing",
          verify: true,
        },
        {
          key: "p1-sciatic-ankle-floss",
          order: "C1",
          name: "Sciatic Nerve — Ankle Joint Floss",
          inputType: "check",
          prescription: { reps: "8", tempo: "—", sets: "2–3", rest: "60s+" },
          defaultSets: 3,
          videoUrl: "https://link.matthewismith.com/sciatic-ankle-floss",
        },
        {
          key: "p1-pike-block-crush-le",
          order: "D1",
          name: "Pike Block Crush — Leg Elevated",
          inputType: "check",
          prescription: { reps: "5", tempo: "3s up / 3s down", sets: "2–3", rest: "60s+" },
          defaultSets: 3,
          videoUrl: "https://link.matthewismith.com/leg-elevated-pike-block-crush",
        },
        {
          key: "p1-pike-hang",
          order: "—",
          name: "Pike Hang — Leg Elevated",
          inputType: "repsWeightMeasurement",
          prescription: { reps: "10s hold", tempo: "—", sets: "1", rest: "60s+" },
          defaultSets: 1,
          measurement: { type: "number", label: "Angle (°)" },
          videoUrl: "https://link.matthewismith.com/pike-hang-bstance-standing",
          verify: true,
        },
        {
          key: "p1-standing-bstance",
          order: "—",
          name: "Standing B-Stance",
          inputType: "repsWeightMeasurement",
          prescription: { reps: "Contract 5s / Relax 5s", tempo: "—", sets: "2–3", rest: "60s+" },
          defaultSets: 3,
          measurement: { type: "text", label: "Depth" },
          videoUrl: "https://link.matthewismith.com/pike-hang-bstance-standing",
          verify: true,
        },
      ],
    },
    {
      id: "p2",
      name: "Phase 2",
      daysPerCycle: 8,
      exercises: [
        {
          key: "p2-donkey-calf-sls",
          order: "A1",
          name: "Donkey Calf Stretch — Single Leg",
          inputType: "repsWeightMeasurement",
          prescription: { reps: "8", tempo: "—", sets: "2–3", rest: "60s+" },
          defaultSets: 3,
          measurement: { type: "text", label: "Depth" },
          videoUrl: "https://link.matthewismith.com/calfstretch-donkey",
          verify: true,
        },
        {
          key: "p2-pigeon",
          order: "A2",
          name: "Your Pigeon Variation",
          inputType: "check",
          prescription: { reps: "8", tempo: "—", sets: "2–3", rest: "60s+" },
          defaultSets: 3,
          videoUrl: "https://link.matthewismith.com/pigeon-variation",
        },
        {
          key: "p2-sciatic-knee-floss",
          order: "B1",
          name: "Sciatic Nerve — Knee Joint Floss",
          inputType: "check",
          prescription: { reps: "8", tempo: "3131", sets: "2–3", rest: "90s+" },
          defaultSets: 3,
          videoUrl: "https://link.matthewismith.com/sciatic-knee-floss",
        },
        {
          key: "p2-pike-block-crush-std",
          order: "C1",
          name: "Pike Block Crush — Standing",
          inputType: "check",
          prescription: { reps: "8", tempo: "3s lift / 3s rest", sets: "2–3", rest: "90s+" },
          defaultSets: 3,
          videoUrl: "https://link.matthewismith.com/pike-block-crush-standing",
        },
        {
          key: "p2-pike-good-morning-rb",
          order: "D1",
          name: "Pike Good Morning — Standing | Round Back",
          inputType: "repsWeightMeasurement",
          prescription: { reps: "8", tempo: "3310", sets: "2–3", rest: "90s+" },
          defaultSets: 3,
          measurement: { type: "text", label: "Depth" },
          videoUrl: "https://link.matthewismith.com/pike-good-morning-roundback",
          verify: true,
        },
      ],
    },
    {
      id: "p3",
      name: "Phase 3",
      daysPerCycle: 8,
      exercises: [
        {
          key: "p3-knee-ext-calf-sls",
          order: "A1",
          name: "Knee Extension Calf Stretch — Single Leg",
          inputType: "repsWeightMeasurement",
          prescription: { reps: "8", tempo: "3s", sets: "2–3", rest: "60s+" },
          defaultSets: 3,
          measurement: { type: "text", label: "Depth" },
          videoUrl: "https://link.matthewismith.com/calfstretch-knee-extension",
          verify: true,
        },
        {
          key: "p3-pike-block-crush-std",
          order: "B1",
          name: "Pike Block Crush — Standing",
          inputType: "check",
          prescription: { reps: "5", tempo: "3s lift / 3s rest", sets: "2–3", rest: "90s+" },
          defaultSets: 3,
          videoUrl: "https://link.matthewismith.com/pike-block-crush-standing",
        },
        {
          key: "p3-pike-good-morning-le",
          order: "C1",
          name: "Pike Good Morning — Leg Elevated",
          inputType: "repsWeightMeasurement",
          prescription: { reps: "8", tempo: "2310", sets: "2–3", rest: "60s+" },
          defaultSets: 3,
          measurement: { type: "text", label: "Depth" },
          videoUrl: "https://link.matthewismith.com/pike-good-morning-legelevated",
          verify: true,
        },
        {
          key: "p3-pike-active-lifts",
          order: "C2",
          name: "Pike Active Lifts — Seated | Single Leg",
          inputType: "repsWeightMeasurement",
          prescription: { reps: "8", tempo: "1115", sets: "2–3", rest: "60s+" },
          defaultSets: 3,
          measurement: { type: "number", label: "Angle (°)" },
          videoUrl: "https://link.matthewismith.com/pike-active-lifts-seated",
          verify: true,
        },
      ],
    },
  ],
};
