/** A small, locally positioned bubble; native popovers provide dismissal and focus order. */
export function initCatPopover(actor: HTMLButtonElement, panel: HTMLElement) {
  const nativePopover = 'popover' in HTMLElement.prototype;
  let open = false;

  function position() {
    if (!open) return;
    const target = actor.getBoundingClientRect();
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const center = target.left + target.width * .58;
    // Bias the bubble into the space left of the portrait, with the thought dots
    // near its lower-right edge. On stacked layouts, use the space above the art.
    const stage = actor.closest('.portrait-stage')?.getBoundingClientRect();
    const preferredRight = stage ? stage.left + stage.width * .28 : target.left + target.width;
    const left = Math.max(12, Math.min(preferredRight - width, viewportWidth - width - 12));
    const aboveCat = target.top - height - 64;
    const above = viewportWidth <= 560 && stage ? Math.min(aboveCat, stage.top - height - 12) : aboveCat;
    const below = above < 12 && target.bottom + height + 28 < viewportHeight - 12;
    const top = Math.max(12, Math.min(below ? target.bottom + 28 : above, viewportHeight - height - 12));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.setProperty('--cat-bubble-tip', `${Math.max(24, Math.min(width - 26, center - left))}px`);
    panel.dataset.side = below ? 'below' : 'above';
  }

  function sync(next: boolean) {
    open = next;
    actor.setAttribute('aria-expanded', String(open));
    panel.dataset.open = String(open);
    panel.inert = !open;
    actor.closest('.cat-scene')?.classList.toggle('cat-bubble-open', open);
  }

  function close() {
    if (!open) return;
    const restoreFocus = panel.contains(document.activeElement);
    if (nativePopover) panel.hidePopover();
    else sync(false);
    if (restoreFocus) actor.focus({ preventScroll: true });
  }

  if (nativePopover) {
    actor.setAttribute('popovertarget', panel.id);
    panel.addEventListener('beforetoggle', event => {
      const next = (event as ToggleEvent).newState === 'open';
      sync(next);
      if (next) {
        // Measure before first paint, including any wrapped status text. Restoring display
        // lets the native top-layer entry transition run from @starting-style.
        panel.style.display = 'block';
        position();
        panel.style.removeProperty('display');
      }
    });
  } else {
    // Keep file:// support and dismissal on older browsers without downloading a polyfill.
    document.body.append(panel);
    actor.addEventListener('click', () => {
      if (open) { close(); return; }
      sync(true);
      position();
      panel.querySelector<HTMLButtonElement>('[data-cat-action]')?.focus({ preventScroll: true });
    });
  }

  function onOutside(event: PointerEvent) {
    if (!nativePopover && open && !panel.contains(event.target as Node) && !actor.contains(event.target as Node)) close();
  }
  function onKey(event: KeyboardEvent) {
    if (!nativePopover && open && event.key === 'Escape') { event.preventDefault(); close(); }
  }
  function onScroll() {
    if (!open) return;
    const target = actor.getBoundingClientRect();
    if (target.bottom < 0 || target.top > window.innerHeight) close();
    else position();
  }
  panel.querySelector<HTMLButtonElement>('.cat-bubble-close')!.addEventListener('click', close);
  const resize = new ResizeObserver(position);
  resize.observe(panel);
  window.addEventListener('resize', position);
  document.addEventListener('scroll', onScroll, { passive: true, capture: true });
  document.addEventListener('pointerdown', onOutside);
  document.addEventListener('keydown', onKey);
  return {
    close,
    dispose() {
      resize.disconnect();
      window.removeEventListener('resize', position);
      document.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('keydown', onKey);
    },
  };
}
