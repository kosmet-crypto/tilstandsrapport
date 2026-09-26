# Boligforvaltning (Tilstandsrapport + Flytteprotokoll)

One mobile app for municipal housing: flytteprotokoll (innflytting, utflytting), periodisk kontroll and
befaring / tilstandsrapport, organised per flat (Boliger), with a tab for defects and follow-up (Avvik).
Go room by room, mark each point OK or AVVIK, add photos, assign the trade (fagperson), urgency and
estimated cost, collect signatures from boligforvalter and leietaker, and produce a PDF report.

Everything runs on the device. Reports are stored locally (IndexedDB) and never leave the phone
unless you share the PDF or export a backup.

## Features
* **Boliger:** every document grouped by address and flat number; open a flat to see its history and start the next
  document there. *Start utflytting* copies keys and rooms from the innflytting and compares every point.
* **Signed and locked:** making the PDF signs and locks the document; mistakes are fixed with a *korrigert kopi*.
* **Personal data:** the PDF has the tenant's full name. The history, backups and Excel export keep the tenant (and a
  representative) only as initials; phone number and the tenant's signature are not kept.
* **Claims (utflytting):** keys delivered / missing with price per key, damages charged to the tenant with prices from
  your own price list, "known from before – no claim", total claim and the 14-day deadline in the list and the PDF.
* Editable declarations and e-mail subject/text for *Del PDF*; representative with power of attorney; meter photo.
* Import of backups from the old Flytteprotokoll app.
* Report types: Innflytting, Utflytting, Periodisk kontroll, Befaring.
* Leietaker details, electricity meter, keys and access cards.
* Room checklists (entré, stue, kjøkken, soverom, bad, WC, vaskerom, bod, balkong, brannsikkerhet,
  skadedyr, hvitevarer), add or remove rooms and custom points.
* Per defect: typical faults, description, fagperson, hastegrad, estimated cost, who pays, several photos
  (resized automatically so PDFs stay small).
* Autosave, report history, "Ny fra denne" to start a new report for the same flat.
* Two signatures. The PDF has a summary, a defect/order list grouped by trade, per-room tables and photo pages.
* Comparison: an utflytting report is compared with the latest innflytting of the same flat; every point shows
  what was recorded then, new damage is marked "NY SKADE" and the PDF says what is new and what was there before.
* Own checklists (Innstillinger → Rediger sjekklister): rooms, points, typical faults, fagpersoner and appliances,
  and which of them every new report starts with. Travels with the profile backup.
* Date, time and address printed on photos (can be turned off).
* Follow-up per defect: Åpen → Bestilt → Utført with dates, and an "Avvik og oppfølging" overview across all reports.
* Export of defects to Excel (CSV, semicolon separated, opens directly in Norwegian Excel).
* Optional PIN lock, backup export/import, "Slett alle data".
* Works offline, as a web app (PWA) and as an Android APK.

## Web version
Enable GitHub Pages for this repo (Settings → Pages → Deploy from branch → `main` / root) and open the link.
On Android/Chrome use menu → *Install app*; on iPhone use *Share* → *Add to Home Screen*.

Innstillinger → *Se etter oppdatering* (also at the bottom of the start screen) checks for a new version; the app also checks quietly on start and shows a banner.

When changing `index.html`, `app.js`, the icons or `vendor/`, bump `WEB_VERSION` in `app.js` (that is what the update check compares) and `VERSION` in `sw.js`.

## Android app (APK)
Every change merged into `main` builds a new APK with GitHub Actions and publishes it as a release.
Always the newest version: https://github.com/kosmet-crypto/tilstandsrapport/releases/latest/download/tilstandsrapport.apk

1. Open the link on your Android phone and download `tilstandsrapport.apk`.
2. Open the file. Android asks to allow installs from your browser or file manager; allow it once.
3. Install. Newer APKs install over the old one and keep your reports.

The app checks for a newer release at most twice a day and offers to download it (Innstillinger → *Se etter oppdatering* checks now).
In the app, *Del rapport* opens the Android share sheet (e-post, Teams, OneDrive …) and *Lagre PDF* lets you pick a folder.
The camera can be used directly when adding photos.

Data in the APK is stored separately from the browser version; use *Eksporter / Importer sikkerhetskopi* in Innstillinger to move it.

The Android project lives in `android/` (a small WebView wrapper). To build locally: `cd android && ./gradlew assembleRelease`.

## Libraries
Bundled in `vendor/` so the app works without internet: Alpine.js, signature_pad, jsPDF, jsPDF-AutoTable (all MIT).
