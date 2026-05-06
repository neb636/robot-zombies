/**
 * SFX: ui_confirm — menu action confirmed.
 * Two-note ascending chime. Positive, decisive.
 */
export function playUiConfirm(ctx: AudioContext, dest: AudioNode, amp = 0.40): void {
  const now = ctx.currentTime;

  // Two-note confirm: C5 → E5
  const notes = [523.25, 659.25];

  notes.forEach((freq, i) => {
    const when = now + i * 0.06;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp * (1 - i * 0.2), when + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
    env.connect(dest);

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + 0.14);
  });
}
