/**
 * SFX: heal — restorative chime sweep.
 * Ascending arpeggiated sine tones. Warm and hopeful.
 */
export function playHeal(ctx: AudioContext, dest: AudioNode, amp = 0.5): void {
  const now = ctx.currentTime;

  // G major arpeggio ascending: G4 B4 D5 G5
  const notes = [392.00, 493.88, 587.33, 783.99];

  notes.forEach((freq, i) => {
    const when = now + i * 0.07;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp * (1 - i * 0.15), when + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.35);
    env.connect(dest);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + 0.38);

    // Shimmer partial
    const shimGain = ctx.createGain();
    shimGain.gain.value = 0.2;
    shimGain.connect(env);
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * Math.pow(2, 5 / 1200);
    osc2.connect(shimGain);
    osc2.start(when);
    osc2.stop(when + 0.38);
  });
}
