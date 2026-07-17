/* =========================================================================
   PROGRESS — level, streak, lifetime stats, badges, goal
   ========================================================================= */
import React from "react";
import { APP_DATA as PR } from "../data.js";
import { Icon, Eyebrow, Ring, Bar, Chip } from "../components.jsx";
import { useStore } from "../store.jsx";
import { WeightCard, CalorieCounter, SupplementsSection, AttributePanel } from "./body.jsx";

export function ProgressScreen() {
  const store = useStore();
  const lvl = store.level();
  const stats = store.stats();

  // derive a few extra facts for badges
  let anyFuelDay = false, thriftyDay = false;
  PR.week.forEach((d) => {
    const t = store.dayTasks(d.key);
    if (t.fuelComplete) {
      anyFuelDay = true;
      const plan = store.planFor(d);
      const cost = plan.reduce((a, m) => a + PR.mealTotals(m).cost, 0);
      if (cost < 6) thriftyDay = true;
    }
  });

  const unlocked = {
    "first-set": stats.exercises >= 1,
    session: stats.sessions >= 1,
    fuelled: anyFuelDay,
    glycogen: stats.cardio >= 1,
    level5: lvl.level >= 5,
    "perfect-day": stats.daysComplete >= 1,
    week: stats.daysComplete >= 3,
    thrifty: thriftyDay,
  };
  const unlockedCount = Object.values(unlocked).filter(Boolean).length;

  const statTiles = [
    { label: "Exercises", val: stats.exercises, icon: "Dumbbell" },
    { label: "Sessions", val: stats.sessions, icon: "CircleCheck" },
    { label: "Cardio", val: stats.cardio, icon: "Zap" },
    { label: "Meals", val: stats.meals, icon: "UtensilsCrossed" },
    { label: "Full days", val: stats.daysComplete, icon: "Flame" },
    { label: "Spent", val: "£" + stats.spend.toFixed(0), icon: "PoundSterling" },
  ];

  return (
    <div className="px-4 pb-4">
      <div className="pt-1">
        <Eyebrow>Progress</Eyebrow>
        <h1 className="mt-0.5 text-[26px] font-semibold leading-none tracking-tight text-neutral-900">Your Journey</h1>
      </div>

      {/* level hero */}
      <div className="relative mt-4 overflow-hidden rounded-3xl bg-neutral-900 p-5 text-white">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[oklch(0.6_0.13_150)] opacity-[0.14] blur-2xl" />
        <div className="flex items-center gap-4">
          <Ring pct={lvl.pct} size={92} stroke={8} color="oklch(0.7 0.15 150)" track="rgba(255,255,255,0.12)">
            <span className="text-[28px] font-semibold leading-none tabular-nums">{lvl.level}</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/40">Level</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-semibold">Athlete</span>
              <Chip tone="green" className="!bg-white/10 !text-[oklch(0.85_0.12_150)]"><Icon name="Flame" size={11} /> {stats.daysComplete} days</Chip>
            </div>
            <div className="mb-1.5 mt-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
              <span>{lvl.total} XP total</span><span>{lvl.span - lvl.into} to L{lvl.level + 1}</span>
            </div>
            <Bar pct={lvl.pct} color="bg-[oklch(0.7_0.15_150)]" track="bg-white/10" height="h-1.5" />
          </div>
        </div>
      </div>

      {/* attributes */}
      <div className="mb-2.5 mt-6 flex items-center gap-2">
        <Icon name="Sparkles" size={15} className="text-neutral-400" />
        <h2 className="text-[13px] font-semibold tracking-tight text-neutral-700">Attributes</h2>
      </div>
      <AttributePanel />

      {/* stats */}
      <div className="mb-2.5 mt-6"><h2 className="text-[13px] font-semibold tracking-tight text-neutral-700">This Week</h2></div>
      <div className="grid grid-cols-3 gap-2.5">
        {statTiles.map((s) => (
          <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white p-3">
            <Icon name={s.icon} size={15} className="text-neutral-300" />
            <div className="mt-2 text-[22px] font-semibold leading-none tabular-nums text-neutral-900">{s.val}</div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-neutral-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* body weight */}
      <div className="mb-2.5 mt-6 flex items-center gap-2">
        <Icon name="Scale" size={15} className="text-neutral-400" />
        <h2 className="text-[13px] font-semibold tracking-tight text-neutral-700">Body Weight</h2>
      </div>
      <WeightCard />

      {/* calorie counter */}
      <div className="mb-2.5 mt-6 flex items-center gap-2">
        <Icon name="Calculator" size={15} className="text-neutral-400" />
        <h2 className="text-[13px] font-semibold tracking-tight text-neutral-700">Calorie Counter</h2>
      </div>
      <CalorieCounter />

      {/* badges */}
      <div className="mb-2.5 mt-6 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold tracking-tight text-neutral-700">Achievements</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-400">{unlockedCount}/{PR.badges.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {PR.badges.map((b) => {
          const on = unlocked[b.id];
          return (
            <div key={b.id} className={"flex items-center gap-3 rounded-2xl border p-3 transition " + (on ? "border-[oklch(0.85_0.07_150)] bg-[oklch(0.98_0.015_150)]" : "border-neutral-200 bg-white")}>
              <span className={"grid h-10 w-10 shrink-0 place-items-center rounded-xl " + (on ? "bg-[oklch(0.6_0.13_150)] text-white" : "bg-neutral-100 text-neutral-300")}>
                <Icon name={on ? b.icon : "Lock"} size={18} />
              </span>
              <div className="min-w-0">
                <div className={"truncate text-[13px] font-semibold leading-tight " + (on ? "text-neutral-900" : "text-neutral-400")}>{b.name}</div>
                <div className="mt-0.5 text-[10.5px] leading-tight text-neutral-400">{b.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* goal */}
      <div className="mb-2.5 mt-6"><h2 className="text-[13px] font-semibold tracking-tight text-neutral-700">Goal</h2></div>
      <div className="rounded-3xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-neutral-900 text-white"><Icon name="Target" size={20} /></span>
          <div>
            <div className="text-[15px] font-semibold text-neutral-900">{PR.profile.goal}</div>
            <div className="text-[12px] text-neutral-400">{PR.profile.goalNote}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-neutral-200">
          {[["Height", PR.profile.height.split(" ")[0]], ["Weight", PR.profile.weight + "kg"], ["Protein", PR.targets.gym.protein + "g"]].map(([l, v]) => (
            <div key={l} className="bg-white py-2.5 text-center">
              <div className="text-[15px] font-semibold tabular-nums text-neutral-900">{v}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-neutral-400">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* supplements & shakes */}
      <div className="mb-2.5 mt-6 flex items-center gap-2">
        <Icon name="Pill" size={15} className="text-neutral-400" />
        <h2 className="text-[13px] font-semibold tracking-tight text-neutral-700">Supplements &amp; Shakes</h2>
      </div>
      <SupplementsSection />

      <button onClick={() => { if (confirm("Reset all progress, XP and logged days?")) store.resetProgress(); }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3 text-[13px] font-medium text-neutral-500 transition active:scale-[0.99]">
        <Icon name="RotateCcw" size={15} /> Reset progress
      </button>
    </div>
  );
}
