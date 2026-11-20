/* FieldCamX — sav JavaScript sajta (bez biblioteka).
   Podaci dolaze iz data/*.json fajlova koje uređuje Decap CMS (/admin/). */
(function () {
  'use strict';

  /* ================= pomoćne funkcije ================= */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var cssEsc = function (s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'); };

  var cache = {};
  function loadJSON(path) {
    if (!cache[path]) {
      cache[path] = fetch(path, { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error(path + ' ' + r.status); return r.json(); })
        .catch(function (e) { if (window.console) console.warn('FieldCamX: ne mogu da učitam', path, e); return null; });
    }
    return cache[path];
  }

  var WD = ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'četvrtak', 'petak', 'subota'];
  var MN = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
  var MNS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var parseDay = function (s) {
    var p = String(s || '').slice(0, 10).split('-').map(Number);
    return p.length === 3 && p[0] ? new Date(p[0], p[1] - 1, p[2]) : null;
  };
  var THIS_YEAR = new Date().getFullYear();
  var yearSfx = function (d) { return d.getFullYear() === THIS_YEAR ? '' : ' ' + d.getFullYear(); };
  var slug = function (s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  function lockScroll(on) { document.documentElement.style.overflow = on ? 'hidden' : ''; }

  function trapFocus(box, e) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href], button:not([disabled]), select, iframe, [tabindex]:not([tabindex="-1"])', box).filter(function (el) { return el.offsetParent !== null || el.tagName === 'IFRAME'; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ================= meni na telefonu ================= */
  function initMenu() {
    var burger = $('#burger'), menu = $('#mob-menu');
    if (!burger || !menu) return;
    function open() {
      menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); lockScroll(true);
      var x = $('.x-btn', menu); if (x) x.focus();
    }
    function close(back) {
      if (menu.hidden) return;
      menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); lockScroll(false);
      if (back) burger.focus();
    }
    burger.addEventListener('click', open);
    $$('[data-close-menu]', menu).forEach(function (el) {
      el.addEventListener('click', function () { close(el.classList.contains('x-btn')); });
    });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close(true);
      trapFocus(menu, e);
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 760) close(false); });
  }

  /* ================= kontakt podaci iz CMS-a ================= */
  // Broj telefona se upisuje jednom (contact.json), a linkovi za poziv i WhatsApp se prave iz njega.
  function phoneIntl(t) {
    var d = String(t || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.indexOf('00') === 0) d = d.slice(2);
    else if (d.charAt(0) === '0') d = '381' + d.slice(1);
    return d;
  }
  // Menja broj/nalog u tekstu linka; kod ikonica (bez teksta) menja aria-label i title.
  function swapText(a, re, val) {
    if (a.querySelector('svg') && !a.textContent.trim()) {
      ['aria-label', 'title'].forEach(function (k) { var v = a.getAttribute(k); if (v) a.setAttribute(k, v.replace(re, val)); });
    } else a.textContent = a.textContent.replace(re, val);
  }
  function initContacts() {
    Promise.all([loadJSON('data/contact.json'), loadJSON('data/cta-links.json')]).then(function (r) {
      var c = r[0] || {}, l = r[1] || {};
      var phoneRe = /0\d{2} \d{3} \d{3,4}/;
      var intl = phoneIntl(c.telefon);
      $$('a[href^="tel:"]').forEach(function (a) {
        if (intl) a.href = 'tel:+' + intl;
        if (c.telefon) swapText(a, phoneRe, c.telefon);
      });
      $$('a[href^="https://wa.me/"]').forEach(function (a) {
        if (a.id === 'wa-send') return;
        if (intl) a.href = 'https://wa.me/' + intl;
        if (c.telefon) swapText(a, phoneRe, c.telefon);
      });
      if (l.instagram_dm) $$('a[data-ig-dm]').forEach(function (a) { a.href = l.instagram_dm; });
      if (c.instagram_link) $$('a.f-link[href^="https://www.instagram.com/"], a.soc-a[href^="https://www.instagram.com/"]').forEach(function (a) {
        if (a.hasAttribute('data-ig-dm')) return;
        a.href = c.instagram_link;
        if (c.instagram_handle) swapText(a, /@[\w.]+/, c.instagram_handle);
      });
      if (c.youtube_link) $$('a.f-link[href^="https://www.youtube.com/@"], a.soc-a[href^="https://www.youtube.com/@"]').forEach(function (a) {
        if (a.id === 'pl-yt') return;
        a.href = c.youtube_link;
        var h = (c.youtube_link.match(/@[\w.-]+/) || [])[0];
        if (h) swapText(a, /@[\w.-]+/, h);
      });
      if (c.radno_vreme) $$('[data-c="radno_vreme"]').forEach(function (el) { el.textContent = c.radno_vreme; });
      if (c.email) $$('a[href^="mailto:"]').forEach(function (a) {
        var old = a.getAttribute('href').slice(7);
        a.href = 'mailto:' + c.email;
        swapText(a, old, c.email);
      });
    });
  }

  /* ================= snimci (data/matches.json) ================= */
  var HALL_ORDER = null;
  // "9:00" -> "09:00", da se vremena ispravno sortiraju i porede
  function normTime(t) {
    var m = String(t || '').trim().match(/^(\d{1,2})[:.](\d{2})/);
    return m ? pad(+m[1]) + ':' + m[2] : '';
  }
  function loadMatches() {
    return Promise.all([loadJSON('data/matches.json'), loadJSON('data/venues.json')]).then(function (r) {
      var raw = (r[0] && r[0].stavke) || [];
      var venues = ((r[1] && r[1].stavke) || []).map(function (v) { return v.naziv; }).filter(Boolean);
      var seen = {}, list = [];
      raw.forEach(function (x) {
        var d = parseDay(x.datum);
        var yid = String(x.youtube_id || '').trim();
        var mm = yid.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
        if (mm) yid = mm[1];
        if (!d || !yid || seen[yid]) return;
        seen[yid] = true;
        var gen = /^(doma[cć]i|gosti)$/i;
        var teams = x.tim1 && x.tim2 && !(gen.test(x.tim1) && gen.test(x.tim2)) ? x.tim1 + ' – ' + x.tim2 : '';
        list.push({
          hala: x.balon || 'Ostalo',
          d: d,
          vreme: normTime(x.vreme),
          naslov: x.naslov || teams,
          yid: yid,
          link: x.youtube_link || 'https://www.youtube.com/watch?v=' + yid,
          golovi: (x.golovi || []).map(function (g) { return typeof g === 'string' ? g : (g && (g.minut || g.vreme)) || ''; }).filter(Boolean)
        });
      });
      list.sort(function (a, b) {
        return (b.d - a.d) || (b.vreme > a.vreme ? 1 : b.vreme < a.vreme ? -1 : 0);
      });
      var order = venues.slice();
      list.forEach(function (m) { if (order.indexOf(m.hala) === -1 && m.hala !== 'Ostalo') order.push(m.hala); });
      order.push('Ostalo');
      HALL_ORDER = order;
      return list;
    });
  }
  var camOf = function (hala) { var i = (HALL_ORDER || []).indexOf(hala); return 'CAM ' + pad(i < 0 ? 5 : i + 1); };
  var halaName = function (h) { return h === 'Ostalo' ? 'Turniri i ostale hale' : h; };
  var whenLong = function (m) { return WD[m.d.getDay()] + ' ' + m.d.getDate() + '. ' + MN[m.d.getMonth()] + yearSfx(m.d) + (m.vreme ? ', ' + m.vreme : ''); };
  var whenShort = function (m) { return m.d.getDate() + '. ' + MNS[m.d.getMonth()] + yearSfx(m.d) + (m.vreme ? ', ' + m.vreme : ''); };
  var matchTitle = function (m) { return m.hala === 'Ostalo' ? (m.naslov || 'Turnir') : m.hala; };

  /* ================= plejer (modal) ================= */
  var player = null;
  function initPlayer() {
    var box = $('#player');
    if (!box) return null;
    var lastFocus = null, cur = null, seek = null;
    var pBox = $('#pl-box', box), play = $('#pl-play', box), seekLbl = $('#pl-seek', box);
    var gStyle = function (on) {
      return 'display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 16px; border-radius: 999px; font-family: Manrope, sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; border: 2px solid #D7FF00; ' +
        (on ? 'background: #D7FF00; color: #0F2620;' : 'background: transparent; color: #F5F7F3;');
    };
    var toSec = function (t) { var p = String(t).split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : (p[0] || 0) * 60 + (p[1] || 0); };
    function stopVideo() { var f = $('iframe', pBox); if (f) f.remove(); play.hidden = false; seekLbl.hidden = false; }
    function start(sec) {
      stopVideo();
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(cur.yid) + '?autoplay=1&rel=0&playsinline=1' + (sec ? '&start=' + sec : '');
      f.title = 'Snimak: ' + matchTitle(cur) + ', ' + whenLong(cur);
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      var hadFocus = document.activeElement === play;
      play.hidden = true; seekLbl.hidden = true;
      pBox.appendChild(f);
      if (hadFocus) $('#pl-close', box).focus();
    }
    function renderGoals() {
      var wrap = $('#pl-gwrap', box), ul = $('#pl-goals', box);
      wrap.hidden = !cur.golovi.length;
      ul.innerHTML = cur.golovi.map(function (t) {
        var on = seek === t;
        return '<li><button type="button" class="g-btn" data-goal="' + esc(t) + '" aria-pressed="' + on + '" style="' + gStyle(on) + '"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M12 7 L16 10 L14.5 15 H9.5 L8 10 Z" fill="currentColor"></path></svg>Gol ' + esc(t) + '</button></li>';
      }).join('');
      seekLbl.textContent = seek ? 'Gol na ' + seek : '60:00';
    }
    function open(m, opener) {
      cur = m; seek = null; lastFocus = opener || document.activeElement;
      $('#pl-cam', box).textContent = camOf(m.hala);
      $('#pl-title', box).textContent = halaName(m.hala);
      $('#pl-opis', box).textContent = cap(whenLong(m)) + (m.naslov ? ', ' + m.naslov : '');
      $('#pl-yt', box).href = m.link;
      play.setAttribute('aria-label', 'Pusti snimak: ' + matchTitle(m) + ', ' + whenLong(m));
      stopVideo(); renderGoals();
      box.hidden = false; lockScroll(true);
      $('#pl-close', box).focus();
    }
    function close() {
      if (box.hidden) return;
      stopVideo(); box.hidden = true; lockScroll(false);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    play.addEventListener('click', function () { start(seek ? toSec(seek) : 0); });
    $('#pl-close', box).addEventListener('click', close);
    $('#pl-goals', box).addEventListener('click', function (e) {
      var b = e.target.closest('[data-goal]'); if (!b) return;
      seek = b.getAttribute('data-goal'); renderGoals(); start(toSec(seek));
      var nb = $('[data-goal="' + cssEsc(seek) + '"]', box); if (nb) nb.focus();
    });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    box.addEventListener('keydown', function (e) { trapFocus(box, e); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) close(); });
    return { open: open };
  }
  function bindOpen(el, m) {
    if (!el || !m) return;
    el.href = m.link;
    el.onclick = function (e) {
      if (!player || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); player.open(m, el);
    };
  }

  /* ================= početna ================= */
  function initHome() {
    if (!$('.fx-hero')) return;
    loadJSON('data/hero.json').then(function (h) {
      if (!h) return;
      $$('[data-hero]').forEach(function (el) { var v = h[el.getAttribute('data-hero')]; if (v) el.textContent = v; });
      $$('[data-hero-cta]').forEach(function (a) { if (h.cta_tekst) a.textContent = h.cta_tekst; if (h.cta_link) a.href = h.cta_link; });
    });

    // traka: pauza / pokreni
    var tick = $('#tick'), tb = $('#tick-btn');
    if (tick && tb) tb.addEventListener('click', function () {
      var paused = tick.classList.toggle('paused');
      $('.ic-play', tb).hidden = !paused;
      $('.ic-pause', tb).hidden = paused;
      $('.ic-pause', tb).style.display = paused ? 'none' : 'inline-flex';
      tb.setAttribute('aria-label', paused ? 'Pokreni traku sa terminima' : 'Zaustavi traku sa terminima');
    });

    // sat u uglu koji prati skrol (00:00 na vrhu, 60:00 na dnu)
    var cw = $('#clock-wrap'), ck = $('#clock'), pending = false;
    function onScroll() {
      pending = false;
      var el = document.scrollingElement || document.documentElement;
      var max = el.scrollHeight - el.clientHeight;
      var s = Math.round((max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0) * 3600);
      ck.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
      cw.style.opacity = el.scrollTop > window.innerHeight * 0.7 ? '1' : '0';
    }
    if (cw && ck) {
      window.addEventListener('scroll', function () { if (!pending) { pending = true; requestAnimationFrame(onScroll); } }, { passive: true });
      onScroll();
    }

    loadMatches().then(function (list) {
      if (!list.length) return;
      var li = function (m, hidden) {
        return '<li><a class="tick-a" href="arhiva.html?hala=' + esc(slug(m.hala)) + '"' + (hidden ? ' tabindex="-1"' : '') + ' style="display: flex; align-items: center; gap: 10px; white-space: nowrap; padding: 0 22px; min-height: 44px; font-size: 15px; text-decoration: none; color: #F5F7F3">' +
          '<span style="width: 6px; height: 6px; border-radius: 50%; background: #D7FF00; display: block"></span>' +
          '<span class="th" style="font-family: \'Baloo 2\', sans-serif; font-weight: 600; color: #F5F7F3">' + esc(m.hala === 'Ostalo' ? 'Turnir' : m.hala) + '</span>' +
          '<span style="color: #A9BDB4">' + esc(m.d.getDate() + '. ' + MNS[m.d.getMonth()]) + '</span>' +
          (m.vreme ? '<span style="color: #A9BDB4">' + esc(m.vreme) + '</span>' : '') +
          '<span style="color: #D7FF00; font-weight: 600">na YouTube-u</span></a></li>';
      };
      var top = list.slice(0, 8);
      var t1 = $('#tick-1'), t2 = $('#tick-2');
      if (t1) t1.innerHTML = top.map(function (m) { return li(m, false); }).join('');
      if (t2) t2.innerHTML = top.map(function (m) { return li(m, true); }).join('');

      var m0 = list[0];
      var lc = $('#last-card');
      if (lc) {
        $('#last-cam').textContent = camOf(m0.hala);
        $('#last-txt').innerHTML = esc(matchTitle(m0)) + '<br>' + esc(whenLong(m0));
        lc.setAttribute('aria-label', 'Pusti poslednji snimak: ' + matchTitle(m0) + ', ' + whenLong(m0));
        bindOpen(lc, m0);
      }
      var big = $('#big');
      if (big) {
        $('#big-cam').textContent = camOf(m0.hala);
        $('#big-hala').textContent = matchTitle(m0);
        $('#big-kad').textContent = whenShort(m0);
        big.setAttribute('aria-label', 'Pusti snimak: ' + matchTitle(m0) + ', ' + whenLong(m0));
        bindOpen(big, m0);
      }
      var rec = $('#recent');
      if (rec) {
        var tf = ['translate(160 0) scale(-1 1)', 'translate(0 90) scale(1 -1)'];
        var two = list.slice(1, 3);
        rec.innerHTML = two.map(function (m, i) {
          return '<a class="frame" href="' + esc(m.link) + '" aria-label="' + esc('Pusti snimak: ' + matchTitle(m) + ', ' + whenLong(m)) + '" style="position: relative; display: block; aspect-ratio: 16 / 9; border-radius: 16px; overflow: hidden; background-color: #143B2C; background-image: repeating-linear-gradient(90deg, #174231 0 44px, #143B2C 44px 88px); border: 1px solid #24463C; text-decoration: none">' +
            '<svg viewBox="0 0 160 90" aria-hidden="true" preserveAspectRatio="xMidYMid slice" style="position: absolute; inset: 0; width: 100%; height: 100%"><g stroke="rgba(245, 247, 243, 0.4)" stroke-width="0.6" fill="none"><rect x="12" y="10" width="136" height="70" rx="2"></rect><line x1="80" y1="10" x2="80" y2="80"></line><circle cx="80" cy="45" r="10"></circle></g><g transform="' + tf[i % 2] + '"><path d="M100 36 Q 112 40 117 52" fill="none" stroke="#D7FF00" stroke-width="0.8" stroke-dasharray="2 1.6"></path><path d="M119 52 L147 46" fill="none" stroke="#D7FF00" stroke-opacity="0.55" stroke-width="0.6" stroke-dasharray="1.6 1.6"></path><g stroke="#0F2620" stroke-width="0.6"><circle cx="19" cy="45" r="2.5" fill="#F5F7F3"></circle><circle cx="55" cy="30" r="2.5" fill="#F5F7F3"></circle><circle cx="66" cy="62" r="2.5" fill="#F5F7F3"></circle><circle cx="100" cy="36" r="2.5" fill="#F5F7F3"></circle><circle cx="116" cy="56" r="2.5" fill="#F5F7F3"></circle></g><g fill="#0B1E19" stroke="#A9BDB4" stroke-width="0.7"><circle cx="141" cy="45" r="2.4"></circle><circle cx="108" cy="47" r="2.4"></circle><circle cx="94" cy="64" r="2.4"></circle><circle cx="86" cy="26" r="2.4"></circle><circle cx="122" cy="30" r="2.4"></circle></g><circle cx="119" cy="52" r="1.5" fill="#D7FF00" stroke="#0F2620" stroke-width="0.4"></circle></g></svg>' +
            '<span style="position: absolute; top: 10px; left: 10px; width: 16px; height: 16px; border-top: 2px solid #D7FF00; border-left: 2px solid #D7FF00"></span>' +
            '<span style="position: absolute; bottom: 10px; right: 10px; width: 16px; height: 16px; border-bottom: 2px solid #D7FF00; border-right: 2px solid #D7FF00"></span>' +
            '<span style="position: absolute; top: 14px; left: 34px; font-size: 12px; font-weight: 700; color: #F5F7F3"><span style="color: #D7FF00">' + esc(camOf(m.hala)) + '</span>   ' + esc(matchTitle(m)) + '</span>' +
            '<span style="position: absolute; bottom: 14px; left: 18px; font-size: 13px; font-weight: 600; color: #F5F7F3">' + esc(whenShort(m)) + '</span>' +
            '<span style="position: absolute; bottom: 12px; right: 32px; padding: 2px 7px; border-radius: 6px; background: rgba(12, 33, 27, 0.85); font-size: 12px; font-weight: 700; color: #F5F7F3">60:00</span>' +
            '<span class="play" style="position: absolute; left: 50%; top: 50%; margin: -24px 0 0 -24px; width: 48px; height: 48px; border-radius: 50%; background: #D7FF00; display: flex; align-items: center; justify-content: center; transition: transform .2s ease-out"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4 L20 12 L7 20 Z" fill="#0F2620"></path></svg></span></a>';
        }).join('');
        $$('a', rec).forEach(function (a, i) { bindOpen(a, two[i]); });
      }
    });
  }

  /* ================= arhiva ================= */
  function initArchive() {
    var chipsEl = $('#chips');
    if (!chipsEl) return;
    var right = $('#a-right'), big = $('#a-big');
    var DAYS = ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja'];
    var plS = function (n) { return (n % 10 === 1 && n % 100 !== 11) ? 'snimak' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'snimka' : 'snimaka'; };
    var plU = function (n) { return (n % 10 === 1 && n % 100 !== 11) ? 'utakmica, poređana' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'utakmice, poređane' : 'utakmica, poređanih'; };
    var btnS = "background: transparent; border: 2px solid #D7FF00; color: #D7FF00; font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 16px; padding: 9px 22px; border-radius: 999px; min-height: 44px; cursor: pointer";

    loadMatches().then(function (list) {
      var by = {};
      list.forEach(function (m) { (by[m.hala] = by[m.hala] || []).push(m); });
      var order = HALL_ORDER.filter(function (h) { return by[h] && by[h].length; });
      if (!order.length) { right.innerHTML = '<p style="color: #A9BDB4">Snimci trenutno nisu dostupni. Pogledaj naš YouTube kanal.</p>'; return; }
      var tot = $('#a-total'); if (tot) tot.textContent = list.length + ' ' + plU(list.length);

      var want = new URLSearchParams(location.search).get('hala');
      var st = { hala: order[0], fDay: 'all', fTime: 'all', limit: 6, flip: false };
      order.forEach(function (h) { if (want && slug(h) === slug(want)) st.hala = h; });

      var row = function (m) {
        return { d: cap(WD[m.d.getDay()]) + ', ' + m.d.getDate() + '. ' + MN[m.d.getMonth()] + yearSfx(m.d),
                 o: [m.vreme, m.naslov].filter(Boolean).join(', '),
                 w: String((m.d.getDay() + 6) % 7) };
      };

      function renderChips() {
        chipsEl.innerHTML = order.map(function (n) {
          var on = n === st.hala;
          return '<button type="button" class="chip" data-hala="' + esc(n) + '" aria-pressed="' + on + '" style="display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 18px; border-radius: 999px; font-family: \'Baloo 2\', sans-serif; font-weight: 600; font-size: 17px; cursor: pointer; ' +
            (on ? 'background: #D7FF00; color: #0F2620; border: 2px solid #D7FF00;' : 'background: transparent; color: #F5F7F3; border: 2px solid #4F8070;') + '">' +
            esc(n === 'Ostalo' ? 'Turniri i ostalo' : n) +
            '<span style="font-family: Manrope, sans-serif; font-size: 13px; font-weight: 700; ' + (on ? 'color: #0F2620; opacity: 0.7;' : 'color: #A9BDB4;') + '">' + by[n].length + '</span></button>';
        }).join('');
      }

      function renderBig() {
        var all = by[st.hala], p = all[0], r = row(p);
        $('#a-cam').textContent = camOf(st.hala);
        $('#a-naziv').textContent = st.hala === 'Ostalo' ? 'Turniri i ostalo' : st.hala;
        $('#a-d').textContent = r.d;
        $('#a-o').textContent = r.o;
        $('#a-gnote').hidden = !p.golovi.length;
        big.setAttribute('aria-label', 'Pusti najnoviji snimak: ' + r.d + (r.o ? ', ' + r.o : ''));
        bindOpen(big, p);
        big.classList.remove('cutA', 'cutB'); void big.offsetWidth; big.classList.add(st.flip ? 'cutB' : 'cutA');
        $('#live').textContent = 'Prikazana hala: ' + (st.hala === 'Ostalo' ? 'turniri i ostale hale' : st.hala) + ', ' + all.length + ' ' + plS(all.length);
      }

      function renderRight(focusSel) {
        var all = by[st.hala], rest = all.slice(1);
        var title = st.hala === 'Ostalo' ? 'Ranije: turniri i ostale hale' : 'Ranije u hali ' + st.hala;
        var h = '<h2 style="margin: 0 0 14px; font-family: \'Baloo 2\', sans-serif; font-weight: 700; font-size: 22px">' + esc(title) + '</h2>';
        if (!rest.length) {
          h += '<div style="border: 1px dashed #24463C; border-radius: 16px; padding: 24px"><p style="margin: 0 0 6px; font-weight: 700">U ovoj hali smo za sada snimali samo jednom.</p>' +
            '<p style="margin: 0 0 18px; color: #A9BDB4; font-size: 15px">Ako igraš u hali ' + esc(st.hala) + ', javi nam termin i sledeći snimak odavde je tvoj.</p>' +
            '<a class="btn-s" href="zakazivanje.html" style="border: 2px solid #D7FF00; color: #D7FF00; font-family: \'Baloo 2\', sans-serif; font-weight: 700; font-size: 16px; padding: 9px 22px; border-radius: 999px; text-decoration: none; min-height: 44px; box-sizing: border-box; display: inline-flex; align-items: center">Zakaži termin</a></div>';
          right.innerHTML = h; return;
        }
        var rows = rest.map(function (m) { var r = row(m); r.m = m; return r; });
        var filtered = rows.filter(function (r) { return (st.fDay === 'all' || r.w === st.fDay) && (st.fTime === 'all' || r.m.vreme === st.fTime); });
        var shown = filtered.slice(0, st.limit), left = filtered.length - shown.length;
        var dayOpts = [{ v: 'all', t: 'Svi dani' }].concat(DAYS.map(function (t, i) { return { v: String(i), t: t }; }).filter(function (o) { return rows.some(function (r) { return r.w === o.v; }); }));
        var times = rows.map(function (r) { return r.m.vreme; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort();
        var timeOpts = [{ v: 'all', t: 'Sva vremena' }].concat(times.map(function (t) { return { v: t, t: t }; }));
        var sel = function (id, label, opts, val) {
          return '<label style="display: flex; flex-direction: column; gap: 4px; font-size: 14px; font-weight: 700; color: #A9BDB4">' + label +
            '<select class="sel" id="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o.v) + '"' + (o.v === val ? ' selected' : '') + '>' + esc(o.t) + '</option>'; }).join('') + '</select></label>';
        };
        h += '<div style="display: flex; flex-wrap: wrap; gap: 10px 14px; margin-bottom: 14px">' + sel('a-day', 'Dan u nedelji', dayOpts, st.fDay) + sel('a-time', 'Vreme', timeOpts, st.fTime) + '</div>';
        h += '<p style="margin: 0 0 10px; font-size: 14px; color: #A9BDB4">Prikazano: ' + shown.length + ' od ' + filtered.length + (st.fDay === 'all' && st.fTime === 'all' ? '' : ' za ovaj izbor') + '</p>';
        if (shown.length) {
          h += '<ul style="list-style: none; margin: 0; padding: 0; border-top: 1px solid #24463C">' + shown.map(function (r, i) {
            return '<li style="border-bottom: 1px solid #24463C"><a class="row" data-i="' + i + '" href="' + esc(r.m.link) + '" style="display: flex; align-items: center; gap: 14px; padding: 14px 10px; min-height: 44px; box-sizing: border-box; color: #F5F7F3; text-decoration: none; border-radius: 10px">' +
              '<span style="flex: 1 1 auto; min-width: 0"><span class="sr-only">Pusti snimak: </span><span style="display: block; font-weight: 700">' + esc(r.d) + '</span>' +
              (r.o ? '<span style="display: block; font-size: 14px; color: #A9BDB4">' + esc(r.o) + '</span>' : '') + '</span>' +
              '<span aria-hidden="true" style="flex: 0 0 36px; width: 36px; height: 36px; border-radius: 50%; border: 2px solid #D7FF00; display: flex; align-items: center; justify-content: center"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4 L20 12 L7 20 Z" fill="#D7FF00"></path></svg></span></a></li>';
          }).join('') + '</ul>';
          if (left > 0) h += '<button type="button" class="btn-s" id="a-more" style="margin-top: 20px; ' + btnS + '">Prikaži još ' + Math.min(10, left) + ' (ostalo ' + left + ')</button>';
        } else {
          h += '<div style="border: 1px dashed #4F8070; border-radius: 16px; padding: 20px"><p style="margin: 0 0 14px; font-weight: 700">Nema snimaka za ovaj izbor.</p><button type="button" class="btn-s" id="a-reset" style="' + btnS + '">Prikaži sve termine</button></div>';
        }
        right.innerHTML = h;
        $$('a.row', right).forEach(function (a) { bindOpen(a, shown[+a.getAttribute('data-i')].m); });
        if (focusSel) { var f = $(focusSel, right); if (f) f.focus(); }
      }

      function renderAll() { renderChips(); renderBig(); renderRight(); }

      chipsEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-hala]'); if (!b) return;
        var n = b.getAttribute('data-hala'); if (n === st.hala) return;
        st = { hala: n, fDay: 'all', fTime: 'all', limit: 6, flip: !st.flip };
        try { history.replaceState(null, '', '?hala=' + slug(n)); } catch (er) {}
        renderAll();
        var nb = $('[data-hala="' + cssEsc(n) + '"]', chipsEl); if (nb) nb.focus();
      });
      right.addEventListener('change', function (e) {
        if (e.target.id === 'a-day') { st.fDay = e.target.value; st.limit = 6; renderRight('#a-day'); }
        if (e.target.id === 'a-time') { st.fTime = e.target.value; st.limit = 6; renderRight('#a-time'); }
      });
      right.addEventListener('click', function (e) {
        if (e.target.id === 'a-more') { var n = st.limit; st.limit += 10; renderRight('a.row[data-i="' + n + '"]'); }
        if (e.target.id === 'a-reset') { st.fDay = 'all'; st.fTime = 'all'; st.limit = 6; renderRight('#a-day'); }
      });
      renderAll();
    });
  }

  /* ================= usluga: koraci se crtaju redom dok skroluješ ================= */
  function initSteps() {
    var els = $$('[data-step]');
    if (!els.length) return;
    var last = 0;
    function show(el) {
      var now = Date.now(), at = Math.max(now, last + 700);
      last = at;
      setTimeout(function () { el.classList.add('go'); }, at - now);
    }
    if (!('IntersectionObserver' in window)) { els.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return +a.target.getAttribute('data-step') - +b.target.getAttribute('data-step'); })
        .forEach(function (e) { show(e.target); io.unobserve(e.target); });
    }, { threshold: 0.35 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ================= zakazivanje ================= */
  function initBooking() {
    var hallsEl = $('#halls');
    if (!hallsEl) return;
    var daysEl = $('#days'), monthEl = $('#month'), monthBtn = $('#month-btn'), weeklyBtn = $('#weekly'), bar = $('#pickbar');
    var st = { pick: null, hala: null, weekly: false, month: false, mon: 0, calDay: null };
    var hours = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'], busy = {}, halls = ['Altina', 'SC7', 'Stracatella', 'Crveno Crno'];
    var waBase = 'https://wa.me/38161324423', igDm = 'https://www.instagram.com/fieldcam_x/';
    var DAY = 24 * 3600 * 1000;
    var chipStyle = function (on) { return "display: inline-flex; align-items: center; min-height: 44px; padding: 8px 18px; border-radius: 999px; font-family: 'Baloo 2', sans-serif; font-weight: 600; font-size: 17px; cursor: pointer; " + (on ? 'background: #D7FF00; color: #0F2620; border: 2px solid #D7FF00;' : 'background: transparent; color: #F5F7F3; border: 2px solid #5E8F7F;'); };
    var today = function () { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
    var at = function (d, h) { var p = h.split(':').map(Number); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), p[0], p[1] || 0); };
    var dayBusy = function (d) { return busy[iso(d)] || []; };

    function slot(d, h) {
      var key = iso(d) + ' ' + h;
      var isB = dayBusy(d).indexOf(h) !== -1;
      var late = !isB && at(d, h).getTime() - Date.now() < DAY;
      if (isB || late) {
        return '<li><span style="width: 100%; min-height: 52px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; padding: 6px 12px; border-radius: 12px; border: 1px solid #1E3D35; color: #93AAA0"><span style="font-weight: 700; text-decoration: line-through">' + esc(h) + '</span><span style="font-size: 12px">' + (late ? 'manje od 24h' : 'zauzeto') + '</span></span></li>';
      }
      var on = !!(st.pick && st.pick.key === key);
      return '<li><button type="button" class="slot" data-slot="' + esc(key) + '" aria-pressed="' + on + '" style="width: 100%; min-height: 52px; box-sizing: border-box; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 6px 12px; border-radius: 12px; cursor: pointer; font-family: Manrope, sans-serif; font-size: 16px; text-align: left; ' +
        (on ? 'background: #D7FF00; color: #0F2620; border: 2px solid #D7FF00;' : 'background: transparent; color: #F5F7F3; border: 2px solid #5E8F7F;') + '"><span style="font-weight: 700">' + esc(h) + '</span><span style="font-size: 12px; font-weight: 600; ' + (on ? 'color: #0F2620;' : 'color: #D7FF00;') + '">' + (on ? 'izabrano' : 'slobodno') + '</span></button></li>';
    }
    var fullDay = function (d) { var b = dayBusy(d); return hours.every(function (h) { return b.indexOf(h) !== -1 || at(d, h).getTime() - Date.now() < DAY; }); };

    function renderHalls() {
      hallsEl.innerHTML = halls.concat(['Druga hala']).map(function (n) {
        var on = st.hala === n;
        return '<button type="button" class="chip" data-hall="' + esc(n) + '" aria-pressed="' + on + '" style="' + chipStyle(on) + '">' + esc(n) + '</button>';
      }).join('');
    }
    function renderDays() {
      var t = today();
      daysEl.innerHTML = [1, 2, 3].map(function (k) {
        var d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + k);
        var full = fullDay(d);
        var b0 = dayBusy(d), reallyFull = hours.every(function (h) { return b0.indexOf(h) !== -1; });
        return '<div style="flex: 1 1 280px; min-width: 0; background: #12302A; border: 1px solid #24463C; border-top: 3px solid #D7FF00; border-radius: 18px; padding: 20px">' +
          '<h3 style="margin: 0 0 2px; font-family: \'Baloo 2\', sans-serif; font-weight: 700; font-size: 22px">' + cap(WD[d.getDay()]) + '</h3>' +
          '<p style="margin: 0 0 16px; font-size: 14px; color: #A9BDB4">' + d.getDate() + '. ' + MN[d.getMonth()] + '</p>' +
          (full ? '<p style="margin: 0; padding: 16px; border: 1px dashed #4F8070; border-radius: 12px; color: #C9D6CF; font-size: 15px">' + (reallyFull ? 'Ceo dan je zauzet. Pogledaj drugi dan.' : 'Za ovaj dan je kasno, termin se zakazuje najkasnije 24 sata unapred.') + '</p>'
                : '<ul style="list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">' + hours.map(function (h) { return slot(d, h); }).join('') + '</ul>') +
          '</div>';
      }).join('');
    }
    function renderMonth() {
      monthEl.hidden = !st.month;
      monthBtn.setAttribute('aria-expanded', String(st.month));
      monthBtn.textContent = st.month ? 'Sakrij kalendar' : 'Prikaži kalendar';
      if (!st.month) { monthEl.innerHTML = ''; return; }
      var t = today(), y = t.getFullYear(), m = t.getMonth() + st.mon;
      var first = new Date(y, m, 1), yy = first.getFullYear(), mm = first.getMonth();
      var offset = (first.getDay() + 6) % 7, nDays = new Date(yy, mm + 1, 0).getDate();
      var navBtn = function (on) { return 'width: 44px; height: 44px; border-radius: 50%; border: 2px solid ' + (on ? '#5E8F7F' : '#24463C') + '; background: transparent; color: ' + (on ? '#F5F7F3' : '#5E8F7F') + '; display: inline-flex; align-items: center; justify-content: center; padding: 0; cursor: ' + (on ? 'pointer' : 'default'); };
      var cells = '';
      for (var i = 0; i < offset; i++) cells += '<span style="min-height: 44px;"></span>';
      for (var n = 1; n <= nDays; n++) {
        var d = new Date(yy, mm, n), b = dayBusy(d);
        var past = d < t, isToday = d.getTime() === t.getTime();
        var nBusy = hours.filter(function (h) { return b.indexOf(h) !== -1 || at(d, h).getTime() - Date.now() < DAY; }).length;
        var stt = nBusy === 0 ? 'f' : nBusy >= hours.length ? 'b' : 'p';
        var bookable = !past && !isToday && stt !== 'b';
        var sel = st.calDay === iso(d);
        var sr = ', ' + WD[d.getDay()] + ' ' + n + '. ' + MN[mm] + (past ? ', prošlo' : isToday ? ', danas' : stt === 'f' ? ', slobodno ceo dan' : stt === 'p' ? ', ima slobodnih termina' : (b.length >= hours.length ? ', zauzeto' : ', kasno za zakazivanje'));
        var base = 'width: 100%; min-height: 44px; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; font-size: 15px; font-family: Manrope, sans-serif; color: #F5F7F3; padding: 0; ';
        var num = 'font-weight: 700; ' + (sel ? 'color: #0F2620;' : past ? 'color: #7F978D;' : stt === 'b' ? 'color: #93AAA0; text-decoration: line-through;' : 'color: #F5F7F3;');
        if (bookable) {
          var dot = stt === 'f' ? 'width: 7px; height: 7px; border-radius: 50%; background: ' + (sel ? '#0F2620' : '#D7FF00') + '; display: block' : 'width: 8px; height: 8px; border-radius: 50%; border: 2px solid ' + (sel ? '#0F2620' : '#FFB347') + '; box-sizing: border-box; display: block';
          cells += '<button type="button" class="cal-d" data-day="' + iso(d) + '" aria-pressed="' + sel + '" style="' + base + 'cursor: pointer; background: ' + (sel ? '#D7FF00' : 'transparent') + '; border: ' + (sel ? '2px solid #D7FF00;' : '1px solid #5E8F7F;') + '"><span style="' + num + '">' + n + '</span><span style="' + dot + '"></span><span class="sr-only">' + sr + '</span></button>';
        } else {
          cells += '<span style="' + base + (isToday ? 'border: 2px solid #F5F7F3;' : 'border: 1px solid ' + (past ? 'transparent' : '#24463C') + ';') + '"><span style="' + num + '">' + n + '</span><span class="sr-only">' + sr + '</span></span>';
        }
      }
      var calHtml = '';
      if (st.calDay) {
        var cd = parseDay(st.calDay);
        var ct = 'Slobodni termini, ' + WD[cd.getDay()] + ' ' + cd.getDate() + '. ' + MN[cd.getMonth()];
        calHtml = '<div style="margin-top: 20px; padding-top: 18px; border-top: 1px solid #24463C"><h4 style="margin: 0 0 12px; font-family: \'Baloo 2\', sans-serif; font-weight: 700; font-size: 19px">' + ct + '</h4>' +
          '<ul aria-label="' + ct + '" style="list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px">' + hours.map(function (h) { return slot(cd, h); }).join('') + '</ul></div>';
      }
      monthEl.innerHTML = '<div class="pop cal-box" style="margin-top: 20px; background: #12302A; border: 1px solid #24463C; border-radius: 18px; padding: 24px; max-width: 680px">' +
        '<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px">' +
        '<button type="button" class="hov" id="m-prev" aria-label="Prethodni mesec"' + (st.mon > 0 ? '' : ' aria-disabled="true"') + ' style="' + navBtn(st.mon > 0) + '"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 L8 12 L15 19"></path></svg></button>' +
        '<h3 aria-live="polite" style="margin: 0; font-family: \'Baloo 2\', sans-serif; font-weight: 700; font-size: 22px">' + cap(MN[mm]) + ' ' + yy + '</h3>' +
        '<button type="button" class="hov" id="m-next" aria-label="Sledeći mesec"' + (st.mon < 1 ? '' : ' aria-disabled="true"') + ' style="' + navBtn(st.mon < 1) + '"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5 L16 12 L9 19"></path></svg></button></div>' +
        '<p style="margin: 0 0 14px; font-size: 15px; color: #A9BDB4">Klikni na dan da vidiš slobodne termine.</p>' +
        '<ul aria-label="Legenda" style="list-style: none; margin: 0 0 16px; padding: 0; display: flex; flex-wrap: wrap; gap: 8px 22px; font-size: 14px; color: #A9BDB4">' +
        '<li style="display: flex; align-items: center; gap: 8px"><span style="width: 10px; height: 10px; border-radius: 50%; background: #D7FF00; display: block"></span>Slobodno ceo dan</li>' +
        '<li style="display: flex; align-items: center; gap: 8px"><span style="width: 10px; height: 10px; border-radius: 50%; border: 2px solid #FFB347; box-sizing: border-box; display: block"></span>Delimično: ima slobodnih termina</li>' +
        '<li style="display: flex; align-items: center; gap: 8px"><span style="text-decoration: line-through; font-weight: 700">17</span>Zauzeto</li></ul>' +
        '<div class="cal-grid" style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; text-align: center">' +
        ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'].map(function (w) { return '<span aria-hidden="true" style="font-size: 12px; font-weight: 700; color: #A9BDB4; padding-bottom: 4px">' + w + '</span>'; }).join('') +
        cells + '</div>' + calHtml + '</div>';
    }
    function message() {
      var p = st.pick, h = st.hala;
      if (!p || !h) return '';
      var ht = h === 'Druga hala' ? 'druga hala (upiši koja)' : h;
      return 'Zdravo! Želimo snimanje termina: ' + ht + ', ' + p.dan + ' ' + p.datum + ' u ' + p.vreme + (st.weekly ? ', jednom nedeljno u isto vreme' : '') + '.';
    }
    function renderBar() {
      var p = st.pick;
      bar.classList.toggle('stick', !!p);
      if (!p) { bar.innerHTML = '<p style="margin: 0; color: #A9BDB4; font-size: 15px">Izaberi halu i slobodan termin, a poruku ćemo sastaviti umesto tebe.</p>'; return; }
      var msg = message(), h = st.hala, ht = h === 'Druga hala' ? 'druga hala (upiši koja)' : h;
      var short = (h ? ht + ', ' : '') + p.dan + ' ' + p.datum + ' u ' + p.vreme;
      var reset = function (t) { return '<button type="button" data-clear style="min-height: 44px; padding: 8px 12px; border: none; background: transparent; color: #C9D6CF; font-family: Manrope, sans-serif; font-size: 15px; font-weight: 600; text-decoration: underline; cursor: pointer">' + t + '</button>'; };
      var html = '<div class="pop pick-in" style="padding: 22px 24px; border-radius: 18px; border: 2px solid #D7FF00; background: #16362F">' +
        '<h2 class="pick-prev" style="margin: 0 0 10px; font-family: \'Baloo 2\', sans-serif; font-weight: 700; font-size: 22px">3. Pošalji poruku</h2>' +
        '<p class="pick-prev" style="margin: 0 0 6px; font-size: 14px; color: #A9BDB4">Poruku smo sastavili umesto tebe:</p>' +
        (msg ? '<p class="pick-prev" style="margin: 0 0 18px; padding: 14px 16px; border-radius: 12px; background: #0F2620; border: 1px solid #24463C; font-size: 17px; line-height: 1.5">' + esc(msg) + '</p>' : '') +
        '<p class="pick-short" style="margin: 0 0 10px; font-weight: 700">' + esc(short) + '</p>';
      if (!h) {
        html += '<p style="margin: 0 0 12px; padding: 12px 14px; border-radius: 12px; border: 1px dashed #FFB347; color: #FFB347; font-weight: 600">Prvo izaberi halu. <a href="#korak-1" style="color: #FFB347">Idi na korak 1</a></p>' + reset('Poništi izbor termina');
      } else {
        html += '<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center">' +
          '<a class="btn-p" id="ig-send" href="' + esc(igDm) + '" target="_blank" rel="noopener" style="background: #D7FF00; color: #0F2620; border: 2px solid #D7FF00; font-family: \'Baloo 2\', sans-serif; font-weight: 700; font-size: 17px; padding: 11px 24px; border-radius: 999px; min-height: 48px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; cursor: pointer">Kopiraj poruku i otvori Instagram</a>' +
          '<a class="btn-s" id="wa-send" href="' + esc(waBase + '?text=' + encodeURIComponent(msg)) + '" target="_blank" rel="noopener" style="border: 2px solid #D7FF00; color: #D7FF00; background: transparent; font-family: \'Baloo 2\', sans-serif; font-weight: 700; font-size: 16px; padding: 9px 22px; border-radius: 999px; min-height: 44px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; cursor: pointer">WhatsApp</a>' +
          reset('Poništi') + '</div>';
      }
      bar.innerHTML = html + '</div>';
    }
    function renderAll(focusSel, scope) {
      var y = window.scrollY;
      renderHalls(); renderDays(); renderMonth(); renderBar();
      if (focusSel) { var f = $(focusSel, scope || document); if (f) { f.focus({ preventScroll: true }); } }
      if (Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
    }
    function pickSlot(key, from) {
      var p = key.split(' '), d = parseDay(p[0]);
      st.pick = { key: key, dan: WD[d.getDay()], datum: d.getDate() + '. ' + MN[d.getMonth()], vreme: p[1] };
      var inMonth = from && monthEl.contains(from);
      renderAll('[data-slot="' + cssEsc(key) + '"]', inMonth ? monthEl : daysEl);
      var live = $('#pick-live');
      if (live) live.textContent = 'Izabrano: ' + st.pick.dan + ' ' + st.pick.datum + ' u ' + st.pick.vreme + (st.hala ? ', ' + st.hala : '. Izaberi i halu.');
    }

    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-hall],[data-slot],[data-day],#m-prev,#m-next,[data-clear],#ig-send');
      if (!t) return;
      if (t.hasAttribute('data-hall')) { st.hala = t.getAttribute('data-hall'); renderAll('[data-hall="' + cssEsc(st.hala) + '"]'); }
      else if (t.hasAttribute('data-slot')) pickSlot(t.getAttribute('data-slot'), t);
      else if (t.hasAttribute('data-day')) { var dk = t.getAttribute('data-day'); st.calDay = st.calDay === dk ? null : dk; renderAll('[data-day="' + dk + '"]'); }
      else if (t.id === 'm-prev') { if (st.mon > 0) { st.mon--; st.calDay = null; renderAll('#m-prev'); } }
      else if (t.id === 'm-next') { if (st.mon < 1) { st.mon++; st.calDay = null; renderAll('#m-next'); } }
      else if (t.hasAttribute('data-clear')) { st.pick = null; renderAll(); var k1 = $('#days'); if (k1) k1.scrollIntoView({ block: 'nearest' }); }
      else if (t.id === 'ig-send') {
        var msg = message();
        var fallback = function () {
          var ta = document.createElement('textarea');
          ta.value = msg; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          var ok = false; try { ok = document.execCommand('copy'); } catch (er) {}
          ta.remove(); return ok;
        };
        var done = function (ok) {
          if (ok) { t.textContent = 'Kopirano, otvaram Instagram'; return; }
          bar.classList.add('show-msg');
          t.textContent = 'Kopiranje nije uspelo, prepiši poruku iznad';
          t.focus();
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(msg).then(function () { done(true); }, function () { done(fallback()); });
        } else done(fallback());
      }
    });
    weeklyBtn.addEventListener('click', function () {
      st.weekly = !st.weekly;
      weeklyBtn.setAttribute('aria-pressed', String(st.weekly));
      var b = $('#weekly-box');
      b.textContent = st.weekly ? '✓' : '';
      b.style.background = st.weekly ? '#D7FF00' : 'transparent';
      b.style.color = st.weekly ? '#0F2620' : '';
      b.style.borderColor = st.weekly ? '#D7FF00' : '#5E8F7F';
      renderBar();
    });
    monthBtn.addEventListener('click', function () { st.month = !st.month; renderMonth(); });

    renderAll();
    Promise.all([loadJSON('data/kalendar.json'), loadJSON('data/venues.json'), loadJSON('data/cta-links.json'), loadJSON('data/contact.json')]).then(function (r) {
      var k = r[0] || {};
      if (k.sati && k.sati.length) {
        hours = k.sati.map(normTime).filter(Boolean).filter(function (h, i, a) { return a.indexOf(h) === i; }).sort();
        var st0 = $('#sati-txt');
        if (st0 && hours.length) st0.textContent = 'od ' + (+hours[0].slice(0, 2)) + ' do ' + (+hours[hours.length - 1].slice(0, 2)) + 'h';
      }
      busy = {};
      (k.dani || []).forEach(function (d) { if (d && d.datum) busy[String(d.datum).slice(0, 10)] = (d.zauzeti || []).map(normTime); });
      var vs = ((r[1] && r[1].stavke) || []).filter(function (x) { return x && x.naziv; });
      if (vs.length) {
        halls = vs.map(function (x) { return x.naziv; });
        var hl = $('#hale-list');
        if (hl) hl.innerHTML = vs.map(function (x) {
          return '<li style="padding: 12px 0; border-bottom: 1px solid #24463C; display: flex; align-items: center; gap: 12px"><span style="flex: 0 0 auto; width: 8px; height: 8px; border-radius: 50%; background: #D7FF00; display: block"></span><span>' + esc(x.naziv) +
            (x.adresa ? '<span style="display: block; font-size: 14px; color: #A9BDB4">' + esc(x.adresa) + '</span>' : '') + '</span></li>';
        }).join('');
      }
      var intl = phoneIntl(r[3] && r[3].telefon);
      if (intl) waBase = 'https://wa.me/' + intl;
      if (r[2] && r[2].instagram_dm) igDm = r[2].instagram_dm;
      renderAll();
    });
  }

  /* ================= start ================= */
  function init() {
    initMenu();
    initContacts();
    player = initPlayer();
    initHome();
    initArchive();
    initSteps();
    initBooking();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
