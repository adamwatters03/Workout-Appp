/* =========================================================================
   TRAIN — session list (tab) · session detail · exercise detail
   ========================================================================= */
import React from "react";
import { APP_DATA as TR } from "../data.js";
import { Icon, Eyebrow, Bar, Chip, Photo, CheckToggle, slug } from "../components.jsx";
import { useStore, todayKey } from "../store.jsx";
import { useNav, DetailHeader } from "../nav.jsx";
import { fx, floatXp } from "../fx.js";

export function WeekSelector({ value, onChange, dark }) {
  return (
    <div className={"flex gap-1 rounded-2xl p-1 " + (dark ? "bg-white/10" : "border border-neutral-200 bg-white")}>
      {Array.from({ length: TR.mesocycleWeeks }).map((_, i) => {
        const w = i + 1, on = w === value;
        return (
          <button key={w} onClick={() => onChange(w)}
            className={"flex-1 rounded-xl py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition active:scale-95 " +
              (on ? "bg-neutral-900 text-white" : (dark ? "text-white/60" : "text-neutral-400"))}>
            W{w}
          </button>
        );
      })}
    </div>
  );
}

/* ---- Train tab ---- */
export function TrainScreen() {
  const store = useStore();
  const nav = useNav();
  const gymDays = TR.week.filter((d) => d.type === "gym");
  const _todayKey = todayKey();

  return (
    <div className="px-4 pb-4">
      <div className="pt-1">
        <Eyebrow>Workout Hub</Eyebrow>
        <h1 className="mt-0.5 text-[26px] font-semibold leading-none tracking-tight text-neutral-900">3-Day Split</h1>
        <p className="mt-1.5 text-[12px] leading-snug text-neutral-400">Sequenced around football &amp; boxing to keep your legs fresh.</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Icon name="TrendingUp" size={16} className="text-[oklch(0.6_0.13_150)]" />
          <span className="text-[12px] font-medium text-neutral-600">Progressive overload</span>
        </div>
        <div className="w-40"><WeekSelector value={store.state.mesoWeek} onChange={store.setMesoWeek} /></div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {gymDays.map((day) => {
          const s = TR.sessions[day.session];
          const t = store.dayTasks(day.key);
          return (
            <button key={day.key} onClick={() => nav.push({ type: "session", dayKey: day.key })}
              className="block w-full overflow-hidden rounded-3xl border border-neutral-200 bg-white text-left transition active:scale-[0.99]">
              <Photo id={"sess-" + s.key} ratio="16 / 8" radius={0} placeholder={"Add " + s.title + " photo"}
                overlay={
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-black/20 p-4">
                    <div className="flex justify-between">
                      <span className="rounded-full bg-white/90 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-900">{day.short}</span>
                      {day.key === _todayKey && <span className="rounded-full bg-[oklch(0.6_0.13_150)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white">Today</span>}
                    </div>
                    <div className="text-white">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/70">{s.focus}</div>
                      <div className="text-[20px] font-semibold leading-tight">{s.title}</div>
                    </div>
                  </div>
                } />
              <div className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-neutral-700">{s.exercises.length} exercises</span>
                    <span className="text-neutral-400">{t.trainDone}/{t.trainTotal} done</span>
                  </div>
                  <Bar pct={t.trainTotal ? t.trainDone / t.trainTotal : 0} color="bg-[oklch(0.6_0.13_150)]" />
                </div>
                <Icon name="ChevronRight" size={20} className="shrink-0 text-neutral-300" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Session detail ---- */
export function SessionDetail({ dayKey }) {
  const store = useStore();
  const nav = useNav();
  const day = store.dayByKey(dayKey);
  const s = TR.sessions[day.session];
  const week = store.state.mesoWeek;
  const t = store.dayTasks(dayKey);

  return (
    <React.Fragment>
      <DetailHeader eyebrow={s.day + " · Week " + week} title={s.title}
        right={t.trainComplete ? <Chip tone="green"><Icon name="Check" size={10} /> Done</Chip> : null} />
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="px-4 pt-3">
          <Photo id={"sess-" + s.key} ratio="16 / 8" placeholder={"Add " + s.title + " photo"} />
          <p className="mt-3 text-[13px] leading-relaxed text-neutral-500">{s.note}</p>
          <div className="mt-3"><WeekSelector value={week} onChange={store.setMesoWeek} /></div>

          <div className="mt-2 flex items-center justify-between py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">{s.focus}</span>
            <span className="text-[12px] font-medium text-neutral-500">{t.trainDone}/{t.trainTotal}</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {s.exercises.map((ex, idx) => {
              const done = store.isExerciseDone(dayKey, idx);
              return (
                <div key={ex.name} className={"flex items-center gap-3 rounded-2xl border bg-white p-2.5 transition " + (done ? "border-[oklch(0.85_0.06_150)]" : "border-neutral-200")}>
                  <CheckToggle checked={done} onClick={() => { store.toggleExercise(dayKey, idx); if (!done) { fx.pop(); floatXp(`+${TR.xpValues.exercise} XP`); } else fx.uncheck(); }} />
                  <button onClick={() => nav.push({ type: "exercise", dayKey, idx })} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Photo id={"ex-" + slug(ex.name)} ratio="1 / 1" radius={12} placeholder="Photo"
                      className="w-14 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className={"truncate text-[14px] font-medium leading-tight " + (done ? "text-neutral-400 line-through" : "text-neutral-900")}>{ex.name}</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-[10px] text-neutral-400">{ex.scheme}</span>
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-neutral-600">{ex.prog[week - 1]}</span>
                      </div>
                    </div>
                    <Icon name="ChevronRight" size={18} className="shrink-0 text-neutral-300" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

/* ---- Exercise detail ---- */
export function ExerciseDetail({ dayKey, idx }) {
  const store = useStore();
  const day = store.dayByKey(dayKey);
  const s = TR.sessions[day.session];
  const ex = s.exercises[idx];
  const week = store.state.mesoWeek;
  const done = store.isExerciseDone(dayKey, idx);

  return (
    <React.Fragment>
      <DetailHeader eyebrow={ex.muscle} title={ex.name} />
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="px-4 pt-3">
          <Photo id={"ex-" + slug(ex.name)} ratio="16 / 10" placeholder={"Add " + ex.name + " photo"} />

          {/* video guide */}
          <div className="relative mt-3 grid aspect-video place-items-center overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-inset ring-neutral-200">
            <svg className="absolute inset-0 h-full w-full text-neutral-200">
              <defs><pattern id={"vg" + idx} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1" /></pattern></defs>
              <rect width="100%" height="100%" fill={"url(#vg" + idx + ")"} />
            </svg>
            <div className="relative flex flex-col items-center gap-2">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-neutral-900 ring-1 ring-neutral-200"><Icon name="Play" size={20} /></span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-400">Video Guide</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Chip tone="outline"><Icon name="Target" size={11} /> {ex.scheme}</Chip>
            <Chip tone="outline">{ex.muscle}</Chip>
          </div>

          {/* progression tracker */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2"><Icon name="TrendingUp" size={15} className="text-[oklch(0.6_0.13_150)]" /><h3 className="text-[13px] font-semibold text-neutral-700">{ex.superset ? "4-Week Build" : "Progressive Overload"}</h3></div>
            <div className="grid grid-cols-4 gap-2">
              {ex.prog.map((p, i) => {
                const w = i + 1, on = w === week, past = w < week;
                return (
                  <div key={w} className={"rounded-2xl px-1.5 py-3 text-center transition " +
                    (on ? "bg-neutral-900 text-white" : past ? "bg-[oklch(0.97_0.02_150)] text-[oklch(0.5_0.1_150)] ring-1 ring-inset ring-[oklch(0.9_0.05_150)]" : "bg-white text-neutral-500 ring-1 ring-inset ring-neutral-200")}>
                    <div className={"font-mono text-[9px] uppercase tracking-[0.1em] " + (on ? "text-white/50" : "text-neutral-300")}>Week {w}</div>
                    <div className="mt-1 text-[12px] font-semibold leading-tight tabular-nums">{p}</div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2.5 text-[12px] leading-snug text-neutral-400">Each week edges load or reps up — the engine of recomposition. You're on <span className="font-medium text-neutral-600">Week {week}</span>.</p>
          </div>
        </div>
      </div>

      {/* sticky complete */}
      <div className="absolute inset-x-0 bottom-0 border-t border-neutral-200 bg-neutral-50/90 p-4 backdrop-blur" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <button onClick={() => { store.toggleExercise(dayKey, idx); if (!done) { fx.pop(); floatXp(`+${TR.xpValues.exercise} XP`); } else fx.uncheck(); }}
          className={"flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-semibold transition active:scale-[0.98] " +
            (done ? "bg-[oklch(0.96_0.03_150)] text-[oklch(0.42_0.12_150)] ring-1 ring-inset ring-[oklch(0.88_0.06_150)]" : "bg-neutral-900 text-white")}>
          <Icon name={done ? "CircleCheck" : "Circle"} size={18} />
          {done ? "Completed — +15 XP earned" : "Mark exercise complete"}
        </button>
      </div>
    </React.Fragment>
  );
}
