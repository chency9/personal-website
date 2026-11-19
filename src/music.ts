import './music.css';
import { renderMusic } from './music-score';
import { initMusicLogo } from './music-logo';
import { settleHoseControls } from './motion-controls';

type MusicSlider = HTMLElement & { value: number };

const musicMarkup = `
<aside id="music-panel" class="music-player" popover="auto" aria-label="小站唱片机" data-open="false" data-playing="false" inert>
  <div class="music-edition"><span>CHENCY'S LITTLE RADIO · SIDE A</span><button class="music-close" type="button" aria-label="收起音乐控制">×</button></div>
  <button class="music-toggle" type="button" aria-label="播放或暂停背景音乐《纸间散步》" aria-pressed="false" aria-describedby="music-status music-description" data-active="false">
    <span class="music-record" aria-hidden="true"><span class="music-grooves"></span><span class="music-record-label"><svg class="music-play-icon" viewBox="0 0 16 16"><path d="m6 3 7 5-7 5Z" fill="currentColor"/></svg><svg class="music-pause-icon" viewBox="0 0 16 16"><path d="M4 3h3v10H4zm5 0h3v10H9z" fill="currentColor"/></svg></span></span>
    <span class="music-copy"><strong>纸间散步<span aria-hidden="true"> ♪</span></strong><span id="music-status" role="status">正在落针，稍等一下…</span></span>
  </button>
  <div class="music-volume"><div class="music-volume-heading"><label for="music-volume">音量</label><button class="music-mute" type="button" aria-label="静音背景音乐" aria-pressed="false">静音</button><output for="music-volume" id="music-volume-value" aria-live="off">35%</output></div><hose-slider id="music-volume" min="0" max="100" step="1" value="35" label="背景音乐音量"></hose-slider></div>
  <p id="music-description" class="music-description">原创轻爵士 · 电钢琴 / 贝斯 / 刷鼓</p>
</aside>`;

