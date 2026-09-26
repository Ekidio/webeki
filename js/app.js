/* =========================================================================
   WEBEKI – szerkesztő logika
   ========================================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => 'b' + Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const getPath = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
const setPath = (o, p, v) => { const ks = p.split('.'), last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };

// kiadáskor az index.html ?v= jeleit is emeld (böngésző gyorsítótár)
const VERSION = '1.1';
const LS_KEY = 'webeki.project.v1';
const FONTS = {
  'Inter': '400;500;600;700;800', 'Poppins': '400;500;600;700;800', 'Montserrat': '400;500;600;700;800', 'Roboto': '400;500;700;900',
  'Open Sans': '400;500;600;700;800', 'Lato': '400;700;900', 'Raleway': '400;500;600;700;800', 'Nunito': '400;600;700;800',
  'DM Sans': '400;500;700', 'Space Grotesk': '400;500;600;700', 'Playfair Display': '400;600;700;800', 'Merriweather': '400;700;900',
};
/* az oldal 3 alapszíne (Oldal beállítások → Színek) */
const PAGE_COLORS = [
  { k: 'primary', l: 'Fő szín', d: 'gombok, kiemelések' },
  { k: 'text', l: 'Szöveg', d: 'betűk színe' },
  { k: 'bg', l: 'Háttér', d: 'az oldal alapja' },
  { k: 'btn', l: 'Gomb', d: 'üresen: fő szín', auto: 'primary' },
];
const DEFAULT_PAGE = { title: 'Az én weboldalam', desc: '', font: 'Inter', headFont: '', primary: '#6d4aff', text: '#1f2433', bg: '#ffffff', radius: 10, btn: '', btnStyle: 'solid', btnShape: 'theme', btnSize: 'md', btnUpper: false };
const BTN_FIELDS = [
  { k: 'btnStyle', t: 'select', l: 'Stílus', o: [['solid', 'Teli'], ['outline', 'Körvonalas'], ['soft', 'Halvány'], ['shadow', 'Árnyékos'], ['gradient', 'Színátmenetes']] },
  { k: 'btnShape', t: 'select', l: 'Forma', o: [['theme', 'Az oldal lekerekítése szerint'], ['square', 'Szögletes'], ['round', 'Enyhén lekerekített'], ['pill', 'Kapszula (teljesen kerek)']] },
  { k: 'btnSize', t: 'select', l: 'Méret', o: [['sm', 'Kicsi'], ['md', 'Közepes'], ['lg', 'Nagy']] },
  { k: 'btnUpper', t: 'check', l: 'Nagybetűs felirat' },
];
const BTN_SIZE = { sm: [10, 20, 15], md: [14, 28, 16], lg: [18, 36, 18] };
const BTN_R = { square: '0px', round: '8px', pill: '999px' };
const pageCls = pg => `bs-${pg.btnStyle || 'solid'}${pg.btnUpper ? ' bs-upper' : ''}`;
const PAGE_FIELDS = [
  { k: 'title', t: 'text', l: 'Oldal címe', hint: 'a böngésző fülön és a Google találatban' },
  { k: 'desc', t: 'textarea', l: 'Leírás (SEO)', hint: 'rövid összefoglaló a keresőknek' },
  { k: 'font', t: 'select', l: 'Betűtípus – szöveg', o: Object.keys(FONTS) },
  { k: 'headFont', t: 'select', l: 'Betűtípus – címsorok', o: [['', '(ugyanaz)'], ...Object.keys(FONTS)] },
  { k: 'radius', t: 'range', l: 'Lekerekítés (sarkok)', min: 0, max: 30, unit: 'px', hint: 'gombok és űrlapmezők pontosan ennyi; kártyák, képek, videó arányosan nagyobb (×1,4–2); 0 = szögletes' },
];

/* ---------------- nézetek (desktop / tablet / mobil) ----------------
   b.p        = közös értékek (minden nézet)
   b.r[dev]   = csak az adott nézetben eltérő értékek (felső szintű mezőnként)
   scope      = 'all' → a módosítás minden nézetre megy, 'only' → csak az aktuálisra */
const DEVS = ['desktop', 'tablet', 'mobile'];
const DEV_N = { desktop: 'Asztali', tablet: 'Tablet', mobile: 'Mobil' };
const DEV_S = { desktop: 'D', tablet: 'T', mobile: 'M' };
let scope = 'all';
const fieldOf = (type, k) => BLOCKS[type].fields.find(f => f.k === k) || COMMON_FIELDS.find(f => f.k === k);
const isLook = f => !!f && (!!f.a || ['select', 'range', 'color'].includes(f.t));   // megjelenés mező?
const curDev = () => $('#stage').dataset.dev;
const ovOf = (b, dev) => (b.r && b.r[dev]) || {};
const ovCount = (b, dev) => Object.keys(ovOf(b, dev)).length;
function eff(b, dev = curDev()) { const o = ovOf(b, dev); return { ...b.p, ...o, _ov: o }; }
function writeVal(b, path, v) {
  const dev = curDev(), top = path.split('.')[0];
  const cur = clone(eff(b, dev)[top]);                     // amit most ebben a nézetben látsz
  const nv = top === path ? v : (setPath({ [top]: cur }, path, v), cur);
  b.r ||= {};
  if (scope === 'all' || !isLook(fieldOf(b.type, top))) { // tartalom mindig közös; megjelenés "Minden nézet" módban
    b.p[top] = nv;
    DEVS.forEach(d => { if (b.r[d]) delete b.r[d][top]; });
  } else {                                                 // → csak ebben a nézetben
    (b.r[dev] ||= {})[top] = nv;                           // akkor is rögzül, ha épp egyezik (pl. oszlopszám rögzítése)
  }
  DEVS.forEach(d => { if (b.r[d] && !Object.keys(b.r[d]).length) delete b.r[d]; });
}

/* ---------------- horgonyok (#rolunk) ----------------
   A blokk ID-ja: ékezet, szóköz, # nélkül ("rolunk"); a link: "#rolunk". */
const isLinkKey = k => k === 'href' || /Href$/.test(k);
function anchorId(s, live) {
  const r = String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/^[#\s]+/, '').replace(/[^a-z0-9_-]+/g, '-').replace(/-{2,}/g, '-');
  return live ? r.replace(/^-+/, '') : r.replace(/^-+|-+$/g, '');   // gépelés közben a végén hagyjuk a kötőjelet
}
const fixHref = (v, live) => /^\s*#/.test(v || '') ? '#' + anchorId(v, live) : v;
function fixLinks(p) {
  for (const [k, v] of Object.entries(p)) {
    if (k === '_id') p[k] = anchorId(v);
    else if (isLinkKey(k) && typeof v === 'string') p[k] = fixHref(v);
    else if (Array.isArray(v)) v.forEach(it => it && typeof it === 'object' && fixLinks(it));
  }
  return p;
}
function uniqueAnchor(v, bid) {
  if (!v) return v;
  let n = v, i = 2;
  while (S.blocks.some(x => x.id !== bid && x.p._id === n)) n = `${v}-${i++}`;
  return n;
}
function idWarn(v, bid) {
  const o = v && S.blocks.find(x => x.id !== bid && x.p._id === v);
  return o ? `⚠ Ez az ID már a(z) „${BLOCKS[o.type].name}” blokknál is szerepel – a link oda fog ugrani. Adj meg egyedit!` : '';
}
function linkWarn(v) {
  if (!/^#./.test(v || '')) return '';
  return S.blocks.some(x => x.p._id === v.slice(1)) ? '' : `⚠ Nincs ilyen ID az oldalon: ${v}`;
}
const anchorList = () => `<datalist id="anchorList">${S.blocks.filter(x => x.p._id).map(x => `<option value="#${esc(x.p._id)}">${esc(BLOCKS[x.type].name)}</option>`).join('')}</datalist>`;

/* ---------------- állapot ---------------- */
function newBlock(type, over = {}) {
  return { id: uid(), type, p: { ...COMMON_DEFAULTS, ...clone(BLOCKS[type].defaults), ...over } };
}
function fromTemplate(key) {
  return { page: { ...DEFAULT_PAGE }, blocks: TEMPLATES[key].blocks.map(x => Array.isArray(x) ? newBlock(x[0], x[1]) : newBlock(x)) };
}
function migrate(b) {
  const p = b.p || {};
  if (b.type === 'hero') {
    if ('img' in p && !('_bgType' in p)) Object.assign(p, { _bgType: 'image', _bgImg: p.img, _bgOv: p.overlay ?? 55 });
    delete p.img; delete p.overlay;
  }
  return b;
}
function normalize(s) {
  s.page = { ...DEFAULT_PAGE, ...(s.page || {}) };
  s.blocks = (s.blocks || []).filter(b => BLOCKS[b.type]).map(migrate)
    .map(b => ({ id: b.id || uid(), type: b.type, p: fixLinks({ ...COMMON_DEFAULTS, ...clone(BLOCKS[b.type].defaults), ...b.p }), ...(b.r ? { r: cleanOv(b) } : {}) }));
  return s;
}
function cleanOv(b) {
  const r = {};
  DEVS.forEach(d => { const o = {}; Object.entries((b.r || {})[d] || {}).forEach(([k, v]) => { if (isLook(fieldOf(b.type, k))) o[k] = v; }); if (Object.keys(o).length) r[d] = o; });
  return r;
}
function load() { try { const s = JSON.parse(localStorage.getItem(LS_KEY)); if (s && s.blocks) return normalize(s); } catch (e) { } return null; }

let S = load() || fromTemplate('landing');
let sel = null;
const openItems = new Set();
const getB = id => S.blocks.find(b => b.id === id);
const idxOf = id => S.blocks.findIndex(b => b.id === id);

let saveT;
function save() {
  setStatus('Mentés…');
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); setStatus('Mentve'); }
    catch (e) { setStatus('Nincs mentve!'); toast('A böngésző tárhelye megtelt (túl sok feltöltött kép?). Mentsd a projektet fájlba!', 'err'); }
  }, 350);
}
const setStatus = t => $('#status').textContent = t;

