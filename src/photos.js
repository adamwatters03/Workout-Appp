/* =========================================================================
   BUNDLED PHOTOS — default images that ship with the app, keyed by the
   same slot ids the <Photo> component uses. A user drag/drop still overrides
   the default (stored in localStorage); "Remove" reverts to the default.
   ========================================================================= */
import { APP_DATA } from "./data.js";

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// eager-import every bundled photo → { "sess-upper": url, "ex-…": url, … }
// keyed by filename (minus extension). Vite hashes + rewrites the URLs.
const modules = import.meta.glob("./assets/photos/*.{jpg,jpeg,png,webp}", { eager: true, import: "default" });
const byBase = {};
for (const path in modules) {
  const base = path.split("/").pop().replace(/\.[^.]+$/, "");
  byBase[base] = modules[path];
}

// slot-id → url. Session (`sess-<key>`) and exercise (`ex-<slug>`) slot ids
// already equal their filenames, so those pass through directly.
const map = { ...byBase };

// Meal slots are keyed `meal-<mealId>` (e.g. meal-gym-b), but the same dish
// recurs under several ids across day types — all share one file named by the
// dish, `meal-<slug(name)>`. Alias every meal slot id to its dish image.
Object.values(APP_DATA.mealPlans).forEach((plan) => {
  plan.forEach((meal) => {
    const file = byBase["meal-" + slug(meal.name)];
    if (file) map["meal-" + meal.id] = file;
  });
});

export function defaultPhoto(id) {
  return map[id];
}
