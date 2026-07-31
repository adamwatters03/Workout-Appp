/* =========================================================================
   GOOGLE CALENDAR — read-only sync (client-side OAuth, no backend).
   Reads ALL of your own calendars for the week and adapts the plan:
     • Boxing / Football / other sport & exercise events → that day's session
     • Away / holiday / travel events → rest + travel
     • Everything else (meetings, notes, reminders) is ignored
   Auto-refreshes while the app is open (interval + on-focus). classify and
   buildWeekOverrides are pure so they can be unit-tested.
   ========================================================================= */

// Public OAuth client id — safe to embed in a static site (no secret here).
export const CLIENT_ID = "92541775748-2c7lmmdnd3avtnq9ir3v632esmslgpko.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const DK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// ---- override shapes merged onto the base weekday ----
const AWAY  = { type: "rest",   away: true, icon: "Plane",  blurb: "Away / travel — rest & recover", fromCalendar: true };
const FREED = { type: "rest",               icon: "Moon",   blurb: "Rest & recovery", freed: true, fromCalendar: true };
const cardioOverride = (activity, icon) => ({ type: "cardio", activity, icon, blurb: activity + " — logged from your calendar", fromCalendar: true });

// other sports / exercise → a display label (kept specific to avoid catching meetings)
const ACTIVITY = {
  run: "Run", running: "Run", jog: "Run", parkrun: "Run", "5k": "Run", "10k": "Run", marathon: "Run",
  swim: "Swim", swimming: "Swim",
  cycle: "Cycle", cycling: "Cycle", bike: "Cycle", spin: "Spin",
  tennis: "Tennis", padel: "Padel", squash: "Squash", badminton: "Badminton",
  basketball: "Basketball", rugby: "Rugby", cricket: "Cricket", golf: "Golf",
  climb: "Climbing", climbing: "Climbing", bouldering: "Climbing",
  hiit: "HIIT", crossfit: "CrossFit", yoga: "Yoga", pilates: "Pilates",
  hike: "Hike", hiking: "Hike",
  row: "Row", rowing: "Row", gym: "Gym", weights: "Gym", lift: "Gym", workout: "Workout", "personal trainer": "PT", pt: "PT",
};

// returns { kind, label } or null (null = ignore this event)
export function classify(title) {
  const t = " " + String(title || "").toLowerCase() + " ";
  if (/\b(away|holiday|vacation|annual leave|flight|abroad|travel|travelling|trip|out of town)\b/.test(t)) return { kind: "away" };
  if (/\b(boxing|box|sparring)\b/.test(t)) return { kind: "boxing", label: "Boxing" };
  if (/\b(football|soccer|footy|5.?a.?side|kickabout)\b/.test(t)) return { kind: "football", label: "Football" };
  for (const kw in ACTIVITY) {
    if (new RegExp("\\b" + kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(t)) return { kind: "activity", label: ACTIVITY[kw] };
  }
  return null;
}

function localDateStr(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function coveredDates(ev) {
  if (ev.start && ev.start.date) {
    const out = [];
    const s = new Date(ev.start.date + "T00:00:00");
    const e = ev.end && ev.end.date ? new Date(ev.end.date + "T00:00:00") : new Date(s.getTime() + 86400000);
    for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) out.push(localDateStr(d));
    return out;
  }
  if (ev.start && ev.start.dateTime) return [localDateStr(new Date(ev.start.dateTime))];
  return [];
}

// weekStart = Monday 00:00 (local) of the target week
export function buildWeekOverrides(events, weekStart) {
  const tags = {}; DK.forEach((k) => { tags[k] = []; }); // list of {kind,label}
  const dateToKey = {};
  DK.forEach((k, i) => {
    const dt = new Date(weekStart); dt.setDate(dt.getDate() + i);
    dateToKey[localDateStr(dt)] = k;
  });

  for (const ev of events || []) {
    const cls = classify(ev.summary);
    if (!cls) continue;
    for (const dstr of coveredDates(ev)) {
      const k = dateToKey[dstr];
      if (k) tags[k].push(cls);
    }
  }

  const has = (kind) => DK.some((k) => tags[k].some((c) => c.kind === kind));
  const hasFootball = has("football"), hasBoxing = has("boxing");
  const pick = (list, kind) => list.find((c) => c.kind === kind);

  const overrides = {}; const summary = [];
  DK.forEach((k) => {
    const list = tags[k];
    if (pick(list, "away")) { overrides[k] = { ...AWAY }; summary.push([k, "Away"]); return; }
    const box = pick(list, "boxing"), foot = pick(list, "football"), act = pick(list, "activity");
    if (box)  { overrides[k] = cardioOverride("Boxing", "Swords"); summary.push([k, "Boxing"]); return; }
    if (foot) { overrides[k] = cardioOverride("Football", "Goal"); summary.push([k, "Football"]); return; }
    if (act)  { overrides[k] = cardioOverride(act.label, "Zap"); summary.push([k, act.label]); return; }
    if (k === "mon" && hasFootball) overrides[k] = { ...FREED };
    else if (k === "wed" && hasBoxing) overrides[k] = { ...FREED };
  });
  return { overrides, summary };
}

export function mondayOf(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return x;
}

/* ---- OAuth token management (browser) ----------------------------------- */
let tokenClient = null, accessToken = null, expiresAt = 0, pending = null;

function loadGis() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) return resolve();
    const ex = document.querySelector("script[data-gsi]");
    if (ex) { ex.addEventListener("load", () => resolve()); ex.addEventListener("error", reject); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.defer = true; s.dataset.gsi = "1";
    s.onload = () => resolve(); s.onerror = () => reject(new Error("Could not load Google sign-in."));
    document.head.appendChild(s);
  });
}

