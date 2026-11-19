/* Hose Page Kit, part two: the film, and the lines the characters say.
 *
 *   <script src="assets/hose-page.js"></script>
 *
 * Two jobs, both belonging to the page and not to the controls:
 *
 * 1. THE FILM. Grain, dust, the odd scratch, a flicker and a gate that does not hold quite still, laid over the whole
 *    page. It is created for you: no markup needed. It follows the components' clock when there is one, so it stops
 *    when they are paused and when the reader asked for reduced motion. This portfolio adaptation uses an independent
 *    clock for offscreen controls, connects its pause button, and limits exposure changes to 2 Hz.
 *    Turn it off with <body data-film="off"> or
 *    with ?nofilm in the URL.
 *
 * 2. THE LINES. A character has something to say about what just happened ("Checked. He did it himself and he is very
 *    proud."). Point an element at a control and the line is typed into it:
 *
 *      <hose-checkbox id="remember">Remember me</hose-checkbox>
 *      <p class="hose-said" data-say="#remember"></p>
 *
 *    The typed text is hidden from a screen reader and mirrored into a live region, so it does not chatter letter by
 *    letter. Without this file the line is still there, in el.line and in the hose:line event.
 */
(() => {
  const reduce = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  // ---- 1. the film ------------------------------------------------------------------------------------------
  const film = () => {
    if (document.body?.dataset.film === 'off') return;
    if (new URLSearchParams(location.search).has('nofilm')) return;
    if (document.querySelector('.hose-film')) return;   // already on the page

    const holder = document.createElement('div');
    holder.className = 'hose-film';
    holder.setAttribute('aria-hidden', 'true');
    holder.innerHTML = '<div class="grain"></div><canvas class="dust"></canvas><div class="vig"></div><div class="flick"></div>';
    document.body.append(holder);

    const grain = holder.querySelector('.grain'), dust = holder.querySelector('.dust'),
      flick = holder.querySelector('.flick'), dg = dust.getContext('2d'), reel = document.querySelector('.hose-reel');

    // one tile of noise, jumped to a new place twelve times a second; drawing it every frame would be wasteful
    const tile = document.createElement('canvas');
    tile.width = tile.height = 220;
    const tx = tile.getContext('2d'), img = tx.createImageData(220, 220), a = img.data;
    for (let i = 0; i < a.length; i += 4) { const v = 196 + Math.random() * 59; a[i] = v; a[i + 1] = v * 0.98; a[i + 2] = v * 0.94; a[i + 3] = 255; }
    tx.putImageData(img, 0, 0);
    grain.style.background = `url(${tile.toDataURL('image/png')})`;

    const size = () => { dust.width = innerWidth; dust.height = innerHeight; };
    size();
    addEventListener('resize', size);

    let scratch = null, last = -1;
    const still = () => {
      dg.clearRect(0, 0, dust.width, dust.height);
      if (reel) reel.style.transform = '';
      flick.style.opacity = 0;
    };
    const draw = (t) => {
      const k = Math.floor(t * 12);
      if (k === last) return;
      last = k;
      grain.style.backgroundPosition = `${Math.floor(hash(k * 1.7) * 220)}px ${Math.floor(hash(k * 2.9) * 220)}px`;
      // the gate weave: the whole reel moves by a fraction of a pixel, which the eye reads as "projected"
      if (reel) reel.style.transform = `translate(${((hash(k * 4.1) - 0.5) * 1.1).toFixed(2)}px, ${((hash(k * 6.3) - 0.5) * 1.5).toFixed(2)}px)`;
      // Keep the source's exposure range, but limit changes to twice per second.
      const exposureFrame = Math.floor(t * 2);
      flick.style.opacity = (hash(exposureFrame * 8.7) < 0.2 ? 0.035 + hash(exposureFrame * 3.3) * 0.05 : 0).toFixed(3);
      const W = dust.width, H = dust.height;
      dg.clearRect(0, 0, W, H);
      if (!scratch && hash(k * 5.9) < 0.05) scratch = { x: hash(k * 7.7) * W, life: 3 + Math.floor(hash(k) * 8), dark: hash(k * 2.2) < 0.6 };
      if (scratch) {   // a scratch runs the height of the frame and wanders for a few drawings
        scratch.x += (hash(k * 9.9) - 0.5) * 5;
        dg.strokeStyle = scratch.dark ? 'rgba(60,40,25,.38)' : 'rgba(255,250,235,.5)';
        dg.lineWidth = 1;
        dg.beginPath(); dg.moveTo(scratch.x, 0); dg.lineTo(scratch.x + (hash(k * 1.3) - 0.5) * 6, H); dg.stroke();
        if (--scratch.life <= 0) scratch = null;
      }
      const n = hash(k * 3.9) < 0.45 ? 1 + Math.floor(hash(k * 6.1) * 3) : 0;   // specks and the odd hair, each for one drawing
      dg.fillStyle = 'rgba(50,34,20,.55)';
      dg.strokeStyle = 'rgba(50,34,20,.5)';
      dg.lineWidth = 1.2;
      for (let i = 0; i < n; i++) {
        const px = hash(k * 2.3 + i * 7.1) * W, py = hash(k * 5.1 + i * 3.3) * H, r = 0.8 + hash(k + i * 9.7) * 2.2;
        if (hash(k * 1.1 + i) < 0.25) { dg.beginPath(); dg.moveTo(px, py); dg.quadraticCurveTo(px + 14 * (hash(i + k) - 0.5), py + 9, px + 18 * (hash(i * 2 + k) - 0.5), py + 22); dg.stroke(); }
        else { dg.beginPath(); dg.ellipse(px, py, r, r * (0.6 + hash(i * 4 + k) * 0.8), hash(i + k * 2) * 3, 0, 7); dg.fill(); }
      }
    };

    // The portfolio's only character control lives below the fold. Its core clock
    // stops when offscreen, so the page film needs its own visible-time clock.
    let filmTime = 0, previous = null;
    const loop = (ms = performance.now()) => {
      requestAnimationFrame(loop);
      const dt = previous === null ? 0 : Math.min(0.05, Math.max(0, (ms - previous) / 1000));
      previous = ms;
      // Connect the reference film to this site's visible motion control.
      if (reduce() || document.documentElement.classList.contains('motion-paused') || document.hidden) { still(); return; }
      filmTime += dt;
      draw(filmTime);
    };
    loop();
  };

  // ---- 2. the lines -----------------------------------------------------------------------------------------
  const say = () => {
    for (const out of document.querySelectorAll('[data-say]')) {
      const el = document.querySelector(out.dataset.say);
      if (!el) continue;
      const live = document.createElement('span');
      live.className = 'hose-sr';
      live.setAttribute('aria-live', 'polite');
      out.append(live);
      const typed = document.createElement('span');
      typed.setAttribute('aria-hidden', 'true');
      out.append(typed);
      let timer = 0;
      const type = (s) => {
        clearInterval(timer);
        live.textContent = s;
        typed.textContent = '';
        if (reduce()) { typed.textContent = s; return; }
        let i = 0;
        timer = setInterval(() => { typed.textContent = s.slice(0, ++i); if (i >= s.length) clearInterval(timer); }, 16);
      };
      el.addEventListener('hose:line', (e) => type(e.detail.text));
      if (el.line) type(el.line);
    }
  };

  const boot = () => { film(); say(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
