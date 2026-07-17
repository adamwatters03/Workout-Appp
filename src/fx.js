/* =========================================================================
   FX — game juice: synthesised sound effects (Web Audio, asset-free) +
   haptics + a floating "+XP" popper. All no-ops when muted or unsupported.
   ========================================================================= */
import { useEffect, useReducer } from "react";

let ctx = null;
let enabled = (() => {
  try { const v = localStorage.getItem("recomp-fx"); return v === null ? true : v === "1"; }
  catch (e) { return true; }
})();
const subs = new Set();

export function fxEnabled() { return enabled; }
export function setFxEnabled(v) {
  enabled = !!v;
  try { localStorage.setItem("recomp-fx", enabled ? "1" : "0"); } catch (e) {}
  subs.forEach((fn) => fn());
}
// re-render hook for the mute toggle
export function useFxEnabled() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => { subs.add(force); return () => subs.delete(force); }, []);
  return enabled;
}

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === "suspended") ctx.resume();
  return ctx;
}

// one short enveloped oscillator note
function tone({ freq = 440, dur = 0.12, type = "sine", gain = 0.05, slideTo = null, delay = 0 }) {
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(c.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.03);
}

// Vibration API — works on Android/Chrome; a harmless no-op on iOS Safari.
export function haptic(pattern = 10) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
}

export const fx = {
  tap()     { if (!enabled) return; tone({ freq: 300, dur: 0.05, type: "triangle", gain: 0.028 }); haptic(6); },
  pop()     { if (!enabled) return; tone({ freq: 520, slideTo: 880, dur: 0.13, type: "sine", gain: 0.05 }); haptic(12); },
  ping()    { if (!enabled) return; tone({ freq: 900, dur: 0.09, type: "sine", gain: 0.045 }); haptic(8); },
  uncheck() { if (!enabled) return; tone({ freq: 320, slideTo: 200, dur: 0.1, type: "sine", gain: 0.035 }); haptic(4); },
  add()     { if (!enabled) return; tone({ freq: 660, dur: 0.05, type: "square", gain: 0.022 }); haptic(5); },
  success() { if (!enabled) return; [523, 659, 784].forEach((f, i) => tone({ freq: f, dur: 0.15, type: "sine", gain: 0.05, delay: i * 0.075 })); haptic([10, 28, 10]); },
  levelUp() { if (!enabled) return; [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.2, type: "triangle", gain: 0.058, delay: i * 0.1 })); haptic([14, 40, 14, 60]); },
};

// floating "+15 XP" pill that rises and fades from screen centre
export function floatXp(text, color = "oklch(0.6 0.13 150)") {
  if (typeof document === "undefined") return;
  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText =
    "position:fixed;left:50%;top:60%;transform:translate(-50%,0) scale(0.9);z-index:9998;" +
    'font:600 15px/1 "Helvetica Neue",Helvetica,Arial,sans-serif;color:#fff;background:' + color + ";" +
    "padding:7px 13px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.22);pointer-events:none;" +
    "transition:transform .95s cubic-bezier(.22,1,.36,1),opacity .95s ease;opacity:1;";
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = "translate(-50%,-78px) scale(1)";
    el.style.opacity = "0";
  });
  setTimeout(() => el.remove(), 1000);
}
