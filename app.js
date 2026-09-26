/* Tilstandsrapport: all logic for index.html (Alpine.js component + PDF). */

// Bump on every change: the web version compares this with the published app.js to find updates.
const WEB_VERSION = '2.0.0';

const REPORT_TYPES = ['Innflytting', 'Utflytting', 'Periodisk kontroll', 'Befaring'];
const FAGPERSONER = ['Vaktmester', 'Elektriker', 'Rørlegger', 'Maler', 'Snekker', 'Flislegger',
  'Vaskefirma', 'Servicepartner', 'Låsesmed', 'Skadedyrkontroll', 'Leietaker utbedrer'];
const HASTEGRAD = ['Akutt', 'Snart', 'Kan vente'];
// Who carries a defect. 'Leietaker' is a claim against the tenant (erstatningskrav).
const BELASTES = ['Utleier', 'Leietaker', 'Kjent'];
const BELASTES_LABEL = { Utleier: 'Slitasje / utleier', Leietaker: 'Skade – krav mot leietaker', Kjent: 'Kjent fra før – ikke krav' };
const DEFAULT_KEYS = ['Bolignøkler', 'Postkassenøkler', 'Bodnøkler', 'Nøkkelkort / brikker'];
const FRIST_DAGER = 14;
const TEKST_INN = 'Leietaker bekrefter å ha mottatt nøkler som spesifisert i protokollen, og har sammen med utleier undersøkt boligen. Boligen overtas i forevist stand med de merknader som er ført i protokollen.';
const TEKST_UT = 'Utleier tar forbehold om krav som følge av skjulte mangler eller mangelfull utvask som oppdages ved etterkontroll. Slikt krav må fremsettes skriftlig innen 14 dager.';
const TEKST_ANNEN = 'Partene bekrefter at rapporten gir en riktig beskrivelse av boligens tilstand på befaringsdagen.';
const EPOST_EMNE = '{dokument} – {adresse} {leil} – {dato}';
const EPOST_TEKST = 'Hei {leietaker},\n\nVedlagt følger {dokument_liten} for {adresse} {leil}, datert {dato}.\n\nTa kontakt hvis noe er uklart.\n\nMed vennlig hilsen\n{navn}\n{stilling}, {bydel}';

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
  priser: [],        // [{ navn, pris }]: price per typical fault, filled in on claims
  nokkelpris: '',    // price per missing key
  tekstInn: TEKST_INN, tekstUt: TEKST_UT, tekstAnnen: TEKST_ANNEN,
  epostEmne: EPOST_EMNE, epostTekst: EPOST_TEKST,
};
// Settings that travel in a profile/backup file (never the PIN).
const PROFILE_KEYS = ['navn', 'stilling', 'bydel', 'kommune', 'telefon', 'epost', 'logo', 'adresser', 'checklist', 'stempel',
  'priser', 'nokkelpris', 'tekstInn', 'tekstUt', 'tekstAnnen', 'epostEmne', 'epostTekst'];
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
function makeKey(navn, antall = '') { return { id: uid(), navn, antall, mangler: '', pris: '', prev: '', prisManual: false }; }
function newReportData(type = 'Innflytting') {
  return {
    id: uid(), created: Date.now(), updated: Date.now(), pdfAt: null,
    locked: 0, anon: false, korrigerer: null, korrigererDato: null,
    type, adresse: '', leilighet: '', dato: today(),
    leietaker: { navn: '', telefon: '', tilstede: 'Ja' },
    fullmakt: false, fullmektig: '', tidligereLeietaker: '',
    strom: { maler: '', stand: '' }, malerFoto: [],
    keys: DEFAULT_KEYS.map(n => makeKey(n)),
    nokler: { merknad: '' },
    rooms: CHECKLIST.rooms.filter(r => r.inNew).map(r => makeRoom(r.name)),
    merknad: '',
    signatures: { forvalter: null, leietaker: null },
    compareWith: null,
  };
}
/** Older reports (and old app versions) lack newer fields; fill them in when a report is loaded. */
function upgradeReport(r) {
  for (const room of r.rooms) for (const it of room.items) {
    if (!it.tiltak) it.tiltak = { status: 'Åpen', bestilt: '', utfort: '' };
    if (!('prisManual' in it)) it.prisManual = !!it.kostnad;
  }
  if (!('compareWith' in r)) r.compareWith = null;
  if (!r.keys) {
    // Before 2.0 keys were two counters.
    const n = r.nokler || {};
    r.keys = [makeKey('Nøkler', n.nokler || ''), makeKey('Kort / brikker', n.brikker || '')];
    r.nokler = { merknad: n.merknad || '' };
  }
  if (!r.malerFoto) r.malerFoto = [];
  if (!('locked' in r)) r.locked = 0;
  if (!('anon' in r)) r.anon = false;
  if (!('fullmakt' in r)) { r.fullmakt = false; r.fullmektig = ''; }
  if (!('tidligereLeietaker' in r)) r.tidligereLeietaker = '';
  if (r.leietaker && 'epost' in r.leietaker) delete r.leietaker.epost;
  return r;
}

