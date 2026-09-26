# Oslo Boligforvalter

One mobile app for municipal housing: flytteprotokoll (innflytting, utflytting), periodisk kontroll and
befaring / tilstandsrapport, organised per flat (Boliger), with a tab for defects and follow-up (Avvik).

Everything runs on the device. Documents are stored locally (IndexedDB) and never leave the phone
unless you share the PDF or export a backup.

## Features
* **Boliger:** every document grouped by address and flat number; open a flat to see its history and start the next
  document there. *Start utflytting* copies keys and rooms from the innflytting and compares every point.
* **Signed and locked:** making the PDF signs and locks the document; mistakes are fixed with a *korrigert kopi*.
* **Personal data:** the PDF has the tenant's full name. The history, backups and Excel export keep the tenant only
  as initials; phone number and the tenant's signature are not kept.
* **People present:** boligforvalter, tenant and, optionally, one more person (e.g. interpreter or colleague) with
  name, role and signature.
* **Claims (utflytting):** keys delivered / missing with price per key, damages charged to the tenant with prices from
  your own price list, "known from before – no claim", total claim and the 14-day deadline in the list and the PDF.
* Room checklists you can edit (rooms, points, typical faults, fagpersoner, appliances).
* Per defect: faults, description, fagperson, urgency, cost and who carries it, several photos with date, time and
  address printed on them, follow-up Åpen → Bestilt → Utført.
* Avvik tab across all flats with filters, search and export to Excel (CSV).
* PDF with logo, keys, summary, defect list by trade, per-room tables, declaration, signatures and photos.
* Editable declarations and e-mail subject/text for *Del PDF*; meter photo.
* First-start wizard, optional PIN, profile and full backup export/import, "Slett alle data", dark mode.
* Works offline, as a web app (PWA) and as an Android APK. "Se etter oppdatering" in both.

## Web version
Enable GitHub Pages for this repo (Settings → Pages → Deploy from branch → `main` / root) and open
https://kosmet-crypto.github.io/oslo-boligforvalter/.
On Android/Chrome use menu → *Install app*; on iPhone use *Share* → *Add to Home Screen*.

Innstillinger → *Se etter oppdatering* (also at the bottom of the start screen) checks for a new version; the app also
checks quietly on start and shows a banner.

When changing `index.html`, `app.js`, the icons or `vendor/`, bump `WEB_VERSION` in `app.js` (that is what the update
check compares) and `VERSION` in `sw.js`.

## Android app (APK)
Every change merged into `main` builds a new APK with GitHub Actions and publishes it as a release.
Always the newest version: https://github.com/kosmet-crypto/oslo-boligforvalter/releases/latest/download/boligforvalter.apk

1. Open the link on your Android phone and download `boligforvalter.apk`.
2. Open the file. Android asks to allow installs from your browser or file manager; allow it once.
3. Install. Newer APKs install over the old one and keep your documents.

Changes to `index.html` and `app.js` reach the app silently (see `Ota.java`); a new APK is offered only when the
Android part changes. *Del PDF* opens the Android share sheet with a ready e-mail subject and text; *Lagre PDF* lets
you pick a folder. The camera can be used directly when adding photos.

Data in the APK is stored separately from the browser version; use *Eksporter / Importer* in Innstillinger to move it.

The Android project lives in `android/` (a small WebView wrapper). To build locally: `cd android && ./gradlew assembleRelease`.

## Libraries
Bundled in `vendor/` so the app works without internet: Alpine.js, signature_pad, jsPDF, jsPDF-AutoTable (all MIT).
