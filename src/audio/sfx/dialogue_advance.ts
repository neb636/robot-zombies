/**
 * SFX: dialogue_advance — dialogue box advances to next line.
 * Very subtle click-tick. Should be quiet and non-intrusive.
 */
export function playDialogueAdvance(ctx: AudioContext, dest: AudioNode, amp = 0.20): void {
  const now = ctx.currentTime;

  const env = ctx.createGain();
  env.gain.setValueAtTime(amp, now);
  env.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  env.connect(dest);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 1200;
  osc.connect(env);
  osc.start(now);
  osc.stop(now + 0.035);
}
