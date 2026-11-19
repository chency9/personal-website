/** Original instrumental: «纸间散步 / Paper Stroll», 86 BPM, 16 bars in G. */
const BPM = 86;
const BEAT = 60 / BPM;
const BARS = 16;
const SAMPLE_RATE = 22050;
const LOOP_FRAMES = Math.round(BARS * 4 * BEAT * SAMPLE_RATE);

type Bar = {
  bass: [number, number];
  chord: number[];
  melody: [beat: number, midi: number, length: number][];
};

// A small A–A′–B–A″ tune. The turnaround leads back into the opening Gmaj9.
const score: Bar[] = [
  { bass: [43, 50], chord: [59, 62, 66, 69], melody: [[.5, 74, .5], [1.25, 71, .5], [2, 69, .75], [3, 67, .75]] },
  { bass: [40, 47], chord: [55, 59, 62, 66], melody: [[0, 66, .75], [1.5, 67, .5], [2.5, 71, 1]] },
  { bass: [45, 52], chord: [55, 59, 60, 64], melody: [[.5, 72, .5], [1.25, 71, .5], [2, 69, 1.25]] },
  { bass: [38, 45], chord: [54, 60, 64, 69], melody: [[0, 66, .5], [.75, 69, .5], [2, 67, 1.5]] },
  { bass: [43, 50], chord: [59, 62, 66, 69], melody: [[.5, 74, .5], [1.25, 71, .5], [2, 69, .75], [3, 67, .75]] },
  { bass: [40, 47], chord: [55, 59, 62, 66], melody: [[0, 66, .5], [1, 67, .5], [1.75, 71, .75], [3, 74, .75]] },
  { bass: [45, 52], chord: [55, 59, 60, 64], melody: [[0, 72, .75], [1.25, 71, .5], [2, 69, .5], [3, 66, .75]] },
  { bass: [38, 45], chord: [54, 60, 64, 69], melody: [[0, 69, .75], [1.5, 66, .5], [2.5, 67, 1]] },
  { bass: [36, 43], chord: [55, 59, 62, 64], melody: [[0, 76, 1], [1.5, 74, .5], [2.5, 71, 1]] },
  { bass: [47, 42], chord: [57, 62, 66, 69], melody: [[.5, 74, .75], [1.75, 71, .5], [2.5, 69, 1]] },
  { bass: [40, 47], chord: [55, 59, 62, 66], melody: [[0, 71, .75], [1.25, 74, .5], [2, 78, .75], [3, 76, .75]] },
  { bass: [45, 52], chord: [55, 59, 61, 64], melody: [[0, 73, 1], [1.5, 71, .5], [2.5, 69, 1]] },
  { bass: [45, 52], chord: [55, 59, 60, 64], melody: [[.5, 72, .5], [1.25, 71, .5], [2, 69, .75], [3, 67, .75]] },
  { bass: [38, 45], chord: [54, 60, 64, 69], melody: [[0, 66, .5], [1, 69, .5], [2, 72, .75], [3, 69, .75]] },
  { bass: [43, 50], chord: [59, 62, 64, 69], melody: [[0, 71, .75], [1.25, 69, .5], [2, 67, 1.25]] },
  { bass: [38, 45], chord: [54, 60, 64, 69], melody: [[.5, 66, .75], [2, 69, .5], [3.25, 71, .5]] },
];

const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
// A gentle 58:42 swing; quarter notes stay on the grid.
const swing = (beat: number) => Math.floor(beat) + (beat % 1 < .5 ? (beat % 1) * 1.16 : .58 + ((beat % 1) - .5) * .84);

