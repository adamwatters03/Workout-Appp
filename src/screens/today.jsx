/* =========================================================================
   TODAY — gamified overview: progress hero, training & fuel preview cards
   ========================================================================= */
import React from "react";
import { APP_DATA as TD } from "../data.js";
import { Icon, Eyebrow, AnimatedNumber, Ring, Bar, Chip, Photo, SoundToggle } from "../components.jsx";
import { useStore, todayKey } from "../store.jsx";
import { useNav } from "../nav.jsx";
import { fx, floatXp } from "../fx.js";

function GreetingDate() {
  const d = new Date();
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export function TodayScreen() {
  const store = useStore();
  const nav = useNav();
  const dayKey = store.state.selectedDay;
  const day = store.dayByKey(dayKey);
  const tasks = store.dayTasks(dayKey);
  const lvl = store.level();
  const stats = store.stats();
  const isToday = dayKey === todayKey();

  return (
    <div className="px-4 pb-4">
      {/* header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <Eyebrow>{isToday ? "Today" : "Planning"}</Eyebrow>
          <h1 className="mt-0.5 text-[26px] font-semibold leading-none tracking-tight text-neutral-900">{day.name}</h1>
          <p className="mt-1 text-[12px] text-neutral-400">{GreetingDate()}</p>
        </div>
        <div className="flex items-center gap-2">
          <SoundToggle />
          <div className="flex items-center gap-1.5 rounded-full bg-[oklch(0.96_0.04_60)] px-2.5 py-1.5 ring-1 ring-inset ring-[oklch(0.9_0.06_60)]">
            <Icon name="Flame" size={15} className="text-[oklch(0.62_0.16_50)]" />
            <span className="text-[13px] font-semibold tabular-nums text-[oklch(0.45_0.12_50)]">{stats.daysComplete}</span>
          </div>
        </div>
      </div>

      {/* week strip */}
      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TD.week.map((d) => {
          const sel = d.key === dayKey;
          const t = store.dayTasks(d.key);
          return (
            <button key={d.key} onClick={() => store.setSelectedDay(d.key)}
              className={"flex min-w-[44px] flex-1 flex-col items-center gap-1.5 rounded-2xl border py-2.5 transition-all active:scale-95 " +
                (sel ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-900")}>
              <span className={"font-mono text-[9px] uppercase tracking-[0.1em] " + (sel ? "text-white/50" : "text-neutral-400")}>{d.short}</span>
              <Icon name={d.icon} size={16} className={sel ? "text-white" : "text-neutral-500"} />
              <span className={"h-1 w-1 rounded-full " + (t.complete ? "bg-[oklch(0.7_0.15_150)]" : sel ? "bg-white/30" : "bg-neutral-200")} />
            </button>
          );
        })}
      </div>

      {/* gamified hero */}
      <div className="relative mt-4 overflow-hidden rounded-3xl bg-neutral-900 p-5 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[oklch(0.6_0.13_150)] opacity-[0.12] blur-2xl" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-[11px] font-bold tabular-nums">{lvl.level}</span>
            <div className="leading-tight">
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">Level</div>
              <div className="text-[13px] font-medium">Athlete</div>
            </div>
          </div>
          <Chip tone="green" className="!bg-white/10 !text-[oklch(0.85_0.12_150)]">
            <Icon name="Zap" size={11} /> {lvl.total} XP
          </Chip>
        </div>

        <div className="mt-3 flex items-center gap-5">
          <Ring pct={tasks.pct} size={104} stroke={9} color="oklch(0.7 0.15 150)" track="rgba(255,255,255,0.12)">
            <AnimatedNumber value={Math.round(tasks.pct * 100)} className="text-[26px] font-semibold leading-none tabular-nums" format={(n) => Math.round(n)} />
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-white/40">% done</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium leading-snug">
              {tasks.complete ? "Day complete — superb work." :
               tasks.total === 0 ? "Rest day. Refuel and recover." :
               `${tasks.total - tasks.done} ${tasks.total - tasks.done === 1 ? "task" : "tasks"} left to crush.`}
            </p>
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
                <span>Level {lvl.level}</span><span>{lvl.into} / {lvl.span} XP</span>
              </div>
              <Bar pct={lvl.pct} color="bg-[oklch(0.7_0.15_150)]" track="bg-white/10" height="h-1.5" />
            </div>
          </div>
        </div>
      </div>

      {/* TRAINING preview */}
      <SectionLabel icon="Dumbbell">Today's Training</SectionLabel>
      {day.type === "gym" && <TrainPreviewGym day={day} tasks={tasks} onOpen={() => nav.push({ type: "session", dayKey })} />}
      {day.type === "cardio" && <TrainPreviewCardio day={day} dayKey={dayKey} />}
      {day.type === "rest" && <RestPreview />}

      {/* FUEL preview */}
      <SectionLabel icon="Apple">Today's Fuel</SectionLabel>
      <FuelPreview day={day} dayKey={dayKey} onOpen={() => nav.setTab("fuel")} />
    </div>
  );
}

function SectionLabel({ icon, children }) {
  return (
    <div className="mb-2.5 mt-6 flex items-center gap-2">
      <Icon name={icon} size={15} className="text-neutral-400" />
      <h2 className="text-[13px] font-semibold tracking-tight text-neutral-700">{children}</h2>
    </div>
  );
}

function TrainPreviewGym({ day, tasks, onOpen }) {
  const s = TD.sessions[day.session];
  return (
    <button onClick={onOpen} className="block w-full overflow-hidden rounded-3xl border border-neutral-200 bg-white text-left transition active:scale-[0.99]">
      <Photo id={"sess-" + s.key} ratio="16 / 7" radius={0} placeholder={"Add a " + s.title + " photo"}
        overlay={
          <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/55 to-transparent p-4">
            <div className="text-white">
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/70">{s.day} · {s.focus}</div>
              <div className="text-[19px] font-semibold leading-tight">{s.title}</div>
            </div>
          </div>
        } />
      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="font-medium text-neutral-700">{tasks.trainDone} of {tasks.trainTotal} exercises</span>
            {tasks.trainComplete && <Chip tone="green"><Icon name="Check" size={10} /> Done</Chip>}
          </div>
          <Bar pct={tasks.trainTotal ? tasks.trainDone / tasks.trainTotal : 0} color="bg-[oklch(0.6_0.13_150)]" />
        </div>
        <Icon name="ChevronRight" size={20} className="shrink-0 text-neutral-300" />
      </div>
    </button>
  );
}

function TrainPreviewCardio({ day, dayKey }) {
  const store = useStore();
  const done = store.isCardioDone(dayKey);
  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
      <div className="flex items-center gap-3 p-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-900">
          <Icon name={day.icon} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold leading-tight text-neutral-900">{day.activity}</div>
          <div className="text-[12px] text-neutral-400">{day.blurb}</div>
        </div>
        {done && <Chip tone="green"><Icon name="Zap" size={10} /> Logged</Chip>}
      </div>
      <div className="px-4 pb-2">
        <div className="rounded-2xl bg-neutral-50 px-3.5 py-2.5 text-[12px] leading-snug text-neutral-500 ring-1 ring-inset ring-neutral-100">
          Completing unlocks <span className="font-medium text-neutral-700">+{TD.targets.cardioFuel.kcal - TD.targets.cardioBase.kcal} kcal</span> &amp; <span className="font-medium text-neutral-700">+{TD.targets.cardioFuel.carbs - TD.targets.cardioBase.carbs}g carbs</span> for recovery.
        </div>
      </div>
      <div className="p-4 pt-2">
        <button onClick={() => { const was = done; store.toggleCardio(dayKey); if (!was) { fx.success(); floatXp(`+${TD.xpValues.cardio} XP`); } else fx.uncheck(); }}
          className={"flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-semibold transition active:scale-[0.98] " +
            (done ? "bg-[oklch(0.96_0.03_150)] text-[oklch(0.42_0.12_150)] ring-1 ring-inset ring-[oklch(0.88_0.06_150)]"
                  : "bg-neutral-900 text-white")}>
          <Icon name={done ? "CircleCheck" : "Circle"} size={18} />
          {done ? "Activity complete" : "Mark activity as complete"}
        </button>
      </div>
    </div>
  );
}

function RestPreview() {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-neutral-200 bg-white p-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-900">
        <Icon name="Moon" size={22} />
      </span>
      <div>
        <div className="text-[17px] font-semibold leading-tight text-neutral-900">Rest &amp; Recovery</div>
        <div className="text-[12px] text-neutral-400">Sleep, mobility, protein. No training today.</div>
      </div>
    </div>
  );
}

