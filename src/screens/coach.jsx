/* =========================================================================
   COACH — chat-style logger. Type meals or exercises in plain English and
   the on-device parser adds them to the system (calories, XP, attributes).
   ========================================================================= */
import React, { useState, useRef, useEffect } from "react";
import { APP_DATA as C } from "../data.js";
import { Icon, Eyebrow, Chip } from "../components.jsx";
import { useStore, dateKey } from "../store.jsx";
import { parseMeal, parseExercise } from "../parse.js";
import { fx, floatXp } from "../fx.js";

const MEAL_XP = C.xpValues.meal;
const EX_XP = C.xpValues.exercise;
const money = (n) => "£" + n.toFixed(2);

const SUGGESTIONS = {
  meal: ["2 eggs and porridge with a banana", "chicken breast, brown rice and beans", "whey protein shake and mixed nuts"],
  exercise: ["bench press 3x8 60kg", "back squats 4x6 100kg and rdls 3x8", "football 60 min"],
};

export function CoachScreen() {
  const store = useStore();
  const [mode, setMode] = useState("meal");
  const [text, setText] = useState("");
  const scroller = useRef(null);
  const log = store.state.chatLog;

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [log.length]);

  // greet once
  useEffect(() => {
    if (!log.length) {
      store.pushChat({ role: "coach", text: "Hey! Tell me what you ate or which exercises you smashed and I'll log it. Try the chips below 👇" });
    }
  }, []);

  const send = (raw) => {
    const input = (raw != null ? raw : text).trim();
    if (!input) return;
    const dk = dateKey();
    store.pushChat({ role: "user", text: input });
    setText("");

    if (mode === "meal") {
      const parsed = parseMeal(input);
      if (!parsed.items.length) {
        store.pushChat({ role: "coach", text: "Hmm, I couldn't spot a food I know there. Try naming items like “chicken breast, rice, banana”." });
        fx.uncheck();
        return;
      }
      store.logMeal(dk, { slot: parsed.slot, items: parsed.items, totals: parsed.totals });
      const t = parsed.totals;
      const itemList = parsed.items.map((i) => `${i.name} ×${i.qty % 1 ? i.qty : i.qty}`).join(", ");
      store.pushChat({
        role: "coach",
        text: `Logged ${parsed.slot}: ${itemList}. That's ${Math.round(t.kcal)} kcal · ${Math.round(t.protein)}g protein · ${money(t.cost)}. +${MEAL_XP} XP 🍽️`,
      });
      fx.success(); floatXp(`+${MEAL_XP} XP`);
    } else {
      const parsed = parseExercise(input);
      if (!parsed.length) {
        store.pushChat({ role: "coach", text: "I didn't catch an exercise there. Try “bench press 3x8 60kg” or “squats and deadlifts”." });
        fx.uncheck();
        return;
      }
      parsed.forEach((ex) => store.logExercise(dk, ex));
      const names = parsed.map((e) => e.name + (e.detail ? ` (${e.detail})` : "")).join(", ");
      const gained = parsed.length * EX_XP;
      store.pushChat({ role: "coach", text: `Logged ${parsed.length === 1 ? "" : parsed.length + " lifts: "}${names}. +${gained} XP 💪` });
      fx.success(); floatXp(`+${gained} XP`);
    }
  };

  const dk = dateKey();
  const meals = store.loggedMealsFor(dk);
  const exs = store.loggedExercisesFor(dk);

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-1">
        <Eyebrow>AI Coach · on-device</Eyebrow>
        <h1 className="mt-0.5 text-[26px] font-semibold leading-none tracking-tight text-neutral-900">Log by Chat</h1>
      </div>

      {/* mode switch */}
      <div className="mt-3 px-4">
        <div className="flex gap-1 rounded-2xl border border-neutral-200 bg-white p-1">
          {[["meal", "Meal", "UtensilsCrossed"], ["exercise", "Exercise", "Dumbbell"]].map(([k, label, icon]) => (
            <button key={k} onClick={() => { setMode(k); fx.tap(); }}
              className={"flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold transition active:scale-95 " +
                (mode === k ? "bg-neutral-900 text-white" : "text-neutral-500")}>
              <Icon name={icon} size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* today's tally */}
      {(meals.length > 0 || exs.length > 0) && (
        <div className="mt-3 px-4">
          <div className="flex flex-wrap gap-1.5">
            {meals.length > 0 && <Chip tone="green"><Icon name="Flame" size={10} /> {store.caloriesToday().toLocaleString()} kcal today</Chip>}
            {meals.length > 0 && <Chip tone="neutral">{meals.length} meal{meals.length > 1 ? "s" : ""}</Chip>}
            {exs.length > 0 && <Chip tone="neutral"><Icon name="Dumbbell" size={10} /> {exs.length} exercise{exs.length > 1 ? "s" : ""}</Chip>}
          </div>
        </div>
      )}

      {/* chat log */}
      <div ref={scroller} className="mt-3 flex-1 space-y-2.5 overflow-y-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {log.map((m, i) => (
          <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={"max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug " +
              (m.role === "user"
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-700 ring-1 ring-inset ring-neutral-200")}>
              {m.role === "coach" && (
                <div className="mb-1 flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[oklch(0.55_0.12_150)]">
                  <Icon name="Sparkles" size={9} /> Coach
                </div>
              )}
              {m.text}
            </div>
          </div>
        ))}
        {/* undo-able logged items for today */}
        {(meals.length > 0 || exs.length > 0) && (
          <div className="!mt-4 rounded-2xl border border-neutral-200 bg-white p-3">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-400">Logged today · tap ✕ to remove</div>
            <div className="space-y-1.5">
              {meals.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-[12px]">
                  <Icon name="UtensilsCrossed" size={12} className="shrink-0 text-neutral-400" />
                  <span className="min-w-0 flex-1 truncate text-neutral-700">{m.slot}: {m.items.map((it) => it.name).join(", ")}</span>
                  <span className="shrink-0 tabular-nums text-neutral-400">{Math.round(m.totals.kcal)} kcal</span>
                  <button onClick={() => { store.removeLoggedMeal(dk, m.id); fx.uncheck(); }} className="shrink-0 text-neutral-300 transition active:scale-90"><Icon name="X" size={14} /></button>
                </div>
              ))}
              {exs.map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-[12px]">
                  <Icon name="Dumbbell" size={12} className="shrink-0 text-neutral-400" />
                  <span className="min-w-0 flex-1 truncate text-neutral-700">{e.name}{e.detail ? ` · ${e.detail}` : ""}</span>
                  <button onClick={() => { store.removeLoggedExercise(dk, e.id); fx.uncheck(); }} className="shrink-0 text-neutral-300 transition active:scale-90"><Icon name="X" size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* suggestion chips */}
      <div className="px-4 pt-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SUGGESTIONS[mode].map((s) => (
            <button key={s} onClick={() => send(s)}
              className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] text-neutral-500 transition active:scale-95">
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* composer */}
      <div className="border-t border-neutral-200 bg-neutral-50/90 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-end gap-2">
          <div className="flex flex-1 items-center rounded-2xl border border-neutral-200 bg-white px-3.5 py-2.5 focus-within:border-neutral-400">
            <input value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder={mode === "meal" ? "e.g. 2 eggs and porridge" : "e.g. bench press 3x8 60kg"}
              className="w-full bg-transparent text-[14px] text-neutral-900 outline-none placeholder:text-neutral-300" />
          </div>
          <button onClick={() => send()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-neutral-900 text-white transition active:scale-90">
            <Icon name="Plus" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
