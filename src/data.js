/* =========================================================================
   APP DATA — Body Recomposition programme for a 6ft, 94kg male athlete
   All values in UK English / metric / £ GBP
   ========================================================================= */

// ---- Athlete profile -------------------------------------------------
const profile = {
  height: "6ft (183 cm)",
  weight: 94, // kg
  sex: "Male",
  goal: "Body Recomposition",
  goalNote: "Shedding body fat while preserving & building lean mass",
  proteinPerKg: 2.0,
};

// ---- Nutrition target templates -------------------------------------
// Protein held constant at ~2.0 g/kg (≈190 g) to protect lean mass.
const targets = {
  gym:        { kcal: 2700, protein: 190, carbs: 300, fat: 80 },
  rest:       { kcal: 2300, protein: 190, carbs: 200, fat: 75 },
  cardioBase: { kcal: 2700, protein: 190, carbs: 250, fat: 80 },
  cardioFuel: { kcal: 3200, protein: 190, carbs: 340, fat: 80 },
};
// surge delta applied when a cardio session is marked complete
targets.surge = {
  kcal: targets.cardioFuel.kcal - targets.cardioBase.kcal,   // +500
  carbs: targets.cardioFuel.carbs - targets.cardioBase.carbs, // +90
};

// ---- Weekly schedule -------------------------------------------------
const week = [
  { key: "mon", short: "Mon", name: "Monday",    type: "cardio", activity: "Football", icon: "Goal",       blurb: "Pitch session — aerobic + repeated sprints" },
  { key: "tue", short: "Tue", name: "Tuesday",   type: "gym",    session: "upper",     icon: "Dumbbell",   blurb: "Upper Body Hypertrophy" },
  { key: "wed", short: "Wed", name: "Wednesday", type: "cardio", activity: "Boxing",   icon: "Swords",     blurb: "Boxing — high-intensity conditioning" },
  { key: "thu", short: "Thu", name: "Thursday",  type: "rest",                         icon: "Moon",       blurb: "Rest & recovery" },
  { key: "fri", short: "Fri", name: "Friday",    type: "gym",    session: "lower",     icon: "Dumbbell",   blurb: "Lower Body Strength" },
  { key: "sat", short: "Sat", name: "Saturday",  type: "gym",    session: "fullbody",  icon: "Dumbbell",   blurb: "Full Body / Functional Power" },
  { key: "sun", short: "Sun", name: "Sunday",    type: "rest",                         icon: "Moon",       blurb: "Rest & recovery" },
];

// helper: which nutrition template a given day uses (base, pre-surge)
function baseTemplateFor(day) {
  if (day.type === "gym") return "gym";
  if (day.type === "rest") return "rest";
  return "cardioBase";
}

