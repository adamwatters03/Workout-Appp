/* =========================================================================
   FUEL — daily plan (tab) · meal detail · food database · food detail
   ========================================================================= */
import React from "react";
import { APP_DATA as FU } from "../data.js";
import { Icon, Eyebrow, AnimatedNumber, Ring, Bar, Chip, Photo, CheckToggle, slug } from "../components.jsx";
import { useStore } from "../store.jsx";
import { useNav, DetailHeader } from "../nav.jsx";
import { fx, floatXp } from "../fx.js";

function loggedTotals(plan, eatenIds) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, cost: 0 };
  eatenIds.forEach((id) => {
    const m = plan.find((mm) => mm.id === id);
    if (!m) return;
    const mt = FU.mealTotals(m);
    t.kcal += mt.kcal; t.protein += mt.protein; t.carbs += mt.carbs; t.fat += mt.fat; t.cost += mt.cost;
  });
  return t;
}

/* ---- Fuel tab ---- */
export function FuelScreen() {
  const store = useStore();
  const nav = useNav();
  const dayKey = store.state.selectedDay;
  const day = store.dayByKey(dayKey);
  const plan = store.planFor(day);
  const tplKey = FU.planKeyFor(day, store.isCardioDone(dayKey));
  const tgt = FU.targets[tplKey];
  const eatenIds = Object.keys(store.state.mealsEaten[dayKey] || {}).filter((id) => plan.some((m) => m.id === id));
  const log = loggedTotals(plan, eatenIds);
  const planTotal = plan.reduce((a, m) => { const mt = FU.mealTotals(m); a.cost += mt.cost; return a; }, { cost: 0 });

  const macros = [
    { key: "protein", label: "Protein", val: Math.round(log.protein), tgt: tgt.protein },
    { key: "carbs", label: "Carbs", val: Math.round(log.carbs), tgt: tgt.carbs },
    { key: "fat", label: "Fat", val: Math.round(log.fat), tgt: tgt.fat },
  ];

  return (
    <div className="px-4 pb-4">
      <div className="pt-1">
        <Eyebrow>UK Nutrition · {day.name}</Eyebrow>
        <h1 className="mt-0.5 text-[26px] font-semibold leading-none tracking-tight text-neutral-900">Today's Fuel</h1>
      </div>

      {tplKey === "cardioFuel" && (
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-[oklch(0.97_0.02_150)] px-3.5 py-3 ring-1 ring-inset ring-[oklch(0.9_0.05_150)]">
          <Icon name="Zap" size={16} className="mt-0.5 shrink-0 text-[oklch(0.5_0.13_150)]" />
          <p className="text-[12.5px] leading-snug text-[oklch(0.4_0.08_150)]"><span className="font-semibold">Glycogen replenishment active.</span> Carbs raised by {FU.targets.cardioFuel.carbs - FU.targets.cardioBase.carbs}g — extra recovery meal added below.</p>
        </div>
      )}

      {/* target hero */}
      <div className="mt-3 rounded-3xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-5">
          <Ring pct={tgt.kcal ? Math.min(1, log.kcal / tgt.kcal) : 0} size={108} stroke={10} color="oklch(0.6 0.13 150)" track="#f2f2f2">
            <AnimatedNumber value={Math.round(log.kcal)} className="text-[24px] font-semibold leading-none tabular-nums text-neutral-900" />
            <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-neutral-400">/ {tgt.kcal.toLocaleString()}</span>
          </Ring>
          <div className="min-w-0 flex-1 space-y-3">
            {macros.map((m) => (
              <div key={m.key}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="text-neutral-500">{m.label}</span>
                  <span className="tabular-nums text-neutral-400"><span className="font-semibold text-neutral-900">{m.val}</span> / {m.tgt}g</span>
                </div>
                <Bar pct={m.tgt ? Math.min(1, m.val / m.tgt) : 0} height="h-1.5"
                  color={m.key === "protein" ? "bg-neutral-900" : m.key === "carbs" ? "bg-[oklch(0.62_0.13_150)]" : "bg-neutral-300"} />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-400">{eatenIds.length}/{plan.length} meals · daily cost</span>
          <span className="text-[15px] font-semibold tabular-nums text-neutral-900">£{planTotal.cost.toFixed(2)}</span>
        </div>
      </div>

      {/* meals */}
      <div className="mb-2.5 mt-6 flex items-center gap-2">
        <Icon name="UtensilsCrossed" size={15} className="text-neutral-400" />
        <h2 className="text-[13px] font-semibold tracking-tight text-neutral-700">Meal Plan</h2>
      </div>
      <div className="flex flex-col gap-2.5">
        {plan.map((meal) => {
          const eaten = store.isMealEaten(dayKey, meal.id);
          const mt = FU.mealTotals(meal);
          return (
            <div key={meal.id} className={"flex items-center gap-3 rounded-3xl border bg-white p-2.5 transition " +
              (meal.highlight ? "border-[oklch(0.82_0.08_150)] ring-1 ring-[oklch(0.9_0.06_150)]" : eaten ? "border-[oklch(0.85_0.06_150)]" : "border-neutral-200")}>
              <button onClick={() => nav.push({ type: "meal", dayKey, mealId: meal.id })} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <Photo id={"meal-" + meal.id} ratio="1 / 1" radius={16} placeholder="Photo" className="w-[60px] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-400">{meal.slot}</span>
                    {meal.highlight && <Icon name="Zap" size={11} className="text-[oklch(0.55_0.13_150)]" />}
                  </div>
                  <div className={"truncate text-[14px] font-semibold leading-tight " + (eaten ? "text-neutral-400" : "text-neutral-900")}>{meal.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-400">
                    <span className="tabular-nums">{Math.round(mt.kcal)} kcal</span><span>·</span>
                    <span className="tabular-nums">{Math.round(mt.protein)}P</span><span>·</span>
                    <span className="tabular-nums">£{mt.cost.toFixed(2)}</span>
                  </div>
                </div>
              </button>
              <CheckToggle checked={eaten} onClick={() => { store.toggleMeal(dayKey, meal.id); if (!eaten) { fx.pop(); floatXp(`+${FU.xpValues.meal} XP`); } else fx.uncheck(); }} />
            </div>
          );
        })}
      </div>

      <button onClick={() => nav.push({ type: "foodDb" })}
        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-left transition active:scale-[0.99]">
        <span className="flex items-center gap-2.5"><Icon name="Database" size={17} className="text-neutral-500" /><span className="text-[14px] font-medium text-neutral-800">UK Food Database</span></span>
        <Icon name="ChevronRight" size={18} className="text-neutral-300" />
      </button>
    </div>
  );
}

/* ---- Meal detail ---- */
export function MealDetail({ dayKey, mealId }) {
  const store = useStore();
  const day = store.dayByKey(dayKey);
  const plan = store.planFor(day);
  const meal = plan.find((m) => m.id === mealId);
  if (!meal) return <DetailHeader title="Meal" />;
  const eaten = store.isMealEaten(dayKey, mealId);
  const mt = FU.mealTotals(meal);

  return (
    <React.Fragment>
      <DetailHeader eyebrow={meal.slot + " · " + meal.time} title={meal.name}
        right={eaten ? <Chip tone="green"><Icon name="Check" size={10} /> Eaten</Chip> : null} />
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="px-4 pt-3">
          <Photo id={"meal-" + meal.id} ratio="16 / 10" placeholder={"Add " + meal.name + " photo"} />
          <p className="mt-3 text-[13px] leading-relaxed text-neutral-500">{meal.tip}</p>

          {/* totals */}
          <div className="mt-4 grid grid-cols-4 gap-px overflow-hidden rounded-2xl bg-neutral-200">
            {[["kcal", Math.round(mt.kcal)], ["P", Math.round(mt.protein) + "g"], ["C", Math.round(mt.carbs) + "g"], ["F", Math.round(mt.fat) + "g"]].map(([l, v]) => (
              <div key={l} className="bg-white py-3 text-center">
                <div className="text-[16px] font-semibold tabular-nums text-neutral-900">{v}</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-neutral-400">{l}</div>
              </div>
            ))}
          </div>

          <div className="mb-2 mt-5 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-neutral-700">Ingredients</h3>
            <span className="text-[13px] font-semibold tabular-nums text-neutral-900">£{mt.cost.toFixed(2)}</span>
          </div>
          <div className="flex flex-col gap-2">
            {meal.items.map(([name, qty]) => {
              const f = FU.foodMap[name];
              return (
                <div key={name} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-2.5">
                  <Photo id={"food-" + slug(name)} ratio="1 / 1" radius={12} placeholder="" className="w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium text-neutral-900">{name}</div>
                    <div className="text-[11px] text-neutral-400">{qty} × {f.serving}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-semibold tabular-nums text-neutral-700">{Math.round(f.kcal * qty)} kcal</div>
                    <div className="font-mono text-[10px] tabular-nums text-neutral-400">£{(f.cost * qty).toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-neutral-200 bg-neutral-50/90 p-4 backdrop-blur" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <button onClick={() => { store.toggleMeal(dayKey, mealId); if (!eaten) { fx.pop(); floatXp(`+${FU.xpValues.meal} XP`); } else fx.uncheck(); }}
          className={"flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-semibold transition active:scale-[0.98] " +
            (eaten ? "bg-[oklch(0.96_0.03_150)] text-[oklch(0.42_0.12_150)] ring-1 ring-inset ring-[oklch(0.88_0.06_150)]" : "bg-neutral-900 text-white")}>
          <Icon name={eaten ? "CircleCheck" : "Circle"} size={18} />
          {eaten ? "Logged — +12 XP earned" : "Mark meal as eaten"}
        </button>
      </div>
    </React.Fragment>
  );
}

/* ---- Food database ---- */
const TAG_COLOR = { Protein: "bg-neutral-900", Carb: "bg-[oklch(0.62_0.13_150)]", Fat: "bg-[oklch(0.72_0.13_85)]", Fuel: "bg-[oklch(0.7_0.15_50)]", Mixed: "bg-neutral-300" };

export function FoodDatabase() {
  const nav = useNav();
  const [filter, setFilter] = React.useState("All");
  const tags = ["All", "Protein", "Carb", "Fat", "Fuel", "Mixed"];
  const list = filter === "All" ? FU.foods : FU.foods.filter((f) => f.tag === filter);

  return (
    <React.Fragment>
      <DetailHeader eyebrow="Typical UK pricing" title="Food Database" />
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="sticky top-0 z-[5] bg-neutral-50/90 px-4 py-2.5 backdrop-blur">
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tags.map((tg) => (
              <button key={tg} onClick={() => setFilter(tg)}
                className={"shrink-0 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition " +
                  (filter === tg ? "bg-neutral-900 text-white" : "bg-white text-neutral-500 ring-1 ring-inset ring-neutral-200")}>{tg}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 px-4 pt-1">
          {list.map((f) => (
            <button key={f.name} onClick={() => nav.push({ type: "food", name: f.name })}
              className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-2.5 text-left transition active:scale-[0.99]">
              <Photo id={"food-" + slug(f.name)} ratio="1 / 1" radius={12} placeholder="" className="w-[52px] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + TAG_COLOR[f.tag]} />
                  <span className="truncate text-[14px] font-medium text-neutral-900">{f.name}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-neutral-400">{f.serving} · {f.kcal} kcal · {f.protein}P</div>
              </div>
              <span className="text-[14px] font-semibold tabular-nums text-neutral-900">£{f.cost.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
}

/* ---- Food detail ---- */
export function FoodDetail({ name }) {
  const f = FU.foodMap[name];
  if (!f) return <DetailHeader title="Food" />;
  const rows = [["Protein", f.protein], ["Carbs", f.carbs], ["Fat", f.fat]];
  return (
    <React.Fragment>
      <DetailHeader eyebrow={f.tag + " · " + f.serving} title={f.name} />
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="px-4 pt-3">
          <Photo id={"food-" + slug(f.name)} ratio="16 / 10" placeholder={"Add " + f.name + " photo"} />
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[40px] font-semibold leading-none tabular-nums text-neutral-900">{f.kcal}</span>
                <span className="text-[13px] text-neutral-400">kcal</span>
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-400">per {f.serving}</div>
            </div>
            <div className="rounded-2xl bg-neutral-900 px-4 py-2.5 text-center text-white">
              <div className="text-[20px] font-semibold tabular-nums leading-none">£{f.cost.toFixed(2)}</div>
              <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-white/50">per serving</div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {rows.map(([l, v]) => (
              <div key={l}>
                <div className="mb-1 flex justify-between text-[12px]"><span className="text-neutral-500">{l}</span><span className="font-semibold tabular-nums text-neutral-900">{v}g</span></div>
                <Bar pct={Math.min(1, v / 60)} height="h-1.5" color={l === "Protein" ? "bg-neutral-900" : l === "Carbs" ? "bg-[oklch(0.62_0.13_150)]" : "bg-neutral-300"} />
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-inset ring-neutral-200">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-400">Protein per £</div>
            <div className="mt-1 text-[22px] font-semibold tabular-nums text-neutral-900">{(f.protein / f.cost).toFixed(0)}g <span className="text-[13px] font-normal text-neutral-400">protein / £1</span></div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