/* ---------------- personal data ---------------- */

/** "Ola Nordmann" -> "O. N.", "Anne-Lise Berg" -> "A.-L. B." */
function initials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean)
    .map(part => part.split('-').filter(Boolean).map(p => p[0].toUpperCase() + '.').join('-')).join(' ');
}
/**
 * What may be kept in the history and in exports: the tenant (and a representative) only as
 * initials, no phone number and no tenant signature. The PDF itself is made from the full data.
 */
function anonymize(r) {
  const a = JSON.parse(JSON.stringify(r));
  if (a.anon) return a;
  a.leietaker = { navn: initials(a.leietaker.navn), telefon: '', tilstede: a.leietaker.tilstede };
  a.fullmektig = initials(a.fullmektig);
  a.tidligereLeietaker = initials(a.tidligereLeietaker);
  if (a.signatures) a.signatures.leietaker = null;
  a.anon = true;
  return a;
}
function fristDato(dato) {
  if (!dato) return null;
  const d = new Date(dato + 'T12:00:00');
  d.setDate(d.getDate() + FRIST_DAGER);
  return d;
}
/** Sum of claims against the tenant: damages plus missing keys (utflytting). */
function claimTotal(r) {
  let t = 0;
  for (const room of r.rooms) for (const it of room.items) if (it.status === 'FEIL' && it.belastes === 'Leietaker') t += Number(it.kostnad) || 0;
  if (r.type === 'Utflytting') for (const k of r.keys || []) t += Number(k.pris) || 0;
  return t;
}
function docTitle(type) {
  return type === 'Innflytting' ? 'Innflyttingsprotokoll' : type === 'Utflytting' ? 'Utflyttingsprotokoll'
    : type === 'Periodisk kontroll' ? 'Kontrollrapport' : 'Tilstandsrapport';
}

/* ---------------- import from the Flytteprotokoll app ---------------- */

