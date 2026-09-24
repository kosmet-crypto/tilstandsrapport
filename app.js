/* Tilstandsrapport: all logic for index.html (Alpine.js component + PDF). */

// Bump on every change: the web version compares this with the published app.js to find updates.
const WEB_VERSION = '1.3.0';

const REPORT_TYPES = ['Innflytting', 'Utflytting', 'Periodisk kontroll', 'Befaring'];
const FAGPERSONER = ['Vaktmester', 'Elektriker', 'Rørlegger', 'Maler', 'Snekker', 'Flislegger',
  'Vaskefirma', 'Servicepartner', 'Låsesmed', 'Skadedyrkontroll', 'Leietaker utbedrer'];
const HASTEGRAD = ['Akutt', 'Snart', 'Kan vente'];
const BELASTES = ['Utleier', 'Leietaker'];

// Checklist building blocks: [name, typical defects, default fagperson]
const P = {
  vegger:   ['Vegger / tak', ['Skitne vegger', 'Hull', 'Maling trengs', 'Sprekker', 'Fuktskade', 'Mugg'], 'Maler'],
  gulv:     ['Gulv / lister', ['Riper', 'Hakk / sår', 'Løse lister', 'Misfarging', 'Fuktskade'], 'Snekker'],
  dorer:    ['Dører / vinduer', ['Dør henger', 'Lås defekt', 'Knust glass', 'Tetningslist', 'Håndtak løst', 'Vindu tett ikke'], 'Snekker'],
  el:       ['Elektrisk', ['Løs kontakt', 'Mangler deksel', 'Virker ikke', 'Lampe mangler', 'Sikring løser ut'], 'Elektriker'],
  vask:     ['Rengjøring', ['Ikke rengjort', 'Gjenstander igjen', 'Søppel'], 'Vaskefirma'],
  benk:     ['Benk / skap', ['Skade på benkeplate', 'Skapdør henger', 'Mangler hyller', 'Fuktskade under vask'], 'Snekker'],
  kran:     ['Oppvask / kran', ['Drypper', 'Tett avløp', 'Lekkasje'], 'Rørlegger'],
  vifte:    ['Kjøkkenvifte', ['Virker ikke', 'Skittent filter', 'Lys virker ikke'], 'Elektriker'],
  wc:       ['WC', ['Renner', 'Løst sete', 'Sprekk', 'Tett'], 'Rørlegger'],
  servant:  ['Servant / speil', ['Drypper', 'Sprekk', 'Tett avløp', 'Speil skadet'], 'Rørlegger'],
  dusj:     ['Dusj / sluk', ['Tett sluk', 'Lekkasje', 'Lukt', 'Dusjhode / slange defekt'], 'Rørlegger'],
  fliser:   ['Fliser / fuger', ['Sprukne fliser', 'Misfargede fuger', 'Silikon løsnet'], 'Flislegger'],
  ventil:   ['Ventilasjon', ['Virker ikke', 'Skitten', 'Tett ventil'], 'Vaktmester'],
  rekkverk: ['Rekkverk', ['Løst', 'Rust', 'Skadet'], 'Snekker'],
  balgulv:  ['Gulv / dekke', ['Råte', 'Sprekker', 'Løse bord'], 'Snekker'],
  bodlas:   ['Dør / lås', ['Lås defekt', 'Dør skadet', 'Mangler nøkkel'], 'Låsesmed'],
  royk:     ['Røykvarsler', ['Mangler', 'Virker ikke', 'Batteri tomt', 'Utgått dato'], 'Vaktmester'],
  slukker:  ['Brannslukker / brannteppe', ['Mangler', 'Utgått kontroll', 'Brukt / tømt'], 'Vaktmester'],
  romning:  ['Rømningsvei', ['Blokkert', 'Vindu kan ikke åpnes', 'Mangler stige'], 'Vaktmester'],
  skadedyr: ['Skadedyr', ['Kakerlakker', 'Veggdyr', 'Mus / rotter', 'Maur'], 'Skadedyrkontroll'],
};

// Default room checklists (keys into P). The user can edit a copy under Innstillinger → Sjekklister.
const DEFAULT_ROOM_KEYS = [
  ['Entré / gang',   ['vegger', 'gulv', 'dorer', 'el', 'vask'], true],
  ['Stue',           ['vegger', 'gulv', 'dorer', 'el', 'vask'], true],
  ['Kjøkken',        ['vegger', 'gulv', 'benk', 'kran', 'vifte', 'el', 'vask'], true],
  ['Soverom',        ['vegger', 'gulv', 'dorer', 'el', 'vask'], true],
  ['Bad',            ['vegger', 'wc', 'servant', 'dusj', 'fliser', 'ventil', 'el', 'vask'], true],
  ['WC',             ['vegger', 'wc', 'servant', 'ventil', 'vask'], false],
  ['Vaskerom',       ['vegger', 'gulv', 'kran', 'ventil', 'el', 'vask'], false],
  ['Bod',            ['bodlas', 'vegger', 'vask'], false],
  ['Balkong',        ['rekkverk', 'balgulv', 'vask'], false],
  ['Brannsikkerhet', ['royk', 'slukker', 'romning'], true],
  ['Skadedyr',       ['skadedyr'], false],
  ['Annet rom',      ['vegger', 'gulv', 'dorer', 'el', 'vask'], false],
];
const HVITEVARER = 'Hvitevarer';

const APPLIANCES = {
  'Kjøleskap':        ['Kjøler ikke', 'Defekt pakning', 'Mangler hyller / skuffer', 'Skittent'],
  'Fryser':           ['Fryser ikke', 'Mye is', 'Defekt pakning', 'Skitten'],
  'Komfyr / stekeovn':['Plate virker ikke', 'Stekeovn virker ikke', 'Mangler rist / brett', 'Skitten'],
  'Oppvaskmaskin':    ['Lekker', 'Vasker dårlig', 'Pumper ikke ut vann'],
  'Vaskemaskin':      ['Lekker', 'Ulyd', 'Pumper ikke ut vann', 'Sentrifugerer ikke'],
  'Tørketrommel':     ['Varmer ikke', 'Tett filter', 'Ulyd'],
  'Mikrobølgeovn':    ['Virker ikke', 'Gnistrer', 'Tallerken roterer ikke'],
};
const DEFAULT_APPLIANCES = ['Kjøleskap', 'Komfyr / stekeovn'];

