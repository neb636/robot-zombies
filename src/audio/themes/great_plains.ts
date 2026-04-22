/**
 * Great Plains theme — existential dread; long held tones.
 * Open fifths and suspended harmonics. C major that never resolves.
 * The drone stretches until you feel it in your chest.
 */
export class GreatPlainsTheme {
  private ctx:        AudioContext | null = null;
  private masterGain: GainNode     | null = null;
  private isPlaying = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  private static readonly FREQ: Record<string, number> = {
    C2: 65.41,  G2: 98.00,  C3: 130.81, G3: 196.00,
    D4: 293.66, F4: 349.23, G4: 392.00, A4: 440.00, C5: 523.25,
  };

  // Long sustained note sequence — very slow, each held for multiple seconds
  private readonly MELODY: Array<[string, number]> = [
    // [note, duration-in-beats at ~30bpm]
    ['G4',  6], ['D4', 4], ['C5', 8], ['A4', 5],
    ['G4',  4], ['F4', 6], ['D4', 8], ['G4', 5],
  ];

  private readonly LOOP_DURATION_SEC = 16.0;

  play(volume = 0.35): void {
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
        this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 3.0);
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

    const loopLen = this.LOOP_DURATION_SEC;
    const beatLen = loopLen / 46; // total beats in MELODY sum

    // Low open-fifth drone: C2 + G2 — entire loop
    this._pad('C2', startAt, loopLen, 0.22);
    this._pad('G2', startAt, loopLen, 0.15);
    this._pad('C3', startAt, loopLen, 0.12);
    this._pad('G3', startAt, loopLen, 0.08);

    // Slow melody
    let cursor = startAt;
    for (const [note, beats] of this.MELODY) {
      const dur = beats * beatLen;
      this._pad(note, cursor, dur, 0.20);
      cursor += dur;
    }

    const msUntilNext = (loopLen - 0.15) * 1000;
    this.loopTimer = setTimeout(() => {
      this.loopTimer = null;
      this._scheduleLoop(startAt + loopLen);
    }, msUntilNext);
  }

  private _pad(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = GreatPlainsTheme.FREQ[note];
    if (freq === undefined) return;

    const attackTime = Math.min(duration * 0.3, 2.0);
    const releaseTime = Math.min(duration * 0.3, 2.0);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + attackTime);
    env.gain.setValueAtTime(amp, when + duration - releaseTime);
    env.gain.linearRampToValueAtTime(0, when + duration);
    env.connect(this.masterGain);

    // Pad = sine + slight detune for shimmer
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;
    osc1.connect(env);
    osc1.start(when);
    osc1.stop(when + duration + 0.05);

    const shimGain = this.ctx.createGain();
    shimGain.gain.value = 0.3;
    shimGain.connect(env);
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * Math.pow(2, 7 / 1200); // +7 cents
    osc2.connect(shimGain);
    osc2.start(when);
    osc2.stop(when + duration + 0.05);
  }
}
