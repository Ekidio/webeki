/* =========================================================================
   WEBEKI MOBIL – telefonos vezérlés
   A szerkesztő motorja a közös ../js/app.js; ez a fájl csak a telefonos
   kezelést teszi rá: alulról felhúzható panelek, alsó gombsor, ⋯ menü.
   ========================================================================= */
(() => {
  const libSheet = $('#libSheet'), inspSheet = $('#inspSheet');
  const sheets = { lib: libSheet, insp: inspSheet };
  const ORDER = ['closed', 'peek', 'half', 'full'];

  function setSheet(name, state) {
    const el = sheets[name];
    el.dataset.state = state;
    if (state !== 'closed') {                           // egyszerre csak egy panel legyen nyitva
      const other = name === 'lib' ? 'insp' : 'lib';
      sheets[other].dataset.state = 'closed';
    }
    const open = Object.values(sheets).find(s => s.dataset.state !== 'closed');
    document.body.dataset.sheet = open ? open.dataset.state : '';
    $$('#mbar [data-m]').forEach(b => b.classList.toggle('on',
      (b.dataset.m === 'lib' && libSheet.dataset.state !== 'closed') || (b.dataset.m === 'page' && inspSheet.dataset.state !== 'closed' && !sel)));
  }
  const isEditing = () => !!document.activeElement?.closest?.('#page [data-edit]');

  /* --- a motor kijelölő és blokk-hozzáadó függvényeit kiegészítjük a panelek nyitásával --- */
  let keepPage = false;
  const _select = select;
  select = function (id, scroll) {
    _select(id, scroll);
    if (id) setSheet('insp', isEditing() ? 'peek' : (inspSheet.dataset.state === 'full' ? 'full' : 'half'));
    else if (!keepPage) setSheet('insp', 'closed');
  };
  const _addBlock = addBlock;
  addBlock = function (type, index) {
    _addBlock(type, index);
    setSheet('lib', 'closed');
    setSheet('insp', 'peek');
    toast('Blokk hozzáadva – koppints rá a beállításokhoz.');
  };
  const _delBlock = delBlock;
  delBlock = function (id) { _delBlock(id); if (!sel) setSheet('insp', 'closed'); };

  /* --- alsó gombsor --- */
  $('#mbar').addEventListener('click', e => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    if (b.dataset.m === 'lib') setSheet('lib', libSheet.dataset.state === 'closed' ? 'half' : 'closed');
    if (b.dataset.m === 'page') {
      if (inspSheet.dataset.state !== 'closed' && !sel) { setSheet('insp', 'closed'); return; }
      keepPage = true; select(null); keepPage = false;
      setSheet('insp', 'half');
    }
  });
  $('#lib').addEventListener('click', e => { if (e.target.closest('[data-close=lib]')) setSheet('lib', 'closed'); });

  /* --- szöveg szerkesztésekor a panel lehúzódik, hogy a billentyűzet mellett látszódjon a szöveg --- */
  $('#page').addEventListener('focusin', e => {
    if (e.target.closest('[data-edit]') && inspSheet.dataset.state !== 'closed') setSheet('insp', 'peek');
  });

  /* --- panel húzása a fogantyúnál (fel: nagyobb, le: kisebb / bezár), koppintás: fél ↔ teljes --- */
  $$('.grab').forEach(g => {
    const name = g.dataset.grab, el = sheets[name];
    let y0 = null, base = 0, moved = 0;
    g.addEventListener('pointerdown', e => {
      y0 = e.clientY; moved = 0; g.setPointerCapture(e.pointerId);
      base = el.getBoundingClientRect().top - (window.innerHeight - el.offsetHeight);
      el.classList.add('drag');
    });
    g.addEventListener('pointermove', e => {
      if (y0 === null) return;
      moved = e.clientY - y0;
      el.style.transform = `translateY(${Math.max(0, base + moved)}px)`;
    });
    const end = () => {
      if (y0 === null) return;
      y0 = null; el.classList.remove('drag'); el.style.transform = '';
      const i = ORDER.indexOf(el.dataset.state);
      if (Math.abs(moved) < 8) setSheet(name, el.dataset.state === 'full' ? 'half' : 'full');
      else if (moved > 60) setSheet(name, ORDER[Math.max(0, i - (moved > 260 ? 2 : 1))]);
      else if (moved < -60) setSheet(name, ORDER[Math.min(3, i + 1)]);
      if (name === 'insp' && el.dataset.state === 'closed' && sel) _select(null);
    };
    g.addEventListener('pointerup', end);
    g.addEventListener('pointercancel', end);
  });
  /* a peek állapotú panel fejlécére koppintva felnyílik */
  inspSheet.addEventListener('click', e => {
    if (inspSheet.dataset.state === 'peek' && e.target.closest('.panel-h') && !e.target.closest('button')) setSheet('insp', 'half');
  });

  /* --- ⋯ menü --- */
  const menu = $('#mmenu');
  $('#btnMenu').addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; });
  menu.addEventListener('click', e => { if (e.target.closest('button:not([data-scope]),a')) menu.hidden = true; });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('#btnMenu')) menu.hidden = true; });

  /* --- telefonos súgó --- */
  $('#btnHelp').onclick = () => openModal(`<div class="m-h">WEBEKI MOBIL – így működik<button data-m="x">✕</button></div><div class="m-body">
<p><b>＋ Blokk</b> – lent a gombsorban: koppints egy blokkra, és az oldalra kerül (a kijelölt blokk után).</p>
<p><b>Beállítás</b> – koppints egy blokkra az oldalon: alulról felcsúszik a beállításai panelje. A fogantyút (a kis csíkot) húzd fel a teljes mérethez, le a bezáráshoz.</p>
<p><b>Szöveg átírása</b> – koppints a szövegre, és írd át; a panel ilyenkor lehúzódik.</p>
<p><b>Áthelyezés, törlés</b> – a kijelölt blokk jobb felső sarkában: ↑ ↓ mozgatás, ⧉ másolás, ✕ törlés.</p>
<p><b>⚙ Oldal</b> – színek, betűtípus, gombok, a teljes oldal szerkezete. <b>🎲 Random</b> – új téma egy koppintással.</p>
<p><b>Nézetek</b> – fent: asztali / tablet / mobil. A tartalom mindenhol közös, a megjelenés nézetenként is állítható (⋯ menü → Megjelenés szerkesztése).</p>
<p><b>⇩ Export</b> – ZIP vagy egyetlen HTML fájl, bármilyen tárhelyre feltölthető. A ⋯ menüben: új oldal sablonból, projekt mentése/megnyitása, előnézet.</p>
<p style="color:var(--ui-tx3)">A munkád automatikusan mentődik ebbe a böngészőbe. A projektfájl (Mentés) asztali WEBEKI-ben is megnyitható, és fordítva.</p></div>`);

  setSheet('insp', 'closed');
})();
