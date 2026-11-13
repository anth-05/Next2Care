const { boot } = require("./harness");
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

const results = [];
const check = (name, ok, info = "") => { results.push({ name, ok: !!ok, info }); };
async function t(name, fn) { try { await fn(); } catch (e) { check(name + " (crashed)", false, e.message); } }

(async () => {
  // ---------------- HAPPY FLOW ----------------
  await t("happy", async () => {
    const A = await boot(seed(), { persona: "inst:i-linde" });
    check("H1 planner sees own roster only", A.text().includes("Rooster") && !A.text().includes("Maasoever"));
    await A.click('[data-act="new"]');
    check("H2 new-shift dialog opens", A.$('form[data-form="shift"]'));
    A.set("m-date", "2026-11-23"); A.set("m-start", "07:00"); A.set("m-end", "15:30"); A.set("m-break", "30"); A.set("m-dept", "Somatiek"); A.set("m-func", "Verzorgende IG"); A.set("m-count", "2");
    await A.submit('form[data-form="shift"]');
    const created = Object.entries(A.shifts()).filter(([, s]) => s.date === "2026-11-23");
    check("H3 two open shifts created", created.length === 2 && created.every(([, s]) => s.status === "open"), `created=${created.length}`);
    const to = A.notifs().map(n => n.to);
    check("H4 matching zzp'ers notified (Youssef, Lotte), not Sanne", to.includes("zzp:z-youssef") && to.includes("zzp:z-lotte") && !to.includes("zzp:z-sanne"), to.join(","));
    check("H5 dialog closed after save", !A.$('form[data-form="shift"]'));
    const newId = created[0][0];

    await A.persona("zzp:z-youssef"); await A.tab("open");
    check("H6 zzp sees new open shift", A.text().includes("ma 23") || A.text().includes("23"));
    await A.click(`[data-act="signup"][data-id="${newId}"]`);
    check("H7 sign-up stored as pending", A.shifts()[newId].signups["z-youssef"]?.status === "in_behandeling");
    check("H8 admin notified of sign-up", A.notifs().some(n => n.to === "admin" && n.text.includes("meldt zich aan")));

    await A.persona("admin");
    check("H9 admin sees sign-up to review", A.$(`[data-act="approve"][data-id="${newId}"]`));
    await A.click(`[data-act="approve"][data-id="${newId}"][data-z="z-youssef"]`);
    check("H10 approval assigns shift", A.shifts()[newId].assigned === "z-youssef" && A.shifts()[newId].status === "toegewezen");
    check("H11 zzp + planner notified of approval", A.notifs().some(n => n.to === "zzp:z-youssef" && n.text.includes("goedgekeurd")) && A.notifs().some(n => n.to === "inst:i-linde" && n.text.includes("ingepland")));

    await A.click('[data-act="approve"][data-id="s11"][data-z="z-sanne"]');
    check("H12 approving one of two candidates rejects the other", A.shifts().s11.assigned === "z-sanne" && A.shifts().s11.signups["z-mark"].status === "afgewezen");
    check("H13 rejected candidate gets a message", A.notifs().some(n => n.to === "zzp:z-mark" && n.text.includes("iemand anders")));

    await A.persona("inst:i-linde");
    await A.click(`[data-act="edit"][data-id="${newId}"]`);
    A.set("m-start", "08:00"); await A.submit('form[data-form="shift"]');
    check("H14 planner edits an assigned shift", A.shifts()[newId].start === "08:00");
    check("H15 assigned zzp notified of change", A.notifs().some(n => n.to === "zzp:z-youssef" && n.text.includes("gewijzigd")));

    await A.persona("zzp:z-lotte");
    check("H16 zzp sees 'Uren invullen' for past shift", A.$('[data-act="hours"][data-id="s03"]'));
    await A.click('[data-act="hours"][data-id="s03"]'); A.set("h-start", "07:30"); A.set("h-end", "13:15"); A.set("h-break", "0");
    await A.submit('form[data-form="hours"]');
    check("H17 hours stored, awaiting confirmation", A.shifts().s03.hours?.end === "13:15" && A.shifts().s03.hours.confirmed === false);
    await A.persona("inst:i-maas"); await A.tab("uren");
    await A.click('[data-act="confirmHours"][data-id="s03"]');
    check("H18 planner confirms hours", A.shifts().s03.hours.confirmed === true);

    await A.persona("admin"); await A.tab("uren"); await A.click('[data-act="month"][data-d="0"]').catch(() => {});
    await A.click('[data-act="export"]'); await A.tick(40);
    check("H19 CSV export saved with header + rows", A.saved.length === 1 && A.saved[0].data.includes("Datum") && A.saved[0].data.split("\r\n").length >= 3, JSON.stringify(A.saved[0]?.data).slice(0,200));

    await A.tab("beheer"); A.set("ni-name", "Huize Test"); A.set("ni-city", "Almere"); A.set("ni-depts", "Afdeling A, Afdeling B");
    await A.submit('form[data-form="inst"]');
    check("H20 admin adds institution", Object.values(A.mock.data.inst).some(i => i.name === "Huize Test" && i.depts.length === 2));
    A.set("nz-name", "Nieuwe Zzp"); A.set("nz-f-VPK", true); await A.submit('form[data-form="zzp"]');
    check("H21 admin adds zzp'er", Object.values(A.mock.data.zzp).some(z => z.name === "Nieuwe Zzp"));

    await A.persona("zzp:z-mark"); await A.tab("beschikbaar");
    await A.click('[data-act="avail"][data-date="2026-11-24"]');
    check("H22 zzp marks a day unavailable", A.mock.data.zzp["z-mark"].unavailable.includes("2026-11-24"));

    await A.persona("admin"); await A.tab("diensten"); if (A.$('[data-act="week"][data-d="0"]')) await A.click('[data-act="week"][data-d="0"]'); await A.click('[data-act="week"][data-d="7"]');
    await A.click('[data-act="edit"][data-id="s10"]'); A.set("m-assign", "z-youssef");
    await A.click('[data-act="assign"][data-id="s10"]'); await A.tick(40);
    check("H23 admin assigns directly", A.shifts().s10.assigned === "z-youssef");
    await A.click('[data-act="edit"][data-id="s10"]'); await A.click('[data-act="unassign"][data-id="s10"]'); await A.tick(40);
    check("H24 admin unassigns, shift reopens", A.shifts().s10.assigned === null && A.shifts().s10.status === "open");
    await A.click('[data-act="edit"][data-id="s10"]'); await A.click('[data-act="askCancel"]');
    check("H25 cancel asks for confirmation first", A.d.body.textContent.includes("Deze dienst annuleren?") && A.shifts().s10.status === "open");
    await A.click('[data-act="doCancel"]'); await A.tick(40);
    check("H26 cancellation stored", A.shifts().s10.status === "geannuleerd");
  });

  // ---------------- SAD FLOW ----------------
  await t("sad", async () => {
    const B = await boot(seed(), { persona: "inst:i-linde" });
    await B.click('[data-act="new"]'); B.set("m-date", "2026-11-01"); await B.submit('form[data-form="shift"]');
    check("S1 shift in the past is refused", !Object.values(B.shifts()).some(s => s.date === "2026-11-01"), B.toast());
    B.set("m-date", ""); await B.submit('form[data-form="shift"]');
    check("S2 missing date is refused", B.toast().includes("Vul datum"), B.toast());
    B.set("m-date", "2026-11-25"); B.set("m-start", "15:00"); B.set("m-end", "07:00"); B.set("m-dept", "Somatiek");
    const before = Object.keys(B.shifts()).length;
    await B.submit('form[data-form="shift"]');
    const n = Object.values(B.shifts()).find(s => s.date === "2026-11-25");
    check("S3 end-before-start (likely typo, 16h shift) is caught", Object.keys(B.shifts()).length === before, n ? `saved ${n.start}-${n.end} without warning` : B.toast());
    if (!B.$('form[data-form="shift"]')) { await B.click('[data-act="new"]'); B.set("m-date", "2026-11-25"); B.set("m-dept", "Somatiek"); }
    B.set("m-start", "07:00"); B.set("m-end", "07:00"); await B.submit('form[data-form="shift"]');
    const z = Object.values(B.shifts()).find(s => s.date === "2026-11-25" && s.start === "07:00");
    if (B.$('form[data-form="shift"]')) {} check("S4 zero-length shift (start = end) is refused", !z, z ? "saved as 24h" : B.toast());

    const C = await boot(seed(), { persona: "admin" });
    // s06 Youssef 07:00-15:30 on 16th; s07 15:00-23:00 overlaps by 30 min
    C.mock.data.shifts.s07.signups["z-youssef"] = { status: "in_behandeling", at: 3 };
    await C.click('[data-act="tab"][data-tab="overzicht"]');
    await C.click('[data-act="approve"][data-id="s07"][data-z="z-youssef"]');
    check("S5 approving a double booking is blocked", C.shifts().s07.assigned !== "z-youssef", C.toast());
    // overnight overlap: s05 (15th 23:00 → 16th 07:15) vs s14 (16th 06:00–10:00) for Sanne
    await C.click('[data-act="approve"][data-id="s05"][data-z="z-mark"]');
    C.mock.data.shifts.s14.signups = { "z-mark": { status: "in_behandeling", at: 4 } };
    await C.click('[data-act="tab"][data-tab="diensten"]'); await C.click('[data-act="tab"][data-tab="overzicht"]');
    await C.click('[data-act="approve"][data-id="s14"][data-z="z-mark"]');
    check("S6 overlap across midnight is blocked", C.shifts().s14.assigned !== "z-mark", C.shifts().s14.assigned === "z-mark" ? "night shift until 07:15 and 06:00 shift both assigned" : C.toast());

    const D = await boot(seed(), { persona: "zzp:z-lotte" }); await D.tab("open");
    check("S7 no sign-up button on an unavailable day", !D.$('[data-act="signup"][data-id="s10"]'));
    // double click
    const D2 = await boot(seed(), { persona: "zzp:z-youssef" }); await D2.tab("open");
    const el = D2.$('[data-act="signup"]'); const id = el?.dataset.id;
    el.dispatchEvent(new D2.w.MouseEvent("click", { bubbles: true })); el.dispatchEvent(new D2.w.MouseEvent("click", { bubbles: true })); await D2.tick(40);
    check("S8 double click sends one sign-up", D2.notifs().filter(n => n.to === "admin").length === 1, `admin notifs=${D2.notifs().filter(n => n.to === "admin").length}`);

    const E = await boot(seed(), { persona: "zzp:z-sanne", denyWrites: true }); await E.tab("open");
    const b = E.$('[data-act="signup"]'); if (b) await E.click(b); await E.tick(30);
    check("S9 no write rights gives a clear message", E.toast().includes("schrijfrechten"), E.toast());

    const F = await boot(seed(), { noDb: true }); await F.tick(50);
    check("S10 storage unavailable shows explanation", F.text().includes("niet beschikbaar"));

    const G = await boot(seed(), { persona: "admin" }); await G.tab("diensten");
    await G.click('[data-act="edit"][data-id="s02"]');
    check("S11 worked shift with hours cannot be cancelled", !G.$('[data-act="askCancel"]'), "cancel button offered on worked shift");
    const st = G.mock.data.inst["i-linde"]; st.name = '<img src=x onerror="window.__xss=1">';
    await G.click('[data-act="close"]'); await G.tab("overzicht"); await G.tick(30);
    check("S12 HTML in names is escaped", !G.w.__xss && !G.$("img[src='x']"));

    const H = await boot(seed(), { persona: "zzp:z-lotte" });
    await H.click('[data-act="hours"][data-id="s03"]'); H.set("h-start", "13:00"); H.set("h-end", "07:30"); await H.submit('form[data-form="hours"]');
    check("S13 hours with end before start are caught", !H.shifts().s03.hours, H.shifts().s03.hours ? "saved 18.5h" : H.toast());
    if (H.$('form[data-form="hours"]')) await H.click('[data-act="close"]'); if (H.shifts().s03.hours) H.mock.data.shifts.s03.hours = null; await H.persona("admin"); await H.persona("zzp:z-lotte");
    await H.click('[data-act="hours"][data-id="s03"]'); H.set("h-start", "07:30"); H.set("h-end", "13:00"); H.set("h-break", "400"); await H.submit('form[data-form="hours"]');
    check("S14 break longer than the shift is refused", !H.shifts().s03.hours, H.shifts().s03.hours ? "saved" : H.toast());

    const I = await boot(seed(), { persona: "inst:i-gone" }); await I.tick(40);
    check("S15 unknown role falls back safely", I.d.getElementById("persona").value === "admin");

    const J = await boot(seed(), { persona: "inst:i-linde" });
    await J.click('[data-act="new"]'); J.set("m-date", "2026-11-26"); J.set("m-dept", "Somatiek"); J.set("m-count", "99"); await J.submit('form[data-form="shift"]');
    check("S16 'aantal plekken' is capped at 10", Object.values(J.shifts()).filter(s => s.date === "2026-11-26").length <= 10);
    await J.click('[data-act="new"]'); J.set("m-date", "2026-11-27"); J.set("m-dept", "Somatiek");
    J.$('form[data-form="shift"]').dispatchEvent(new J.w.Event("submit", { bubbles: true, cancelable: true }));
    J.$('form[data-form="shift"]')?.dispatchEvent(new J.w.Event("submit", { bubbles: true, cancelable: true }));
    await J.tick(60);
    check("S17 double submit creates one shift", Object.values(J.shifts()).filter(s => s.date === "2026-11-27").length === 1, `created ${Object.values(J.shifts()).filter(s => s.date === "2026-11-27").length}`);

    const K = await boot(seed(), { persona: "zzp:z-youssef" }); await K.tab("open");
    check("S18 zzp cannot see another institution's private notes? (open list shows only matching function)", !K.text().includes("Verpleegkundige "));
  });

  const fail = results.filter(r => !r.ok);
  results.forEach(r => console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.info ? "  — " + r.info : ""}`));
  console.log(`\n${results.length - fail.length}/${results.length} passed`);
  process.exit(0);
})();
