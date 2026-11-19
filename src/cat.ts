import './cat.css';
import { initCatPopover } from './cat-popover';

const icon = (paths: string) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const bowlIcon = icon('<path d="M3 12h18l-3 8H6Z"/><path d="M6 8h.01M11 6h.01M16 8h.01" stroke-width="3"/>');
const petIcon = icon('<path d="M7 13V7a2 2 0 0 1 4 0v4-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v8c0 5-3 7-7 7-3 0-5-2-7-5l-2-3c-1-2 1-4 3-2l3 3"/>');
const ballIcon = icon('<circle cx="12" cy="11" r="8"/><path d="M7 5c7 1 10 5 11 10M5 10c5 0 9 4 10 8M11 3c0 7-2 10-6 12M16 18c4 5 7 2 5 0"/>');
const moonIcon = icon('<path d="M18 15A8 8 0 0 1 9 4a8.5 8.5 0 1 0 9 11Z"/><path d="M18 3v4m-2-2h4"/>');
const pawIcon = icon('<ellipse cx="12" cy="15.5" rx="5" ry="3.8"/><ellipse cx="5.5" cy="9" rx="1.7" ry="2.4" transform="rotate(-22 5.5 9)"/><ellipse cx="10" cy="6" rx="1.7" ry="2.4"/><ellipse cx="15" cy="6.5" rx="1.7" ry="2.4"/><ellipse cx="19" cy="10" rx="1.7" ry="2.4" transform="rotate(22 19 10)"/>');

