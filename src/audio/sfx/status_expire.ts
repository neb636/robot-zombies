/**
 * SFX: status_expire — status effect wore off.
 * Short rising pop — something releasing, a snap back to normal.
 */
export function playStatusExpire(ctx: AudioContext, dest: AudioNode, amp = 0.40): void {
  const now = ctx.currentTime;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(amp, now + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  env.connect(dest);

  // Rising pitch pop
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.10);
  osc.connect(env);
  osc.start(now);
  osc.stop(now + 0.20);

  // Brief noise click for snap texture
  const bufSize = Math.floor(ctx.sampleRate * 0.02);
  const buffer  = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data    = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  const click = ctx.createBufferSource();
  click.buffer = buffer;

  const clickEnv = ctx.createGain();
  clickEnv.gain.setValueAtTime(amp * 0.3, now);
  clickEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
  clickEnv.connect(dest);

  click.connect(clickEnv);
  click.start(now);
  click.stop(now + 0.025);
}
