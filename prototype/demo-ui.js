/* ===== DEMO UI: demo bar, guided tour, reset ===== */
(function () {
  const STEPS = [
    { persona: "admin", tab: "overzicht", target: ".stats", role: "Next2Care", title: "Alles wat aandacht vraagt, op één scherm",
      text: "Next2Care ziet direct hoeveel diensten nog open staan, welke aanmeldingen beoordeeld moeten worden en hoeveel uren nog bevestigd moeten worden.",
      try: "Kijk naar de diensten die binnen 48 uur nog niet gevuld zijn, en het overzicht per zorginstelling onderaan." },
    { persona: "inst:i-linde", tab: "rooster", target: '[data-act="new"]', role: "Planner · De Linde", title: "De planner zet een dienst open",
      text: "De planner van De Linde ziet alleen het eigen rooster. Een dienst staat er in een paar seconden in, ook meerdere plekken tegelijk. Zzp'ers met de juiste functie krijgen direct een melding.",
      try: "Klik op + Nieuwe dienst. Zet de eindtijd eens op 06:00: het systeem waarschuwt dat de dienst langer dan 12 uur duurt." },
    { persona: "zzp:z-youssef", tab: "open", target: '[data-act="signup"]', role: "Zzp'er · Youssef", title: "De zzp'er meldt zich aan",
      text: "Youssef ziet alleen open diensten die passen bij zijn functie. Diensten die overlappen met zijn rooster, of dagen waarop hij niet kan, worden automatisch afgevangen.",
      try: "Klik bij een dienst op Aanmelden. Kijk ook naar de dienst die overlapt met zijn rooster." },
    { persona: "admin", tab: "overzicht", target: ".review", role: "Next2Care", title: "Next2Care beoordeelt de aanmelding",
      text: "Aanmeldingen komen hier binnen. Een overlap met een andere dienst wordt vooraf gemarkeerd. Na het goedkeuren krijgen de zzp'er en de planner bericht, en krijgen andere kandidaten een nette afwijzing.",
      try: "Keur een aanmelding goed en open daarna Meldingen bij de planner of de zzp'er." },
    { persona: "zzp:z-youssef", tab: "mijn", target: '[data-act="hours"]', role: "Zzp'er · Youssef", title: "Na de dienst: uren invullen",
      text: "Na een gewerkte dienst vult de zzp'er de werkelijke tijden en pauze in. Het systeem rekent de uren uit en controleert op invoerfouten.",
      try: "Klik op Uren invullen en verstuur de uren." },
    { persona: "inst:i-linde", tab: "uren", target: '[data-act="confirmHours"]', role: "Planner · De Linde", title: "De planner bevestigt de uren",
      text: "Afwijkingen ten opzichte van de planning vallen meteen op. Kloppen de uren niet, dan stuurt de planner ze met één klik terug naar de zzp'er.",
      try: "Bevestig de uren, of stuur de uren met afwijking terug." },
    { persona: "admin", tab: "uren", target: '[data-act="export"]', role: "Next2Care", title: "Uren voor de facturatie",
      text: "Per maand staan alle bevestigde uren per zzp'er en per dienst klaar. Met één klik exporteer je ze voor Excel of het boekhoudpakket.",
      try: "Klik op Exporteer CSV." },
    { persona: "gate:demo", tab: "", target: ".gate-form", role: "Nieuwe gebruiker", title: "Een nieuwe gebruiker vraagt toegang aan",
      text: "Zo ziet een nieuwe planner of zzp'er de planning de eerste keer. Hij vraagt toegang aan, en pas na goedkeuring door Next2Care ziet hij gegevens.",
      try: "Kies Planner, kies een zorginstelling en klik op Toegang aanvragen." },
    { persona: "admin", tab: "beheer", target: ".member-row", role: "Next2Care", title: "Next2Care koppelt het account",
      text: "Next2Care koppelt de aanvraag aan de juiste zorginstelling of het juiste zzp-profiel. Daarna opent de planning bij de gebruiker vanzelf. Toegang intrekken kan hier ook.",
      try: "Koppel de aanvraag en kies daarna de nieuwe gebruiker weer bij Bekijk als." },
  ];
  const T = { open: true, step: 0, spotUntil: 0, resetAsk: false };
  try { if (localStorage.getItem("n2c-tour-closed") === "1") T.open = false; } catch {}
  const rm = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function bar() {
    document.getElementById("demobar").innerHTML = `<div class="wrap"><span class="tag">DEMO</span>
      <span class="txt">Voorbeeldgegevens. Klik gerust overal op; er wordt niets echt verstuurd.</span>
      ${T.resetAsk ? `<span class="reset-ask"><span>Alle wijzigingen wissen?</span><button class="btn sm bad" data-act="demoReset">Ja, opnieuw beginnen</button><button class="btn sm" data-act="demoResetNo">Nee</button></span>`
        : `<button class="btn sm" data-act="demoResetAsk">Opnieuw beginnen</button>`}</div>`;
  }
  function tour() {
    const el = document.getElementById("tour");
    const fab = `<button class="btn primary tour-fab" data-act="tourToggle" aria-expanded="${T.open}" aria-controls="tour-panel">${T.open ? "Rondleiding sluiten" : "Rondleiding"}</button>`;
    if (!T.open) { el.innerHTML = fab; return; }
    const s = STEPS[T.step];
    el.innerHTML = `<section class="tour" id="tour-panel" aria-label="Rondleiding">
      <div class="tour-head"><div><span class="label">Rondleiding · stap ${T.step + 1} van ${STEPS.length}</span><h3>Zo werkt Next2Care Planning</h3><p class="small muted">Van open dienst tot factuur, in elke rol.</p></div></div>
      <ol>${STEPS.map((x, i) => `<li class="${i === T.step ? "on" : ""}"><button data-act="tourGo" data-i="${i}" aria-current="${i === T.step ? "step" : "false"}"><span class="n">${String(i + 1).padStart(2, "0")}</span><span><b>${x.title}</b><span class="who-r">${x.role}</span></span></button>
        ${i === T.step ? `<div class="body"><p>${s.text}</p><p class="try"><b>Probeer:</b> ${s.try}</p>
          <div class="row"><button class="btn sm" data-act="tourGo" data-i="${i - 1}"${i === 0 ? " disabled" : ""}>← Vorige</button>${i < STEPS.length - 1 ? `<button class="btn sm primary" data-act="tourGo" data-i="${i + 1}">Volgende →</button>` : `<button class="btn sm primary" data-act="tourToggle">Afronden</button>`}</div></div>` : ""}</li>`).join("")}</ol>
      <div class="tour-foot">Tip: open de demo in een tweede venster en kies daar een andere rol bij <b>Bekijk als</b>. Wat je in het ene venster doet, verschijnt direct in het andere.</div>
    </section>${fab}`;
  }
  function spot() {
    document.querySelectorAll(".demo-spot").forEach(e => e.classList.remove("demo-spot"));
    if (!T.open || Date.now() > T.spotUntil) return null;
    const t = document.querySelector(STEPS[T.step].target);
    if (t) t.classList.add("demo-spot");
    return t;
  }
  function go(i) {
    if (i < 0 || i >= STEPS.length) return;
    const s = STEPS[i];
    T.step = i; T.open = true; T.spotUntil = Date.now() + 8000;
    closeModal();
    S.persona = s.persona; store.set("n2c-persona", s.persona);
    S.tab = s.tab; store.set("n2c-tab", s.tab);
    S.bellOpen = false; S.week = mondayOf(TODAY); S.month = TODAY.slice(0, 7); S.filter = { inst: "", status: "" };
    render(); tour();
    const t = spot();
    if (t) t.scrollIntoView({ block: "center", behavior: rm() ? "auto" : "smooth" });
    else window.scrollTo(0, 0);
  }

  document.addEventListener("click", async e => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const a = el.dataset.act;
    if (a === "tourToggle") { T.open = !T.open; try { localStorage.setItem("n2c-tour-closed", T.open ? "0" : "1"); } catch {} tour(); spot(); }
    else if (a === "tourGo") go(Number(el.dataset.i));
    else if (a === "demoResetAsk") { T.resetAsk = true; bar(); }
    else if (a === "demoResetNo") { T.resetAsk = false; bar(); }
    else if (a === "demoReset") {
      T.resetAsk = false; T.step = 0; T.open = true;
      window.__demo.reset();
      S.seen = new Set(); S.firstNotifs = true; S.confirmRevoke = null; S.editReq = false;
      bar(); go(0); toast("De voorbeeldgegevens staan weer klaar.");
    }
  });

  window.__demoUi = { afterRender: spot };
  bar(); tour();
})();