// ---- Workout sessions ------------------------------------------------
// Progressive overload: a 4-week mesocycle. Compounds add load (kg),
// accessories climb the rep range then add a little load.
// `prog` strings are the week-by-week prescription.
const sessions = {
  upper: {
    key: "upper",
    day: "Tuesday",
    title: "Upper Body Hypertrophy",
    focus: "Chest · Back · Shoulders",
    note: "Programmed away from leg days to keep the lower body fresh for football & boxing.",
    exercises: [
      { name: "Barbell Bench Press",            muscle: "Chest",       scheme: "3 × 6–10",  prog: ["60kg × 8", "62.5kg × 8", "65kg × 8", "67.5kg × 8"] },
      { name: "Bent-Over Barbell Rows",         muscle: "Back",        scheme: "3 × 8–10",  prog: ["70kg × 8", "72.5kg × 8", "75kg × 8", "77.5kg × 8"] },
      { name: "Seated Dumbbell Overhead Press", muscle: "Shoulders",   scheme: "3 × 10–12", prog: ["22kg × 10", "22kg × 11", "24kg × 10", "24kg × 11"] },
      { name: "Cable Lat Pulldowns",            muscle: "Lats",        scheme: "3 × 10–12", prog: ["55kg × 10", "55kg × 12", "60kg × 10", "60kg × 12"] },
      { name: "Lateral Raises",                 muscle: "Side Delts",  scheme: "3 × 12–15", prog: ["10kg × 12", "10kg × 14", "12kg × 12", "12kg × 14"] },
    ],
  },
  lower: {
    key: "lower",
    day: "Friday",
    title: "Lower Body Strength",
    focus: "Quads · Hamstrings · Calves",
    note: "Sits two days after football and the day before Saturday — heavy strength work with full recovery either side.",
    exercises: [
      { name: "Barbell Back Squats",  muscle: "Quads",      scheme: "4 × 5–8",   prog: ["90kg × 6", "95kg × 6", "100kg × 6", "102.5kg × 6"] },
      { name: "Romanian Deadlifts",   muscle: "Hamstrings", scheme: "3 × 8–10",  prog: ["80kg × 8", "85kg × 8", "90kg × 8", "92.5kg × 8"] },
      { name: "Leg Press Machine",    muscle: "Quads",      scheme: "3 × 10–12", prog: ["140kg × 10", "150kg × 10", "160kg × 10", "170kg × 10"] },
      { name: "Seated Calf Raises",   muscle: "Calves",     scheme: "3 × 12–15", prog: ["40kg × 12", "45kg × 12", "50kg × 12", "55kg × 12"] },
    ],
  },
  fullbody: {
    key: "fullbody",
    day: "Saturday",
    title: "Full Body / Functional Power",
    focus: "Unilateral · Push · Pull · Core",
    note: "Lower-load, higher-control session to round out the week without taxing the CNS before Sunday's rest.",
    exercises: [
      { name: "Dumbbell Split Squats",   muscle: "Legs (unilateral)", scheme: "3 × 10–12 / leg", prog: ["20kg × 10", "22kg × 10", "24kg × 10", "26kg × 10"] },
      { name: "Incline Dumbbell Press",  muscle: "Upper Chest",       scheme: "3 × 8–12",        prog: ["28kg × 10", "30kg × 10", "30kg × 12", "32kg × 10"] },
      { name: "Cable Rows",              muscle: "Mid Back",          scheme: "3 × 10–15",       prog: ["60kg × 12", "65kg × 12", "70kg × 12", "75kg × 12"] },
      { name: "Core Superset",           muscle: "Plank + Hanging Leg Raise", scheme: "3 rounds", prog: ["60s + 10", "70s + 12", "80s + 12", "90s + 15"], superset: true },
    ],
  },
};

// ---- UK food database (typical supermarket pricing) ------------------
// macros per stated serving; cost in £ GBP.
const foods = [
  { name: "Porridge Oats",        serving: "50 g (dry)",   kcal: 189, protein: 6,  carbs: 33, fat: 4,  cost: 0.10, tag: "Carb" },
  { name: "Jacket Potato",        serving: "1 large, 250g",kcal: 215, protein: 5,  carbs: 49, fat: 0,  cost: 0.30, tag: "Carb" },
  { name: "Wholewheat Pasta",     serving: "75 g (dry)",   kcal: 263, protein: 11, carbs: 50, fat: 2,  cost: 0.22, tag: "Carb" },
  { name: "Chicken Breast",       serving: "150 g",        kcal: 248, protein: 47, carbs: 0,  fat: 5,  cost: 1.35, tag: "Protein" },
  { name: "Lean Beef Mince (5%)", serving: "150 g",        kcal: 264, protein: 32, carbs: 0,  fat: 15, cost: 1.80, tag: "Protein" },
  { name: "Large Eggs",           serving: "2 eggs",       kcal: 156, protein: 13, carbs: 1,  fat: 11, cost: 0.50, tag: "Protein" },
  { name: "Greek Yoghurt (0%)",   serving: "170 g pot",    kcal: 97,  protein: 17, carbs: 6,  fat: 0,  cost: 0.55, tag: "Protein" },
  { name: "Baked Beans",          serving: "½ tin, 207g",  kcal: 162, protein: 10, carbs: 27, fat: 1,  cost: 0.40, tag: "Mixed" },
  { name: "Isotonic Sports Drink",serving: "500 ml",       kcal: 140, protein: 0,  carbs: 32, fat: 0,  cost: 1.00, tag: "Fuel" },
  // pantry staples — round out fats & carbs to hit macro targets
  { name: "Brown Rice",           serving: "75 g (dry)",   kcal: 261, protein: 6,  carbs: 56, fat: 2,  cost: 0.18, tag: "Carb" },
  { name: "Banana",               serving: "1 medium",     kcal: 105, protein: 1,  carbs: 27, fat: 0,  cost: 0.15, tag: "Carb" },
  { name: "Peanut Butter",        serving: "30 g",         kcal: 188, protein: 7,  carbs: 6,  fat: 16, cost: 0.20, tag: "Fat" },
  { name: "Olive Oil",            serving: "1 tbsp",       kcal: 124, protein: 0,  carbs: 0,  fat: 14, cost: 0.10, tag: "Fat" },
  { name: "Semi-Skimmed Milk",    serving: "250 ml",       kcal: 124, protein: 9,  carbs: 12, fat: 4,  cost: 0.18, tag: "Mixed" },
  { name: "Mixed Nuts",           serving: "30 g",         kcal: 180, protein: 6,  carbs: 5,  fat: 16, cost: 0.35, tag: "Fat" },
  { name: "Whey Protein",         serving: "1 scoop, 30g", kcal: 120, protein: 24, carbs: 3,  fat: 2,  cost: 0.45, tag: "Protein" },
];