export function initMusic() {
  document.body.insertAdjacentHTML('beforeend', musicMarkup);
  // Body placement escapes the film effect's transformed app and hidden article routes.
  const player = document.getElementById('music-panel')!;
  const logo = initMusicLogo(player);
  const toggle = player.querySelector<HTMLButtonElement>('.music-toggle')!;
  const status = player.querySelector<HTMLElement>('#music-status')!;
  const slider = player.querySelector<MusicSlider>('#music-volume')!;
  const mute = player.querySelector<HTMLButtonElement>('.music-mute')!;
  const output = player.querySelector<HTMLOutputElement>('#music-volume-value')!;
  const storageKey = 'chency-music-volume';
  let volume = 35;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null && saved.trim() !== '' && Number.isFinite(Number(saved))) volume = Math.min(100, Math.max(0, Math.round(Number(saved))));
  } catch { /* Playback and volume also work without local storage. */ }
  let audibleVolume = volume || 35;

  let context: AudioContext | undefined;
  let gain: GainNode | undefined;
  let analyser: AnalyserNode | undefined;
  let source: AudioBufferSourceNode | undefined;
  let rendering: Promise<AudioBuffer> | undefined;
  let requested = true;
  let waiting = false;
  let preparing = false;
  let failed = false;
  let disposed = false;
  let startedAt = 0;
  let revision = 0;
  let suspendTimer: ReturnType<typeof setTimeout> | undefined;
  const events = new AbortController();

  function paint() {
    const playing = requested && !document.hidden && context?.state === 'running' && !!source;
    const active = requested && !waiting && !failed && !document.hidden;
    player.dataset.playing = String(playing);
    toggle.dataset.active = String(active);
    toggle.setAttribute('aria-pressed', String(active));
    status.textContent = failed ? '没能播放，点一下重试' : !requested ? '已暂停，点击继续' : document.hidden ? '暂歇一下，回来继续' : waiting ? '轻点页面，开启这段音乐' : preparing ? '正在落针，稍等一下…' : volume === 0 ? '已静音 · 点击暂停' : '轻轻摇摆 · 点击暂停';
    logo.setPlayback({ playing, audible: playing && volume > 0, waiting, preparing, phase: context ? (context.currentTime - startedAt) % (60 / 86) : 0 });
  }

  function setGain(target: number, duration = .12) {
    if (!context || !gain) return;
    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(target, now + duration);
  }

  function suspend(current: number) {
    if (!context || context.state === 'closed') return;
    setGain(0, .06);
    if (document.hidden) void context.suspend().catch(() => {});
    else suspendTimer = setTimeout(() => {
      if (current === revision) void context?.suspend().catch(() => {});
    }, 80);
  }

  async function syncPlayback() {
    const current = ++revision;
    clearTimeout(suspendTimer);
    if (!requested || document.hidden || disposed) {
      preparing = false;
      waiting = false;
      suspend(current);
      paint();
      return;
    }

    try {
      if (!context) {
        context = new AudioContext();
        gain = context.createGain();
        gain.gain.value = 0;
        analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = .65;
        gain.connect(analyser);
        analyser.connect(context.destination);
        logo.connectAnalyser(analyser, () => context ? context.currentTime - startedAt : 0);
        context.addEventListener('statechange', () => {
          if (context?.state === 'running') {
            if (!requested || document.hidden) suspend(revision);
            else {
              waiting = false;
              setGain(source ? (volume / 100) ** 1.2 : 0);
            }
          } else if (requested && !document.hidden && !disposed) waiting = true;
          paint();
        }, { signal: events.signal });
      }
      failed = false;
      preparing = !source;
      waiting = context.state !== 'running';
      // An autoplay-blocked resume can stay pending forever. Render independently,
      // and retry resume synchronously within a later trusted gesture.
      void context.resume().then(() => {
        if (current !== revision || disposed) return;
        if (!requested || document.hidden) suspend(current);
        else {
          waiting = context?.state !== 'running';
          setGain(source ? (volume / 100) ** 1.2 : 0);
        }
        paint();
      }).catch(() => {
        if (current === revision && requested && !disposed) { waiting = true; paint(); }
      });
      paint();
      rendering ??= renderMusic();
      const buffer = await rendering;
      if (current !== revision || !requested || document.hidden || disposed) return;
      if (!source) {
        source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain!);
        startedAt = context.currentTime;
        source.start();
      }
      preparing = false;
      waiting = context.state !== 'running';
      if (!waiting) setGain((volume / 100) ** 1.2);
      paint();
    } catch {
      if (current !== revision || disposed) return;
      preparing = false;
      waiting = false;
      failed = true;
      rendering = undefined;
      suspend(current);
      paint();
    }
  }

  function updateVolume() {
    // An unupgraded custom element must not receive an own value property, which
    // would shadow the vendor accessor after upgrade. Its real range stays intact.
    slider.setAttribute('value', String(volume));
    if (customElements.get('hose-slider')) slider.value = volume;
    const range = slider.shadowRoot?.querySelector<HTMLInputElement>('input[type=range]');
    range?.setAttribute('aria-valuetext', volume === 0 ? '0%，已静音' : `${volume}%`);
    output.value = `${volume}%`;
    mute.textContent = volume === 0 ? '取消静音' : '静音';
    mute.setAttribute('aria-label', volume === 0 ? '取消背景音乐静音' : '静音背景音乐');
    mute.setAttribute('aria-pressed', String(volume === 0));
    if (requested && source && !document.hidden && context?.state === 'running') setGain((volume / 100) ** 1.2, .04);
    paint();
    settleHoseControls();
  }

  function saveVolume() {
    try { localStorage.setItem(storageKey, String(volume)); } catch { /* Volume still works without persistence. */ }
  }

  toggle.addEventListener('click', () => {
    requested = !(requested && !waiting && !failed);
    failed = false;
    void syncPlayback();
  }, { signal: events.signal });
  slider.addEventListener('input', () => {
    volume = Math.min(100, Math.max(0, Math.round(Number(slider.value))));
    if (volume > 0) audibleVolume = volume;
    updateVolume();
    saveVolume();
  }, { signal: events.signal });
  mute.addEventListener('click', () => {
    if (volume > 0) { audibleVolume = volume; volume = 0; }
    else volume = audibleVolume;
    updateVolume();
    saveVolume();
  }, { signal: events.signal });
  player.addEventListener('musicpanelchange', () => {
    if (player.dataset.open === 'true') requestAnimationFrame(settleHoseControls);
  }, { signal: events.signal });
  window.addEventListener('motionchange', () => {
    if (player.dataset.open === 'true') requestAnimationFrame(settleHoseControls);
  }, { signal: events.signal });
  void customElements.whenDefined('hose-slider').then(() => {
    if (!disposed) updateVolume();
  });
  function unlock(event: Event) {
    if (!event.isTrusted || !requested || failed || document.hidden || context?.state === 'running') return;
    if (event instanceof KeyboardEvent && (event.repeat || event.isComposing || ['Escape', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key))) return;
    // The play button handles its own intent; capture must not turn its resume into pause.
    if (event.target instanceof Node && toggle.contains(event.target)) return;
    void syncPlayback();
  }
  document.addEventListener('pointerdown', unlock, { capture: true, signal: events.signal });
  document.addEventListener('keydown', unlock, { capture: true, signal: events.signal });
  document.addEventListener('visibilitychange', () => { void syncPlayback(); }, { signal: events.signal });
  window.addEventListener('pagehide', event => {
    clearTimeout(suspendTimer);
    revision++;
    if (event.persisted) void context?.suspend().catch(() => {});
    else {
      disposed = true;
      events.abort();
      logo.dispose();
      source?.stop();
      source?.disconnect();
      gain?.disconnect();
      analyser?.disconnect();
      void context?.close().catch(() => {});
      rendering = undefined;
    }
  }, { signal: events.signal });
  window.addEventListener('pageshow', event => { if (event.persisted) void syncPlayback(); }, { signal: events.signal });
  updateVolume();
  void syncPlayback();
}
