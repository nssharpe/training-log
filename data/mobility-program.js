// MFTK mobility programs, grouped into sub-tabs within the Mobility tab.
//
// Structure:
//   MOBILITY.groups[] = { id, name, programs[] }
//     program = { id, name, daysPerCycle?, exercises[] }
//       - daysPerCycle set  -> 8-day rotating cycle (Pike phases), day switcher + day grid
//       - daysPerCycle unset -> single routine logged per session/date (Shoulder), like a strength split
//
// inputType values:
//   "check"                  — single checkbox per set (no numeric input)
//   "repsWeightMeasurement"  — reps/hold + weight per set; + measurement column if `measurement` is set
//
// For timed holds, the "reps"/"hold" prescription is "Ns" — the input is still numeric.
// measurement: { type: "text" | "number", label }   (omit to show reps+weight only)
// note: optional coaching cue shown under the exercise.

const pikePhases = [
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
        prescription: { reps: "90s per side", tempo: "—", sets: "1–2", rest: "as needed" },
        defaultSets: 2,
        videoUrl: "https://link.matthewismith.com/rolling-feet",
      },
      {
        key: "p1-calf-stretch-sls",
        order: "A2",
        name: "Calf Stretch — Single Leg Standing",
        inputType: "repsWeightMeasurement",
        prescription: { reps: "90s", tempo: "—", sets: "2–3", rest: "as needed" },
        defaultSets: 3,
        videoUrl: "https://link.matthewismith.com/calfstretch-standing",
      },
      {
        key: "p1-sciatic-ankle-floss",
        order: "B1",
        name: "Sciatic Nerve — Ankle Joint Floss",
        inputType: "check",
        prescription: { reps: "8", tempo: "3s up / 3s down", sets: "2–3", rest: "60s+" },
        defaultSets: 3,
        videoUrl: "https://link.matthewismith.com/sciatic-ankle-floss",
      },
      {
        key: "p1-pike-block-crush-le",
        order: "C1",
        name: "Pike Block Crush — Leg Elevated",
        inputType: "check",
        prescription: { reps: "3", tempo: "10s", sets: "1", rest: "60s+" },
        defaultSets: 1,
        videoUrl: "https://link.matthewismith.com/leg-elevated-pike-block-crush",
      },
      {
        key: "p1-pike-hang-bstance",
        order: "D1",
        name: "Pike Hang / Standing B-Stance",
        inputType: "repsWeightMeasurement",
        prescription: { reps: "5", tempo: "Contract 5s / Relax 5s", sets: "2–3", rest: "60s+" },
        defaultSets: 3,
        measurement: { type: "text", label: "Depth" },
        videoUrl: "https://link.matthewismith.com/pike-hang-bstance-standing",
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
        prescription: { reps: "90s", tempo: "—", sets: "2–3", rest: "as needed" },
        defaultSets: 3,
        videoUrl: "https://link.matthewismith.com/calfstretch-donkey",
      },
      {
        key: "p2-pigeon",
        order: "A2",
        name: "Your Pigeon Variation",
        inputType: "check",
        prescription: { reps: "30s", tempo: "—", sets: "2–3", rest: "60s+" },
        defaultSets: 3,
        videoUrl: "https://link.matthewismith.com/pigeon-variation",
      },
      {
        key: "p2-sciatic-knee-floss",
        order: "B1",
        name: "Sciatic Nerve — Knee Joint Floss",
        inputType: "check",
        prescription: { reps: "8", tempo: "3131", sets: "2–3", rest: "60s+" },
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
        name: "Pike Good Morning — Standing / Round Back",
        inputType: "repsWeightMeasurement",
        prescription: { reps: "8", tempo: "3310", sets: "2–3", rest: "90s+" },
        defaultSets: 3,
        measurement: { type: "text", label: "Depth" },
        videoUrl: "https://link.matthewismith.com/pike-good-morning-roundback",
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
        videoUrl: "https://link.matthewismith.com/calfstretch-knee-extension",
      },
      {
        key: "p3-pike-block-crush-std",
        order: "B1",
        name: "Pike Block Crush — Standing",
        inputType: "check",
        prescription: { reps: "8", tempo: "3s lift / 3s rest", sets: "2–3", rest: "90s+" },
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
      },
      {
        key: "p3-pike-active-lifts",
        order: "C2",
        name: "Pike Active Lifts — Seated / Single Leg",
        inputType: "repsWeightMeasurement",
        prescription: { reps: "5", tempo: "1115", sets: "2–3", rest: "60s+" },
        defaultSets: 3,
        measurement: { type: "number", label: "Angle (°)" },
        videoUrl: "https://link.matthewismith.com/pike-active-lifts-seated",
      },
    ],
  },
];

