/* =========================================================
   FieldCamX — main.js
   Učitava sadržaj iz /data/*.json fajlova i renderuje ga u DOM.
   Čist vanilla JS, bez zavisnosti.
   NAPOMENA: fetch() zahteva da se sajt servira preko HTTP servera
   (npr. `python -m http.server`), ne radi direktno sa file:// putanje.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Pomoćna funkcija za učitavanje JSON-a ---------- */
  async function loadJSON(path) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status + " za " + path);
      return await res.json();
    } catch (err) {
      console.error("[FieldCamX] Greška pri učitavanju " + path + ":", err);
      return null;
    }
  }

  /* ---------- Sticky navigacija: promena pozadine pri skrolu ---------- */
  function initHeaderScroll() {
    const header = document.getElementById("site-header");
    if (!header) return;
    const toggle = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });
  }

  /* ---------- Hamburger meni (mobilni) ---------- */
  function initMobileNav() {
    const btn = document.getElementById("hamburger-btn");
    const nav = document.getElementById("mobile-nav");
    if (!btn || !nav) return;

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!isOpen));
      nav.hidden = isOpen;
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        btn.setAttribute("aria-expanded", "false");
        nav.hidden = true;
      });
    });
  }

  /* ---------- Hero tekst (data/hero.json) ---------- */
  async function renderHero() {
    const data = await loadJSON("data/hero.json");
    if (!data) return;

    const titleEl = document.querySelector('[data-field="naslov"]');
    const subtitleEl = document.querySelector('[data-field="podnaslov"]');
    const ctaEl = document.getElementById("hero-cta");

    if (titleEl && data.naslov) titleEl.textContent = data.naslov;
    if (subtitleEl && data.podnaslov) subtitleEl.textContent = data.podnaslov;
    if (ctaEl) {
      if (data.cta_tekst) ctaEl.textContent = data.cta_tekst;
      if (data.cta_link) ctaEl.setAttribute("href", data.cta_link);
    }
  }

  /* ---------- Termini / snimci (data/matches.json) ----------
     Zajednički izvor za teaser na Početnoj ([data-matches-teaser])
     i punu arhivu grupisanu po balonu (#matches-by-balon) na Arhiva stranici. */

  function formatDatum(iso) {
    if (!iso) return "";
    const meseci = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.getDate() + ". " + meseci[d.getMonth()] + " " + d.getFullYear();
  }

  function matchTitle(m) {
    if (m.naslov) return m.naslov;
    const t1 = m.tim1 || "";
    const t2 = m.tim2 || "";
    return t1 && t2 ? (t1 + " – " + t2) : (t1 || t2 || "Snimak utakmice");
  }

  function matchThumb(m) {
    return m.thumbnail || ("https://img.youtube.com/vi/" + m.youtube_id + "/hqdefault.jpg");
  }

  function matchYtLink(m) {
    return m.youtube_link || ("https://youtu.be/" + m.youtube_id);
  }

  function buildMatchCard(m, variant) {
    const a = document.createElement("a");
    a.className = "match-card" + (variant ? " " + variant : "");
    a.href = matchYtLink(m);
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("data-yt-id", m.youtube_id || "");
    a.setAttribute("data-yt-link", matchYtLink(m));
    const naslov = matchTitle(m);
    a.setAttribute("aria-label", "Pusti video: " + naslov);

    const thumb = document.createElement("div");
    thumb.className = "match-thumb";
    const img = document.createElement("img");
    img.src = matchThumb(m);
    img.alt = naslov;
    img.loading = "lazy";
    thumb.appendChild(img);

    const play = document.createElement("div");
    play.className = "match-play";
    play.setAttribute("aria-hidden", "true");
    play.innerHTML = '<span><svg width="18" height="18" viewBox="0 0 16 16"><path d="M4 2l10 6-10 6z" fill="var(--accent)"/></svg></span>';
    thumb.appendChild(play);
    a.appendChild(thumb);

    const info = document.createElement("div");
    info.className = "match-info";
    const titleEl = document.createElement("span");
    titleEl.className = "match-title";
    titleEl.textContent = naslov;
    info.appendChild(titleEl);

    const metaDelovi = [];
    if (m.balon) metaDelovi.push(m.balon);
    const datumTxt = formatDatum(m.datum);
    if (datumTxt) metaDelovi.push(datumTxt + (m.vreme ? " · " + m.vreme : ""));
    if (metaDelovi.length) {
      const metaEl = document.createElement("span");
      metaEl.className = "match-meta";
      metaEl.textContent = metaDelovi.join(" — ");
      info.appendChild(metaEl);
    }
    a.appendChild(info);

    return a;
  }

  async function loadMatches() {
    const data = await loadJSON("data/matches.json");
    const stavke = (data && Array.isArray(data.stavke)) ? data.stavke.slice() : [];
    stavke.sort((a, b) => (b.datum || "").localeCompare(a.datum || ""));
    return stavke;
  }

  /* Teaser na Početnoj */
  async function renderMatchesTeaser() {
    const grids = document.querySelectorAll("[data-matches-teaser]");
    if (!grids.length) return;
    const sve = await loadMatches();

    grids.forEach((grid) => {
      const limitAttr = grid.getAttribute("data-limit");
      const limit = limitAttr ? parseInt(limitAttr, 10) : null;
      const stavke = limit ? sve.slice(0, limit) : sve;

      if (stavke.length === 0) {
        grid.innerHTML = '<p class="matches-empty">Snimci će uskoro biti dostupni.</p>';
        return;
      }
      const frag = document.createDocumentFragment();
      stavke.forEach((m) => frag.appendChild(buildMatchCard(m)));
      grid.appendChild(frag);
    });
  }

  /* ---------- Arhiva: filter kartice po balonu + rezultati ----------
     Umesto statičnog intro bloka, red klikabilnih kartica (jedna po hali)
     bira koja hala se prikazuje ispod: 1 velika (featured) + do 4 male
     sa strane. Preko praga se pojavljuje "Pogledaj sve snimke" koje
     prebacuje na pun grid svih snimaka te hale, sa dugmetom "Nazad". */

  function brojSnimaka(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return n + " snimak";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return n + " snimka";
    return n + " snimaka";
  }

  async function initBalonExplorer() {
    const filtersEl = document.getElementById("balon-filters");
    const resultsEl = document.getElementById("balon-results");
    if (!filtersEl || !resultsEl) return;

    const PRIKAZ_LIMIT = 4; // koliko stavki u bočnoj listi pored featured kartice

    const sve = await loadMatches();
    if (sve.length === 0) {
      filtersEl.hidden = true;
      resultsEl.innerHTML = '<p class="matches-empty">Arhiva će uskoro biti dostupna.</p>';
      return;
    }

    const grupe = new Map();
    sve.forEach((m) => {
      const kljuc = m.balon || "Ostalo";
      if (!grupe.has(kljuc)) grupe.set(kljuc, []);
      grupe.get(kljuc).push(m);
    });
    // Hale poređane po datumu najnovijeg termina u toj hali
    const balonNazivi = Array.from(grupe.keys()).sort((a, b) =>
      (grupe.get(b)[0].datum || "").localeCompare(grupe.get(a)[0].datum || "")
    );

    const FILTER_LIMIT = 4; // koliko balon-kartica se prikazuje pre "Pogledaj još"

    let aktivan = balonNazivi[0];
    let punPrikaz = false;
    let filteriProsireni = false;

    function buildFilterCard(naziv) {
      const termini = grupe.get(naziv);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "balon-filter";
      btn.setAttribute("aria-pressed", String(naziv === aktivan));
      btn.setAttribute("data-balon", naziv);

      const thumb = document.createElement("span");
      thumb.className = "balon-filter-thumb";
      const img = document.createElement("img");
      img.src = matchThumb(termini[0]);
      img.alt = "";
      img.loading = "lazy";
      thumb.appendChild(img);
      btn.appendChild(thumb);

      const textWrap = document.createElement("span");
      textWrap.className = "balon-filter-text";
      const nameEl = document.createElement("span");
      nameEl.className = "balon-filter-name";
      nameEl.textContent = naziv;
      const countEl = document.createElement("span");
      countEl.className = "balon-filter-count";
      countEl.textContent = brojSnimaka(termini.length);
      textWrap.appendChild(nameEl);
      textWrap.appendChild(countEl);
      btn.appendChild(textWrap);

      return btn;
    }

    function renderFilters() {
      filtersEl.innerHTML = "";
      const frag = document.createDocumentFragment();

      const zaPrikaz = filteriProsireni ? balonNazivi : balonNazivi.slice(0, FILTER_LIMIT);
      zaPrikaz.forEach((naziv) => frag.appendChild(buildFilterCard(naziv)));

      if (!filteriProsireni && balonNazivi.length > FILTER_LIMIT) {
        const moreBtn = document.createElement("button");
        moreBtn.type = "button";
        moreBtn.className = "balon-filter balon-filter-more";
        moreBtn.textContent = "Pogledaj još (" + (balonNazivi.length - FILTER_LIMIT) + ")";
        moreBtn.addEventListener("click", () => {
          filteriProsireni = true;
          renderFilters();
        });
        frag.appendChild(moreBtn);
      }

      filtersEl.appendChild(frag);
    }

    function renderResults() {
      resultsEl.innerHTML = "";
      const termini = grupe.get(aktivan) || [];

      if (punPrikaz) {
        const backBtn = document.createElement("button");
        backBtn.type = "button";
        backBtn.className = "balon-back";
        backBtn.innerHTML = "&larr; Nazad na pregled";
        backBtn.addEventListener("click", () => {
          punPrikaz = false;
          renderResults();
        });
        resultsEl.appendChild(backBtn);

        const grid = document.createElement("div");
        grid.className = "matches-teaser-grid";
        termini.forEach((m) => grid.appendChild(buildMatchCard(m)));
        resultsEl.appendChild(grid);
        return;
      }

      const layout = document.createElement("div");
      layout.className = "balon-layout";
      layout.appendChild(buildMatchCard(termini[0], "balon-featured"));

      if (termini.length > 1) {
        const list = document.createElement("div");
        list.className = "balon-list";
        termini.slice(1, 1 + PRIKAZ_LIMIT).forEach((m) => list.appendChild(buildMatchCard(m, "balon-list-item")));
        layout.appendChild(list);
      }
      resultsEl.appendChild(layout);

      if (termini.length > 1 + PRIKAZ_LIMIT) {
        const viewAllWrap = document.createElement("p");
        viewAllWrap.className = "balon-view-all";
        const viewAllBtn = document.createElement("button");
        viewAllBtn.type = "button";
        viewAllBtn.className = "btn btn-secondary";
        viewAllBtn.textContent = "Pogledaj sve snimke";
        viewAllBtn.addEventListener("click", () => {
          punPrikaz = true;
          renderResults();
        });
        viewAllWrap.appendChild(viewAllBtn);
        resultsEl.appendChild(viewAllWrap);
      }
    }

    filtersEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-balon]");
      if (!btn) return;
      const naziv = btn.getAttribute("data-balon");
      if (naziv === aktivan) return;
      aktivan = naziv;
      punPrikaz = false;
      renderFilters();
      renderResults();
    });

    renderFilters();
    renderResults();
  }

  /* ---------- Video lightbox (YouTube plejer preko stranice) ---------- */
  function initLightbox() {
    const lb = document.getElementById("video-lightbox");
    if (!lb) return;
    const frame = document.getElementById("lightbox-frame");
    const ytLink = document.getElementById("lightbox-yt-link");

    function open(ytId, ytUrl) {
      if (!ytId) return;
      frame.innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/' + ytId +
        '?autoplay=1&rel=0" title="FieldCamX video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      if (ytLink) ytLink.href = ytUrl || ("https://youtu.be/" + ytId);
      lb.hidden = false;
      document.body.style.overflow = "hidden";
    }
    function close() {
      lb.hidden = true;
      frame.innerHTML = "";
      document.body.style.overflow = "";
    }

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-lightbox-close]")) {
        close();
        return;
      }
      const card = e.target.closest("[data-yt-id]");
      if (card) {
        e.preventDefault();
        open(card.getAttribute("data-yt-id"), card.getAttribute("data-yt-link"));
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lb.hidden) close();
    });
  }

  /* ---------- Kalendar termina (data/kalendar.json) ----------
     Glavni prikaz: danas + naredna 2 dana, sa satima obeleženim
     slobodno/zauzeto (fiksni raspored, isti sati svaki dan).
     Mesečna mreža je dodatna opcija iza dugmeta "Prikaži ceo mesec". */

  const DANI_PUNI = ["Nedelja", "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota"];
  const DANI_KRATKI_PON = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];
  const MESECI_PUNI = ["januar", "februar", "mart", "april", "maj", "jun", "jul", "avgust", "septembar", "oktobar", "novembar", "decembar"];
  const MESECI_KRATKI = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];

  function isoDatum(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  async function initKalendar() {
    const agendaEl = document.getElementById("kalendar-agenda");
    if (!agendaEl) return;

    const data = await loadJSON("data/kalendar.json");
    const sati = (data && Array.isArray(data.sati) && data.sati.length)
      ? data.sati
      : ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
    const dani = (data && Array.isArray(data.dani)) ? data.dani : [];

    const danas = new Date();
    danas.setHours(0, 0, 0, 0);

    function zauzetiZaDan(iso) {
      const unos = dani.find((d) => d.datum === iso);
      return unos ? (unos.zauzeti || []) : [];
    }

    function statusZaDan(iso) {
      const zauzeti = zauzetiZaDan(iso);
      const slobodnih = sati.filter((s) => !zauzeti.includes(s)).length;
      if (slobodnih === 0) return "zauzeto";
      if (slobodnih === sati.length) return "slobodno";
      return "delimicno";
    }

    function labelStatusa(status) {
      if (status === "slobodno") return "Slobodno";
      if (status === "zauzeto") return "Popunjeno";
      return "Delimično slobodno";
    }

    function buildSatiWrap(iso) {
      const zauzeti = zauzetiZaDan(iso);
      const wrap = document.createElement("div");
      wrap.className = "dan-sati";
      sati.forEach((s) => {
        const pill = document.createElement("span");
        const jeZauzet = zauzeti.includes(s);
        pill.className = "sat-pill " + (jeZauzet ? "sat-zauzet" : "sat-slobodan");
        pill.textContent = s;
        wrap.appendChild(pill);
      });
      return wrap;
    }

    /* ---- Glavni prikaz: danas + naredna 2 dana ---- */
    function buildDanKartica(offset) {
      const d = new Date(danas);
      d.setDate(d.getDate() + offset);
      const iso = isoDatum(d);
      const status = statusZaDan(iso);

      const card = document.createElement("div");
      card.className = "dan-kartica dan-kartica-" + status;

      const head = document.createElement("div");
      head.className = "dan-kartica-head";
      const naslov = document.createElement("span");
      naslov.className = "dan-kartica-naslov";
      naslov.textContent = offset === 0 ? "Danas" : offset === 1 ? "Sutra" : DANI_PUNI[d.getDay()];
      const datumEl = document.createElement("span");
      datumEl.className = "dan-kartica-datum";
      datumEl.textContent = d.getDate() + ". " + MESECI_KRATKI[d.getMonth()] + ".";
      head.appendChild(naslov);
      head.appendChild(datumEl);
      card.appendChild(head);

      card.appendChild(buildSatiWrap(iso));

      const statusEl = document.createElement("span");
      statusEl.className = "dan-kartica-status";
      statusEl.textContent = labelStatusa(status);
      card.appendChild(statusEl);

      return card;
    }

    function renderAgenda() {
      agendaEl.innerHTML = "";
      const frag = document.createDocumentFragment();
      [0, 1, 2].forEach((offset) => frag.appendChild(buildDanKartica(offset)));
      agendaEl.appendChild(frag);
    }

    renderAgenda();

    /* ---- Dodatna opcija: mesečna mreža ---- */
    const monthToggleEl = document.getElementById("kalendar-month-toggle");
    const monthWrapEl = document.getElementById("kalendar-month");
    if (!monthToggleEl || !monthWrapEl) return;

    let prikazanMesec = new Date(danas.getFullYear(), danas.getMonth(), 1);

    function renderIzabraniDan(iso, d) {
      const wrap = document.getElementById("kalendar-dan-detalji");
      if (!wrap) return;
      wrap.innerHTML = "";

      const naslov = document.createElement("p");
      naslov.className = "kalendar-dan-detalji-naslov";
      naslov.textContent = DANI_PUNI[d.getDay()] + ", " + d.getDate() + ". " + MESECI_PUNI[d.getMonth()] + ".";
      wrap.appendChild(naslov);
      wrap.appendChild(buildSatiWrap(iso));
    }

    function renderMesec() {
      monthWrapEl.innerHTML = "";

      const nav = document.createElement("div");
      nav.className = "kalendar-mesec-nav";
      const prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "kalendar-mesec-strelica";
      prevBtn.setAttribute("aria-label", "Prethodni mesec");
      prevBtn.innerHTML = "&larr;";
      const naslovMeseca = document.createElement("span");
      naslovMeseca.className = "kalendar-mesec-naslov";
      naslovMeseca.textContent = MESECI_PUNI[prikazanMesec.getMonth()] + " " + prikazanMesec.getFullYear() + ".";
      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "kalendar-mesec-strelica";
      nextBtn.setAttribute("aria-label", "Naredni mesec");
      nextBtn.innerHTML = "&rarr;";
      nav.appendChild(prevBtn);
      nav.appendChild(naslovMeseca);
      nav.appendChild(nextBtn);
      monthWrapEl.appendChild(nav);

      const glava = document.createElement("div");
      glava.className = "kalendar-grid kalendar-grid-head";
      DANI_KRATKI_PON.forEach((dn) => {
        const el = document.createElement("span");
        el.textContent = dn;
        glava.appendChild(el);
      });
      monthWrapEl.appendChild(glava);

      const grid = document.createElement("div");
      grid.className = "kalendar-grid";

      const prviDan = new Date(prikazanMesec.getFullYear(), prikazanMesec.getMonth(), 1);
      const brojDana = new Date(prikazanMesec.getFullYear(), prikazanMesec.getMonth() + 1, 0).getDate();
      const pomak = (prviDan.getDay() + 6) % 7; // ponedeljak = prva kolona

      for (let i = 0; i < pomak; i++) {
        const prazno = document.createElement("span");
        prazno.className = "kalendar-dan kalendar-dan-prazno";
        grid.appendChild(prazno);
      }

      for (let dan = 1; dan <= brojDana; dan++) {
        const d = new Date(prikazanMesec.getFullYear(), prikazanMesec.getMonth(), dan);
        const iso = isoDatum(d);
        const jeProslo = d < danas;
        const jeDanas = iso === isoDatum(danas);
        const status = jeProslo ? null : statusZaDan(iso);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "kalendar-dan kalendar-dan-" + (jeProslo ? "proslo" : status);
        if (jeDanas) btn.classList.add("kalendar-dan-danas");
        btn.textContent = String(dan);
        btn.setAttribute(
          "aria-label",
          dan + ". " + MESECI_PUNI[prikazanMesec.getMonth()] + " — " + (jeProslo ? "prošlo" : labelStatusa(status))
        );
        if (jeProslo) {
          btn.disabled = true;
        } else {
          btn.addEventListener("click", () => {
            grid.querySelectorAll(".kalendar-dan-izabran").forEach((el) => el.classList.remove("kalendar-dan-izabran"));
            btn.classList.add("kalendar-dan-izabran");
            renderIzabraniDan(iso, d);
          });
        }
        grid.appendChild(btn);
      }

      monthWrapEl.appendChild(grid);

      const detalji = document.createElement("div");
      detalji.className = "kalendar-dan-detalji";
      detalji.id = "kalendar-dan-detalji";
      monthWrapEl.appendChild(detalji);

      prevBtn.addEventListener("click", () => {
        prikazanMesec = new Date(prikazanMesec.getFullYear(), prikazanMesec.getMonth() - 1, 1);
        renderMesec();
      });
      nextBtn.addEventListener("click", () => {
        prikazanMesec = new Date(prikazanMesec.getFullYear(), prikazanMesec.getMonth() + 1, 1);
        renderMesec();
      });
    }

    let mesecOtvoren = false;
    let mesecPrikazan = false;
    monthToggleEl.addEventListener("click", () => {
      mesecOtvoren = !mesecOtvoren;
      monthToggleEl.setAttribute("aria-expanded", String(mesecOtvoren));
      monthWrapEl.hidden = !mesecOtvoren;
      monthToggleEl.textContent = mesecOtvoren ? "Sakrij ceo mesec" : "Prikaži ceo mesec";
      if (mesecOtvoren && !mesecPrikazan) {
        mesecPrikazan = true;
        renderMesec();
      }
    });
  }

  /* ---------- Kontakt podaci (data/contact.json) ---------- */
  async function renderContact() {
    const data = await loadJSON("data/contact.json");
    if (!data) return;

    const navCta = document.getElementById("nav-cta");
    if (navCta && data.instagram_link) navCta.setAttribute("href", data.instagram_link);

    const footerIg = document.querySelector(".footer-ig");
    if (footerIg && data.instagram_link) footerIg.setAttribute("href", data.instagram_link);

    const footerYt = document.getElementById("footer-yt-link");
    if (footerYt && data.youtube_link) footerYt.setAttribute("href", data.youtube_link);

    const igItem = document.getElementById("kontakt-instagram-item");
    const igHandle = document.getElementById("kontakt-instagram-handle");
    if (igItem && data.instagram_link) igItem.setAttribute("href", data.instagram_link);
    if (igHandle && data.instagram_handle) igHandle.textContent = data.instagram_handle;

    const phoneItem = document.getElementById("kontakt-phone-item");
    const phoneValue = document.getElementById("kontakt-phone-value");
    if (phoneItem) {
      if (data.telefon) {
        phoneItem.hidden = false;
        phoneItem.setAttribute("href", "tel:" + data.telefon.replace(/[^+\d]/g, ""));
        if (phoneValue) phoneValue.textContent = data.telefon;
      } else {
        phoneItem.hidden = true;
      }
    }

    const emailItem = document.getElementById("kontakt-email-item");
    const emailValue = document.getElementById("kontakt-email-value");
    if (emailItem) {
      if (data.email) {
        emailItem.hidden = false;
        emailItem.setAttribute("href", "mailto:" + data.email);
        if (emailValue) emailValue.textContent = data.email;
      } else {
        emailItem.hidden = true;
      }
    }

    const radnoVreme = document.getElementById("kontakt-radno-vreme");
    if (radnoVreme) {
      if (data.radno_vreme) {
        radnoVreme.hidden = false;
        radnoVreme.textContent = data.radno_vreme;
      } else {
        radnoVreme.hidden = true;
      }
    }
  }

  /* ---------- CTA linkovi (data/cta-links.json) ---------- */
  async function renderCtaLinks() {
    const data = await loadJSON("data/cta-links.json");
    if (!data) return;

    const primary = document.getElementById("kontakt-cta-primary");
    const secondary = document.getElementById("kontakt-cta-secondary");

    // Primarno dugme -> Instagram DM (ako postoji), sekundarno -> WhatsApp/telefon
    if (primary && data.instagram_dm) primary.setAttribute("href", data.instagram_dm);
    if (secondary) {
      if (data.whatsapp) secondary.setAttribute("href", data.whatsapp);
      else if (data.telefon) secondary.setAttribute("href", data.telefon);
    }
  }

  /* ---------- Lista hala (data/venues.json) ---------- */
  async function renderVenues() {
    const list = document.getElementById("hale-list");
    if (!list) return;
    const data = await loadJSON("data/venues.json");
    const stavke = (data && Array.isArray(data.stavke)) ? data.stavke : [];

    if (stavke.length === 0) {
      list.innerHTML = "";
      return;
    }

    const frag = document.createDocumentFragment();
    stavke.forEach((hala) => {
      const li = document.createElement("li");
      li.textContent = hala.naziv + (hala.adresa ? " — " + hala.adresa : "");
      frag.appendChild(li);
    });
    list.appendChild(frag);
  }

  /* ---------- Footer godina ---------- */
  function renderFooterYear() {
    const el = document.getElementById("footer-year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initHeaderScroll();
    initMobileNav();
    initLightbox();
    renderFooterYear();

    renderHero();
    renderMatchesTeaser();
    initBalonExplorer();
    initKalendar();
    renderContact();
    renderCtaLinks();
    renderVenues();
  });
})();
