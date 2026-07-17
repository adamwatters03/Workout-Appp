/* =========================================================================
   BODY — weight tracking, calorie counter, supplements & shakes.
   Surfaced on the Progress tab; the weigh-in modal is mounted in the shell.
   ========================================================================= */
import React, { useState } from "react";
import { APP_DATA as B } from "../data.js";
import { Icon, Bar, Ring, Chip } from "../components.jsx";
import { useStore, dateKey, isoWeekKey } from "../store.jsx";
import { defaultPhoto } from "../photos.js";
import { fx, floatXp } from "../fx.js";

const fmtKg = (n) => (Math.round(n * 10) / 10).toFixed(1);
const prettyDate = (dk) => {
  const [y, m, d] = dk.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/* ---- RPG attribute character sheet (radar + bars) ---- */
const ATTR_GREEN = "oklch(0.7 0.15 150)";
export function AttributePanel() {
  const store = useStore();
  const { list, power } = store.attributes();

  // pentagon radar geometry
  const cx = 120, cy = 104, R = 78, N = list.length;
  const pt = (i, r) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
  };
  const ring = (frac) => list.map((_, i) => pt(i, R * frac).join(",")).join(" ");
  const shape = list.map((a, i) => pt(i, R * (a.value / 100)).join(",")).join(" ");

  return (
    <div className="relative overflow-hidden rounded-3xl bg-neutral-900 p-5 text-white">
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[oklch(0.6_0.13_150)] opacity-[0.14] blur-2xl" />
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">Power Level</div>
          <div className="text-[30px] font-semibold leading-none tabular-nums">{power}</div>
        </div>
        <Chip tone="green" className="!bg-white/10 !text-[oklch(0.85_0.12_150)]"><Icon name="TrendingUp" size={11} /> Attributes</Chip>
      </div>

      <div className="mt-1 flex justify-center">
        <svg viewBox="0 0 240 208" className="h-[188px] w-full max-w-[280px]">
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <polygon key={f} points={ring(f)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          ))}
          {list.map((_, i) => {
            const [x, y] = pt(i, R);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />;
          })}
          <polygon points={shape} fill="oklch(0.7 0.15 150 / 0.28)" stroke={ATTR_GREEN} strokeWidth="2"
            style={{ transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)" }} />
          {list.map((a, i) => {
            const [x, y] = pt(i, R * (a.value / 100));
            const [lx, ly] = pt(i, R + 16);
            return (
              <g key={a.key}>
                <circle cx={x} cy={y} r="3" fill={ATTR_GREEN} />
                <text x={lx} y={ly + 3} textAnchor="middle" className="fill-white/45"
                  style={{ font: '600 8px "SF Mono", ui-monospace, monospace', letterSpacing: "0.08em" }}>
                  {a.label.slice(0, 4).toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-1 space-y-2.5">
        {list.map((a) => (
          <div key={a.key} className="flex items-center gap-2.5">
            <Icon name={a.icon} size={14} className="shrink-0 text-white/50" />
            <span className="w-[86px] shrink-0 text-[12px] font-medium text-white/80">{a.label}</span>
            <div className="flex-1"><Bar pct={a.value / 100} color="bg-[oklch(0.7_0.15_150)]" track="bg-white/10" height="h-1.5" /></div>
            <span className="w-7 shrink-0 text-right text-[12px] font-semibold tabular-nums text-white">{a.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- weight tracker ---- */
export function WeightCard() {
  const store = useStore();
  const today = dateKey();
  const todayEntry = store.weighInFor(today);
  const cur = store.currentWeight();
  const trend = store.weightTrend();
  const goal = B.profile.goalWeight;
  const history = store.weightHistory(6);

  const field = (slot, label, icon) => (
    <label className="flex-1">
      <div className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-400">
        <Icon name={icon} size={12} /> {label}
      </div>
      <div className="flex items-center rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 focus-within:border-neutral-400">
        <input type="number" inputMode="decimal" step="0.1" min="0" placeholder="—"
          value={todayEntry[slot] ?? ""}
          onChange={(e) => store.setWeighIn(today, slot, e.target.value)}
          className="w-full bg-transparent text-[17px] font-semibold tabular-nums text-neutral-900 outline-none placeholder:text-neutral-300" />
        <span className="text-[12px] text-neutral-400">kg</span>
      </div>
    </label>
  );

  const delta = cur ? cur.weight - goal : null;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[34px] font-semibold leading-none tabular-nums text-neutral-900">{cur ? fmtKg(cur.weight) : "—"}</span>
            <span className="text-[13px] text-neutral-400">kg</span>
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-400">
            Current weight{cur ? " · " + prettyDate(cur.date) : ""}
          </div>
        </div>
        <div className="text-right">
          {trend != null && (
            <div className={"inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-semibold tabular-nums " +
              (Math.abs(trend) < 0.05 ? "bg-neutral-100 text-neutral-500"
                : trend < 0 ? "bg-[oklch(0.95_0.04_150)] text-[oklch(0.42_0.12_150)]"
                : "bg-[oklch(0.96_0.05_60)] text-[oklch(0.5_0.12_50)]")}>
              <Icon name={Math.abs(trend) < 0.05 ? "Minus" : trend < 0 ? "TrendingDown" : "TrendingUp"} size={13} />
              {trend > 0 ? "+" : ""}{fmtKg(trend)}
            </div>
          )}
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-400">Goal {goal}kg</div>
        </div>
      </div>

      {delta != null && Math.abs(delta) >= 0.05 && (
        <div className="mt-3 rounded-2xl bg-neutral-50 px-3.5 py-2 text-[12px] leading-snug text-neutral-500 ring-1 ring-inset ring-neutral-100">
          {delta > 0 ? `${fmtKg(delta)} kg above` : `${fmtKg(-delta)} kg below`} your {goal} kg maintenance target — {delta > 0 ? "lean back gently while holding protein high." : "nudge calories up to hold size."}
        </div>
      )}

      <div className="mt-4 mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-400">Today's weigh-in</div>
      <div className="flex gap-2.5">
        {field("am", "Morning", "Sun")}
        {field("pm", "Evening", "Moon")}
      </div>

      {history.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-400">Recent</div>
          <div className="flex items-end gap-1.5">
            {(() => {
              const vals = history.map((h) => h.avg);
              const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
              return history.map((h) => (
                <div key={h.date} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-14 w-full items-end">
                    <div className="w-full rounded-md bg-[oklch(0.6_0.13_150)]"
                      style={{ height: (18 + ((h.avg - lo) / span) * 82) + "%" }} title={fmtKg(h.avg) + " kg"} />
                  </div>
                  <span className="text-[9px] tabular-nums text-neutral-400">{fmtKg(h.avg)}</span>
                  <span className="font-mono text-[8px] uppercase text-neutral-300">{prettyDate(h.date).split(" ")[0]}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- calorie counter ---- */
export function CalorieCounter() {
  const store = useStore();
  const today = dateKey();
  const target = store.maintenanceKcal();
  const total = store.caloriesToday();
  const remaining = target - total;
  const [custom, setCustom] = useState("");

  const bump = (n) => { store.addCalories(today, n); fx.add(); };
  const addCustom = () => {
    const n = parseInt(custom, 10);
    if (!Number.isNaN(n) && n !== 0) { store.addCalories(today, n); fx.pop(); }
    setCustom("");
  };

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center gap-5">
        <Ring pct={target ? Math.min(1, total / target) : 0} size={104} stroke={10} color="oklch(0.6 0.13 150)" track="#f2f2f2">
          <span className="text-[24px] font-semibold leading-none tabular-nums text-neutral-900">{total.toLocaleString()}</span>
          <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-neutral-400">/ {target.toLocaleString()}</span>
        </Ring>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-400">
            {remaining >= 0 ? "Remaining" : "Over by"}
          </div>
          <div className={"text-[26px] font-semibold leading-none tabular-nums " + (remaining >= 0 ? "text-neutral-900" : "text-[oklch(0.55_0.15_30)]")}>
            {Math.abs(remaining).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] leading-snug text-neutral-400">
            Maintenance for {store.currentWeight() ? fmtKg(store.currentWeight().weight) : B.profile.weight} kg — hold weight, build muscle.
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[100, 250, 500].map((v) => (
          <button key={v} onClick={() => bump(v)}
            className="flex items-center justify-center gap-0.5 rounded-2xl bg-neutral-900 py-2.5 text-[13px] font-semibold text-white transition active:scale-95">
            <Icon name="Plus" size={13} />{v}
          </button>
        ))}
        <button onClick={() => { store.resetCalories(today); fx.uncheck(); }} title="Reset today"
          className="flex items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-500 transition active:scale-95">
          <Icon name="RotateCcw" size={16} />
        </button>
      </div>

      <div className="mt-2 flex gap-2">
        <div className="flex flex-1 items-center rounded-2xl border border-neutral-200 bg-white px-3 py-2 focus-within:border-neutral-400">
          <input type="number" inputMode="numeric" placeholder="Custom kcal" value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
            className="w-full bg-transparent text-[14px] tabular-nums text-neutral-900 outline-none placeholder:text-neutral-300" />
        </div>
        <button onClick={addCustom}
          className="flex items-center gap-1 rounded-2xl bg-neutral-900 px-4 text-[13px] font-semibold text-white transition active:scale-95">
          <Icon name="Plus" size={14} /> Add
        </button>
      </div>
    </div>
  );
}

/* ---- supplements & shakes ---- */
export function SupplementsSection() {
  return (
    <div className="space-y-2.5">
      {B.supplements.map((s) => (
        <div key={s.name} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-700">
            <Icon name={s.icon} size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold leading-tight text-neutral-900">{s.name}</div>
            <div className="mt-0.5 text-[11px] text-neutral-400">{s.note}</div>
          </div>
          <Chip tone="outline">{s.timing}</Chip>
        </div>
      ))}

      {B.shakes.map((sh) => {
        const img = defaultPhoto(sh.image);
        return (
          <div key={sh.name} className="flex items-center gap-3 rounded-3xl border border-[oklch(0.85_0.06_150)] bg-[oklch(0.98_0.015_150)] p-2.5">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-neutral-200">
              {img
                ? <img src={img} alt={sh.name} className="h-full w-full object-contain" draggable={false} />
                : <span className="grid h-full w-full place-items-center text-neutral-300"><Icon name="Zap" size={20} /></span>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[oklch(0.5_0.12_150)]">Protein shake</div>
              <div className="truncate text-[14px] font-semibold leading-tight text-neutral-900">{sh.name}</div>
              <div className="mt-0.5 text-[11px] text-neutral-400">{sh.note}</div>
            </div>
            <div className="pr-1 text-right">
              <div className="text-[18px] font-semibold tabular-nums leading-none text-neutral-900">{sh.protein}g</div>
              <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-neutral-400">protein</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- weekly weigh-in modal ---- */
export function WeighInModal({ onClose }) {
  const store = useStore();
  const today = dateKey();
  const existing = store.weighInFor(today);
  const [am, setAm] = useState(existing.am ?? "");
  const [pm, setPm] = useState(existing.pm ?? "");

  const finish = (save) => {
    if (save) {
      store.setWeighIn(today, "am", am);
      store.setWeighIn(today, "pm", pm);
      if (am !== "" || pm !== "") { fx.success(); floatXp("Weigh-in logged"); }
    }
    store.markWeighPrompt(isoWeekKey()); // don't nag again this week
    onClose();
  };

  const field = (label, icon, val, setVal) => (
    <label className="flex-1">
      <div className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-400">
        <Icon name={icon} size={12} /> {label}
      </div>
      <div className="flex items-center rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 focus-within:border-neutral-400">
        <input type="number" inputMode="decimal" step="0.1" min="0" placeholder="—" value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-full bg-transparent text-[18px] font-semibold tabular-nums text-neutral-900 outline-none placeholder:text-neutral-300" />
        <span className="text-[12px] text-neutral-400">kg</span>
      </div>
    </label>
  );

  return (
    <div className="absolute inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm"
      style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      onClick={() => finish(false)}>
      <div className="w-full rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-neutral-900 text-white"><Icon name="Scale" size={20} /></span>
            <div>
              <h2 className="text-[17px] font-semibold leading-tight tracking-tight text-neutral-900">Weekly weigh-in</h2>
              <p className="text-[12px] text-neutral-400">Log morning &amp; evening — we'll average them.</p>
            </div>
          </div>
          <button onClick={() => finish(false)} className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 transition active:scale-90">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="mt-4 flex gap-2.5">
          {field("Morning", "Sun", am, setAm)}
          {field("Evening", "Moon", pm, setPm)}
        </div>

        <div className="mt-4 flex gap-2.5">
          <button onClick={() => finish(false)}
            className="flex-1 rounded-2xl border border-neutral-200 bg-white py-3 text-[14px] font-medium text-neutral-500 transition active:scale-[0.98]">
            Later
          </button>
          <button onClick={() => finish(true)}
            className="flex-[1.6] rounded-2xl bg-neutral-900 py-3 text-[14px] font-semibold text-white transition active:scale-[0.98]">
            Save weigh-in
          </button>
        </div>
      </div>
    </div>
  );
}
