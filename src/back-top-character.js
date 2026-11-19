// Site-specific Rubber Hose button; painted layers/core are stamped by the builder.
function backTopComponent(fx) {
  const { FPS, INK, clamp, lerp, ease, ring, beat, art, place, reach, hand, leg, ticks, write } = fx;
  const CX = 85, BW = 92, FLOOR = 165;

  class HoseBackTop extends fx.Base {
    static delegates = true;
    static observedAttributes = ['label'];
    static css = '.hit{inset:20px 10px 0;border-radius:24px}.hit:focus-visible{outline-color:var(--hose-focus,#a92e1e)}';
    size() { return [170, 190]; }
    render() { return `<button class="hit" type="button" part="button" aria-label="${fx.esc(this.getAttribute('label') || '返回顶部')}"></button>`; }
    attributeChangedCallback() { this.$('button')?.setAttribute('aria-label', this.getAttribute('label') || '返回顶部'); }
    refresh() { if (this.frame) this.frame(fx.now, 0); }
    appear() { this.arrived = fx.now; this.refresh(); }

    setup() {
      const button = this.$('button'), g = this.g;
      const A = { rest: art('backtop-box-0'), happy: art('backtop-box-1') };
      let hover = false, held = false, hoverAt = -99, clickedAt = -99;
      this.arrived = -99;
      const quiet = () => fx.calm || document.documentElement.classList.contains('motion-paused');
      const setHover = next => { hover = next; hoverAt = fx.now; this.refresh(); };
      button.addEventListener('pointerenter', () => setHover(true));
      button.addEventListener('pointerleave', () => { held = false; setHover(false); });
      button.addEventListener('focus', () => setHover(true));
      button.addEventListener('blur', () => { held = false; setHover(false); });
      button.addEventListener('pointerdown', () => { held = true; this.refresh(); });
      button.addEventListener('pointerup', () => { held = false; this.refresh(); });
      button.addEventListener('pointercancel', () => { held = false; this.refresh(); });
      button.addEventListener('click', () => {
        clickedAt = fx.now;
        this.say('出发，回到顶部！');
        this.refresh();
      });

      this.frame = t => {
        const calm = quiet(), k = (t - clickedAt) * FPS;
        const entry = calm ? 0 : ring((t - this.arrived) * FPS, 14);
        const bob = calm ? 0 : beat(t, .32);
        const press = calm ? 0 : held ? .7 : k >= 0 && k < 3 ? 1 - k / 3 : 0;
        const jump = !calm && k >= 3 && k < 15 ? Math.sin((k - 3) / 12 * Math.PI) * 20 : 0;
        const land = calm ? 0 : ring(k - 15, 10);
        // The same feet anchor the volume-preserving squash and the return landing.
        const sy = 1 + .018 * bob - .13 * press - .06 * land + .055 * entry;
        const sx = 1 / sy;
        const foot = FLOOR - jump, bottom = foot - 27;
        const cy = bottom - BW * sy / 2;
        const hoverProgress = calm ? 1 : ease.out(clamp((t - hoverAt) / .22));
        const raised = hover ? hoverProgress : 1 - hoverProgress;
        const lx = CX - BW / 2 + 3, ly = cy + 32;
        const rx = lerp(CX + BW / 2 - 3, CX + BW / 2 + 12, raised);
        const ry = lerp(cy + 32, cy - 26 - bob * 2, raised);

        g.begin();
        // Shoulder roots and leg roots sit inside the painted body's silhouette.
        leg(g, CX - 20, bottom - 14, CX - 28, foot, -5, { dir: -1, w: 34 });
        leg(g, CX + 20, bottom - 14, CX + 28, foot, 5, { dir: 1, w: 34 });
        const leftAngle = reach(g, CX - BW / 2 + 16, cy - 8, lx, ly, 27, { w: 25, turn: -1.3 });
        const rightAngle = reach(g, CX + BW / 2 - 16, cy - 8, rx, ry, lerp(-27, 14, raised), { w: 25, turn: lerp(1.3, 0, raised) });
        place(g, hover || k < 20 ? A.happy : A.rest, CX, bottom, BW, { ay: 1, sx, sy });

        // The red arrow occupies the blank lower half; the face stays readable.
        g.save();
        g.translate(CX, cy + 16 - raised * 2);
        g.scale(sx, sy);
        g.beginPath();
        g.moveTo(0, -2); g.lineTo(13, 10); g.lineTo(5, 10);
        g.lineTo(5, 19); g.lineTo(-5, 19); g.lineTo(-5, 10);
        g.lineTo(-13, 10); g.closePath();
        g.fillStyle = '#a92e1e'; g.strokeStyle = INK; g.lineWidth = 1.6;
        g.fill(); g.stroke();
        g.restore();
        // Cuffs remain in front of the body, thumbs face inwards.
        hand(g, 'knuckle', lx, ly, leftAngle, 25, 1);
        hand(g, raised > .5 ? 'fist' : 'knuckle', rx, ry, rightAngle, 25, -1);

        if (!calm && k >= 0 && k < 18) {
          const size = k < 3 ? 1 + .2 * ring(k, 5) : k > 13 ? Math.max(0, (18 - k) / 5) : 1;
          g.save(); g.translate(CX - 4, 16); g.scale(size, size);
          write(g, 'UP!', 0, 0, 22, { rot: -.09, col: '#a92e1e' });
          g.restore();
          if (k >= 3 && k < 9) ticks(g, CX, FLOOR + 1, 5, 21, 32 + k, Math.PI, Math.PI * 2, 1.8, Math.floor(k / 2));
        }
      };
      this.say('点一下，带你回到顶部。');
      this.refresh();
    }
  }
  fx.define('hose-back-top', HoseBackTop);
}
