import './reading-controls.css';
import { motionControlMarkup, settleHoseControls, syncMotionControls } from '../motion-controls';
import { escapeHtml } from './types';
import type { TechnicalNote } from './types';

type HoseProgress = HTMLElement & { set?: (value: number, jump?: boolean) => void; frame?: (time: number, dt: number) => void };
type HoseRating = HTMLElement & { value: number };
type HoseWindow = Window & { RubberHose?: { now: number } };

const documentReady = () => document.readyState === 'loading'
  ? new Promise<void>(resolve => document.addEventListener('DOMContentLoaded', () => resolve(), { once: true }))
  : Promise.resolve();

export function articleRatingMarkup(note: TechnicalNote) {
  return `<section class="article-rating" aria-labelledby="article-rating-title"><div><p class="eyebrow">留一枚阅读印记</p><h2 id="article-rating-title">这篇手记，对你有用吗？</h2><p class="article-rating-note">点亮星星，记录你对这篇的评价。评分仅保存在当前浏览器。</p><p class="article-rating-status" data-rating-status role="status">尚未评分</p></div><hose-rating data-article-rating label="${escapeHtml(note.title)}的个人评分" name="article-rating" value="0"></hose-rating></section>`;
}

/** The fixed navigation escapes the film transform; progress belongs beside the article. */
export function mountReadingControls(reader: HTMLElement, note: TechnicalNote, signal: AbortSignal) {
  const tools = document.createElement('aside');
  tools.className = 'reading-tools';
  tools.setAttribute('aria-label', '文章阅读工具');
  tools.innerHTML = `<div class="reading-tools-inner"><a class="reading-back" href="#notes"><span aria-hidden="true">←</span><span class="reading-back-full">返回开发手记</span><span class="reading-back-short">返回手记</span></a><div class="reading-tools-right"><button class="reading-music" type="button" data-music-trigger aria-label="打开音乐控制" aria-controls="music-panel" aria-expanded="false"><span aria-hidden="true">♪</span><span class="reading-music-label">音乐</span></button>${motionControlMarkup('article-motion', 'reading-motion')}</div></div>`;
  document.body.insertBefore(tools, document.querySelector('#app'));
  document.body.classList.add('is-reading');

  const progressBlock = document.createElement('div');
  progressBlock.className = 'reading-progress';
  progressBlock.innerHTML = `<div class="reading-progress-caption"><span>这一篇，读到这里</span><span data-reading-percent aria-hidden="true">0%</span></div><hose-progress data-reading-progress label="本篇正文与参考原文的阅读进度"></hose-progress><div class="reading-progress-track" aria-hidden="true"><span></span></div>`;
  reader.querySelector('.article-margin')!.prepend(progressBlock);
  const range = reader.querySelector<HTMLElement>('.article-reading-range')!;
  const progress = progressBlock.querySelector<HoseProgress>('[data-reading-progress]')!;
  const percent = progressBlock.querySelector<HTMLElement>('[data-reading-percent]')!;
  let frame = 0;
  let progressReady = false;
  let lastPercent = -1;

  function update() {
    frame = 0;
    if (signal.aborted || !range.isConnected) return;
    const rect = range.getBoundingClientRect();
    const length = rect.height - window.innerHeight;
    const value = length > 0 ? Math.min(1, Math.max(0, -rect.top / length)) : rect.bottom <= window.innerHeight ? 1 : 0;
    progressBlock.style.setProperty('--reading-fraction', String(value));
    const nextPercent = Math.round(value * 100);
    if (nextPercent !== lastPercent) {
      percent.textContent = `${nextPercent}%`;
      lastPercent = nextPercent;
    }
    if (progressReady) {
      progress.set?.(value, true);
      // Reading position is state, so redraw it even when the shared animation clock is paused.
      progress.frame?.((window as HoseWindow).RubberHose?.now ?? 0, 0);
      progress.shadowRoot?.querySelector('[role="progressbar"]')?.setAttribute('aria-valuetext', `本篇已读 ${nextPercent}%`);
    }
  }

  function queueUpdate() {
    if (!signal.aborted && !frame) frame = requestAnimationFrame(update);
  }

  queueUpdate();
  window.addEventListener('scroll', queueUpdate, { passive: true, signal });
  window.addEventListener('resize', queueUpdate, { passive: true, signal });
  window.addEventListener('hashchange', queueUpdate, { signal });
  window.addEventListener('motionchange', queueUpdate, { signal });
  reader.addEventListener('load', queueUpdate, { capture: true, signal });
  const observer = new ResizeObserver(queueUpdate);
  observer.observe(range);
  observer.observe(reader);

  void Promise.all([documentReady(), customElements.whenDefined('hose-progress')]).then(() => {
    if (signal.aborted) return;
    progressReady = true;
    queueUpdate();
  });
  void Promise.all([documentReady(), customElements.whenDefined('hose-toggle')]).then(() => {
    if (!signal.aborted) syncMotionControls();
  });
  void document.fonts.ready.then(queueUpdate);
  mountRating(reader, note, signal);
  signal.addEventListener('abort', () => {
    if (frame) cancelAnimationFrame(frame);
    observer.disconnect();
    tools.remove();
    document.body.classList.remove('is-reading');
  }, { once: true });
}

function mountRating(reader: HTMLElement, note: TechnicalNote, signal: AbortSignal) {
  const rating = reader.querySelector<HoseRating>('[data-article-rating]')!;
  const status = reader.querySelector<HTMLElement>('[data-rating-status]')!;
  const key = `chency-note-rating:${note.slug}`;
  let savedValue = 0;
  try {
    const stored = Number(localStorage.getItem(key));
    if (Number.isInteger(stored) && stored >= 0 && stored <= 5) savedValue = stored;
  } catch { /* The control still works when browser storage is unavailable. */ }

  void Promise.all([documentReady(), customElements.whenDefined('hose-rating')]).then(() => {
    if (signal.aborted) return;
    rating.value = savedValue;
    status.textContent = savedValue ? `你的评分：${savedValue} / 5 · 已保存在此浏览器` : '尚未评分';
    rating.shadowRoot?.querySelector('[role="radiogroup"]')?.setAttribute('aria-description', '使用左右方向键选择 0 至 5 星，仅保存在当前浏览器。');
    rating.shadowRoot?.querySelectorAll<HTMLButtonElement>('button').forEach((button, index) => {
      button.textContent = `${index + 1} 星`;
    });
    settleHoseControls();
    rating.addEventListener('change', () => {
      const value = rating.value;
      let stored = true;
      try { localStorage.setItem(key, String(value)); } catch { stored = false; }
      status.textContent = value
        ? `你的评分：${value} / 5 · ${stored ? '已保存在此浏览器' : '本次有效，浏览器未允许保存'}`
        : `已清除评分${stored ? '' : ' · 本次有效，浏览器未允许保存'}`;
      settleHoseControls();
    }, { signal });
  });
}