function sigPointsToImage(points) {
  if (!points || !points.length) return null;
  const c = document.createElement('canvas');
  c.width = 600; c.height = 225;
  const pad = new SignaturePad(c, { penColor: '#0f172a' });
  // Fit the strokes into the canvas whatever size the pad had when they were drawn.
  const all = points.flatMap(g => g.points);
  const minX = Math.min(...all.map(p => p.x)), minY = Math.min(...all.map(p => p.y));
  const w = Math.max(...all.map(p => p.x)) - minX || 1, h = Math.max(...all.map(p => p.y)) - minY || 1;
  const k = Math.min((c.width - 20) / w, (c.height - 20) / h);
  pad.fromData(points.map(g => ({ ...g, points: g.points.map(p => ({ ...p, x: 10 + (p.x - minX) * k, y: 10 + (p.y - minY) * k })) })));
  return pad.toDataURL('image/png');
}
function fromFlytteprotokoll(p) {
  const r = newReportData(p.type === 'Utflytting' ? 'Utflytting' : 'Innflytting');
  Object.assign(r, {
    id: 'fp-' + p.id, created: p.created || Date.now(), updated: p.updated || Date.now(), pdfAt: p.pdf || null,
    locked: p.locked || 0, dato: p.dato || r.dato, adresse: p.adresse || '', leilighet: p.leilnr || '',
    fullmakt: !!p.fullmakt, fullmektig: p.fullmektig || '', merknad: p.merknader || '',
    korrigerer: p.korrigerer ? 'fp-' + p.korrigerer : null, korrigererDato: p.korrigererDato || null,
    compareWith: p.refId ? 'fp-' + p.refId : null,
  });
  r.leietaker.navn = p.leietaker || '';
  r.strom = { maler: p.maler || '', stand: p.strom || '' };
  r.malerFoto = (p.malerFoto || []).map(ph => ({ id: ph.id || uid(), data: ph.data }));
  r.keys = (p.keys || []).map(k => ({ ...makeKey(k.navn, k.antall), mangler: k.mangler || '', pris: k.pris || '', prev: k.prev || '', prisManual: !!k.prisManual }));
  r.rooms = (p.rooms || []).map(room => ({
    id: uid(), kind: room.type === 'Brannsikring' ? 'Brannsikkerhet' : room.type, name: room.name,
    items: room.items.map(i => blankItem({
      name: i.name, status: i.status || null, options: i.options || [], selected: i.sel || [], kommentar: i.kommentar || '',
      belastes: i.ansvar === 'Skade' ? 'Leietaker' : i.ansvar === 'Kjent' ? 'Kjent' : 'Utleier',
      kostnad: i.pris || '', prisManual: !!i.prisManual, custom: !!i.custom,
      photos: (i.photos || []).map(ph => ({ id: ph.id || uid(), data: ph.data })),
    })),
  }));
  r.signatures = { forvalter: sigPointsToImage(p.sig && p.sig.forvalter), leietaker: sigPointsToImage(p.sig && p.sig.leietaker) };
  return anonymize(r);
}
function settingsFromFlytteprotokoll(s) {
  const out = {};
  const map = { navn: 'navn', tittel: 'stilling', enhet: 'bydel', kommune: 'kommune', logo: 'logo', adresser: 'adresser',
    tekstInn: 'tekstInn', tekstUt: 'tekstUt', priser: 'priser', nokkelpris: 'nokkelpris' };
  for (const [from, to] of Object.entries(map)) if (s[from] !== undefined && s[from] !== '') out[to] = s[from];
  return out;
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
  for (const ph of report.malerFoto || []) photoList.push({ data: ph.data, caption: 'Strømmåler' });
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
  doc.text(T(docTitle(report.type).toUpperCase()), titleX, 14);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  doc.text(T(report.type === 'Befaring' || report.type === 'Periodisk kontroll' ? report.type.toUpperCase() : 'FLYTTEPROTOKOLL'), titleX, 22);
  if (report.anon) {
    doc.setFontSize(8);
    doc.text('Kopi fra historikk - leietakers personopplysninger er forkortet', titleX, 28);
  }
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
  const ut = report.type === 'Utflytting';
  const info = [
    ['Adresse', report.adresse, 'Dato', formatDate(report.dato)],
    ['Leil.nr', report.leilighet, 'Type', report.type],
    ['Leietaker', lt.navn, 'Telefon', lt.telefon],
    ['Til stede', report.fullmakt ? 'Representant med fullmakt' : lt.tilstede, 'Boligforvalter', settings.navn],
    ['Strøm målernr', report.strom.maler, 'Strøm stand', report.strom.stand ? report.strom.stand + ' kWh' : ''],
  ].map(r => r.map(v => T(v || '-')));
  const wide = (label, text) => info.push([T(label), { content: T(text), colSpan: 3 }]);
  if (report.fullmakt) wide('Møtt med fullmakt', report.fullmektig || '-');
  if (ut && report.dato) wide('Frist for krav', formatDate(fristDato(report.dato)) + ` (${FRIST_DAGER} dager)`);
  if (report.korrigerer) wide('Korrigert versjon', 'Erstatter dokument signert ' + formatDate(report.korrigererDato));

  doc.autoTable({
    startY: 38, body: info, theme: 'plain', margin: { left: M, right: M },
    styles: { fontSize: 9, cellPadding: 1.4, textColor: 20 },
    columnStyles: { 0: { fontStyle: 'bold', textColor: grey, cellWidth: 32 }, 2: { fontStyle: 'bold', textColor: grey, cellWidth: 28 } },
  });
  let y = doc.lastAutoTable.finalY + 6;

  // Keys
  const keys = (report.keys || []).filter(k => k.navn && (k.antall || k.mangler || k.prev || k.pris));
  if (keys.length || report.nokler.merknad) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...brand);
    doc.text('NØKLER', M, y); y += 2;
    const head = ut ? [['Nøkkeltype', 'Levert', 'Mangler', 'Ved innflytting', 'Kostnad']]
      : [['Nøkkeltype', report.type === 'Innflytting' ? 'Utlevert' : 'Antall']];
    const body = keys.map(k => ut ? [k.navn, k.antall || '0', k.mangler || '0', k.prev || '-', Number(k.pris) ? kr(k.pris) : '-'].map(T)
      : [T(k.navn), T(k.antall || '0')]);
    if (report.nokler.merknad) body.push([{ content: T('Merknad: ' + report.nokler.merknad), colSpan: head[0].length }]);
    doc.autoTable({ startY: y, head, body, margin: { left: M, right: M }, theme: 'striped',
      headStyles: { fillColor: brand, fontSize: 8 }, styles: { fontSize: 8, cellPadding: 1.6 } });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Summary
  const st = reportStats(report);
  doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252);
  doc.roundedRect(M, y, W - 2 * M, 14, 2, 2, 'FD');
  doc.setFontSize(10); doc.setTextColor(20);
  doc.setFont('helvetica', 'bold');
  const cols = [[`${st.checked}/${st.total}`, 'kontrollert'], [String(st.feil), 'avvik'], [String(photoList.length), 'bilder']];
  cols.forEach(([big, small], i) => {
    const x = M + 6 + i * 42;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.setTextColor(...(i === 1 && st.feil ? red : [20, 20, 20]));
    doc.text(big, x, y + 9);
    const bigW = doc.getTextWidth(big);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...grey);
    doc.text(small, x + bigW + 2, y + 9);
  });
  const claim = claimTotal(report);
  if (claim) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...red);
    doc.text(T('Erstatningskrav: ' + kr(claim)), W - M - 4, y + 9, { align: 'right' });
  }
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
    defects.forEach(d => { if (d.it.belastes in sums) sums[d.it.belastes] += Number(d.it.kostnad) || 0; });
    const foot = [];
    if (sums.Utleier || sums.Leietaker) {
      foot.push([{ content: T(`Krav mot leietaker: ${kr(sums.Leietaker)}     Utleiers kostnad: ${kr(sums.Utleier)}`), colSpan: 6, styles: { halign: 'right' } }]);
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...brand);
    doc.text('AVVIK OG TILTAK', M, y); y += 2;
    doc.autoTable({
      startY: y, margin: { left: M, right: M },
      head: [['Fagperson', 'Rom / punkt', 'Beskrivelse', 'Hast / status', 'Kostnad', 'Belastes']],
      body: defects.map(({ room, it }) => [it.fagperson, `${roomLabel(room)}\n${it.name}`, describeIn(room, it) || '-',
        [it.hast, tiltakText(it.tiltak)].filter(Boolean).join('\n'),
        it.kostnad ? kr(it.kostnad) : '-', { Utleier: 'Utleier', Leietaker: 'Leietaker (krav)', Kjent: 'Kjent - ikke krav' }[it.belastes] || it.belastes].map(T)),
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

  if (claim) {
    if (y + 10 > BOTTOM) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...red);
    doc.text(T('TOTALT ERSTATNINGSKRAV: ' + kr(claim)), M, y + 3);
    y += 10;
  }

  // Declaration and signatures, kept together on one page
  const keysComplete = (report.keys || []).every(k => !Number(k.mangler) && !Number(k.pris));
  const legalText = report.type === 'Innflytting' ? settings.tekstInn
    : ut ? (keysComplete ? 'Samtlige nøkler er levert utleier. ' : 'Nøkler er levert utleier som spesifisert i protokollen. ') + settings.tekstUt
    : settings.tekstAnnen;
  const legal = doc.splitTextToSize(T(legalText || ''), W - 2 * M - 8);
  if (y + legal.length * 4 + 60 > BOTTOM) { doc.addPage(); y = 20; }
  y += 4;
  doc.setFillColor(239, 246, 255); doc.rect(M, y, W - 2 * M, legal.length * 4 + 6, 'F');
  doc.setFillColor(...brand); doc.rect(M, y, 1.2, legal.length * 4 + 6, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(30);
  doc.text(legal, M + 5, y + 5.5);
  y += legal.length * 4 + 12;
  const sigs = [
    { img: report.signatures.forvalter, name: settings.navn, role: [settings.stilling, settings.bydel].filter(Boolean).join(', '), x: M },
    { img: report.signatures.leietaker, name: report.fullmakt ? report.fullmektig : lt.navn,
      role: report.fullmakt ? `Med fullmakt for ${lt.navn || 'leietaker'}` : 'Leietaker', x: 112 },
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
    doc.text(T(`${docTitle(report.type)} · ${report.adresse || ''} · ${formatDate(report.dato)}`), M, 290);
    doc.text(`Side ${i} av ${n}`, W - M, 290, { align: 'right' });
  }
  for (const room of report.rooms) for (const it of room.items) delete it._nr;
  return doc;
}

/* ---------------- Alpine component ---------------- */

function app() {
  return {
    REPORT_TYPES, HASTEGRAD, BELASTES, BELASTES_LABEL, TILTAK_STATUS, HVITEVARER, FRIST_DAGER,
    screen: 'list',
    bolig: null, search: '', newSheet: null,
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
    formatDate, stats: reportStats, docTitle, kr, claimTotal, initials, fristDato,

    async init() {
      try {
        const s = await DB.get('kv', 'settings');
        if (s) this.settings = { ...DEFAULT_SETTINGS, ...s };
      } catch (e) {
        this.toast('Lagring er ikke tilgjengelig i denne nettleseren');
      }
      if (!Array.isArray(this.settings.adresser)) this.settings.adresser = [];
      if (!Array.isArray(this.settings.priser)) this.settings.priser = [];
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
          leietaker: { navn: initials(r.leietaker.navn) }, pdfAt: r.pdfAt, updated: r.updated, feil: reportStats(r).feil,
          locked: r.locked || 0, claim: claimTotal(upgradeReport(r)),
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

    /* ---- flats (boliger): every document grouped by address + flat number ---- */
    boligKey(r) { return normAddr(r.adresse) + '|' + normAddr(r.leilighet); },
    boliger() {
      const map = new Map();
      for (const r of this.reports) {
        const key = this.boligKey(r);
        if (!map.has(key)) map.set(key, { key, adresse: r.adresse, leilighet: r.leilighet, docs: [] });
        map.get(key).docs.push(r);
      }
      const q = normAddr(this.search);
      return [...map.values()]
        .map(b => {
          b.docs.sort((a, c) => (c.dato || '').localeCompare(a.dato || '') || c.updated - a.updated);
          const moves = b.docs.filter(d => d.type === 'Innflytting' || d.type === 'Utflytting');
          b.tenant = moves[0] && moves[0].type === 'Innflytting' ? moves[0].leietaker.navn : '';
          b.open = b.docs.reduce((n, d) => n + d.open, 0);
          b.frist = b.docs.map(d => this.fristInfo(d)).find(f => f && f.days >= 0) || null;
          b.drafts = b.docs.filter(d => !d.locked).length;
          return b;
        })
        .filter(b => !q || normAddr([b.adresse, b.leilighet, b.tenant, ...b.docs.map(d => d.leietaker.navn + ' ' + d.type + ' ' + formatDate(d.dato))].join(' ')).includes(q))
        .sort((a, c) => (a.adresse || '~').localeCompare(c.adresse || '~', 'nb') || (a.leilighet || '').localeCompare(c.leilighet || '', 'nb'));
    },
    boligNow() { return this.boliger().find(b => b.key === this.bolig) || { key: this.bolig, adresse: '', leilighet: '', docs: [] }; },
    openBolig(key) { this.bolig = key; this.screen = 'bolig'; window.scrollTo(0, 0); },
    fristInfo(d) {
      if (d.type !== 'Utflytting' || !d.dato) return null;
      const f = fristDato(d.dato);
      const days = Math.ceil((f - new Date()) / 864e5);
      const text = `Frist for krav ${formatDate(f)}` + (days < 0 ? ' – utløpt' : ` – ${days} dag${days === 1 ? '' : 'er'} igjen`);
      return { days, text, cls: days < 0 ? '' : days <= 3 ? 'bad' : 'warn' };
    },
    /** "+ Ny": pick the document type; from a flat the address is filled in. */
    async newDoc(type, b) {
      this.newSheet = null;
      if (type === 'Utflytting' && b) {
        const inn = b.docs.find(d => d.type === 'Innflytting');
        if (inn) return this.startUtflytting(inn.id);
      }
      const r = newReportData(type);
      if (b) { r.adresse = b.adresse; r.leilighet = b.leilighet; }
      this.edit(r);
    },
    /** Utflytting from an innflytting: address, keys and rooms are copied and compared. */
    async startUtflytting(id) {
      const src = await DB.get('reports', id);
      if (!src) return;
      upgradeReport(src);
      const r = newReportData('Utflytting');
      Object.assign(r, { adresse: src.adresse, leilighet: src.leilighet, compareWith: src.id, tidligereLeietaker: src.leietaker.navn });
      r.strom.maler = src.strom.maler;
      r.keys = src.keys.map(k => ({ ...makeKey(k.navn), prev: k.antall ? k.antall + ' stk' : '' }));
      r.rooms = src.rooms.map(room => ({ id: uid(), kind: room.kind, name: room.name,
        items: room.items.map(it => blankItem({ name: it.name, options: [...it.options], fagperson: it.fagperson, custom: it.custom })) }));
      this.edit(r);
      this.toast('Utflytting startet fra innflyttingen ' + formatDate(src.dato));
    },
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
      this.screen = this._returnTo || (this.bolig ? 'bolig' : 'list');
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
      if (this.newSheet) { this.newSheet = null; return true; }
      if (this.screen === 'bolig') { this.bolig = null; this.screen = 'list'; return true; }
      if (this.screen === 'setup' && this.settings.setupDone) { this.screen = 'settings'; return true; }
      return false;
    },
    queueSave() { clearTimeout(this._saveT); this._saveT = setTimeout(() => this.saveNow(), 600); },
    async saveNow() {
      clearTimeout(this._saveT);
      if (!this.report) return;
      this.report.updated = Date.now();
      // A signed document is kept in the history with the tenant only as initials.
      const data = this.report.locked ? anonymize(this.report) : toPlain(this.report);
      try { await DB.put('reports', data); }
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
      this.suggestPris(item);
    },
    /* ---- claims: price list ---- */
    priceMap() {
      const m = {};
      for (const p of this.settings.priser || []) if (p.navn && Number(p.pris)) m[p.navn.trim().toLowerCase()] = Number(p.pris);
      return m;
    },
    suggestPris(item) {
      if (item.prisManual || item.belastes !== 'Leietaker') return;
      const m = this.priceMap();
      const sum = item.selected.reduce((t, o) => t + (m[o.toLowerCase()] || 0), 0);
      item.kostnad = sum ? String(sum) : '';
    },
    setBelastes(item, b) { item.belastes = b; this.suggestPris(item); },
    keyChanged(k) {
      if (!k.prisManual && Number(this.settings.nokkelpris)) k.pris = Number(k.mangler) ? String(Number(k.mangler) * Number(this.settings.nokkelpris)) : '';
    },
    addKey() { this.report.keys.push(makeKey('')); },
    allOptions() {
      const cl = this.cl();
      return [...new Set([...cl.rooms.flatMap(r => r.items.flatMap(i => i.options)), ...cl.appliances.flatMap(a => a.defects)])].sort((a, b) => a.localeCompare(b, 'nb'));
    },
    addPrice() { this.settings.priser.push({ navn: '', pris: '' }); },
    resetTexts() {
      if (!confirm('Tilbakestille erklæringer og e-posttekst til standard?')) return;
      Object.assign(this.settings, { tekstInn: TEKST_INN, tekstUt: TEKST_UT, tekstAnnen: TEKST_ANNEN, epostEmne: EPOST_EMNE, epostTekst: EPOST_TEKST });
      this.saveSettings();
    },
    async addMeterPhotos(e) {
      const files = [...e.target.files];
      e.target.value = '';
      this.busy = 'Behandler bilde …';
      try { for (const f of files) this.report.malerFoto.push({ id: uid(), data: await compressImage(f, this.settings.stempel !== false ? photoStamp(f, this.report) : '') }); }
      catch (err) { this.toast(err.message); }
      finally { this.busy = ''; this.saveNow(); }
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
        if (this.report.locked) pad.off();
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
      for (const [key, pad] of Object.entries(this.pads)) {
        const canvas = pad.canvas;
        if (!canvas.offsetWidth || canvas.offsetWidth === pad._w) continue;
        const data = pad.toData();
        this.sizePad(pad, canvas);
        pad.clear();
        // A signature loaded from the saved image has no strokes; redraw the image instead.
        if (data.length) pad.fromData(data);
        else if (this.report && this.report.signatures[key]) pad.fromDataURL(this.report.signatures[key], { width: canvas.offsetWidth, height: canvas.offsetHeight });
      }
    },
    clearSig(key) {
      if (this.pads[key]) this.pads[key].clear();
      this.report.signatures[key] = null;
    },

    /* ---- PDF ---- */
    missingInfo() {
      const r = this.report, m = [];
      if (!r.leietaker.navn.trim() && (r.type === 'Innflytting' || r.type === 'Utflytting')) m.push('leietaker');
      const st = reportStats(r);
      if (st.checked < st.total) m.push(`${st.total - st.checked} punkter uten status (kommer ikke med)`);
      if (!r.signatures.forvalter) m.push('signatur boligforvalter');
      if (!r.signatures.leietaker && (r.type === 'Innflytting' || r.type === 'Utflytting')) m.push('signatur leietaker');
      return m;
    },
    fillTemplate(t) {
      const r = this.report, S = this.settings;
      const v = { dokument: docTitle(r.type), dokument_liten: docTitle(r.type).toLowerCase(), type: r.type, adresse: r.adresse || '',
        leil: r.leilighet || '', dato: formatDate(r.dato), leietaker: initials(r.leietaker.navn),
        navn: S.navn || '', stilling: S.stilling || '', bydel: S.bydel || '' };
      return (t || '').replace(/\{(\w+)\}/g, (all, k) => k in v ? v[k] : all)
        .replace(/ +/g, ' ').replace(/ ,/g, ',').replace(/,\s*$/gm, '').replace(/Hei ,/, 'Hei,').trim();
    },
    async makePdf(mode) {
      const r = this.report;
      if (!r.adresse.trim()) { this.toast('Fyll inn adresse først'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      let newlyLocked = false;
      if (!r.locked) {
        const miss = this.missingInfo();
        if (!confirm((miss.length ? 'Mangler: ' + miss.join(', ') + '.\n\n' : '')
          + 'Når PDF-en lages, blir dokumentet signert og låst. I historikken lagres leietaker bare med initialer. '
          + 'Feil rettes med en korrigert kopi.\n\nFortsette?')) return;
        r.locked = Date.now();
        newlyLocked = true;
        Object.values(this.pads).forEach(p => p.off());
      }

      this.busy = 'Lager PDF …';
      await new Promise(res => setTimeout(res, 60));
      try {
        const doc = buildPdf(toPlain(r), this.settings, room => this.roomLabel(r.rooms.find(x => x.id === room.id)),
          this.ref ? toPlain(this.ref) : null);
        const name = `${safeFileName(docTitle(r.type))}_${safeFileName(r.adresse)}_${safeFileName(r.leilighet)}_${r.dato}.pdf`.replace(/__+/g, '_');
        const subject = this.fillTemplate(this.settings.epostEmne), text = this.fillTemplate(this.settings.epostTekst);
        if (window.TilstandAndroid) {
          const b64 = doc.output('datauristring').split(',')[1];
          if (mode !== 'share') TilstandAndroid.saveFile(name, 'application/pdf', b64);
          else if (TilstandAndroid.shareFileText) TilstandAndroid.shareFileText(name, 'application/pdf', b64, subject, text);
          else TilstandAndroid.shareFile(name, 'application/pdf', b64);
        } else {
          const blob = doc.output('blob');
          const file = new File([blob], name, { type: 'application/pdf' });
          if (mode === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) {
            this.busy = '';
            try { await navigator.share({ files: [file], title: subject, text }); } catch (e) { /* cancelled */ }
          } else {
            downloadBlob(blob, name);
          }
        }
        r.pdfAt = Date.now();
        await this.saveNow();
      } catch (e) {
        console.error(e);
        alert('Kunne ikke lage PDF: ' + e.message);
        if (newlyLocked) { r.locked = 0; Object.values(this.pads).forEach(p => p.on()); await this.saveNow(); }
      } finally {
        this.busy = '';
      }
    },

    async copyForCorrection() {
      if (!confirm('Lage en ny, redigerbar kopi?\n\nDet signerte dokumentet beholdes uendret. Kopien må signeres på nytt.')) return;
      await this.saveNow();
      const src = toPlain(this.report);
      const r = { ...src, id: uid(), created: Date.now(), updated: Date.now(), pdfAt: null, locked: 0, anon: false,
        korrigerer: src.id, korrigererDato: src.locked, signatures: { forvalter: null, leietaker: null } };
      this.pads = {};
      this.report = null;
      await this.$nextTick();
      this.edit(r);
      if (src.anon) this.toast('Kopi laget. Skriv inn leietakers fulle navn på nytt.');
      else this.toast('Korrigert kopi laget');
    },

    /* ---- all defects across reports ---- */
    async openDefects() { this.screen = 'avvik'; window.scrollTo(0, 0); await this.loadDefects(); },
    closeDefects() { this.screen = this.bolig ? 'bolig' : 'list'; this.defects = []; this.loadList(); },
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
      const rows = this.filteredDefects().map(d => [d.adresse, d.leilighet, formatDate(d.dato), d.type, initials(d.leietaker), d.rom,
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
        // Exports carry the tenant only as initials, also for drafts.
        const reports = (await DB.all('reports')).map(r => anonymize(upgradeReport(r)));
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
        if (data.app === 'flytteprotokoll') {
          // Backup from the separate Flytteprotokoll app: convert its protocols and settings.
          this.busy = 'Konverterer flytteprotokoller …';
          await new Promise(res => setTimeout(res, 30));
          data.reports = (data.protocols || []).map(fromFlytteprotokoll);
          data.settings = data.settings ? settingsFromFlytteprotokoll(data.settings) : null;
          this.busy = '';
        } else if (data.app !== 'tilstandsrapport' || (!data.settings && !Array.isArray(data.reports))) throw new Error('Ukjent filformat');
        const reports = Array.isArray(data.reports) ? data.reports : [];
        const what = [data.settings && 'profilen (navn, bydel, logo, adresser, sjekklister, tekster)', reports.length && `${reports.length} dokument(er)`].filter(Boolean).join(' og ');
        if (!confirm(`Importere ${what}? Det som finnes fra før med samme navn/ID blir overskrevet.`)) return;
        for (const r of reports) await DB.put('reports', r);
        if (data.settings) {
          const p = {};
          for (const k of PROFILE_KEYS) if (k in data.settings) p[k] = data.settings[k];
          this.settings = { ...this.settings, ...p };
          if (!Array.isArray(this.settings.adresser)) this.settings.adresser = [];
          if (!Array.isArray(this.settings.priser)) this.settings.priser = [];
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
