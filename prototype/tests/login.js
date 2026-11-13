const { boot } = require("./harness");
const { seed } = require("./seed");
let ok = 0, all = 0; const c = (n, v, i = "") => { all++; if (v) ok++; console.log(`${v ? "PASS" : "FAIL"}  ${n}${i ? "  — " + i : ""}`); };
const PL = { id: "u_piet", name: "Piet Planner", owner: false, edit: false };
const ZZ = { id: "u_nina", name: "Nina Zorg", owner: false, edit: false };
(async () => {
  // owner = admin
  const O = await boot(seed());
  c("L1 owner lands in Next2Care admin", O.text().includes("Twee kanten") && O.$("#persona"));
  // new person: gate
  const db = seed();
  const P = await boot(db, { user: PL });
  c("L2 unlinked person sees login portal, not the planning", P.text().includes("Toegang aanvragen") && !P.text().includes("Open diensten") && !P.$("#persona"));
  c("L3 no tabs or bell for unlinked person", !P.$(".tabs") && !P.$('[data-act="bell"]'));
  c("L4 header shows who is logged in", P.d.getElementById("top").textContent.includes("Piet Planner"));
  await P.submit('form[data-form="request"]');
  c("L5 submit without role is refused", !P.mock.data.requests && P.toast().includes("planner of zzp'er"), P.toast());
  P.d.getElementById("g-kind-inst").checked = true; P.d.getElementById("g-kind-inst").dispatchEvent(new P.w.Event("change", { bubbles: true })); await P.tick();
  c("L6 choosing planner shows institution picker", !P.d.getElementById("g-inst-wrap").hidden && P.d.getElementById("g-zzp-wrap").hidden);
  await P.submit('form[data-form="request"]');
  c("L7 planner without institution or note is refused", !P.mock.data.requests?.u_piet, P.toast());
  P.set("g-inst", "i-linde"); P.set("g-note", "Planner op de PG-afdeling");
  await P.submit('form[data-form="request"]'); await P.tick(40);
  const req = P.mock.data.requests?.u_piet;
  c("L8 access request stored under own account id", req && req.kind === "inst" && req.refId === "i-linde" && req.status === "pending");
  c("L9 Next2Care notified of request", P.notifs().some(n => n.to === "admin" && n.text.includes("toegangsaanvraag")));
  c("L10 person sees 'Aanvraag verstuurd'", P.text().includes("Aanvraag verstuurd"));
  c("L11 request stores no data about other people", !JSON.stringify(req).includes("u_owner"));

  // admin links (same db)
  const A = await boot(P.mock.data, { names: { u_piet: "Piet Planner" } });
  c("L12 admin sees waiting-access banner", A.text().includes("wacht op toegang"));
  await A.tab("beheer"); await A.tick(40);
  c("L13 request listed with Claude name", A.text().includes("Piet Planner") && A.$('[data-act="link"][data-u="u_piet"]'));
  c("L14 link target preselected from request", A.d.getElementById("lk-u_piet").value === "inst:i-linde");
  await A.click('[data-act="link"][data-u="u_piet"]'); await A.tick(40);
  c("L15 member record created, request removed", A.mock.data.members?.u_piet?.kind === "inst" && !A.mock.data.requests.u_piet);
  c("L16 welcome notification to the planner", A.notifs().some(n => n.to === "inst:i-linde" && n.text.includes("Welkom")));

  // planner logs in again
  const P2 = await boot(A.mock.data, { user: PL });
  c("L17 linked planner lands in own roster", P2.text().includes("Rooster") && P2.text().includes("De Linde"));
  c("L18 planner cannot switch roles", !P2.$("#persona"));
  c("L19 planner only sees own institution", !P2.text().includes("Maasoever"));
  c("L20 header shows role chip", P2.d.getElementById("top").textContent.includes("Planner · De Linde"));
  // planner can't open admin tabs
  P2.w.localStorage.setItem("n2c-tab", "beheer");
  const P3 = await boot(A.mock.data, { user: PL });
  c("L21 stale admin tab in storage does not open admin", !P3.text().includes("Toegang en accounts"));

  // zzp request → new profile
  const Z = await boot(A.mock.data, { user: ZZ });
  Z.d.getElementById("g-kind-zzp").checked = true; Z.d.getElementById("g-kind-zzp").dispatchEvent(new Z.w.Event("change", { bubbles: true }));
  await Z.submit('form[data-form="request"]');
  c("L22 zzp'er without function refused", !Z.mock.data.requests?.u_nina, Z.toast());
  Z.set("g-f-VPK", true); await Z.submit('form[data-form="request"]'); await Z.tick(40);
  const A2 = await boot(Z.mock.data, { names: { u_nina: "Nina Zorg", u_piet: "Piet Planner" } }); await A2.tab("beheer"); await A2.tick(40);
  c("L23 unknown zzp'er preselects 'new profile'", A2.d.getElementById("lk-u_nina").value === "newzzp");
  await A2.click('[data-act="link"][data-u="u_nina"]'); await A2.tick(60);
  const zid = A2.mock.data.members?.u_nina?.refId;
  c("L24 new zzp profile created with chosen function", zid && A2.mock.data.zzp[zid]?.funcs?.includes("Verpleegkundige") && A2.mock.data.zzp[zid].name === "Nina Zorg");
  const Z2 = await boot(A2.mock.data, { user: ZZ }); await Z2.tab("open");
  c("L25 linked zzp'er sees matching open shifts", Z2.text().includes("Open diensten") && Z2.$('[data-act="signup"]'));

  // reject flow
  const X = await boot(A2.mock.data, { user: { id: "u_x", name: "Onbekend", owner: false, edit: false } });
  X.d.getElementById("g-kind-zzp").checked = true; X.set("g-f-HLP", true); await X.submit('form[data-form="request"]'); await X.tick(40);
  const A3 = await boot(X.mock.data); await A3.tab("beheer"); await A3.tick(40);
  await A3.click('[data-act="rejectReq"][data-u="u_x"]'); await A3.tick(40);
  const X2 = await boot(A3.mock.data, { user: { id: "u_x", name: "Onbekend" } });
  c("L26 rejected person sees clear message + retry", X2.text().includes("niet goedgekeurd") && X2.$('[data-act="editReq"]'));

  // revoke
  await A3.click('[data-act="askRevoke"][data-u="u_piet"]');
  c("L27 revoke asks for confirmation", A3.text().includes("Toegang intrekken?") && A3.mock.data.members.u_piet);
  await A3.click('[data-act="revoke"][data-u="u_piet"]'); await A3.tick(40);
  const P4 = await boot(A3.mock.data, { user: PL });
  c("L28 revoked planner is back at the login portal", !A3.mock.data.members.u_piet && P4.text().includes("Toegang aanvragen"));

  // signed out / no identity
  const N = await boot(seed(), { user: { id: null, name: "", owner: false, edit: false } });
  c("L29 signed-out visitor told to log in, sees no data", N.text().includes("Log in om verder te gaan") && !N.text().includes("De Linde"));
  const N2 = await boot(seed(), { user: null });
  c("L30 no user capability → login message", N2.text().includes("Log in om verder te gaan"));

  // link deleted institution → gate
  const D = seed(); D.members = { u_piet: { kind: "inst", refId: "i-gone" } };
  const G = await boot(D, { user: PL });
  c("L31 account linked to removed institution falls back to portal", G.text().includes("Toegang aanvragen"));
  // admin preview
  const AP = await boot(seed()); await AP.persona("zzp:z-sanne");
  c("L32 admin preview shows 'Terug naar beheer' banner", AP.text().includes("Terug naar beheer"));
  await AP.click('[data-act="backAdmin"]');
  c("L33 back to admin works", AP.text().includes("Twee kanten"));
  console.log(`${ok}/${all} passed`);
})();