/** The cat shares the portrait's 570 × 590 stage; controls remain native HTML. */
export const catScene = `
<div class="cat-scene" data-state="idle" data-phase="idle">
  <svg class="cat-props" viewBox="0 0 570 590" aria-hidden="true" focusable="false">
    <ellipse cx="78" cy="538" rx="66" ry="9" fill="#251d16" opacity=".12" class="cat-shadow"/>
    <g class="cat-bowl" stroke="#251d16" stroke-width="2.6" stroke-linejoin="round">
      <ellipse cx="202" cy="554" rx="37" ry="5" fill="#251d16" opacity=".12" stroke="none"/>
      <path d="m169 535 8 19h50l8-19Z" fill="#a92e1e"/>
      <ellipse cx="202" cy="535" rx="33" ry="8" fill="#fbe7c0"/>
      <ellipse cx="202" cy="535" rx="25" ry="4.5" fill="#5b432e" stroke="none"/>
      <g class="cat-kibble" fill="#c98c43" stroke="#5b432e" stroke-width="1.2">
        <path d="m182 531 5-4 5 5-5 4Zm10-2 5-5 6 5-6 5Zm11 2 5-5 6 6-6 3Zm10-1 4-4 5 5-5 4Z"/>
        <circle cx="193" cy="534" r="3"/><circle cx="207" cy="534" r="3"/>
      </g>
      <path d="M197 546q5-6 10 0l-5 4Z" fill="#fbe7c0" stroke="none"/>
    </g>
    <g class="cat-food-bag" stroke="#251d16" stroke-width="2.5" stroke-linejoin="round">
      <path d="m198 433 41-3 5 57-43 3Z" fill="#728f7b"/>
      <path d="m198 433 41-3 1 9-41 3Z" fill="#fbe7c0"/>
      <path d="m212 455 3-6 5 5 7-1 4 5-3 9-14 1-5-7Z" fill="#fbe7c0"/>
      <path d="M216 461h.1m8-1h.1" stroke-width="3"/>
      <path d="m212 479 20-1"/>
    </g>
    <g class="cat-falling-food" fill="#c98c43" stroke="#5b432e" stroke-width="1.3">
      ${Array.from({ length: 6 }, (_, i) => `<path data-crumb="${i}" d="m-3 0 3-3 3 3-3 3Z"/>`).join('')}
    </g>
    <g class="cat-yarn" stroke="#251d16" stroke-width="2.2" stroke-linecap="round" fill="none">
      <path d="M0 12c26 17 35-10 48-1" stroke="#617e70"/>
      <circle r="15" fill="#8ca89a"/>
      <path d="M-9-11C5-9 12 0 12 9M-14-3C-3-3 5 5 5 14M0-15C2-3-4 7-11 10M8-12C10-3 3 9-2 14" stroke="#fbe7c0" stroke-width="1.7"/>
    </g>
  </svg>
  <button class="cat-actor" type="button" aria-label="和小猫年糕互动" aria-describedby="cat-hint" aria-expanded="false" aria-controls="cat-care-panel">
    <svg viewBox="0 0 180 170" aria-hidden="true" focusable="false">
      <g class="cat-facing">
        <g class="cat-tail" stroke="#251d16" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M53 134C19 143 8 114 17 92c5-12 19-12 21-3 3 9-8 14-7 24 0 12 13 11 22 9" fill="#dca35f"/>
          <path d="m16 104 13 3m-10 14 13-4" fill="none" stroke="#a96938" stroke-width="5"/>
        </g>
        <g class="cat-body" stroke="#251d16" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M43 139c-3-21 5-45 29-48 25-4 49 15 51 40l-1 19c-23 10-65 7-79-11Z" fill="#dca35f"/>
          <path d="M88 100c-11 16-10 40 9 49l19-1 5-20-12-27Z" fill="#fbe7c0" stroke="none"/>
          <path d="m52 108 12 8m-18 4 13 8m2-31 10 9" stroke="#a96938" stroke-width="5"/>
          <g class="cat-back-paw"><path d="M75 143c-10-12-25-7-24 6-12 0-13 11-3 11h31c6-1 7-9 1-11" fill="#dca35f"/><path d="m52 154 1 5m7-5 1 5" stroke-width="1.7"/></g>
          <g class="cat-far-paw"><path d="m114 115 8 33c10 0 14 11 3 12h-14c-7-1-7-6-7-12l-3-26" fill="#dca35f"/></g>
          <g class="cat-front-paw"><path d="m94 117 3 32c-11 0-13 11-2 12h15c7-1 7-8 6-13l-4-31" fill="#fbe7c0"/><path d="m100 155 1 5m6-5 1 5" stroke-width="1.7"/></g>
        </g>
        <g class="cat-head" stroke="#251d16" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <g class="cat-left-ear"><path d="M77 68 72 29c-1-7 5-6 10-1l23 23Z" fill="#dca35f"/><path d="m79 39 4 24 13-10Z" fill="#d5917a" stroke="none"/></g>
          <g class="cat-right-ear"><path d="m117 50 23-23c5-5 9-3 8 4l-5 37Z" fill="#dca35f"/><path d="m141 38-15 16 13 8Z" fill="#d5917a" stroke="none"/></g>
          <path d="M78 57c15-14 46-16 61-2 13 12 18 33 8 47-12 16-53 18-68 3-12-12-13-33-1-48Z" fill="#e9b77a"/>
          <path d="M93 85c8-8 15-3 21 1 10-8 26-5 29 5 6 21-45 27-53 10-3-6-2-11 3-16Z" fill="#fff1d5" stroke="none"/>
          <path d="m101 48 4 11m7-14 1 12m10-10-3 11M76 77l8 3m-8 8 7 1m58-14-7 4m10 7-8 3" stroke="#a96938" stroke-width="4"/>
          <g class="cat-open-eyes" fill="#251d16" stroke="none">
            <g class="cat-pupils"><ellipse cx="97" cy="78" rx="5.7" ry="8"/><ellipse cx="129" cy="76" rx="5.7" ry="8"/><circle cx="99" cy="75" r="1.6" fill="#fff1d5"/><circle cx="131" cy="73" r="1.6" fill="#fff1d5"/></g>
          </g>
          <g class="cat-happy-eyes" fill="none"><path d="M89 79q8-10 16 0m16-2q8-10 16 0"/></g>
          <path d="m109 89 10-1-4 6Z" fill="#a92e1e" stroke-width="1.6"/>
          <path d="m115 94 0 4m-8-1q4 7 8 1 5 5 9-1" fill="none" stroke-width="1.7"/>
          <path class="cat-tongue" d="M116 101c10-3 10 8 4 9-5 1-5-4-4-9Z" fill="#d5917a" stroke-width="1.5"/>
          <ellipse class="cat-yawn" cx="115" cy="100" rx="7" ry="10" fill="#5b432e" stroke-width="2"/>
          <g class="cat-whiskers" fill="none" stroke-width="1.7"><path d="m86 94-21-5m20 11-22 3m78-12 20-7m-20 13 23 2"/></g>
          <path d="M85 109c14 9 34 10 48 1l-3 8c-13 7-30 7-43-2Z" fill="#a92e1e" stroke-width="2"/>
          <circle cx="112" cy="121" r="5" fill="#e8b753" stroke-width="1.8"/><path d="M112 122v3" stroke-width="1.4"/>
        </g>
        <g class="cat-hearts" fill="#a92e1e" stroke="none">
          <path d="M80 22C60 10 73 0 80 9c7-9 20 1 0 13Z"/>
          <path d="M149 46c-15-9-6-17 0-10 6-7 15 1 0 10Z"/>
        </g>
        <g class="cat-sleep-marks" fill="none" stroke="#5b432e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M133 48h10l-10 12h10m5-37h14l-14 16h14"/></g>
      </g>
    </svg>
  </button>
  <span class="cat-whisper" aria-hidden="true">点我玩</span>
  <span id="cat-hint" class="cat-sr">点击小猫打开互动气泡，可以喂猫粮、摸摸头、逗猫或让它打盹。</span>
</div>`;

