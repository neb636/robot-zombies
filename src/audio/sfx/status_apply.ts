/**
 * SFX: status_apply — status effect applied (stun/burn/hack/etc).
 * A low warble descending — something attaching, unwanted.
 */
export function playStatusApply(ctx: AudioContext, dest: AudioNode, amp = 0.45): void {
  const now = ctx.currentTime;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(amp, now + 0.02);
  env.gain.setValueAtTime(amp, now + 0.08);
  env.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);
  env.connect(dest);

  // Descending warble
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);
  osc.connect(env);
  osc.start(now);
  osc.stop(now + 0.32);

  // Sub-tone pulse
  const subEnv = ctx.createGain();
  subEnv.gain.setValueAtTime(amp * 0.35, now);
  subEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);
  subEnv.connect(dest);

  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(120, now);
  sub.frequency.linearRampToValueAtTime(60, now + 0.18);
  sub.connect(subEnv);
  sub.start(now);
  sub.stop(now + 0.22);
}
