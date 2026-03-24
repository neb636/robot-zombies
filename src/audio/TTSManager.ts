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

type VoiceGender = 'male' | 'female' | 'neutral' | 'robot';

interface VoiceProfile {
  rate:   number;
  pitch:  number;
  volume: number;
  gender: VoiceGender;
}

class TTSManager {
  private readonly _synth: SpeechSynthesis | null;
  private _voices: SpeechSynthesisVoice[] = [];
  private _muted: boolean;

  constructor() {
    this._synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
    this._muted = localStorage.getItem(LS_KEY) === 'true';

    if (this._synth) {
      const load = (): void => {
        this._voices = this._synth!.getVoices();
      };
      load();
      this._synth.onvoiceschanged = load;
    }

    document.addEventListener('tts:togglemute', () => { this.toggleMute(); });
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  speak(text: string, speakerName = ''): void {
    if (!this._synth || this._muted) return;

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

  cancel(): void {
    this._synth?.cancel();
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    localStorage.setItem(LS_KEY, String(this._muted));
    if (this._muted) this.cancel();
    document.dispatchEvent(new CustomEvent('tts:mutechange', { detail: { muted: this._muted } }));
    return this._muted;
  }

  isMuted(): boolean { return this._muted; }

  // ─── Voice profiles ────────────────────────────────────────────────────────

  private _profileFor(speakerName: string): VoiceProfile {
    const n = speakerName.toUpperCase();

    // Robot / AI voices — target Fred/Zarvox for classic synthesizer sound
    if (/SUPERINTELLIGENCE|BROADCAST|COLLECTIVE|ELISE|AI\b/.test(n)) {
      return { rate: 0.72, pitch: 0.10, volume: 0.88, gender: 'robot' };
    }
    if (/ROBOT|DRONE|UNIT|SENTINEL|ENFORCER|COMPLIANCE/.test(n)) {
      return { rate: 0.80, pitch: 0.10, volume: 0.85, gender: 'robot' };
    }
    if (/SYSTEM|BROADCAST/.test(n)) {
      return { rate: 0.88, pitch: 0.15, volume: 0.85, gender: 'robot' };
    }
    if (/ALARM|BROWSER|SIGNAL/.test(n)) {
      return { rate: 1.35, pitch: 0.55, volume: 0.75, gender: 'neutral' };
    }
    if (/DARIO/.test(n))  return { rate: 1.05, pitch: 0.90, volume: 0.90, gender: 'male'    };
    if (/NOVA/.test(n))   return { rate: 0.95, pitch: 1.10, volume: 0.90, gender: 'female'  };
    if (/ZARA/.test(n))   return { rate: 1.00, pitch: 1.20, volume: 0.90, gender: 'female'  };
    if (/REX/.test(n))    return { rate: 0.90, pitch: 0.80, volume: 0.90, gender: 'male'    };
    if (/CORA/.test(n))   return { rate: 0.98, pitch: 1.05, volume: 0.90, gender: 'female'  };

    return { rate: 0.95, pitch: 1.00, volume: 0.88, gender: 'neutral' };
  }

  private _pickVoice(gender: VoiceGender): SpeechSynthesisVoice | null {
    if (!this._voices.length) return null;

    const MALE_RE    = /daniel|david|fred|james|mark|alex|google uk english male/i;
    const FEMALE_RE  = /karen|samantha|victoria|zira|google us english|microsoft zira/i;
    const NEUTRAL_RE = /google|microsoft|enhanced/i;
    // Classic synthesizer voices — Fred (Macintalk) and Zarvox are the most robotic.
    // Fall back to Albert (nasal/robotic on macOS), then any English voice.
    const ROBOT_RE   = /fred|zarvox|albert|trinoids|cellos|bells/i;

    if (gender === 'robot')  return this._voices.find(v => ROBOT_RE.test(v.name))   ?? this._voices.find(v => /english/i.test(v.lang)) ?? this._voices[0] ?? null;
    if (gender === 'male')   return this._voices.find(v => MALE_RE.test(v.name))    ?? this._voices[0] ?? null;
    if (gender === 'female') return this._voices.find(v => FEMALE_RE.test(v.name))  ?? this._voices[0] ?? null;
    return this._voices.find(v => NEUTRAL_RE.test(v.name)) ?? this._voices[0] ?? null;
  }
}

export const tts = new TTSManager();
