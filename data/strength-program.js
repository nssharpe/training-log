// Strength program. Most entries use inputType "setsRepsWeight" (reps + weight per set);
// pass "check" as the 6th arg for exercises that are just a checkbox per set.

const ex = (order, name, reps, tempo, defaultSets = 3, inputType = "setsRepsWeight") => ({
  key: `s-${order.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  order,
  name,
  inputType,
  prescription: { reps, tempo, sets: String(defaultSets), rest: "—" },
  defaultSets,
});

export const STRENGTH = {
  splits: [
    {
      id: "tt-am",
      name: "Tue / Thu — AM",
      exercises: [
        ex("A1", "Band Assisted Cross Pulls", "8", "3010"),
        ex("A2", "Handstand Pushups", "8", "3010"),
      ],
    },
    {
      id: "tt-pm",
      name: "Tue / Thu — PM",
      exercises: [
        ex("A1", "Maltese Dumbbell Negatives", "4–6", "35x9"),
        ex("A2", "Prone Front Lever Flies", "8–10", "3010"),
        ex("A5", "Inverted Cross Dumbbell Negatives", "4–6", "35x9"),
        ex("A6", "Wrist Curls", "8–10", "3010"),
        ex("A7", "Reverse Wrist Curls", "8–10", "3010"),
        ex("A8", "Resisted Pronation / Supination", "10", "2020", 3, "check"),
        ex("A9", "Rice Bucket Exercises", "—", "—", 3, "check"),
      ],
    },
    {
      id: "mwf-am",
      name: "M / W / F — AM",
      exercises: [
        ex("A1", "Supinated Curls", "12", "3010"),
        ex("A2", "Hammer Curls", "12", "3010"),
        ex("B1", "Resisted Pronation / Supination", "12", "2020", 3, "check"),
        ex("B2", "Zottman Curls", "10", "3010"),
      ],
    },
    {
      id: "mwf-pm",
      name: "M / W / F — PM",
      exercises: [
        ex("A1", "Scapular Pullups", "8", "3010", 3, "check"),
        ex("A2", "German Hangs", "5", "3510", 3, "check"),
        ex("B1", "Cuban Rotations", "10", "3010"),
        ex("B2", "Prone Y-T-W", "8", "3010"),
      ],
    },
  ],
};
