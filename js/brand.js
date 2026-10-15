/* =========================================================================
   WEBEKI – logó és indító animáció, az EKIDIO család stílusában
   (STEMEKI, VIDEKI, CHORDEKI): dőlt "WEB" + ferde EKI jelvény a család
   négy színsávjából; az "EKI" kivágva.
   A WEBEKI-nél a négy sáv egy-egy weboldal-blokk (menüsor, nyitókép,
   kártyák, lábléc) – az indító animációban ezekből "épül" a logó.
   ========================================================================= */
const WK_BANDS = ['#ff5c8a', '#ffa821', '#3ddb96', '#5ca8ff'];   // a család sávszínei (STEMEKI Theme)
const WK_FONT = `-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif`;
const WK_SKEW = Math.tan(14 * Math.PI / 180);                    // a jelvény dőlése (skewX(-14))

/* a jelvény sávjai a logó koordinátáiban (viewBox 0 0 372 100) */
const wkBand = i => ({ x: 206, y: 12 + i * 21.5, w: 164, h: 21.5 });

/* blokk-motívumok a sávokban (a sáv saját koordinátáiban): menüsor · nyitókép · kártyák · lábléc */
function wkMotif(i) {
  const { x, y } = wkBand(i), W = a => `fill="#fff" fill-opacity="${a}"`, K = a => `fill="#000" fill-opacity="${a}"`;
  const r = (dx, dy, w, h, f, rx = 1.2) => `<rect x="${x + dx}" y="${y + dy}" width="${w}" height="${h}" rx="${rx}" ${f}/>`;
  return [
    // menüsor: logó balra, menüpontok és gomb jobbra
    r(8, 7, 18, 7.5, W(.85)) + r(96, 9.5, 11, 2.6, K(.3)) + r(111, 9.5, 11, 2.6, K(.3)) + r(126, 9.5, 11, 2.6, K(.3)) + r(141, 6.5, 17, 8.5, K(.32), 2),
    // nyitókép: cím, alcím, gomb középen
    r(47, 4.5, 70, 4.6, W(.9)) + r(59, 11, 46, 2.4, W(.6)) + r(72, 15.2, 20, 4.4, K(.3), 2),
    // kártyasor: három kártya
    r(8, 3.5, 44, 14.5, W(.42), 2) + r(60, 3.5, 44, 14.5, W(.42), 2) + r(112, 3.5, 44, 14.5, W(.42), 2),
    // lábléc: logó és linkek
    r(8, 8.5, 22, 4.4, K(.3)) + r(108, 9.6, 12, 2.4, K(.28)) + r(124, 9.6, 12, 2.4, K(.28)) + r(140, 9.6, 12, 2.4, K(.28)),
  ][i];
}

