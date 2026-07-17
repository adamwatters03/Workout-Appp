/* =========================================================================
   COMPONENTS — Icon, rings, bars, photo slots, confetti, primitives
   ========================================================================= */
import React, { useState, useEffect, useRef, useReducer } from "react";
import {
  Apple, Calculator, Check, ChevronLeft, ChevronRight, Circle, CircleCheck,
  Database, Dumbbell, Fish, Flame, Goal, House, Image, Leaf, Lock, MessageCircle,
  Minus, Moon, Pill, Play, Plus, PoundSterling, RotateCcw, Scale, Sparkles,
  Sprout, Star, Sun, Swords, Target, TrendingDown, TrendingUp, Trophy,
  UtensilsCrossed, Volume2, VolumeX, X, Zap,
} from "lucide-react";
import { defaultPhoto } from "./photos.js";
import { setFxEnabled, useFxEnabled } from "./fx.js";

// only the icons the app actually uses, keyed by their design-file names
const ICONS = {
  Apple, Calculator, Check, ChevronLeft, ChevronRight, Circle, CircleCheck,
  Database, Dumbbell, Fish, Flame, Goal, House, Image, Leaf, Lock, MessageCircle,
  Minus, Moon, Pill, Play, Plus, PoundSterling, RotateCcw, Scale, Sparkles,
  Sprout, Star, Sun, Swords, Target, TrendingDown, TrendingUp, Trophy,
  UtensilsCrossed, Volume2, VolumeX, X, Zap,
};

/* ---- sound / haptics toggle ---- */
export function SoundToggle({ className = "" }) {
  const on = useFxEnabled();
  return (
    <button onClick={() => setFxEnabled(!on)} aria-pressed={on} title={on ? "Sound on" : "Sound off"}
      className={"grid h-8 w-8 place-items-center rounded-full ring-1 ring-inset transition active:scale-90 " +
        (on ? "bg-neutral-900 text-white ring-neutral-900" : "bg-white text-neutral-400 ring-neutral-200") + " " + className}>
      <Icon name={on ? "Volume2" : "VolumeX"} size={15} />
    </button>
  );
}

/* ---- Lucide icon ---- */
export function Icon({ name, size = 20, strokeWidth = 1.9, className = "", style }) {
  const C = ICONS[name];
  if (!C) return null;
  return <C size={size} strokeWidth={strokeWidth} className={className} style={style} />;
}

/* ---- mono eyebrow label ---- */
export function Eyebrow({ children, className = "" }) {
  return <span className={"font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400 " + className}>{children}</span>;
}

/* ---- count-up number ---- */
export function AnimatedNumber({ value, duration = 650, className = "", format = (n) => Math.round(n).toLocaleString() }) {
  const [disp, setDisp] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now(); const a = from.current; const b = value;
    let raf;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      setDisp(a + (b - a) * e);
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = b;
    };
    raf = requestAnimationFrame(tick);
    // safety: ensure final value even if rAF is throttled (hidden tab)
    const safe = setTimeout(() => { setDisp(b); from.current = b; }, duration + 120);
    return () => { cancelAnimationFrame(raf); clearTimeout(safe); };
  }, [value]);
  return <span className={className}>{format(disp)}</span>;
}