// MFTK Shoulder Training Program — from "MFTK Shoulder Flexion 1-22--.pdf".
// 1–2×/week, ~60 min. One routine logged per session (no day-of-cycle rotation).
// Source PDF has no exercise video links (play icons are decorative).
const shoulderProgram = {
  id: "sf",
  name: "Shoulder Flexion",
  // no daysPerCycle -> logged per session/date, like a strength split
  exercises: [
    {
      key: "sf-a1-banded-ext-rotation",
      order: "A1",
      name: "Banded Stretching — External Rotation",
      inputType: "check",
      prescription: { reps: "6 + 8s iso", tempo: "5s contract / 5s relax", sets: "2–3", rest: "30s" },
      defaultSets: 3,
      note: "On the last rep, remove the band and externally rotate without assistance for the 8s isometric hold.",
      videoUrl: "https://www.youtube.com/watch?v=ITCc-DSpgLs",
    },
    {
      key: "sf-a2-prone-db-ext-rotation",
      order: "A2",
      name: "Prone Dumbbell External Rotation",
      inputType: "repsWeightMeasurement",
      prescription: { reps: "5–8", tempo: "3112", sets: "2–3", rest: "60s" },
      defaultSets: 3,
      note: "Support elbow on an object level with your shoulder. Torso parallel to the ground.",
      videoUrl: "https://www.youtube.com/watch?v=uv0K-rzAMTI&feature=youtu.be",
    },
    {
      key: "sf-b1-pillar-lat-stretch",
      order: "B1",
      name: "Pillar Lat Stretch",
      inputType: "check",
      prescription: { reps: "8", tempo: "3s contract / 3s relax", sets: "2–3", rest: "30s" },
      defaultSets: 3,
      note: "Palm toward your grip. Create a long arc along your spine. Push with the bottom hand. Posteriorly tilt the pelvis.",
      videoUrl: "https://www.youtube.com/watch?v=Bqge_oSmHE8&feature=youtu.be",
    },
    {
      key: "sf-b2-horiz-db-lower-trap-raise",
      order: "B2",
      name: "Horizontal Dumbbell Lower Trap Raise",
      inputType: "repsWeightMeasurement",
      prescription: { reps: "5–8", tempo: "3112", sets: "2–3", rest: "60s" },
      defaultSets: 3,
      note: "Arm comes out at a 30–45° angle to the body. Torso parallel to the ground.",
      videoUrl: "https://www.youtube.com/watch?v=WTIbJn_8lVI&feature=youtu.be",
    },
    {
      key: "sf-c1-loaded-pec-stretch",
      order: "C1",
      name: "Loaded Pec Stretch",
      inputType: "repsWeightMeasurement",
      prescription: { reps: "8", tempo: "3210", sets: "2–3", rest: "30s" },
      defaultSets: 3,
      note: "Thumb points down. Hand slightly above ear height.",
      videoUrl: "https://www.youtube.com/watch?v=CIzKsfsjoyY&feature=youtu.be",
    },
    {
      key: "sf-c2-prone-db-powell-raise",
      order: "C2",
      name: "Prone Dumbbell Powell Raise",
      inputType: "repsWeightMeasurement",
      prescription: { reps: "5–8", tempo: "3112", sets: "2–3", rest: "60s" },
      defaultSets: 3,
      note: "Lay face down on a box or bench. Hand inline with your ear at the bottom.",
      videoUrl: "https://www.youtube.com/watch?v=dCcEtA32-ko",
    },
    {
      key: "sf-d1-hanging-variation",
      order: "D1",
      name: "Your Hanging Variation",
      inputType: "timeNotes",
      prescription: { reps: "30–90s", tempo: "—", sets: "2", rest: "120s" },
      defaultSets: 2,
      note: "Use the Mobility & Flexibility Toolkit to find your hanging variation.",
      // no video — hanging variation is user-specific
    },
  ],
};

export const MOBILITY = {
  groups: [
    { id: "pike", name: "Pike & H2T", programs: pikePhases },
    { id: "shoulder", name: "Shoulder Flexion", programs: [shoulderProgram] },
  ],
};
