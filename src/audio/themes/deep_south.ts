/**
 * Deep South theme — jazz; walking bass, muted trumpet stab.
 * Bb blues scale (Bb C Db D F Ab). Slow swing feel.
 * Moral complexity: the chord keeps shifting under your feet.
 */
export class DeepSouthTheme {
  private ctx:        AudioContext | null = null;
  private masterGain: GainNode     | null = null;
  private isPlaying = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly BPM = 80;

  private static readonly FREQ: Record<string, number> = {
    Bb2: 116.54, C3: 130.81, Db3: 138.59, D3: 146.83, F3: 174.61, Ab3: 207.65,
    Bb3: 233.08, C4: 261.63, Db4: 277.18, D4: 293.66, F4: 349.23, Ab4: 415.30,
    Bb4: 466.16, C5: 523.25, D5: 587.33,
  };

  // Walking bass line — 4/4 swing, one note per beat
  private readonly BASS: string[] = [
    'Bb2','D3','F3','Ab3',  'Bb2','C3','D3','F3',
    'Bb2','Ab3','F3','D3',  'Bb2','C3','Db3','Bb2',
  ];

  // Trumpet stabs — sparse, syncopated
  private readonly STABS: Array<[number, string, number]> = [
    // [beat-offset, note, duration-beats]
    [0.5, 'Bb4', 0.4], [2.0, 'D5', 0.3], [3.5, 'F4', 0.5],
    [4.5, 'Ab4', 0.3], [6.0, 'Bb4', 0.6], [7.5, 'D5', 0.4],
    [9.0, 'Bb4', 0.3], [11.5,'F4',  0.4], [13.0,'Ab4', 0.5],
    [15.0,'Bb4', 0.8],
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

    const beat    = 60 / this.BPM;
    const loopLen = this.BASS.length * beat;

    // Walking bass
    this.BASS.forEach((note, i) => {
      this._bass(note, startAt + i * beat, beat * 0.85, 0.38);
    });

    // Muted trumpet stabs
    this.STABS.forEach(([offset, note, dur]) => {
      this._trumpet(note, startAt + offset * beat, dur * beat, 0.28);
    });

    const msUntilNext = (loopLen - 0.15) * 1000;
    this.loopTimer = setTimeout(() => {
      this.loopTimer = null;
      this._scheduleLoop(startAt + loopLen);
    }, msUntilNext);
  }

  private _bass(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = DeepSouthTheme.FREQ[note];
    if (freq === undefined) return;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + 0.01);
    env.gain.setValueAtTime(amp * 0.7, when + 0.05);
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    env.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + duration + 0.02);

    // Round plucked quality
    const hGain = this.ctx.createGain();
    hGain.gain.value = 0.2;
    hGain.connect(env);
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;
    osc2.connect(hGain);
    osc2.start(when);
    osc2.stop(when + Math.min(0.08, duration));
  }

  private _trumpet(note: string, when: number, duration: number, amp: number): void {
    if (!this.ctx || !this.masterGain) return;
    const freq = DeepSouthTheme.FREQ[note];
    if (freq === undefined) return;

    // Muted trumpet = square wave through a lowpass filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800;
    filter.Q.value = 2;
    filter.connect(this.masterGain);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + 0.02);
    env.gain.setValueAtTime(amp, when + duration - 0.04);
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
