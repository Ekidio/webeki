/* =========================================================================
   WEBEKI – ikonok
   ICONS:  rajzolt vonalikonok (24×24, a szöveg / fő szín színét veszik fel)
   SOCIAL: közösségi oldalak ikonjai
   EMOJIS: gyakori emojik az ikonválasztóhoz
   Egy mező értéke lehet emoji ("⚡") vagy rajzolt ikon ("i:phone").
   ========================================================================= */

const F_ = 'fill="currentColor" stroke="none"';   // kitöltött alakzat

const ICONS = {
  check: { n: 'pipa kész ok', d: '<path d="M20 6 9 17l-5-5"/>' },
  star: { n: 'csillag kedvenc', d: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>' },
  heart: { n: 'szív szeretet', d: '<path d="M12 20s-7-4.4-9-8.7C1.6 8.1 3.6 5 6.8 5c2 0 3.3 1.1 4.2 2.4C11.9 6.1 13.2 5 15.2 5c3.2 0 5.2 3.1 3.8 6.3C19 15.6 12 20 12 20z"/>' },
  bolt: { n: 'villám gyors energia', d: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>' },
  rocket: { n: 'rakéta indulás', d: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2"/><path d="m9 15-3-3c1-4 4.5-8.5 13-9-.5 8.5-5 12-9 13z"/><circle cx="15" cy="9" r="1.5"/>' },
  bulb: { n: 'ötlet villanykörte', d: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>' },
  target: { n: 'cél célpont', d: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>' },
  award: { n: 'díj érem minőség', d: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>' },
  shield: { n: 'pajzs biztonság védelem', d: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>' },
  lock: { n: 'lakat zár biztonság', d: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>' },
  chart: { n: 'grafikon statisztika növekedés', d: '<path d="M3 21h18"/><path d="M7 17v-5M12 17V7M17 17v-8"/>' },
  sliders: { n: 'beállítás testreszabás', d: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>' },
  phone: { n: 'telefon hívás', d: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>' },
  mail: { n: 'email levél', d: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>' },
  message: { n: 'üzenet chat', d: '<path d="M4 5h16v11H9l-5 4z"/>' },
  pin: { n: 'cím hely térkép', d: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>' },
  globe: { n: 'világ web weboldal', d: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>' },
  clock: { n: 'óra idő nyitvatartás', d: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
  calendar: { n: 'naptár időpont', d: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>' },
  user: { n: 'személy felhasználó', d: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>' },
  users: { n: 'csapat emberek', d: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5"/>' },
  home: { n: 'otthon ház', d: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>' },
  cart: { n: 'kosár vásárlás bolt', d: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11.5l2-8H6.2"/>' },
  tag: { n: 'címke ár akció', d: '<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.5"/>' },
  gift: { n: 'ajándék', d: '<rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8S10 3 7.5 4 9 8 12 8zM12 8s2-5 4.5-4S15 8 12 8z"/>' },
  truck: { n: 'szállítás kiszállítás', d: '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>' },
  camera: { n: 'fényképező fotó', d: '<path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="3.5"/>' },
  image: { n: 'kép galéria', d: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5-5-9 9"/>' },
  play: { n: 'lejátszás videó', d: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>' },
  music: { n: 'zene hang', d: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>' },
  code: { n: 'kód fejlesztés', d: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>' },
  monitor: { n: 'monitor számítógép asztali', d: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>' },
  mobile: { n: 'mobil telefon okostelefon', d: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>' },
  palette: { n: 'paletta design szín', d: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.2-1.8-.5-1-.1-2.2 1.1-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>' },
  leaf: { n: 'levél természet bio', d: '<path d="M5 19C5 10 10 4 20 4c0 10-6 15-15 15z"/><path d="m5 19 8-8"/>' },
  sun: { n: 'nap nyár', d: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>' },
  coffee: { n: 'kávé kávézó', d: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2M8 2v3M12 2v3"/>' },
  search: { n: 'keresés nagyító', d: '<circle cx="11" cy="11" r="7"/><path d="m21 21-5-5"/>' },
  download: { n: 'letöltés', d: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>' },
  thumb: { n: 'tetszik like jó', d: '<path d="M7 11v10H3V11zM7 11l4-8a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 21H7"/>' },
};

const SOCIAL = {
  facebook: { n: 'Facebook', d: `<path ${F_} d="M14 8.5V7c0-.8.3-1.2 1.3-1.2H17V2.2A21 21 0 0 0 14.6 2C11.9 2 10 3.7 10 6.6v1.9H7v3.8h3V22h4v-9.7h3l.5-3.8z"/>` },
  instagram: { n: 'Instagram', d: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor"/>' },
  youtube: { n: 'YouTube', d: `<path ${F_} fill-rule="evenodd" d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12a31 31 0 0 0 .4 3.8 3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1c.3-1.3.4-2.5.4-3.8s-.1-2.5-.4-3.8zM10 15V9l5.2 3z"/>` },
  tiktok: { n: 'TikTok', d: `<path ${F_} d="M16.6 2c.4 2.4 1.9 4 4.2 4.3v3.4a8 8 0 0 1-4.1-1.3v6.4A6.2 6.2 0 1 1 10.5 8.6v3.5a2.8 2.8 0 1 0 2.4 2.8V2z"/>` },
  x: { n: 'X (Twitter)', d: `<path ${F_} d="M3.5 3.5h5.2L20.5 20.5h-5.2z"/><path d="M20 3.8 13.4 11.3M10.6 12.7 4 20.2"/>` },
  linkedin: { n: 'LinkedIn', d: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10.5V17M8 7.2v.1M12 17v-6.5M12 13.5a2.8 2.8 0 0 1 5.5 0V17"/>' },
  whatsapp: { n: 'WhatsApp', d: `<path d="M3.5 20.5 4.9 16A8.6 8.6 0 1 1 8 19.1z"/><path ${F_} d="M9.2 7.8c-.4 0-.9.4-1 1-.2 1 .3 2.7 1.8 4.3 1.6 1.6 3.4 2.3 4.4 2.1.6-.1 1-.6 1.1-1 .1-.3 0-.5-.3-.7l-1.4-.7c-.3-.1-.5 0-.7.2l-.5.6c-.2.2-.4.2-.6.1a6 6 0 0 1-2.4-2.3c-.1-.2-.1-.4.1-.6l.5-.5c.2-.2.2-.4.1-.7l-.7-1.5c-.1-.2-.3-.3-.5-.3z"/>` },
  messenger: { n: 'Messenger', d: `<path d="M12 3C7 3 3 6.7 3 11.4c0 2.6 1.3 5 3.3 6.5V21l3-1.7c.9.3 1.8.4 2.7.4 5 0 9-3.7 9-8.3S17 3 12 3z"/><path ${F_} d="m7 13.8 3-4.6 2.4 2 3.6-2-3 4.6-2.4-2z"/>` },
  telegram: { n: 'Telegram', d: '<path d="M21 4 3 11.2l6 2.1 2.2 6.2 3.3-4 5 3.8z"/><path d="m9 13.3 8.5-6.3"/>' },
  pinterest: { n: 'Pinterest', d: '<circle cx="12" cy="12" r="9"/><path d="M11.2 8.2h2.2a2.9 2.9 0 0 1 0 5.8h-1.9M11.5 8.5 9.2 20"/>' },
  github: { n: 'GitHub', d: '<path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>' },
  email: { n: 'E-mail', d: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>' },
  web: { n: 'Weboldal', d: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>' },
};

const EMOJIS = ('⚡ 🚀 💡 ⭐ ✨ 🔥 🎯 🏆 ✅ 👍 🙌 🤝 😊 ❤️ 💎 🎨 ' +
  '📱 💻 🖥️ ⌨️ 🔒 🛡️ ⚙️ 🔧 🧰 🔨 🏗️ 📈 📊 💰 💼 🛒 ' +
  '🎁 📦 🚚 ✈️ 🌍 🏠 📍 🕒 📅 📞 ✉️ 💬 🔔 👥 👤 👶 ' +
  '🎓 📚 ✏️ 📝 📌 🔍 📷 🎥 🎵 🎧 🎮 ⚽ 🏋️ 🧘 🍕 ☕ ' +
  '🍰 🍷 🍎 🥗 🌱 🌿 🍃 🌸 ☀️ 🌙 🌊 ⛰️ 🏖️ 🚗 🐶 🐱 ' +
  '🏥 💊 🧪 💄 👗 ✂️ 🧹 💧 ♻️ ⏱️ 🎉 🎈 💌 🌟 🥇 🔑').split(' ');

const svg = d => `<svg class="wk-svg" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/* mező érték → HTML: "i:phone" → rajzolt ikon, minden más → a beírt szöveg / emoji */
const icoHTML = v => /^i:/.test(v || '') ? (ICONS[v.slice(2)] ? svg(ICONS[v.slice(2)].d) : '') : esc(v);
