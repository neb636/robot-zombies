/**
 * Battle (Normal) theme — driving 4/4 rhythm.
 * E minor, 140 BPM. Punchy kick, square-wave bass, urgent melody.
 * Modeled on SNES ATB battle energy without being pastiche.
 */
export class BattleNormalTheme {
  private ctx:        AudioContext | null = null;
  private masterGain: GainNode     | null = null;
  private isPlaying = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly BPM = 140;

  private static readonly FREQ: Record<string, number> = {
    E2: 82.41, B2: 123.47, E3: 164.81, G3: 196.00, A3: 220.00,
    B3: 246.94, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
    B4: 493.88, D5: 587.33, E5: 659.25,
  };

  // Melody — 8-bar phrase in E minor
  private readonly MELODY: Array<string | null> = [
    'E4', null,'G4', null,'A4','G4','E4', null,
    'B4', null,'A4', null,'G4', null,'E4', null,
    'D5', null,'B4', null,'A4','G4','E4','D4',
    'E4','G4','A4','B4','A4','G4','E4', null,
  ];

  // Bass line — 8th notes, driving
  private readonly BASS: string[] = [
    'E2','E2','B2','E2','E2','E2','A2','B2',
    'E2','E2','B2','E2','G2','E2','A2','E2',
    'E2','E2','D2','E2','B2','E2','A2','G2',
    'E2','G2','A2','B2','A2','G2','E2','E2',
  ];

  // Kick pattern — 1 and 3 with offbeat hits
  private readonly KICK_PATTERN: number[] = [
    1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,
    1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,
  ];

  // Snare on 2 and 4
  private readonly SNARE_PATTERN: number[] = [
    0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,
    0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,
  ];

  play(volume = 0.45): void {
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
        this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.8);
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
    const loopLen = this.KICK_PATTERN.length * step;

    // Drums
    this.KICK_PATTERN.forEach((v, i) => {
      if (v) this._kick(startAt + i * step, 0.55);
    });
    this.SNARE_PATTERN.forEach((v, i) => {
      if (v) this._snare(startAt + i * step, 0.35);
    });

    // Bass (8th notes = every other 16th)
    this.BASS.forEach((note, i) => {
      this._bassNote(note, startAt + i * step * 2, step * 1.8, 0.40);
    });

    // Melody
    this.MELODY.forEach((note, i) => {
      if (note !== null) {
        this._lead(note, startAt + i * step, step * 2.5, 0.30);
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
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
    env.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, when);
    osc.frequency.exponentialRampToValueAtTime(40, when + 0.15);
    osc.connect(env);
    osc.start(when);
    osc.stop(when + 0.20);
  }

  private _snare(when: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    // Noise burst
    const bufSize = Math.floor(this.ctx.sampleRate * 0.15);
    const buffer  = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data    = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1500;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(amp, when);
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
    env.connect(this.masterGain);

    src.connect(filter);
    filter.connect(env);
    src.start(when);
    src.stop(when + 0.15);
  }

  private _bassNote(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = BattleNormalTheme.FREQ[note];
    if (freq === undefined) return;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + 0.005);
    env.gain.setValueAtTime(amp * 0.7, when + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    env.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  private _lead(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = BattleNormalTheme.FREQ[note];
    if (freq === undefined) return;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + 0.008);
    env.gain.setValueAtTime(amp, when + duration - 0.02);
    env.gain.linearRampToValueAtTime(0, when + duration);
    env.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }
}
