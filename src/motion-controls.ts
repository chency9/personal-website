type HoseToggle = HTMLElement & { checked: boolean; disabled: boolean };
type HoseWindow = Window & { RubberHose?: { paused: boolean; advance: (dt: number) => void } };

let initialized = false;
let userPaused = false;
let motionQuery: MediaQueryList;
const storageKey = 'chency-motion-paused';
const bound = new WeakSet<HTMLElement>();
const observed = new WeakSet<Element>();
let visibility: IntersectionObserver;
const controlSelector = 'hose-toggle,hose-tabs,hose-progress,hose-toast,hose-button,hose-input,hose-radio,hose-slider,hose-checkbox,hose-rating';

export function motionControlMarkup(id: string, className = '') {
  return `<div class="motion-control ${className}"><div><strong>让灵感动起来</strong><span id="${id}-state" data-motion-state>动画已开启</span></div><hose-toggle id="${id}" data-motion-toggle label="页面动画与抖动" aria-describedby="${id}-state" name="motion" checked></hose-toggle></div>`;
}

/** A paused shared clock still needs a settled drawing when a value changes. */
export function settleHoseControls() {
  const fx = (window as HoseWindow).RubberHose;
  if (document.documentElement.classList.contains('motion-paused') && fx?.paused) {
    fx.advance(2);
    fx.advance(2);
  }
}

export function syncMotionControls() {
  if (!initialized) return;
  const paused = motionQuery.matches || userPaused;
  document.querySelectorAll<HoseToggle>('[data-motion-toggle]').forEach(toggle => {
    if (!bound.has(toggle)) {
      bound.add(toggle);
      toggle.addEventListener('change', () => {
        userPaused = !toggle.checked;
        try { localStorage.setItem(storageKey, String(userPaused)); } catch { /* This visit still works. */ }
        applyMotion();
      });
    }
    toggle.checked = !paused;
    toggle.disabled = motionQuery.matches;
  });
  const text = motionQuery.matches ? '跟随系统：减少动态' : paused ? '已关闭动画与抖动' : '动画已开启 · 可关闭抖动';
  document.querySelectorAll<HTMLElement>('[data-motion-state]').forEach(state => {
    if (state.textContent !== text) state.textContent = text;
  });
  document.querySelectorAll(controlSelector).forEach(element => {
    if (!observed.has(element)) { observed.add(element); visibility.observe(element); }
  });
  requestAnimationFrame(settleHoseControls);
}

function applyMotion() {
  const paused = motionQuery.matches || userPaused;
  document.documentElement.classList.toggle('motion-paused', paused);
  const fx = (window as HoseWindow).RubberHose;
  if (fx) fx.paused = paused && !motionQuery.matches;
  syncMotionControls();
  settleHoseControls();
  window.dispatchEvent(new Event('motionchange'));
}

export function initMotionControls() {
  if (initialized) return;
  initialized = true;
  motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  try { userPaused = localStorage.getItem(storageKey) === 'true'; } catch { /* Optional preference. */ }
  visibility = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) requestAnimationFrame(settleHoseControls);
  });
  document.documentElement.classList.toggle('motion-paused', motionQuery.matches || userPaused);
  motionQuery.addEventListener('change', applyMotion);
  const documentReady = document.readyState === 'loading'
    ? new Promise<void>(resolve => document.addEventListener('DOMContentLoaded', () => resolve(), { once: true }))
    : Promise.resolve();
  void Promise.all([documentReady, customElements.whenDefined('hose-toggle')]).then(() => {
    applyMotion();
    const additions = new MutationObserver(records => {
      let added = false;
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element && (node.matches(controlSelector) || node.querySelector(controlSelector))) added = true;
        }
        for (const node of record.removedNodes) {
          if (!(node instanceof Element) || node.isConnected) continue;
          const removed = [...node.querySelectorAll(controlSelector)];
          if (node.matches(controlSelector)) removed.push(node);
          removed.forEach(element => { visibility.unobserve(element); observed.delete(element); });
        }
      }
      if (added) syncMotionControls();
    });
    additions.observe(document.body, { childList: true, subtree: true });
  });
  window.addEventListener('load', settleHoseControls, { once: true });
}
