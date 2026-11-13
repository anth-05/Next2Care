const S = (o) => ({ notes: "", signups: {}, hours: null, assigned: null, status: "open", breakMin: 30, createdAt: 1, updatedAt: 1, ...o });
const seed = () => ({
  inst: { "i-linde": { name: "De Linde", city: "Rotterdam", depts: ["PG-afdeling", "Somatiek", "Revalidatie"] }, "i-maas": { name: "Maasoever", city: "Schiedam", depts: ["Kleinschalig wonen", "Wijkteam"] } },
  zzp: { "z-sanne": { name: "Sanne", funcs: ["Verpleegkundige"], unavailable: [] }, "z-youssef": { name: "Youssef", funcs: ["Verzorgende IG"], unavailable: [] }, "z-lotte": { name: "Lotte", funcs: ["Helpende", "Verzorgende IG"], unavailable: ["2026-11-19"] }, "z-mark": { name: "Mark", funcs: ["Verpleegkundige", "Begeleider"], unavailable: [] } },
  shifts: {
    s02: S({ instId: "i-linde", dept: "PG-afdeling", date: "2026-11-11", start: "15:00", end: "23:00", func: "Verpleegkundige", status: "toegewezen", assigned: "z-sanne", hours: { start: "15:00", end: "23:15", breakMin: 30, confirmed: false } }),
    s03: S({ instId: "i-maas", dept: "Kleinschalig wonen", date: "2026-11-12", start: "07:30", end: "13:00", breakMin: 0, func: "Helpende", status: "toegewezen", assigned: "z-lotte" }),
    s05: S({ instId: "i-linde", dept: "PG-afdeling", date: "2026-11-15", start: "23:00", end: "07:15", breakMin: 15, func: "Verpleegkundige", signups: { "z-mark": { status: "in_behandeling", at: 1 } } }),
    s06: S({ instId: "i-linde", dept: "Revalidatie", date: "2026-11-16", start: "07:00", end: "15:30", func: "Verzorgende IG", status: "toegewezen", assigned: "z-youssef" }),
    s07: S({ instId: "i-linde", dept: "Revalidatie", date: "2026-11-16", start: "15:00", end: "23:00", func: "Verzorgende IG", signups: { "z-lotte": { status: "in_behandeling", at: 1 } } }),
    s09: S({ instId: "i-maas", dept: "Wijkteam", date: "2026-11-18", start: "08:00", end: "16:30", func: "Verpleegkundige", status: "toegewezen", assigned: "z-sanne" }),
    s10: S({ instId: "i-linde", dept: "PG-afdeling", date: "2026-11-19", start: "07:00", end: "15:30", func: "Verzorgende IG" }),
    s11: S({ instId: "i-linde", dept: "Somatiek", date: "2026-11-20", start: "15:00", end: "23:00", func: "Verpleegkundige", signups: { "z-sanne": { status: "in_behandeling", at: 1 }, "z-mark": { status: "in_behandeling", at: 2 } } }),
    s14: S({ instId: "i-maas", dept: "Wijkteam", date: "2026-11-16", start: "06:00", end: "10:00", func: "Verpleegkundige" }),
  },
  notifs: {},
});

module.exports = { seed };
