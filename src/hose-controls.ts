import { initPlayground } from './playground';
import { initPortfolio } from './portfolio';

type LabId = 'map' | 'planet' | 'game';
type HoseToggle = HTMLElement & { checked: boolean; disabled: boolean };
type HoseTabs = HTMLElement & { selected: number };
type HoseToast = HTMLElement & { show: (message: string, brief?: string) => void; hide: () => void };
type HoseWindow = Window & { RubberHose?: { paused: boolean; advance: (dt: number) => void } };

export function initHoseControls() {
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = motionQuery.matches;
  const toggle = document.querySelector<HoseToggle>('#motion-switch')!;
  const tabs = document.querySelector<HoseTabs>('#lab-tabs')!;
  const toast = document.querySelector<HoseToast>('#hello-toast')!;
  const dismiss = document.querySelector<HTMLButtonElement>('.toast-dismiss')!;
  const visited = new Set<LabId>();
  // The inline offline build defines elements before DOMContentLoaded; their
  // connected callbacks wait for that event before populating values/options.
  const documentReady = document.readyState === 'loading'
    ? new Promise<void>(resolve => document.addEventListener('DOMContentLoaded', () => resolve(), { once: true }))
    : Promise.resolve();
  const ready = Promise.all([documentReady, ...['toggle', 'tabs', 'progress', 'toast', 'button', 'input', 'radio', 'slider', 'checkbox', 'rating'].map(name => customElements.whenDefined(`hose-${name}`))]);

  // A paused clock still needs one settled drawing after an explicit interaction.
  function settlePausedControls() {
    const fx = (window as HoseWindow).RubberHose;
    if (motionPaused && fx?.paused) { fx.advance(2); fx.advance(2); }
  }
  initPortfolio(settlePausedControls);
  function updateMotion() {
    document.documentElement.classList.toggle('motion-paused', motionPaused);
    toggle.checked = !motionPaused;
    toggle.disabled = motionQuery.matches;
    document.querySelector('#motion-state')!.textContent = motionQuery.matches ? '跟随系统：减少动态' : motionPaused ? '已静止，灵感继续' : '动画已开启';
    const fx = (window as HoseWindow).RubberHose;
    if (fx) fx.paused = motionPaused && !motionQuery.matches;
    settlePausedControls();
  }
  toggle.addEventListener('change', () => { motionPaused = !toggle.checked; updateMotion(); });
  motionQuery.addEventListener('change', () => { motionPaused = motionQuery.matches; updateMotion(); });
  // Apply CSS immediately; defer property assignments until the hosts are upgraded.
  document.documentElement.classList.toggle('motion-paused', motionPaused);
  void ready.then(() => {
    updateMotion();
    // The core stops rendering offscreen characters. Redraw newly visible ones when paused.
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) requestAnimationFrame(settlePausedControls);
    });
    document.querySelectorAll('hose-toggle,hose-tabs,hose-progress,hose-toast,hose-button,hose-input,hose-radio,hose-slider,hose-checkbox,hose-rating').forEach(el => observer.observe(el));
    initPlayground(settlePausedControls, selectLab);
  });
  window.addEventListener('load', settlePausedControls, { once: true });

  const labIds: LabId[] = ['map', 'planet', 'game'];
  function selectLab(value: LabId) {
    if (!labIds.includes(value)) return;
    tabs.selected = labIds.indexOf(value);
    updatePanel(value);
  }
  function updatePanel(value: LabId) {
    document.querySelectorAll<HTMLElement>('[data-project]').forEach(card => {
      card.hidden = card.dataset.project !== value;
    });
    settlePausedControls();
  }
  tabs.addEventListener('change', event => {
    const { value } = (event as CustomEvent<{ value: LabId }>).detail;
    if (labIds.includes(value)) updatePanel(value);
  });

  function markLabExplored(id: LabId) {
    if (visited.has(id)) return;
    visited.add(id);
    document.querySelector('#explore-count')!.textContent = String(visited.size);
    document.querySelector('#explore-status')!.textContent = visited.size === 3 ? '全部打卡 ✓' : '';
    const card = document.querySelector<HTMLElement>(`[data-project="${id}"]`)!;
    card.dataset.explored = 'true';
    card.querySelector('.project-meta span:last-child')!.textContent = '再玩一次 ↗';
  }

  const greetings = [
    ['Hey，收到你的招呼啦！今天也要开心写代码。', 'HEY!'],
    ['灵感 +1！愿你的代码一次跑通。', 'IDEA!'],
    ['世界这么大，很高兴在这个小角落遇见你。', 'HI, PAL!'],
    ['咖啡已续上，下一个有趣的世界见！', 'CHEERS!'],
  ];
  let helloCount = 0;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  function hideToast() {
    clearTimeout(toastTimer);
    toast.hide();
    // Preserve keyboard focus when the dismiss control leaves the page.
    if (document.activeElement === dismiss) document.querySelector<HTMLElement>('#hello-button')!.focus();
    dismiss.hidden = true;
    settlePausedControls();
  }
  document.querySelector('#hello-button')!.addEventListener('click', () => {
    const [message, brief] = greetings[helloCount++ % greetings.length];
    document.querySelector('#hello-response')!.textContent = message;
    void ready.then(() => {
      clearTimeout(toastTimer);
      toast.show(message, brief);
      dismiss.hidden = false;
      settlePausedControls();
      toastTimer = setTimeout(hideToast, 5500);
    });
  });
  dismiss.addEventListener('click', hideToast);
  toast.addEventListener('click', hideToast);
  return { markLabExplored };
}