/* A fejléc logója (arány ≈ 3.72 : 1). id: egyedi előtag a maszkhoz. */
function wkLogo(id = 'wkl') {
  const bands = [0, 1, 2, 3].map(i => { const b = wkBand(i); return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h + .4}" fill="${WK_BANDS[i]}"/>${wkMotif(i)}`; }).join('');
  return `<svg class="wk-logo-svg" viewBox="0 0 372 100" role="img" aria-label="WEBEKI">
  <defs><mask id="${id}-cut" maskUnits="userSpaceOnUse" x="-50" y="-50" width="470" height="200">
    <rect x="-50" y="-50" width="470" height="200" fill="#fff"/>
    <text x="274" y="81" text-anchor="middle" font-family="${WK_FONT}" font-size="74" font-weight="900" font-style="italic" letter-spacing="-1" fill="#000">EKI</text>
  </mask></defs>
  <g class="wk-word"><text x="176" y="87" text-anchor="end" font-family="${WK_FONT}" font-size="92" font-weight="900" font-style="italic" letter-spacing="-2" fill="#fff">WEB</text></g>
  <g mask="url(#${id}-cut)"><g transform="skewX(-14)"><rect x="212" y="20" width="164" height="86" fill="#fff"/>${bands}</g></g>
</svg>`;
}

/* a viewBox bal szélét a "WEB" valódi szélességéhez igazítja (betűtípustól függ) */
function wkFit(svg) {
  const t = svg && svg.querySelector('.wk-word text, .sp-word text'); if (!t) return;
  try { const left = Math.min(0, Math.floor(t.getBBox().x - 3)); svg.setAttribute('viewBox', `${left} 0 ${372 - left} 100`); } catch (e) { }
}

/* kis ikon a böngészőfülre: a színes jelvény */
function wkFavicon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g transform="skewX(-12) translate(10 0)"><rect x="7" y="11" width="50" height="48" fill="#fff"/>${WK_BANDS.map((c, i) => `<rect x="4" y="${8 + i * 12}" width="50" height="12.5" fill="${c}"/>`).join('')}</g><text x="35" y="45" text-anchor="middle" font-family="-apple-system,Arial Black,Arial" font-weight="900" font-style="italic" font-size="27" fill="#141519">EKI</text></svg>`;
  const l = document.createElement('link'); l.rel = 'icon'; l.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  document.head.appendChild(l);
}

/* ---------------- indító animáció ----------------
   0.0  böngészőablak jelenik meg
   0.35 egérmutató egyenként behúzza a 4 blokkot (menüsor, nyitókép, kártyák, lábléc)
   1.62 az ablak eltűnik, a blokkok ferde EKI jelvénnyé állnak össze, beúszik a "WEB"
   2.15 kivágódik az "EKI", majd a négyszínű vonal és az alcím
   3.3  elhalványul (koppintás / billentyű: azonnal) */
const WK_T = { drag0: .35, step: .3, dragDur: .26, morph: 1.62, morphDur: .5, eki: 2.15, out: 3.3 };
/* a böngészőablakban a blokkok helye (logó koordinátákban): [y, magasság] */
const WK_PAGE = { x: 92, w: 188, rows: [[-10, 12], [4, 44], [52, 34], [90, 14]] };

function wkSplashSVG(id) {
  const c = WK_SKEW, sx = WK_PAGE.w / 164, css = [], mid = WK_PAGE.x + WK_PAGE.w / 2;
  const parts = [0, 1, 2, 3].map(i => {
    const b = wkBand(i), [Y, H] = WK_PAGE.rows[i], sy = H / b.h;
    const tx = WK_PAGE.x - b.x * sx, ty = Y - b.y * sy;
    // a ferde (skewX) csoporton belül ez a mátrix rajzolja a sávot egyenesen, a böngészőablakbeli helyére
    css.push(`@keyframes wkM${i}{from{transform:matrix(${sx.toFixed(4)},0,${(c * sy).toFixed(4)},${sy.toFixed(4)},${(tx + c * ty).toFixed(2)},${ty.toFixed(2)})}to{transform:none}}`);
    return `<g class="sp-drag" style="animation-delay:${WK_T.drag0 + i * WK_T.step}s;transform-origin:${mid}px ${Y + H / 2}px">
      <g transform="skewX(-14)"><g class="sp-morph" style="animation-name:wkM${i}">
        <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h + .4}" fill="${WK_BANDS[i]}"/>${wkMotif(i)}
        <rect class="sp-flash" style="animation-delay:${(WK_T.morph + WK_T.morphDur + i * .06).toFixed(2)}s" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#fff"/>
      </g></g></g>`;
  });
  // egérmutató: minden blokkot balról "megfog", és a helyére húz
  const D = WK_T.morph - .25, pct = t => ((t - .25) / D * 100).toFixed(1) + '%', kf = [`0%{transform:translate(-60px,-40px);opacity:0}`];
  WK_PAGE.rows.forEach(([Y, H], i) => {
    const t = WK_T.drag0 + i * WK_T.step, cy = Y + H / 2;
    kf.push(`${pct(t)}{transform:translate(${mid - 170 + 24}px,${cy}px);opacity:1}`);
    kf.push(`${pct(t + WK_T.dragDur)}{transform:translate(${mid + 24}px,${cy}px);opacity:1}`);
  });
  kf.push(`100%{transform:translate(${mid + 60}px,130px);opacity:0}`);
  css.push(`@keyframes wkCur{${kf.join('')}}`);
  const win = `<g class="sp-win">
    <rect x="${WK_PAGE.x - 8}" y="-32" width="${WK_PAGE.w + 16}" height="146" rx="7" fill="#15171c" stroke="#33363f" stroke-width="1.2"/>
    <circle cx="${WK_PAGE.x + 2}" cy="-24" r="2.4" fill="#ff5f57"/><circle cx="${WK_PAGE.x + 10}" cy="-24" r="2.4" fill="#febc2e"/><circle cx="${WK_PAGE.x + 18}" cy="-24" r="2.4" fill="#28c840"/>
    <rect x="${WK_PAGE.x + 52}" y="-27" width="${WK_PAGE.w - 104}" height="6" rx="3" fill="#24272e"/>
    <line x1="${WK_PAGE.x - 8}" y1="-17" x2="${WK_PAGE.x + WK_PAGE.w + 8}" y2="-17" stroke="#33363f" stroke-width="1"/></g>`;
  const cursor = `<g class="sp-cur"><path d="M0 0 L0 15 L4 11 L7 17.5 L9.6 16.4 L6.7 10 L12 10 Z" fill="#fff" stroke="#111" stroke-width="1.1" stroke-linejoin="round"/></g>`;
  return { css: css.join('\n'), svg: `<svg viewBox="0 0 372 100" role="img" aria-label="WEBEKI">
  <defs><mask id="${id}-cut" maskUnits="userSpaceOnUse" x="-200" y="-200" width="800" height="500">
    <rect x="-200" y="-200" width="800" height="500" fill="#fff"/>
    <g transform="translate(274 52)"><g transform="scale(0)">
      <text x="0" y="29" text-anchor="middle" font-family="${WK_FONT}" font-size="74" font-weight="900" font-style="italic" letter-spacing="-1" fill="#000">EKI</text>
      <animateTransform attributeName="transform" type="scale" values="0;1.18;.96;1" keyTimes="0;.55;.8;1" dur=".45s" begin="${WK_T.eki}s" fill="freeze"/>
    </g></g></mask></defs>
  ${win}
  <g class="sp-word"><text x="176" y="87" text-anchor="end" font-family="${WK_FONT}" font-size="92" font-weight="900" font-style="italic" letter-spacing="-2" fill="#fff">WEB</text></g>
  <g mask="url(#${id}-cut)"><g transform="skewX(-14)"><rect class="sp-shadow" x="212" y="20" width="164" height="86" fill="#fff"/></g>${parts.join('')}</g>
  ${cursor}
