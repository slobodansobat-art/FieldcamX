# FieldCamX — statički sajt

Mobile-first, 4-stranični statički sajt za brend **FieldCamX** — snimanje amaterskih utakmica malog fudbala fiksnim kamerama u halama, distribucija highlight-ova na Instagramu. Slogan: **"MI SNIMAMO SVE"**.

Implementacija prati dizajn specifikaciju iz Faze 1 (paleta boja, tipografija, struktura sekcija, komponente).

---

## Struktura sajta (4 stranice)

- **Početna** (`index.html`) — hero, kratak "Kako radi" pregled, teaser poslednja 3 snimljena termina (klikabilni, plejer se otvara na sajtu), finalni CTA ka Zakazivanju/Usluzi. Cilj: za 3 sekunde jasno čime se FieldCamX bavi i kako postati korisnik.
- **Arhiva snimaka** (`arhiva.html`) — svi termini grupisani po hali (balonu): najnoviji izdvojen kao veća kartica, ostali u bočnoj listi. Klik na bilo koju karticu otvara YouTube plejer u lightbox-u preko cele stranice.
- **Usluga** (`usluga.html`) — procedura korak-po-korak (poziv → snimanje 4K/360° → montaža za 48h → YouTube/Instagram) uz ilustracije u stilu sajta, plus "Za koga je" (hale/škole, amaterske ekipe, turniri). Ilustracije uz korake su generisane grafike (SVG, u paleti sajta) — placeholder umesto pravih fotografija, jer preuzimanje sa stock foto sajtova nije bilo moguće iz ovog razvojnog okruženja; po želji zameniti pravim fotografijama.
- **Zakazivanje** (`zakazivanje.html`) — kalendar slobodnih/zauzetih termina (naredna 3 dana + mesečna mreža kao dodatna opcija), CTA dugmad, Instagram/telefon/email, lista hala gde se snima.

Sve 4 stranice dele isti header/footer i učitavaju sadržaj iz istih `/data/*.json` fajlova (CMS-editabilno).

## Struktura fajlova

```
fieldcamx-site/
├── index.html              # Početna
├── arhiva.html              # Arhiva snimaka
├── usluga.html               # Usluga
├── zakazivanje.html           # Zakazivanje (kalendar termina + kontakt)
├── css/
│   └── style.css           # Sav CSS (custom properties za paletu boja, mobile-first)
├── js/
│   └── main.js             # Vanilla JS — učitava /data/*.json i renderuje sadržaj (radi na svim stranicama, po potrebi)
├── data/                    # Sadržaj koji vlasnik menja preko CMS-a (ili ručno)
│   ├── hero.json            # Naslov, podnaslov, tekst/link CTA dugmeta u hero sekciji
│   ├── matches.json          # Arhiva termina: balon, datum, vreme, timovi, YouTube ID snimka
│   ├── kalendar.json         # Kalendar termina: fiksni sati u danu + zauzeti termini po datumu (Zakazivanje)
│   ├── contact.json          # Telefon, email, Instagram handle, radno vreme
│   ├── venues.json           # Lista hala/lokacija gde se snima
│   └── cta-links.json        # Instagram DM / WhatsApp / telefon linkovi za CTA dugmad
├── images/
│   ├── hero-bg.jpg               # Hero pozadinska fotografija (privremeni stock kadar)
│   ├── og-image.png              # Slika za deljenje linka (Open Graph)
│   ├── logo-full.png              # Ceo logo (ikonica + natpis "FieldCamX"), izvučen iz pravog logo fajla — koristi se u header-u i footer-u
│   ├── logo-icon.png             # Samo ikonica loga (kamera + teren), bez natpisa — trenutno se ne koristi na sajtu, ostavljena kao rezervni asset
│   ├── favicon.png                # Favicon/app-icon (zaobljeni kvadrat, samo ikonica), generisan iz logo fajla
│   └── uploads/                  # Prazan folder — odavde Decap CMS servira nove slike
├── admin/
│   ├── index.html            # Decap CMS učitavač (standardni boilerplate)
│   └── config.yml            # Definicija kolekcija/polja za CMS (git-gateway backend)
├── sitemap.xml
├── robots.txt
└── README.md
```

Logo je pravi FieldCamX logo koji je vlasnik poslao — ceo lockup (ikonica + natpis "FieldCamX" u originalnom fontu/boji koji je dizajner napisao) je izvučen i očišćen (providna pozadina) u `images/logo-full.png` i koristi se kao jedinstvena slika u header-u i footer-u na sve 4 stranice. `images/favicon.png` je generisan iz same ikonice (bez teksta, jer je favikona premala za čitljiv natpis) u app-icon stilu (zaobljeni kvadrat, tamnozelena pozadina) za favicon i apple-touch-icon. Napomena: izvorni fajl koji je vlasnik poslao je relativno mala rezolucija (296×176px), što je sasvim dovoljno za sadašnju upotrebu (header/footer/favicon), ali ako logo ikada treba da se prikaže veći (npr. na promo materijalu), bilo bi dobro tražiti od vlasnika logo u većoj rezoluciji ili vektorskom (SVG) formatu.

---

## Kako lokalno pogledati sajt

Sadržaj se učitava preko `fetch()` iz `/data/*.json`, što **ne radi** ako se `index.html` otvori direktno dvoklikom (`file://...`) zbog CORS ograničenja browsera. Zato je potreban lokalni HTTP server:

```bash
cd fieldcamx-site
python3 -m http.server 8000
```

Zatim otvoriti `http://localhost:8000/` u browseru.

CMS admin panel (bez git-gateway login-a, samo za pregled interfejsa) je na `http://localhost:8000/admin/` — realan login zahteva Netlify Identity + Git Gateway podešen u fazi deploy-a.

---

## CMS (Decap CMS)

- Backend: `git-gateway` (standardni Decap + Netlify setup) — definisan u `admin/config.yml`.
- Kolekcije mapirane 1:1 na `data/*.json` fajlove: **Hero sekcija**, **Arhiva termina (snimci)**, **Kalendar termina (Zakazivanje)**, **Kontakt podaci**, **Lista hala/lokacija**, **CTA linkovi**.
- Slike koje vlasnik otpremi preko CMS-a idu u `images/uploads/`.
- Netlify Identity/Git Gateway login **nije testiran** (to je sledeća faza — deploy). Konfiguracija je standardna i spremna za povezivanje.

---

## Placeholder podaci koje vlasnik treba da zameni pre lansiranja

1. **Instagram handle** — ✅ urađeno, pravi handle `@fieldcam_x` postavljen svuda (`data/contact.json`, `data/cta-links.json`, linkovi u celom sajtu).
2. **Logo** — ✅ urađeno, pravi logo je postavljen (`images/logo-full.png` u header-u/footer-u, `images/favicon.png` za favikonu). Opciono: zameniti verzijom u većoj rezoluciji ili vektorskom (SVG) formatu ako vlasnik ima takav fajl, radi oštrijeg prikaza na većim formatima u budućnosti.
3. **Hero pozadinska slika** — `images/hero-bg.jpg` je trenutno **besplatna stock fotografija** (Pexels licenca, autor Tima Miroshnichenko, izvor: pexels.com/photo/6077792) balon-hale za mali fudbal — koristi se privremeno jer FieldCamX nema još sopstvenu fotografiju u visokoj rezoluciji. Treba zameniti pravim FieldCamX kadrom kad stigne (i osvežiti `images/og-image.png`, koji je generisan iz iste stock fotografije, za deljenje linka na društvenim mrežama).
4. **Ilustracije procedure na Usluga stranici** (`usluga.html`, sekcija "Kako radi") — 4 generisane SVG grafike (kamera/HUD stil, u paleti sajta) umesto pravih fotografija, jer stock foto sajtovi nisu bili dostupni iz razvojnog okruženja. Po želji zameniti promo fotografijama snimanja (ne fotografijama unutrašnjosti balona/hale).
5. **Arhiva termina** (`data/matches.json`) — ⚠️ **VAŽNO:** svih 9 primer-stavki trenutno koristi isti placeholder YouTube ID (`dQw4w9WgXcQ`, javno dostupan test video) samo da bi se video mehanizam radio. Pre lansiranja treba:
   - snimke okačiti na YouTube kao **nelistirane (unlisted)** video zapise,
   - u svakoj stavci zameniti `youtube_id` pravim ID-jem tog snimka,
   - polje `balon` mora tačno da se poklapa sa nazivom hale iz `data/venues.json` (inače će se termin prikazati kao posebna, neočekivana grupa),
   - proveriti tačne datume/vremena i imena timova.
6. **Kalendar termina** (`data/kalendar.json`) — ⚠️ **VAŽNO:** `dani` trenutno sadrži izmišljene primer-datume (uklj. par u prošlosti) samo radi prikaza svih stanja kalendara. Pre lansiranja vlasnik treba da unese stvarne zauzete termine (i briše/dodaje dane kako se budu rezervisali). Polje `sati` je fiksni dnevni raspored (isti svaki dan) — po potrebi promeniti vremena, ali onda i u svakom unosu `zauzeti` koristiti tačno ista vremena.
7. **Kontakt podaci** (`data/contact.json`) — telefon, email i radno vreme su placeholder vrednosti — treba potvrditi prave podatke i kanal za CTA (Instagram DM, WhatsApp ili telefon).
8. **CTA linkovi** (`data/cta-links.json`) — Instagram DM link, WhatsApp link i telefon link su u placeholder formatu — treba zameniti pravim brojem/handle-om.
9. **Lista hala/lokacija** (`data/venues.json`) — 3 generičke placeholder stavke ("Naša prva/druga/treća hala") — treba zameniti tačnim nazivima i adresama hala gde se snima. Ovi nazivi moraju da se poklapaju sa poljem `balon` u `data/matches.json`.
10. **Cene i paketi snimanja** — ne postoje na sajtu jer podaci nisu dostupni (nije bilo definisano u dizajn specifikaciji) — dodati naknadno ako vlasnik želi.
11. **Domen** — `sitemap.xml`, `robots.txt` i Open Graph meta tagovi u `index.html` trenutno koriste `https://fieldcamx.rs/` kao pretpostavljeni domen — zameniti stvarnim domenom pre lansiranja.

---

## Napomena

Ovo je čist statički sajt (HTML + CSS + vanilla JS), bez build alata — radi direktno kao statički hosting na Netlify. Decap CMS je integrisan od početka (konfiguracija u `/admin`), ali deploy (Netlify Identity, Git Gateway, DNS) je sledeća faza i nije deo ovog koraka.