// food lookup by name
const foodMap = {};
foods.forEach((f) => { foodMap[f.name] = f; });

// ---- Meal plans per nutrition template -------------------------------
// Each meal references foods by name × quantity (servings). Totals are
// summed at runtime so they always agree with the food database.
const mealPlans = {
  gym: [
    { id: "gym-b", slot: "Breakfast", time: "07:30", name: "Power Porridge",     tip: "Slow-release carbs to fuel the session.",
      items: [["Porridge Oats", 2], ["Banana", 1], ["Peanut Butter", 1], ["Semi-Skimmed Milk", 1]] },
    { id: "gym-l", slot: "Lunch",     time: "13:00", name: "Chicken & Rice Bowl", tip: "Lean protein + complex carbs.",
      items: [["Chicken Breast", 1], ["Brown Rice", 1], ["Baked Beans", 1], ["Olive Oil", 1]] },
    { id: "gym-d", slot: "Dinner",    time: "19:00", name: "Beef & Pasta",        tip: "Protein-rich recovery meal.",
      items: [["Lean Beef Mince (5%)", 1], ["Wholewheat Pasta", 1]] },
    { id: "gym-s", slot: "Snack",     time: "Post-WO", name: "Recovery Shake",    tip: "Fast protein within 60 min of training.",
      items: [["Whey Protein", 1], ["Greek Yoghurt (0%)", 1], ["Mixed Nuts", 1], ["Isotonic Sports Drink", 1]] },
  ],
  rest: [
    { id: "rest-b", slot: "Breakfast", time: "08:30", name: "Greek Yoghurt Bowl", tip: "Higher protein, lower carb start.",
      items: [["Greek Yoghurt (0%)", 2], ["Large Eggs", 1], ["Mixed Nuts", 1]] },
    { id: "rest-l", slot: "Lunch",     time: "13:00", name: "Chicken Salad Jacket", tip: "Keep carbs moderate on rest days.",
      items: [["Chicken Breast", 1], ["Jacket Potato", 1], ["Olive Oil", 1]] },
    { id: "rest-d", slot: "Dinner",    time: "19:00", name: "Beef & Beans",        tip: "Satiating protein and fibre.",
      items: [["Lean Beef Mince (5%)", 1], ["Baked Beans", 1]] },
    { id: "rest-s", slot: "Snack",     time: "21:00", name: "Casein Top-up",       tip: "Slow protein before bed.",
      items: [["Greek Yoghurt (0%)", 1], ["Peanut Butter", 1]] },
  ],
  cardioBase: [
    { id: "car-b", slot: "Breakfast", time: "07:30", name: "Pre-Match Oats",     tip: "Carbs for steady energy on the pitch.",
      items: [["Porridge Oats", 2], ["Banana", 1], ["Semi-Skimmed Milk", 1]] },
    { id: "car-l", slot: "Lunch",     time: "12:30", name: "Chicken & Rice Bowl", tip: "Top up glycogen before activity.",
      items: [["Chicken Breast", 1], ["Brown Rice", 1], ["Baked Beans", 1]] },
    { id: "car-d", slot: "Dinner",    time: "19:30", name: "Beef & Spuds",        tip: "Refuel after the session.",
      items: [["Lean Beef Mince (5%)", 1], ["Jacket Potato", 1], ["Olive Oil", 1]] },
    { id: "car-s", slot: "Snack",     time: "16:00", name: "Protein Hit",         tip: "Keep protein high through the day.",
      items: [["Whey Protein", 1], ["Greek Yoghurt (0%)", 1], ["Mixed Nuts", 1]] },
  ],
  // cardioFuel = cardioBase plus a dedicated glycogen-replenishment meal
  cardioFuel: [
    { id: "carf-b", slot: "Breakfast", time: "07:30", name: "Pre-Match Oats",    tip: "Carbs for steady energy on the pitch.",
      items: [["Porridge Oats", 2], ["Banana", 1], ["Semi-Skimmed Milk", 1]] },
    { id: "carf-l", slot: "Lunch",     time: "12:30", name: "Chicken & Rice Bowl", tip: "Top up glycogen before activity.",
      items: [["Chicken Breast", 1], ["Brown Rice", 1], ["Baked Beans", 1]] },
    { id: "carf-f", slot: "Recovery",  time: "Post",   name: "Glycogen Refuel",   highlight: true, tip: "Unlocked after cardio — fast carbs replenish glycogen.",
      items: [["Isotonic Sports Drink", 1], ["Banana", 1], ["Whey Protein", 1]] },
    { id: "carf-d", slot: "Dinner",    time: "19:30", name: "Beef & Spuds",       tip: "Refuel after the session.",
      items: [["Lean Beef Mince (5%)", 1], ["Jacket Potato", 1], ["Olive Oil", 1]] },
    { id: "carf-s", slot: "Snack",     time: "16:00", name: "Protein Hit",        tip: "Keep protein high through the day.",
      items: [["Whey Protein", 1], ["Greek Yoghurt (0%)", 1], ["Mixed Nuts", 1]] },
  ],
};

