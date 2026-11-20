# FieldCamX sajt

Sajt za FieldCamX: snimanje utakmica malog fudbala u halama u Beogradu.
Adresa: https://fieldcamx.netlify.app · Instagram @fieldcam_x · YouTube @FieldCam_X

## Kako je napravljen
- Običan HTML, CSS i JavaScript, bez build koraka. Netlify objavljuje sve što je na grani `main`.
- `index.html`, `arhiva.html`, `usluga.html`, `zakazivanje.html`: stranice.
- `css/style.css`: stilovi (deo stilova je direktno u HTML-u, po odobrenom dizajnu).
- `js/hero.js`: uvodna animacija na početnoj ("pogled iz kamere").
- `js/main.js`: meni, plejer, arhiva, zakazivanje; čita podatke iz `data/*.json`.

## Uređivanje sadržaja (bez programiranja)
Otvori https://fieldcamx.netlify.app/admin/ i prijavi se. Svaka izmena se čuva na GitHub i sajt se sam osveži za minut-dva.

- **Arhiva termina**: novi snimak = nova stavka. Hala se upisuje tačno kao u "Lista hala" (za turnire: `Ostalo`). Za YouTube snimak može ceo link. Polje "Golovi" (npr. `41:05`) pravi dugmiće u plejeru.
- **Kalendar termina**: upiši samo dane kada je nešto zauzeto. Sve ostalo se na sajtu vidi kao slobodno. Termini bliži od 24 sata se sami zaključavaju.
- **Kontakt podaci**: telefon (iz njega se prave i link za poziv i WhatsApp), mejl, Instagram, YouTube, radno vreme.
- **Lista hala**: hale u zakazivanju i na listi "Hale u kojima snimamo". Redosled određuje i oznake CAM 01, CAM 02...
- **Hero sekcija**: naslov, podnaslov i dugme na početnoj.

## Napomene
- Pozivnice za /admin/ stižu mejlom (Netlify Identity). Link iz mejla otvara sajt, koji zatim vodi na /admin/.
- Snimci starog sajta (pre redizajna) su na grani `stari-sajt-snimci`.