</svg>` };
}

const WK_SPLASH_CSS = `
#wkSplash{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;cursor:pointer;
  background:radial-gradient(540px circle at 50% 46%,rgba(92,168,255,.2),rgba(255,92,138,.07) 55%,transparent 75%),#0b0b0d;
  transition:opacity .5s ease-in,transform .5s ease-in}
#wkSplash.out{opacity:0;transform:scale(1.04);pointer-events:none}
#wkSplash .sp{width:min(540px,84vw);display:flex;flex-direction:column;align-items:center;margin-top:10px}
#wkSplash svg{width:100%;height:auto;overflow:visible}
#wkSplash g{transform-box:view-box}
#wkSplash .sp-win{transform-origin:186px 41px;animation:spWin .35s cubic-bezier(.2,.8,.2,1) both,spOff .3s ${WK_T.morph}s ease-in forwards}
#wkSplash .sp-drag{animation:spDrag ${WK_T.dragDur}s cubic-bezier(.25,.9,.3,1.25) both}
#wkSplash .sp-morph{transform-origin:0 0;animation-duration:${WK_T.morphDur}s;animation-delay:${WK_T.morph}s;animation-timing-function:cubic-bezier(.65,0,.25,1);animation-fill-mode:both}
#wkSplash .sp-flash{opacity:0;animation:spFlash .3s ease-out forwards}
#wkSplash .sp-cur{animation:wkCur ${(WK_T.morph - .25).toFixed(2)}s .25s linear both}
#wkSplash .sp-word{animation:spWord .55s ${WK_T.morph + .1}s cubic-bezier(.2,.8,.2,1) both}
#wkSplash .sp-shadow{opacity:0;animation:spOn .15s ${WK_T.morph + WK_T.morphDur}s linear forwards}
#wkSplash .sp-line{height:4px;width:110%;margin-top:30px;border-radius:2px;background:linear-gradient(90deg,transparent,${WK_BANDS.join(',')},transparent);transform:scaleX(0);animation:spLine .6s ${WK_T.eki + .1}s cubic-bezier(.2,.8,.2,1) forwards}
#wkSplash .sp-sub{margin-top:22px;font:700 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.42em;color:#d9d9d9;white-space:nowrap;opacity:0;transform:translateY(8px);animation:spSub .5s ${WK_T.eki + .3}s ease-out forwards}
#wkSplash .sp-ver{position:fixed;bottom:22px;left:0;right:0;text-align:center;font:700 10px ui-monospace,Menlo,monospace;letter-spacing:.08em;color:#666;opacity:0;animation:spOn .6s 1s ease-out forwards}
@keyframes spWin{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}
@keyframes spOff{to{opacity:0;transform:scale(1.03)}}
@keyframes spDrag{from{transform:translateX(-170px) rotate(-5deg) scale(.94);opacity:0}25%{opacity:1}to{transform:none;opacity:1}}
@keyframes spFlash{0%{opacity:0}35%{opacity:.5}100%{opacity:0}}
@keyframes spWord{from{transform:translateX(-80px);opacity:0}to{transform:none;opacity:1}}
@keyframes spOn{to{opacity:1}}
@keyframes spLine{to{transform:scaleX(1)}}
@keyframes spSub{to{opacity:1;transform:none}}
@media (max-width:600px){#wkSplash .sp-sub{font-size:10px;letter-spacing:.3em}}
`;

/* Indító animáció: munkamenetenként egyszer (vagy a logóra kattintva újra). */
function wkSplash(force) {
  try { if (!force && sessionStorage.getItem('wk.splash')) return; sessionStorage.setItem('wk.splash', '1'); } catch (e) { }
  if (!force && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!document.getElementById('wkSplashCss')) { const st = document.createElement('style'); st.id = 'wkSplashCss'; st.textContent = WK_SPLASH_CSS; document.head.appendChild(st); }
  document.getElementById('wkSplash')?.remove();
  const ver = typeof VERSION !== 'undefined' ? VERSION : '', id = 'wks' + Date.now(), { svg, css } = wkSplashSVG(id);
  const el = document.createElement('div');
  el.id = 'wkSplash';
  el.innerHTML = `<style>${css}</style><div class="sp">${svg}<div class="sp-line"></div><div class="sp-sub">BLOKKOK · DIZÁJN · EXPORT</div></div><div class="sp-ver">V${ver} · EKIDIO</div>`;
  document.body.appendChild(el);
  wkFit(el.querySelector('svg'));
  let gone = false;
  const done = () => {
    if (gone) return; gone = true;
    el.classList.add('out'); setTimeout(() => el.remove(), 520);
    removeEventListener('keydown', done, true);
  };
  el.addEventListener('pointerdown', done);
  addEventListener('keydown', done, true);
  setTimeout(done, WK_T.out * 1000);
}

/* fejléc logó + favicon + indító animáció */
function wkBrand() {
  const slot = document.getElementById('brandLogo');
  if (slot) {
    slot.innerHTML = wkLogo('wkh');
    wkFit(slot.querySelector('svg'));
    document.fonts?.ready.then(() => wkFit(slot.querySelector('svg')));
    slot.title = 'WEBEKI – kattints az indító animációhoz';
    slot.addEventListener('click', () => wkSplash(true));
  }
  wkFavicon();
  wkSplash();
}
