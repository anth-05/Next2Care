// Builds the client demo (next2care-demo.html) from the working prototype.
// The demo runs without claude.ai login or shared storage: sample data lives in the browser,
// anyone can switch roles, and a guided tour walks through the full flow.
// Usage: node build-demo.js   (from the prototype/ folder)
const fs = require("fs");
const path = require("path");
const SRC = path.join(__dirname, "next2care-planning.html");
const OUT = path.join(__dirname, "next2care-demo.html");
let h = fs.readFileSync(SRC, "utf8");

function rep(from, to, all = false) {
  if (!h.includes(from)) throw new Error("Pattern not found:\n" + from.slice(0, 120));
  h = all ? h.split(from).join(to) : h.replace(from, to);
}

/* ---------- title ---------- */
rep("<title>Next2Care Planning</title>", "<title>Next2Care Planning Demo</title>");

/* ---------- extra CSS ---------- */
rep("</style>", `
/* demo layer */
.demo-bar { background: var(--accent-soft); color: var(--ink); border-bottom: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); font-size: .85rem; }
.demo-bar .wrap { display: flex; align-items: center; gap: 8px 12px; flex-wrap: wrap; padding-block: 8px; }
.demo-bar .tag { font-family: var(--f-mono); font-size: .72rem; letter-spacing: .1em; background: var(--accent); color: var(--accent-ink); border-radius: 4px; padding: 1px 7px; }
.demo-bar .txt { margin-right: auto; min-width: 0; }
.demo-bar .reset-ask { display: inline-flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.tour-fab { position: fixed; right: max(16px, calc(16px + env(safe-area-inset-right, 0px))); bottom: calc(16px + env(safe-area-inset-bottom, 0px)); z-index: 35; box-shadow: var(--shadow); }
.tour { position: fixed; right: max(16px, calc(16px + env(safe-area-inset-right, 0px))); bottom: calc(68px + env(safe-area-inset-bottom, 0px)); z-index: 35; width: min(390px, calc(100vw - 32px)); max-height: min(560px, calc(100vh - 140px)); overflow: auto; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--shadow); display: grid; }
.tour-head { padding: 14px 16px 10px; display: flex; justify-content: space-between; align-items: start; gap: 10px; border-bottom: 1px solid var(--line); }
.tour-head p { margin: 2px 0 0; }
.tour ol { list-style: none; margin: 0; padding: 6px 0; }
.tour li > button { width: 100%; display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 8px; text-align: left; background: none; border: 0; padding: 8px 16px; cursor: pointer; align-items: start; }
.tour li > button:hover { background: var(--sunk); }
.tour li > button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.tour .n { font-family: var(--f-mono); font-size: .8rem; color: var(--muted); padding-top: 1px; }
.tour .who-r { display: block; font-size: .75rem; color: var(--muted); }
.tour li.on > button { background: var(--accent-soft); }
.tour li.on .n { color: var(--accent); font-weight: 600; }
.tour .body { padding: 2px 16px 12px 52px; display: grid; gap: 10px; font-size: .9rem; }
.tour .body p { margin: 0; }
.tour .try { font-size: .85rem; border-left: 3px solid var(--accent); padding-left: 10px; color: var(--ink); }
.tour-foot { padding: 10px 16px 14px; border-top: 1px solid var(--line); font-size: .82rem; color: var(--muted); }
.demo-spot { outline: 3px solid var(--accent) !important; outline-offset: 3px; border-radius: 10px; scroll-margin: 140px; }
@media (prefers-reduced-motion: no-preference) { .demo-spot { animation: spot 1.2s ease-out 2; } @keyframes spot { 0% { outline-offset: 10px; } 100% { outline-offset: 3px; } } }
.csv { font-family: var(--f-mono); font-size: .75rem; background: var(--sunk); border-radius: 8px; padding: 10px; overflow: auto; max-height: 260px; white-space: pre; margin: 0; }
@media (max-width: 640px) { .tour li:not(.on), .tour-head p, .tour-foot { display: none; } .tour .body { padding-left: 16px; } .toast { bottom: calc(72px + env(safe-area-inset-bottom, 0px)); } .tour { bottom: calc(68px + env(safe-area-inset-bottom, 0px)); max-height: calc(100vh - 160px); } }
</style>`);

/* ---------- demo bar + tour containers ---------- */
rep(`<header class="top" id="top"></header>`, `<div class="demo-bar" id="demobar"></div>
<header class="top" id="top"></header>`);
rep(`<div id="toast" class="toast" hidden></div>`, `<div id="toast" class="toast" hidden></div>
<div id="tour"></div>`);

/* ---------- demo data layer (runs before the app) ---------- */
const DEMO_LAYER = fs.readFileSync(path.join(__dirname, "demo-layer.js"), "utf8");
rep("<script>\nconst FUNCS", `<script>\n${DEMO_LAYER}\n</script>\n<script>\nconst FUNCS`);

/* ---------- app: use the demo layer instead of claude.ai ---------- */
rep("window.claude?.use?.(", "window.__demo.use(", true);

/* ---------- app: new-user (login screen) preview ---------- */
rep(`function resolveRole() {
  if (isAdminUser())`, `function resolveRole() {
  if (S.persona === "gate:demo") {
    const gm = S.members[GATE_ID];
    if (gm && (gm.kind === "inst" ? S.inst[gm.refId] : S.zzp[gm.refId])) { S.persona = \`\${gm.kind}:\${gm.refId}\`; S.tab = ""; store.set("n2c-persona", S.persona); }
    else return "gate";
  }
  if (isAdminUser())`);
rep(`function viewGate() {`, `function viewGate() {
  S.myReq = S.requests[GATE_ID] || null;`);
