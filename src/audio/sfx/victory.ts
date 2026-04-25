/**
 * SFX: victory — battle won fanfare.
 * Short jingle — 4 notes up, final chord. Under 1.5s.
 */
export function playVictory(ctx: AudioContext, dest: AudioNode, amp = 0.55): void {
  const now = ctx.currentTime;

  // A minor → resolved in A major (bittersweet — we won, but at cost)
  // A4 C5 E5 A5, then A major chord
  const jingle: [number, number][] = [
    [440.00, 0.00],
    [523.25, 0.10],
    [659.25, 0.20],
    [880.00, 0.30],
    [659.25, 0.50], // walk back
    [880.00, 0.65], // resolve high
  ];

  jingle.forEach(([freq, offset]) => {
    const when = now + offset;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp * 0.65, when + 0.008);
    env.gain.setValueAtTime(amp * 0.65, when + 0.07);
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    env.connect(dest);

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + 0.25);
  });

  // Final A major chord (A4 C#5 E5)
  const chordStart = now + 0.90;
  const chordNotes = [440.00, 554.37, 659.25];
  chordNotes.forEach((freq) => {
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, chordStart);
    env.gain.linearRampToValueAtTime(amp * 0.5, chordStart + 0.015);
    env.gain.setValueAtTime(amp * 0.5, chordStart + 0.35);
    env.gain.exponentialRampToValueAtTime(0.0001, chordStart + 0.70);
    env.connect(dest);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(chordStart);
    osc.stop(chordStart + 0.72);
  });
}
