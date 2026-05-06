/**
 * Boston theme — survival horror.
 * Low drone + sparse piano melody in D minor.
 * Unsettling sustained bass, slow irregular melody notes.
 */
export class BostonTheme {
  private ctx:        AudioContext | null = null;
  private masterGain: GainNode     | null = null;
  private isPlaying = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly BPM = 60;

  private static readonly FREQ: Record<string, number> = {
    D2: 73.42, A2: 110.00, D3: 146.83, F3: 174.61, A3: 220.00,
    C4: 261.63, D4: 293.66, F4: 349.23, A4: 440.00, C5: 523.25,
  };

  // Sparse melody — silence represented as empty string
  private readonly MELODY: Array<string | null> = [
    'D4', null, null, 'F4', null, 'A4', null, null,
    'C5', null, null, 'A4', null, 'F4', null, null,
    'D4', null, 'F4', null, null, null, 'C5', null,
    'A4', null, null, null, 'D4', null, null, null,
  ];

  play(volume = 0.40): void {
    if (this.isPlaying) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);
    this.isPlaying = true;

    const startAt = this.ctx.currentTime + 0.05;
    this._scheduleLoop(startAt);

    const tryFadeIn = (): void => {
      void this.ctx!.resume().then(() => {
        if (!this.masterGain || !this.ctx) return;
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 2.0);
      });
    };

    if (this.ctx.state === 'running') { tryFadeIn(); }
    else {
      document.addEventListener('pointerdown', tryFadeIn, { once: true });
      document.addEventListener('keydown',     tryFadeIn, { once: true });
    }
  }

  stop(fadeMs = 1200): void {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    this.isPlaying = false;
    if (this.loopTimer !== null) { clearTimeout(this.loopTimer); this.loopTimer = null; }
    const fadeSec = fadeMs / 1000;
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeSec);
    const ctxRef = this.ctx;
    setTimeout(() => { void ctxRef.close(); }, fadeMs + 100);
    this.ctx = null; this.masterGain = null;
  }

  setVolume(v: number, rampMs = 200): void {
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.linearRampToValueAtTime(v, this.ctx.currentTime + rampMs / 1000);
  }

  get playing(): boolean { return this.isPlaying; }

  private _scheduleLoop(startAt: number): void {
    if (!this.isPlaying || !this.ctx) return;

    const step    = (60 / this.BPM) / 2;            // 8th-note duration
    const loopLen = this.MELODY.length * step;

    // Sustained low drone (D2 + A2) — whole loop length
    this._drone('D2', startAt, loopLen, 0.30);
    this._drone('A2', startAt, loopLen, 0.18);

    // Sparse piano melody
    this.MELODY.forEach((note, i) => {
      if (note !== null) {
        this._piano(note, startAt + i * step, step * 3.5, 0.28);
      }
    });

    const msUntilNext = (loopLen - 0.15) * 1000;
    this.loopTimer = setTimeout(() => {
      this.loopTimer = null;
      this._scheduleLoop(startAt + loopLen);
    }, msUntilNext);
  }

  private _drone(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = BostonTheme.FREQ[note];
    if (freq === undefined) return;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + 1.5);
    env.gain.setValueAtTime(amp, when + duration - 1.5);
    env.gain.linearRampToValueAtTime(0, when + duration);
    env.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + duration + 0.05);

    // Sub-octave sine for body
    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.5;
    subGain.connect(env);
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = freq * 0.5;
    sub.connect(subGain);
    sub.start(when);
    sub.stop(when + duration + 0.05);
  }

  private _piano(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = BostonTheme.FREQ[note];
    if (freq === undefined) return;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + 0.006);
    env.gain.exponentialRampToValueAtTime(amp * 0.3, when + 0.1);
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    env.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }
}