rep("<li><b>01</b><span>Je logt in met je Claude-account.</span></li>", "<li><b>01</b><span>Je maakt een account aan met je e-mailadres.</span></li>");
rep("<span class=\"label\">Welkom${S.me.name ? `, ${esc(S.me.name.split(\" \")[0])}` : \"\"}</span>", "<span class=\"label\">Welkom, ${esc(GATE_NAME.split(\" \")[0])}</span>");
rep(`value="\${esc(r.name || S.me.name || "")}"`, `value="\${esc(r.name || GATE_NAME)}"`);
rep("await S.db.doc(`requests/${S.me.id}`).set(", "await S.db.doc(`requests/${GATE_ID}`).set(");
rep(`\${opt("admin","Next2Care · beheer (jij)",S.persona)}`, `\${opt("admin","Next2Care · beheer",S.persona)}`);
rep(`\${zzpOpts ? \`<optgroup label="Voorbeeld: zzp'ers">\${zzpOpts}</optgroup>\` : ""}</select>`, `\${zzpOpts ? \`<optgroup label="Voorbeeld: zzp'ers">\${zzpOpts}</optgroup>\` : ""}<optgroup label="Voorbeeld: nieuw account">\${opt("gate:demo", \`Nieuwe gebruiker · \${GATE_NAME}\`, S.persona)}</optgroup></select>`);
rep(`const bell = role === "admin" || role === "member" ?`, `const bell = (role === "admin" || role === "member") && p.kind !== "gate" ?`);

/* ---------- app: copy that referred to claude.ai login ---------- */
rep(`Planners en zzp'ers loggen in met hun Claude-account. Deel deze pagina met ze als <b>Bijdrager</b> via Delen; daarna vragen ze hier toegang aan en koppel jij hun account.`,
  `Planners en zzp'ers maken zelf een account aan en vragen toegang aan. Hier koppel jij hun account aan de juiste zorginstelling of het juiste zzp-profiel.`);
rep(`<span class="small muted">(Claude: \${esc(personName(uid, "onbekend"))})</span>`, `<span class="small muted">(account: \${esc(personName(uid, "onbekend"))})</span>`);
rep(`<small>Je logt in met je Claude-account. Wijzigingen zijn direct zichtbaar voor iedereen die is ingelogd; e-mailmeldingen komen in de volgende versie.</small>`,
  `<small>Demoversie met voorbeeldgegevens. Wijzigingen zie je direct terug in alle rollen. In de echte versie log je in met e-mail en wachtwoord en komen er e-mailmeldingen bij.</small>`);
rep(`Je bekijkt de planning zoals <b>\${esc(roleText(S.persona))}</b> hem ziet. Acties doe je echt, namens deze persoon.`,
  `Je bekijkt de planning zoals <b>\${esc(roleText(S.persona))}</b> hem ziet. Alles wat je hier doet, zie je direct terug in de andere rollen.`);

/* ---------- app: CSV export shows a preview (downloads are blocked in the artifact sandbox) ---------- */
rep(`  if (!S.downloads) { toast("Downloaden kan in deze weergave niet. Open de planning op claude.ai."); return; }
  try { await S.downloads.save({ filename: \`next2care-uren-\${S.month}.csv\`, data: csv }); toast("Urenoverzicht opgeslagen."); }
  catch (err) { if (err?.code !== "declined") toast("Opslaan van het bestand lukte niet. Probeer het opnieuw."); }`,
  `  window.__demoCsv = csv.slice(1);
  modalEl.innerHTML = \`<div class="overlay" data-act="close"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="csv-title">
    <div><span class="label">Exporteren</span><h2 id="csv-title">next2care-uren-\${S.month}.csv</h2><p class="muted small" style="margin:4px 0 0">In de echte versie wordt dit bestand gedownload, klaar voor Excel of het boekhoudpakket. \${list.length} regel\${list.length === 1 ? "" : "s"}.</p></div>
    <pre class="csv" id="csv-pre">\${esc(window.__demoCsv)}</pre>
    <div class="row" style="justify-content:end"><button type="button" class="btn" data-act="copyCsv">Kopiëren</button><button type="button" class="btn primary" data-act="close">Sluiten</button></div></div></div>\`;`);
rep(`  else if (a === "export") exportCsv();`, `  else if (a === "export") exportCsv();
  else if (a === "copyCsv") { try { await navigator.clipboard.writeText(window.__demoCsv || ""); toast("Gekopieerd. Plak het in Excel."); } catch { const r = document.createRange(); r.selectNodeContents(document.getElementById("csv-pre")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Selecteer en kopieer de tekst handmatig."); } }`);

/* ---------- app: hook the demo UI into each render ---------- */
rep(`  if (focus) document.getElementById(focus)?.focus();
}`, `  if (focus) document.getElementById(focus)?.focus();
  window.__demoUi?.afterRender();
}`);

/* ---------- demo UI (bar + tour), after the app ---------- */
const DEMO_UI = fs.readFileSync(path.join(__dirname, "demo-ui.js"), "utf8");
h = h.trimEnd() + `\n<script>\n${DEMO_UI}\n</script>\n`;

fs.writeFileSync(OUT, h);
console.log("Wrote", OUT, (h.length / 1024).toFixed(0) + " KB");

/* ---------- standalone site for hosting (Render static site): full HTML document ---------- */
const SITE_DIR = path.join(__dirname, "site");
fs.mkdirSync(SITE_DIR, { recursive: true });
const page = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<style>body { margin: 0; } [hidden] { display: none !important; }</style>
${h}
</html>
`;
fs.writeFileSync(path.join(SITE_DIR, "index.html"), page);
console.log("Wrote", path.join(SITE_DIR, "index.html"));
