/* =========================================================================
   WEBEKI – szerkesztő logika
   ========================================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => 'b' + Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const getPath = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
const setPath = (o, p, v) => { const ks = p.split('.'), last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };

const VERSION = '1.0';
const LS_KEY = 'webeki.project.v1';
const FONTS = {
  'Inter': '400;500;600;700;800', 'Poppins': '400;500;600;700;800', 'Montserrat': '400;500;600;700;800', 'Roboto': '400;500;700;900',
  'Open Sans': '400;500;600;700;800', 'Lato': '400;700;900', 'Raleway': '400;500;600;700;800', 'Nunito': '400;600;700;800',
  'DM Sans': '400;500;700', 'Space Grotesk': '400;500;600;700', 'Playfair Display': '400;600;700;800', 'Merriweather': '400;700;900',
};
const PALETTES = [
  { n: 'Lila', primary: '#6d4aff', text: '#1f2433', bg: '#ffffff' },
  { n: 'Óceán', primary: '#0284c7', text: '#0f172a', bg: '#f8fafc' },
  { n: 'Erdő', primary: '#15803d', text: '#1a2a1e', bg: '#fbfdf8' },
  { n: 'Narancs', primary: '#ea580c', text: '#2a1a0e', bg: '#fffaf5' },
  { n: 'Rózsa', primary: '#e11d48', text: '#1f1f23', bg: '#ffffff' },
  { n: 'Sötét', primary: '#8b5cf6', text: '#e7e8ee', bg: '#0c0e14' },
];
const DEFAULT_PAGE = { title: 'Az én weboldalam', desc: '', font: 'Inter', headFont: '', primary: '#6d4aff', text: '#1f2433', bg: '#ffffff', radius: 10 };
const PAGE_FIELDS = [
  { k: 'title', t: 'text', l: 'Oldal címe', hint: 'a böngésző fülön és a Google találatban' },
  { k: 'desc', t: 'textarea', l: 'Leírás (SEO)', hint: 'rövid összefoglaló a keresőknek' },
  { k: 'font', t: 'select', l: 'Betűtípus – szöveg', o: Object.keys(FONTS) },
  { k: 'headFont', t: 'select', l: 'Betűtípus – címsorok', o: [['', '(ugyanaz)'], ...Object.keys(FONTS)] },
  { k: 'primary', t: 'color', l: 'Fő szín (gombok, kiemelések)' },
  { k: 'text', t: 'color', l: 'Szövegszín' },
  { k: 'bg', t: 'color', l: 'Háttérszín' },
  { k: 'radius', t: 'range', l: 'Lekerekítés', min: 0, max: 30, unit: 'px' },
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
function normalize(s) {
  s.page = { ...DEFAULT_PAGE, ...(s.page || {}) };
  s.blocks = (s.blocks || []).filter(b => BLOCKS[b.type])
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
function pageVars(pg) {
  return `--wk-primary:${pg.primary};--wk-text:${pg.text};--wk-bg:${pg.bg};--wk-radius:${pg.radius}px;--wk-font:'${pg.font}',system-ui,sans-serif;` + (pg.headFont ? `--wk-head:'${pg.headFont}',system-ui,sans-serif;` : '');
}
function applyPage() {
  const page = $('#page');
  page.style.cssText = pageVars(S.page); fitZoom();
  const u = fontsUrl(S.page); if ($('#pageFont').getAttribute('href') !== u) $('#pageFont').href = u;
}

/* ---------------- vászon ---------------- */
const page = $('#page');
function wrap(b) {
  const d = BLOCKS[b.type], dev = curDev(), e = eff(b, dev), n = ovCount(b, dev);
  const others = DEVS.filter(x => x !== dev && ovCount(b, x)).map(x => DEV_S[x]).join('');
  return `<div class="ed-block${b.id === sel ? ' sel' : ''}${e._hide ? ' ed-hidden' : ''}" data-id="${b.id}"${e._hide ? ` data-hid="Rejtve – ${DEV_N[dev]} nézetben"` : ''}><div class="ed-tools"><span class="ed-name">${esc(d.name)}</span>${n ? `<span class="ed-ov" title="${n} beállítás csak ${DEV_N[dev]} nézetben tér el">📌 ${n}</span>` : ''}${others ? `<span class="ed-ov2" title="Más nézetekben eltér: ${others}">${others}</span>` : ''}<button data-act="drag" draggable="true" title="Húzd az áthelyezéshez">⠿</button><button data-act="up" title="Fel">↑</button><button data-act="down" title="Le">↓</button><button data-act="dup" title="Duplikálás (Ctrl+D)">⧉</button><button data-act="del" title="Törlés (Del)">✕</button></div>${renderBlock({ ...b, p: e }, true)}</div>`;
}
function renderCanvas() {
  page.innerHTML = S.blocks.length ? S.blocks.map(wrap).join('')
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
  const id = 'f_' + path.replace(/\./g, '_');
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
      return `<div class="f">${lab}<div class="f-color${v ? '' : ' auto'}"><input type="color" data-path="${path}" data-kind="cpick" value="${hex}"><input id="${id}" type="text" data-path="${path}" data-kind="ctext" value="${esc(v)}" placeholder="téma szerint"><button type="button" data-cclear="${path}" title="Téma szerinti (alapértelmezett)">↺</button></div></div>`;
    }
    case 'image':
      return `<div class="f">${lab}<div class="f-img"><div class="thumb" style="background-image:url(&quot;${esc(v)}&quot;)"></div><div class="f-img-r"><input id="${id}" type="text" data-path="${path}" value="${esc(String(v).startsWith('data:') ? '(feltöltött kép)' : v)}" placeholder="Kép URL (https://…)"><label class="btn-s">Kép feltöltése…<input type="file" accept="image/*" data-upload="${path}" hidden></label></div></div></div>`;
    case 'list':
      return `<div class="f f-list">${lab}${(v || []).map((it, i) => listItemHTML(f, it, i, path)).join('')}<button type="button" class="btn-add" data-li="add" data-list="${path}">+ ${esc(f.addL || 'Új elem')}</button></div>`;
  }
  return '';
}
function itemLabel(f, it, i) {
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
  return fields.map(f => { const h = fieldHTML(f, e[f.k], f.k, markHTML(b, f.k)); return f.k in ovOf(b, dev) ? h.replace(/^<div class="f/, '<div class="f ov') : h; }).join('');
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
<div class="sec"><div class="sec-h">Színpaletták</div><div class="pals">${PALETTES.map((p, i) => `<button type="button" class="pal" data-pal="${i}"><i><span style="background:${p.bg}"></span><span style="background:${p.primary}"></span><span style="background:${p.text}"></span></i>${p.n}</button>`).join('')}</div></div>
<div class="sec"><div class="sec-h">Téma és SEO</div>${PAGE_FIELDS.map(f => fieldHTML(f, S.page[f.k], f.k)).join('')}<div style="height:8px"></div></div>
<div class="sec"><div class="sec-h">Oldal szerkezete (${S.blocks.length} blokk)</div><div class="outline">${S.blocks.map(x => `<div class="ol-item" data-goto="${x.id}"><span>${esc(BLOCKS[x.type].icon)}</span>${esc(BLOCKS[x.type].name)}${x.p._id ? ` <small style="opacity:.5">#${esc(x.p._id)}</small>${idWarn(x.p._id, x.id) ? ' <small class="dup" title="Ugyanez az ID több blokknál is szerepel">⚠ ismétlődő ID</small>' : ''}` : ''}</div>`).join('') || '<div class="ol-item">–</div>'}</div></div></div>`;
  } else {
    const d = BLOCKS[b.type];
    insp.dataset.target = b.id;
    insp.innerHTML = `<div class="panel-h"><span class="ph-t"><span style="color:var(--acc2)">${esc(d.icon)}</span>${esc(d.name)}</span><span class="ph-b"><button type="button" data-bact="dup" title="Duplikálás">⧉</button><button type="button" class="del" data-bact="del" title="Törlés">🗑</button><button type="button" data-bact="close" title="Bezárás (Esc)">✕</button></span></div>
<div class="insp-body"><div class="sec"><div class="sec-h">Tartalom <span class="sec-tag">🔗 minden nézetben közös</span></div>${blockFields(b, [...d.fields, ...COMMON_FIELDS].filter(f => !isLook(f)))}<div style="height:8px"></div></div>
<div class="sec look"><div class="sec-h">Megjelenés <span class="sec-tag">nézetenként állítható</span></div>${scopeBar(b)}${blockFields(b, [...d.fields, ...COMMON_FIELDS].filter(isLook))}<div style="height:8px"></div></div></div>`;
  }
  insp.insertAdjacentHTML('beforeend', anchorList());
  if (keep) $('.insp-body', insp).scrollTop = keep;
}

function setField(path, v, key) {
  const tgt = insp.dataset.target;
  snap(key);
  if (tgt === 'page') { S.page[path] = v; applyPage(); }
  else {
    const b = getB(tgt); if (!b) return;
    const had = JSON.stringify(b.r || {});
    writeVal(b, path, v); refreshBlock(b.id);
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
  const key = path.split('.').pop();
  if (el.type === 'text' && (key === '_id' || isLinkKey(key))) {   // # / ékezet / szóköz javítása gépelés közben
    const nv = key === '_id' ? anchorId(v, true) : fixHref(v, true);
    if (nv !== v) { const pos = Math.max(0, el.selectionStart - (v.length - nv.length)); el.value = nv; el.setSelectionRange(pos, pos); v = nv; }
  }
  setField(path, v, insp.dataset.target + ':' + path);
  const warn = el.parentElement.querySelector('.f-warn');
  if (warn) warn.textContent = key === '_id' ? idWarn(v, sel) : linkWarn(v);
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
  const ovr = t.closest('[data-ovreset]');
  if (ovr) { e.preventDefault(); const b = getB(sel); snap(); delete b.r[curDev()][ovr.dataset.ovreset]; if (!ovCount(b, curDev())) delete b.r[curDev()]; refreshBlock(b.id); renderInspector(); save(); return; }
  const sc = t.closest('.scope-sw [data-scope]');
  if (sc) { setScope(sc.dataset.scope); return; }
  if (t.closest('[data-ovresetall]')) { const b = getB(sel); snap(); delete b.r[curDev()]; refreshBlock(b.id); renderInspector(); save(); toast(`Eltérések törölve – ${DEV_N[curDev()]} nézet most a közös értékeket mutatja.`); return; }
  const pal = t.closest('[data-pal]');
  if (pal) { const p = PALETTES[pal.dataset.pal]; snap(); Object.assign(S.page, { primary: p.primary, text: p.text, bg: p.bg }); applyPage(); renderInspector(); save(); return; }
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
  const navH = nav ? Math.max(...DEVS.map(d => { const e = eff(nav, d); return e._pt + e._pb + 44; })) : 0;
  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pg.title)}</title>
${pg.desc ? `<meta name="description" content="${esc(pg.desc)}">\n` : ''}<meta name="generator" content="WEBEKI">
${fu ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="${esc(fu)}">\n` : ''}<style>
html{scroll-behavior:smooth${navH ? `;scroll-padding-top:${navH}px` : ''}}body{margin:0}
@media (min-width:1025px){.wk-only:not(.wk-on-d){display:none!important}}
@media (min-width:601px) and (max-width:1024px){.wk-only:not(.wk-on-t){display:none!important}}
@media (max-width:600px){.wk-only:not(.wk-on-m){display:none!important}}
.wk-page{${pageVars(pg)}min-height:100vh}
${PAGE_CSS.trim()}
</style>
</head>
<body>
<div class="wk-page">
${S.blocks.map(exportBlock).filter(Boolean).join('\n')}
</div>
</body>
</html>
`;
}
/* ha egy blokk nézetenként eltér, minden különböző változat bekerül, és CSS dönti el, melyik látszik */
function exportBlock(b) {
  const groups = new Map();
  DEVS.forEach(d => {
    const e = eff(b, d); if (e._hide) return;
    const key = renderBlock({ ...b, p: { ...e, _id: '' } }, false);
    if (!groups.has(key)) groups.set(key, { e, devs: [] });
    groups.get(key).devs.push(d);
  });
  if (!groups.size) return '';
  if (groups.size === 1 && [...groups.values()][0].devs.length === 3) return renderBlock({ ...b, p: [...groups.values()][0].e }, false);
  const id = b.p._id, multi = groups.size > 1;
  const out = [...groups.values()].map(({ e, devs }) => renderBlock(
    { ...b, id: b.id + (multi ? '-' + devs.map(d => DEV_S[d]).join('') : ''), p: { ...e, _id: multi ? '' : e._id } }, false,
    'wk-only ' + devs.map(d => 'wk-on-' + DEV_S[d].toLowerCase()).join(' '))).join('\n');
  return multi && id && b.type !== 'navbar' ? `<div id="${esc(id)}">\n${out}\n</div>` : out;
}
const slug = s => (s || 'weboldal').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'weboldal';
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('#btnExport').onclick = () => { download('index.html', buildHTML(), 'text/html'); toast('Kész: <b>index.html</b> – töltsd fel bármilyen tárhelyre.'); };
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
  const t = e.target.closest('[data-tpl]');
  if (t) { snap(); S = fromTemplate(t.dataset.tpl); sel = null; modal.hidden = true; refreshAll(); $('#stage').scrollTop = 0; toast('Új oldal létrehozva. (Ctrl+Z visszahozza az előzőt)'); }
});
$('#btnNew').onclick = () => openModal(`<div class="m-h">Új oldal – válassz kiinduló sablont<button data-m="x">✕</button></div>
<div class="tpl-grid">${Object.entries(TEMPLATES).map(([k, t]) => `<button class="tpl" data-tpl="${k}"><div class="tpl-prev">${t.blocks.map(x => { const ty = Array.isArray(x) ? x[0] : x; return `<i class="${ty === 'hero' ? 'hero' : ty === 'footer' ? 'dark' : ''}">${esc(BLOCKS[ty].name)}</i>`; }).join('') || '<span class="none">üres</span>'}</div><b>${t.n}</b><small>${t.d}</small></button>`).join('')}</div>
<p class="m-note">A jelenlegi oldal lecserélődik – a Ctrl+Z visszahozza.</p>`);
$('#btnHelp').onclick = () => openModal(`<div class="m-h">Hogyan működik?<button data-m="x">✕</button></div><div class="m-body">
<p><b>1. Blokkok</b> – húzd a bal oldali modulokat az oldalra, vagy kattints rájuk. A vásznon a blokk jobb felső sarkában: áthelyezés ⠿, fel/le, duplikálás, törlés.</p>
<p><b>2. Paraméterezés</b> – kattints egy blokkra: jobb oldalt megjelennek a beállításai (szövegek, képek, színek, oszlopok, térköz, listaelemek). Üres területre kattintva az <i>oldal beállításait</i> látod (betűtípus, színpaletta, SEO).</p>
<p><b>3. Közvetlen szerkesztés</b> – a szövegekre kattintva helyben is átírhatod őket.</p>
<p><b>4. Nézetek</b> – fent válthatsz asztali / tablet / mobil nézet között. A <b>tartalom</b> (szövegek, képek, linkek, listaelemek, blokkok hozzáadása/törlése/sorrendje) mindig <b>minden nézetben közös</b>. A <b>megjelenés</b> (igazítás, oszlopok, elrendezés, színek, térközök, elrejtés) nézetenként is állítható: <b style="color:#9d86ff">🔗 Minden nézet</b> – mindhárom nézetben változik; <b style="color:#f59e0b">📌 Csak ez a nézet</b> – csak az aktuálisban (narancs jelzi). Az eltérő mezők mellett <b>D/T/M</b> jelölés, a ↺ visszaállítja a közös értékre. Pl. asztalin balra, mobilon középre igazított ikonok. Billentyű: <kbd>L</kbd></p>
<p><b>Horgonyok (menüből ugrás egy szakaszra)</b> – a blokk <i>Horgony (ID)</i> mezőjébe: <code>rolunk</code> (# nélkül), a menüpont linkjébe: <code>#rolunk</code> – a link mezőben legördülő listából is választhatsz. A szerkesztőben a linkek nem ugranak el (hogy a feliratot átírhasd); kipróbálni <kbd>Ctrl/⌘</kbd> + kattintással vagy az Előnézetben lehet.</p>
<p><b>5. Export</b> – a <i>HTML export</i> egyetlen önálló <code>index.html</code>-t ad, amit bármilyen tárhelyre feltölthetsz (Netlify, GitHub Pages, saját tárhely). A <i>Mentés</i> projekt fájlt készít, amit később újra megnyithatsz.</p>
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
  else if (e.key === 'Escape') select(null);
  else if (k === 'l' && !mod) setScope(scope === 'all' ? 'only' : 'all');
  else if (e.altKey && sel && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); moveBlock(sel, idxOf(sel) + (e.key === 'ArrowUp' ? -1 : 1)); }
});
$('#stage').addEventListener('click', e => { if (e.target.id === 'stage') select(null); });

/* ---------------- toast ---------------- */
function toast(html, type = '') {
  const t = document.createElement('div'); t.className = 'toast ' + type; t.innerHTML = html;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), type === 'err' ? 6000 : 3500);
}

/* ---------------- indulás ---------------- */
$('#pageCss').textContent = PAGE_CSS;
$('#ver').textContent = 'v' + VERSION;
updScope(); renderLib(); applyPage(); renderCanvas(); renderInspector(); updUndo(); save();
