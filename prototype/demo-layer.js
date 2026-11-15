/* ===== DEMO LAYER =====
 * Stands in for claude.ai's shared storage so the demo runs anywhere without login.
 * Sample data is dated relative to today, kept in this browser (localStorage),
 * and synced live between open tabs. "Opnieuw beginnen" restores the sample data.
 */
const GATE_ID = "demo-nieuw", GATE_NAME = "Eva de Wit";
(function () {
  const KEY = "n2c-demo-data-v1";
  const p2 = n => String(n).padStart(2, "0");
  const isoD = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  const today = isoD(new Date());
  const D = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return isoD(d); };
  const now = Date.now(), H = 36e5;

  function seed() {
    const S = o => ({ notes: "", signups: {}, hours: null, assigned: null, status: "open", breakMin: 30, createdAt: now - 72 * H, updatedAt: now - 24 * H, ...o });
    const A = (zid, o) => S({ status: "toegewezen", assigned: zid, signups: { [zid]: { status: "goedgekeurd", at: now - 48 * H } }, ...o });
    const hrs = (start, end, breakMin, confirmed) => ({ start, end, breakMin, confirmed, at: now - 20 * H, ...(confirmed ? { confirmedAt: now - 10 * H } : {}) });
    const pend = (...z) => Object.fromEntries(z.map((id, i) => [id, { status: "in_behandeling", at: now - (5 - i) * H }]));
    return {
      inst: {
        "i-linde": { name: "De Linde", city: "Rotterdam", depts: ["PG-afdeling", "Somatiek", "Revalidatie"] },
        "i-maas": { name: "Maasoever", city: "Schiedam", depts: ["Kleinschalig wonen", "Wijkteam"] },
        "i-baken": { name: "Het Baken", city: "Almere", depts: ["Begeleid wonen", "Dagbesteding"] },
      },
      zzp: {
        "z-sanne": { name: "Sanne Bakker", funcs: ["Verpleegkundige"], unavailable: [] },
        "z-youssef": { name: "Youssef Amrani", funcs: ["Verzorgende IG"], unavailable: [D(11)] },
        "z-lotte": { name: "Lotte de Vries", funcs: ["Helpende", "Verzorgende IG"], unavailable: [D(4)] },
        "z-mark": { name: "Mark Jansen", funcs: ["Verpleegkundige", "Begeleider"], unavailable: [] },
        "z-esra": { name: "Esra Yilmaz", funcs: ["Begeleider"], unavailable: [D(6), D(13)] },
        "z-daan": { name: "Daan Visser", funcs: ["Verzorgende IG", "Helpende"], unavailable: [] },
      },
      shifts: {
        // worked and confirmed
        p1: A("z-youssef", { instId: "i-linde", dept: "PG-afdeling", date: D(-9), start: "07:00", end: "15:30", func: "Verzorgende IG", hours: hrs("07:00", "15:30", 30, true) }),
        p2: A("z-sanne", { instId: "i-maas", dept: "Wijkteam", date: D(-8), start: "08:00", end: "16:30", func: "Verpleegkundige", hours: hrs("08:00", "16:30", 30, true) }),
        p3: A("z-esra", { instId: "i-baken", dept: "Begeleid wonen", date: D(-7), start: "09:00", end: "17:00", func: "Begeleider", hours: hrs("09:00", "17:15", 30, true) }),
        p4: A("z-mark", { instId: "i-linde", dept: "Somatiek", date: D(-6), start: "15:00", end: "23:00", func: "Verpleegkundige", hours: hrs("15:00", "23:00", 30, true) }),
        p5: A("z-daan", { instId: "i-linde", dept: "Revalidatie", date: D(-5), start: "07:00", end: "15:30", func: "Verzorgende IG", hours: hrs("07:00", "15:30", 30, true) }),
        // hours entered, waiting for the planner
        p6: A("z-sanne", { instId: "i-linde", dept: "PG-afdeling", date: D(-4), start: "15:00", end: "23:00", func: "Verpleegkundige", hours: hrs("15:00", "23:45", 30, false) }),
        p7: A("z-youssef", { instId: "i-linde", dept: "Revalidatie", date: D(-3), start: "07:00", end: "15:30", func: "Verzorgende IG", hours: hrs("07:00", "15:30", 30, false) }),
        p8: A("z-lotte", { instId: "i-maas", dept: "Kleinschalig wonen", date: D(-3), start: "07:30", end: "13:00", breakMin: 0, func: "Helpende", hours: hrs("07:30", "13:00", 0, false) }),
        // worked, hours still to enter
        p9: A("z-youssef", { instId: "i-linde", dept: "Somatiek", date: D(-2), start: "07:00", end: "15:30", func: "Verzorgende IG" }),
        p10: A("z-esra", { instId: "i-baken", dept: "Dagbesteding", date: D(-1), start: "09:00", end: "15:00", func: "Begeleider" }),
        // today
        t1: S({ instId: "i-linde", dept: "PG-afdeling", date: D(0), start: "23:00", end: "07:15", breakMin: 15, func: "Verpleegkundige", signups: pend("z-mark") }),
        t2: A("z-sanne", { instId: "i-maas", dept: "Wijkteam", date: D(0), start: "08:00", end: "16:30", func: "Verpleegkundige" }),
        // upcoming
        u1: A("z-youssef", { instId: "i-linde", dept: "Revalidatie", date: D(1), start: "07:00", end: "15:30", func: "Verzorgende IG", notes: "Sleutelpas ophalen bij de receptie" }),
        u2: S({ instId: "i-linde", dept: "Revalidatie", date: D(1), start: "15:00", end: "23:00", func: "Verzorgende IG", signups: pend("z-lotte") }),
        u3: S({ instId: "i-maas", dept: "Wijkteam", date: D(1), start: "06:00", end: "10:00", breakMin: 0, func: "Verpleegkundige" }),
        u4: A("z-esra", { instId: "i-baken", dept: "Begeleid wonen", date: D(2), start: "09:00", end: "17:00", func: "Begeleider" }),
        c1: S({ instId: "i-maas", dept: "Kleinschalig wonen", date: D(2), start: "07:30", end: "13:00", breakMin: 0, func: "Helpende", status: "geannuleerd", cancelReason: "Bezetting is rond" }),
        u5: A("z-sanne", { instId: "i-maas", dept: "Wijkteam", date: D(3), start: "08:00", end: "16:30", func: "Verpleegkundige" }),
        u6: S({ instId: "i-linde", dept: "PG-afdeling", date: D(4), start: "07:00", end: "15:30", func: "Verzorgende IG" }),
        u7: S({ instId: "i-linde", dept: "Somatiek", date: D(5), start: "15:00", end: "23:00", func: "Verpleegkundige", signups: pend("z-sanne", "z-mark") }),
        u8: A("z-sanne", { instId: "i-maas", dept: "Wijkteam", date: D(5), start: "13:00", end: "21:00", func: "Verpleegkundige" }),
        u9: S({ instId: "i-baken", dept: "Dagbesteding", date: D(6), start: "09:00", end: "15:00", func: "Begeleider", signups: pend("z-mark") }),
        u10: S({ instId: "i-linde", dept: "PG-afdeling", date: D(7), start: "07:00", end: "15:30", func: "Verzorgende IG" }),
        u11: S({ instId: "i-linde", dept: "PG-afdeling", date: D(7), start: "07:00", end: "15:30", func: "Verzorgende IG" }),
        u12: S({ instId: "i-maas", dept: "Kleinschalig wonen", date: D(8), start: "15:00", end: "21:30", func: "Helpende", signups: pend("z-daan") }),
        u13: S({ instId: "i-linde", dept: "Revalidatie", date: D(9), start: "23:00", end: "07:00", breakMin: 15, func: "Verpleegkundige" }),
        u14: A("z-daan", { instId: "i-linde", dept: "Somatiek", date: D(10), start: "07:00", end: "15:30", func: "Verzorgende IG" }),
        u15: S({ instId: "i-baken", dept: "Begeleid wonen", date: D(12), start: "13:00", end: "21:00", func: "Begeleider" }),
        u16: S({ instId: "i-maas", dept: "Wijkteam", date: D(13), start: "08:00", end: "16:30", func: "Verpleegkundige" }),
      },
      members: {
        "u-anouk": { kind: "inst", refId: "i-linde", at: now - 900 * H },
        "u-sanne": { kind: "zzp", refId: "z-sanne", at: now - 800 * H },
        "u-youssef": { kind: "zzp", refId: "z-youssef", at: now - 700 * H },
      },
      requests: {
        "u-rik": { kind: "zzp", refId: null, funcs: ["Verpleegkundige"], name: "Rik Mulder", note: "Ik werk vooral in de regio Rotterdam. Bereikbaar op 06 12 34 56 78.", status: "pending", at: now - 3 * H },
      },
      notifs: Object.fromEntries([
        ["admin", "Mark Jansen meldt zich aan voor de nachtdienst Verpleegkundige bij De Linde, PG-afdeling.", 1],
        ["admin", "Sanne Bakker en Mark Jansen melden zich aan voor Verpleegkundige, De Linde, Somatiek.", 4],
        ["admin", "Nieuwe toegangsaanvraag van Rik Mulder als zzp'er.", 3],
        ["inst:i-linde", "Youssef Amrani is ingepland op de vroege dienst Revalidatie.", 6],
        ["inst:i-linde", "Sanne Bakker heeft 8,25 uur ingevuld voor de PG-afdeling. Graag bevestigen.", 20],
        ["zzp:z-youssef", "Nieuwe open dienst: Verzorgende IG, De Linde PG-afdeling.", 2],
        ["zzp:z-youssef", "Je bent ingepland: Verzorgende IG, De Linde Revalidatie.", 30],
        ["zzp:z-sanne", "Je uren bij Maasoever zijn bevestigd.", 10],
      ].map(([to, text, hAgo], i) => [`n${i}`, { to, text, shiftId: null, at: now - hAgo * H, by: to === "admin" ? "systeem" : "Next2Care" }])),
    };
  }

  const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  let state = null;
  try { state = JSON.parse(ls.get(KEY) || "null"); } catch { state = null; }
  if (!state || state.day !== today || !state.data) state = { day: today, data: seed() };
  const data = state.data;
  const save = () => ls.set(KEY, JSON.stringify(state));
  save();

  const clone = v => JSON.parse(JSON.stringify(v));
  const merge = (a, b) => { for (const [k, v] of Object.entries(b)) { if (v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) merge(a[k], v); else a[k] = clone(v); } return a; };
  const subs = [];
  let n = 0;
  const snap = (c, q) => {
    let docs = Object.entries(data[c] || {}).map(([id, d]) => ({ id, exists: true, data: () => clone(d) }));
    if (q.order) docs.sort((x, y) => (x.data()[q.order[0]] > y.data()[q.order[0]] ? 1 : -1) * (q.order[1] === "desc" ? -1 : 1));
    if (q.lim) docs = docs.slice(0, q.lim);
    return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false, hasPendingWrites: false } };
  };
  const docSnap = (c, id) => ({ id, exists: !!data[c]?.[id], data: () => clone(data[c]?.[id]), metadata: { fromCache: false } });
  const fire = c => { subs.filter(s => !c || s.c === c).forEach(s => s.run()); };
  const changed = c => { save(); setTimeout(() => fire(c), 0); };
  const query = (c, q = {}) => ({
    orderBy: (f, d) => query(c, { ...q, order: [f, d || "asc"] }),
    limit: l => query(c, { ...q, lim: l }),
    where: () => query(c, q),
    onSnapshot: next => { const s = { c, run: () => next(snap(c, q)) }; subs.push(s); setTimeout(s.run, 0); return () => subs.splice(subs.indexOf(s), 1); },
    add: async d => { const id = `d${Date.now().toString(36)}${++n}`; (data[c] ||= {})[id] = clone(d); changed(c); return { id }; },
    doc: id => ref(`${c}/${id}`),
  });
  const ref = p => { const [c, id] = p.split("/"); return {
    id, path: p,
    get: async () => docSnap(c, id),
    set: async d => { (data[c] ||= {})[id] = clone(d); changed(c); },
    update: async d => { if (!data[c]?.[id]) throw Object.assign(new Error("missing"), { code: "not_found" }); merge(data[c][id], d); changed(c); },
    delete: async () => { if (data[c]) delete data[c][id]; changed(c); },
    onSnapshot: next => { const s = { c, run: () => next(docSnap(c, id)) }; subs.push(s); setTimeout(s.run, 0); return () => subs.splice(subs.indexOf(s), 1); },
  }; };
  const db = { collection: c => query(c), doc: ref };

  // live sync: another tab changed the data
  window.addEventListener("storage", e => {
    if (e.key !== KEY || !e.newValue) return;
    try { const next = JSON.parse(e.newValue); for (const k of Object.keys(data)) delete data[k]; Object.assign(data, next.data); state.day = next.day; fire(); } catch {}
  });

  const NAMES = { "u-anouk": "Anouk Smit", "u-sanne": "Sanne Bakker", "u-youssef": "Youssef Amrani", "u-rik": "Rik Mulder", [GATE_ID]: GATE_NAME };
  const user = {
    me: async () => ({ id: "demo-beheer", name: "Next2Care", isOwner: true, canEdit: true }),
    profiles: async ids => Object.fromEntries((Array.isArray(ids) ? ids : [ids]).map(i => [i, { id: i, name: NAMES[i] || "" }])),
  };

  window.__demo = {
    use: async name => name === "db" ? db : name === "user" ? user : null,
    reset() {
      try { Object.keys(localStorage).filter(k => k.startsWith("n2c-")).forEach(k => localStorage.removeItem(k)); } catch {}
      const fresh = seed();
      for (const k of Object.keys(data)) delete data[k];
      Object.assign(data, fresh); state.day = today;
      save(); fire();
    },
  };
})();
