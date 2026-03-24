/**
 * ProceduralMusic — Web Audio API synthesizer for Silicon Requiem.
 *
 * Generates a harp arpeggio loop inspired by the Final Fantasy IV Prelude:
 * two interleaved ascending/descending streams in A minor, creating a flowing
 * wave effect. Uses audio-rate scheduling (AudioContext.currentTime) for
 * sample-accurate timing — no setTimeout drift.
 *
 * Browser autoplay note: AudioContext starts suspended until the first user
 * gesture. Call play() early; the music begins as soon as the browser unlocks.
 */
export class ProceduralMusic {
  private ctx:        AudioContext | null = null;
  private masterGain: GainNode     | null = null;
  private isPlaying = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Tuning ──────────────────────────────────────────────────────────────

  /** Beats-per-minute for the 16th-note arpeggio. FF4 Prelude runs ~144 BPM. */
  private readonly BPM = 148;

  /**
   * Two interleaved arpeggio streams, exactly as FF4 Prelude alternates two
   * voices. Stream A ascends/descends; Stream B is offset by half a 16th note
   * and traces the same contour from a different position in the arpeggio.
   *
   * Key: A natural minor (A C E G) — same flowing quality as FF4's C major but
   * with the melancholy edge that fits Silicon Requiem.
   *
   * Full shape: A3→C4→E4→G4→A4→C5→E5→G5 up, G5→E5→C5→A4→G4→E4→C4→A3 down.
   */
  private readonly STREAM_A: string[] = [
    'A3','C4','E4','G4','A4','C5','E5','G5',
    'G5','E5','C5','A4','G4','E4','C4','A3',
  ];

  private readonly STREAM_B: string[] = [
    'E4','G4','A4','C5','E5','G5','A5','G5',
    'E5','C5','A4','G4','E4','C4','A3','E3',
  ];

  // ─── Frequency table ─────────────────────────────────────────────────────

  private static readonly FREQ: Record<string, number> = {
    E3: 164.81, A3: 220.00,
    C4: 261.63, E4: 329.63, G4: 392.00, A4: 440.00,
    C5: 523.25, E5: 659.25, G5: 783.99, A5: 880.00,
  };

  // ─── Public API ──────────────────────────────────────────────────────────

  play(volume = 0.38): void {
    if (this.isPlaying) return;

    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);

    this.isPlaying = true;

    // AudioContext may be suspended (browser autoplay policy).
    // Schedule the first loop now; it will execute once the context resumes.
    const startAt = this.ctx.currentTime + 0.05;
    this._scheduleLoop(startAt);

    // Fade in after context unlocks
    const tryFadeIn = (): void => {
      void this.ctx!.resume().then(() => {
        if (!this.masterGain || !this.ctx) return;
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 1.5);
      });
    };

    if (this.ctx.state === 'running') {
      tryFadeIn();
    } else {
      document.addEventListener('pointerdown', tryFadeIn, { once: true });
      document.addEventListener('keydown',     tryFadeIn, { once: true });
    }
  }

  stop(fadeMs = 1200): void {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    this.isPlaying = false;

    if (this.loopTimer !== null) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }

    const fadeSec = fadeMs / 1000;
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeSec);

    const ctxRef = this.ctx;
    setTimeout(() => { void ctxRef.close(); }, fadeMs + 100);
    this.ctx        = null;
    this.masterGain = null;
  }

  setVolume(v: number, rampMs = 200): void {
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.linearRampToValueAtTime(v, this.ctx.currentTime + rampMs / 1000);
  }

  get playing(): boolean { return this.isPlaying; }

  // ─── Scheduling ──────────────────────────────────────────────────────────

  private _scheduleLoop(startAt: number): void {
    if (!this.isPlaying || !this.ctx) return;

    const step    = (60 / this.BPM) / 4;          // 16th-note duration (seconds)
    const loopLen = this.STREAM_A.length * step;   // full pattern duration
    const noteLen = step * 3.2;                    // how long each note rings

    // Stream A — on every 16th-note grid
    this.STREAM_A.forEach((note, i) => {
      this._pluck(note, startAt + i * step, noteLen, 0.42);
    });

    // Stream B — offset by half a 16th note, slightly softer
    this.STREAM_B.forEach((note, i) => {
      this._pluck(note, startAt + (i + 0.5) * step, noteLen, 0.26);
    });

    // Schedule the next loop ~150ms before this one ends to prevent gaps
    const msUntilNext = (loopLen - 0.15) * 1000;
    this.loopTimer = setTimeout(() => {
      this.loopTimer = null;
      this._scheduleLoop(startAt + loopLen);
    }, msUntilNext);
  }

  // ─── Synthesis ───────────────────────────────────────────────────────────

  /**
   * Synthesise a single harp pluck.
   *
   * Signal chain:
   *   [osc1: sine fundamental] ─┐
   *   [osc2: triangle 2nd harm] ─┤─► [gainEnv] ─► [masterGain] ─► out
   *
   * Envelope: near-instant attack → fast exponential decay (plucked string).
   * A light chorusing effect is produced by a second oscillator slightly
   * detuned (+4 cents) that shares the same envelope but at lower amplitude.
   */
  private _pluck(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = ProceduralMusic.FREQ[note];
    if (freq === undefined) return;

    const now = when;

    // Envelope node
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(amp, now + 0.004);          // 4ms attack
    env.gain.setValueAtTime(amp, now + 0.004);
    env.gain.exponentialRampToValueAtTime(amp * 0.22, now + 0.06); // initial snap decay
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);  // tail decay
    env.connect(this.masterGain);

    // Fundamental (sine)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;
    osc1.connect(env);
    osc1.start(now);
    osc1.stop(now + duration + 0.02);

    // Chorus twin (+4 cents, ~40% as loud via separate gain)
    const chorusGain = this.ctx.createGain();
    chorusGain.gain.value = 0.38;
    chorusGain.connect(env);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * Math.pow(2, 4 / 1200); // +4 cents
    osc2.connect(chorusGain);
    osc2.start(now);
    osc2.stop(now + duration + 0.02);

    // 2nd harmonic (triangle at 2× freq, much quieter, dies fast)
    const harmGain = this.ctx.createGain();
    harmGain.gain.value = 0.12;
    harmGain.connect(env);

    const osc3 = this.ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.value = freq * 2;
    osc3.connect(harmGain);
    osc3.start(now);
    osc3.stop(now + duration * 0.35 + 0.01);
  }
}
