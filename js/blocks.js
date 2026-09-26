/* =========================================================================
   WEBEKI – blokk (modul) könyvtár
   Minden blokk: név, kategória, ikon, mezők (paraméterek), alapértékek, render.
   Új blokk hozzáadása: tegyél egy új bejegyzést a BLOCKS objektumba.
   ========================================================================= */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl = s => esc(s).replace(/\n/g, '<br>');
const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
const IMG = (seed, w = 1200, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const ytId = u => (String(u || '').match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];

/* Mezők két csoportja:
   - TARTALOM (text, textarea, html, image, list, …): mindig minden nézetben közös
   - MEGJELENÉS (select, range, color + a:1 jelölésű mezők): nézetenként külön állítható */
/* ---- közös mezők, minden blokkban a "Stílus & térköz" szekcióban ---- */
const isG = p => !p._bgLink && p._bgType === 'gradient', isI = p => !p._bgLink && p._bgType === 'image';
/* határvonal formák: a 1200×100-as dobozban a SZOMSZÉD blokk színével kitöltött rész */
const SHAPES = {
  wave: 'M0 55C150 95 350 95 600 55S1050 15 1200 55V100H0Z',
  waves: 'M0 60C100 90 200 90 300 60S500 30 600 60 800 90 900 60 1100 30 1200 60V100H0Z',
  slant: 'M0 100L1200 0V100Z',
  curve: 'M0 100Q600 -60 1200 100Z',
  arc: 'M0 0Q600 160 1200 0V100H0Z',
  peak: 'M0 100L600 0L1200 100Z',
  zigzag: 'M0 100' + Array.from({ length: 25 }, (_, i) => `L${i * 50} ${i % 2 ? 25 : 75}`).join('') + 'L1200 100Z',
};
const DIVIDERS = [['none', 'Nincs (egyenes)'], ['wave', 'Hullám'], ['waves', 'Hullámok (sűrű)'], ['slant', 'Ferde'], ['curve', 'Ív (domború)'], ['arc', 'Ív (homorú)'], ['peak', 'Csúcs'], ['zigzag', 'Cikcakk']];
/* blokk alap háttérszíne, ha nincs megadva (a CSS alapértékeivel egyezően) */
const BG_DEFAULT = { cta: 'var(--wk-primary)', footer: 'color-mix(in srgb,var(--wk-text) 94%,var(--wk-bg))', hero: '#111827', testimonials: 'color-mix(in srgb,var(--wk-primary) 6%,var(--wk-bg))', navbar: 'var(--wk-bg)' };
const FG_DEFAULT = { cta: 'var(--wk-onp,#fff)', hero: '#fff', footer: 'var(--wk-bg)' };
/* egy blokk "széle" milyen színű – ehhez igazodik a szomszéd határvonala és lágy átmenete */
function bgColorOf(p, type) {
  if (p._bgType === 'gradient') return p._g2 || 'color-mix(in srgb,var(--wk-primary) 45%,#000)';
  return p._bg || BG_DEFAULT[type] || (p._bgType === 'image' ? '#111827' : 'var(--wk-bg)');
}
/* összefüggő háttér csoport burkolója: a vezető blokk háttere a teljes csoporton */
function groupStyle(p, type) {
  return `background-color:${p._bgType === 'gradient' ? 'transparent' : (p._bg || BG_DEFAULT[type] || 'transparent')};color:${p._fg || FG_DEFAULT[type] || 'inherit'};${bgStyle(p)}`;
}
const COMMON_FIELDS = [
  { t: 'head', a: 1, l: 'Háttér' },
  { k: '_bgLink', t: 'check', sec: 'look', re: 1, l: 'Folytatja az előző blokk hátterét', hint: 'a két blokk egy közös hátteret kap, ami egyben fut végig rajtuk (minden nézetben)' },
  { t: 'note', sec: 'look', when: p => p._bgLink, l: 'A háttér a csoport első blokkjából folytatódik – ott állíthatod.', btn: 'Ugrás a csoport első blokkjához', act: 'goleader' },
  { k: '_bgType', t: 'select', l: 'Háttér típusa', re: 1, when: p => !p._bgLink, o: [['color', 'Szín'], ['gradient', 'Színátmenet (gradiens)'], ['image', 'Kép']] },
  { k: '_bg', t: 'color', l: 'Háttérszín', when: p => !p._bgLink && p._bgType !== 'gradient' },
  { k: '_gKind', t: 'select', l: 'Átmenet formája', re: 1, when: isG, o: [['linear', 'Egyenes (szöggel forgatható)'], ['radial', 'Kör alakú (középről kifelé)']] },
  { k: '_g1', t: 'color', l: '1. szín', when: isG, ph: 'fő szín' },
  { k: '_g2', t: 'color', l: '2. szín', when: isG, ph: 'fő szín sötétebb' },
  { k: '_gMid', t: 'range', l: 'Arány (hol vált át a két szín)', min: 5, max: 95, unit: '%', when: isG },
  { k: '_gAng', t: 'range', l: 'Forgatás (szög)', min: 0, max: 360, step: 5, unit: '°', when: p => isG(p) && p._gKind !== 'radial' },
  { k: '_bgImg', t: 'image', a: 1, l: 'Háttérkép', when: isI },
  { k: '_bgFit', t: 'select', l: 'Kép mérete', re: 1, when: isI, o: [['cover', 'Kitölti a blokkot (vágással)'], ['fitw', 'Szélességre illesztve'], ['fith', 'Magasságra illesztve'], ['orig', 'Eredeti méret']] },
  { k: '_bgX', t: 'range', l: 'Vízszintes pozíció (bal ↔ jobb)', min: 0, max: 100, unit: '%', when: isI },
  { k: '_bgY', t: 'range', l: 'Függőleges pozíció (fent ↔ lent)', min: 0, max: 100, unit: '%', when: isI },
  { k: '_bgRep', t: 'check', a: 1, l: 'Ismétlés (csempézve)', when: p => isI(p) && p._bgFit !== 'cover' },
  { k: '_bgFix', t: 'check', a: 1, l: 'Rögzített kép görgetéskor (parallax hatás)', when: isI },
  { k: '_bgOvC', t: 'color', l: 'Fedőszín a képen', when: isI, ph: 'fekete' },
  { k: '_bgOv', t: 'range', l: 'Fedőszín erőssége', min: 0, max: 90, unit: '%', when: isI },
  { t: 'head', a: 1, l: 'Határ a szomszéd blokkokkal' },
  { k: '_divTop', t: 'select', l: 'Felső határvonal', re: 1, o: DIVIDERS },
  { k: '_divTopH', t: 'range', l: 'Felső határvonal magassága', min: 16, max: 240, step: 4, unit: 'px', when: p => p._divTop !== 'none' },
  { k: '_divTopF', t: 'check', a: 1, l: 'Felső határvonal tükrözése', when: p => p._divTop !== 'none' },
  { k: '_divTopC', t: 'color', l: 'Felső határvonal színe', ph: 'az előző blokk színe', when: p => p._divTop !== 'none' },
  { k: '_divBot', t: 'select', l: 'Alsó határvonal', re: 1, o: DIVIDERS },
  { k: '_divBotH', t: 'range', l: 'Alsó határvonal magassága', min: 16, max: 240, step: 4, unit: 'px', when: p => p._divBot !== 'none' },
  { k: '_divBotF', t: 'check', a: 1, l: 'Alsó határvonal tükrözése', when: p => p._divBot !== 'none' },
  { k: '_divBotC', t: 'color', l: 'Alsó határvonal színe', ph: 'a következő blokk színe', when: p => p._divBot !== 'none' },
  { k: '_fadeTop', t: 'range', l: 'Lágy átmenet az előző blokkból', min: 0, max: 400, step: 10, unit: 'px', re: 1 },
  { k: '_fadeC', t: 'color', l: 'Átmenet színe', ph: 'az előző blokk színe', when: p => p._fadeTop > 0 },
  { k: '_pull', t: 'range', l: 'Átlógás: tartalom felcsúsztatása az előző blokkba', min: 0, max: 300, step: 4, unit: 'px' },
  { t: 'head', a: 1, l: 'Gombok', needs: 'btns' },
  { k: '_btnC', t: 'color', l: 'Gombok színe ebben a blokkban', ph: 'téma szerint', hint: 'üresen: az Oldal beállítások → Színek → Gomb színe', needs: 'btns' },
  { t: 'head', a: 1, l: 'Szöveg és térköz' },
  { k: '_fg', t: 'color', l: 'Szövegszín' },
  { k: '_pt', t: 'range', l: 'Felső térköz', min: 0, max: 240, step: 4, unit: 'px' },
  { k: '_pb', t: 'range', l: 'Alsó térköz', min: 0, max: 240, step: 4, unit: 'px' },
  { k: '_id', t: 'text', l: 'Horgony (ID)', hint: 'ide # nélkül: rolunk → a menüpont linkje: #rolunk' },
  { k: '_hide', t: 'check', a: 1, l: 'Blokk elrejtése', hint: 'pl. „Csak Mobil” módban: csak mobilon rejtett' },
  { t: 'head', a: 1, l: 'Animáció', play: 1 },
  { k: '_anim', t: 'select', l: 'Animáció', re: 1, o: [['none', 'Kikapcsolva'], ['up', 'Beúszás alulról'], ['down', 'Beúszás felülről'], ['left', 'Beúszás balról'], ['right', 'Beúszás jobbról'], ['fade', 'Előtűnés'], ['zoom', 'Nagyítás'], ['flip', 'Billenés']] },
  { k: '_animDur', t: 'range', l: 'Időtartam', min: 200, max: 2000, step: 50, unit: 'ms', when: p => p._anim !== 'none' },
  { k: '_animDelay', t: 'range', l: 'Késleltetés', min: 0, max: 1500, step: 50, unit: 'ms', when: p => p._anim !== 'none' },
  { k: '_animSt', t: 'check', a: 1, l: 'Elemek egymás után (lépcsőzetesen)', when: p => p._anim !== 'none' },
  { k: '_animRep', t: 'check', a: 1, l: 'Ismétlés minden odagörgetéskor', when: p => p._anim !== 'none' },
];
const COMMON_DEFAULTS = {
  _bgLink: false, _divTop: 'none', _divTopH: 80, _divTopF: false, _divTopC: '', _divBot: 'none', _divBotH: 80, _divBotF: false, _divBotC: '',
  _fadeTop: 0, _fadeC: '', _pull: 0,
  _bgType: 'color', _gKind: 'linear', _g1: '', _g2: '', _gMid: 50, _gAng: 135,
  _bgImg: '', _bgFit: 'cover', _bgX: 50, _bgY: 50, _bgRep: false, _bgFix: false, _bgOvC: '', _bgOv: 0,
  _btnC: '', _bg: '', _fg: '', _pt: 96, _pb: 96, _id: '', _hide: false, _anim: 'none', _animDur: 700, _animDelay: 0, _animSt: true, _animRep: false };

/* ---- gyakori mezők ---- */
const F = {
  title: { k: 'title', t: 'text', l: 'Cím' },
  subtitle: { k: 'subtitle', t: 'textarea', l: 'Alcím' },
  cols: { k: 'cols', t: 'select', l: 'Oszlopok', hint: 'tableten max. 2, mobilon 1 automatikusan – „Csak ez a nézet” módban rögzíthető', o: [['2', '2 oszlop'], ['3', '3 oszlop'], ['4', '4 oszlop']] },
  btn: (k, l) => [
    { k: k + 'Text', t: 'text', l: l + ' – felirat', hint: 'üresen hagyva nem jelenik meg' },
    { k: k + 'Href', t: 'text', l: l + ' – link' },
  ],
};

const head = (p, E, center = true) => (p.title || p.subtitle)
  ? `<div class="wk-head${center ? ' c' : ''}">${p.title ? `<h2 class="wk-h2"${E('title')}>${esc(p.title)}</h2>` : ''}${p.subtitle ? `<p class="wk-sub"${E('subtitle', 1)}>${nl(p.subtitle)}</p>` : ''}</div>`
  : '';
/* rács oszlop osztály; ha az oszlopszám nézetenként felül van írva (fx), a reszponzív szabály nem írja felül */
const gc = p => 'c' + p.cols + (p._ov && 'cols' in p._ov ? ' fx' : '');
/* közösségi ikonok mezői és HTML-je (menüsor, kapcsolat, lábléc) */
F.social = [
  { k: 'social', t: 'list', l: 'Közösségi oldalak', addL: 'Új közösségi oldal', item: { net: 'instagram', url: 'https://instagram.com/' },
    lab: it => (SOCIAL[it.net] || {}).n || 'Közösségi oldal',
    fields: [{ k: 'net', t: 'select', l: 'Oldal', o: Object.entries(SOCIAL).map(([k, v]) => [k, v.n]) }, { k: 'url', t: 'text', l: 'Link (a profilod címe)' }] },
  { k: 'socStyle', t: 'select', l: 'Közösségi ikonok stílusa', o: [['plain', 'Csak ikon'], ['circle', 'Kör alapon'], ['square', 'Négyzet alapon']] },
];
const SOC = (...nets) => nets.map(net => ({ net, url: { facebook: 'https://facebook.com/', instagram: 'https://instagram.com/', youtube: 'https://youtube.com/', tiktok: 'https://tiktok.com/' }[net] || '#' }));
const socialHTML = p => {
  const list = (p.social || []).filter(s => SOCIAL[s.net]);
  return list.length ? `<div class="wk-social ${p.socStyle || 'plain'}">${list.map(s => `<a href="${esc(s.url || '#')}" target="_blank" rel="noopener" aria-label="${SOCIAL[s.net].n}" title="${SOCIAL[s.net].n}">${svg(SOCIAL[s.net].d)}</a>`).join('')}</div>` : '';
};
const btn = (p, E, k, cls = '') => p[k + 'Text']
  ? `<a class="wk-btn ${cls}" href="${esc(p[k + 'Href'] || '#')}"${E(k + 'Text')}>${esc(p[k + 'Text'])}</a>` : '';

const BLOCKS = {

  /* ======================= FEJLÉC ======================= */
  navbar: {
    btns: true,
    name: 'Menüsor', cat: 'Fejléc', icon: '☰', desc: 'Logó, menüpontok, gomb, mobil menü',
    tag: 'nav',
    fields: [
      { k: 'logo', t: 'text', l: 'Logó szöveg' },
      { k: 'logoImg', t: 'image', l: 'Logó kép (opcionális)' },
      { k: 'links', t: 'list', l: 'Menüpontok', addL: 'Új menüpont', item: { label: 'Menüpont', href: '#' },
        fields: [{ k: 'label', t: 'text', l: 'Felirat' }, { k: 'href', t: 'text', l: 'Link', hint: 'válassz a listából (#rolunk) vagy https://… – a vásznon Ctrl/⌘+kattintással kipróbálható' }] },
      ...F.btn('btn', 'Gomb'),
      { k: 'sticky', t: 'check', a: 1, re: 1, l: 'Görgetéskor fent marad (sticky)' },
      { k: 'line', t: 'check', a: 1, l: 'Vékony elválasztó vonal a menü alatt' },
      { k: 'over', t: 'check', a: 1, re: 1, l: 'Átlátszó menü a nyitókép fölött', hint: 'a következő blokk (pl. a hero) a menü alá csúszik, és egy háttérnek látszanak' },
      { k: 'scrollBg', t: 'color', l: 'Menü háttere görgetés közben', ph: 'az oldal háttere', when: p => p.over && p.sticky },
      { k: 'scrollFg', t: 'color', l: 'Menü szövegszíne görgetés közben', ph: 'az oldal szövegszíne', when: p => p.over && p.sticky },
      { k: 'glass', t: 'check', a: 1, l: 'Üveghatás görgetés közben (elmosott háttér)', when: p => p.over && p.sticky },
      ...F.social,
    ],
    defaults: {
      _pt: 18, _pb: 18, logo: 'WEBEKI', logoImg: '', sticky: true, line: false, over: false, scrollBg: '', scrollFg: '', glass: true, btnText: 'Kapcsolat', btnHref: '#kapcsolat', social: [], socStyle: 'plain',
      links: [{ label: 'Szolgáltatások', href: '#szolgaltatasok' }, { label: 'Rólunk', href: '#rolunk' }, { label: 'Árak', href: '#arak' }, { label: 'GYIK', href: '#gyik' }],
    },
    cls: p => [p.sticky && 'sticky', p.line && !p.over && 'line', p.over && 'over', p.over && p.glass && 'glass'].filter(Boolean).join(' '),
    style: p => p.over ? `--wk-navh:${p._pt + p._pb + 44}px;--nav-sbg:${p.scrollBg || 'var(--wk-bg)'};--nav-sfg:${p.scrollFg || 'var(--wk-text)'}` : '',
    render: (p, E, b) => `<div class="wk-in wk-nav-row">
<a class="wk-logo" href="#">${p.logoImg ? `<img src="${esc(p.logoImg)}" alt="">` : ''}${p.logo ? `<span${E('logo')}>${esc(p.logo)}</span>` : ''}</a>
<input type="checkbox" id="nt-${b.id}" class="wk-nt"><label for="nt-${b.id}" class="wk-burger" aria-label="Menü"><span></span></label>
<div class="wk-links">${p.links.map((l, i) => `<a href="${esc(l.href)}"${E(`links.${i}.label`)}>${esc(l.label)}</a>`).join('')}${socialHTML(p)}${btn(p, E, 'btn', 'sm')}</div>
</div>`,
  },

  hero: {
    btns: true,
    name: 'Nyitó (Hero)', cat: 'Fejléc', icon: '◧', desc: 'Nagy cím, háttérkép, gombok',
    fields: [
      { k: 'title', t: 'textarea', l: 'Főcím', rows: 2 },
      { k: 'text', t: 'textarea', l: 'Bevezető szöveg' },
      ...F.btn('btn1', 'Fő gomb'), ...F.btn('btn2', 'Második gomb'),
      { k: 'align', t: 'select', l: 'Igazítás', o: [['center', 'Középre'], ['left', 'Balra']] },
      { k: 'height', t: 'range', l: 'Min. magasság', min: 0, max: 100, unit: 'vh' },
    ],
    defaults: {
      _pt: 140, _pb: 140, title: 'Építs weboldalt\nkódolás nélkül', text: 'Rakd össze az oldaladat kész blokkokból, kattints bármire és írd át. Egyszerű, gyors és teljesen ingyenes.',
      btn1Text: 'Kezdjük el', btn1Href: '#szolgaltatasok', btn2Text: 'Tudj meg többet', btn2Href: '#rolunk',
      _bgType: 'image', _bgImg: IMG('webeki-hero', 1920, 1100), _bgOv: 55, align: 'center', height: 80,
    },
    style: p => `min-height:${p.height}vh`,
    render: (p, E) => `<div class="wk-in ${p.align}">
<h1 class="wk-h1"${E('title', 1)}>${nl(p.title)}</h1>
${p.text ? `<p class="wk-lead"${E('text', 1)}>${nl(p.text)}</p>` : ''}
<div class="wk-btns">${btn(p, E, 'btn1')}${btn(p, E, 'btn2', 'o')}</div>
</div>`,
  },

  /* ======================= TARTALOM ======================= */
  features: {
    name: 'Szolgáltatások', cat: 'Tartalom', icon: '▦', desc: 'Ikonos kártyák rácsban',
    fields: [F.title, F.subtitle, F.cols,
      { k: 'look', t: 'select', l: 'Kártya stílus', o: [['card', 'Kártya'], ['plain', 'Egyszerű']] },
      { k: 'align', t: 'select', l: 'Igazítás', o: [['left', 'Balra'], ['center', 'Középre']] },
      { k: 'items', t: 'list', l: 'Elemek', addL: 'Új elem', item: { icon: '⭐', title: 'Új elem', text: 'Rövid leírás.' },
        fields: [{ k: 'icon', t: 'icon', l: 'Ikon (emoji vagy rajzolt ikon)' }, { k: 'title', t: 'text', l: 'Cím' }, { k: 'text', t: 'textarea', l: 'Szöveg' }] },
    ],
    defaults: {
      _id: 'szolgaltatasok', title: 'Mit kapsz tőlünk?', subtitle: 'Minden, ami egy modern, gyors weboldalhoz kell.', cols: '3', look: 'card', align: 'left',
      items: [
        { icon: '⚡', title: 'Villámgyors', text: 'Tiszta HTML és CSS, felesleges kód nélkül. Az oldalad pillanatok alatt betölt.' },
        { icon: '📱', title: 'Mobilbarát', text: 'Minden blokk automatikusan alkalmazkodik telefonon és tableten is.' },
        { icon: '🎨', title: 'Testreszabható', text: 'Színek, betűtípusok, képek, szövegek – kattints és módosítsd.' },
      ],
    },
    cls: p => p.align === 'center' ? 'center' : '',
    render: (p, E) => `<div class="wk-in">${head(p, E)}<div class="wk-grid ${gc(p)}">${p.items.map((it, i) => `<div class="wk-card${p.look === 'plain' ? ' plain' : ''}">${it.icon ? `<div class="wk-ico"${/^i:/.test(it.icon) ? '' : E(`items.${i}.icon`)}>${icoHTML(it.icon)}</div>` : ''}<h3 class="wk-h3"${E(`items.${i}.title`)}>${esc(it.title)}</h3><p${E(`items.${i}.text`, 1)}>${nl(it.text)}</p></div>`).join('')}</div></div>`,
  },

  imageText: {
    btns: true,
    name: 'Kép + szöveg', cat: 'Tartalom', icon: '◨', desc: 'Kép az egyik, szöveg a másik oldalon',
    fields: [F.title, { k: 'text', t: 'textarea', l: 'Szöveg', rows: 5 },
      { k: 'bullets', t: 'textarea', l: 'Felsorolás', hint: 'soronként egy pont', rows: 4 },
      ...F.btn('btn', 'Gomb'),
      { k: 'img', t: 'image', l: 'Kép' },
      { k: 'imgPos', t: 'select', l: 'Kép helye', o: [['left', 'Balra'], ['right', 'Jobbra']] },
    ],
    defaults: {
      _id: 'rolunk', title: 'Rólunk', text: 'Egy kis csapat vagyunk, akik hisznek abban, hogy mindenkinek jár egy szép weboldal – drága licencek nélkül.',
      bullets: 'Több mint 10 év tapasztalat\nSzemélyes ügyfélszolgálat\nÁtlátható árazás', btnText: 'Ismerj meg minket', btnHref: '#kapcsolat',
      img: IMG('webeki-about', 1000, 750), imgPos: 'left',
    },
    render: (p, E) => `<div class="wk-in wk-split${p.imgPos === 'right' ? ' rev' : ''}">
<div class="wk-split-img">${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.title)}" loading="lazy">` : ''}</div>
<div><h2 class="wk-h2"${E('title')}>${esc(p.title)}</h2>${p.text ? `<p class="wk-txt"${E('text', 1)}>${nl(p.text)}</p>` : ''}${lines(p.bullets).length ? `<ul class="wk-bul">${lines(p.bullets).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${btn(p, E, 'btn')}</div>
</div>`,
  },

  stats: {
    name: 'Számok', cat: 'Tartalom', icon: '#', desc: 'Kiemelt számok, statisztika',
    fields: [F.title, F.cols, { k: 'items', t: 'list', l: 'Számok', addL: 'Új szám', item: { num: '100+', label: 'Címke' },
      fields: [{ k: 'num', t: 'text', l: 'Szám' }, { k: 'label', t: 'text', l: 'Címke' }] }],
    defaults: {
      _pt: 72, _pb: 72, title: '', cols: '4',
      items: [{ num: '1200+', label: 'Elégedett ügyfél' }, { num: '98%', label: 'Ajánlási arány' }, { num: '24/7', label: 'Elérhetőség' }, { num: '0 Ft', label: 'Licencdíj' }],
    },
    render: (p, E) => `<div class="wk-in">${head(p, E)}<div class="wk-grid ${gc(p)}">${p.items.map((it, i) => `<div class="wk-stat"><div class="wk-num"${E(`items.${i}.num`)}>${esc(it.num)}</div><div class="wk-stat-l"${E(`items.${i}.label`)}>${esc(it.label)}</div></div>`).join('')}</div></div>`,
  },

  text: {
    name: 'Szöveg', cat: 'Tartalom', icon: '¶', desc: 'Cím és formázott szöveg',
    fields: [F.title, { k: 'html', t: 'html', l: 'Tartalom', hint: 'HTML engedélyezett: <b>, <i>, <a href>, <h3>, <ul><li>, <p>' },
      { k: 'align', t: 'select', l: 'Igazítás', o: [['left', 'Balra'], ['center', 'Középre']] },
      { k: 'mw', t: 'range', l: 'Max. szélesség', min: 480, max: 1140, step: 20, unit: 'px' }],
    defaults: {
      title: 'Történetünk', align: 'left', mw: 760,
      html: '<p>Itt meséld el, <b>kik vagytok</b> és mit csináltok. Ez egy szabad szöveges blokk: használhatsz <a href="#">linkeket</a>, kiemelést és listákat is.</p>\n<ul>\n  <li>Első pont</li>\n  <li>Második pont</li>\n</ul>',
    },
    style: p => `--mw:${p.mw}px;text-align:${p.align}`,
    render: (p, E) => `<div class="wk-in">${p.title ? `<h2 class="wk-h2"${E('title')}>${esc(p.title)}</h2>` : ''}<div class="wk-rich">${p.html}</div></div>`,
  },

  faq: {
    name: 'GYIK', cat: 'Tartalom', icon: '?', desc: 'Lenyíló kérdés–válasz lista',
    fields: [F.title, F.subtitle, { k: 'items', t: 'list', l: 'Kérdések', addL: 'Új kérdés', item: { q: 'Új kérdés?', a: 'Válasz.' },
      fields: [{ k: 'q', t: 'text', l: 'Kérdés' }, { k: 'a', t: 'textarea', l: 'Válasz' }] }],
    defaults: {
      _id: 'gyik', title: 'Gyakori kérdések', subtitle: '',
      items: [
        { q: 'Tényleg ingyenes?', a: 'Igen. Nincs előfizetés, nincs licenc. Az exportált HTML a tiéd.' },
        { q: 'Hol tudom közzétenni az oldalt?', a: 'Bárhol: saját tárhely, GitHub Pages, Netlify, Cloudflare Pages – csak töltsd fel az exportált fájlt.' },
        { q: 'Kell hozzá programozni?', a: 'Nem. Blokkokat húzol, szövegeket írsz át, színeket választasz.' },
      ],
    },
    render: (p, E) => `<div class="wk-in">${head(p, E)}${p.items.map((it, i) => `<details><summary>${esc(it.q)}</summary><p${E(`items.${i}.a`, 1)}>${nl(it.a)}</p></details>`).join('')}</div>`,
  },

  /* ======================= MÉDIA ======================= */
  gallery: {
    name: 'Galéria', cat: 'Média', icon: '▣', desc: 'Képrács felirattal',
    fields: [F.title, F.subtitle, F.cols,
      { k: 'ratio', t: 'select', l: 'Képarány', o: [['1/1', 'Négyzet'], ['4/3', '4:3'], ['16/9', '16:9'], ['3/4', 'Álló 3:4']] },
      { k: 'items', t: 'list', l: 'Képek', addL: 'Új kép', item: { img: IMG('webeki-new', 800, 600), caption: '' },
        fields: [{ k: 'img', t: 'image', l: 'Kép' }, { k: 'caption', t: 'text', l: 'Felirat' }] }],
    defaults: {
      title: 'Munkáink', subtitle: 'Néhány kedvenc projektünk az elmúlt évekből.', cols: '3', ratio: '4/3',
      items: [1, 2, 3, 4, 5, 6].map(n => ({ img: IMG('webeki-g' + n, 800, 600), caption: n <= 2 ? `Projekt ${n}` : '' })),
    },
    style: p => `--ar:${p.ratio}`,
    render: (p, E) => `<div class="wk-in">${head(p, E)}<div class="wk-grid ${gc(p)}">${p.items.map((it, i) => `<figure><img src="${esc(it.img)}" alt="${esc(it.caption)}" loading="lazy">${it.caption ? `<figcaption${E(`items.${i}.caption`)}>${esc(it.caption)}</figcaption>` : ''}</figure>`).join('')}</div></div>`,
  },

  video: {
    name: 'Videó', cat: 'Média', icon: '▶', desc: 'YouTube vagy MP4 videó',
    fields: [F.title, F.subtitle, { k: 'url', t: 'text', l: 'Videó link', hint: 'YouTube link vagy .mp4 URL' },
      { k: 'mw', t: 'range', l: 'Max. szélesség', min: 480, max: 1140, step: 20, unit: 'px' }],
    defaults: { title: 'Nézd meg működés közben', subtitle: '', url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4', mw: 900 },
    style: p => `--mw:${p.mw}px`,
    render: (p, E) => {
      const id = ytId(p.url);
      const media = id ? `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(p.title || 'Videó')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`
        : p.url ? `<video src="${esc(p.url)}" controls playsinline></video>` : '';
      return `<div class="wk-in">${head(p, E)}<div class="wk-vid">${media}</div></div>`;
    },
  },

  /* ======================= ÜZLETI ======================= */
  pricing: {
    btns: true,
    name: 'Árazás', cat: 'Üzleti', icon: '₣', desc: 'Csomagok, árak, kiemelt csomag',
    fields: [F.title, F.subtitle, F.cols, { k: 'hotLabel', t: 'text', l: 'Kiemelés címke' },
      { k: 'items', t: 'list', l: 'Csomagok', addL: 'Új csomag', item: { name: 'Csomag', price: '9 990 Ft', period: '/hó', features: 'Első\nMásodik', btnText: 'Választom', btnHref: '#', hot: false },
        fields: [{ k: 'name', t: 'text', l: 'Név' }, { k: 'price', t: 'text', l: 'Ár' }, { k: 'period', t: 'text', l: 'Időszak' },
          { k: 'features', t: 'textarea', l: 'Tartalom', hint: 'soronként egy', rows: 4 }, { k: 'btnText', t: 'text', l: 'Gomb felirat' }, { k: 'btnHref', t: 'text', l: 'Gomb link' },
          { k: 'hot', t: 'check', l: 'Kiemelt csomag' }] }],
    defaults: {
      _id: 'arak', title: 'Egyszerű árazás', subtitle: 'Válaszd ki a számodra megfelelő csomagot.', cols: '3', hotLabel: 'Népszerű',
      items: [
        { name: 'Alap', price: '0 Ft', period: '/hó', features: '1 weboldal\nÖsszes blokk\nHTML export', btnText: 'Kezdés', btnHref: '#', hot: false },
        { name: 'Pro', price: '4 990 Ft', period: '/hó', features: 'Korlátlan oldal\nSaját domain segítség\nPrioritásos támogatás', btnText: 'Ezt választom', btnHref: '#', hot: true },
        { name: 'Cég', price: 'Egyedi', period: '', features: 'Egyedi blokkok\nCsapat hozzáférés\nSzemélyes betanítás', btnText: 'Ajánlatkérés', btnHref: '#kapcsolat', hot: false },
      ],
    },
    render: (p, E) => `<div class="wk-in">${head(p, E)}<div class="wk-grid ${gc(p)}">${p.items.map((it, i) => `<div class="wk-card wk-plan${it.hot ? ' hot' : ''}">${it.hot && p.hotLabel ? `<span class="wk-badge">${esc(p.hotLabel)}</span>` : ''}<div class="wk-plan-n"${E(`items.${i}.name`)}>${esc(it.name)}</div><div class="wk-price"><span${E(`items.${i}.price`)}>${esc(it.price)}</span> <span class="wk-per">${esc(it.period)}</span></div><ul>${lines(it.features).map(x => `<li>${esc(x)}</li>`).join('')}</ul>${it.btnText ? `<a class="wk-btn" href="${esc(it.btnHref || '#')}"${E(`items.${i}.btnText`)}>${esc(it.btnText)}</a>` : ''}</div>`).join('')}</div></div>`,
  },

  testimonials: {
    name: 'Vélemények', cat: 'Üzleti', icon: '❝', desc: 'Ügyfél idézetek fotóval',
    fields: [F.title, F.subtitle, F.cols, { k: 'items', t: 'list', l: 'Vélemények', addL: 'Új vélemény', item: { quote: 'Nagyon elégedett vagyok!', name: 'Név', role: 'Beosztás', img: IMG('webeki-p9', 200, 200) },
      fields: [{ k: 'quote', t: 'textarea', l: 'Idézet' }, { k: 'name', t: 'text', l: 'Név' }, { k: 'role', t: 'text', l: 'Beosztás / cég' }, { k: 'img', t: 'image', l: 'Fotó' }] }],
    defaults: {
      title: 'Mit mondanak rólunk', subtitle: '', cols: '3',
      items: [
        { quote: 'Egy délután alatt összeraktam a cégem új oldalát. Hihetetlen, hogy ez ingyenes.', name: 'Kovács Anna', role: 'Virágbolt tulajdonos', img: IMG('webeki-p1', 200, 200) },
        { quote: 'Végre nem kell havonta fizetnem egy weboldal-szerkesztőért. Minden benne van, ami kell.', name: 'Nagy Péter', role: 'Fotós', img: IMG('webeki-p2', 200, 200) },
        { quote: 'A mobil nézet tökéletes, az exportált kód tiszta. Ajánlom mindenkinek!', name: 'Szabó Eszter', role: 'Webfejlesztő', img: IMG('webeki-p3', 200, 200) },
      ],
    },
    render: (p, E) => `<div class="wk-in">${head(p, E)}<div class="wk-grid ${gc(p)}">${p.items.map((it, i) => `<div class="wk-card"><p class="wk-quote"${E(`items.${i}.quote`, 1)}>${nl(it.quote)}</p><div class="wk-person">${it.img ? `<img src="${esc(it.img)}" alt="" loading="lazy">` : ''}<div><b${E(`items.${i}.name`)}>${esc(it.name)}</b><small${E(`items.${i}.role`)}>${esc(it.role)}</small></div></div></div>`).join('')}</div></div>`,
  },

  team: {
    name: 'Csapat', cat: 'Üzleti', icon: '☺', desc: 'Csapattagok fotóval',
    fields: [F.title, F.subtitle, F.cols, { k: 'items', t: 'list', l: 'Tagok', addL: 'Új tag', item: { name: 'Név', role: 'Pozíció', img: IMG('webeki-t9', 500, 500) },
      fields: [{ k: 'name', t: 'text', l: 'Név' }, { k: 'role', t: 'text', l: 'Pozíció' }, { k: 'img', t: 'image', l: 'Fotó' }] }],
    defaults: {
      title: 'A csapat', subtitle: 'Az emberek, akik mindezt lehetővé teszik.', cols: '4',
      items: [['Tóth Gábor', 'Alapító'], ['Kiss Lilla', 'Designer'], ['Varga Bence', 'Fejlesztő'], ['Molnár Réka', 'Ügyfélkapcsolat']]
        .map(([name, role], i) => ({ name, role, img: IMG('webeki-t' + i, 500, 500) })),
    },
    render: (p, E) => `<div class="wk-in">${head(p, E)}<div class="wk-grid ${gc(p)}">${p.items.map((it, i) => `<div class="wk-member">${it.img ? `<img src="${esc(it.img)}" alt="${esc(it.name)}" loading="lazy">` : ''}<h3 class="wk-h3"${E(`items.${i}.name`)}>${esc(it.name)}</h3><small${E(`items.${i}.role`)}>${esc(it.role)}</small></div>`).join('')}</div></div>`,
  },

  cta: {
    btns: true,
    name: 'Felhívás (CTA)', cat: 'Üzleti', icon: '➜', desc: 'Színes sáv címmel és gombbal',
    fields: [F.title, { k: 'text', t: 'textarea', l: 'Szöveg' }, ...F.btn('btn', 'Gomb')],
    defaults: { _pt: 88, _pb: 88, title: 'Készen állsz az indulásra?', text: 'Rakd össze az első oldaladat még ma – ingyen.', btnText: 'Kezdjük el', btnHref: '#kapcsolat' },
    render: (p, E) => `<div class="wk-in"><h2 class="wk-h2"${E('title')}>${esc(p.title)}</h2>${p.text ? `<p class="wk-lead"${E('text', 1)}>${nl(p.text)}</p>` : ''}${btn(p, E, 'btn')}</div>`,
  },

  contact: {
    btns: true,
    name: 'Kapcsolat', cat: 'Üzleti', icon: '✉', desc: 'Elérhetőségek, űrlap, térkép',
    fields: [F.title, { k: 'text', t: 'textarea', l: 'Szöveg' },
      { k: 'email', t: 'text', l: 'E-mail' }, { k: 'phone', t: 'text', l: 'Telefon' }, { k: 'address', t: 'text', l: 'Cím' },
      { k: 'form', t: 'check', l: 'Űrlap megjelenítése' },
      { k: 'action', t: 'text', l: 'Űrlap küldési cím', hint: 'pl. Formspree URL. Üresen: e-mail kliens nyílik meg' },
      { k: 'btnText', t: 'text', l: 'Küldés gomb felirat' },
      { k: 'map', t: 'check', l: 'Térkép megjelenítése (a fenti cím alapján)' }, ...F.social],
    defaults: {
      _id: 'kapcsolat', title: 'Lépj kapcsolatba velünk', text: 'Kérdésed van? Írj nekünk, 24 órán belül válaszolunk.',
      email: 'hello@pelda.hu', phone: '+36 30 123 4567', address: 'Budapest, Andrássy út 1.', form: true, action: '', btnText: 'Üzenet küldése', social: SOC('facebook', 'instagram'), socStyle: 'circle', map: false,
    },
    render: (p, E) => `<div class="wk-in wk-split">
<div><h2 class="wk-h2"${E('title')}>${esc(p.title)}</h2>${p.text ? `<p class="wk-txt"${E('text', 1)}>${nl(p.text)}</p>` : ''}
<div class="wk-ci">${p.email ? `<a href="mailto:${esc(p.email)}"><span>${svg(ICONS.mail.d)}</span>${esc(p.email)}</a>` : ''}${p.phone ? `<a href="tel:${esc(p.phone.replace(/\s/g, ''))}"><span>${svg(ICONS.phone.d)}</span>${esc(p.phone)}</a>` : ''}${p.address ? `<div><span>${svg(ICONS.pin.d)}</span>${esc(p.address)}</div>` : ''}</div>${socialHTML(p)}</div>
${p.form ? `<form class="wk-form" action="${esc(p.action || 'mailto:' + p.email)}" method="post"${p.action ? '' : ' enctype="text/plain"'}>
<input name="nev" placeholder="Neved" required><input name="email" type="email" placeholder="E-mail címed" required><textarea name="uzenet" placeholder="Üzeneted" required></textarea>
<button class="wk-btn" type="submit">${esc(p.btnText || 'Küldés')}</button></form>` : '<div></div>'}
</div>${p.map && p.address ? `<div class="wk-in"><iframe class="wk-map" src="https://maps.google.com/maps?q=${encodeURIComponent(p.address)}&amp;output=embed" loading="lazy" title="Térkép"></iframe></div>` : ''}`,
  },

  /* ======================= EGYÉB ======================= */
  footer: {
    name: 'Lábléc', cat: 'Lábléc & egyéb', icon: '▁', desc: 'Logó, linkek, copyright',
    tag: 'footer',
    fields: [{ k: 'logo', t: 'text', l: 'Logó szöveg' }, { k: 'text', t: 'textarea', l: 'Rövid leírás' },
      { k: 'links', t: 'list', l: 'Linkek', addL: 'Új link', item: { label: 'Link', href: '#' },
        fields: [{ k: 'label', t: 'text', l: 'Felirat' }, { k: 'href', t: 'text', l: 'Link' }] },
      { k: 'copy', t: 'text', l: 'Copyright sor' }, ...F.social],
    defaults: {
      _pt: 56, _pb: 32, logo: 'WEBEKI', text: 'Ingyenes, blokkos weboldal-építő.\nKészült szeretettel.',
      links: [{ label: 'Adatvédelem', href: '#' }, { label: 'ÁSZF', href: '#' }, { label: 'Kapcsolat', href: '#kapcsolat' }],
      social: SOC('facebook', 'instagram', 'youtube'), socStyle: 'circle',
      copy: '© ' + new Date().getFullYear() + ' WEBEKI. Minden jog fenntartva.',
    },
    render: (p, E) => `<div class="wk-in"><div class="wk-foot-row"><div><div class="wk-logo"${E('logo')}>${esc(p.logo)}</div>${p.text ? `<p class="wk-foot-t"${E('text', 1)}>${nl(p.text)}</p>` : ''}</div>
<div class="wk-foot-links">${p.links.map((l, i) => `<a href="${esc(l.href)}"${E(`links.${i}.label`)}>${esc(l.label)}</a>`).join('')}</div>${socialHTML(p)}</div>
${p.copy ? `<div class="wk-copy"${E('copy')}>${esc(p.copy)}</div>` : ''}</div>`,
  },

  spacer: {
    name: 'Elválasztó', cat: 'Lábléc & egyéb', icon: '—', desc: 'Üres tér vagy vonal',
    fields: [{ k: 'line', t: 'check', a: 1, l: 'Vonal megjelenítése' }],
    defaults: { _pt: 32, _pb: 32, line: true },
    render: p => p.line ? '<hr>' : '',
  },

  html: {
    name: 'Egyedi HTML', cat: 'Lábléc & egyéb', icon: '</>', desc: 'Saját kód beillesztése',
    fields: [{ k: 'code', t: 'html', l: 'HTML kód', rows: 12, hint: 'A szkriptek csak az exportált oldalon futnak' },
      { k: 'wrap', t: 'check', a: 1, l: 'Középre, max. szélességben' }],
    defaults: { _pt: 48, _pb: 48, wrap: true, code: '<div style="text-align:center">\n  <h2>Saját HTML</h2>\n  <p>Ide bármilyen kódot beilleszthetsz.</p>\n</div>' },
    render: p => p.wrap ? `<div class="wk-in">${p.code}</div>` : p.code,
  },
};

/* ---- egy blokk HTML-je. edit=true: szerkesztőben (inline szerkeszthető mezők) ---- */
/* háttér: szín / színátmenet / kép (fedőszínnel) */
function hexA(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '#000000') || [0, '000000'];
  return `rgba(${[0, 2, 4].map(i => parseInt(m[1].substr(i, 2), 16)).join(',')},${a})`;
}
function bgStyle(p) {
  if (p._bgType === 'gradient') {
    const c1 = p._g1 || 'var(--wk-primary)', c2 = p._g2 || 'color-mix(in srgb,var(--wk-primary) 45%,#000)';
    return `background-image:${p._gKind === 'radial' ? 'radial-gradient(circle at center' : `linear-gradient(${p._gAng}deg`},${c1},${p._gMid}%,${c2})`;
  }
  if (p._bgType === 'image' && p._bgImg) {
    const ov = hexA(p._bgOvC, (p._bgOv || 0) / 100);
    const size = { cover: 'cover', fitw: '100% auto', fith: 'auto 100%', orig: 'auto' }[p._bgFit] || 'cover';
    const rep = p._bgRep && p._bgFit !== 'cover' ? 'repeat' : 'no-repeat';
    return `background-image:linear-gradient(${ov},${ov}),url("${p._bgImg}");background-size:100% 100%,${size};background-repeat:no-repeat,${rep};background-position:0 0,${p._bgX}% ${p._bgY}%${p._bgFix ? ';background-attachment:scroll,fixed' : ''}`;
  }
  return '';
}
function renderBlock(b, edit, extraCls = '', ctx = {}) {
  const d = BLOCKS[b.type], p = b.p;
  const divider = (pos, kind, h, flip, col) => kind && kind !== 'none' && SHAPES[kind]
    ? `<div class="wk-sd ${pos}${flip ? ' f' : ''}" style="height:${h}px;color:${esc(col)}" aria-hidden="true"><svg viewBox="0 0 1200 100" preserveAspectRatio="none"><path fill="currentColor" d="${SHAPES[kind]}"/></svg></div>` : '';
  const pre = (ctx.linkPrev ? '' : divider('t', p._divTop, p._divTopH, p._divTopF, p._divTopC || ctx.prevC || 'var(--wk-bg)'))
    + (ctx.linkNext ? '' : divider('b', p._divBot, p._divBotH, p._divBotF, p._divBotC || ctx.nextC || 'var(--wk-bg)'));
  const fade = p._fadeTop > 0 && !ctx.linkPrev;
  const fx = [fade && `--wk-fade:${p._fadeTop}px;--wk-fadec:${p._fadeC || ctx.prevC || 'var(--wk-bg)'}`, p._pull > 0 && `--wk-pull:-${p._pull}px`].filter(Boolean).join(';');
  extraCls = [extraCls, fade && 'wk-fade', p._pull > 0 && 'wk-pull'].filter(Boolean).join(' ');
  const E = edit ? (path, ml) => ` data-edit="${path}"${ml ? ' data-ml="1"' : ''} contenteditable="plaintext-only" spellcheck="false"` : () => '';
  const st = [p._bgType !== 'gradient' && p._bg && `--b-bg:${p._bg}`, bgStyle(p), p._btnC && `--wk-btn:${p._btnC};--wk-onb:${typeof onColor === 'function' ? onColor(p._btnC) : '#fff'}`, p._fg && `--b-fg:${p._fg}`, `--b-pt:${p._pt}px`, `--b-pb:${p._pb}px`, d.style && d.style(p)].filter(Boolean).join(';');
  const tag = d.tag || 'section';
  const an = p._anim && p._anim !== 'none'
    ? ` data-anim="${p._anim}"${p._animSt ? ' data-st' : ''}${p._animRep ? ' data-rep' : ''}` : '';
  const ast = (an ? `;--wk-ad:${p._animDur}ms;--wk-dl:${p._animDelay}ms` : '') + (fx ? ';' + fx : '');
  return `<${tag} class="wk-b wk-${b.type} ${d.cls ? d.cls(p) : ''}${extraCls ? ' ' + extraCls : ''}"${p._id ? ` id="${esc(p._id)}"` : ''}${an} style="${esc(st + ast)}">${pre}${d.render(p, E, b)}</${tag}>`;
}

/* ---- animáció ----
   A blokk (data-anim) belső tartalma animálódik, a háttér marad.
   Lépcsőzetes módban (data-st) a tartalom elemei egymás után, --i sorszám szerint.
   Az elrejtett kezdőállapot csak akkor él, ha fut a szkript (.wk-js), vagy a szerkesztő előnézete (.wk-prev). */
const ANIM_GROUPS = '.wk-grid,.wk-split,.wk-foot-row,.wk-btns';
const ANIM_T = ['[data-anim]:not([data-st])>.wk-in', `[data-anim][data-st]>.wk-in>:not(${ANIM_GROUPS})`, `[data-anim][data-st]>.wk-in>:is(${ANIM_GROUPS})>*`];
const ANIM_CSS = `
${ANIM_T.map(t => t.replace('[data-anim]', '[data-anim].wk-vis')).join(',')}{transition:opacity var(--wk-ad,700ms) cubic-bezier(.2,.7,.2,1) calc(var(--wk-dl,0ms) + var(--i,0) * 110ms),transform var(--wk-ad,700ms) cubic-bezier(.2,.7,.2,1) calc(var(--wk-dl,0ms) + var(--i,0) * 110ms)}
@media (prefers-reduced-motion:no-preference){
${[...ANIM_T.map(t => '.wk-js ' + t.replace('[data-anim]', '[data-anim]:not(.wk-vis)')), ...ANIM_T.map(t => t.replace('[data-anim]', '[data-anim].wk-prev:not(.wk-vis)'))].join(',')}{opacity:0;transform:var(--wk-at,none)}
}
[data-anim=up]{--wk-at:translateY(48px)}[data-anim=down]{--wk-at:translateY(-48px)}
[data-anim=left]{--wk-at:translateX(-60px)}[data-anim=right]{--wk-at:translateX(60px)}
[data-anim=zoom]{--wk-at:scale(.88)}[data-anim=flip]{--wk-at:perspective(900px) rotateX(24deg) translateY(20px)}
`;
/* futtató kód: az exportált oldalba is bekerül (toString), ezért régi böngészőkön is futó JS */
function wkAnimIdx(sec) {
  var i = 0;
  [].forEach.call(sec.children, function (inn) {
    if (!/(^| )wk-in( |$)/.test(inn.className)) return;
    [].forEach.call(inn.children, function (c) {
      if (/(^| )(wk-grid|wk-split|wk-foot-row|wk-btns)( |$)/.test(c.className)) [].forEach.call(c.children, function (g) { g.style.setProperty('--i', i++); });
      else c.style.setProperty('--i', i++);
    });
  });
  return i;
}
function wkNavInit() {
  var n = document.querySelectorAll('.wk-navbar.over.sticky');
  if (!n.length) return;
  function f() { var s = (window.scrollY || document.documentElement.scrollTop) > 10; [].forEach.call(n, function (e) { e.classList.toggle('wk-scrolled', s); }); }
  window.addEventListener('scroll', f, { passive: true }); f();
}
function wkAnimInit() {
  var els = document.querySelectorAll('[data-anim]');
  [].forEach.call(els, wkAnimIdx);
  if (!('IntersectionObserver' in window)) { [].forEach.call(els, function (e) { e.classList.add('wk-vis'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var rep = e.target.hasAttribute('data-rep');
      if (e.isIntersecting) { e.target.classList.add('wk-vis'); if (!rep) io.unobserve(e.target); }
      else if (rep) e.target.classList.remove('wk-vis');
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  [].forEach.call(els, function (e) { io.observe(e); });
}

/* ---- a generált oldal CSS-e (szerkesztőben és exportban ugyanaz) ---- */
const PAGE_CSS = `
.wk-page{container-type:inline-size;font-family:var(--wk-font);color:var(--wk-text);background:var(--wk-bg);line-height:1.6;font-size:17px;-webkit-font-smoothing:antialiased}
.wk-page *,.wk-page *::before,.wk-page *::after{box-sizing:border-box}
.wk-page img{max-width:100%;display:block}
.wk-page h1,.wk-page h2,.wk-page h3{font-family:var(--wk-head,var(--wk-font));line-height:1.12;letter-spacing:-.02em;margin:0}
.wk-page p{margin:0}
.wk-b{background:var(--b-bg,transparent);color:var(--b-fg,inherit);padding:var(--b-pt,96px) 24px var(--b-pb,96px);position:relative;background-size:cover;background-position:center}
.wk-in{max-width:1140px;margin:0 auto;width:100%}
.wk-head{margin-bottom:52px}
.wk-head.c{text-align:center}.wk-head.c .wk-sub{margin-inline:auto}
.wk-h1{font-size:clamp(38px,6.4cqi,76px);font-weight:800;margin-bottom:22px}
.wk-h2{font-size:clamp(30px,4.2cqi,48px);font-weight:800;margin-bottom:14px}
.wk-h3{font-size:21px;font-weight:700;margin-bottom:8px}
.wk-sub{font-size:18px;opacity:.72;max-width:680px}
.wk-lead{font-size:clamp(17px,2cqi,22px);opacity:.9;max-width:720px;margin-bottom:34px}
.wk-txt{opacity:.8;margin-bottom:24px}
.wk-btns{display:flex;gap:12px;flex-wrap:wrap}
.wk-btn{display:inline-flex;align-items:center;justify-content:center;padding:var(--wk-btn-py,14px) var(--wk-btn-px,28px);border-radius:var(--wk-btn-r,var(--wk-radius));background:var(--wk-btn,var(--wk-primary));color:var(--wk-onb,var(--wk-onp,#fff));text-decoration:none;font-weight:600;border:2px solid var(--wk-btn,var(--wk-primary));transition:transform .2s,filter .2s,background .2s,color .2s,box-shadow .2s;font-size:var(--wk-btn-fs,16px);line-height:1.2;cursor:pointer;font-family:inherit}
.wk-btn:hover{filter:brightness(1.08);transform:translateY(-2px)}
.wk-btn.o{background:transparent;color:inherit;border-color:currentColor}
.wk-btn.sm{padding:calc(var(--wk-btn-py,14px)*.72) calc(var(--wk-btn-px,28px)*.72);font-size:calc(var(--wk-btn-fs,16px)*.93)}
/* gomb stílusok (Oldal beállítások → Gombok) – a .wk-page osztálya dönti el */
.bs-outline .wk-btn:not(.o){background:transparent;color:var(--wk-btn,var(--wk-primary))}
.bs-outline .wk-btn:not(.o):hover{background:var(--wk-btn,var(--wk-primary));color:var(--wk-onb,var(--wk-onp,#fff))}
.bs-soft .wk-btn:not(.o){background:color-mix(in srgb,var(--wk-btn,var(--wk-primary)) 15%,transparent);color:var(--wk-btn,var(--wk-primary));border-color:transparent}
.bs-soft .wk-btn:not(.o):hover{background:var(--wk-btn,var(--wk-primary));color:var(--wk-onb,var(--wk-onp,#fff))}
.bs-shadow .wk-btn:not(.o){box-shadow:0 10px 24px -8px color-mix(in srgb,var(--wk-btn,var(--wk-primary)) 75%,transparent)}
.bs-shadow .wk-btn:not(.o):hover{box-shadow:0 16px 32px -8px color-mix(in srgb,var(--wk-btn,var(--wk-primary)) 85%,transparent);filter:none}
.bs-gradient .wk-btn:not(.o){background:linear-gradient(135deg,color-mix(in srgb,var(--wk-btn,var(--wk-primary)) 78%,#fff),color-mix(in srgb,var(--wk-btn,var(--wk-primary)) 72%,#000));border-color:transparent}
.bs-outline .wk-cta .wk-btn,.bs-soft .wk-cta .wk-btn{background:transparent;color:var(--wk-btn,var(--wk-onp,#fff));border-color:var(--wk-btn,var(--wk-onp,#fff))}
.bs-outline .wk-cta .wk-btn:hover,.bs-soft .wk-cta .wk-btn:hover{background:var(--wk-btn,var(--wk-onp,#fff));color:var(--wk-onb,var(--wk-primary))}
.bs-gradient .wk-cta .wk-btn{background:var(--wk-btn,var(--wk-onp,#fff));color:var(--wk-onb,var(--wk-primary))}
.bs-upper .wk-btn{text-transform:uppercase;letter-spacing:.07em;font-size:calc(var(--wk-btn-fs,16px)*.88)}
.wk-grid{display:grid;gap:28px;grid-template-columns:repeat(3,minmax(0,1fr))}
.wk-grid.c2{grid-template-columns:repeat(2,minmax(0,1fr))}.wk-grid.c4{grid-template-columns:repeat(4,minmax(0,1fr))}
.wk-card{background:rgba(127,127,127,.08);border-radius:calc(var(--wk-radius)*1.6);padding:32px}
.wk-card p{opacity:.78}
/* menü */
.wk-b.wk-navbar{background-color:var(--b-bg,var(--wk-bg));z-index:50}
.wk-b.wk-navbar.line{border-bottom:1px solid rgba(127,127,127,.18)}
.wk-navbar.sticky{position:sticky;top:0}
/* átlátszó menü: a következő blokk alácsúszik (negatív alsó margó), görgetéskor (.wk-scrolled) hátteret kap */
.wk-b.wk-navbar.over{background-color:var(--b-bg,transparent);margin-bottom:calc(-1 * var(--wk-navh,80px));transition:background-color .3s,color .3s,box-shadow .3s}
.wk-b.wk-navbar.over.wk-scrolled{background-color:var(--nav-sbg);color:var(--nav-sfg);box-shadow:0 8px 28px -14px rgba(0,0,0,.4)}
.wk-b.wk-navbar.over.glass.wk-scrolled{background-color:color-mix(in srgb,var(--nav-sbg) 75%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4)}
.wk-nav-row{display:flex;align-items:center;gap:24px}
.wk-logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:22px;color:inherit;text-decoration:none;margin-right:auto;font-family:var(--wk-head,var(--wk-font));letter-spacing:-.02em}
.wk-logo img{height:36px;width:auto}
.wk-links{display:flex;align-items:center;gap:28px}
.wk-links a:not(.wk-btn){color:inherit;text-decoration:none;opacity:.78;font-weight:500}
.wk-links a:not(.wk-btn):hover{opacity:1;color:var(--wk-primary)}
.wk-nt{display:none}
.wk-burger{display:none;width:40px;height:40px;cursor:pointer;position:relative}
.wk-burger span,.wk-burger span::before,.wk-burger span::after{position:absolute;left:8px;width:24px;height:2px;background:currentColor;content:"";transition:.3s}
.wk-burger span{top:19px}.wk-burger span::before,.wk-burger span::after{left:0}.wk-burger span::before{top:-7px}.wk-burger span::after{top:7px}
.wk-nt:checked+.wk-burger span{background:transparent}
.wk-nt:checked+.wk-burger span::before{top:0;transform:rotate(45deg)}.wk-nt:checked+.wk-burger span::after{top:0;transform:rotate(-45deg)}
/* hero */
.wk-b.wk-hero{background-color:var(--b-bg,#111827);color:var(--b-fg,#fff);display:flex;align-items:center}
.wk-hero .center{text-align:center}.wk-hero .center .wk-lead{margin-inline:auto}.wk-hero .center .wk-btns{justify-content:center}
/* szolgáltatások */
.wk-ico{font-size:30px;width:62px;height:62px;display:grid;place-items:center;border-radius:calc(var(--wk-radius)*1.4);background:color-mix(in srgb,var(--wk-primary) 14%,transparent);margin-bottom:20px}
.wk-card.plain{background:none;padding:0}
.wk-features.center .wk-card{text-align:center}.wk-features.center .wk-ico{margin-inline:auto}
/* kép + szöveg */
.wk-split{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.wk-split.rev .wk-split-img{order:2}
.wk-split-img img{width:100%;border-radius:calc(var(--wk-radius)*2);aspect-ratio:4/3;object-fit:cover}
.wk-bul{list-style:none;padding:0;margin:0 0 30px;display:grid;gap:10px}
.wk-bul li{padding-left:30px;position:relative}
.wk-bul li::before{content:"✓";position:absolute;left:0;color:var(--wk-primary);font-weight:800}
/* számok */
.wk-stat{text-align:center}
.wk-num{font-size:clamp(36px,5cqi,56px);font-weight:800;font-family:var(--wk-head,var(--wk-font));color:var(--wk-primary);line-height:1.1;letter-spacing:-.02em}
.wk-stat-l{opacity:.72;margin-top:6px}
/* szöveg */
.wk-text .wk-in,.wk-video .wk-in{max-width:var(--mw,760px)}
.wk-rich p,.wk-rich ul,.wk-rich ol{margin:0 0 1em}
.wk-rich a{color:var(--wk-primary)}
.wk-rich h2,.wk-rich h3{margin:1.3em 0 .5em}
.wk-rich ul,.wk-rich ol{display:inline-block;text-align:left}
.wk-text .wk-rich{opacity:.85}
/* gyik */
.wk-faq .wk-in{max-width:820px}
.wk-faq details{border-bottom:1px solid rgba(127,127,127,.25);padding:22px 0}
.wk-faq summary{cursor:pointer;font-weight:600;font-size:18px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.wk-faq summary::-webkit-details-marker{display:none}
.wk-faq summary::after{content:"+";font-size:26px;line-height:.9;color:var(--wk-primary);transition:transform .3s}
.wk-faq details[open] summary::after{transform:rotate(45deg)}
.wk-faq details p{margin-top:12px;opacity:.75}
/* galéria */
.wk-gallery figure{margin:0;position:relative;overflow:hidden;border-radius:calc(var(--wk-radius)*1.4)}
.wk-gallery img{width:100%;aspect-ratio:var(--ar,4/3);object-fit:cover;transition:transform .6s}
.wk-gallery figure:hover img{transform:scale(1.05)}
.wk-gallery figcaption{position:absolute;left:0;right:0;bottom:0;padding:16px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.7));font-weight:600}
/* videó */
.wk-vid{position:relative;aspect-ratio:16/9;border-radius:calc(var(--wk-radius)*1.6);overflow:hidden;background:#000}
.wk-vid iframe,.wk-vid video{position:absolute;inset:0;width:100%;height:100%;border:0}
/* árazás */
.wk-plan{display:flex;flex-direction:column;border:2px solid transparent;position:relative}
.wk-plan.hot{border-color:var(--wk-primary);box-shadow:0 24px 60px -24px color-mix(in srgb,var(--wk-primary) 60%,transparent)}
.wk-plan-n{font-weight:700;font-size:18px;margin-bottom:12px}
.wk-price{font-size:44px;font-weight:800;font-family:var(--wk-head,var(--wk-font));line-height:1;letter-spacing:-.02em}
.wk-per{opacity:.6;font-size:16px;font-weight:500;letter-spacing:0}
.wk-plan ul{list-style:none;padding:0;margin:26px 0 30px;display:grid;gap:10px;flex:1;align-content:start}
.wk-plan li::before{content:"✓";color:var(--wk-primary);font-weight:800;margin-right:10px}
.wk-plan .wk-btn{width:100%}
.wk-plan:not(.hot) .wk-btn{background:transparent;color:inherit;border-color:rgba(127,127,127,.4)}
.wk-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--wk-primary);color:var(--wk-onp,#fff);font-size:12px;font-weight:700;padding:4px 12px;border-radius:99px;text-transform:uppercase;letter-spacing:.06em}
/* vélemények */
.wk-b.wk-testimonials{background-color:var(--b-bg,color-mix(in srgb,var(--wk-primary) 6%,var(--wk-bg)))}
.wk-testimonials .wk-card{display:flex;flex-direction:column;justify-content:space-between}
.wk-quote{font-size:17px;margin-bottom:26px}
.wk-quote::before{content:"\\201C";display:block;font-size:64px;line-height:.7;color:var(--wk-primary);font-family:Georgia,serif;margin-bottom:8px}
.wk-person{display:flex;align-items:center;gap:14px}
.wk-person img{width:50px;height:50px;border-radius:50%;object-fit:cover}
.wk-person b{display:block}.wk-person small{opacity:.6}
/* csapat */
.wk-member{text-align:center}
.wk-member img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:calc(var(--wk-radius)*1.6);margin-bottom:16px}
.wk-member small{opacity:.65;font-size:15px}
/* cta */
.wk-b.wk-cta{background-color:var(--b-bg,var(--wk-primary));color:var(--b-fg,var(--wk-onp,#fff));text-align:center}
.wk-cta .wk-lead{margin-inline:auto}
/* CTA: a fő szín háttéren alapból fordított gomb, egyedi gombszínnél az */
.wk-cta .wk-btn{background:var(--wk-btn,var(--wk-onp,#fff));color:var(--wk-onb,var(--wk-primary));border-color:var(--wk-btn,var(--wk-onp,#fff))}
/* kapcsolat */
.wk-contact .wk-split{align-items:start}
.wk-ci{display:grid;gap:14px}
.wk-ci a,.wk-ci div{display:flex;gap:14px;align-items:center;color:inherit;text-decoration:none}
.wk-ci span .wk-svg{width:19px;height:19px}
.wk-ci span{width:42px;height:42px;flex:none;display:grid;place-items:center;border-radius:50%;background:color-mix(in srgb,var(--wk-primary) 14%,transparent);color:var(--wk-primary);font-size:18px}
.wk-form{display:grid;gap:14px}
.wk-form input,.wk-form textarea{width:100%;padding:14px 16px;border-radius:var(--wk-radius);border:1px solid rgba(127,127,127,.35);background:rgba(127,127,127,.06);color:inherit;font:inherit}
.wk-form input:focus,.wk-form textarea:focus{outline:2px solid var(--wk-primary);outline-offset:1px}
.wk-form textarea{min-height:150px;resize:vertical}
.wk-map{display:block;margin-top:56px;border:0;width:100%;height:380px;border-radius:calc(var(--wk-radius)*1.6)}
/* lábléc */
.wk-b.wk-footer{background-color:var(--b-bg,color-mix(in srgb,var(--wk-text) 94%,var(--wk-bg)));color:var(--b-fg,var(--wk-bg))}
.wk-foot-row{display:flex;justify-content:space-between;gap:32px;flex-wrap:wrap;align-items:flex-start}
.wk-footer .wk-logo{margin-bottom:10px}
.wk-foot-t{opacity:.7;font-size:15px}
.wk-foot-links{display:flex;gap:24px;flex-wrap:wrap}
.wk-foot-links a{color:inherit;opacity:.75;text-decoration:none}.wk-foot-links a:hover{opacity:1}
.wk-copy{border-top:1px solid rgba(127,127,127,.25);margin-top:36px;padding-top:22px;font-size:14px;opacity:.6}
/* ikonok */
.wk-svg{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:block}
.wk-ico .wk-svg{width:30px;height:30px;color:var(--wk-primary)}
/* közösségi ikonok */
.wk-social{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.wk-social a{display:grid;place-items:center;width:40px;height:40px;color:inherit;opacity:.85;text-decoration:none;transition:transform .2s,opacity .2s,background .2s,color .2s}
.wk-social a:hover{opacity:1;color:var(--wk-primary);transform:translateY(-2px)}
.wk-social .wk-svg{width:21px;height:21px}
.wk-social.circle a,.wk-social.square a{background:rgba(127,127,127,.15);opacity:1}
.wk-social.circle a{border-radius:50%}
.wk-social.square a{border-radius:calc(var(--wk-radius)*.8)}
.wk-social.circle a:hover,.wk-social.square a:hover{background:var(--wk-primary);color:var(--wk-onp,#fff)}
.wk-links .wk-social{gap:2px}
.wk-links .wk-social a{width:34px;height:34px}
.wk-contact .wk-social{margin-top:26px}
/* összefüggő háttér, határvonalak, lágy átmenet, átlógás */
.wk-bgg .wk-b{background:none!important}
.wk-b>.wk-in{position:relative}
.wk-sd{position:absolute;left:0;right:0;line-height:0;pointer-events:none;overflow:hidden}
.wk-sd svg{display:block;width:100%;height:100%}
.wk-sd.b{bottom:-1px}
.wk-sd.t{top:-1px;transform:scaleY(-1)}
.wk-sd.f svg{transform:scaleX(-1)}
.wk-fade::before{content:"";position:absolute;left:0;right:0;top:0;height:var(--wk-fade);background:linear-gradient(to bottom,var(--wk-fadec),transparent);pointer-events:none}
.wk-pull>.wk-in:not(.wk-in~.wk-in){margin-top:var(--wk-pull)}
/* elválasztó */
.wk-spacer hr{border:0;border-top:1px solid rgba(127,127,127,.25);margin:0 auto;max-width:1140px}
/* reszponzív – a konténer szélességéhez igazodik */
@container (max-width:900px){
  .wk-grid.c3,.wk-grid.c4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .wk-split{grid-template-columns:1fr;gap:36px}.wk-split.rev .wk-split-img{order:0}
}
@container (max-width:800px){
  .wk-burger{display:block}
  .wk-nav-row{flex-wrap:wrap}
  .wk-links{display:none;width:100%;flex-direction:column;align-items:flex-start;gap:16px;padding:12px 0 6px}
  .wk-nt:checked~.wk-links{display:flex}
}
@container (max-width:600px){
  .wk-grid,.wk-grid.c2,.wk-grid.c3,.wk-grid.c4{grid-template-columns:1fr}
  .wk-stats .wk-grid.c4,.wk-stats .wk-grid.c3{grid-template-columns:repeat(2,minmax(0,1fr))}
  .wk-b{padding-left:20px;padding-right:20px}
  .wk-card{padding:26px}
}
.wk-grid.fx.c2{grid-template-columns:repeat(2,minmax(0,1fr))}
.wk-grid.fx.c3{grid-template-columns:repeat(3,minmax(0,1fr))}
.wk-grid.fx.c4{grid-template-columns:repeat(4,minmax(0,1fr))}
` + ANIM_CSS;

/* ---- kiinduló sablonok ---- */
const TEMPLATES = {
  landing: { n: 'Termék landing', d: 'Hero, jellemzők, árak, vélemények, GYIK', blocks: ['navbar', 'hero', 'features', 'imageText', 'stats', 'testimonials', 'pricing', 'faq', 'cta', 'footer'] },
  business: { n: 'Cégbemutató', d: 'Rólunk, szolgáltatások, csapat, kapcsolat', blocks: ['navbar', ['hero', { align: 'left' }], 'imageText', ['features', { look: 'plain', align: 'center' }], 'team', ['contact', { map: true }], 'footer'] },
  portfolio: { n: 'Portfólió', d: 'Galéria, bemutatkozás, videó', blocks: ['navbar', ['hero', { title: 'Szia, én\nfotós vagyok.', height: 70 }], 'gallery', ['text', { align: 'center' }], 'video', 'contact', 'footer'] },
  blank: { n: 'Üres oldal', d: 'Kezdd a nulláról', blocks: [] },
};
