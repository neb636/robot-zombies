/**
 * Battle (Boss) theme — tense, irregular meter.
 * 7/8 time feel (3+2+2 subdivision), C minor. Relentless.
 * The meter displacement keeps you off-balance — intentional.
 */
export class BattleBossTheme {
  private ctx:        AudioContext | null = null;
  private masterGain: GainNode     | null = null;
  private isPlaying = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly BPM = 152;

  private static readonly FREQ: Record<string, number> = {
    C2:  65.41, G2: 98.00,  C3: 130.81, Eb3: 155.56, F3: 174.61,
    G3:  196.00, Ab3: 207.65, Bb3: 233.08, C4: 261.63, D4: 293.66,
    Eb4: 311.13, F4: 349.23, G4:  392.00, Ab4: 415.30, Bb4: 466.16,
    C5:  523.25, Eb5: 622.25,
  };

  // 7/8 pattern = 7 16th notes. 4 bars = 28 16th notes.
  // Melody distributed across irregular beats
  private readonly MELODY: Array<string | null> = [
    'C5','Eb5',null,'Bb4',null,'G4',null,   // bar 1
    'F4',null,'Ab4',null,'G4',null,'Eb4',   // bar 2
    'C5',null,'Bb4','G4',null,'Ab4',null,   // bar 3
    'F4','Eb4',null,'G4',null,'C5',null,    // bar 4
  ];

  // Driving bass, 7/8 pattern
  private readonly BASS: string[] = [
    'C2','C2','G2','C2','G2','C2','G2',
    'C2','G2','C2','G2','C2','Eb3','C2',
    'C2','C3','G2','C2','Ab2','C2','G2',
    'C2','Eb3','G2','C2','G2','C2','Bb2',
  ];

  // Kick on irregular accent pattern
  private readonly ACCENT: number[] = [
    1,0,0,1,0,1,0, 1,0,0,1,0,1,0,
    1,0,1,0,0,1,0, 1,0,0,1,0,0,1,
  ];

  play(volume = 0.48): void {
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
        this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.6);
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

    const step    = (60 / this.BPM) / 4;  // 16th note
    const loopLen = this.ACCENT.length * step;

    this.ACCENT.forEach((v, i) => {
      if (v) this._kick(startAt + i * step, 0.60);
    });

    this.BASS.forEach((note, i) => {
      this._bassNote(note, startAt + i * step, step * 0.85, 0.38);
    });

    this.MELODY.forEach((note, i) => {
      if (note !== null) {
        this._lead(note, startAt + i * step, step * 1.8, 0.32);
      }
    });

    const msUntilNext = (loopLen - 0.15) * 1000;
    this.loopTimer = setTimeout(() => {
      this.loopTimer = null;
      this._scheduleLoop(startAt + loopLen);
    }, msUntilNext);
  }

  private _kick(when: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(amp, when);
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);
    env.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, when);
    osc.frequency.exponentialRampToValueAtTime(45, when + 0.12);
    osc.connect(env);
    osc.start(when);
    osc.stop(when + 0.16);
  }

  private _bassNote(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = BattleBossTheme.FREQ[note];
    if (freq === undefined) return;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    env.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  private _lead(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = BattleBossTheme.FREQ[note];
    if (freq === undefined) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3000;
    filter.connect(this.masterGain);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + 0.005);
    env.gain.setValueAtTime(amp * 0.8, when + 0.02);
    env.gain.linearRampToValueAtTime(0, when + duration);
    env.connect(filter);

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }
}
