/**
 * SFX: defeat — battle lost stinger.
 * Descending tritone groan. No hope — just the fall.
 */
export function playDefeat(ctx: AudioContext, dest: AudioNode, amp = 0.50): void {
  const now = ctx.currentTime;

  // Descending tritone: G3 → Db3 (diminished — failure and wrong)
  const descent: [number, number][] = [
    [392.00, 0.00],
    [349.23, 0.18],
    [293.66, 0.38],
    [277.18, 0.60], // Db4
    [220.00, 0.84],
    [138.59, 1.10], // Db3 — bottom of the fall
  ];

  descent.forEach(([freq, offset]) => {
    const when = now + offset;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp * (1 - offset * 0.35), when + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.30);
    env.connect(dest);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + 0.35);
  });

  // Long low rumble tail
  const tailStart = now + 1.20;
  const tailEnv   = ctx.createGain();
  tailEnv.gain.setValueAtTime(amp * 0.4, tailStart);
  tailEnv.gain.exponentialRampToValueAtTime(0.0001, tailStart + 1.2);
  tailEnv.connect(dest);

  const tail = ctx.createOscillator();
  tail.type = 'sine';
  tail.frequency.setValueAtTime(80, tailStart);
  tail.frequency.exponentialRampToValueAtTime(40, tailStart + 1.0);
  tail.connect(tailEnv);
  tail.start(tailStart);
  tail.stop(tailStart + 1.25);
}
