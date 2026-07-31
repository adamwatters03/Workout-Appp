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

// local calendar date → "YYYY-MM-DD"
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ISO-8601 week key "YYYY-Www" — used to gate the weekly weigh-in prompt
export function isoWeekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;      // Mon=0 … Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(
    ((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
  );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const DEFAULT_STATE = {
  selectedDay: todayKey(),
  mesoWeek: 1,
  exercisesDone: {},  // { dayKey: { exIdx: true } }
  cardioDone: {},     // { dayKey: true }
  mealsEaten: {},     // { dayKey: { mealId: true } }
  weighIns: {},       // { "YYYY-MM-DD": { am: number, pm: number } }
  weighPromptWeek: null, // ISO week already prompted/handled — suppresses re-nag
  calorieLog: {},     // { "YYYY-MM-DD": totalKcal }  (quick manual calorie counter)
  loggedMeals: {},    // { "YYYY-MM-DD": [ { id, slot, items, totals, ts } ] }  (coach)
  loggedExercises: {},// { "YYYY-MM-DD": [ { id, name, detail, known, ts } ] }  (coach)
  chatLog: [],        // [ { role: "user"|"coach", text, ts } ]  capped
  calendar: { connected: false, weekKey: null, lastSyncTs: null, overrides: {}, summary: [] },
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
    // body data (weight history, calorie log) is kept — it isn't "progress"
    weighIns: s.weighIns, weighPromptWeek: s.weighPromptWeek, calorieLog: s.calorieLog,
  })), []);

  // ---- body: weight tracking + calorie counter ----
  const setWeighIn = useCallback((dk, slot, value) => setState((s) => {
    const day = { ...(s.weighIns[dk] || {}) };
    const num = Number(value);
    if (value === "" || value == null || Number.isNaN(num)) delete day[slot];
    else day[slot] = num;
    const weighIns = { ...s.weighIns, [dk]: day };
    if (!Object.keys(day).length) delete weighIns[dk];
    return { ...s, weighIns };
  }), []);

  const markWeighPrompt = useCallback((weekKey) => setState((s) => ({ ...s, weighPromptWeek: weekKey })), []);

  const addCalories = useCallback((dk, delta) => setState((s) => {
    const next = Math.max(0, (s.calorieLog[dk] || 0) + delta);
    return { ...s, calorieLog: { ...s.calorieLog, [dk]: next } };
  }), []);

  const resetCalories = useCallback((dk) => setState((s) => {
    const calorieLog = { ...s.calorieLog }; delete calorieLog[dk];
    return { ...s, calorieLog };
  }), []);

  // ---- coach: natural-language meal & exercise logging ----
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const logMeal = useCallback((dk, meal) => setState((s) => {
    const list = [...(s.loggedMeals[dk] || []), { id: uid(), ts: Date.now(), ...meal }];
    return { ...s, loggedMeals: { ...s.loggedMeals, [dk]: list } };
  }), []);

  const logExercise = useCallback((dk, ex) => setState((s) => {
    const list = [...(s.loggedExercises[dk] || []), { id: uid(), ts: Date.now(), ...ex }];
    return { ...s, loggedExercises: { ...s.loggedExercises, [dk]: list } };
  }), []);

  const removeLoggedMeal = useCallback((dk, id) => setState((s) => ({
    ...s, loggedMeals: { ...s.loggedMeals, [dk]: (s.loggedMeals[dk] || []).filter((m) => m.id !== id) },
  })), []);

  const removeLoggedExercise = useCallback((dk, id) => setState((s) => ({
    ...s, loggedExercises: { ...s.loggedExercises, [dk]: (s.loggedExercises[dk] || []).filter((e) => e.id !== id) },
  })), []);

  const pushChat = useCallback((msg) => setState((s) => ({
    ...s, chatLog: [...s.chatLog, { ts: Date.now(), ...msg }].slice(-60),
  })), []);

  // ---- google calendar ----
  const setCalendarPlan = useCallback((overrides, summary) => setState((s) => ({
    ...s, calendar: { connected: true, weekKey: isoWeekKey(), lastSyncTs: Date.now(), overrides: overrides || {}, summary: summary || [] },
  })), []);

  const clearCalendar = useCallback(() => setState((s) => ({
    ...s, calendar: { connected: false, weekKey: null, lastSyncTs: null, overrides: {}, summary: [] },
  })), []);

  // averages the readings on a single weigh-in day (am/pm → current weight)
  function dayAverage(w) {
    const vals = [w && w.am, w && w.pm].filter((v) => typeof v === "number" && !Number.isNaN(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }

  // ---- derivations ----
  const api = {
    state, setSelectedDay, setMesoWeek, toggleExercise, toggleCardio, toggleMeal, resetProgress,
    setWeighIn, markWeighPrompt, addCalories, resetCalories,
    logMeal, logExercise, removeLoggedMeal, removeLoggedExercise, pushChat,
    setCalendarPlan, clearCalendar,

    // calendar overrides only apply to the week they were synced for
    calendarActive: () => state.calendar.connected && state.calendar.weekKey === isoWeekKey(),
    calendarStale: () => state.calendar.connected && state.calendar.weekKey !== isoWeekKey(),
    _overrides() { return this.calendarActive() ? state.calendar.overrides : {}; },

    // effective weekday = base template + any live calendar override
    weekDays() {
      const ov = this._overrides();
      return D.week.map((d) => (ov[d.key] ? { ...d, ...ov[d.key] } : d));
    },
    dayByKey(k) {
      const base = D.week.find((d) => d.key === k);
      const ov = this._overrides()[k];
      return ov ? { ...base, ...ov } : base;
    },
    loggedMealsFor: (dk) => state.loggedMeals[dk] || [],
    loggedExercisesFor: (dk) => state.loggedExercises[dk] || [],
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
      const day = this.dayByKey(dayKey);
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
      this.weekDays().forEach((day) => {
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
      // coach-logged extras (any date) earn the same per-item XP
      Object.values(state.loggedMeals).forEach((list) => { xp += list.length * v.meal; });
      Object.values(state.loggedExercises).forEach((list) => { xp += list.length * v.exercise; });
      return xp;
    },

    level() { return levelFromXP(this.xp()); },

    stats() {
      let exercises = 0, sessions = 0, cardio = 0, meals = 0, daysComplete = 0, spend = 0;
      this.weekDays().forEach((day) => {
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

    // ---- body: weight ----
    weighInFor: (dk) => state.weighIns[dk] || {},

    // most recent day with any reading → its am/pm average = "current weight"
    currentWeight() {
      const dks = Object.keys(state.weighIns).sort();
      for (let i = dks.length - 1; i >= 0; i--) {
        const avg = dayAverage(state.weighIns[dks[i]]);
        if (avg != null) return { weight: avg, date: dks[i], entry: state.weighIns[dks[i]] };
      }
      return null;
    },

    // change between the two most recent day-averages (kg)
    weightTrend() {
      const avgs = Object.keys(state.weighIns).sort()
        .map((dk) => dayAverage(state.weighIns[dk]))
        .filter((v) => v != null);
      return avgs.length >= 2 ? avgs[avgs.length - 1] - avgs[avgs.length - 2] : null;
    },

    // last N day-averages, oldest→newest, for a mini history
    weightHistory(n = 6) {
      return Object.keys(state.weighIns).sort()
        .map((dk) => ({ date: dk, avg: dayAverage(state.weighIns[dk]) }))
        .filter((r) => r.avg != null)
        .slice(-n);
    },

    // ---- body: calories ----
    maintenanceKcal() {
      const cw = this.currentWeight();
      return D.maintenanceKcal(cw ? cw.weight : D.profile.weight);
    },
    // manual quick-add + calories from coach-logged meals for the day
    caloriesToday() {
      const dk = dateKey();
      const coach = (state.loggedMeals[dk] || []).reduce((a, m) => a + (m.totals ? m.totals.kcal : 0), 0);
      return Math.round((state.calorieLog[dk] || 0) + coach);
    },

    // weekly weigh-in nudge: due once per ISO week until logged or dismissed
    weighPromptDue: () => state.weighPromptWeek !== isoWeekKey(),

    // ---- RPG attributes (0–100), derived from cumulative activity ----
    attributes() {
      const st = this.stats();
      const coachEx = Object.values(state.loggedExercises).reduce((a, l) => a + l.length, 0);
      const coachMeals = Object.values(state.loggedMeals).reduce((a, l) => a + l.length, 0);
      const weighDays = Object.keys(state.weighIns).length;
      const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
      const list = [
        { key: "strength",    label: "Strength",    icon: "Dumbbell", value: clamp((st.exercises + coachEx) * 5) },
        { key: "endurance",   label: "Endurance",   icon: "Flame",    value: clamp(st.cardio * 30 + coachEx * 3) },
        { key: "nutrition",   label: "Nutrition",   icon: "Apple",    value: clamp((st.meals + coachMeals) * 4) },
        { key: "consistency", label: "Consistency", icon: "Zap",      value: clamp(st.daysComplete * 14 + st.sessions * 4) },
        { key: "recovery",    label: "Recovery",    icon: "Moon",     value: clamp(weighDays * 22 + st.daysComplete * 4) },
      ];
      const power = Math.round(list.reduce((a, x) => a + x.value, 0) / list.length);
      return { list, power };
    },
  };

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}