// Nothing personal is built in: the first-start wizard asks for all of it.
const DEFAULT_SETTINGS = {
  navn: '', stilling: 'Boligforvalter', bydel: '', kommune: '', telefon: '', epost: '',
  logo: '', adresser: [], pinHash: '', setupDone: false,
  checklist: null,   // null = built-in checklist
  stempel: true,     // date and address printed on photos
};
// Settings that travel in a profile/backup file (never the PIN).
const PROFILE_KEYS = ['navn', 'stilling', 'bydel', 'kommune', 'telefon', 'epost', 'logo', 'adresser', 'checklist', 'stempel'];
const TILTAK_STATUS = ['Åpen', 'Bestilt', 'Utført'];

const LOCK_AFTER_MS = 5 * 60 * 1000;

/* ---------------- helpers ---------------- */

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDate(v) {
  if (!v) return '';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y, m, d] = v.split('-'); return `${d}.${m}.${y}`; }
  const d = new Date(v);
  return isNaN(d) ? '' : `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}
function kr(n) { return Math.round(Number(n) || 0).toLocaleString('nb-NO') + ' kr'; }
function safeFileName(s) {
  return String(s || '').replace(/[^A-Za-z0-9ÆØÅæøåÄÖÜäöüé.-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 50);
}

/**
 * The checklist every new report is built from:
 * { rooms: [{ name, inNew, appliances?, items: [{ name, options, fagperson }] }],
 *   appliances: [{ name, defects, inNew }], fagpersoner: [..] }
 * Reports copy their items, so editing the checklist never changes existing reports.
 */
function defaultChecklist() {
  const rooms = DEFAULT_ROOM_KEYS.map(([name, keys, inNew]) => ({
    name, inNew, items: keys.map(k => ({ name: P[k][0], options: [...P[k][1]], fagperson: P[k][2] })),
  }));
  rooms.splice(rooms.findIndex(r => r.name === 'Skadedyr'), 0, { name: HVITEVARER, inNew: true, appliances: true, items: [] });
  return {
    rooms,
    appliances: Object.entries(APPLIANCES).map(([name, defects]) => ({ name, defects: [...defects], inNew: DEFAULT_APPLIANCES.includes(name) })),
    fagpersoner: [...FAGPERSONER],
  };
}
let CHECKLIST = defaultChecklist();

function blankItem(extra) {
  return Object.assign({ id: uid(), name: '', status: null, options: [], selected: [], kommentar: '',
    fagperson: 'Vaktmester', hast: 'Snart', kostnad: '', belastes: 'Utleier', photos: [], custom: false,
    tiltak: { status: 'Åpen', bestilt: '', utfort: '' } }, extra);
}
function makeRoom(name) {
  const def = CHECKLIST.rooms.find(r => r.name === name) || { name, items: [] };
  if (def.appliances) {
    return { id: uid(), kind: HVITEVARER, name, items: CHECKLIST.appliances.filter(a => a.inNew).map(a => makeAppliance(a.name)) };
  }
  return { id: uid(), kind: name, name,
    items: def.items.map(it => blankItem({ name: it.name, options: [...it.options], fagperson: it.fagperson })) };
}
function makeAppliance(type) {
  const def = CHECKLIST.appliances.find(a => a.name === type);
  return blankItem({ name: type, options: def ? [...def.defects] : [], fagperson: 'Servicepartner' });
}
function newReportData() {
  return {
    id: uid(), created: Date.now(), updated: Date.now(), pdfAt: null,
    type: 'Innflytting', adresse: '', leilighet: '', dato: today(),
    leietaker: { navn: '', telefon: '', epost: '', tilstede: 'Ja' },
    strom: { maler: '', stand: '' },
    nokler: { nokler: '', brikker: '', merknad: '' },
    rooms: CHECKLIST.rooms.filter(r => r.inNew).map(r => makeRoom(r.name)),
    merknad: '',
    signatures: { forvalter: null, leietaker: null },
    compareWith: null,
  };
}
/** Older reports lack newer fields; fill them in when a report is loaded. */
function upgradeReport(r) {
  for (const room of r.rooms) for (const it of room.items) {
    if (!it.tiltak) it.tiltak = { status: 'Åpen', bestilt: '', utfort: '' };
  }
  if (!('compareWith' in r)) r.compareWith = null;
  return r;
}
/** "Soverom 2" when a report has several rooms with the same name. */
function labelIn(rooms, room) {
  const same = rooms.filter(r => r.name === room.name);
  return same.length > 1 ? `${room.name} ${same.indexOf(room) + 1}` : room.name;
}

function reportStats(r) {
  let total = 0, checked = 0, feil = 0, photos = 0;
  for (const room of r.rooms || []) for (const it of room.items) {
    total++;
    if (it.status) checked++;
    if (it.status === 'FEIL') { feil++; photos += it.photos.length; }
  }
  return { total, checked, feil, photos };
}

async function hashPin(pin) {
  const text = 'tilstand:' + pin;
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 2166136261;
  for (const c of text) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return 'fnv' + (h >>> 0).toString(16);
}

/** Resizes a photo to at most `max` px on the long side and re-encodes it as JPEG.
 *  `stamp` (optional) is printed on a dark band along the bottom edge. */
function compressImage(file, stamp = '', max = 1600, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      if (stamp) {
        const fs = Math.max(14, Math.round(c.width * 0.026));
        ctx.font = `600 ${fs}px system-ui, sans-serif`;
        const band = Math.round(fs * 1.9);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, c.height - band, c.width, band);
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'middle';
        let text = stamp;
        while (text.length > 4 && ctx.measureText(text).width > c.width - fs) text = text.slice(0, -2);
        if (text !== stamp) text = text.slice(0, -1) + '…';
        ctx.fillText(text, Math.round(fs * 0.6), c.height - band / 2);
      }
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Kunne ikke lese bildet')); };
    img.src = url;
  });
}

/** "24.09.2026 14:05 · Adresse, H0101" from the photo's own time when it has one. */
function photoStamp(file, report) {
  const t = file.lastModified && Math.abs(Date.now() - file.lastModified) < 366 * 864e5 ? new Date(file.lastModified) : new Date();
  const time = `${formatDate(t)} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  const place = [report.adresse, report.leilighet].filter(Boolean).join(', ');
  return [time, place].filter(Boolean).join(' · ');
}

/** Shrinks a logo to at most `max` px and keeps transparency (PNG). */
function compressLogo(file, max = 500) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * scale));
      c.height = Math.max(1, Math.round(img.naturalHeight * scale));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Kunne ikke lese bildet')); };
    img.src = url;
  });
}

/* ---------------- storage (IndexedDB) ---------------- */

