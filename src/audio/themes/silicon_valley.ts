/**
 * Silicon Valley theme — utopia horror; pristine bells, major-key but sour.
 * C# major (C# D# F F# G# A# C#) — perfect and slightly wrong.
 * Everything sounds optimized. The dissonance is subtle but cumulative.
 */
export class SiliconValleyTheme {
  private ctx:        AudioContext | null = null;
  private masterGain: GainNode     | null = null;
  private isPlaying = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly BPM = 120;

  private static readonly FREQ: Record<string, number> = {
    Cs4: 277.18, Ds4: 311.13, F4:  349.23, Fs4: 369.99,
    Gs4: 415.30, As4: 466.16, Cs5: 554.37, Ds5: 622.25,
    F5:  698.46, Gs5: 830.61, As5: 932.33, Cs6: 1108.73,
  };

  // Bright arpeggio ascending — C# major with added sharp 4 (F natural = tritone)
  private readonly BELLS_A: string[] = [
    'Cs4','Gs4','Cs5','Gs5','Cs6','Gs5','Cs5','Gs4',
    'Cs4','Ds4','As4','Ds5','As5','Ds5','As4','Ds4',
  ];

  // Counter-melody with sour tritone emphasis
  private readonly BELLS_B: string[] = [
    'F4', 'Cs5','F5', 'Cs5','F4', 'Cs5','F5', 'Cs5',
    'F4', 'Fs4','F5', 'Fs4','Cs5','Fs4','Cs5','F4',
  ];

  play(volume = 0.36): void {
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
        this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 1.5);
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

    const step    = (60 / this.BPM) / 4;           // 16th note
    const loopLen = this.BELLS_A.length * step;

    // A and B interleaved — exactly like the title theme's two streams
    this.BELLS_A.forEach((note, i) => {
      this._bell(note, startAt + i * step, step * 4, 0.32);
    });

    this.BELLS_B.forEach((note, i) => {
      this._bell(note, startAt + (i + 0.5) * step, step * 4, 0.18);
    });

    // Subtle pad — pure and cold
    this._pad('Cs4', startAt, loopLen, 0.12);
    this._pad('Gs4', startAt, loopLen, 0.08);

    const msUntilNext = (loopLen - 0.15) * 1000;
    this.loopTimer = setTimeout(() => {
      this.loopTimer = null;
      this._scheduleLoop(startAt + loopLen);
    }, msUntilNext);
  }

  private _bell(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = SiliconValleyTheme.FREQ[note];
    if (freq === undefined) return;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + 0.002);  // instant attack
    env.gain.exponentialRampToValueAtTime(amp * 0.4, when + 0.05);
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    env.connect(this.masterGain);

    // Sine for fundamental purity
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;
    osc1.connect(env);
    osc1.start(when);
    osc1.stop(when + duration + 0.02);

    // Inharmonic partial — creates metallic bell quality
    const partialGain = this.ctx.createGain();
    partialGain.gain.value = 0.22;
    partialGain.connect(env);
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2.756; // classic bell inharmonic
    osc2.connect(partialGain);
    osc2.start(when);
    osc2.stop(when + duration * 0.4);
  }

  private _pad(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = SiliconValleyTheme.FREQ[note];
    if (freq === undefined) return;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + 0.5);
    env.gain.setValueAtTime(amp, when + duration - 0.5);
    env.gain.linearRampToValueAtTime(0, when + duration);
    env.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + duration + 0.05);
  }
}