// Broad, uneven curves give the thought bubble a hand-drawn outline.
const thoughtBubbleOutline = 'M45.7 61.9C42.1 43 58.7 26.6 82.7 26.3Q92 27 97.1 21.1C113.1 7.4 146.2 9 164.1 19.6Q170 24 178.3 19C201.6 7.8 233.3 11.8 248.2 26.2Q253 32 263 29.5C290 25.1 317.9 37.4 323.1 57.2Q324 65 330.7 68C347 77.5 351.7 98.6 344.3 115.8Q341 122 345.5 129.2C355.3 149.2 347 174.3 330.6 184.1Q324 187 324.5 196.3C323 220 300.9 235.9 277.7 237.2Q269 237 262.7 243.9C244.5 260.9 215.2 265.5 194.4 256.9Q187 253 178.5 257.7C155 268.2 125.1 263.7 109.2 251.8Q104 247 94.6 248.6C69.5 250.9 44.4 237.3 39.7 219Q39 212 31.5 209.4C13 200.3 6.9 175.4 15.9 156.7Q20 150 15.1 143.6C3.9 125.7 8.8 101.4 24.6 91.1Q31 88 30.4 85.6C29.4 79.2 34.1 73.2 44 70Q48 69 45.7 61.9Z';

export const catControls = `
<div class="cat-panel" id="cat-care-panel" popover="auto" data-open="false" inert role="group" aria-label="年糕的互动气泡">
<svg class="cat-bubble-outline" viewBox="0 0 360 280" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <defs>
    <path id="cat-bubble-contour" d="${thoughtBubbleOutline}"/>
    <mask id="cat-bubble-paper-mask" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1" mask-type="alpha">
      <use href="#cat-bubble-contour" transform="scale(.0027777778 .0035714286)" fill="white"/>
    </mask>
  </defs>
  <use class="cat-bubble-shadow" href="#cat-bubble-contour" transform="translate(1 3)"/>
  <use class="cat-bubble-line" href="#cat-bubble-contour"/>
</svg>
<span class="cat-thought-dots" aria-hidden="true"></span>
<div class="cat-care">
  <span class="cat-bubble-spark" aria-hidden="true">✧</span>
  <div class="cat-intro"><strong>${pawIcon}年糕的小心思</strong><button class="cat-bubble-close" type="button" aria-label="关闭小猫互动">×</button></div>
  <div class="cat-actions">
    <button type="button" data-cat-action="feed">${bowlIcon}<span>喂猫粮</span></button>
    <button type="button" data-cat-action="pet">${petIcon}<span>摸摸头</span></button>
    <button type="button" data-cat-action="play">${ballIcon}<span>逗猫玩</span></button>
    <button type="button" data-cat-action="sleep">${moonIcon}<span class="cat-sleep-label">打个盹</span></button>
  </div>
  <div class="cat-bubble-footer"><span>陪我玩嘛</span><span aria-hidden="true">·</span><span class="cat-meals">已投喂 <b id="cat-meals">0</b> 次</span></div>
  <p id="cat-status" role="status" aria-atomic="true">选一个小心意，年糕等着你。</p>
</div>
</div>`;

