/**
 * Rockies theme — ambient; wind + soft pad.
 * E major pentatonic (E F# G# B C#). Open and vast.
 * The breath before the final push. Rest that isn't quite rest.
 */
export class RockiesTheme {
  private ctx:        AudioContext | null = null;
  private masterGain: GainNode     | null = null;
  private noiseNode:  AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  private static readonly FREQ: Record<string, number> = {
    E3: 164.81, Gb3: 185.00, Ab3: 207.65, B3: 246.94, Db4: 277.18,
    E4: 329.63, Gb4: 369.99, Ab4: 415.30, B4: 493.88, Db5: 554.37, E5: 659.25,
  };

  // Very slow, sparse melody — wide intervals
  private readonly MELODY: Array<[string, number]> = [
    ['E4', 5], ['B4', 4], ['Gb4', 3], ['E5', 7],
    ['Db5', 4], ['B4', 5], ['Ab4', 3], ['E4', 7],
    ['Gb4', 4], ['B4', 6], ['E5', 8],
  ];

  private readonly LOOP_DURATION_SEC = 20.0;

  play(volume = 0.38): void {
    if (this.isPlaying) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);
    this.isPlaying = true;

    this._startWind();

    const startAt = this.ctx.currentTime + 0.05;
    this._scheduleLoop(startAt);

    const tryFadeIn = (): void => {
      void this.ctx!.resume().then(() => {
        if (!this.masterGain || !this.ctx) return;
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 2.5);
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
    if (this.noiseNode) { try { this.noiseNode.stop(); } catch { /* already stopped */ } this.noiseNode = null; }
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

  private _startWind(): void {
    if (!this.ctx || !this.masterGain) return;

    // White noise through a bandpass — high-frequency wind texture
    const bufSize = this.ctx.sampleRate * 2;
    const buffer  = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data    = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    this.noiseNode = src;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2200;
    filter.Q.value = 0.5;

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.08;

    src.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.masterGain);
    src.start();
  }

  private _scheduleLoop(startAt: number): void {
    if (!this.isPlaying || !this.ctx) return;

    const loopLen  = this.LOOP_DURATION_SEC;
    const totalBeats = this.MELODY.reduce((s, [, b]) => s + b, 0);
    const beatLen  = loopLen / totalBeats;

    // Low pad foundation
    this._pad('E3', startAt, loopLen, 0.14);
    this._pad('B3', startAt, loopLen, 0.10);

    let cursor = startAt;
    for (const [note, beats] of this.MELODY) {
      const dur = beats * beatLen;
      this._pad(note, cursor, dur, 0.18);
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
    const freq = RockiesTheme.FREQ[note];
    if (freq === undefined) return;

    const attackTime  = Math.min(duration * 0.35, 2.5);
    const releaseTime = Math.min(duration * 0.35, 2.5);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp, when + attackTime);
    env.gain.setValueAtTime(amp, when + duration - releaseTime);
    env.gain.linearRampToValueAtTime(0, when + duration);
    env.connect(this.masterGain);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;
    osc1.connect(env);
    osc1.start(when);
    osc1.stop(when + duration + 0.05);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * Math.pow(2, 5 / 1200); // +5 cents shimmer
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.25;
    g2.connect(env);
    osc2.connect(g2);
    osc2.start(when);
    osc2.stop(when + duration + 0.05);
  }
}
