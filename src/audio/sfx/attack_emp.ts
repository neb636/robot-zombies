/**
 * SFX: attack_emp — electromagnetic pulse discharge.
 * Rising zap + high-frequency crackle. EMP = electronic disruption.
 */
export function playAttackEmp(ctx: AudioContext, dest: AudioNode, amp = 0.55): void {
  const now = ctx.currentTime;

  // Rising zap tone
  const zapEnv = ctx.createGain();
  zapEnv.gain.setValueAtTime(0, now);
  zapEnv.gain.linearRampToValueAtTime(amp, now + 0.01);
  zapEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
  zapEnv.connect(dest);

  const zap = ctx.createOscillator();
  zap.type = 'sawtooth';
  zap.frequency.setValueAtTime(300, now);
  zap.frequency.exponentialRampToValueAtTime(3200, now + 0.12);
  zap.frequency.exponentialRampToValueAtTime(800, now + 0.25);
  zap.connect(zapEnv);
  zap.start(now);
  zap.stop(now + 0.27);

  // High crackle noise
  const bufSize = Math.floor(ctx.sampleRate * 0.15);
  const buffer  = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data    = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() < 0.05) ? (Math.random() * 2 - 1) : 0;
  }

  const crackle = ctx.createBufferSource();
  crackle.buffer = buffer;

  const highPass = ctx.createBiquadFilter();
  highPass.type = 'highpass';
  highPass.frequency.value = 4000;

  const crackleEnv = ctx.createGain();
  crackleEnv.gain.setValueAtTime(amp * 0.5, now);
  crackleEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  crackleEnv.connect(dest);

  crackle.connect(highPass);
  highPass.connect(crackleEnv);
  crackle.start(now);
  crackle.stop(now + 0.17);
}