/* ---------------- visszavonás ---------------- */
let hist = [], fut = [], lastKey = null, lastT = 0;
function snap(key) {
  const now = Date.now();
  if (key && key === lastKey && now - lastT < 1200) { lastT = now; return; }
  hist.push(JSON.stringify(S)); if (hist.length > 150) hist.shift();
  fut = []; lastKey = key || null; lastT = now; updUndo();
}
function undo() { if (!hist.length) return; fut.push(JSON.stringify(S)); S = JSON.parse(hist.pop()); lastKey = null; refreshAll(); }
function redo() { if (!fut.length) return; hist.push(JSON.stringify(S)); S = JSON.parse(fut.pop()); lastKey = null; refreshAll(); }
function updUndo() { $('#btnUndo').disabled = !hist.length; $('#btnRedo').disabled = !fut.length; }
function refreshAll() { if (sel && !getB(sel)) sel = null; applyPage(); renderCanvas(); renderInspector(); save(); updUndo(); }

/* ---------------- oldal téma ---------------- */
function fontsUrl(pg) {
  const fs = [...new Set([pg.font, pg.headFont].filter(f => FONTS[f]))];
  return fs.length ? `https://fonts.googleapis.com/css2?${fs.map(f => `family=${f.replace(/ /g, '+')}:wght@${FONTS[f]}`).join('&')}&display=swap` : '';
}
/* szín világossága (WCAG) → a fő színen fehér vagy sötét szöveg legyen */
function lum(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 0;
  return [0, 2, 4].map(i => parseInt(m[1].substr(i, 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
    .reduce((a, c, i) => a + c * [.2126, .7152, .0722][i], 0);
}
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const onColor = hex => contrast(hex, '#ffffff') >= contrast(hex, '#14161c') ? '#ffffff' : '#14161c';
function pageVars(pg) {
  const [py, px, fs] = BTN_SIZE[pg.btnSize] || BTN_SIZE.md;
  return `${pg.btn ? `--wk-btn:${pg.btn};--wk-onb:${onColor(pg.btn)};` : ''}--wk-btn-py:${py}px;--wk-btn-px:${px}px;--wk-btn-fs:${fs}px;${BTN_R[pg.btnShape] ? `--wk-btn-r:${BTN_R[pg.btnShape]};` : ''}--wk-onp:${onColor(pg.primary)};--wk-primary:${pg.primary};--wk-text:${pg.text};--wk-bg:${pg.bg};--wk-radius:${pg.radius}px;--wk-font:'${pg.font}',system-ui,sans-serif;` + (pg.headFont ? `--wk-head:'${pg.headFont}',system-ui,sans-serif;` : '');
}
function applyPage() {
  const page = $('#page');
  page.style.cssText = pageVars(S.page); page.className = 'wk-page ' + pageCls(S.page); fitZoom();
  const u = fontsUrl(S.page); if ($('#pageFont').getAttribute('href') !== u) $('#pageFont').href = u;
}

/* ---------------- szomszédok és háttér csoportok ---------------- */
/* a menüsor sosem lehet háttér-csoport tagja (különben a sticky csak a csoporton belül működne) */
const linked = i => i > 0 && !!S.blocks[i]?.p._bgLink && S.blocks[i].type !== 'navbar' && S.blocks[i - 1].type !== 'navbar';
const groupsOf = () => S.blocks.reduce((g, b, i) => { if (linked(i) && g.length) g[g.length - 1].push(b); else g.push([b]); return g; }, []);
const leaderIdx = i => { while (linked(i)) i--; return i; };
const inGroup = b => { const i = idxOf(b.id); return linked(i) || linked(i + 1); };
function ctxOf(i, dev) {
  const vis = j => S.blocks[j] && !eff(S.blocks[j], dev)._hide;
  let a = i - 1; while (a >= 0 && !vis(a)) a--;
  let z = i + 1; while (z < S.blocks.length && !vis(z)) z++;
  const col = j => { if (j < 0 || j >= S.blocks.length) return 'var(--wk-bg)'; const L = S.blocks[leaderIdx(j)]; return bgColorOf(eff(L, dev), L.type); };
  return { prevC: col(a), nextC: col(z), linkPrev: linked(i), linkNext: linked(i + 1) };
}

/* ---------------- vászon ---------------- */
const page = $('#page');
function wrap(b) {
  const d = BLOCKS[b.type], dev = curDev(), e = eff(b, dev), n = ovCount(b, dev);
  const others = DEVS.filter(x => x !== dev && ovCount(b, x)).map(x => DEV_S[x]).join('');
  return `<div class="ed-block${b.id === sel ? ' sel' : ''}${e._hide ? ' ed-hidden' : ''}" data-id="${b.id}"${e._hide ? ` data-hid="Rejtve – ${DEV_N[dev]} nézetben"` : ''}><div class="ed-tools"><span class="ed-name">${esc(d.name)}</span>${n ? `<span class="ed-ov" title="${n} beállítás csak ${DEV_N[dev]} nézetben tér el">📌 ${n}</span>` : ''}${others ? `<span class="ed-ov2" title="Más nézetekben eltér: ${others}">${others}</span>` : ''}${b.p._bgLink && idxOf(b.id) > 0 ? '<span class="ed-ov2" title="Folytatja az előző blokk hátterét">⛓</span>' : ''}<button data-act="drag" draggable="true" title="Húzd az áthelyezéshez">⠿</button><button data-act="up" title="Fel">↑</button><button data-act="down" title="Le">↓</button><button data-act="dup" title="Duplikálás (Ctrl+D)">⧉</button><button data-act="del" title="Törlés (Del)">✕</button></div>${renderBlock({ ...b, p: e }, true, '', ctxOf(idxOf(b.id), dev))}</div>`;
}
function renderCanvas() {
  const dev = curDev();
  page.innerHTML = S.blocks.length ? groupsOf().map(g => g.length > 1
    ? `<div class="wk-bgg" style="${esc(groupStyle(eff(g[0], dev), g[0].type))}">${g.map(wrap).join('')}</div>` : wrap(g[0])).join('')
    : `<div class="ed-empty"><div><b>Az oldal üres</b>Húzz ide egy blokkot a bal oldali könyvtárból,<br>vagy kattints egy blokkra a hozzáadáshoz.</div></div>`;
}
function refreshBlock(id) {
  const el = page.querySelector(`.ed-block[data-id="${id}"]`), b = getB(id);
  if (el && b) el.outerHTML = wrap(b);
}
function select(id, scroll) {
  sel = id;
  $$('.ed-block', page).forEach(el => el.classList.toggle('sel', el.dataset.id === id));
  renderInspector();
  if (id && scroll) page.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------------- blokk műveletek ---------------- */
function addBlock(type, index) {
  snap();
  const b = newBlock(type);
  b.p._id = uniqueAnchor(b.p._id, b.id);
  if (index == null) { const i = idxOf(sel); index = i < 0 ? S.blocks.length : i + 1; }
  S.blocks.splice(index, 0, b);
  sel = b.id; renderCanvas(); renderInspector(); save();
  requestAnimationFrame(() => page.querySelector(`[data-id="${b.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
}
function moveBlock(id, to) {
  const from = idxOf(id); if (from < 0 || to < 0 || to >= S.blocks.length || to === from) return;
  snap(); const [b] = S.blocks.splice(from, 1); S.blocks.splice(to, 0, b);
  renderCanvas(); save();
}
function dupBlock(id) {
  const i = idxOf(id); if (i < 0) return;
  snap(); const c = clone(S.blocks[i]); c.id = uid(); if (c.p._id) c.p._id = '';
  S.blocks.splice(i + 1, 0, c); sel = c.id; renderCanvas(); renderInspector(); save();
}
function delBlock(id) {
  const i = idxOf(id); if (i < 0) return;
  snap(); S.blocks.splice(i, 1);
  if (sel === id) sel = null;
  renderCanvas(); renderInspector(); save();
  toast(`Blokk törölve – <a href="#" onclick="undo();return false" style="color:#9d86ff">Visszavonás</a>`);
}

/* vászon események */
page.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (link) {
    e.preventDefault();                                         // szerkesztés közben a link nem ugrik el…
    if (e.metaKey || e.ctrlKey) { followLink(link.getAttribute('href')); return; }   // …csak Ctrl/⌘ + kattintásra
  }
  const act = e.target.closest('.ed-tools button');
  const blk = e.target.closest('.ed-block');
  if (!blk) return;
  const id = blk.dataset.id;
  if (act) {
    const a = act.dataset.act;
    if (a === 'up') moveBlock(id, idxOf(id) - 1);
    else if (a === 'down') moveBlock(id, idxOf(id) + 1);
    else if (a === 'dup') dupBlock(id);
    else if (a === 'del') delBlock(id);
    else if (sel !== id) select(id);
    return;
  }
  if (sel !== id) select(id);
});
page.addEventListener('submit', e => e.preventDefault());
function followLink(h) {
  if (!h || h === '#') return toast('Ennek a linknek még nincs célja.');
  if (h[0] !== '#') return window.open(h, '_blank', 'noopener');
  const t = page.querySelector(`[id="${CSS.escape(h.slice(1))}"]`);
  if (!t) return toast(`Nincs ilyen ID az oldalon: <b>${esc(h)}</b>`, 'err');
  t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const blk = t.closest('.ed-block'); if (blk) { blk.classList.add('ed-flash'); setTimeout(() => blk.classList.remove('ed-flash'), 1200); }
}

/* inline szerkesztés (kattints a szövegre és írd át) */
let editSnap = null;
page.addEventListener('focusin', e => {
  const el = e.target.closest('[data-edit]'); if (!el) return;
  editSnap = JSON.stringify(S);
  const id = el.closest('.ed-block').dataset.id; if (sel !== id) select(id);
});
page.addEventListener('input', e => {
  const el = e.target.closest('[data-edit]'); if (!el) return;
  const b = getB(el.closest('.ed-block').dataset.id);
  let v = el.innerText.replace(/\n$/, '');
  if (!el.dataset.ml) v = v.replace(/\n/g, ' ');
  writeVal(b, el.dataset.edit, v); save();
});
page.addEventListener('focusout', e => {
  const el = e.target.closest('[data-edit]'); if (!el || !editSnap) return;
  if (editSnap !== JSON.stringify(S)) { hist.push(editSnap); fut = []; lastKey = null; updUndo(); renderInspector(); updBadges(); }
  editSnap = null;
});
page.addEventListener('keydown', e => {
  const el = e.target.closest('[data-edit]'); if (!el) return;
  if (e.key === 'Enter' && !el.dataset.ml) { e.preventDefault(); el.blur(); }
  if (e.key === 'Escape') el.blur();
  if (e.key === ' ' && el.closest('summary')) e.preventDefault();
});

/* ---------------- drag & drop ---------------- */
let dragType = null, dragId = null, dropIdx = -1;
const dropLine = $('#dropLine');
function calcDrop(y) {
  const els = $$('.ed-block', page), pr = page.getBoundingClientRect();
  let i = els.findIndex(el => { const r = el.getBoundingClientRect(); return y < r.top + r.height / 2; });
  if (i < 0) i = els.length;
  let top;
  if (!els.length) top = pr.top + 30;
  else if (i < els.length) top = els[i].getBoundingClientRect().top;
  else top = els[els.length - 1].getBoundingClientRect().bottom;
  const st = $('#stage').getBoundingClientRect();
  top = Math.max(st.top + 4, Math.min(st.bottom - 4, top));
  Object.assign(dropLine.style, { display: 'block', left: pr.left + 'px', width: pr.width + 'px', top: top + 'px' });
  return i;
}
function endDrag() { dragType = dragId = null; dropIdx = -1; dropLine.style.display = 'none'; }
$('#stage').addEventListener('dragover', e => {
  if (!dragType && !dragId) return;
  e.preventDefault(); e.dataTransfer.dropEffect = dragType ? 'copy' : 'move';
  dropIdx = calcDrop(e.clientY);
  const st = $('#stage'), r = st.getBoundingClientRect();   // automatikus görgetés a széleken
  if (e.clientY < r.top + 60) st.scrollTop -= 14; else if (e.clientY > r.bottom - 60) st.scrollTop += 14;
});
$('#stage').addEventListener('dragleave', e => { if (!e.relatedTarget || !$('#stage').contains(e.relatedTarget)) dropLine.style.display = 'none'; });
$('#stage').addEventListener('drop', e => {
  e.preventDefault();
  const i = dropIdx >= 0 ? dropIdx : S.blocks.length;
  if (dragType) addBlock(dragType, i);
  else if (dragId) { const from = idxOf(dragId); moveBlock(dragId, i > from ? i - 1 : i); }
  endDrag();
});
document.addEventListener('dragend', endDrag);
page.addEventListener('dragstart', e => {
  const h = e.target.closest?.('[data-act=drag]');
  if (!h) return;
  dragId = h.closest('.ed-block').dataset.id;
  e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId);
  const blk = h.closest('.ed-block'); e.dataTransfer.setDragImage(blk, 40, 20);
});

/* ---------------- blokk könyvtár ---------------- */
function renderLib(q = '') {
  q = q.trim().toLowerCase();
  const cats = {};
  Object.entries(BLOCKS).forEach(([k, d]) => {
    if (q && !(d.name + ' ' + d.desc).toLowerCase().includes(q)) return;
    (cats[d.cat] ||= []).push(`<div class="lib-item" draggable="true" data-type="${k}" title="Húzd az oldalra vagy kattints"><div class="lib-ico">${esc(d.icon)}</div><div><b>${esc(d.name)}</b><small>${esc(d.desc)}</small></div></div>`);
  });
  $('#libList').innerHTML = Object.entries(cats).map(([c, items]) => `<div class="lib-cat">${c}</div>${items.join('')}`).join('') || '<div class="lib-cat">Nincs találat</div>';
}
$('#libSearch').addEventListener('input', e => renderLib(e.target.value));
$('#libList').addEventListener('dragstart', e => {
  const it = e.target.closest('.lib-item'); if (!it) return;
  dragType = it.dataset.type; e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', dragType);
});
$('#libList').addEventListener('click', e => { const it = e.target.closest('.lib-item'); if (it) addBlock(it.dataset.type); });

/* ---------------- tulajdonságok panel ---------------- */
const insp = $('#insp');
const opt = o => Array.isArray(o) ? o : [o, o];

function fieldHTML(f, v, path, mark = '') {
  const id = 'f_' + String(path || '').replace(/\./g, '_');
  const lab = `<label class="f-l" for="${id}">${esc(f.l)}${mark}${f.hint ? `<small>${esc(f.hint)}</small>` : ''}</label>`;
  switch (f.t) {
    case 'text': {
      const k = path.split('.').pop(), isL = isLinkKey(k), isI = k === '_id';
      const w = isI ? idWarn(v, sel) : isL ? linkWarn(v) : '';
      return `<div class="f">${lab}<input id="${id}" type="text" data-path="${path}" value="${esc(v)}"${isL ? ' list="anchorList" placeholder="#horgony vagy https://…"' : ''}${isI ? ' placeholder="pl. rolunk"' : ''}>${isL || isI ? `<small class="f-warn">${esc(w)}</small>` : ''}</div>`;
    }
    case 'textarea': case 'html':
      return `<div class="f">${lab}<textarea id="${id}" data-path="${path}" rows="${f.rows || (f.t === 'html' ? 8 : 3)}"${f.t === 'html' ? ' class="code" spellcheck="false"' : ''}>${esc(v)}</textarea></div>`;
    case 'range':
      return `<div class="f">${lab}<div class="f-range"><input id="${id}" type="range" min="${f.min}" max="${f.max}" step="${f.step || 1}" data-path="${path}" data-unit="${f.unit || ''}" value="${v}"><output>${v}${f.unit || ''}</output></div></div>`;
    case 'select':
      return `<div class="f">${lab}<select id="${id}" data-path="${path}">${f.o.map(o => { const [val, l] = opt(o); return `<option value="${esc(val)}"${String(v) === String(val) ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select></div>`;
    case 'check':
      return `<div class="f f-check"><label><input type="checkbox" data-path="${path}"${v ? ' checked' : ''}> ${esc(f.l)}</label>${mark}${f.hint ? `<small class="f-hint">${esc(f.hint)}</small>` : ''}</div>`;
    case 'color': {
      const hex = /^#[0-9a-f]{6}$/i.test(v) ? v : '#ffffff';
      return `<div class="f">${lab}<div class="f-color${v ? '' : ' auto'}"><input type="color" data-path="${path}" data-kind="cpick" value="${hex}"><input id="${id}" type="text" data-path="${path}" data-kind="ctext" value="${esc(v)}" placeholder="${f.ph || 'téma szerint'}"><button type="button" data-cclear="${path}" title="Téma szerinti (alapértelmezett)">↺</button></div></div>`;
    }
    case 'image':
      return `<div class="f">${lab}<div class="f-img"><div class="thumb" style="background-image:url(&quot;${esc(v)}&quot;)"></div><div class="f-img-r"><input id="${id}" type="text" data-path="${path}" value="${esc(String(v).startsWith('data:') ? '(feltöltött kép)' : v)}" placeholder="Kép URL (https://…)"><label class="btn-s">Kép feltöltése…<input type="file" accept="image/*" data-upload="${path}" hidden></label></div></div></div>`;
    case 'icon':
      return `<div class="f">${lab}<div class="f-icon"><button type="button" class="ico-prev" data-pick="${path}" title="Ikon választása">${v ? icoHTML(v) : '＋'}</button><input id="${id}" type="text" data-path="${path}" value="${esc(v)}" placeholder="írj be egy emojit, vagy válassz"><button type="button" class="btn-s" data-pick="${path}">Választás…</button></div></div>`;
    case 'note':
      return `<div class="f-note">${esc(f.l)}${f.btn ? `<button type="button" class="btn-s" data-act2="${f.act}">${esc(f.btn)}</button>` : ''}</div>`;
    case 'head':
      return `<div class="sub-h">${esc(f.l)}${f.play ? '<button type="button" class="btn-s" data-play title="Animáció kipróbálása">▶ Lejátszás</button>' : ''}</div>`;
    case 'list':
      return `<div class="f f-list">${lab}${(v || []).map((it, i) => listItemHTML(f, it, i, path)).join('')}<button type="button" class="btn-add" data-li="add" data-list="${path}">+ ${esc(f.addL || 'Új elem')}</button></div>`;
  }
  return '';
}
function itemLabel(f, it, i) {
  if (f.lab) return f.lab(it);
  const tf = f.fields.find(x => ['title', 'name', 'label', 'q', 'caption'].includes(x.k) && it[x.k]) || f.fields.find(x => x.t === 'text' && it[x.k]);
  return tf ? it[tf.k] : `${i + 1}. elem`;
}
function listItemHTML(f, it, i, path) {
  const key = `${sel}:${path}.${i}`;
  return `<details class="li"${openItems.has(key) ? ' open' : ''} data-key="${key}"><summary><span class="li-t" data-sum="${path}.${i}">${esc(itemLabel(f, it, i))}</span><span class="li-b">
<button type="button" data-li="up" data-list="${path}" data-i="${i}" title="Fel">↑</button><button type="button" data-li="down" data-list="${path}" data-i="${i}" title="Le">↓</button><button type="button" data-li="dup" data-list="${path}" data-i="${i}" title="Duplikálás">⧉</button><button type="button" data-li="del" data-list="${path}" data-i="${i}" title="Törlés">✕</button></span></summary>
<div class="li-body">${f.fields.map(sf => fieldHTML(sf, it[sf.k], `${path}.${i}.${sf.k}`)).join('')}</div></details>`;
}

/* mező jelölése: melyik nézetben tér el (D/T/M), ↺ = vissza a közös értékre */
function markHTML(b, k) {
  const dev = curDev();
  const devs = DEVS.filter(d => k in ovOf(b, d));
  if (!devs.length) return '';
  return `<span class="ovm">${devs.map(d => `<span class="ovc${d === dev ? ' cur' : ''}" title="${DEV_N[d]} nézetben eltér a közös értéktől">${DEV_S[d]}</span>`).join('')}${k in ovOf(b, dev) ? `<button type="button" class="ovr" data-ovreset="${k}" title="Visszaállítás a közös értékre (${DEV_N[dev]})">↺</button>` : ''}</span>`;
}
function blockFields(b, fields) {
  const e = eff(b), dev = curDev();
  return fields.filter(f => (!f.when || f.when(e)) && (!f.needs || BLOCKS[b.type][f.needs])).map(f => { const h = fieldHTML(f, e[f.k], f.k, markHTML(b, f.k)); return f.k in ovOf(b, dev) ? h.replace(/^<div class="f/, '<div class="f ov') : h; }).join('');
}
function scopeBar(b) {
  const dev = curDev(), n = b ? ovCount(b, dev) : 0;
  if (!b) return `<div class="scope-bar all">Az oldal beállításai <b>minden nézetre</b> érvényesek.</div>`;
  const sw = `<span class="scope-sw"><button type="button" data-scope="all" class="${scope === 'all' ? 'on' : ''}">🔗 Minden nézet</button><button type="button" data-scope="only" class="${scope === 'only' ? 'on' : ''}">📌 Csak ${DEV_N[dev]}</button></span>`;
  return scope === 'all'
    ? `<div class="scope-bar all">${sw}A megjelenés <b>mindhárom nézetben</b> változik.${DEVS.some(d => ovCount(b, d)) ? '<small>A D/T/M jelölésű mezőknél ez a nézetenkénti eltérést is felülírja.</small>' : ''}</div>`
    : `<div class="scope-bar only">${sw}A megjelenés <b>csak ${DEV_N[dev]}</b> nézetben változik, a többi marad.${n ? `<button type="button" class="rst" data-ovresetall>Mind a ${n} eltérés törlése</button>` : ''}</div>`;
}
function renderInspector() {
  const body0 = $('.insp-body', insp);
  const keep = body0 && insp.dataset.target === (sel || 'page') ? body0.scrollTop : 0;
  const b = sel && getB(sel);
  if (!b) {
    insp.dataset.target = 'page';
    insp.innerHTML = `<div class="panel-h"><span class="ph-t">⚙ Oldal beállítások</span></div><div class="insp-body">${scope === 'only' ? scopeBar(null) : ''}
<div class="hint"><b>Tipp:</b> kattints egy blokkra a vásznon a paraméterei szerkesztéséhez, vagy közvetlenül a szövegre, hogy átírd.</div>
<div class="sec"><div class="sec-h">Színek <button type="button" class="btn-s rnd" data-random title="Véletlen színek, betűtípus és elrendezés – Ctrl+Z visszavonja">🎲 Random téma</button></div><div class="ctiles">${PAGE_COLORS.map(c => { const v = S.page[c.k], shown = v || S.page[c.auto] || '#000000'; return `<div class="ctile${c.auto && !v ? ' auto' : ''}" title="Kattints a színre a választáshoz"><input type="color" data-path="${c.k}" data-kind="cpick" value="${esc(shown)}" aria-label="${c.l}"><b>${c.l}${c.auto && v ? `<button type="button" class="ct-rst" data-cclear="${c.k}" title="Vissza: a fő színnel egyezik">↺</button>` : ''}</b><small>${c.d}</small><input type="text" data-path="${c.k}" data-kind="ctext" value="${esc(v)}" placeholder="${c.auto ? 'fő szín' : ''}" spellcheck="false" maxlength="7"></div>`; }).join('')}</div></div>
<div class="sec"><div class="sec-h">Téma és SEO</div>${PAGE_FIELDS.map(f => fieldHTML(f, S.page[f.k], f.k)).join('')}<div style="height:8px"></div></div>
<div class="sec"><div class="sec-h">Gombok <span class="sec-tag">az oldal összes gombja</span></div>${BTN_FIELDS.map(f => fieldHTML(f, S.page[f.k], f.k)).join('')}<div class="f"><small class="f-hint0">A második („Tudj meg többet”) gombok mindig körvonalasak maradnak, hogy a fő gomb kiemelkedjen.</small></div></div>
<div class="sec"><div class="sec-h">Animáció minden blokkra</div><div class="f anim-all"><select id="animAll">${COMMON_FIELDS.find(f => f.k === '_anim').o.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select><button type="button" class="btn-s" data-animall>Alkalmaz</button></div><div class="f"><small class="f-hint0">Utána blokkonként is átállítható: blokk → Megjelenés → Animáció.</small></div></div>
<div class="sec"><div class="sec-h">Oldal szerkezete (${S.blocks.length} blokk)</div><div class="outline">${S.blocks.map(x => `<div class="ol-item" data-goto="${x.id}"><span>${esc(BLOCKS[x.type].icon)}</span>${esc(BLOCKS[x.type].name)}${x.p._id ? ` <small style="opacity:.5">#${esc(x.p._id)}</small>${idWarn(x.p._id, x.id) ? ' <small class="dup" title="Ugyanez az ID több blokknál is szerepel">⚠ ismétlődő ID</small>' : ''}` : ''}</div>`).join('') || '<div class="ol-item">–</div>'}</div></div></div>`;
  } else {
    const d = BLOCKS[b.type];
    insp.dataset.target = b.id;
    insp.innerHTML = `<div class="panel-h"><span class="ph-t"><span style="color:var(--acc2)">${esc(d.icon)}</span>${esc(d.name)}</span><span class="ph-b"><button type="button" data-bact="dup" title="Duplikálás">⧉</button><button type="button" class="del" data-bact="del" title="Törlés">🗑</button><button type="button" data-bact="close" title="Bezárás (Esc)">✕</button></span></div>
<div class="insp-body"><div class="sec"><div class="sec-h">Tartalom <span class="sec-tag">🔗 minden nézetben közös</span></div>${blockFields(b, [...d.fields, ...COMMON_FIELDS].filter(f => !isLook(f) && f.sec !== 'look'))}<div style="height:8px"></div></div>
<div class="sec look"><div class="sec-h">Megjelenés <span class="sec-tag">nézetenként állítható</span></div>${scopeBar(b)}${blockFields(b, [...d.fields, ...COMMON_FIELDS].filter(f => isLook(f) || f.sec === 'look'))}<div style="height:8px"></div></div></div>`;
  }
  insp.insertAdjacentHTML('beforeend', anchorList());
  if (keep) $('.insp-body', insp).scrollTop = keep;
}

function setField(path, v, key) {
  const tgt = insp.dataset.target;
  if (path === '_bgLink' && v) {                          // menüsorhoz kapcsolás helyett: átlátszó menü
    const i = idxOf(tgt), b = S.blocks[i];
    if (b?.type === 'navbar' || S.blocks[i - 1]?.type === 'navbar') {
      toast('A menüsorhoz nem lehet hátteret kapcsolni. Helyette: Menüsor → Megjelenés → <b>„Átlátszó menü a nyitókép fölött”</b> – így a menü a nyitókép hátterén lebeg, és görgetéskor is fent marad.', 'err');
      renderInspector(); return;
    }
  }
  snap(key);
  if (tgt === 'page') { S.page[path] = v; applyPage(); }
  else {
    const b = getB(tgt); if (!b) return;
    const had = JSON.stringify(b.r || {});
    writeVal(b, path, v);
    if (/^(_bg|_g|_div|_fade|_pull|_hide)/.test(path) || inGroup(b)) renderCanvas(); else refreshBlock(b.id);
    if (had !== JSON.stringify(b.r || {})) renderInspectorSoon();   // változott a jelölés
  }
  save();
}
let rsT, inspDirty = false;
const typingIn = () => insp.contains(document.activeElement) && (document.activeElement.type === 'text' || document.activeElement.tagName === 'TEXTAREA');
function renderInspectorSoon() { inspDirty = true; clearTimeout(rsT); rsT = setTimeout(() => { if (!typingIn()) { inspDirty = false; renderInspector(); } }, 500); }
insp.addEventListener('focusout', () => setTimeout(() => { if (inspDirty && !insp.contains(document.activeElement)) { inspDirty = false; renderInspector(); } }, 150));

insp.addEventListener('input', e => {
  const el = e.target, path = el.dataset.path;
  if (!path || el.type === 'file') return;
  let v = el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value;
  if (el.type === 'range') el.nextElementSibling.textContent = v + (el.dataset.unit || '');
  if (el.dataset.kind === 'cpick') { el.parentElement.querySelector('[data-kind=ctext]').value = v; el.parentElement.classList.remove('auto'); }
  if (el.dataset.kind === 'ctext') { if (/^#[0-9a-f]{6}$/i.test(v)) el.parentElement.querySelector('[data-kind=cpick]').value = v; el.parentElement.classList.toggle('auto', !v); }
  if (el.closest('.f-img') && String(getPath(currentTarget(), path)).startsWith('data:') && v === '(feltöltött kép)') return;
  if (insp.dataset.target === 'page' && el.dataset.kind === 'ctext' && !/^#[0-9a-f]{6}$/i.test(v)) return;   // félig begépelt színkód
  const key = path.split('.').pop();
  if (el.type === 'text' && (key === '_id' || isLinkKey(key))) {   // # / ékezet / szóköz javítása gépelés közben
    const nv = key === '_id' ? anchorId(v, true) : fixHref(v, true);
    if (nv !== v) { const pos = Math.max(0, el.selectionStart - (v.length - nv.length)); el.value = nv; el.setSelectionRange(pos, pos); v = nv; }
  }
  setField(path, v, insp.dataset.target + ':' + path);
  const warn = el.parentElement.querySelector('.f-warn');
  if (warn) warn.textContent = key === '_id' ? idWarn(v, sel) : linkWarn(v);
  const prev = el.parentElement.querySelector('.ico-prev'); if (prev) prev.innerHTML = v ? icoHTML(v) : '＋';
  const b = getB(insp.dataset.target);
  if (b) {
    if (fieldOf(b.type, path)?.re) renderInspector();        // pl. animáció be/ki → a további mezők megjelennek/eltűnnek
    if (/^_anim/.test(path)) playAnim(b.id);
  }
  if (el.closest('.f-img')) el.closest('.f-img').querySelector('.thumb').style.backgroundImage = `url("${v}")`;
  const m = path.match(/^(.+)\.(\d+)\.\w+$/);           // lista elem címkéjének frissítése
  if (m) {
    const lab = insp.querySelector(`[data-sum="${m[1]}.${m[2]}"]`);
    const f = BLOCKS[getB(insp.dataset.target)?.type]?.fields.find(x => x.k === m[1]);
    if (lab && f) lab.textContent = itemLabel(f, getPath(currentTarget(), `${m[1]}.${m[2]}`), +m[2]);
  }
});
const currentTarget = () => { const t = insp.dataset.target; return t === 'page' ? S.page : getB(t) && eff(getB(t)); };

insp.addEventListener('change', e => {                   // mező elhagyásakor: végső tisztítás + horgony lista frissítése
  const el = e.target, path = el.dataset.path; if (!path || el.type !== 'text') return;
  const key = path.split('.').pop(); if (key !== '_id' && !isLinkKey(key)) return;
  const nv = key === '_id' ? anchorId(el.value) : fixHref(el.value);
  if (nv !== el.value) { el.value = nv; setField(path, nv, insp.dataset.target + ':' + path); }
  $('#anchorList', insp)?.replaceWith(document.createRange().createContextualFragment(anchorList()));
});
insp.addEventListener('change', async e => {
  const el = e.target; if (!el.dataset.upload || !el.files[0]) return;
  const file = el.files[0];
  if (!file.type.startsWith('image/')) return toast('Ez nem kép fájl.', 'err');
  const url = await readImage(file);
  setField(el.dataset.upload, url);
  renderInspector();
  toast('Kép feltöltve – a projektbe és az exportált HTML-be ágyazva.');
});

insp.addEventListener('click', e => {
  const t = e.target;
  const cc = t.closest('[data-cclear]');
  if (cc) { setField(cc.dataset.cclear, ''); renderInspector(); return; }
  if (t.closest('[data-act2=goleader]')) { select(S.blocks[leaderIdx(idxOf(sel))].id, true); return; }
  const pk = t.closest('[data-pick]');
  if (pk) { openPicker(pk.dataset.pick, pk); return; }
  if (t.closest('[data-play]')) { const b = getB(sel); if (b && eff(b)._anim !== 'none') playAnim(b.id); else toast('Előbb válassz egy animációt.'); return; }
  if (t.closest('[data-random]')) { randomTheme(); return; }
  if (t.closest('[data-animall]')) {
    const v = $('#animAll').value; snap();
    S.blocks.forEach(b => { if (b.type === 'navbar') return; b.p._anim = v; DEVS.forEach(d => { if (b.r?.[d]) delete b.r[d]._anim; }); });
    renderCanvas(); save(); toast(v === 'none' ? 'Animáció kikapcsolva minden blokkon.' : 'Animáció beállítva minden blokkra (a menüsor kivételével).');
    if (v !== 'none') S.blocks.forEach((b, i) => setTimeout(() => playAnim(b.id), 0));
    return;
  }
  const ovr = t.closest('[data-ovreset]');
  if (ovr) { e.preventDefault(); const b = getB(sel); snap(); delete b.r[curDev()][ovr.dataset.ovreset]; if (!ovCount(b, curDev())) delete b.r[curDev()]; refreshBlock(b.id); renderInspector(); save(); return; }
  const sc = t.closest('.scope-sw [data-scope]');
  if (sc) { setScope(sc.dataset.scope); return; }
  if (t.closest('[data-ovresetall]')) { const b = getB(sel); snap(); delete b.r[curDev()]; refreshBlock(b.id); renderInspector(); save(); toast(`Eltérések törölve – ${DEV_N[curDev()]} nézet most a közös értékeket mutatja.`); return; }
  const go = t.closest('[data-goto]');
  if (go) { select(go.dataset.goto, true); return; }
  const ba = t.closest('[data-bact]');
  if (ba) { const a = ba.dataset.bact; if (a === 'dup') dupBlock(sel); else if (a === 'del') delBlock(sel); else select(null); return; }
  const li = t.closest('[data-li]');
  if (li) {
    e.preventDefault();
    const b = getB(sel); if (!b) return;
    const path = li.dataset.list, arr = clone(eff(b)[path]), i = +li.dataset.i, a = li.dataset.li;
    const f = BLOCKS[b.type].fields.find(x => x.k === path);
    snap();
    if (a === 'add') { arr.push(clone(f.item)); openItems.add(`${sel}:${path}.${arr.length - 1}`); }
    else if (a === 'del') arr.splice(i, 1);
    else if (a === 'dup') arr.splice(i + 1, 0, clone(arr[i]));
    else if (a === 'up' && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    else if (a === 'down' && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
    writeVal(b, path, arr);
    refreshBlock(sel); renderInspector(); save();
  }
});
insp.addEventListener('toggle', e => {
  const k = e.target.dataset?.key; if (!k) return;
  e.target.open ? openItems.add(k) : openItems.delete(k);
}, true);

/* feltöltött kép kicsinyítése, hogy a projekt ne legyen óriási */
function readImage(file) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = () => {
      if (!/image\/(jpeg|png|webp)/.test(file.type)) return res(r.result);
      const im = new Image();
      im.onload = () => {
        const s = Math.min(1, 1600 / Math.max(im.width, im.height));
        if (s === 1 && file.size < 350e3) return res(r.result);
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', .85));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

/* ---------------- export / előnézet / fájlok ---------------- */
function buildHTML() {
  const pg = S.page, fu = fontsUrl(pg);
  const nav = S.blocks.find(b => b.type === 'navbar' && DEVS.some(d => eff(b, d).sticky && !eff(b, d)._hide));
  const gcss = [], body = exportBody(gcss);
  const hasNav = S.blocks.some(b => b.type === 'navbar' && DEVS.some(d => { const e = eff(b, d); return e.over && e.sticky && !e._hide; }));
  const hasAnim = S.blocks.some(b => DEVS.some(d => { const e = eff(b, d); return e._anim !== 'none' && !e._hide; }));
  const navH = nav ? Math.max(...DEVS.map(d => { const e = eff(nav, d); return e._pt + e._pb + 44; })) : 0;
  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pg.title)}</title>
${pg.desc ? `<meta name="description" content="${esc(pg.desc)}">\n` : ''}<meta name="generator" content="WEBEKI">
${fu ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="${esc(fu)}">\n` : ''}${hasAnim ? '<script>document.documentElement.className+=" wk-js"</script>\n' : ''}<style>
html{scroll-behavior:smooth${navH ? `;scroll-padding-top:${navH}px` : ''}}body{margin:0}
@media (min-width:1025px){.wk-only:not(.wk-on-d){display:none!important}}
@media (min-width:601px) and (max-width:1024px){.wk-only:not(.wk-on-t){display:none!important}}
@media (max-width:600px){.wk-only:not(.wk-on-m){display:none!important}}
.wk-page{${pageVars(pg)}min-height:100vh}
${PAGE_CSS.trim()}${gcss.length ? '\n' + gcss.join('\n') : ''}
</style>
</head>
<body>
<div class="wk-page ${pageCls(pg)}">
${body}
</div>
${hasAnim || hasNav ? `<script>\n${hasAnim ? `${wkAnimIdx}\n${wkAnimInit}\nwkAnimInit();\n` : ''}${hasNav ? `${wkNavInit}\nwkNavInit();\n` : ''}</script>\n` : ''}</body>
</html>
`;
}
/* ha egy blokk nézetenként eltér, minden különböző változat bekerül, és CSS dönti el, melyik látszik */
function exportBody(gcss) {
  return groupsOf().map(g => {
    const inner = g.map(exportBlock).filter(Boolean).join('\n');
    if (g.length < 2) return inner;
    const L = g[0], cls = 'g-' + L.id, st = DEVS.map(d => groupStyle(eff(L, d), L.type));
    if (st.every(x => x === st[0])) gcss.push(`.${cls}{${st[0]}}`);
    else gcss.push(`@media (min-width:1025px){.${cls}{${st[0]}}}`, `@media (min-width:601px) and (max-width:1024px){.${cls}{${st[1]}}}`, `@media (max-width:600px){.${cls}{${st[2]}}}`);
    return `<div class="wk-bgg ${cls}">\n${inner}\n</div>`;
  }).join('\n');
}
function exportBlock(b) {
  const groups = new Map(), i = idxOf(b.id);
  DEVS.forEach(d => {
    const e = eff(b, d); if (e._hide) return;
    const ctx = ctxOf(i, d);
    const key = renderBlock({ ...b, p: { ...e, _id: '' } }, false, '', ctx);
    if (!groups.has(key)) groups.set(key, { e, ctx, devs: [] });
    groups.get(key).devs.push(d);
  });
  if (!groups.size) return '';
  if (groups.size === 1 && [...groups.values()][0].devs.length === 3) { const g = [...groups.values()][0]; return renderBlock({ ...b, p: g.e }, false, '', g.ctx); }
  const id = b.p._id, multi = groups.size > 1;
  const out = [...groups.values()].map(({ e, ctx, devs }) => renderBlock(
    { ...b, id: b.id + (multi ? '-' + devs.map(d => DEV_S[d]).join('') : ''), p: { ...e, _id: multi ? '' : e._id } }, false,
    'wk-only ' + devs.map(d => 'wk-on-' + DEV_S[d].toLowerCase()).join(' '), ctx)).join('\n');
  return multi && id && b.type !== 'navbar' ? `<div id="${esc(id)}">\n${out}\n</div>` : out;
}
const slug = s => (s || 'weboldal').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'weboldal';
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
/* ---- ZIP export: index.html + images/ mappa (a feltöltött képek külön fájlként) ---- */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function makeZip(files) {                       // tömörítés nélküli ("store") ZIP, UTF-8 fájlnevekkel
  const enc = new TextEncoder(), parts = [], central = [], d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  let off = 0;
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const h = new DataView(new ArrayBuffer(30));
    [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, time, 2], [12, date, 2], [14, crc, 4], [18, size, 4], [22, size, 4], [26, name.length, 2], [28, 0, 2]]
      .forEach(([o, v, n]) => n === 4 ? h.setUint32(o, v, true) : h.setUint16(o, v, true));
    parts.push(h.buffer, name, f.data);
    const c = new DataView(new ArrayBuffer(46));
    [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, time, 2], [14, date, 2], [16, crc, 4], [20, size, 4], [24, size, 4], [28, name.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, off, 4]]
      .forEach(([o, v, n]) => n === 4 ? c.setUint32(o, v, true) : c.setUint16(o, v, true));
    central.push(c.buffer, name);
    off += 30 + name.length + size;
  }
  const cdSize = central.reduce((a, x) => a + x.byteLength, 0), e = new DataView(new ArrayBuffer(22));
  [[0, 0x06054b50, 4], [8, files.length, 2], [10, files.length, 2], [12, cdSize, 4], [16, off, 4]].forEach(([o, v, n]) => n === 4 ? e.setUint32(o, v, true) : e.setUint16(o, v, true));
  return new Blob([...parts, ...central, e.buffer], { type: 'application/zip' });
}
function extractImages(html) {                 // beágyazott (data:) képek → images/kep-1.jpg …
  const map = new Map(), ext = { jpeg: 'jpg', jpg: 'jpg', png: 'png', gif: 'gif', webp: 'webp', 'svg+xml': 'svg' };
  const out = html.replace(/data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+/g, (m, t) => {
    if (!map.has(m)) map.set(m, `images/kep-${map.size + 1}.${ext[t] || 'img'}`);
    return map.get(m);
  });
  const images = [...map].map(([uri, name]) => { const bin = atob(uri.slice(uri.indexOf(',') + 1)), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return { name, data: u8 }; });
  return { html: out, images };
}
function exportZip() {
  const root = slug(S.page.title), { html, images } = extractImages(buildHTML());
  const files = [{ name: `${root}/index.html`, data: new TextEncoder().encode(html) }, ...images.map(im => ({ name: `${root}/${im.name}`, data: im.data }))];
  downloadBlob(root + '.zip', makeZip(files));
  toast(`Kész: <b>${root}.zip</b> – index.html${images.length ? ` + ${images.length} kép az images mappában` : ''}. Csomagold ki, és a mappa tartalmát töltsd fel.`);
}
function exportHTML() { download('index.html', buildHTML(), 'text/html'); toast('Kész: <b>index.html</b> – töltsd fel bármilyen tárhelyre.'); }
function downloadBlob(name, blob) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('#btnExport').onclick = () => {
  const imgs = (JSON.stringify(S.blocks).match(/data:image\//g) || []).length;
  openModal(`<div class="m-h">Export – hogyan kéred?<button data-m="x">✕</button></div><div class="exp-grid">
<button class="exp" data-exp="zip"><span>📦</span><b>ZIP – mappa képekkel</b><small>index.html + a feltöltött képek külön <code>images</code> mappában. Kisebb, gyorsabban betöltődő oldal.${imgs ? ` <em>(${imgs} feltöltött kép)</em>` : ''}</small><i>Ajánlott</i></button>
<button class="exp" data-exp="html"><span>📄</span><b>Egyetlen HTML fájl</b><small>Minden egy <code>index.html</code>-ben, a képek is beágyazva. Egyszerű, de sok képnél nagy fájl.</small></button>
</div><p class="m-note">Mindkettő bármilyen tárhelyre feltölthető (saját tárhely, GitHub Pages, Netlify, Cloudflare Pages). A képek internetes címei (pl. mintaképek) linkként maradnak.</p>`);
};
$('#btnPreview').onclick = () => {
  const w = window.open(URL.createObjectURL(new Blob([buildHTML()], { type: 'text/html' })), '_blank');
  if (!w) toast('A böngésző blokkolta az új ablakot – engedélyezd a felugró ablakokat.', 'err');
};
function saveProject() { download(slug(S.page.title) + '.webeki.json', JSON.stringify(S, null, 1), 'application/json'); toast('Projekt elmentve fájlba.'); }
$('#btnSave').onclick = saveProject;
$('#btnOpen').onclick = () => $('#fileOpen').click();
$('#fileOpen').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const s = normalize(JSON.parse(await f.text())); snap(); S = s; sel = null; refreshAll(); toast('Projekt betöltve.'); }
  catch (err) { toast('Hibás projekt fájl.', 'err'); }
};

/* ---------------- sablonok, súgó ---------------- */
const modal = $('#modal');
function openModal(html) { modal.innerHTML = `<div class="m-box">${html}</div>`; modal.hidden = false; }
modal.addEventListener('click', e => {
  if (e.target === modal || e.target.closest('[data-m=x]')) { modal.hidden = true; return; }
  const ex = e.target.closest('[data-exp]');
  if (ex) { modal.hidden = true; ex.dataset.exp === 'zip' ? exportZip() : exportHTML(); return; }
  const t = e.target.closest('[data-tpl]');
  if (t) { snap(); S = fromTemplate(t.dataset.tpl); sel = null; modal.hidden = true; refreshAll(); $('#stage').scrollTop = 0; toast('Új oldal létrehozva. (Ctrl+Z visszahozza az előzőt)'); }
});
$('#btnNew').onclick = () => openModal(`<div class="m-h">Új oldal – válassz kiinduló sablont<button data-m="x">✕</button></div>
<div class="tpl-grid">${Object.entries(TEMPLATES).map(([k, t]) => `<button class="tpl" data-tpl="${k}"><div class="tpl-prev">${t.blocks.map(x => { const ty = Array.isArray(x) ? x[0] : x; return `<i class="${ty === 'hero' ? 'hero' : ty === 'footer' ? 'dark' : ''}">${esc(BLOCKS[ty].name)}</i>`; }).join('') || '<span class="none">üres</span>'}</div><b>${t.n}</b><small>${t.d}</small></button>`).join('')}</div>
<p class="m-note">A jelenlegi oldal lecserélődik – a Ctrl+Z visszahozza.</p>`);
$('#btnHelp').onclick = () => openModal(`<div class="m-h">Hogyan működik?<button data-m="x">✕</button></div><div class="m-body">
<p><b>1. Blokkok</b> – húzd a bal oldali modulokat az oldalra, vagy kattints rájuk. A vásznon a blokk jobb felső sarkában: áthelyezés ⠿, fel/le, duplikálás, törlés.</p>
<p><b>2. Paraméterezés</b> – kattints egy blokkra: jobb oldalt megjelennek a beállításai (szövegek, képek, színek, oszlopok, térköz, listaelemek). Üres területre kattintva az <i>oldal beállításait</i> látod (3 alapszín, betűtípus, SEO).</p>
<p><b>3. Közvetlen szerkesztés</b> – a szövegekre kattintva helyben is átírhatod őket.</p>
<p><b>4. Nézetek</b> – fent válthatsz asztali / tablet / mobil nézet között. A <b>tartalom</b> (szövegek, képek, linkek, listaelemek, blokkok hozzáadása/törlése/sorrendje) mindig <b>minden nézetben közös</b>. A <b>megjelenés</b> (igazítás, oszlopok, elrendezés, színek, térközök, elrejtés) nézetenként is állítható: <b style="color:#9d86ff">🔗 Minden nézet</b> – mindhárom nézetben változik; <b style="color:#f59e0b">📌 Csak ez a nézet</b> – csak az aktuálisban (narancs jelzi). Az eltérő mezők mellett <b>D/T/M</b> jelölés, a ↺ visszaállítja a közös értékre. Pl. asztalin balra, mobilon középre igazított ikonok. Billentyű: <kbd>L</kbd></p>
<p><b>Animáció</b> – blokk → Megjelenés → Animáció: típus (beúszás, előtűnés, nagyítás, billenés), időtartam, késleltetés, lépcsőzetes megjelenés. ▶ Lejátszás: kipróbálás. Minden blokkra egyszerre: Oldal beállítások → Animáció minden blokkra.</p>
<p><b>Ikonok</b> – a Szolgáltatások elemeinél a <i>Választás…</i> gomb: emoji vagy rajzolt ikon (a rajzolt ikon a fő színt veszi fel). Emojit be is írhatsz. <b>Közösségi ikonok</b>: menüsor, kapcsolat és lábléc blokk → Közösségi oldalak.</p>
<p><b>Blokkok összekapcsolása</b> – Megjelenés → Háttér: <i>Folytatja az előző blokk hátterét</i> (több blokk egy közös háttéren). Határ a szomszéd blokkokkal: formázott határvonal (hullám, ív, ferde, csúcs, cikcakk), lágy átmenet, átlógás.</p>
<p><b>🎲 Random téma</b> – véletlen, de összeillő színek, betűtípusok, lekerekítés, térközök, elrendezés és animáció. A tartalom nem változik. Nyomd többször; <kbd>Ctrl/⌘ Z</kbd> visszahozza az előzőt.</p>
<p><b>Horgonyok (menüből ugrás egy szakaszra)</b> – a blokk <i>Horgony (ID)</i> mezőjébe: <code>rolunk</code> (# nélkül), a menüpont linkjébe: <code>#rolunk</code> – a link mezőben legördülő listából is választhatsz. A szerkesztőben a linkek nem ugranak el (hogy a feliratot átírhasd); kipróbálni <kbd>Ctrl/⌘</kbd> + kattintással vagy az Előnézetben lehet.</p>
<p><b>Átlátszó menü</b> – Menüsor → Megjelenés → <i>Átlátszó menü a nyitókép fölött</i>: a nyitókép a menü alá csúszik; görgetéskor a menü hátteret (és üveghatást) kap.</p>
<p><b>Gombszín</b> – Oldal beállítások → Színek → <i>Gomb</i> (üresen a fő szín), blokkonként: blokk → Megjelenés → Gombok.</p>
<p><b>Gombok</b> – Oldal beállítások → Gombok: stílus (teli, körvonalas, halvány, árnyékos, színátmenetes), forma, méret, nagybetűs felirat – az oldal összes gombjára.</p>
<p><b>5. Export</b> – <i>ZIP</i>: index.html + a feltöltött képek külön <code>images</code> mappában (ajánlott), vagy <i>egyetlen HTML fájl</i>, a képek beágyazva. Bármilyen tárhelyre feltölthető (Netlify, GitHub Pages, saját tárhely). A <i>Mentés</i> projekt fájlt készít, amit később újra megnyithatsz.</p>
<p><kbd>Ctrl/⌘ Z</kbd> visszavonás · <kbd>Ctrl/⌘ Shift Z</kbd> újra · <kbd>Ctrl/⌘ D</kbd> duplikálás · <kbd>Del</kbd> törlés · <kbd>Alt ↑/↓</kbd> mozgatás · <kbd>Esc</kbd> kijelölés megszüntetése · <kbd>Ctrl/⌘ S</kbd> projekt mentése</p>
<p style="color:var(--ui-tx3)">A munkád automatikusan mentődik ebbe a böngészőbe is.</p>
<p style="color:var(--ui-tx3)">WEBEKI ${VERSION} · ingyenes, nyílt forráskódú (GPL v3) · <a href="https://github.com/Ekidio/webeki" target="_blank" rel="noopener" style="color:var(--acc2)">github.com/Ekidio/webeki</a></p></div>`);

/* ---------------- eszköz nézet ---------------- */
$('#devices').addEventListener('click', e => {
  const b = e.target.closest('[data-dev]'); if (!b) return;
  $$('#devices button').forEach(x => x.classList.toggle('on', x === b));
  $('#stage').dataset.dev = b.dataset.dev;
  fitZoom(); updScope(); renderCanvas(); renderInspector();
});
$('#scope').addEventListener('click', e => { const b = e.target.closest('[data-scope]'); if (b) setScope(b.dataset.scope); });
function setScope(s) { scope = s; updScope(); renderInspector(); }
function updScope() {
  $$('#scope button').forEach(x => x.classList.toggle('on', x.dataset.scope === scope));
  $('#scopeDev').textContent = DEV_N[curDev()];
  document.body.classList.toggle('only', scope === 'only');
}
function updBadges() { const b = getB(sel); if (b && !page.contains(document.activeElement)) refreshBlock(b.id); }

/* a vászon a valódi szélességen renderel (asztali: 1280px), és kicsinyítve fér el */
const DEV_W = { desktop: 1280, tablet: 820, mobile: 390 };
function fitZoom() {
  const st = $('#stage'), w = DEV_W[st.dataset.dev];
  const z = Math.min(1, (st.clientWidth - 56) / w);
  page.style.zoom = z; page.style.setProperty("--ed-z", 1 / z);
  $('#zoomInfo').textContent = `${w}px · ${Math.round(z * 100)}%`;
}
new ResizeObserver(fitZoom).observe($('#stage'));

/* ---------------- billentyűk ---------------- */
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;
document.addEventListener('keydown', e => {
  const typing = e.target.closest?.('input,textarea,select,[contenteditable]');
  const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
  if (mod && k === 's') { e.preventDefault(); saveProject(); return; }
  if (!modal.hidden && e.key === 'Escape') { modal.hidden = true; return; }
  if (typing) return;
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (mod && k === 'y') { e.preventDefault(); redo(); }
  else if (mod && k === 'd' && sel) { e.preventDefault(); dupBlock(sel); }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); delBlock(sel); }
  else if (e.key === 'Escape') { if (!picker.hidden) picker.hidden = true; else select(null); }
  else if (k === 'l' && !mod) setScope(scope === 'all' ? 'only' : 'all');
  else if (e.altKey && sel && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); moveBlock(sel, idxOf(sel) + (e.key === 'ArrowUp' ? -1 : 1)); }
});
$('#stage').addEventListener('click', e => { if (e.target.id === 'stage') select(null); });

/* ---------------- animáció előnézet a vásznon ---------------- */
function playAnim(id) {
  const sec = page.querySelector(`.ed-block[data-id="${id}"] > .wk-b`);
  if (!sec || !sec.dataset.anim) return;
  const n = wkAnimIdx(sec), cs = getComputedStyle(sec);
  const total = parseFloat(cs.getPropertyValue('--wk-ad')) + parseFloat(cs.getPropertyValue('--wk-dl')) + (sec.hasAttribute('data-st') ? n * 110 : 0);
  clearTimeout(sec._t);
  sec.classList.remove('wk-vis'); sec.classList.add('wk-prev');
  void sec.offsetWidth;
  requestAnimationFrame(() => requestAnimationFrame(() => sec.classList.add('wk-vis')));
  sec._t = setTimeout(() => sec.classList.remove('wk-prev', 'wk-vis'), total + 400);
}

/* ---------------- ikonválasztó ---------------- */
const picker = $('#picker');
let pickPath = null, pickTab = 'emoji';
function openPicker(path, anchor) {
  pickPath = path;
  const r = anchor.getBoundingClientRect();
  picker.hidden = false;
  picker.style.top = Math.max(8, Math.min(r.bottom + 6, innerHeight - 430)) + 'px';
  picker.style.left = Math.max(8, Math.min(r.left - 200, innerWidth - 360)) + 'px';
  renderPicker();
}
function renderPicker(q = '') {
  const cur = getPath(currentTarget() || {}, pickPath) || '';
  const items = pickTab === 'emoji'
    ? EMOJIS.map(e => `<button type="button" data-ico="${e}" class="${cur === e ? 'on' : ''}">${e}</button>`)
    : Object.entries(ICONS).filter(([k, v]) => !q || (k + ' ' + v.n).includes(q.toLowerCase()))
      .map(([k, v]) => `<button type="button" data-ico="i:${k}" title="${v.n.split(' ')[0]}" class="${cur === 'i:' + k ? 'on' : ''}">${svg(v.d)}</button>`);
  picker.innerHTML = `<div class="pk-h"><div class="pk-tabs"><button type="button" data-tab="emoji" class="${pickTab === 'emoji' ? 'on' : ''}">😊 Emoji</button><button type="button" data-tab="icons" class="${pickTab === 'icons' ? 'on' : ''}">✎ Rajzolt ikonok</button></div><button type="button" data-pkclose title="Bezárás">✕</button></div>
${pickTab === 'icons' ? `<input class="pk-q" placeholder="Keresés: telefon, cím, szív…" value="${esc(q)}">` : '<div class="pk-note">Bármilyen emojit be is írhatsz a mezőbe (Mac: Ctrl+⌘+Szóköz).</div>'}
<div class="pk-grid ${pickTab}">${items.join('') || '<div class="pk-note">Nincs találat</div>'}</div>
<div class="pk-f"><button type="button" data-ico="">Ikon nélkül</button><small>A rajzolt ikonok a fő színt veszik fel.</small></div>`;
  if (pickTab === 'icons') { const i = $('.pk-q', picker); i.focus(); i.setSelectionRange(q.length, q.length); }
}
picker.addEventListener('input', e => { if (e.target.matches('.pk-q')) renderPicker(e.target.value); });
picker.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('[data-pkclose]')) { picker.hidden = true; return; }
  const tab = t.closest('[data-tab]'); if (tab) { pickTab = tab.dataset.tab; renderPicker(); return; }
  const it = t.closest('[data-ico]'); if (!it) return;
  const v = it.dataset.ico;
  setField(pickPath, v);
  const inp = insp.querySelector(`[data-path="${pickPath}"]`);
  if (inp) { inp.value = v; inp.parentElement.querySelector('.ico-prev').innerHTML = v ? icoHTML(v) : '＋'; }
  picker.hidden = true;
});
document.addEventListener('mousedown', e => { if (!picker.hidden && !picker.contains(e.target) && !e.target.closest('[data-pick]')) picker.hidden = true; });

/* ---------------- 🎲 random téma ----------------
   Véletlen, de összeillő: egy alapszínből számolt paletta, betűpár, lekerekítés, térköz,
   váltakozó szekció háttér, blokk elrendezések és egységes animáció. A tartalom nem változik. */
const FONT_PAIRS = [['Inter', ''], ['Poppins', ''], ['DM Sans', 'Space Grotesk'], ['Open Sans', 'Montserrat'], ['Lato', 'Playfair Display'],
  ['Nunito', ''], ['Raleway', 'Merriweather'], ['Roboto', 'Montserrat'], ['Inter', 'Playfair Display'], ['Montserrat', ''], ['Open Sans', 'Raleway']];
const rnd = a => a[Math.floor(Math.random() * a.length)];
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function hsl(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}
function randomTheme() {
  snap();
  const h = rint(0, 359), dark = Math.random() < .2, [font, headFont] = rnd(FONT_PAIRS);
  Object.assign(S.page, dark
    ? { primary: hsl(h, rint(70, 90), rint(60, 68)), text: hsl(h, 14, 90), bg: hsl(h, rint(18, 30), rint(6, 9)) }
    : { primary: hsl(h, rint(65, 88), rint(40, 50)), text: hsl(h, rint(20, 35), rint(10, 16)), bg: Math.random() < .5 ? '#ffffff' : hsl(h, rint(25, 45), rint(97, 99)) },
    { font, headFont, radius: rnd([0, 4, 8, 12, 16, 24]), btn: Math.random() < .3 ? hsl((h + rint(150, 210)) % 360, rint(70, 90), dark ? 62 : 46) : '', btnStyle: rnd(['solid', 'solid', 'outline', 'soft', 'shadow', 'gradient']), btnShape: rnd(['theme', 'theme', 'pill', 'square', 'round']), btnUpper: Math.random() < .2 });
  for (let l = 48; !dark && contrast(S.page.primary, S.page.bg) < 3.6 && l > 20; l -= 3) S.page.primary = hsl(h, 80, l);
  const tint = dark ? hsl(h, rint(18, 28), rint(10, 13)) : hsl(h, rint(30, 55), rint(94, 97));
  const alt = rnd([0, 1, -1]), pad = rnd([72, 88, 104, 120]);
  const anim = rnd(['none', 'up', 'up', 'fade', 'zoom', 'left', 'flip']), heroAlign = rnd(['center', 'left']), soc = rnd(['plain', 'circle', 'square']);
  let right = Math.random() < .5, k = 0;
  S.blocks.forEach(b => {
    const p = b.p, t = b.type;
    if (!['navbar', 'hero', 'cta', 'footer', 'spacer', 'html'].includes(t)) { p._pt = p._pb = pad; if (p._bgType !== 'image') p._bgType = 'color'; p._bg = alt >= 0 && k++ % 2 === alt ? tint : ''; p._fg = ''; }
    if (t === 'hero') Object.assign(p, { align: heroAlign, _bgOv: rint(35, 70), _bgOvC: Math.random() < .3 ? hsl(h, 60, 12) : '', height: rnd([70, 80, 90]) });
    if (t === 'hero') Object.assign(p, { _divBot: rnd(['none', 'none', 'wave', 'curve', 'slant', 'arc']), _divBotH: rnd([48, 64, 80, 100]), _divBotC: '' });
    if (t === 'cta') Object.assign(p, Math.random() < .5 ? { _bgType: 'gradient', _gKind: rnd(['linear', 'linear', 'radial']), _g1: '', _g2: '', _gAng: rnd([90, 120, 135, 160, 200]), _gMid: rint(35, 65) } : { _bgType: 'color', _bg: '' });
    if (t === 'features') Object.assign(p, { look: rnd(['card', 'plain']), align: rnd(['left', 'center']) });
    if (t === 'imageText') { p.imgPos = right ? 'right' : 'left'; right = !right; }
    if (t === 'gallery') p.ratio = rnd(['1/1', '4/3', '3/4', '16/9']);
    if ('socStyle' in p) p.socStyle = soc;
    if (t !== 'navbar') p._anim = anim;
  });
  applyPage(); renderCanvas(); renderInspector(); save();
  if (anim !== 'none') S.blocks.forEach(b => playAnim(b.id));
  toast(`🎲 Új téma: <b>${font}${headFont ? ' + ' + headFont : ''}</b> · ${dark ? 'sötét' : 'világos'} – nyomd újra egy másikért, Ctrl+Z visszahozza az előzőt`);
}
$('#btnRandom').onclick = randomTheme;

/* ---------------- toast ---------------- */
function toast(html, type = '') {
  const t = document.createElement('div'); t.className = 'toast ' + type; t.innerHTML = html;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), type === 'err' ? 6000 : 3500);
}

/* ---------------- indulás ---------------- */
$('#pageCss').textContent = PAGE_CSS;
$('#ver').textContent = 'v' + VERSION;
updScope(); renderLib(); applyPage(); renderCanvas(); renderInspector(); updUndo(); save();
