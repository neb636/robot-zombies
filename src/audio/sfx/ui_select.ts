/**
 * SFX: ui_select — cursor movement in menu.
 * Tiny tick/click. Near-instant. SNES-style.
 */
export function playUiSelect(ctx: AudioContext, dest: AudioNode, amp = 0.35): void {
  const now = ctx.currentTime;

  const env = ctx.createGain();
  env.gain.setValueAtTime(amp, now);
  env.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  env.connect(dest);

  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = 880; // A5 — bright, crisp
  osc.connect(env);
  osc.start(now);
  osc.stop(now + 0.05);
}