/** Render only after a play gesture. No audio files, network or running JS clock. */
export async function renderMusic(): Promise<AudioBuffer> {
  // Two lead-in bars supply every release/reverb tail at the loop seam without
  // rendering a whole extra lap. Only the following 16 bars are retained.
  const leadFrames = Math.round(8 * BEAT * SAMPLE_RATE);
  const context = new OfflineAudioContext(2, LOOP_FRAMES + leadFrames, SAMPLE_RATE);
  const mix = context.createGain();
  mix.gain.value = 1.5;
  mix.connect(context.destination);

  const room = context.createConvolver();
  const impulse = context.createBuffer(2, SAMPLE_RATE * 1.2, SAMPLE_RATE);
  let seed = 190019;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296 * 2 - 1;
  };
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < data.length; i++) data[i] = random() * Math.exp(-i / (SAMPLE_RATE * .19));
  }
  room.buffer = impulse;
  const wet = context.createGain();
  wet.gain.value = .16;
  room.connect(wet).connect(mix);

  const pianoBus = context.createStereoPanner();
  pianoBus.pan.value = -.16;
  pianoBus.connect(mix);
  pianoBus.connect(room);

  const noise = context.createBuffer(1, SAMPLE_RATE, SAMPLE_RATE);
  const noiseData = noise.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = random();

  function piano(midi: number, time: number, length: number, velocity: number) {
    const hz = frequency(midi);
    const carrier = context.createOscillator();
    const modulator = context.createOscillator();
    const color = context.createGain();
    const envelope = context.createGain();
    const duration = Math.min(length * BEAT + .55, 2.4);
    carrier.frequency.value = hz;
    modulator.frequency.value = hz * 2;
    // Soft FM tines lose their brightness quickly, like a muted electric piano.
    color.gain.setValueAtTime(hz * .48, time);
    color.gain.exponentialRampToValueAtTime(hz * .025, time + .32);
    modulator.connect(color).connect(carrier.frequency);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(velocity, time + .008);
    envelope.gain.exponentialRampToValueAtTime(velocity * .38, time + .18);
    envelope.gain.exponentialRampToValueAtTime(.0001, time + duration);
    carrier.connect(envelope).connect(pianoBus);
    carrier.start(time);
    modulator.start(time);
    carrier.stop(time + duration);
    modulator.stop(time + duration);
  }

  function bass(midi: number, time: number, velocity: number) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency(midi) * 1.008, time);
    oscillator.frequency.exponentialRampToValueAtTime(frequency(midi), time + .08);
    filter.type = 'lowpass';
    filter.frequency.value = 550;
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(velocity, time + .012);
    envelope.gain.exponentialRampToValueAtTime(.0001, time + BEAT * 1.65);
    oscillator.connect(filter).connect(envelope).connect(mix);
    oscillator.start(time);
    oscillator.stop(time + BEAT * 1.7);
  }

  function brush(time: number, accent: boolean, index: number) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = noise;
    filter.type = 'bandpass';
    filter.frequency.value = accent ? 2100 : 4700;
    filter.Q.value = .65;
    const duration = accent ? .18 : .065;
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(accent ? .085 : .032, time + .006);
    envelope.gain.exponentialRampToValueAtTime(.0001, time + duration);
    source.connect(filter).connect(envelope).connect(mix);
    source.start(time, (index * .137) % .7, duration);
  }

  [...score.slice(-2), ...score].forEach((bar, index) => {
    const barIndex = (index + BARS - 2) % BARS;
    const start = index < 2 ? index * 4 * BEAT : leadFrames / SAMPLE_RATE + (index - 2) * 4 * BEAT;
    const at = (beat: number) => start + swing(beat) * BEAT;
    bar.melody.forEach(([beat, midi, length], index) => {
      piano(midi, at(beat) + .006, length, .19 + (index % 2) * .017);
    });
    // Sparse, rolled voicings leave room for both the tune and the visitor.
    for (const beat of [0, 2.5]) {
      bar.chord.forEach((midi, index) => piano(midi, at(beat) + index * .012, .8, .061));
    }
    bass(bar.bass[0], at(0), .25);
    bass(bar.bass[1], at(2), .205);
    for (let eighth = 0; eighth < 8; eighth++) {
      brush(at(eighth / 2), eighth === 2 || eighth === 6, barIndex * 8 + eighth);
    }
  });

  const rendered = await context.startRendering();
  const loop = context.createBuffer(2, LOOP_FRAMES, SAMPLE_RATE);
  for (let channel = 0; channel < 2; channel++) {
    loop.copyToChannel(rendered.getChannelData(channel).subarray(leadFrames), channel);
  }
  return loop;
}
