/* FieldCamX — hero animacija "pogled iz kamere".
   heroVals(T, pv) vraća sve vrednosti za trenutak T (ms) animacije.
   pv = true kada je telefon uspravno (teren se okreće vertikalno).
   T >= 99999 znači krajnje, mirno stanje (isto što se vidi bez JavaScript-a). */
(function (root) {
  function cl(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }
  function eo(p) { return 1 - Math.pow(1 - p, 3); }
  function ei(p) { return p * p * p; }
  function eio(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function pad(n) { return String(n).padStart(2, '0'); }

  function heroVals(T, pv) {
    var ph = function (a, d) { return cl((T - a) / d); };
    var dash = function (a, d) { return (1 - eio(ph(a, d))).toFixed(4); };
    var f = function (v) { return v.toFixed(1); };

    var zs = 1 + 44 * ei(ph(800, 900));
    var ir = eo(ph(1700, 700));
    var cy = pv ? '43%' : '37%';
    var camX = pv ? '50%' : '68%';
    var settle = eo(ph(1700, 1100));

    var p1 = eio(ph(4300, 500));
    var sh = eo(ph(5000, 350));
    var q = function (a, c, b, t) { var u = 1 - t; return u * u * a + 2 * u * t * c + t * t * b; };
    var ballX = q(574, 690, 777, p1), ballY = q(296, 205, 176, p1);
    if (T >= 5000) { ballX = q(777, 880, 950, sh); ballY = q(176, 190, 230, sh); }
    var kick = 2400, goalAt = 5350, minute;
    if (T < goalAt) minute = 3550 * eio(ph(kick, goalAt - kick));
    else minute = 3550 + 50 * ph(goalAt, 1000);
    if (T >= 99999) minute = 3600;
    minute = Math.round(minute);
    var bm = eio(ph(4200, 600)), dm = eio(ph(4300, 600)), gm = eio(ph(5120, 280));
    var pg = ph(5350, 750), ps = ph(5350, 350);
    var amp = T >= 5350 ? 5 * (1 - ps) : 0;

    return {
      c1: dash(0, 600), c2: dash(150, 500), c3: dash(300, 450),
      camZoom: 'translate(180 122) scale(' + zs.toFixed(3) + ') translate(-180 -122)',
      camOp: (1 - ph(1500, 200)).toFixed(3),
      dark: ph(1300, 350).toFixed(3),
      iris: 'circle(' + (ir * 100).toFixed(2) + '% at ' + camX + ' ' + cy + ')',
      camX: camX,
      ringTop: cy, ring1: f(ir * 150) + 'vmax', ring2: f(ir * 128) + 'vmax',
      ringOp: (T >= 1700 && ir < 1 ? 1 - ir : 0).toFixed(3),
      camera: (pv ? 'rotate(-90deg) ' : '') + 'rotate(' + (-8 * (1 - settle)).toFixed(2) + 'deg) scale(' + (0.82 + 0.18 * settle).toFixed(3) + ')',
      l1: dash(2000, 450), l2: dash(2100, 420), l3: dash(2250, 900), l4: dash(2650, 500), l5: dash(2900, 320),
      goalOp: ph(3000, 300).toFixed(3),
      turf: (0.95 * eio(ph(3300, 1000))).toFixed(3),
      paint: (0.07 * eio(ph(3600, 800))).toFixed(3),
      plOp: eio(ph(3700, 350)).toFixed(3),
      bX: f(lerp(735, 765, bm)), bY: f(lerp(190, 170, bm)),
      dX: f(lerp(690, 705, dm)), dY: f(lerp(250, 222, dm)),
      gkX: f(lerp(912, 916, gm)), gkY: f(lerp(235, 264, gm)),
      ballX: f(ballX), ballY: f(ballY), shX: f(ballX + 3), shY: f(ballY + 6),
      camFill: ph(300, 400).toFixed(3),
      t1: (1 - p1).toFixed(4), t2: (1 - sh).toFixed(4),
      trailOp: (1 - 0.55 * ph(5900, 500)).toFixed(3),
      arrow: ph(5300, 150).toFixed(3),
      tc: pad(Math.floor(minute / 60)) + ':' + pad(minute % 60),
      prog: (minute / 36).toFixed(2) + '%',
      gm: ph(goalAt, 250).toFixed(3),
      gf: (T >= 5350 && T < 99999 ? 0.85 * Math.sin(Math.PI * ph(5350, 700)) : 0).toFixed(3),
      waveR: f(10 + 160 * eo(pg)),
      waveOp: (T >= 5350 && pg < 1 ? 1 - pg : 0).toFixed(3),
      shake: 'translate(' + f(amp * Math.sin(T / 18)) + 'px,' + f(amp * Math.cos(T / 23)) + 'px)',
      hud: ph(2400, 300).toFixed(3)
    };
  }

  root.FCX_heroVals = heroVals;
  if (typeof module !== 'undefined' && module.exports) module.exports = heroVals;

  if (typeof document === 'undefined') return;

  /* ---------- pokretanje u pregledaču ---------- */
  function start() {
    var hero = document.querySelector('.fx-hero');
    if (!hero) return;
    var nodes = Array.prototype.slice.call(hero.querySelectorAll('[data-tpl]')).map(function (el) {
      return { el: el, attrs: el.getAttribute('data-tpl').split('|').map(function (a) {
        return { name: a, tpl: el.getAttribute('data-t-' + a) };
      }) };
    });
    var txt = Array.prototype.slice.call(hero.querySelectorAll('[data-txt]'));
    var mq = null, pv = false;
    try { mq = window.matchMedia('(max-width: 760px) and (orientation: portrait)'); pv = mq.matches; } catch (e) {}

    var revealed = false;
    function apply(T) {
      var v = heroVals(T, pv);
      var fill = function (tpl) { return tpl.replace(/\{\{(\w+)\}\}/g, function (m, k) { return v[k]; }); };
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        for (var j = 0; j < n.attrs.length; j++) n.el.setAttribute(n.attrs[j].name, fill(n.attrs[j].tpl));
      }
      for (var k = 0; k < txt.length; k++) txt[k].textContent = v[txt[k].getAttribute('data-txt')];
      if (!revealed) { revealed = true; document.documentElement.classList.remove('fx-intro'); }
    }

    var raf = null, t0 = null, running = false;
    function frame(now) {
      if (t0 === null) t0 = now;
      var T = now - t0;
      if (T < 6400) { apply(T); raf = requestAnimationFrame(frame); }
      else { raf = null; running = false; apply(99999); }
    }
    function play() {
      if (raf) cancelAnimationFrame(raf);
      t0 = null; running = true;
      apply(0);
      raf = requestAnimationFrame(frame);
    }

    if (mq) {
      var onMq = function () { pv = mq.matches; if (!running) apply(99999); };
      if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
    }
    var replay = document.getElementById('replay');
    if (replay) replay.addEventListener('click', play);

    var reduce = false, seen = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    try { seen = window.sessionStorage.getItem('fcx-intro') === '1'; window.sessionStorage.setItem('fcx-intro', '1'); } catch (e) {}
    if (reduce || seen) { apply(99999); return; }
    play();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(typeof window !== 'undefined' ? window : globalThis);
