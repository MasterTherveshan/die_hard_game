let audioCtx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'square',
  gain = 0.25,
  startOffset = 0,
): void {
  const ac = ctx();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.connect(g);
  g.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ac.currentTime + startOffset);
  g.gain.setValueAtTime(gain, ac.currentTime + startOffset);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startOffset + duration);
  osc.start(ac.currentTime + startOffset);
  osc.stop(ac.currentTime + startOffset + duration + 0.01);
}

function noise(duration: number, gain = 0.15, startOffset = 0): void {
  const ac = ctx();
  const sampleRate = ac.sampleRate;
  const bufSize = Math.max(1, Math.floor(sampleRate * duration));
  const buf = ac.createBuffer(1, bufSize, sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;

  const g = ac.createGain();
  g.gain.setValueAtTime(gain, ac.currentTime + startOffset);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startOffset + duration);
  src.connect(g);
  g.connect(ac.destination);
  src.start(ac.currentTime + startOffset);
}

function safePlay(fn: () => void): void {
  try {
    fn();
  } catch {
    // Ignore audio errors (e.g. browser restrictions)
  }
}

export function playDiceTick(enabled: boolean): void {
  if (!enabled) return;
  safePlay(() => noise(0.025, 0.08));
}

export function playDiceSettle(enabled: boolean, dieIndex: number): void {
  if (!enabled) return;
  safePlay(() => {
    const baseFreq = 160 + dieIndex * 18;
    tone(baseFreq, 0.09, 'square', 0.22);
  });
}

export function playWin(enabled: boolean): void {
  if (!enabled) return;
  safePlay(() => {
    // Ascending arpeggio: C5-E5-G5-C6
    const freqs = [523, 659, 784, 1047];
    freqs.forEach((freq, i) => tone(freq, 0.14, 'square', 0.28, i * 0.11));
  });
}

export function playLose(enabled: boolean): void {
  if (!enabled) return;
  safePlay(() => {
    // Descending buzzer
    tone(300, 0.08, 'sawtooth', 0.3, 0);
    tone(200, 0.08, 'sawtooth', 0.3, 0.09);
    tone(120, 0.18, 'sawtooth', 0.3, 0.18);
  });
}

export function playDefeatSuccess(enabled: boolean): void {
  if (!enabled) return;
  safePlay(() => {
    // Punchy impact
    noise(0.04, 0.3);
    tone(220, 0.12, 'square', 0.25, 0.03);
  });
}

export function playFloorAdvance(enabled: boolean): void {
  if (!enabled) return;
  safePlay(() => {
    // Short ascending fanfare
    tone(440, 0.1, 'square', 0.25, 0.0);
    tone(554, 0.1, 'square', 0.25, 0.1);
    tone(659, 0.15, 'square', 0.25, 0.2);
  });
}

export function playButton(enabled: boolean): void {
  if (!enabled) return;
  safePlay(() => tone(880, 0.05, 'square', 0.12));
}
