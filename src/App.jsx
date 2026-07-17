/* =========================================================================
   APP SHELL — phone column, bottom tabs, pushed screens, celebration
   ========================================================================= */
import React, { useState, useEffect, useRef } from "react";
import { APP_DATA } from "./data.js";
import { Icon, fireConfetti } from "./components.jsx";
import { StoreProvider, useStore } from "./store.jsx";
import { NavProvider, useNav, SlideScreen } from "./nav.jsx";
import { TodayScreen } from "./screens/today.jsx";
import { TrainScreen, SessionDetail, ExerciseDetail } from "./screens/train.jsx";
import { FuelScreen, MealDetail, FoodDatabase, FoodDetail } from "./screens/fuel.jsx";
import { ProgressScreen } from "./screens/progress.jsx";
import { WeighInModal } from "./screens/body.jsx";
import { CoachScreen } from "./screens/coach.jsx";
import { fx } from "./fx.js";

const TABS = [
  { key: "today", label: "Today", icon: "House" },
  { key: "train", label: "Train", icon: "Dumbbell" },
  { key: "fuel", label: "Fuel", icon: "Apple" },
  { key: "coach", label: "Coach", icon: "Sparkles" },
  { key: "progress", label: "Progress", icon: "Trophy" },
];

function TabBar() {
  const nav = useNav();
  return (
    <nav className="absolute inset-x-0 bottom-0 z-40 flex border-t border-neutral-200 bg-white/92 backdrop-blur-md"
      style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}>
      {TABS.map((t) => {
        const on = nav.tab === t.key;
        return (
          <button key={t.key} onClick={() => { nav.setTab(t.key); fx.tap(); }}
            className="flex flex-1 flex-col items-center gap-1 pt-2.5 transition active:scale-90">
            <Icon name={t.icon} size={21} className={on ? "text-neutral-900" : "text-neutral-300"} strokeWidth={on ? 2.2 : 1.8} />
            <span className={"text-[10px] font-medium tracking-tight " + (on ? "text-neutral-900" : "text-neutral-400")}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function TabContent() {
  const nav = useNav();
  const map = { today: TodayScreen, train: TrainScreen, fuel: FuelScreen, progress: ProgressScreen };
  const C = map[nav.tab];
  return (
    <div key={nav.tab} className="tab-in min-h-full" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
      <C />
    </div>
  );
}

/* maps a pushed-screen descriptor → component */
function renderScreen(item) {
  const map = {
    session: SessionDetail,
    exercise: ExerciseDetail,
    meal: MealDetail,
    food: FoodDetail,
    foodDb: FoodDatabase,
  };
  const C = map[item.type];
  return C ? <C {...item} /> : null;
}

function ScreenHost() {
  const { stack } = useNav();
  return (
    <React.Fragment>
      {stack.map((item) => (
        <SlideScreen key={item.key} closing={item.closing}>{renderScreen(item)}</SlideScreen>
      ))}
    </React.Fragment>
  );
}

function Shell() {
  const store = useStore();
  const nav = useNav();
  const prev = useRef(null);
  const prevLevel = useRef(null);
  const [toast, setToast] = useState(null);
  // weekly weigh-in nudge — shown once per ISO week until logged or dismissed
  const [showWeighIn, setShowWeighIn] = useState(() => store.weighPromptDue());

  useEffect(() => {
    // celebrate newly-completed perfect days
    const cur = new Set(APP_DATA.week.filter((d) => store.dayTasks(d.key).complete).map((d) => d.key));
    if (prev.current) {
      for (const k of cur) {
        if (!prev.current.has(k)) {
          fireConfetti();
          fx.success();
          setToast("Perfect day complete · +75 XP");
          setTimeout(() => setToast(null), 2400);
          break;
        }
      }
    }
    prev.current = cur;

    // celebrate level-ups
    const lvl = store.level().level;
    if (prevLevel.current != null && lvl > prevLevel.current) {
      fireConfetti();
      fx.levelUp();
      setToast(`Level ${lvl} reached — you levelled up!`);
      setTimeout(() => setToast(null), 2600);
    }
    prevLevel.current = lvl;
  }, [store.state]);

  return (
    <div className="relative flex h-[100dvh] w-[440px] max-w-[100vw] flex-col overflow-hidden bg-neutral-50 md:h-[896px] md:max-h-[94vh] md:rounded-[44px] md:shadow-2xl md:ring-1 md:ring-black/5">
      {nav.tab === "coach" ? (
        // Coach owns its full-height layout (scrolling chat + pinned composer)
        <div key="coach" className="tab-in absolute inset-0" style={{ paddingBottom: "calc(62px + env(safe-area-inset-bottom))", paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
          <CoachScreen />
        </div>
      ) : (
        <div className="absolute inset-0 overflow-y-auto pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabContent />
        </div>
      )}
      <ScreenHost />
      <TabBar />

      {showWeighIn && <WeighInModal onClose={() => setShowWeighIn(false)} />}

      {/* celebration toast */}
      {toast && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex justify-center px-4"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
          <div className="toast-in flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-white shadow-lg">
            <Icon name="Sparkles" size={15} className="text-[oklch(0.78_0.14_150)]" />
            <span className="text-[13px] font-semibold">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <NavProvider>
        <Shell />
      </NavProvider>
    </StoreProvider>
  );
}