function planKeyFor(day, cardioDone) {
  if (day.type === "gym") return "gym";
  if (day.type === "rest") return "rest";
  return cardioDone ? "cardioFuel" : "cardioBase";
}

// sum a meal's macros + cost from the food database
function mealTotals(meal) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, cost: 0 };
  meal.items.forEach(([name, qty]) => {
    const f = foodMap[name];
    if (!f) return;
    t.kcal += f.kcal * qty; t.protein += f.protein * qty;
    t.carbs += f.carbs * qty; t.fat += f.fat * qty; t.cost += f.cost * qty;
  });
  return t;
}

// ---- Gamification ----------------------------------------------------
const xpValues = { exercise: 15, sessionBonus: 60, cardio: 50, meal: 12, fuelBonus: 40, dayComplete: 75 };

const badges = [
  { id: "first-set",   name: "First Rep",      desc: "Complete your first exercise",      icon: "Dumbbell" },
  { id: "session",     name: "Session Logged", desc: "Finish a full gym session",         icon: "CircleCheck" },
  { id: "fuelled",     name: "Fuelled Up",     desc: "Log every meal in a day",           icon: "Apple" },
  { id: "glycogen",    name: "Glycogen Loaded",desc: "Complete a cardio session",         icon: "Zap" },
  { id: "level5",      name: "Rising",         desc: "Reach Level 5",                     icon: "TrendingUp" },
  { id: "perfect-day", name: "Perfect Day",    desc: "100% complete a full day",          icon: "Star" },
  { id: "week",        name: "Week Warrior",   desc: "Complete 3 full days",              icon: "Flame" },
  { id: "thrifty",     name: "Thrifty Athlete",desc: "Plan a day under £6",               icon: "PoundSterling" },
];

export const APP_DATA = {
  profile, targets, week, sessions, foods, foodMap, baseTemplateFor,
  mealPlans, planKeyFor, mealTotals, xpValues, badges,
  mesocycleWeeks: 4,
};
