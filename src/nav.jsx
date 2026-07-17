/* =========================================================================
   NAV — bottom-tab + push/pop screen stack with slide transitions
   ========================================================================= */
import React from "react";
import { Icon } from "./components.jsx";

const NavCtx = React.createContext(null);
export const useNav = () => React.useContext(NavCtx);

export function NavProvider({ children }) {
  const [tab, setTab] = React.useState("today");
  const [stack, setStack] = React.useState([]);
  const idRef = React.useRef(0);

  const push = React.useCallback((screen) => {
    idRef.current += 1;
    const key = Date.now() + "-" + idRef.current;
    setStack((s) => [...s, { ...screen, key, closing: false }]);
  }, []);

  const pop = React.useCallback(() => {
    setStack((s) => {
      if (!s.length) return s;
      const next = s.slice();
      next[next.length - 1] = { ...next[next.length - 1], closing: true };
      return next;
    });
    setTimeout(() => setStack((s) => s.slice(0, -1)), 300);
  }, []);

  const popAll = React.useCallback(() => setStack([]), []);

  const changeTab = React.useCallback((t) => { setStack([]); setTab(t); }, []);

  const api = { tab, setTab: changeTab, push, pop, popAll, stack };
  return <NavCtx.Provider value={api}>{children}</NavCtx.Provider>;
}

/* renders a single pushed screen with slide-in / slide-out */
export function SlideScreen({ closing, children }) {
  const [entered, setEntered] = React.useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setEntered(true), 16);
    return () => clearTimeout(id);
  }, []);
  const x = closing ? "100%" : entered ? "0%" : "100%";
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-neutral-50"
      style={{ transform: `translateX(${x})`, transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)", boxShadow: "-20px 0 40px rgba(0,0,0,0.06)" }}>
      {children}
    </div>
  );
}

/* reusable detail-screen header with back button */
export function DetailHeader({ title, eyebrow, right, onBack }) {
  const nav = useNav();
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-neutral-200 bg-neutral-50/85 px-4 py-3 backdrop-blur-md"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
      <button onClick={onBack || nav.pop}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-neutral-900 ring-1 ring-neutral-200 transition active:scale-90">
        <Icon name="ChevronLeft" size={20} />
      </button>
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-400">{eyebrow}</div>}
        <h1 className="truncate text-[17px] font-semibold tracking-tight text-neutral-900">{title}</h1>
      </div>
      {right}
    </header>
  );
}
