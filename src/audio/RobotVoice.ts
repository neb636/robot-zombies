/**
 * RobotVoice — eSpeak-NG WASM-backed TTS with Web Audio ring modulation.
 *
 * eSpeak already sounds synthetic at low pitch; ring modulation adds the
 * classic carrier-wave "robot voice" effect by multiplying the speech signal
 * against a low-frequency sine oscillator.  This splits each frequency into
 * two sidebands and removes the original — the sound that defined HAL 9000
 * and every sci-fi android voice for 40 years.
 *
 * Lazy-initialises on first call so the WASM worker only loads when a robot
 * actually speaks.
 */

// ─── Global type shim for window.SimpleTTS ────────────────────────────────

interface _SimpleTTSOpts {
  workerPath?: string;
}

interface _SimpleTTSSpeakOpts {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface _SimpleTTSInst {
  onReady(cb: (err?: Error) => void): void;
  speak(
    text: string,
    opts: _SimpleTTSSpeakOpts,
    callback: (audioData: Float32Array | null, sampleRate: number) => void
  ): void;
}

declare global {
  interface Window {
    SimpleTTS: new (opts?: _SimpleTTSOpts) => _SimpleTTSInst;
  }
}

// ─── Profile ───────────────────────────────────────────────────────────────

export interface RobotProfile {
  /** eSpeak words-per-minute style rate.  Default 175; lower = slower/more ominous. */
  rate:     number;
  /** eSpeak pitch 0–100.  0 = lowest possible. */
  pitch:    number;
  volume:   number;
  /** Apply ring modulation carrier wave (true for robots; false for system announcements). */
  ringMod:  boolean;
  /** Carrier frequency in Hz.  50–100 Hz gives a buzzy organic quality; 120+ is colder. */
  ringFreq: number;
}

// ─── Module-level singletons ────────────────────────────────────────────────

const BASE       = import.meta.env.BASE_URL;
const SCRIPT_SRC = `${BASE}espeak/espeakng-simple.js`;
const WORKER_SRC = `${BASE}espeak/espeakng.worker.js`;

let _scriptReady: Promise<void> | null = null;
let _ttsReady: Promise<_SimpleTTSInst> | null = null;
let _ctx: AudioContext | null = null;
let _currentSource: AudioBufferSourceNode | null = null;
let _currentOsc: OscillatorNode | null = null;

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadScript(): Promise<void> {
  if (_scriptReady) return _scriptReady;
  _scriptReady = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${SCRIPT_SRC}`));
    document.head.appendChild(s);
  });
  return _scriptReady;
}

function initTTS(): Promise<_SimpleTTSInst> {
  if (_ttsReady) return _ttsReady;
  _ttsReady = loadScript().then(() => new Promise<_SimpleTTSInst>((resolve, reject) => {
    const inst = new window.SimpleTTS({ workerPath: WORKER_SRC });
    inst.onReady((err) => {
      if (err) reject(err);
      else     resolve(inst);
    });
  }));
  return _ttsReady;
}

function audioCtx(): AudioContext {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new AudioContext();
  }
  if (_ctx.state === 'suspended') void _ctx.resume();
  return _ctx;
}

// ─── Playback ───────────────────────────────────────────────────────────────

function playAudio(audioData: Float32Array, sampleRate: number, profile: RobotProfile): void {
  const ctx = audioCtx();

  // Stop anything already playing.
  try { _currentSource?.stop(); } catch (_) { /* already stopped */ }
  try { _currentOsc?.stop();    } catch (_) { /* already stopped */ }

  const buffer = ctx.createBuffer(1, audioData.length, sampleRate);
  buffer.getChannelData(0).set(audioData);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  _currentSource = source;

  if (profile.ringMod) {
    // Ring modulation: multiply speech signal by a low-frequency sine carrier.
    // ringGain.gain starts at 0; oscillator drives it between −1 and +1.
    // This removes the original frequencies and creates ±sideband pairs.
    const ringGain = ctx.createGain();
    ringGain.gain.value = 0;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = profile.ringFreq;
    osc.connect(ringGain.gain);
    _currentOsc = osc;

    // Volume boost ×2 to compensate for the RMS halving from ring mod.
    const vol = ctx.createGain();
    vol.gain.value = profile.volume * 2;

    source.connect(ringGain);
    ringGain.connect(vol);
    vol.connect(ctx.destination);

    osc.start();
    source.start();
    source.onended = () => { try { osc.stop(); } catch (_) { /* ok */ } };
  } else {
    const vol = ctx.createGain();
    vol.gain.value = profile.volume;
    source.connect(vol);
    vol.connect(ctx.destination);
    source.start();
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Synthesize `text` with eSpeak-NG and play it through Web Audio with the
 * given robot profile.  Returns a promise that resolves when synthesis
 * completes (playback may still be running).
 */
export async function robotSpeak(text: string, profile: RobotProfile): Promise<void> {
  const clean = text.replace(/^[^\w'"(]+/, '').trim();
  if (!clean) return;

  let tts: _SimpleTTSInst;
  try {
    tts = await initTTS();
  } catch (err) {
    console.warn('[RobotVoice] eSpeak init failed:', err);
    return;
  }

  return new Promise<void>((resolve) => {
    tts.speak(
      clean,
      { voice: 'en', rate: profile.rate, pitch: profile.pitch, volume: 1.0 },
      (audioData, sampleRate) => {
        if (audioData) playAudio(audioData, sampleRate, profile);
        resolve();
      }
    );
  });
}

/** Stop any currently playing robot voice immediately. */
export function cancelRobot(): void {
  try { _currentSource?.stop(); } catch (_) { /* ok */ }
  try { _currentOsc?.stop();    } catch (_) { /* ok */ }
  _currentSource = null;
  _currentOsc    = null;
}
