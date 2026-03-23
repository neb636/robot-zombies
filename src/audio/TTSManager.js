/**
 * TTSManager — singleton wrapper around Web Speech Synthesis.
 *
 * Speaks dialogue lines with different voice profiles depending on who
 * is talking (robot/AI vs human vs system).  Mute state persists via
 * localStorage so the preference survives page reloads.
 *
 * Usage:
 *   import { tts } from './TTSManager.js';
 *   tts.speak('Hello world', 'DARIO');
 *   tts.cancel();
 *   tts.toggleMute();  // returns new muted boolean
 */

const LS_KEY = 'rz_tts_muted';

class TTSManager {
  constructor() {
    this._synth   = window.speechSynthesis || null;
    this._voices  = [];
    this._muted   = localStorage.getItem(LS_KEY) === 'true';

    if (this._synth) {
      const load = () => { this._voices = this._synth.getVoices(); };
      load();
      this._synth.onvoiceschanged = load;
    }

    // Also listen for the DOM button click (fired before the module is imported)
    document.addEventListener('tts:togglemute', () => this.toggleMute());
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Speak a line of text.  Cancels any currently-playing utterance first.
   * @param {string} text
   * @param {string} [speakerName]  Raw speaker label from the dialogue box.
   */
  speak(text, speakerName = '') {
    if (!this._synth || this._muted) return;

    // Strip leading emoji / punctuation for cleaner TTS
    const clean = text.replace(/^[^\w'"(]+/, '').trim();
    if (!clean) return;

    this._synth.cancel();

    const cfg = this._profileFor(speakerName);
    const utt = new SpeechSynthesisUtterance(clean);
    utt.voice  = this._pickVoice(cfg.gender);
    utt.rate   = cfg.rate;
    utt.pitch  = cfg.pitch;
    utt.volume = cfg.volume;

    this._synth.speak(utt);
  }

  /** Stop any in-progress utterance immediately. */
  cancel() {
    this._synth?.cancel();
  }

  /** Toggle mute, persist it, fire a DOM event for the UI button. */
  toggleMute() {
    this._muted = !this._muted;
    localStorage.setItem(LS_KEY, this._muted);
    if (this._muted) this.cancel();
    document.dispatchEvent(new CustomEvent('tts:mutechange', { detail: { muted: this._muted } }));
    return this._muted;
  }

  isMuted() { return this._muted; }

  // ─── Voice profiles ────────────────────────────────────────────────────────

  _profileFor(speakerName) {
    const n = speakerName.toUpperCase();

    // AI / robotic speakers
    if (/SUPERINTELLIGENCE|BROADCAST|COLLECTIVE|SYSTEM|AI\b/.test(n)) {
      return { rate: 0.82, pitch: 0.25, volume: 0.85, gender: 'neutral' };
    }

    // Alarm / machine tones — clipped and fast
    if (/ALARM|BROWSER|SIGNAL/.test(n)) {
      return { rate: 1.35, pitch: 0.55, volume: 0.75, gender: 'neutral' };
    }

    // Named human characters
    if (/DARIO/.test(n))  return { rate: 1.05, pitch: 0.90, volume: 0.90, gender: 'male'   };
    if (/NOVA/.test(n))   return { rate: 0.95, pitch: 1.10, volume: 0.90, gender: 'female' };
    if (/ZARA/.test(n))   return { rate: 1.00, pitch: 1.20, volume: 0.90, gender: 'female' };
    if (/REX/.test(n))    return { rate: 0.90, pitch: 0.80, volume: 0.90, gender: 'male'   };
    if (/CORA/.test(n))   return { rate: 0.98, pitch: 1.05, volume: 0.90, gender: 'female' };

    // Player / default human
    return { rate: 0.95, pitch: 1.00, volume: 0.88, gender: 'neutral' };
  }

  _pickVoice(gender) {
    if (!this._voices.length) return null;

    const MALE_RE    = /daniel|david|fred|james|mark|alex|google uk english male/i;
    const FEMALE_RE  = /karen|samantha|victoria|zira|google us english|microsoft zira/i;
    const NEUTRAL_RE = /google|microsoft|enhanced/i;

    if (gender === 'male')   return this._voices.find(v => MALE_RE.test(v.name))   ?? this._voices[0];
    if (gender === 'female') return this._voices.find(v => FEMALE_RE.test(v.name)) ?? this._voices[0];
    return this._voices.find(v => NEUTRAL_RE.test(v.name)) ?? this._voices[0];
  }
}

// Export a single shared instance
export const tts = new TTSManager();
