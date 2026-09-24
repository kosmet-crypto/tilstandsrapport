/* Tilstandsrapport: all logic for index.html (Alpine.js component + PDF). */

// Bump on every change: the web version compares this with the published app.js to find updates.
const WEB_VERSION = '1.2.0';

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

const ROOMS = {
  'Entré / gang':   ['vegger', 'gulv', 'dorer', 'el', 'vask'],
  'Stue':           ['vegger', 'gulv', 'dorer', 'el', 'vask'],
  'Kjøkken':        ['vegger', 'gulv', 'benk', 'kran', 'vifte', 'el', 'vask'],
  'Soverom':        ['vegger', 'gulv', 'dorer', 'el', 'vask'],
  'Bad':            ['vegger', 'wc', 'servant', 'dusj', 'fliser', 'ventil', 'el', 'vask'],
  'WC':             ['vegger', 'wc', 'servant', 'ventil', 'vask'],
  'Vaskerom':       ['vegger', 'gulv', 'kran', 'ventil', 'el', 'vask'],
  'Bod':            ['bodlas', 'vegger', 'vask'],
  'Balkong':        ['rekkverk', 'balgulv', 'vask'],
  'Brannsikkerhet': ['royk', 'slukker', 'romning'],
  'Skadedyr':       ['skadedyr'],
  'Hvitevarer':     [],
  'Annet rom':      ['vegger', 'gulv', 'dorer', 'el', 'vask'],
};
const DEFAULT_ROOMS = ['Entré / gang', 'Stue', 'Kjøkken', 'Soverom', 'Bad', 'Brannsikkerhet', 'Hvitevarer'];

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
};
// Settings that travel in a profile/backup file (never the PIN).
const PROFILE_KEYS = ['navn', 'stilling', 'bydel', 'kommune', 'telefon', 'epost', 'logo', 'adresser'];

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

function makeItem(key) {
  const [name, options, fagperson] = P[key];
  return blankItem({ name, options: [...options], fagperson });
}
function blankItem(extra) {
  return Object.assign({ id: uid(), name: '', status: null, options: [], selected: [], kommentar: '',
    fagperson: 'Vaktmester', hast: 'Snart', kostnad: '', belastes: 'Utleier', photos: [], custom: false }, extra);
}
function makeRoom(kind) {
  const room = { id: uid(), kind, name: kind, items: ROOMS[kind].map(makeItem) };
  if (kind === 'Hvitevarer') room.items = DEFAULT_APPLIANCES.map(makeAppliance);
  return room;
}
function makeAppliance(type) {
  return blankItem({ name: type, options: [...APPLIANCES[type]], fagperson: 'Servicepartner' });
}
function newReportData() {
  return {
    id: uid(), created: Date.now(), updated: Date.now(), pdfAt: null,
    type: 'Innflytting', adresse: '', leilighet: '', dato: today(),
    leietaker: { navn: '', telefon: '', epost: '', tilstede: 'Ja' },
    strom: { maler: '', stand: '' },
    nokler: { nokler: '', brikker: '', merknad: '' },
    rooms: DEFAULT_ROOMS.map(makeRoom),
    merknad: '',
    signatures: { forvalter: null, leietaker: null },
  };
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

/** Resizes a photo to at most `max` px on the long side and re-encodes it as JPEG. */
function compressImage(file, max = 1600, quality = 0.72) {
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
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Kunne ikke lese bildet')); };
    img.src = url;
  });
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

/* ---------------- PDF ---------------- */

// Built-in PDF fonts only cover Latin-1 (æøå are fine); map the rest to look-alikes.
function pdfText(s) {
  return String(s == null ? '' : s)
    .replace(/[–—−]/g, '-').replace(/…/g, '...')
    .replace(/[‘’‚]/g, "'").replace(/[“”„]/g, '"')
    .replace(/[   ]/g, ' ').replace(/•/g, '·')
    .replace(/[^\n\r\t\x20-\x7E\xA0-\xFF]/g, '?');
}

function buildPdf(report, settings, roomLabel) {
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
  const describe = it => [it.selected.join(', '), it.kommentar.trim()].filter(Boolean).join('. ') + refs(it);

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
      head: [['Fagperson', 'Rom / punkt', 'Beskrivelse', 'Hast', 'Kostnad', 'Belastes']],
      body: defects.map(({ room, it }) => [it.fagperson, `${roomLabel(room)}\n${it.name}`, describe(it) || '-', it.hast,
        it.kostnad ? kr(it.kostnad) : '-', it.belastes].map(T)),
      foot, showFoot: 'lastPage',
      headStyles: { fillColor: red, fontSize: 8 }, footStyles: { fillColor: [255, 228, 230], textColor: 20, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 1.8, valign: 'top' },
      columnStyles: { 0: { cellWidth: 26, fontStyle: 'bold' }, 1: { cellWidth: 34 }, 3: { cellWidth: 16 }, 4: { cellWidth: 20, halign: 'right' }, 5: { cellWidth: 19 } },
      didParseCell: d => { if (d.section === 'body' && d.column.index === 3 && d.cell.raw === 'Akutt') { d.cell.styles.textColor = red; d.cell.styles.fontStyle = 'bold'; } },
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
      it.status === 'OK' ? 'I orden' : (describe(it) || '-'),
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
    REPORT_TYPES, FAGPERSONER, HASTEGRAD, BELASTES, ROOMS, APPLIANCES,
    screen: 'list',
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
    async saveSettings() { await DB.put('kv', toPlain(this.settings), 'settings'); },
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
          leietaker: { navn: r.leietaker.navn }, pdfAt: r.pdfAt, updated: r.updated, feil: reportStats(r).feil }))
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
    edit(r) {
      this.report = r;
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
      this.screen = 'list';
      await this.loadList();
      window.scrollTo(0, 0);
    },
    back() {
      if (this.locked) return false;
      if (this.screen === 'edit') { this.closeReport(); return true; }
      if (this.screen === 'settings') { this.saveSettings(); this.screen = 'list'; return true; }
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

    roomLabel(room) {
      const same = this.report.rooms.filter(r => r.name === room.name);
      return same.length > 1 ? `${room.name} ${same.indexOf(room) + 1}` : room.name;
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
        for (const f of files) item.photos.push({ id: uid(), data: await compressImage(f) });
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
        const doc = buildPdf(toPlain(r), this.settings, room => this.roomLabel(r.rooms.find(x => x.id === room.id)));
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