const DB = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('tilstandsrapport', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        db.createObjectStore('reports', { keyPath: 'id' });
        db.createObjectStore('kv');
      };
      req.onsuccess = () => { this._db = req.result; resolve(this._db); };
      req.onerror = () => reject(req.error);
    });
  },
  async tx(store, mode, fn) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => resolve(req && req.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  },
  get(store, key) { return this.tx(store, 'readonly', s => s.get(key)); },
  all(store) { return this.tx(store, 'readonly', s => s.getAll()); },
  put(store, value, key) { return this.tx(store, 'readwrite', s => key === undefined ? s.put(value) : s.put(value, key)); },
  del(store, key) { return this.tx(store, 'readwrite', s => s.delete(key)); },
  clear(store) { return this.tx(store, 'readwrite', s => s.clear()); },
};

function toPlain(obj) { return JSON.parse(JSON.stringify(obj)); }

/* ---------------- comparison with an earlier report ---------------- */

function normAddr(a) { return String(a || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
/** Map "Room label|Item name" -> item of the reference report. */
function refMapOf(ref) {
  const map = {};
  for (const room of ref.rooms) for (const it of room.items) map[labelIn(ref.rooms, room) + '|' + it.name] = it;
  return map;
}
/** 'ny' = defect now, OK before; 'for' = defect then and now; '' otherwise. */
function compareTag(prev, it) {
  if (!prev || it.status !== 'FEIL') return '';
  if (prev.status === 'OK') return 'ny';
  if (prev.status === 'FEIL') return 'for';
  return '';
}
function describeItem(it) { return [it.selected.join(', '), (it.kommentar || '').trim()].filter(Boolean).join('. '); }
function tiltakText(t) {
  if (!t || t.status === 'Åpen') return '';
  const d = t.status === 'Utført' ? t.utfort : t.bestilt;
  return t.status + (d ? ' ' + formatDate(d) : '');
}
function csvCell(v) {
  const s = String(v == null ? '' : v);
  return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/* ---------------- PDF ---------------- */

// Built-in PDF fonts only cover Latin-1 (æøå are fine); map the rest to look-alikes.
function pdfText(s) {
  return String(s == null ? '' : s)
    .replace(/[–—−]/g, '-').replace(/…/g, '...')
    .replace(/[‘’‚]/g, "'").replace(/[“”„]/g, '"')
    .replace(/[   ]/g, ' ').replace(/•/g, '·')
    .replace(/[^\n\r\t\x20-\x7E\xA0-\xFF]/g, '?');
}

function buildPdf(report, settings, roomLabel, ref) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 14, BOTTOM = 280;
  const brand = [0, 38, 100], red = [190, 18, 60], green = [4, 120, 87], grey = [100, 116, 139];
  const T = pdfText;

  // Number every photo in document order so the text can refer to "Bilde n".
  const photoList = [];
  for (const room of report.rooms) for (const it of room.items) {
    if (it.status !== 'FEIL') continue;
    it._nr = it.photos.map(p => { photoList.push({ data: p.data, caption: `${roomLabel(room)} - ${it.name}` }); return photoList.length; });
  }
  const refs = it => it._nr && it._nr.length ? ` (Bilde ${it._nr.join(', ')})` : '';
  const refMap = ref ? refMapOf(ref) : null;
  const refName = ref ? `${ref.type.toLowerCase()} ${formatDate(ref.dato)}` : '';
  const tagOf = (room, it) => refMap ? compareTag(refMap[labelIn(report.rooms, room) + '|' + it.name], it) : '';
  const tagText = t => t === 'ny' ? `Ny siden ${refName}` : t === 'for' ? `Fantes ved ${refName}` : '';
  const describeIn = (room, it) => {
    const tag = tagText(tagOf(room, it));
    return describeItem(it) + refs(it) + (tag ? ` [${tag}]` : '');
  };

  // Header
  doc.setFillColor(...brand); doc.rect(0, 0, W, 32, 'F');
  let titleX = M;
  if (settings.logo) {
    // Logos are usually dark, so they sit on a white tile inside the blue band.
    doc.setFillColor(255, 255, 255); doc.roundedRect(M, 5, 22, 22, 2, 2, 'F');
    const lp = doc.getImageProperties(settings.logo);
    const ls = Math.min(19 / lp.width, 19 / lp.height);
    const lw = lp.width * ls, lh = lp.height * ls;
    doc.addImage(settings.logo, 'PNG', M + (22 - lw) / 2, 5 + (22 - lh) / 2, lw, lh);
    titleX = M + 27;
  }
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(19);
  doc.text('TILSTANDSRAPPORT', titleX, 14);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  doc.text(T(report.type.toUpperCase()), titleX, 22);
  doc.setFontSize(9);
  const right = [
    [settings.bydel, 'bold'], [settings.kommune, 'normal'],
    [[settings.stilling, settings.navn].filter(Boolean).join(': '), 'normal'],
    [[settings.telefon, settings.epost].filter(Boolean).join(' · '), 'normal'],
  ].filter(([t]) => t);
  right.forEach(([t, style], i) => {
    doc.setFont('helvetica', style);
    doc.text(T(t), W - M, 11 + i * 5, { align: 'right' });
  });

  const lt = report.leietaker;
  const nokkelWord = report.type === 'Utflytting' ? 'Innlevert' : report.type === 'Innflytting' ? 'Utlevert' : 'Registrert';
  const info = [
    ['Adresse', report.adresse, 'Dato', formatDate(report.dato)],
    ['Leil.nr', report.leilighet, 'Type', report.type],
    ['Leietaker', lt.navn, 'Telefon', lt.telefon],
    ['E-post', lt.epost, 'Til stede', lt.tilstede],
    ['Strøm målernr', report.strom.maler, 'Strøm stand', report.strom.stand ? report.strom.stand + ' kWh' : ''],
    [`${nokkelWord} nøkler`, report.nokler.nokler, 'Kort / brikker', report.nokler.brikker],
  ].map(r => r.map(v => T(v || '-')));
  if (report.nokler.merknad) info.push(['Merknad', { content: T(report.nokler.merknad), colSpan: 3 }]);

  doc.autoTable({
    startY: 38, body: info, theme: 'plain', margin: { left: M, right: M },
    styles: { fontSize: 9, cellPadding: 1.4, textColor: 20 },
    columnStyles: { 0: { fontStyle: 'bold', textColor: grey, cellWidth: 32 }, 2: { fontStyle: 'bold', textColor: grey, cellWidth: 28 } },
  });
  let y = doc.lastAutoTable.finalY + 6;

  // Summary
  const st = reportStats(report);
  doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252);
  doc.roundedRect(M, y, W - 2 * M, 14, 2, 2, 'FD');
  doc.setFontSize(10); doc.setTextColor(20);
  doc.setFont('helvetica', 'bold');
  const cols = [[`${st.checked} av ${st.total}`, 'punkter kontrollert'], [String(st.feil), 'avvik'], [String(photoList.length), 'bilder']];
  cols.forEach(([big, small], i) => {
    const x = M + 8 + i * 62;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.setTextColor(...(i === 1 && st.feil ? red : [20, 20, 20]));
    doc.text(big, x, y + 9);
    const bigW = doc.getTextWidth(big);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...grey);
    doc.text(small, x + bigW + 2, y + 9);
  });
  y += 22;

  if (ref) {
    let ny = 0, fr = 0;
    for (const room of report.rooms) for (const it of room.items) { const t = tagOf(room, it); if (t === 'ny') ny++; if (t === 'for') fr++; }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(20);
    doc.text(T(`Sammenlignet med ${refName}: ${ny} nye avvik, ${fr} fantes fra før.`), M, y - 3);
    y += 5;
  }

  // Defects grouped by trade: doubles as the order list.
  const hastRank = { 'Akutt': 0, 'Snart': 1, 'Kan vente': 2 };
  const defects = [];
  for (const room of report.rooms) for (const it of room.items) {
    if (it.status === 'FEIL') defects.push({ room, it });
  }
  if (defects.length) {
    defects.sort((a, b) => a.it.fagperson.localeCompare(b.it.fagperson, 'nb') || hastRank[a.it.hast] - hastRank[b.it.hast]);
    const sums = { Utleier: 0, Leietaker: 0 };
    defects.forEach(d => { sums[d.it.belastes] = (sums[d.it.belastes] || 0) + (Number(d.it.kostnad) || 0); });
    const foot = [];
    if (sums.Utleier || sums.Leietaker) {
      foot.push([{ content: T(`Sum belastes leietaker: ${kr(sums.Leietaker)}     Sum belastes utleier: ${kr(sums.Utleier)}`), colSpan: 6, styles: { halign: 'right' } }]);
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...brand);
    doc.text('AVVIK OG TILTAK', M, y); y += 2;
    doc.autoTable({
      startY: y, margin: { left: M, right: M },
      head: [['Fagperson', 'Rom / punkt', 'Beskrivelse', 'Hast / status', 'Kostnad', 'Belastes']],
      body: defects.map(({ room, it }) => [it.fagperson, `${roomLabel(room)}\n${it.name}`, describeIn(room, it) || '-',
        [it.hast, tiltakText(it.tiltak)].filter(Boolean).join('\n'),
        it.kostnad ? kr(it.kostnad) : '-', it.belastes].map(T)),
      foot, showFoot: 'lastPage',
      headStyles: { fillColor: red, fontSize: 8 }, footStyles: { fillColor: [255, 228, 230], textColor: 20, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 1.8, valign: 'top' },
      columnStyles: { 0: { cellWidth: 26, fontStyle: 'bold' }, 1: { cellWidth: 34 }, 3: { cellWidth: 20 }, 4: { cellWidth: 20, halign: 'right' }, 5: { cellWidth: 19 } },
      didParseCell: d => { if (d.section === 'body' && d.column.index === 3 && String(d.cell.raw).startsWith('Akutt')) { d.cell.styles.textColor = red; d.cell.styles.fontStyle = 'bold'; } },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Per room
  if (y > BOTTOM - 30) { doc.addPage(); y = 20; }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...brand);
  doc.text('KONTROLL PER ROM', M, y); y += 2;
  for (const room of report.rooms) {
    const rows = room.items.filter(it => it.status).map(it => [
      it.name, it.status === 'OK' ? 'OK' : 'AVVIK',
      it.status === 'OK' ? 'I orden' : (describeIn(room, it) || '-'),
      it.status === 'FEIL' ? it.fagperson : '-',
    ].map(T));
    if (!rows.length) continue;
    doc.autoTable({
      startY: y, margin: { left: M, right: M },
      head: [[T(roomLabel(room).toUpperCase()), 'Status', 'Merknad', 'Tiltak']],
      body: rows,
      headStyles: { fillColor: room.kind === 'Hvitevarer' ? green : brand, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 1.6, valign: 'top' },
      columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 16, fontStyle: 'bold' }, 3: { cellWidth: 30 } },
      didParseCell: d => {
        if (d.section !== 'body' || d.column.index !== 1) return;
        d.cell.styles.textColor = d.cell.raw === 'AVVIK' ? red : green;
      },
    });
    y = doc.lastAutoTable.finalY + 5;
  }
  const unchecked = st.total - st.checked;
  if (unchecked) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...grey);
    doc.text(`${unchecked} punkt(er) ble ikke kontrollert og er utelatt.`, M, y + 1);
    y += 6;
  }

  // General remark
  if (report.merknad.trim()) {
    const lines = doc.splitTextToSize(T(report.merknad.trim()), W - 2 * M);
    if (y + 10 + lines.length * 4.2 > BOTTOM) { doc.addPage(); y = 20; }
    y += 3;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...brand);
    doc.text('GENERELL MERKNAD', M, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(20);
    doc.text(lines, M, y); y += lines.length * 4.2 + 2;
  }

  // Signatures
  if (y + 52 > BOTTOM) { doc.addPage(); y = 20; }
  y += 6;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...grey);
  doc.text(T('Partene bekrefter at rapporten gir en riktig beskrivelse av boligens tilstand på befaringsdagen.'), M, y);
  y += 5;
  const sigs = [
    { img: report.signatures.forvalter, name: settings.navn, role: [settings.stilling, settings.bydel].filter(Boolean).join(', '), x: M },
    { img: report.signatures.leietaker, name: lt.navn, role: 'Leietaker', x: 112 },
  ];
  for (const s of sigs) {
    if (s.img) doc.addImage(s.img, 'PNG', s.x, y, 66, 25);
    doc.setDrawColor(150); doc.line(s.x, y + 27, s.x + 84, y + 27);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20);
    doc.text(T(s.name || ''), s.x, y + 32);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...grey);
    doc.text(T(s.role), s.x, y + 36);
    doc.text(T(`${report.adresse ? report.adresse + ', ' : ''}${formatDate(report.dato)}`), s.x, y + 40);
  }

  // Photos, six per page
  if (photoList.length) {
    const boxW = 87, boxH = 66, gap = 8, rowH = 82;
    let i = 0;
    for (const p of photoList) {
      const slot = i % 6;
      if (slot === 0) {
        doc.addPage();
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...brand);
        doc.text('BILDEDOKUMENTASJON', M, 16);
      }
      const x = M + (slot % 2) * (boxW + gap);
      const top = 24 + Math.floor(slot / 2) * rowH;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(20);
      const cap = doc.splitTextToSize(T(`Bilde ${i + 1}: ${p.caption}`), boxW)[0];
      doc.text(cap, x, top);
      const props = doc.getImageProperties(p.data);
      const s = Math.min(boxW / props.width, boxH / props.height);
      const w = props.width * s, h = props.height * s;
      doc.setFillColor(241, 245, 249); doc.rect(x, top + 2, boxW, boxH, 'F');
      doc.addImage(p.data, 'JPEG', x + (boxW - w) / 2, top + 2 + (boxH - h) / 2, w, h, undefined, 'FAST');
      i++;
    }
  }

  // Footer
  const n = doc.internal.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(150);
    doc.text(T(`Tilstandsrapport · ${report.adresse || ''} · ${formatDate(report.dato)}`), M, 290);
    doc.text(`Side ${i} av ${n}`, W - M, 290, { align: 'right' });
  }
  for (const room of report.rooms) for (const it of room.items) delete it._nr;
  return doc;
}

