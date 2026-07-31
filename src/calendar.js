/* =========================================================================
   GOOGLE CALENDAR — read-only sync (client-side OAuth, no backend).
   Reads this week's events and adapts the training/nutrition plan:
     • Boxing / Football events place the cardio session on that day
     • Away / holiday / travel events turn a day into rest + travel
     • A base cardio day is freed to rest when its activity moved elsewhere
   The classification + override builder are pure so they can be unit-tested.
   ========================================================================= */

// Public OAuth client id — safe to embed in a static site (no secret here).
export const CLIENT_ID = "92541775748-2c7lmmdnd3avtnq9ir3v632esmslgpko.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const DK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// ---- override shapes merged onto the base weekday ----
const BOX  = { type: "cardio", activity: "Boxing",   icon: "Swords", blurb: "Boxing — high-intensity conditioning", fromCalendar: true };
const FOOT = { type: "cardio", activity: "Football", icon: "Goal",   blurb: "Pitch session — aerobic + repeated sprints", fromCalendar: true };
const AWAY = { type: "rest",   away: true,            icon: "Plane",  blurb: "Away / travel — rest & recover", fromCalendar: true };
const FREED = { type: "rest",                          icon: "Moon",   blurb: "Rest & recovery", freed: true, fromCalendar: true };

export function classify(title) {
  const t = String(title || "").toLowerCase();
  if (/\b(away|holiday|vacation|annual leave|flight|abroad|travel|trip|out of town)\b/.test(t)) return "away";
  if (/\b(box|boxing|sparring)\b/.test(t)) return "boxing";
  if (/\b(football|soccer|footy|5.?a.?side|match|kickabout)\b/.test(t)) return "football";
  return null;
}

// "YYYY-MM-DD" for a local Date
function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// the local dates an event covers (all-day events can span several days)
function coveredDates(ev) {
  if (ev.start && ev.start.date) {
    // all-day: end.date is exclusive
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
  const tags = {}; DK.forEach((k) => { tags[k] = new Set(); });
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
      if (k) tags[k].add(cls);
    }
  }

  const hasFootball = DK.some((k) => tags[k].has("football"));
  const hasBoxing = DK.some((k) => tags[k].has("boxing"));
  const overrides = {};
  const summary = [];
  DK.forEach((k) => {
    const s = tags[k];
    if (s.has("away")) { overrides[k] = { ...AWAY }; summary.push([k, "Away"]); }
    else if (s.has("boxing")) { overrides[k] = { ...BOX }; summary.push([k, "Boxing"]); }
    else if (s.has("football")) { overrides[k] = { ...FOOT }; summary.push([k, "Football"]); }
    else if (k === "mon" && hasFootball) overrides[k] = { ...FREED };
    else if (k === "wed" && hasBoxing) overrides[k] = { ...FREED };
  });
  return { overrides, summary };
}

// Monday 00:00 (local) of the week containing `d`
export function mondayOf(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // Mon=0 … Sun=6
  x.setDate(x.getDate() - dow);
  return x;
}

/* ---- OAuth + fetch (browser only) ---------------------------------------- */
let tokenClient = null;
let accessToken = null;

function loadGis() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) return resolve();
    const existing = document.querySelector('script[data-gsi]');
    if (existing) { existing.addEventListener("load", () => resolve()); existing.addEventListener("error", reject); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true; s.dataset.gsi = "1";
    s.onload = () => resolve(); s.onerror = () => reject(new Error("Could not load Google sign-in."));
    document.head.appendChild(s);
  });
}

// pop the Google consent/chooser and resolve with an access token
export async function authorize() {
  await loadGis();
  return new Promise((resolve, reject) => {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (resp) => {
          if (resp && resp.error) return reject(new Error(resp.error_description || resp.error));
          accessToken = resp.access_token;
          resolve(accessToken);
        },
        error_callback: (err) => reject(new Error((err && err.message) || "Authorisation was cancelled.")),
      });
      tokenClient.requestAccessToken({ prompt: "" });
    } catch (e) { reject(e); }
  });
}

export function isAuthorized() { return !!accessToken; }

export async function fetchWeekEvents(weekStart) {
  if (!accessToken) throw new Error("Not connected to Google Calendar.");
  const timeMin = new Date(weekStart).toISOString();
  const end = new Date(weekStart); end.setDate(end.getDate() + 7);
  const timeMax = end.toISOString();
  const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
    "?singleEvents=true&orderBy=startTime&maxResults=250" +
    "&timeMin=" + encodeURIComponent(timeMin) + "&timeMax=" + encodeURIComponent(timeMax);
  const r = await fetch(url, { headers: { Authorization: "Bearer " + accessToken } });
  if (r.status === 401 || r.status === 403) { accessToken = null; throw new Error("Google access expired — tap Connect again."); }
  if (!r.ok) throw new Error("Calendar request failed (" + r.status + ").");
  const j = await r.json();
  return j.items || [];
}

// full flow: authorize → fetch this week → build overrides + summary
export async function syncNow() {
  await authorize();
  const weekStart = mondayOf();
  const events = await fetchWeekEvents(weekStart);
  const { overrides, summary } = buildWeekOverrides(events, weekStart);
  return { overrides, summary, count: events.length };
}