/* ---- progress ring ---- */
export function Ring({ pct = 0, size = 120, stroke = 10, color = "#111827", track = "#f0f0f0", children, className = "" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <div className={"relative inline-flex items-center justify-center " + className} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ---- thin progress bar ---- */
export function Bar({ pct = 0, className = "", color = "bg-neutral-900", track = "bg-neutral-100", height = "h-2" }) {
  return (
    <div className={"w-full overflow-hidden rounded-full " + track + " " + height + " " + className}>
      <div className={"h-full rounded-full " + color}
        style={{ width: (Math.max(0, Math.min(1, pct)) * 100) + "%", transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)" }} />
    </div>
  );
}

/* ---- macro stacked bar ---- */
export const MACRO_COLORS = { protein: "#111827", carbs: "oklch(0.62 0.13 150)", fat: "#d4d4d4" };
export function MacroBar({ macros, height = "h-1.5" }) {
  const k = { protein: macros.protein * 4, carbs: macros.carbs * 4, fat: macros.fat * 9 };
  const total = k.protein + k.carbs + k.fat || 1;
  return (
    <div className={"flex w-full overflow-hidden rounded-full " + height}>
      {["protein", "carbs", "fat"].map((key) => (
        <div key={key} style={{ width: (100 * k[key] / total) + "%", background: MACRO_COLORS[key], transition: "width 0.7s ease" }} />
      ))}
    </div>
  );
}

/* ---- spring check toggle ---- */
export function CheckToggle({ checked, onClick, size = 26 }) {
  return (
    <button onClick={onClick} aria-pressed={checked}
      className={"relative grid shrink-0 place-items-center rounded-full border transition-all duration-300 active:scale-90 " +
        (checked ? "border-[oklch(0.6_0.13_150)] bg-[oklch(0.6_0.13_150)] text-white"
                 : "border-neutral-300 bg-white text-transparent")}
      style={{ width: size, height: size }}>
      <Icon name="Check" size={size * 0.6} strokeWidth={3}
        className={"transition-all duration-300 " + (checked ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
    </button>
  );
}

/* ---- chip ---- */
export function Chip({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-600",
    dark: "bg-neutral-900 text-white",
    green: "bg-[oklch(0.95_0.04_150)] text-[oklch(0.42_0.12_150)]",
    amber: "bg-[oklch(0.95_0.05_85)] text-[oklch(0.5_0.12_75)]",
    outline: "ring-1 ring-inset ring-neutral-200 text-neutral-500",
  };
  return <span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.12em] " + tones[tone] + " " + className}>{children}</span>;
}

/* =========================================================================
   PHOTO SLOTS — user-fillable image placeholders, persisted in localStorage
   (production replacement for the design tool's <image-slot> element)
   ========================================================================= */
const IMG_KEY = "recomp-images-v1";
const IMG_ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const IMG_MAX_DIM = 1200;

let images = (() => {
  try { return JSON.parse(localStorage.getItem(IMG_KEY)) || {}; } catch (e) { return {}; }
})();
const imgSubs = new Set();

function setImage(id, url) {
  if (url) images = { ...images, [id]: url };
  else { images = { ...images }; delete images[id]; }
  try { localStorage.setItem(IMG_KEY, JSON.stringify(images)); } catch (e) {}
  imgSubs.forEach((fn) => fn());
}

function useImage(id) {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    imgSubs.add(force);
    return () => imgSubs.delete(force);
  }, []);
  return images[id];
}

// downscale through a canvas so localStorage carries resized bytes, not the raw upload
async function fileToDataUrl(file, targetW) {
  const bitmap = await createImageBitmap(file);
  try {
    const cap = Math.min(IMG_MAX_DIM, Math.max(1, Math.round(targetW * 2)) || IMG_MAX_DIM);
    const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/webp", 0.85);
  } finally {
    if (bitmap.close) bitmap.close();
  }
}

function ImageSlot({ id, placeholder = "Add photo", darken = true }) {
  const userUrl = useImage(id);        // user drag/drop override (localStorage)
  const fallback = defaultPhoto(id);   // image bundled with the app, if any
  const url = userUrl || fallback;
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const depth = useRef(0);

  const ingest = async (file) => {
    if (!file || IMG_ACCEPT.indexOf(file.type) < 0) return;
    try {
      const w = (rootRef.current && rootRef.current.clientWidth) || IMG_MAX_DIM;
      setImage(id, await fileToDataUrl(file, w));
    } catch (e) {}
  };

  return (
    <div ref={rootRef} className="group/slot absolute inset-0"
      onDragEnter={(e) => { e.preventDefault(); depth.current++; setOver(true); }}
      onDragOver={(e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; }}
      onDragLeave={() => { if (--depth.current <= 0) { depth.current = 0; setOver(false); } }}
      onDrop={(e) => {
        e.preventDefault(); depth.current = 0; setOver(false);
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) ingest(f);
      }}>
      <input ref={inputRef} type="file" accept={IMG_ACCEPT.join(",")} hidden
        onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) ingest(f); e.target.value = ""; }} />
      {url ? (
        <React.Fragment>
          <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover"
            draggable={false} style={darken ? { filter: "saturate(0.9) brightness(0.94)" } : undefined} />
          {/* tone overlay — darkens images to match the app's neutral palette */}
          {darken && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/45 via-neutral-950/15 to-neutral-950/25" />}
          <div className="absolute right-2 top-2 z-[1] flex gap-1 opacity-0 transition-opacity group-hover/slot:opacity-100">
            <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }} title="Replace image"
              className="cursor-pointer rounded-md bg-black/65 px-2 py-1 text-[11px] text-white backdrop-blur-sm">Replace</span>
            {userUrl && (
              <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setImage(id, null); }}
                title={fallback ? "Revert to default image" : "Remove image"}
                className="cursor-pointer rounded-md bg-black/65 px-2 py-1 text-[11px] text-white backdrop-blur-sm">{fallback ? "Reset" : "Remove"}</span>
            )}
          </div>
        </React.Fragment>
      ) : (
        <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
          className="absolute inset-0 flex cursor-pointer select-none flex-col items-center justify-center gap-1.5 p-3 text-center text-neutral-400">
          <Icon name="Image" size={24} className="opacity-60" />
          {placeholder && <span className="max-w-[90%] text-[12px] font-medium leading-tight">{placeholder}</span>}
        </span>
      )}
      {over && <div className="pointer-events-none absolute inset-0 bg-[rgba(201,100,66,0.10)] outline outline-2 -outline-offset-2 outline-[#c96442]" />}
    </div>
  );
}

/* ---- user photo slot wrapper ---- */
export function Photo({ id, ratio = "16 / 9", shape = "rounded", radius = 16, placeholder = "Add photo", className = "", overlay, darken = true }) {
  return (
    <div className={"relative overflow-hidden bg-neutral-100 " + className}
      style={{ aspectRatio: ratio, borderRadius: shape === "circle" ? "9999px" : radius }}>
      <ImageSlot id={id} placeholder={placeholder} darken={darken} />
      {overlay}
    </div>
  );
}

/* ---- confetti burst ---- */
export function fireConfetti() {
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
  const colors = ["#111827", "oklch(0.62 0.13 150)", "#e5e7eb", "oklch(0.78 0.12 85)"];
  const cx = innerWidth / 2, cy = innerHeight * 0.42;
  const parts = Array.from({ length: 90 }, () => {
    const ang = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 9;
    return { x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 4,
      s: 5 + Math.random() * 7, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
      c: colors[(Math.random() * colors.length) | 0], life: 0 };
  });
  const t0 = performance.now();
  (function frame(t) {
    const dt = Math.min(2, (t - t0) / 16.6);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = false;
    parts.forEach((p) => {
      p.life += 1; p.vy += 0.22 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const a = Math.max(0, 1 - p.life / 90);
      if (a > 0.02 && p.y < innerHeight + 30) {
        alive = true;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
      }
    });
    if (alive) requestAnimationFrame(frame); else cv.remove();
  })(t0);
}

export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
