/**
 * SFX: attack_physical — short percussive thud + noise burst.
 * Models a melee impact. One-shot, under 50ms trigger.
 */
export function playAttackPhysical(ctx: AudioContext, dest: AudioNode, amp = 0.6): void {
  const now = ctx.currentTime;

  // Thud: sine pitched down fast
  const thudEnv = ctx.createGain();
  thudEnv.gain.setValueAtTime(amp, now);
  thudEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  thudEnv.connect(dest);

  const thud = ctx.createOscillator();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(200, now);
  thud.frequency.exponentialRampToValueAtTime(60, now + 0.10);
  thud.connect(thudEnv);
  thud.start(now);
  thud.stop(now + 0.14);

  // Noise burst: impact texture
  const bufSize = Math.floor(ctx.sampleRate * 0.08);
  const buffer  = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data    = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 800;
  noiseFilter.Q.value = 1.5;

  const noiseEnv = ctx.createGain();
  noiseEnv.gain.setValueAtTime(amp * 0.4, now);
  noiseEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  noiseEnv.connect(dest);

  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseEnv);
  noiseSrc.start(now);
  noiseSrc.stop(now + 0.09);
}
