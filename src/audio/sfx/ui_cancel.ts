/**
 * SFX: ui_cancel — menu action cancelled / back.
 * Descending two-note. Lower, softer than confirm.
 */
export function playUiCancel(ctx: AudioContext, dest: AudioNode, amp = 0.35): void {
  const now = ctx.currentTime;

  // Descending: E5 → C5
  const notes = [659.25, 523.25];

  notes.forEach((freq, i) => {
    const when = now + i * 0.055;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp * (1 - i * 0.3), when + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.10);
    env.connect(dest);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + 0.12);
  });
}
