/** A little ink melody, driven by the audio that reaches the speakers. */
export const musicNotesMarkup = `<svg class="music-notes" viewBox="0 0 68 46" fill="none" aria-hidden="true" focusable="false">
  <g class="music-note-trails" stroke="currentColor" stroke-linecap="round">
    <path d="M4 35c13 5 29 5 44-1"/>
    <path d="M14 40c10 2 23 1 31-1"/>
  </g>
  <g class="music-note music-note-pair" data-music-note="0">
    <path d="M19 29V12l17-4v17M19 16l17-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="15.6" cy="29.4" rx="4.4" ry="3" transform="rotate(-21 15.6 29.4)" fill="currentColor"/>
    <ellipse cx="32.6" cy="25.4" rx="4.4" ry="3" transform="rotate(-21 32.6 25.4)" fill="currentColor"/>
  </g>
  <g class="music-note music-note-single" data-music-note="1">
    <path d="M47 23V5c1 4 7 4 5 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="44" cy="23.5" rx="3.8" ry="2.6" transform="rotate(-24 44 23.5)" fill="currentColor"/>
  </g>
  <g class="music-note music-note-high" data-music-note="2">
    <path d="M60 34V22c1 3 6 3 4 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="57.5" cy="34.5" rx="3.1" ry="2.1" transform="rotate(-22 57.5 34.5)" fill="currentColor"/>
  </g>
  <g class="music-note-accents" stroke="currentColor" stroke-width="1.25" stroke-linecap="round">
    <path d="m7 23-3-2m4 7H4m52-9 2-2"/>
  </g>
</svg>`;

export function initMusicNotes(button: HTMLButtonElement, motionAllowed: () => boolean) {
  const notes = Array.from(button.querySelectorAll<SVGGElement>('[data-music-note]'));
  const trails = button.querySelector<SVGGElement>('.music-note-trails')!;
  const accents = button.querySelector<SVGGElement>('.music-note-accents')!;
  let analyser: AnalyserNode | undefined;
  let bins: Uint8Array<ArrayBuffer> | undefined;
  let elapsed = () => 0;
  let audible = false;
  let frame = 0;
  let lastTime = 0;
  const levels = [0, 0, 0];

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    levels.fill(0);
    button.dataset.dancing = 'false';
    for (const note of notes) note.style.removeProperty('transform');
    trails.style.removeProperty('transform');
    accents.style.removeProperty('opacity');
  }

  function canDance() {
    return audible && !!analyser && !document.hidden && motionAllowed();
  }

  function tick(time: number) {
    if (!canDance()) { stop(); return; }
    frame = requestAnimationFrame(tick);
    // Three tiny SVG groups need only 30 visual updates per second.
    if (lastTime && time - lastTime < 1000 / 30) return;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, .1) : 1 / 30;
    lastTime = time;
    analyser!.getByteFrequencyData(bins!);
    const hzPerBin = analyser!.context.sampleRate / analyser!.fftSize;
    const bands = [[90, 420], [420, 2200], [2200, 6500]];
    bands.forEach(([low, high], index) => {
      const from = Math.max(1, Math.floor(low / hzPerBin));
      const to = Math.min(bins!.length, Math.ceil(high / hzPerBin));
      let power = 0;
      for (let bin = from; bin < to; bin++) power += (bins![bin] / 255) ** 2;
      const energy = Math.min(1, Math.sqrt(power / Math.max(1, to - from)) * 1.65);
      const follow = 1 - Math.exp(-dt * (energy > levels[index] ? 16 : 5));
      levels[index] += (energy - levels[index]) * follow;
    });
    // AudioContext time keeps the swing in phase through pause and resume.
    const beat = elapsed() * (86 / 60) * Math.PI * 2;
    notes.forEach((note, index) => {
      const swing = Math.sin(beat + index * 1.9);
      const lift = levels[index] * (4.5 + (swing + 1) * 2.1);
      const tilt = swing * levels[index] * (index === 0 ? 9 : 15);
      const drift = Math.cos(beat / 2 + index) * levels[index] * 1.7;
      note.style.transform = `translate(${drift.toFixed(2)}px,${(-lift).toFixed(2)}px) rotate(${tilt.toFixed(2)}deg)`;
    });
    trails.style.transform = `scaleY(${(.65 + levels[0] * .65).toFixed(3)})`;
    accents.style.opacity = (.2 + levels[1] * .55).toFixed(3);
  }

  function refresh() {
    if (canDance()) {
      button.dataset.dancing = 'true';
      if (!frame) frame = requestAnimationFrame(tick);
    } else stop();
  }

  return {
    connect(node: AnalyserNode, audioTime: () => number) {
      analyser = node;
      bins = new Uint8Array(node.frequencyBinCount);
      elapsed = audioTime;
      refresh();
    },
    setAudible(next: boolean) { audible = next; refresh(); },
    refresh,
    dispose: stop,
  };
}
