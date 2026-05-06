/**
 * Battle (Final) — Elise Voss theme.
 * Ties in the Boston motif (D minor low drone + sparse piano) then
 * builds into a full boss-scale drive. Three-phase feel in one loop:
 *   Phase 1 (0–8s): Boston echo — drone + sparse piano in D minor
 *   Phase 2 (8–16s): Rising tension — add strings-like pads
 *   Phase 3 (16–24s): Full drive — drums + lead over the drone
 * The drone from Boston never stops. Continuity is the horror.
 */
export class BattleFinalTheme {
  private ctx:        AudioContext | null = null;
  private masterGain: GainNode     | null = null;
  private isPlaying = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly BPM = 130;

  private static readonly FREQ: Record<string, number> = {
    D2: 73.42,  A2: 110.00, D3: 146.83, F3:  174.61, A3: 220.00,
    C4: 261.63, D4: 293.66, F4: 349.23, A4:  440.00, C5: 523.25,
    D5: 587.33, F5: 698.46, A5: 880.00,
  };

  // Boston motif (sparse piano) — first 8 bars
  private readonly BOSTON_MOTIF: Array<[string | null, number]> = [
    ['D4', 0], ['F4', 2], ['A4', 4], [null, 6],
    ['C5', 8], ['A4', 10],[null, 12],['F4', 13],
    ['D4', 15],
  ];

  // Lead melody for phase 3 (mapped to 16th-note offsets from phase 3 start)
  private readonly DRIVE_MELODY: Array<string | null> = [
    'D5','F5',null,'A5',null,'F5','D5',null,
    'C5',null,'A4','C5',null,'A4','F4',null,
    'D5',null,'F5',null,'A5',null,'C5',null,
    'D5','A4',null,'D5',null,'F5',null,'D5',
  ];

  // Kick pattern for phase 3
  private readonly KICK: number[] = [
    1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,
    1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,
  ];

  private readonly LOOP_DURATION_SEC = 24.0;

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
        this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 1.0);
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

    const loopLen  = this.LOOP_DURATION_SEC;
    const p2Start  = startAt + 8.0;
    const p3Start  = startAt + 16.0;
    const step     = (60 / this.BPM) / 4;

    // ── Phase 1: Boston echo (0–8s) ─────────────────────────────────────────
    // Drone — runs the whole loop
    this._drone('D2', startAt, loopLen, 0.28);
    this._drone('A2', startAt, loopLen, 0.16);

    // Sparse Boston motif piano
    this.BOSTON_MOTIF.forEach(([note, offset]) => {
      if (note !== null) {
        const when = startAt + offset * step;
        this._piano(note, when, step * 3.5, 0.24);
      }
    });

    // ── Phase 2: Rising tension (8–16s) ─────────────────────────────────────
    this._pad('D3', p2Start, 8.0, 0.14);
    this._pad('F3', p2Start, 8.0, 0.10);
    this._pad('A3', p2Start, 8.0, 0.08);
    this._pad('C4', p2Start + 2.0, 6.0, 0.10);

    // ── Phase 3: Full drive (16–24s) ─────────────────────────────────────────
    this.KICK.forEach((v, i) => {
      if (v) this._kick(p3Start + i * step, 0.55);
    });

    this.DRIVE_MELODY.forEach((note, i) => {
      if (note !== null) {
        this._lead(note, p3Start + i * step, step * 2.0, 0.28);
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
    const freq = BattleFinalTheme.FREQ[note];
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
  }

  private _piano(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = BattleFinalTheme.FREQ[note];
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

  private _pad(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = BattleFinalTheme.FREQ[note];
    if (freq === undefined) return;
    const attackTime  = Math.min(duration * 0.3, 2.0);
    const releaseTime = Math.min(duration * 0.3, 2.0);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + attackTime);
    env.gain.setValueAtTime(amp, when + duration - releaseTime);
    env.gain.linearRampToValueAtTime(0, when + duration);
    env.connect(this.masterGain);
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + duration + 0.05);
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

  private _lead(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = BattleFinalTheme.FREQ[note];
    if (freq === undefined) return;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + 0.008);
    env.gain.setValueAtTime(amp * 0.8, when + 0.02);
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
