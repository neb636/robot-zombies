/**
 * SFX: attack_fire — fire/incendiary attack.
 * Whoosh + crackle burst. Organic warmth that burns.
 */
export function playAttackFire(ctx: AudioContext, dest: AudioNode, amp = 0.55): void {
  const now = ctx.currentTime;

  // Noise-based whoosh (lowpass filtered white noise)
  const bufSize = Math.floor(ctx.sampleRate * 0.3);
  const buffer  = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data    = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  const whoosh = ctx.createBufferSource();
  whoosh.buffer = buffer;

  const lpFilter = ctx.createBiquadFilter();
  lpFilter.type = 'lowpass';
  lpFilter.frequency.setValueAtTime(200, now);
  lpFilter.frequency.exponentialRampToValueAtTime(3500, now + 0.05);
  lpFilter.frequency.exponentialRampToValueAtTime(800, now + 0.20);

  const whooshEnv = ctx.createGain();
  whooshEnv.gain.setValueAtTime(0, now);
  whooshEnv.gain.linearRampToValueAtTime(amp * 0.7, now + 0.04);
  whooshEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  whooshEnv.connect(dest);

  whoosh.connect(lpFilter);
  lpFilter.connect(whooshEnv);
  whoosh.start(now);
  whoosh.stop(now + 0.30);

  // Crackle
  const cBufSize = Math.floor(ctx.sampleRate * 0.2);
  const cBuffer  = ctx.createBuffer(1, cBufSize, ctx.sampleRate);
  const cData    = cBuffer.getChannelData(0);
  for (let i = 0; i < cBufSize; i++) {
    cData[i] = (Math.random() < 0.08) ? (Math.random() * 2 - 1) : 0;
  }

  const crackle = ctx.createBufferSource();
  crackle.buffer = cBuffer;

  const crackleEnv = ctx.createGain();
  crackleEnv.gain.setValueAtTime(amp * 0.45, now + 0.04);
  crackleEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  crackleEnv.connect(dest);

  crackle.connect(crackleEnv);
  crackle.start(now + 0.04);
  crackle.stop(now + 0.24);
}
