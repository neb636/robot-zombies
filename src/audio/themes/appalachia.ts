/**
 * Appalachia theme — folk; acoustic arpeggio, warm but uneasy.
 * G mixolydian scale (G A B C D E F). Fingerpicked banjo-style pattern.
 * The warmth is real, but the F natural keeps it unsettled.
 */
export class AppalachiaTheme {
  private ctx:        AudioContext | null = null;
  private masterGain: GainNode     | null = null;
  private isPlaying = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly BPM = 108;

  private static readonly FREQ: Record<string, number> = {
    G2: 98.00, D3: 146.83, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
    A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33,
  };

  // Banjo-style arpeggio pattern — forward then drop-thumb
  private readonly PATTERN: string[] = [
    'G3','D4','G4','B4','D5','B4','G4','D4',
    'G3','D4','A4','C5','D5','C5','A4','D4',
    'G3','D4','G4','B4','F4','B4','G4','D4',
    'G2','D3','G3','D4','G4','D4','G3','D3',
  ];

  play(volume = 0.42): void {
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
    const loopLen = this.PATTERN.length * step;

    // Bass drone on 1 and 3
    this._bassNote('G2', startAt, step * 2, 0.35);
    this._bassNote('G2', startAt + step * 8,  step * 2, 0.35);
    this._bassNote('G2', startAt + step * 16, step * 2, 0.35);
    this._bassNote('G2', startAt + step * 24, step * 2, 0.35);

    this.PATTERN.forEach((note, i) => {
      const amp = (i % 8 === 0) ? 0.38 : 0.22;    // accent beat 1
      this._pluck(note, startAt + i * step, step * 2.5, amp);
    });

    const msUntilNext = (loopLen - 0.15) * 1000;
    this.loopTimer = setTimeout(() => {
      this.loopTimer = null;
      this._scheduleLoop(startAt + loopLen);
    }, msUntilNext);
  }

  private _pluck(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = AppalachiaTheme.FREQ[note];
    if (freq === undefined) return;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + 0.003);
    env.gain.exponentialRampToValueAtTime(amp * 0.25, when + 0.05);
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    env.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + duration + 0.02);

    // Bright pluck harmonic
    const hGain = this.ctx.createGain();
    hGain.gain.value = 0.15;
    hGain.connect(env);
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = freq * 2;
    osc2.connect(hGain);
    osc2.start(when);
    osc2.stop(when + duration * 0.3);
  }

  private _bassNote(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = AppalachiaTheme.FREQ[note];
    if (freq === undefined) return;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + 0.01);
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
