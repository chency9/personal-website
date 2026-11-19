import { initPortfolio } from './portfolio';
import { initMotionControls, settleHoseControls } from './motion-controls';

type LabId = 'map' | 'planet' | 'game';
type HoseTabs = HTMLElement & { selected: number };
type HoseToast = HTMLElement & { show: (message: string, brief?: string) => void; hide: () => void };

export function initHoseControls() {
  initMotionControls();
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

  const settlePausedControls = settleHoseControls;
  initPortfolio(settlePausedControls);

  const labIds: LabId[] = ['map', 'planet', 'game'];
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