/* ---------------- Alpine component ---------------- */

function app() {
  return {
    REPORT_TYPES, HASTEGRAD, BELASTES, TILTAK_STATUS, HVITEVARER,
    screen: 'list',
    _defCl: defaultChecklist(), clOpen: null,
    ref: null, refMap: null,
    defects: [], defFilter: 'ikke-utfort', defSearch: '',
    reports: [],
    report: null,
    openRoom: null,
    settings: { ...DEFAULT_SETTINGS },
    locked: false, pinInput: '', newPin: '',
    busy: '', toastMsg: '', _toastT: null, updateReady: '',
    _saveT: null, _hiddenAt: 0,
    pads: {},
    isAndroid: !!window.TilstandAndroid,
    appVersion: window.TilstandAndroid && TilstandAndroid.getVersion ? TilstandAndroid.getVersion() : WEB_VERSION,
    formatDate, stats: reportStats,

    async init() {
      try {
        const s = await DB.get('kv', 'settings');
        if (s) this.settings = { ...DEFAULT_SETTINGS, ...s };
      } catch (e) {
        this.toast('Lagring er ikke tilgjengelig i denne nettleseren');
      }
      if (!Array.isArray(this.settings.adresser)) this.settings.adresser = [];
      this.applyChecklist();
      if (!this.settings.setupDone) this.screen = 'setup';
      if (this.settings.pinHash) this.lock();
      await this.loadList();

      // Autosave: every edit in the editor ends in one of these events.
      for (const ev of ['input', 'change', 'click']) {
        document.addEventListener(ev, () => { if (this.screen === 'edit' && this.report) this.queueSave(); });
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { this._hiddenAt = Date.now(); this.saveNow(); }
        else if (this.settings.pinHash && Date.now() - this._hiddenAt > LOCK_AFTER_MS) this.lock();
      });
      window.addEventListener('resize', () => this.resizePads());
      window.appBack = () => this.back();
      if (navigator.onLine) setTimeout(() => this.checkUpdate(true), 3000);
    },

    /* ---- lock ---- */
    lock() { this.locked = true; this.pinInput = ''; this.$nextTick(() => this.$refs.pin && this.$refs.pin.focus()); },
    async unlock() {
      if (await hashPin(this.pinInput) === this.settings.pinHash) { this.locked = false; this.pinInput = ''; }
      else { this.pinInput = ''; this.toast('Feil PIN'); }
    },
    async setPin() {
      if (!/^\d{4,8}$/.test(this.newPin)) return this.toast('PIN må være 4–8 siffer');
      this.settings.pinHash = await hashPin(this.newPin);
      this.newPin = '';
      await this.saveSettings();
      this.toast('PIN er satt');
    },
    async removePin() {
      if (!confirm('Fjerne PIN-koden?')) return;
      this.settings.pinHash = '';
      await this.saveSettings();
    },
    async saveSettings() { this.applyChecklist(); await DB.put('kv', toPlain(this.settings), 'settings'); },
    applyChecklist() { CHECKLIST = this.settings.checklist ? toPlain(this.settings.checklist) : defaultChecklist(); },
    cl() { return this.settings.checklist || this._defCl; },

    /* ---- checklist editor ---- */
    openChecklist() {
      if (!this.settings.checklist) this.settings.checklist = defaultChecklist();
      this.clOpen = null;
      this.screen = 'checklist';
      window.scrollTo(0, 0);
    },
    lines(text) { return [...new Set(String(text).split(/[\n,]/).map(x => x.trim()).filter(Boolean))]; },
    clAddRoom() {
      const name = (prompt('Navn på rommet:') || '').trim();
      if (!name) return;
      if (this.settings.checklist.rooms.some(r => r.name === name)) return this.toast('Det finnes allerede et rom med det navnet');
      this.settings.checklist.rooms.push({ name, inNew: false, items: [] });
      this.clOpen = name;
      this.saveSettings();
    },
    clRenameRoom(room, name) {
      name = name.trim();
      if (!name || this.settings.checklist.rooms.some(r => r !== room && r.name === name)) { this.toast('Ugyldig eller brukt navn'); return; }
      room.name = name; this.clOpen = name; this.saveSettings();
    },
    clMoveRoom(i, d) {
      const rooms = this.settings.checklist.rooms, j = i + d;
      if (j < 0 || j >= rooms.length) return;
      [rooms[i], rooms[j]] = [rooms[j], rooms[i]];
      this.saveSettings();
    },
    clRemoveRoom(i) {
      const room = this.settings.checklist.rooms[i];
      if (!confirm(`Fjerne «${room.name}» fra sjekklisten? Eksisterende rapporter endres ikke.`)) return;
      this.settings.checklist.rooms.splice(i, 1);
      this.saveSettings();
    },
    clAddItem(room) { room.items.push({ name: 'Nytt punkt', options: [], fagperson: this.cl().fagpersoner[0] || 'Vaktmester' }); this.saveSettings(); },
    clRemoveItem(room, i) { room.items.splice(i, 1); this.saveSettings(); },
    clMoveItem(room, i, d) {
      const j = i + d;
      if (j < 0 || j >= room.items.length) return;
      [room.items[i], room.items[j]] = [room.items[j], room.items[i]];
      this.saveSettings();
    },
    clAddAppliance() {
      const name = (prompt('Navn på hvitevaren:') || '').trim();
      if (!name) return;
      this.settings.checklist.appliances.push({ name, defects: [], inNew: false });
      this.saveSettings();
    },
    clRemoveAppliance(i) { this.settings.checklist.appliances.splice(i, 1); this.saveSettings(); },
    clReset() {
      if (!confirm('Tilbakestille sjekklistene til standard? Egne endringer forsvinner. Eksisterende rapporter endres ikke.')) return;
      this.settings.checklist = defaultChecklist();
      this.saveSettings();
      this.toast('Sjekklistene er tilbakestilt');
    },
    async finishSetup() {
      this.settings.setupDone = true;
      await this.saveSettings();
      this.screen = 'list';
      window.scrollTo(0, 0);
    },
    async setLogo(e) {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try { this.settings.logo = await compressLogo(file); await this.saveSettings(); }
      catch (err) { this.toast(err.message); }
    },
    setAddresses(text) {
      this.settings.adresser = [...new Set(text.split('\n').map(a => a.trim()).filter(Boolean))];
      this.saveSettings();
    },
    addressSuggestions() {
      return [...new Set([...this.settings.adresser, ...this.reports.map(r => r.adresse).filter(Boolean)])];
    },
    profile() {
      const p = {};
      for (const k of PROFILE_KEYS) p[k] = this.settings[k];
      return toPlain(p);
    },

    /* ---- list ---- */
    async loadList() {
      let all = [];
      try { all = await DB.all('reports'); } catch (e) { /* storage unavailable */ }
      this.reports = all
        .map(r => ({ id: r.id, adresse: r.adresse, leilighet: r.leilighet, dato: r.dato, type: r.type,
          leietaker: { navn: r.leietaker.navn }, pdfAt: r.pdfAt, updated: r.updated, feil: reportStats(r).feil,
          open: r.rooms.reduce((n, room) => n + room.items.filter(it => it.status === 'FEIL' && (!it.tiltak || it.tiltak.status !== 'Utført')).length, 0) }))
        .sort((a, b) => b.updated - a.updated);
    },
    newReport() { this.edit(newReportData()); },
    async openReport(id) { const r = await DB.get('reports', id); if (r) this.edit(r); },
    async copyReport(id) {
      const src = await DB.get('reports', id);
      if (!src) return;
      const r = newReportData();
      Object.assign(r, { type: src.type, adresse: src.adresse, leilighet: src.leilighet });
      r.strom.maler = src.strom.maler;
      r.rooms = src.rooms.map(room => ({ id: uid(), kind: room.kind, name: room.name,
        items: room.items.map(it => blankItem({ name: it.name, options: [...it.options], fagperson: it.fagperson, custom: it.custom })) }));
      this.edit(r);
      this.toast('Ny rapport med samme adresse og rom');
    },
    async deleteReport(id) {
      if (!confirm('Slette denne rapporten? Dette kan ikke angres.')) return;
      await DB.del('reports', id);
      await this.loadList();
    },

    /* ---- editor ---- */
    openCount() { return this.reports.reduce((n, r) => n + r.open, 0); },
    edit(r) {
      this.report = upgradeReport(r);
      this.ref = null; this.refMap = null;
      this.autoCompare();
      this.loadRef();
      this.openRoom = r.rooms.length ? r.rooms[0].id : null;
      this.screen = 'edit';
      window.scrollTo(0, 0);
      this.$nextTick(() => setTimeout(() => this.initPads(), 0));
      this.saveNow();
    },
    async closeReport() {
      const r = this.report;
      const untouched = r && !r.adresse.trim() && !r.leietaker.navn.trim() && reportStats(r).checked === 0;
      if (untouched) { clearTimeout(this._saveT); await DB.del('reports', r.id); }
      else await this.saveNow();
      this.pads = {};
      this.report = null;
      this.ref = null; this.refMap = null;
      this.screen = this._returnTo || 'list';
      this._returnTo = null;
      if (this.screen === 'avvik') await this.loadDefects();
      await this.loadList();
      window.scrollTo(0, 0);
    },
    back() {
      if (this.locked) return false;
      if (this.screen === 'edit') { this.closeReport(); return true; }
      if (this.screen === 'settings') { this.saveSettings(); this.screen = 'list'; return true; }
      if (this.screen === 'checklist') { this.saveSettings(); this.screen = 'settings'; return true; }
      if (this.screen === 'avvik') { this.closeDefects(); return true; }
      if (this.screen === 'setup' && this.settings.setupDone) { this.screen = 'settings'; return true; }
      return false;
    },
    queueSave() { clearTimeout(this._saveT); this._saveT = setTimeout(() => this.saveNow(), 600); },
    async saveNow() {
      clearTimeout(this._saveT);
      if (!this.report) return;
      this.report.updated = Date.now();
      try { await DB.put('reports', toPlain(this.report)); }
      catch (e) { this.toast('Kunne ikke lagre. Er lagringsplassen full?'); }
    },

    progressPct() { const s = reportStats(this.report); return s.total ? Math.round(100 * s.checked / s.total) : 0; },
    progressText() { const s = reportStats(this.report); return `${s.checked}/${s.total} kontrollert`; },
    nokkelLabel() { return this.report.type === 'Utflytting' ? 'Innlevert' : this.report.type === 'Innflytting' ? 'Utlevert' : 'Registrert'; },

    roomLabel(room) { return labelIn(this.report.rooms, room); },

    /* ---- comparison with an earlier report of the same flat ---- */
    compareCandidates() {
      const r = this.report;
      if (!r || !normAddr(r.adresse)) return [];
      return this.reports
        .filter(x => x.id !== r.id && normAddr(x.adresse) === normAddr(r.adresse)
          && (!r.leilighet || !x.leilighet || normAddr(x.leilighet) === normAddr(r.leilighet))
          && (!r.dato || !x.dato || x.dato <= r.dato))
        .sort((a, b) => (b.dato || '').localeCompare(a.dato || ''));
    },
    // Utflytting picks the latest innflytting of the same flat, once; the user can change it.
    autoCompare() {
      const r = this.report;
      if (!r || r.compareWith !== null || r.type !== 'Utflytting') return;
      const inn = this.compareCandidates().find(x => x.type === 'Innflytting');
      if (inn) { r.compareWith = inn.id; this.loadRef(); }
    },
    async loadRef() {
      const id = this.report && this.report.compareWith;
      if (!id) { this.ref = null; this.refMap = null; return; }
      const ref = await DB.get('reports', id);
      if (!ref || !this.report || this.report.compareWith !== id) return;
      this.ref = upgradeReport(ref);
      this.refMap = refMapOf(this.ref);
    },
    setCompare(id) { this.report.compareWith = id || ''; this.loadRef(); this.queueSave(); },
    refName() { return this.ref ? `${this.ref.type} ${formatDate(this.ref.dato)}` : ''; },
    prevOf(room, item) { return this.refMap ? this.refMap[this.roomLabel(room) + '|' + item.name] : undefined; },
    prevText(room, item) {
      const p = this.prevOf(room, item);
      if (!p) return 'Ikke med i ' + this.refName();
      if (p.status === 'OK') return this.refName() + ': OK';
      if (p.status === 'FEIL') return this.refName() + ': AVVIK' + (describeItem(p) ? ' – ' + describeItem(p) : '');
      return this.refName() + ': ikke kontrollert';
    },
    tagFor(room, item) { return compareTag(this.prevOf(room, item), item); },

    /* ---- follow-up of defects ---- */
    setTiltak(t, status) {
      t.status = status;
      if (status === 'Bestilt' && !t.bestilt) t.bestilt = today();
      if (status === 'Utført' && !t.utfort) t.utfort = today();
    },
    roomStats(room) {
      const checked = room.items.filter(i => i.status).length;
      return { checked, feil: room.items.filter(i => i.status === 'FEIL').length, done: room.items.length > 0 && checked === room.items.length };
    },
    toggleRoom(room) { this.openRoom = this.openRoom === room.id ? null : room.id; },
    addRoom(kind) {
      const room = makeRoom(kind);
      this.report.rooms.push(room);
      this.openRoom = room.id;
      this.$nextTick(() => {
        const els = document.querySelectorAll('.room');
        els[els.length - 1] && els[els.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    removeRoom(idx) {
      const room = this.report.rooms[idx];
      const used = room.items.some(i => i.status);
      if (used && !confirm(`Fjerne «${this.roomLabel(room)}» med alle registreringer?`)) return;
      this.report.rooms.splice(idx, 1);
    },
    allOk(room) { room.items.forEach(i => { if (!i.status) i.status = 'OK'; }); },
    setStatus(item, s) { item.status = item.status === s ? null : s; },
    toggleOption(item, opt) {
      const i = item.selected.indexOf(opt);
      if (i > -1) item.selected.splice(i, 1); else item.selected.push(opt);
    },
    addAppliance(room, type) { room.items.push(makeAppliance(type)); },
    addCustomItem(room) { room.items.push(blankItem({ custom: true })); },
    removeItem(room, idx) {
      const it = room.items[idx];
      if ((it.status || it.photos.length) && !confirm(`Fjerne «${it.name || 'punkt'}»?`)) return;
      room.items.splice(idx, 1);
    },

    async addPhotos(e, item) {
      const files = [...e.target.files];
      e.target.value = '';
      if (!files.length) return;
      this.busy = 'Behandler bilde …';
      try {
        for (const f of files) {
          const stamp = this.settings.stempel !== false ? photoStamp(f, this.report) : '';
          item.photos.push({ id: uid(), data: await compressImage(f, stamp) });
        }
      } catch (err) {
        this.toast(err.message);
      } finally {
        this.busy = '';
        this.saveNow();
      }
    },
    removePhoto(item, idx) { if (confirm('Slette bildet?')) item.photos.splice(idx, 1); },

    /* ---- signatures ---- */
    initPads() {
      if (!this.report) return;
      for (const key of ['forvalter', 'leietaker']) {
        const canvas = document.getElementById('sig-' + key);
        if (!canvas) continue;
        const pad = new SignaturePad(canvas, { penColor: '#0f172a', minWidth: 0.8, maxWidth: 2.6 });
        pad._w = 0;
        pad.addEventListener('endStroke', () => {
          if (!this.report) return;
          this.report.signatures[key] = pad.toDataURL('image/png');
          this.queueSave();
        });
        this.pads[key] = pad;
        this.sizePad(pad, canvas);
        const saved = this.report.signatures[key];
        if (saved) pad.fromDataURL(saved, { width: canvas.offsetWidth, height: canvas.offsetHeight });
      }
    },
    sizePad(pad, canvas) {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
      pad._w = canvas.offsetWidth;
    },
    // Only redraw when the width really changes: mobile browsers fire "resize"
    // whenever the address bar hides, which used to wipe the signature.
    resizePads() {
      for (const pad of Object.values(this.pads)) {
        const canvas = pad.canvas;
        if (!canvas.offsetWidth || canvas.offsetWidth === pad._w) continue;
        const data = pad.toData();
        this.sizePad(pad, canvas);
        pad.clear();
        pad.fromData(data);
      }
    },
    clearSig(key) {
      if (this.pads[key]) this.pads[key].clear();
      this.report.signatures[key] = null;
    },

    /* ---- PDF ---- */
    async makePdf(mode) {
      const r = this.report;
      if (!r.adresse.trim()) { this.toast('Fyll inn adresse først'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      const st = reportStats(r);
      if (st.checked < st.total && !confirm(`${st.total - st.checked} punkt(er) er ikke kontrollert og kommer ikke med i rapporten. Fortsette?`)) return;
      if (!r.signatures.forvalter && !confirm('Rapporten er ikke signert av boligforvalter. Fortsette?')) return;

      this.busy = 'Lager PDF …';
      await new Promise(res => setTimeout(res, 60));
      try {
        const doc = buildPdf(toPlain(r), this.settings, room => this.roomLabel(r.rooms.find(x => x.id === room.id)),
          this.ref ? toPlain(this.ref) : null);
        const name = `Tilstandsrapport_${safeFileName(r.type)}_${safeFileName(r.adresse)}_${r.dato}.pdf`;
        if (window.TilstandAndroid) {
          const b64 = doc.output('datauristring').split(',')[1];
          if (mode === 'share') TilstandAndroid.shareFile(name, 'application/pdf', b64);
          else TilstandAndroid.saveFile(name, 'application/pdf', b64);
        } else {
          const blob = doc.output('blob');
          const file = new File([blob], name, { type: 'application/pdf' });
          if (mode === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) {
            this.busy = '';
            try { await navigator.share({ files: [file], title: name }); } catch (e) { /* cancelled */ }
          } else {
            downloadBlob(blob, name);
          }
        }
        r.pdfAt = Date.now();
        await this.saveNow();
      } catch (e) {
        console.error(e);
        alert('Kunne ikke lage PDF: ' + e.message);
      } finally {
        this.busy = '';
      }
    },

    /* ---- all defects across reports ---- */
    async openDefects() { this.screen = 'avvik'; window.scrollTo(0, 0); await this.loadDefects(); },
    closeDefects() { this.screen = 'list'; this.defects = []; this.loadList(); },
    async loadDefects() {
      const all = (await DB.all('reports')).map(upgradeReport);
      const list = [];
      for (const r of all) for (const room of r.rooms) for (const it of room.items) {
        if (it.status !== 'FEIL') continue;
        list.push({ key: r.id + it.id, reportId: r.id, itemId: it.id, adresse: r.adresse, leilighet: r.leilighet,
          dato: r.dato, type: r.type, leietaker: r.leietaker.navn, rom: labelIn(r.rooms, room), punkt: it.name,
          beskrivelse: describeItem(it), fagperson: it.fagperson, hast: it.hast, kostnad: it.kostnad, belastes: it.belastes,
          tiltak: { ...it.tiltak } });
      }
      const rank = { 'Akutt': 0, 'Snart': 1, 'Kan vente': 2 };
      list.sort((a, b) => rank[a.hast] - rank[b.hast] || (b.dato || '').localeCompare(a.dato || ''));
      this.defects = list;
    },
    filteredDefects(filter = this.defFilter) {
      const q = normAddr(this.defSearch);
      return this.defects.filter(d => {
        const st = d.tiltak.status;
        if (filter === 'ikke-utfort' && st === 'Utført') return false;
        if (TILTAK_STATUS.includes(filter) && st !== filter) return false;
        return !q || normAddr([d.adresse, d.leilighet, d.fagperson, d.rom, d.punkt, d.leietaker].join(' ')).includes(q);
      });
    },
    defCount(f) { return this.filteredDefects(f).length; },
    async setDefectStatus(d, status) {
      const r = await DB.get('reports', d.reportId);
      if (!r) return;
      upgradeReport(r);
      for (const room of r.rooms) for (const it of room.items) {
        if (it.id === d.itemId) { this.setTiltak(it.tiltak, status); d.tiltak = { ...it.tiltak }; }
      }
      await DB.put('reports', r);
    },
    async setDefectDate(d, field, value) {
      const r = await DB.get('reports', d.reportId);
      if (!r) return;
      upgradeReport(r);
      for (const room of r.rooms) for (const it of room.items) if (it.id === d.itemId) it.tiltak[field] = value;
      d.tiltak[field] = value;
      await DB.put('reports', r);
    },
    async openFromDefects(d) { this._returnTo = 'avvik'; await this.openReport(d.reportId); },
    exportCsv() {
      const head = ['Adresse', 'Leil.nr', 'Rapportdato', 'Type', 'Leietaker', 'Rom', 'Punkt', 'Beskrivelse', 'Fagperson',
        'Hastegrad', 'Kostnad', 'Belastes', 'Status', 'Bestilt', 'Utført'];
      const rows = this.filteredDefects().map(d => [d.adresse, d.leilighet, formatDate(d.dato), d.type, d.leietaker, d.rom,
        d.punkt, d.beskrivelse, d.fagperson, d.hast, d.kostnad, d.belastes, d.tiltak.status, formatDate(d.tiltak.bestilt), formatDate(d.tiltak.utfort)]);
      if (!rows.length) return this.toast('Ingen avvik å eksportere');
      // Semicolons and a BOM so Norwegian Excel opens it straight into columns with æøå intact.
      const text = '\ufeff' + [head, ...rows].map(r => r.map(csvCell).join(';')).join('\r\n');
      const name = `avvik-${today()}.csv`;
      if (window.TilstandAndroid) TilstandAndroid.saveText(name, 'text/csv', text);
      else downloadBlob(new Blob([text], { type: 'text/csv;charset=utf-8' }), name);
    },

    /* ---- backup ---- */
    async exportBackup() {
      this.busy = 'Lager sikkerhetskopi …';
      try {
        const reports = await DB.all('reports');
        this.saveJson(`tilstandsrapport-backup-${today()}.json`,
          { app: 'tilstandsrapport', kind: 'backup', version: 1, exported: new Date().toISOString(), settings: this.profile(), reports });
      } finally {
        this.busy = '';
      }
    },
    exportProfile() {
      this.saveJson('tilstandsrapport-profil.json',
        { app: 'tilstandsrapport', kind: 'profil', version: 1, exported: new Date().toISOString(), settings: this.profile() });
    },
    saveJson(name, data) {
      const text = JSON.stringify(data);
      if (window.TilstandAndroid) TilstandAndroid.saveText(name, 'application/json', text);
      else downloadBlob(new Blob([text], { type: 'application/json' }), name);
    },
    async importBackup(e) {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (data.app !== 'tilstandsrapport' || (!data.settings && !Array.isArray(data.reports))) throw new Error('Ukjent filformat');
        const reports = Array.isArray(data.reports) ? data.reports : [];
        const what = [data.settings && 'profilen (navn, bydel, logo, adresser)', reports.length && `${reports.length} rapport(er)`].filter(Boolean).join(' og ');
        if (!confirm(`Importere ${what}? Det som finnes fra før med samme navn/ID blir overskrevet.`)) return;
        for (const r of reports) await DB.put('reports', r);
        if (data.settings) {
          const p = {};
          for (const k of PROFILE_KEYS) if (k in data.settings) p[k] = data.settings[k];
          this.settings = { ...this.settings, ...p };
          if (!Array.isArray(this.settings.adresser)) this.settings.adresser = [];
          await this.saveSettings();
        }
        await this.loadList();
        this.toast(`Importert: ${what}`);
      } catch (err) {
        alert('Kunne ikke importere: ' + err.message);
      }
    },
    async deleteAll() {
      if (!confirm('Slette ALLE rapporter og innstillinger på denne enheten?')) return;
      if (!confirm('Er du helt sikker? Dette kan ikke angres.')) return;
      await DB.clear('reports');
      await DB.clear('kv');
      this.settings = { ...DEFAULT_SETTINGS, adresser: [] };
      await this.loadList();
      this.screen = 'setup';
      this.toast('Alle data er slettet');
    },
    /**
     * Android asks GitHub Releases for a newer APK. The web version reads WEB_VERSION from the
     * published app.js; when it differs it clears the offline cache and reloads.
     */
    async checkUpdate(silent = false) {
      if (window.TilstandAndroid) { if (!silent) TilstandAndroid.checkForUpdate(); return; }
      if (!/^https?:$/.test(location.protocol)) { if (!silent) this.toast('Åpne appen fra nettadressen for å se etter oppdatering'); return; }
      if (!silent) this.toast('Ser etter oppdatering …');
      try {
        const res = await fetch('app.js?check=' + Date.now(), { cache: 'no-store' });
        const m = /WEB_VERSION = '([^']+)'/.exec(await res.text());
        if (!res.ok || !m) throw new Error();
        if (m[1] === WEB_VERSION) { this.updateReady = ''; if (!silent) this.toast('Du har nyeste versjon'); return; }
        this.updateReady = m[1];
        if (!silent) this.installUpdate();
      } catch (e) {
        if (!silent) this.toast('Kunne ikke sjekke. Er du på nett?');
      }
    },
    async installUpdate() {
      if (!confirm(`Versjon ${this.updateReady} er klar. Oppdatere nå? Rapportene dine beholdes.`)) return;
      await this.saveNow();
      try {
        if (navigator.serviceWorker) for (const r of await navigator.serviceWorker.getRegistrations()) await r.update();
        if (window.caches) for (const k of await caches.keys()) await caches.delete(k);
      } catch (e) { /* reload anyway */ }
      location.reload();
    },

    toast(msg) {
      this.toastMsg = msg;
      clearTimeout(this._toastT);
      this._toastT = setTimeout(() => { this.toastMsg = ''; }, 2600);
    },
  };
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