function ensureClient() {
  if (tokenClient) return;
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID, scope: SCOPE,
    callback: (resp) => {
      if (!pending) return;
      if (resp && resp.error) { pending.reject(new Error(resp.error_description || resp.error)); }
      else { accessToken = resp.access_token; expiresAt = Date.now() + ((resp.expires_in || 3600) * 1000) - 60000; pending.resolve(accessToken); }
      pending = null;
    },
    error_callback: (err) => { if (pending) { pending.reject(new Error((err && err.type) || "auth_cancelled")); pending = null; } },
  });
}

async function requestToken() {
  await loadGis(); ensureClient();
  return new Promise((resolve, reject) => {
    pending = { resolve, reject };
    try { tokenClient.requestAccessToken({ prompt: "" }); } catch (e) { pending = null; reject(e); }
  });
}

const hasValidToken = () => !!accessToken && Date.now() < expiresAt;
export function isConnected() { return hasValidToken(); }
export function disconnect() { accessToken = null; expiresAt = 0; }

/* ---- Calendar API ------------------------------------------------------- */
async function apiGet(path) {
  const r = await fetch("https://www.googleapis.com/calendar/v3" + path, { headers: { Authorization: "Bearer " + accessToken } });
  if (r.status === 401 || r.status === 403) { accessToken = null; expiresAt = 0; const e = new Error("Google access expired — tap Connect again."); e.code = "NEEDS_AUTH"; throw e; }
  if (!r.ok) throw new Error("Calendar request failed (" + r.status + ").");
  return r.json();
}

// only the user's OWN calendars (owner/writer) — skips subscribed public ones
// like national-holiday or sports-fixture calendars, so those never mislead it
async function ownCalendarIds() {
  const list = await apiGet("/users/me/calendarList");
  return (list.items || [])
    .filter((c) => c.accessRole === "owner" || c.accessRole === "writer")
    .map((c) => c.id);
}

async function fetchAllWeekEvents(weekStart) {
  const timeMin = new Date(weekStart).toISOString();
  const end = new Date(weekStart); end.setDate(end.getDate() + 7);
  const timeMax = end.toISOString();
  const q = "?singleEvents=true&orderBy=startTime&maxResults=250&timeMin=" + encodeURIComponent(timeMin) + "&timeMax=" + encodeURIComponent(timeMax);
  const ids = await ownCalendarIds();
  const per = await Promise.all(ids.map((id) =>
    apiGet("/calendars/" + encodeURIComponent(id) + "/events" + q).then((j) => j.items || []).catch(() => [])
  ));
  return per.flat();
}

// full flow with the consent popup — used by the Connect / Sync button
export async function interactiveSync() {
  if (!hasValidToken()) await requestToken();
  const weekStart = mondayOf();
  const events = await fetchAllWeekEvents(weekStart);
  return { ...buildWeekOverrides(events, weekStart), count: events.length };
}

// silent refresh — reuses the live token, never pops UI. Throws NEEDS_AUTH
// when the token is gone (e.g. after a reload or ~1h expiry).
export async function backgroundSync() {
  if (!hasValidToken()) { const e = new Error("needs auth"); e.code = "NEEDS_AUTH"; throw e; }
  const weekStart = mondayOf();
  const events = await fetchAllWeekEvents(weekStart);
  return { ...buildWeekOverrides(events, weekStart), count: events.length };
}
