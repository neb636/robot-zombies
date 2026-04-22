/**
 * SFX: level_up — character level up fanfare.
 * Ascending arpeggio + held chord. Celebratory but short.
 */
export function playLevelUp(ctx: AudioContext, dest: AudioNode, amp = 0.55): void {
  const now = ctx.currentTime;

  // Quick ascending C major scale (C4 E4 G4 C5) then hold C major chord
  const ascent = [261.63, 329.63, 392.00, 523.25];
  ascent.forEach((freq, i) => {
    const when = now + i * 0.06;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amp * 0.7, when + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
    env.connect(dest);

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(when);
    osc.stop(when + 0.20);
  });

  // Final chord: C5 E5 G5 — held
  const chordStart = now + ascent.length * 0.06;
  const chordNotes = [523.25, 659.25, 783.99];

  chordNotes.forEach((freq) => {
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, chordStart);
    env.gain.linearRampToValueAtTime(amp * 0.5, chordStart + 0.01);
    env.gain.setValueAtTime(amp * 0.5, chordStart + 0.4);
    env.gain.exponentialRampToValueAtTime(0.0001, chordStart + 0.65);
    env.connect(dest);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start(chordStart);
    osc.stop(chordStart + 0.68);
  });
}
