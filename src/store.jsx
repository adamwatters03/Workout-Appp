/* =========================================================================
   STORE — persisted progress + derived gamification (XP, level, streak)
   Everything visible is DERIVED from a small base state, so toggling
   actions on/off can never drift the score.
   ========================================================================= */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { APP_DATA as D } from "./data.js";

const STORE_KEY = "recomp-mobile-v1";

export function todayKey() {
  const map = { 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat", 0: "sun" };
  return map[new Date().getDay()] || "tue";
}

const DEFAULT_STATE = {
  selectedDay: todayKey(),
  mesoWeek: 1,
  exercisesDone: {},  // { dayKey: { exIdx: true } }
  cardioDone: {},     // { dayKey: true }
  mealsEaten: {},     // { dayKey: { mealId: true } }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) {}
  return { ...DEFAULT_STATE };
}

export function levelFromXP(xp) {
  let level = 1, span = 200, into = xp;
  while (into >= span) { into -= span; level++; span = Math.round(span * 1.18); }
  return { level, into, span, pct: span ? into / span : 0, total: xp };
}

const StoreCtx = createContext(null);
export const useStore = () => useContext(StoreCtx);

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }, [state]);

  // ---- actions ----
  const setSelectedDay = useCallback((k) => setState((s) => ({ ...s, selectedDay: k })), []);
  const setMesoWeek = useCallback((w) => setState((s) => ({ ...s, mesoWeek: w })), []);

  const toggleExercise = useCallback((dayKey, idx) => setState((s) => {
    const day = { ...(s.exercisesDone[dayKey] || {}) };
    if (day[idx]) delete day[idx]; else day[idx] = true;
    return { ...s, exercisesDone: { ...s.exercisesDone, [dayKey]: day } };
  }), []);

  const toggleCardio = useCallback((dayKey) => setState((s) => ({
    ...s, cardioDone: { ...s.cardioDone, [dayKey]: !s.cardioDone[dayKey] },
  })), []);

  const toggleMeal = useCallback((dayKey, mealId) => setState((s) => {
    const day = { ...(s.mealsEaten[dayKey] || {}) };
    if (day[mealId]) delete day[mealId]; else day[mealId] = true;
    return { ...s, mealsEaten: { ...s.mealsEaten, [dayKey]: day } };
  }), []);

  const resetProgress = useCallback(() => setState((s) => ({
    ...DEFAULT_STATE, selectedDay: s.selectedDay, mesoWeek: s.mesoWeek,
  })), []);

  // ---- derivations ----
  const api = {
    state, setSelectedDay, setMesoWeek, toggleExercise, toggleCardio, toggleMeal, resetProgress,

    dayByKey: (k) => D.week.find((d) => d.key === k),
    sessionFor: (day) => (day && day.type === "gym" ? D.sessions[day.session] : null),
    planFor: (day) => {
      if (!day) return [];
      const key = D.planKeyFor(day, !!state.cardioDone[day.key]);
      return D.mealPlans[key];
    },
    isExerciseDone: (dayKey, idx) => !!(state.exercisesDone[dayKey] || {})[idx],
    isCardioDone: (dayKey) => !!state.cardioDone[dayKey],
    isMealEaten: (dayKey, mealId) => !!(state.mealsEaten[dayKey] || {})[mealId],

    dayTasks(dayKey) {
      const day = D.week.find((d) => d.key === dayKey);
      let trainTotal = 0, trainDone = 0;
      if (day.type === "gym") {
        const s = D.sessions[day.session];
        trainTotal = s.exercises.length;
        trainDone = Object.keys(state.exercisesDone[dayKey] || {}).length;
      } else if (day.type === "cardio") {
        trainTotal = 1; trainDone = state.cardioDone[dayKey] ? 1 : 0;
      }
      const plan = this.planFor(day);
      const fuelTotal = plan.length;
      const fuelDone = Object.keys(state.mealsEaten[dayKey] || {})
        .filter((id) => plan.some((m) => m.id === id)).length;
      const total = trainTotal + fuelTotal;
      const done = Math.min(trainDone, trainTotal) + Math.min(fuelDone, fuelTotal);
      return {
        trainTotal, trainDone: Math.min(trainDone, trainTotal),
        fuelTotal, fuelDone, total, done,
        pct: total ? done / total : 0,
        trainComplete: trainTotal > 0 && trainDone >= trainTotal,
        fuelComplete: fuelTotal > 0 && fuelDone >= fuelTotal,
        complete: total > 0 && done >= total,
      };
    },

    xp() {
      const v = D.xpValues; let xp = 0;
      D.week.forEach((day) => {
        const k = day.key;
        // exercises
        const exDone = Object.keys(state.exercisesDone[k] || {}).length;
        xp += exDone * v.exercise;
        if (day.type === "gym") {
          const s = D.sessions[day.session];
          if (exDone >= s.exercises.length) xp += v.sessionBonus;
        }
        if (day.type === "cardio" && state.cardioDone[k]) xp += v.cardio;
        // meals
        const plan = D.mealPlans[D.planKeyFor(day, !!state.cardioDone[k])];
        const eaten = Object.keys(state.mealsEaten[k] || {}).filter((id) => plan.some((m) => m.id === id)).length;
        xp += eaten * v.meal;
        if (eaten >= plan.length) xp += v.fuelBonus;
        // full day
        const t = this.dayTasks(k);
        if (t.complete) xp += v.dayComplete;
      });
      return xp;
    },

    level() { return levelFromXP(this.xp()); },

    stats() {
      let exercises = 0, sessions = 0, cardio = 0, meals = 0, daysComplete = 0, spend = 0;
      D.week.forEach((day) => {
        const k = day.key;
        const exDone = Object.keys(state.exercisesDone[k] || {}).length;
        exercises += exDone;
        if (day.type === "gym" && exDone >= D.sessions[day.session].exercises.length) sessions++;
        if (day.type === "cardio" && state.cardioDone[k]) cardio++;
        const plan = D.mealPlans[D.planKeyFor(day, !!state.cardioDone[k])];
        const eatenIds = Object.keys(state.mealsEaten[k] || {}).filter((id) => plan.some((m) => m.id === id));
        meals += eatenIds.length;
        eatenIds.forEach((id) => {
          const m = plan.find((mm) => mm.id === id);
          if (m) spend += D.mealTotals(m).cost;
        });
        if (this.dayTasks(k).complete) daysComplete++;
      });
      return { exercises, sessions, cardio, meals, daysComplete, spend };
    },
  };

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}