type Action = 'idle' | 'feed' | 'pet' | 'play' | 'sleep';
const durations: Record<Action, number> = { idle: 0, feed: 6200, pet: 2900, play: 5100, sleep: 0 };
const curlDuration = 850;
const ease = (v: number) => (v = Math.max(0, Math.min(1, v)), v * v * (3 - 2 * v));
const between = (t: number, a: number, b: number) => ease((t - a) / (b - a));

export function initCat() {
  const scene = document.querySelector<HTMLElement>('.cat-scene')!;
  const care = document.querySelector<HTMLElement>('.cat-care')!;
  const panel = document.querySelector<HTMLElement>('#cat-care-panel')!;
  const actor = scene.querySelector<HTMLButtonElement>('.cat-actor')!;
  const bubble = initCatPopover(actor, panel);
  const status = care.querySelector<HTMLElement>('#cat-status')!;
  const meals = care.querySelector<HTMLElement>('#cat-meals')!;
  const sleepLabel = care.querySelector<HTMLElement>('.cat-sleep-label')!;
  const whisper = scene.querySelector<HTMLElement>('.cat-whisper')!;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const parts = Object.fromEntries([
    'shadow', 'bowl', 'kibble', 'food-bag', 'falling-food', 'yarn', 'facing', 'tail', 'body',
    'back-paw', 'far-paw', 'front-paw', 'head', 'left-ear', 'right-ear', 'open-eyes',
    'happy-eyes', 'pupils', 'tongue', 'yawn', 'hearts', 'sleep-marks',
  ].map(name => [name, scene.querySelector<SVGElement>(`.cat-${name}`)!]));
  const crumbs = [...scene.querySelectorAll<SVGElement>('[data-crumb]')];
  let action: Action = 'idle';
  let elapsed = 0;
  let clock = 0;
  let lastFrame: number | undefined;
  let frameId: number | undefined;
  let inView = false;
  let mealCount = 0;
  let hasEaten = false;
  let restingHappy = false;
  let lookX = 0;
  let lookY = 0;
  let disposed = false;

  // Pausing page decoration must not swallow a deliberately requested interaction.
  // Only the short action runs; idle gestures and sleeping breaths stay paused.
  const isActing = () => action !== 'idle' && (action !== 'sleep' || elapsed < curlDuration);
  const isStill = () => motion.matches || (document.documentElement.classList.contains('motion-paused') && !isActing());
  const transform = (name: string, value: string) => parts[name].setAttribute('transform', value);
  const opacity = (name: string, value: number) => parts[name].setAttribute('opacity', String(Math.max(0, Math.min(1, value))));
  const say = (message: string, sound: string) => { status.textContent = message; whisper.textContent = sound; };
  function creditMeal() {
    if (hasEaten) return;
    hasEaten = true;
    meals.textContent = String(++mealCount);
  }
  function finishAction() {
    if (action === 'feed') {
      creditMeal();
      say('碗舔干净啦，谢谢你的猫粮！', '好吃！');
    } else if (action === 'pet') say('呼噜呼噜，已经把你认作自己人。', '呼噜～');
    else if (action === 'play') say('抓到啦！再来一次，我还能追。', '抓到啦');
    restingHappy = true;
    action = 'idle';
    elapsed = 0;
    scene.dataset.state = action;
    care.querySelectorAll('button').forEach(button => button.removeAttribute('data-active'));
  }
  function startAction(next: Action) {
    if (next === action && next !== 'sleep' && next !== 'idle') return;
    if (next === 'sleep' && action === 'sleep') next = 'idle';
    action = next;
    elapsed = next === 'sleep' && motion.matches ? curlDuration : 0;
    lastFrame = undefined;
    restingHappy = false;
    if (next === 'feed') hasEaten = false;
    lookX = lookY = 0;
    scene.dataset.state = action;
    sleepLabel.textContent = action === 'sleep' ? '叫醒它' : '打个盹';
    care.querySelectorAll<HTMLButtonElement>('[data-cat-action]').forEach(button => {
      button.toggleAttribute('data-active', button.dataset.catAction === action);
    });
    if (action === 'feed') say('开饭啦！年糕闻着香味凑了过来。', '开饭啦！');
    if (action === 'pet') say('轻轻摸摸头，年糕舒服地眯起了眼。', '呼噜～');
    if (action === 'play') say('毛线球出发！看年糕的捕猎时间。', '盯——');
    if (action === 'sleep') say('嘘，让年糕在这里陪你打个盹。', 'Z z z');
    if (action === 'idle') say('伸个懒腰，又可以一起玩啦。', '喵～');
    if (isStill() && action !== 'sleep' && action !== 'idle') finishAction();
    render();
    schedule();
  }

  /** A single cancellable timeline owns every pose; switching actions leaves no timers behind. */
  function render() {
    const still = isStill();
    const seconds = clock / 1000;
    const t = elapsed;
    const wave = (speed: number, amount: number) => still ? 0 : Math.sin(seconds * speed) * amount;
    let x = 4, jump = 0, bodyY = wave(2.2, 1.1), bodyAngle = 0, bodyScaleX = 1, bodyScaleY = 1;
    let headX = 0, headY = wave(2.2, .65), headAngle = 0, tailAngle = wave(2.3, 9), pawAngle = 0;
    let happy = restingHappy && (still || elapsed < 1500), tongue = 0, yawn = 0;
    let hearts = restingHappy && still ? .8 : 0, sleep = 0, flip = false;
    let food = 0, bag = 0, falling = 0, ball = 0, ballX = 273, ballY = 524;
    let phase = action as string;

    if (action === 'idle' && !still) {
      const cycle = clock % 18000;
      // Quiet background gestures: a blink, an ear twitch, a lick, then a small stretch.
      happy ||= clock % 4700 > 4510;
      if (cycle > 10500 && cycle < 12200) {
        tongue = Math.max(0, Math.sin((cycle - 10500) / 1700 * Math.PI * 3));
        headAngle = -7;
      }
      if (cycle > 14300 && cycle < 16600) {
        const stretch = Math.sin((cycle - 14300) / 2300 * Math.PI);
        bodyScaleX += stretch * .09;
        bodyScaleY -= stretch * .06;
        headAngle = stretch * -10;
        yawn = stretch > .5 ? 1 : 0;
        happy = true;
        phase = 'stretch';
      }
    } else if (action === 'feed') {
      phase = t < 1000 ? 'pour' : t < 2150 ? 'approach' : t < 4550 ? 'eat' : 'lick';
      bag = between(t, 0, 180) * (1 - between(t, 1050, 1350));
      falling = t > 230 && t < 1220 ? 1 : 0;
      food = between(t, 400, 1100) * (1 - between(t, 2500, 4550));
      x += 69 * between(t, 750, 1800) * (1 - between(t, 5000, 6100));
      const lean = between(t, 1750, 2250) * (1 - between(t, 4450, 4800));
      headX = lean * 23;
      headY += lean * 46 + (phase === 'eat' ? Math.sin(t / 120) * 3 : 0);
      headAngle = lean * 21;
      bodyAngle = lean * 5;
      happy = phase === 'eat' || phase === 'lick';
      if (phase === 'approach' || t > 5000) pawAngle = Math.sin(t / 75) * 15;
      if (phase === 'lick') { tongue = Math.max(0, Math.sin(t / 140)); hearts = .8; }
      if (t >= 4550) creditMeal();
    } else if (action === 'pet') {
      phase = 'purr';
      happy = true;
      hearts = Math.min(1, t / 240);
      headAngle = Math.sin(t / 250) * 8 - 7;
      headY -= Math.sin(t / 190) * 2;
      bodyScaleY = 1 - (Math.sin(t / 190) + 1) * .015;
      tailAngle = Math.sin(t / 160) * 16;
      pawAngle = Math.sin(t / 180) * 6;
    } else if (action === 'play') {
      phase = t < 750 ? 'watch' : t < 2100 ? 'chase' : t < 3200 ? 'pounce' : 'return';
      ball = between(t, 0, 200) * (1 - between(t, 4750, 5100));
      ballX = 170 + 202 * between(t, 0, 1800) - 132 * between(t, 2600, 4000);
      ballY = 525 - Math.abs(Math.sin(t / 220)) * (1 - between(t, 0, 1800)) * 55;
      x += 209 * between(t, 700, 2650) * (1 - between(t, 3300, 5100));
      jump = t > 2050 && t < 3100 ? Math.sin((t - 2050) / 1050 * Math.PI) * 53 : 0;
      const crouch = between(t, 150, 450) * (1 - between(t, 650, 850));
      bodyScaleY = 1 - crouch * .16;
      bodyScaleX = 1 + crouch * .1;
      headY += crouch * 13;
      headAngle = -7;
      pawAngle = phase === 'pounce' ? -45 : phase === 'watch' ? 0 : Math.sin(t / 65) * 21;
      tailAngle = -16 + Math.sin(t / 120) * 12;
      flip = t > 3400;
      happy = t > 3100;
    } else if (action === 'sleep') {
      phase = 'sleep';
      const curl = still ? 1 : between(t, 0, curlDuration);
      bodyScaleY = 1 - curl * .22;
      bodyScaleX = 1 + curl * .08;
      headX = -curl * 15;
      headY = curl * 36 + wave(1.6, 1);
      headAngle = curl * -22;
      tailAngle = curl * -24 + wave(1.7, 2);
      happy = true;
      sleep = curl;
    }

    scene.dataset.phase = phase;
    if (action === 'feed') whisper.textContent = phase === 'lick' ? '好吃！' : phase === 'eat' ? '吧唧吧唧' : '开饭啦！';
    if (action === 'play') whisper.textContent = phase === 'return' ? '抓到啦' : '盯——';
    // Sprite width is 150 in the 570-unit portrait. Percent transforms scale with the stage.
    actor.style.transform = `translate(${x / 150 * 100}%, ${-jump / (150 * 170 / 180) * 100}%)`;
    transform('shadow', `translate(${x} 0) translate(78 538) scale(${1 - jump / 170} 1) translate(-78 -538)`);
    transform('facing', flip ? 'translate(180 0) scale(-1 1)' : 'translate(0 0)');
    transform('body', `translate(0 ${bodyY}) translate(85 155) rotate(${bodyAngle}) scale(${bodyScaleX} ${bodyScaleY}) translate(-85 -155)`);
    transform('head', `translate(${headX} ${headY}) rotate(${headAngle} 110 110)`);
    transform('tail', `rotate(${tailAngle} 51 132)`);
    transform('front-paw', `rotate(${pawAngle} 105 121)`);
    transform('far-paw', `rotate(${-pawAngle} 110 120)`);
    transform('back-paw', `rotate(${-pawAngle * .6} 65 140)`);
    const earTwitch = !still && clock % 7100 > 6700 ? wave(30, 7) : 0;
    transform('left-ear', `rotate(${earTwitch} 90 65)`);
    transform('right-ear', `rotate(${-earTwitch * .6} 135 62)`);
    transform('pupils', `translate(${action === 'idle' ? lookX : 1} ${action === 'idle' ? lookY : 0})`);
    opacity('open-eyes', happy ? 0 : 1);
    opacity('happy-eyes', happy ? 1 : 0);
    opacity('tongue', tongue);
    opacity('yawn', yawn);
    opacity('hearts', hearts);
    transform('hearts', `translate(0 ${wave(3, 5)})`);
    opacity('sleep-marks', sleep);
    transform('sleep-marks', `translate(0 ${wave(1.8, 3)})`);
    opacity('kibble', food);
    transform('kibble', `translate(202 537) scale(1 ${Math.max(.15, food)}) translate(-202 -537)`);
    opacity('food-bag', bag);
    transform('food-bag', `rotate(${-30 * between(t, 100, 600)} 217 480)`);
    opacity('falling-food', falling);
    crumbs.forEach((crumb, i) => {
      const fall = ((t + i * 97) % 650) / 650;
      crumb.setAttribute('transform', `translate(${202 + Math.sin(i * 2) * 13} ${475 + fall * fall * 60}) rotate(${fall * 230})`);
    });
    opacity('yarn', ball);
    transform('yarn', `translate(${ballX} ${ballY}) rotate(${t / 8})`);
  }

  function schedule() {
    if (disposed || frameId !== undefined || !inView || document.hidden || isStill()) return;
    frameId = requestAnimationFrame(tick);
  }
  function tick(now: number) {
    frameId = undefined;
    // Poses are time-based, not physics steps: dropped frames must not slow a meal down.
    // Visibility changes reset lastFrame, so time spent in a hidden tab is still excluded.
    const dt = lastFrame === undefined ? 0 : Math.max(0, now - lastFrame);
    lastFrame = now;
    clock += dt;
    elapsed += dt;
    if (durations[action] && elapsed >= durations[action]) finishAction();
    render();
    schedule();
  }
  function syncMotion() {
    if (frameId !== undefined) cancelAnimationFrame(frameId);
    frameId = undefined;
    lastFrame = undefined;
    if (motion.matches && action === 'sleep') elapsed = Math.max(elapsed, curlDuration);
    if (isStill() && action !== 'idle' && action !== 'sleep') finishAction();
    if (isStill()) lookX = lookY = 0;
    render();
    schedule();
  }
  care.querySelectorAll<HTMLButtonElement>('[data-cat-action]').forEach(button => {
    button.addEventListener('click', () => { startAction(button.dataset.catAction as Action); bubble.close(); });
  });
  scene.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || isStill() || action !== 'idle') return;
    const bounds = actor.getBoundingClientRect();
    lookX = Math.max(-2.5, Math.min(2.5, (event.clientX - bounds.left - bounds.width * .6) / 28));
    lookY = Math.max(-2, Math.min(2, (event.clientY - bounds.top - bounds.height * .45) / 35));
  });
  scene.addEventListener('pointerleave', () => { lookX = lookY = 0; });
  const observer = new MutationObserver(syncMotion);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  const visibility = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; syncMotion(); });
  visibility.observe(scene);
  motion.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    disposed = true;
    if (frameId !== undefined) cancelAnimationFrame(frameId);
    observer.disconnect();
    visibility.disconnect();
    bubble.dispose();
    motion.removeEventListener('change', syncMotion);
    document.removeEventListener('visibilitychange', syncMotion);
  });
  render();
}
