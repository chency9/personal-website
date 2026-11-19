import brandSvg from './assets/chency-logo.svg?raw';
import { initMusicNotes, musicNotesMarkup } from './music-notes';

interface PlaybackState { playing: boolean; audible: boolean; waiting: boolean; preparing: boolean; phase: number }

/** The CY mark belongs to the homepage; articles use a text-only music trigger. */
export function initMusicLogo(panel: HTMLElement) {
  const button = document.createElement('button');
  button.id = 'music-logo';
  button.className = 'music-logo';
  button.type = 'button';
  button.setAttribute('data-music-trigger', '');
  button.setAttribute('aria-controls', panel.id);
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = `<span class="music-logo-art" aria-hidden="true">${brandSvg}</span><span class="music-logo-melody" aria-hidden="true">${musicNotesMarkup}</span>`;
  document.body.insertBefore(button, document.getElementById('app'));
  const nativePopover = 'popover' in HTMLElement.prototype;
  const anchors = CSS.supports('position-area', 'block-end') && CSS.supports('position-try-fallbacks', 'flip-block');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  let open = false;
  let playing = false;
  let floating = false;
  let slot: HTMLElement | undefined;
  let header: HTMLElement | null = null;
  let frame = 0;
  let flight: Animation | undefined;
  let targetKey = '';
  let closing: Animation | undefined;
  let closeRevision = 0;
  let activeTrigger: HTMLButtonElement = button;

  function stillMotion() {
    return reducedMotion.matches || document.documentElement.classList.contains('motion-paused');
  }

  const notes = initMusicNotes(button, () => !button.hidden && !stillMotion());

  function visible(target: HTMLElement) {
    const disclosure = target.closest('details:not([open])');
    const hiddenByDisclosure = disclosure && !disclosure.querySelector(':scope > summary')?.contains(target);
    return target.isConnected && !hiddenByDisclosure && !target.closest('[hidden],[inert]') && target.getClientRects().length > 0;
  }

  function syncTriggers() {
    document.querySelectorAll<HTMLButtonElement>('button[data-music-trigger]').forEach(trigger => {
      trigger.setAttribute('aria-controls', panel.id);
      trigger.setAttribute('aria-expanded', String(open));
      if (nativePopover) trigger.setAttribute('popovertarget', panel.id);
    });
  }

  function anchorTo(trigger: HTMLButtonElement) {
    document.querySelectorAll('[data-music-anchor]').forEach(previous => previous.removeAttribute('data-music-anchor'));
    activeTrigger = trigger;
    trigger.setAttribute('data-music-anchor', 'true');
  }

  function positionPanel() {
    if (!open) return;
    if (!visible(activeTrigger)) { close(); return; }
    const rect = activeTrigger.getBoundingClientRect();
    if (!anchors) {
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const left = Math.max(12, Math.min(rect.left, document.documentElement.clientWidth - width - 12));
      const below = rect.bottom + height + 12 <= window.innerHeight - 12;
      panel.style.left = `${left}px`;
      panel.style.top = `${Math.max(12, Math.min(below ? rect.bottom + 12 : rect.top - height - 12, window.innerHeight - height - 12))}px`;
    }
    const bounds = panel.getBoundingClientRect();
    panel.dataset.side = bounds.top >= rect.bottom - 1 ? 'below' : 'above';
    panel.style.setProperty('--music-tip', `${Math.max(18, Math.min(bounds.width - 18, rect.left + rect.width / 2 - bounds.left))}px`);
  }

  function syncOpen(next: boolean) {
    closeRevision++;
    closing?.cancel();
    closing = undefined;
    delete panel.dataset.closing;
    open = next;
    panel.dataset.open = String(next);
    panel.inert = !next;
    syncTriggers();
    if (next) {
      panel.style.display = 'block';
      positionPanel();
      panel.style.removeProperty('display');
      requestAnimationFrame(positionPanel);
    }
    panel.dispatchEvent(new CustomEvent('musicpanelchange', { detail: { open: next } }));
  }

  function close(restoreFocus = true, animate = false) {
    if (!open || (closing && animate)) return;
    closing?.cancel();
    closing = undefined;
    const current = ++closeRevision;
    const hadFocus = panel.contains(document.activeElement);
    const finish = () => {
      if (current !== closeRevision) return;
      if (nativePopover) panel.hidePopover();
      else syncOpen(false);
      delete panel.dataset.closing;
      if (restoreFocus && (hadFocus || (!visible(activeTrigger) && document.activeElement === document.body))) {
        // A collapsed reading-settings disclosure can hide the article trigger.
        // Its summary remains a valid place to return keyboard focus.
        const summary = activeTrigger.closest('details')?.querySelector<HTMLElement>('summary');
        const target = visible(activeTrigger) ? activeTrigger : summary && visible(summary) ? summary : null;
        target?.focus({ preventScroll: true });
      }
    };
    // Older engines cannot keep a popover in the top layer during a discrete exit.
    if (animate && nativePopover && !CSS.supports('overlay', 'auto') && !stillMotion()) {
      panel.dataset.closing = 'true';
      closing = panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 });
      void closing.finished.then(finish).catch(() => {});
    } else finish();
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(layout);
  }

  const resize = new ResizeObserver(schedule);
  const intersection = new IntersectionObserver(schedule, { threshold: [0, 1] });

  function layout() {
    frame = 0;
    syncTriggers();
    const reading = location.hash.startsWith('#notes/') || !!document.querySelector('#article-view:not([hidden])');
    const nextSlot = reading ? undefined : Array.from(document.querySelectorAll<HTMLElement>('#home-view .music-logo-slot')).find(item => item.getClientRects().length > 0);
    if (!nextSlot) {
      if (!button.hidden || !visible(activeTrigger)) close(false);
      flight?.cancel();
      flight = undefined;
      floating = false;
      targetKey = '';
      button.dataset.floating = 'false';
      button.hidden = true;
      button.inert = true;
      button.removeAttribute('data-music-anchor');
      if (document.activeElement === button) button.blur();
      notes.refresh();
      positionPanel();
      return;
    }
    if (button.hidden) {
      close(false);
      button.hidden = false;
      button.inert = false;
      notes.refresh();
    }
    const changedSlot = nextSlot !== slot;
    if (changedSlot) {
      if (slot) resize.unobserve(slot);
      if (header) intersection.unobserve(header);
      slot = nextSlot;
      header = slot?.closest<HTMLElement>('header') ?? null;
      if (slot) resize.observe(slot);
      if (header) intersection.observe(header);
      close(false);
    }
    const rect = slot?.getBoundingClientRect();
    const returned = rect && rect.top >= 8 && rect.bottom <= window.innerHeight;
    const nextFloating = !rect || (floating ? !returned : playing && !!header && header.getBoundingClientRect().bottom <= 0);
    const changedMode = nextFloating !== floating;
    const key = nextFloating ? `floating:${window.innerWidth <= 580}` : `${rect!.left.toFixed(2)}:${rect!.top.toFixed(2)}:${rect!.width}:${rect!.height}`;
    if (key === targetKey && !changedMode && !changedSlot) { positionPanel(); return; }
    const hadTarget = !!targetKey;
    const before = button.getBoundingClientRect();
    const inFlight = flight?.playState === 'running';
    flight?.cancel();
    flight = undefined;
    if (changedMode) close();
    floating = nextFloating;
    targetKey = key;
    button.dataset.floating = String(floating);
    if (floating) {
      for (const property of ['left', 'top', 'width', 'height']) button.style.removeProperty(property);
    } else {
      button.style.left = `${rect!.left}px`;
      button.style.top = `${rect!.top}px`;
      button.style.width = `${rect!.width}px`;
      button.style.height = `${rect!.height}px`;
    }
    const after = button.getBoundingClientRect();
    if (before.width && hadTarget && (changedMode || changedSlot || inFlight) && !stillMotion()) {
      const fromTop = Math.max(-after.height, Math.min(window.innerHeight, before.top));
      flight = button.animate([
        { transform: `translate(${before.left - after.left}px, ${fromTop - after.top}px) scale(${before.width / after.width}, ${before.height / after.height})` },
        { transform: 'none' },
      ], { duration: 440, easing: 'cubic-bezier(.22,1,.36,1)' });
      flight.finished.then(positionPanel).catch(() => {});
    }
    positionPanel();
  }

  if (nativePopover) {
    panel.addEventListener('beforetoggle', event => syncOpen((event as ToggleEvent).newState === 'open'), { signal: events.signal });
  } else {
    panel.removeAttribute('popover');
    document.addEventListener('pointerdown', event => {
      if (open && !panel.contains(event.target as Node) && !(event.target instanceof Element && event.target.closest('button[data-music-trigger]'))) close();
    }, { signal: events.signal });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && open) { event.preventDefault(); close(); }
    }, { signal: events.signal });
  }
  document.addEventListener('click', event => {
    const trigger = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-music-trigger]') : null;
    if (!trigger || trigger.disabled || !visible(trigger)) return;
    event.preventDefault();
    if (open && activeTrigger === trigger) { close(); return; }
    if (open) close(false);
    anchorTo(trigger);
    if (nativePopover) panel.showPopover();
    else {
      syncOpen(true);
      panel.querySelector<HTMLButtonElement>('.music-toggle')?.focus({ preventScroll: true });
    }
  }, { signal: events.signal });
  panel.querySelector<HTMLButtonElement>('.music-close')!.addEventListener('click', () => close(true, true), { signal: events.signal });
  document.addEventListener('toggle', event => {
    if (open && event.target instanceof HTMLDetailsElement && !event.target.open && event.target.contains(activeTrigger)) close();
  }, { capture: true, signal: events.signal });
  const panelResize = new ResizeObserver(positionPanel);
  panelResize.observe(panel);
  const routeObserver = new MutationObserver(() => {
    if (document.querySelector('dialog[open]')) close(false);
    schedule();
  });
  routeObserver.observe(document.getElementById('app')!, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'inert', 'open'] });
  const motionObserver = new MutationObserver(() => {
    if (stillMotion()) { flight?.cancel(); flight = undefined; closing?.finish(); }
    notes.refresh();
  });
  motionObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  reducedMotion.addEventListener('change', () => {
    if (stillMotion()) { flight?.cancel(); flight = undefined; closing?.finish(); }
    notes.refresh();
  }, { signal: events.signal });
  window.addEventListener('motionchange', () => {
    if (stillMotion()) { flight?.cancel(); flight = undefined; closing?.finish(); }
    notes.refresh();
  }, { signal: events.signal });
  window.addEventListener('scroll', schedule, { passive: true, signal: events.signal });
  window.addEventListener('resize', schedule, { passive: true, signal: events.signal });
  window.addEventListener('hashchange', () => { close(false); schedule(); }, { signal: events.signal });
  layout();

  return {
    connectAnalyser(analyser: AnalyserNode, audioTime: () => number) { notes.connect(analyser, audioTime); },
    setPlayback(state: PlaybackState) {
      const wasPlaying = playing;
      playing = state.playing;
      button.dataset.playing = String(playing);
      button.dataset.audible = String(state.audible);
      button.dataset.waiting = String(state.waiting);
      button.setAttribute('aria-label', `chency，${state.waiting ? '轻点开启音乐' : state.preparing ? '音乐准备中' : playing ? state.audible ? '音乐播放中' : '音乐已静音' : '音乐已暂停'}，打开音乐控制`);
      button.title = `chency · ${playing ? '音乐播放中' : '点击开启音乐控制'}`;
      notes.setAudible(state.audible);
      if (playing && !wasPlaying) button.style.setProperty('--music-phase', `${-state.phase}s`);
      if (playing !== wasPlaying) schedule();
    },
    dispose() {
      events.abort();
      cancelAnimationFrame(frame);
      flight?.cancel();
      closing?.cancel();
      resize.disconnect();
      intersection.disconnect();
      panelResize.disconnect();
      routeObserver.disconnect();
      motionObserver.disconnect();
      notes.dispose();
    },
  };
}
