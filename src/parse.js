/* =========================================================================
   PARSE — on-device natural-language logging. Recognises foods & exercises
   from free text against the app's database. No network / API key needed.
   ========================================================================= */
import { APP_DATA as D } from "./data.js";

const NUM_WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, double: 2, triple: 3, half: 0.5 };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---- foods: name → recognised phrases (longest matched first) ----------
const FOOD_SYNONYMS = {
  "Porridge Oats": ["porridge", "oats", "oatmeal"],
  "Jacket Potato": ["jacket potato", "baked potato", "potato", "spud", "spuds"],
  "Wholewheat Pasta": ["wholewheat pasta", "pasta", "spaghetti"],
  "Chicken Breast": ["chicken breast", "chicken"],
  "Lean Beef Mince (5%)": ["beef mince", "mince", "beef"],
  "Large Eggs": ["eggs", "egg"],
  "Greek Yoghurt (0%)": ["greek yoghurt", "greek yogurt", "yoghurt", "yogurt"],
  "Baked Beans": ["baked beans", "beans"],
  "Isotonic Sports Drink": ["sports drink", "isotonic", "lucozade", "gatorade", "energy drink"],
  "Brown Rice": ["brown rice", "rice"],
  "Banana": ["bananas", "banana"],
  "Peanut Butter": ["peanut butter", "pb"],
  "Olive Oil": ["olive oil"],
  "Semi-Skimmed Milk": ["semi skimmed milk", "semi-skimmed milk", "milk"],
  "Mixed Nuts": ["mixed nuts", "nuts"],
  "Whey Protein": ["clear whey", "whey protein", "whey", "protein shake", "protein powder", "shake"],
};

// meal slot guessed from wording / time of day
function guessSlot(text) {
  const t = text.toLowerCase();
  if (/\bbreakfast|morning|porridge|cereal\b/.test(t)) return "Breakfast";
  if (/\blunch|midday|noon\b/.test(t)) return "Lunch";
  if (/\bdinner|evening|tea\b/.test(t)) return "Dinner";
  if (/\bsnack|shake|post.?workout|pre.?workout\b/.test(t)) return "Snack";
  const h = new Date().getHours();
  return h < 11 ? "Breakfast" : h < 15 ? "Lunch" : h < 18 ? "Snack" : "Dinner";
}

export function parseMeal(text) {
  let work = " " + text.toLowerCase() + " ";
  const pairs = [];
  for (const name in FOOD_SYNONYMS) for (const kw of FOOD_SYNONYMS[name]) pairs.push([name, kw]);
  pairs.sort((a, b) => b[1].length - a[1].length); // longest phrases win first

  const items = [];
  const taken = new Set();
  for (const [name, kw] of pairs) {
    if (taken.has(name)) continue;
    const re = new RegExp("(?:(\\d+(?:\\.\\d+)?|a|an|one|two|three|four|five|six|seven|eight|double|triple|half)\\s+)?" + esc(kw) + "(?:s\\b|\\b)", "i");
    const m = work.match(re);
    if (!m) continue;
    let qty = 1;
    if (m[1]) {
      const w = m[1].toLowerCase();
      qty = NUM_WORDS[w] != null ? NUM_WORDS[w] : parseFloat(w);
      if (!qty || Number.isNaN(qty)) qty = 1;
    }
    items.push({ name, qty });
    taken.add(name);
    work = work.replace(new RegExp(esc(kw), "ig"), " "); // consume so shorter kws don't re-hit
  }

  const totals = D.mealTotals({ items: items.map((i) => [i.name, i.qty]) });
  return { items, totals, slot: guessSlot(text) };
}

// ---- exercises: canonical name → phrases --------------------------------
const EX_SYNONYMS = {
  "Barbell Bench Press": ["bench press", "bench"],
  "Bent-Over Barbell Rows": ["barbell row", "bent over row", "bent-over row", "rows", "row"],
  "Seated Dumbbell Overhead Press": ["overhead press", "shoulder press", "ohp", "military press"],
  "Cable Lat Pulldowns": ["lat pulldown", "pulldown", "pulldowns", "lat pull"],
  "Lateral Raises": ["lateral raise", "lateral raises", "lat raise", "side raise"],
  "Barbell Back Squats": ["back squat", "squats", "squat"],
  "Romanian Deadlifts": ["romanian deadlift", "rdls", "rdl", "deadlift", "deadlifts"],
  "Leg Press Machine": ["leg press"],
  "Seated Calf Raises": ["calf raise", "calf raises", "calves"],
  "Dumbbell Split Squats": ["split squat", "split squats", "bulgarian", "lunge", "lunges"],
  "Incline Dumbbell Press": ["incline press", "incline dumbbell", "incline"],
  "Cable Rows": ["cable row", "seated row"],
  "Core Superset": ["hanging leg raise", "leg raise", "plank", "core"],
};

// pull "3x8", "3 x 8", "60kg", "for 30 min" out of a chunk
function parseDetail(chunk) {
  const sr = chunk.match(/(\d+)\s*[x×]\s*(\d+)/i);
  const kg = chunk.match(/(\d+(?:\.\d+)?)\s*kg/i);
  const mins = chunk.match(/(\d+)\s*(?:min|mins|minutes)\b/i);
  const parts = [];
  if (sr) parts.push(sr[1] + "×" + sr[2]);
  if (kg) parts.push(kg[1] + "kg");
  if (mins) parts.push(mins[1] + " min");
  return parts.join(" · ");
}

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export function parseExercise(text) {
  // split into chunks so "squats 3x5 100kg and bench 3x8" logs both cleanly
  const chunks = text.split(/\s*(?:,|&|\band\b|\bthen\b|\+|\n)\s*/i).map((c) => c.trim()).filter(Boolean);
  const out = [];
  const seen = new Set();

  const pairs = [];
  for (const name in EX_SYNONYMS) for (const kw of EX_SYNONYMS[name]) pairs.push([name, kw]);
  pairs.sort((a, b) => b[1].length - a[1].length);

  for (const chunk of chunks) {
    const lc = " " + chunk.toLowerCase() + " ";
    let matched = null;
    for (const [name, kw] of pairs) {
      if (new RegExp("(?:^|[^a-z])" + esc(kw) + "(?:[^a-z]|$)", "i").test(lc)) { matched = name; break; }
    }
    const detail = parseDetail(chunk);
    if (matched) {
      if (seen.has(matched)) continue;
      seen.add(matched);
      out.push({ name: matched, detail, known: true });
    } else {
      // free-form: keep the words, drop the numbers for the label
      const label = titleCase(chunk.replace(/\d+\s*[x×]\s*\d+|\d+(?:\.\d+)?\s*kg|\d+\s*(?:min|mins|minutes)?/gi, "").replace(/\s+/g, " ").trim());
      if (label && label.length > 1) out.push({ name: label, detail, known: false });
    }
  }
  return out;
}
