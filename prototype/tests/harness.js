// Headless test harness: loads the page with a mock `db` + `downloads` and drives it like a user.
const fs = require("fs");
const { JSDOM } = require("jsdom");
const PAGE = process.argv[2];
const html = fs.readFileSync(PAGE, "utf8");

function makeDb(seed, opts = {}) {
  const data = {}; // collection -> {id: doc}
  const subs = [];
  for (const [c, docs] of Object.entries(seed)) data[c] = JSON.parse(JSON.stringify(docs));
  let n = 0;
  const merge = (a, b) => { for (const [k, v] of Object.entries(b)) { if (v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) merge(a[k], v); else a[k] = JSON.parse(JSON.stringify(v)); } return a; };
  const snap = (c, q) => {
    let docs = Object.entries(data[c] || {}).map(([id, d]) => ({ id, exists: true, data: () => d, metadata: { fromCache: false } }));
    if (q.order) docs.sort((x, y) => (x.data()[q.order[0]] > y.data()[q.order[0]] ? 1 : -1) * (q.order[1] === "desc" ? -1 : 1));
    if (q.lim) docs = docs.slice(0, q.lim);
    return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false, hasPendingWrites: false }, docChanges: () => [] };
  };
  const fire = c => subs.filter(s => s.c === c).forEach(s => s.next(snap(c, s.q)));
  const writes = { count: 0 };
  const guard = async () => { writes.count++; if (opts.denyWrites) { const e = new Error("denied"); e.code = "invalid_argument"; throw e; } };
  const query = (c, q = {}) => ({
    orderBy: (f, d) => query(c, { ...q, order: [f, d || "asc"] }),
    limit: l => query(c, { ...q, lim: l }),
    where: () => query(c, q),
    onSnapshot: (next, err) => { const s = { c, q, next }; subs.push(s); setTimeout(() => next(snap(c, q)), 0); return () => {}; },
    add: async d => { await guard(); const id = `new${++n}`; (data[c] ||= {})[id] = JSON.parse(JSON.stringify(d)); setTimeout(() => fire(c), 0); return { id }; },
    doc: id => ref(`${c}/${id}`),
  });
  const ref = path => { const [c, id] = path.split("/"); return {
    id, path,
    get: async () => ({ id, exists: !!data[c]?.[id], data: () => data[c]?.[id] }),
    set: async d => { await guard(); (data[c] ||= {})[id] = JSON.parse(JSON.stringify(d)); setTimeout(() => fire(c), 0); },
    update: async d => { await guard(); if (!data[c]?.[id]) { const e = new Error("missing"); e.code = "invalid_argument"; throw e; } merge(data[c][id], d); setTimeout(() => fire(c), 0); },
    delete: async () => { await guard(); if (data[c]) delete data[c][id]; setTimeout(() => fire(c), 0); },
    onSnapshot: (next) => { const s = { c, q: {}, next: () => next({ id, exists: !!data[c]?.[id], data: () => data[c]?.[id], metadata: { fromCache: false } }) }; subs.push(s); setTimeout(() => s.next(), 0); return () => {}; },
  }; };
  return { db: { collection: c => query(c), doc: ref }, data, writes };
}

async function boot(seed, opts = {}) {
  const mock = makeDb(seed, opts);
  const saved = [];
  const dom = new JSDOM(html, {
    url: "https://example.test/", runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(win) {
      const u = opts.user === null ? null : (opts.user || { id: "u_owner", name: "Anthony", owner: true, edit: true });
      const userNs = u ? { me: async () => ({ id: u.id, name: u.name || "", isOwner: !!u.owner, canEdit: !!u.edit }), profiles: async ids => Object.fromEntries((Array.isArray(ids) ? ids : [ids]).map(i => [i, { id: i, name: (opts.names || {})[i] || "" }])) } : null;
      win.claude = { use: async name => name === "db" ? (opts.noDb ? null : mock.db) : name === "downloads" ? { save: async f => { saved.push(f); return { status: "saved" }; } } : name === "user" ? userNs : null };
      win.scrollTo = () => {};
      try { win.localStorage.clear(); } catch {}
      if (opts.persona) win.localStorage.setItem("n2c-persona", opts.persona);
    },
  });
  const w = dom.window, d = w.document;
  const tick = (ms = 20) => new Promise(r => setTimeout(r, ms));
  await tick(60);
  const $ = s => d.querySelector(s), $$ = s => [...d.querySelectorAll(s)];
  const api = {
    w, d, mock, saved, tick, $, $$,
    text: () => d.getElementById("app").textContent.replace(/\s+/g, " "),
    toast: () => { const t = d.getElementById("toast"); return t.hidden ? "" : t.textContent; },
    async click(sel) { const el = typeof sel === "string" ? $(sel) : sel; if (!el) throw new Error("not found: " + sel); el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); await tick(); },
    async persona(v) { const s = d.getElementById("persona"); s.value = v; s.dispatchEvent(new w.Event("change", { bubbles: true })); await tick(); },
    async tab(t) { await api.click(`[data-act="tab"][data-tab="${t}"]`); },
    set(id, v) { const el = d.getElementById(id); if (!el) throw new Error("no field " + id); if (el.type === "checkbox") el.checked = v; else el.value = v; el.dispatchEvent(new w.Event("input", { bubbles: true })); el.dispatchEvent(new w.Event("change", { bubbles: true })); },
    async submit(sel) { const f = $(sel); f.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await tick(40); },
    shifts: () => mock.data.shifts, notifs: () => Object.values(mock.data.notifs || {}),
  };
  return api;
}
module.exports = { boot };