function FuelPreview({ day, dayKey, onOpen }) {
  const store = useStore();
  const plan = store.planFor(day);
  const tplKey = TD.planKeyFor(day, store.isCardioDone(dayKey));
  const tgt = TD.targets[tplKey];
  const eatenIds = Object.keys(store.state.mealsEaten[dayKey] || {}).filter((id) => plan.some((m) => m.id === id));
  const logged = eatenIds.reduce((a, id) => {
    const m = plan.find((mm) => mm.id === id); return a + (m ? TD.mealTotals(m).kcal : 0);
  }, 0);
  return (
    <button onClick={onOpen} className="block w-full rounded-3xl border border-neutral-200 bg-white p-4 text-left transition active:scale-[0.99]">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <AnimatedNumber value={logged} className="text-[28px] font-semibold leading-none tabular-nums text-neutral-900" />
            <span className="text-[13px] text-neutral-300">/ {tgt.kcal.toLocaleString()} kcal</span>
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-400">{eatenIds.length} of {plan.length} meals logged</div>
        </div>
        {tplKey === "cardioFuel" && <Chip tone="green"><Icon name="Zap" size={10} /> Fuelled</Chip>}
      </div>
      <div className="mt-3"><Bar pct={tgt.kcal ? Math.min(1, logged / tgt.kcal) : 0} color="bg-[oklch(0.6_0.13_150)]" /></div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-3">
          {[["P", tgt.protein], ["C", tgt.carbs], ["F", tgt.fat]].map(([l, v]) => (
            <div key={l} className="flex items-baseline gap-1">
              <span className="text-[13px] font-semibold tabular-nums text-neutral-900">{v}</span>
              <span className="text-[10px] text-neutral-400">{l}</span>
            </div>
          ))}
        </div>
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-neutral-400">View plan <Icon name="ChevronRight" size={15} /></span>
      </div>
    </button>
  );
}
