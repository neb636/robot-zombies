/**
 * TTSManager — singleton TTS router.
 *
 * Robot/AI voices → RobotVoice (eSpeak-NG WASM + Web Audio ring modulation).
 * Human voices    → Web Speech Synthesis API.
 *
 * Mute state persists via localStorage.
 *
 * Usage:
 *   import { tts } from './TTSManager.js';
 *   tts.speak('Hello world', 'DARIO');
 *   tts.cancel();
 *   tts.toggleMute();  // returns new muted boolean
 */

import { robotSpeak, cancelRobot, type RobotProfile } from './RobotVoice.js';

const LS_KEY = 'rz_tts_muted';

type VoiceGender = 'male' | 'female' | 'neutral';

interface HumanProfile {
  kind:   'human';
  rate:   number;
  pitch:  number;
  volume: number;
  gender: VoiceGender;
}

interface RobotProfileEntry {
  kind: 'robot';
  profile: RobotProfile;
}

type SpeakerProfile = HumanProfile | RobotProfileEntry;

class TTSManager {
  private readonly _synth: SpeechSynthesis | null;
  private _voices: SpeechSynthesisVoice[] = [];
  private _muted: boolean;

  constructor() {
    this._synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
    this._muted = localStorage.getItem(LS_KEY) === 'true';

    if (this._synth) {
      const load = (): void => { this._voices = this._synth!.getVoices(); };
      load();
      this._synth.onvoiceschanged = load;
    }

    document.addEventListener('tts:togglemute', () => { this.toggleMute(); });
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  speak(text: string, speakerName = ''): void {
    if (this._muted) return;

    const cfg = this._profileFor(speakerName);

    if (cfg.kind === 'robot') {
      robotSpeak(text, cfg.profile).catch((err: unknown) => {
        console.warn('[TTSManager] robot speak failed:', err);
      });
      return;
    }

    if (!this._synth) return;
    const clean = text.replace(/^[^\w'"(]+/, '').trim();
    if (!clean) return;

    this._synth.cancel();
    const utt    = new SpeechSynthesisUtterance(clean);
    utt.voice    = this._pickVoice(cfg.gender);
    utt.rate     = cfg.rate;
    utt.pitch    = cfg.pitch;
    utt.volume   = cfg.volume;
    this._synth.speak(utt);
  }

  cancel(): void {
    this._synth?.cancel();
    cancelRobot();
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    localStorage.setItem(LS_KEY, String(this._muted));
    if (this._muted) this.cancel();
    document.dispatchEvent(new CustomEvent('tts:mutechange', { detail: { muted: this._muted } }));
    return this._muted;
  }

  isMuted(): boolean { return this._muted; }

  // ─── Speaker profiles ──────────────────────────────────────────────────────

  private _profileFor(speakerName: string): SpeakerProfile {
    const n = speakerName.toUpperCase();

    // ── Robot / AI voices (eSpeak-NG + ring modulation) ──────────────────────
    // rate  = eSpeak WPM-style (default 175; lower = more ominous)
    // pitch = eSpeak 0–100     (0 = floor)
    // ringMod + ringFreq: carrier wave that creates sideband split

    if (/SUPERINTELLIGENCE|ELISE|COLLECTIVE|AI\b/.test(n)) {
      // Fast, clipped, low-pitched — DECtalk-style à la Stephen Hawking.
      return { kind: 'robot', profile: { rate: 260, pitch: 3, volume: 0.9, ringMod: true, ringFreq: 75 } };
    }
    if (/ROBOT|DRONE|UNIT|SENTINEL|ENFORCER|COMPLIANCE/.test(n)) {
      return { kind: 'robot', profile: { rate: 170, pitch: 15, volume: 0.85, ringMod: true,  ringFreq: 60  } };
    }
    if (/SYSTEM|BROADCAST/.test(n)) {
      return { kind: 'robot', profile: { rate: 175, pitch: 20, volume: 0.85, ringMod: false, ringFreq: 0   } };
    }

    // ── Human voices (Web Speech API) ────────────────────────────────────────
    if (/ALARM|BROWSER|SIGNAL/.test(n)) {
      return { kind: 'human', rate: 1.35, pitch: 0.55, volume: 0.75, gender: 'neutral' };
    }
    if (/DARIO|MARCUS/.test(n))  return { kind: 'human', rate: 1.05, pitch: 0.90, volume: 0.90, gender: 'male'    };
    if (/MAYA/.test(n))          return { kind: 'human', rate: 1.10, pitch: 1.15, volume: 0.90, gender: 'female'  };
    if (/DEJA/.test(n))          return { kind: 'human', rate: 1.20, pitch: 1.20, volume: 0.90, gender: 'female'  };
    if (/NOVA/.test(n))          return { kind: 'human', rate: 0.95, pitch: 1.10, volume: 0.90, gender: 'female'  };
    if (/ZARA/.test(n))          return { kind: 'human', rate: 1.00, pitch: 1.20, volume: 0.90, gender: 'female'  };
    if (/REX|ELIAS|JEROME/.test(n)) return { kind: 'human', rate: 0.90, pitch: 0.75, volume: 0.90, gender: 'male' };
    if (/CORA/.test(n))          return { kind: 'human', rate: 0.98, pitch: 1.05, volume: 0.90, gender: 'female'  };

    return { kind: 'human', rate: 0.95, pitch: 1.00, volume: 0.88, gender: 'neutral' };
  }

  private _pickVoice(gender: VoiceGender): SpeechSynthesisVoice | null {
    if (!this._voices.length) return null;

    const MALE_RE    = /daniel|david|james|mark|alex|google uk english male/i;
    const FEMALE_RE  = /karen|samantha|victoria|zira|google us english|microsoft zira/i;
    const NEUTRAL_RE = /google|microsoft|enhanced/i;

    if (gender === 'male')   return this._voices.find(v => MALE_RE.test(v.name))   ?? this._voices[0] ?? null;
    if (gender === 'female') return this._voices.find(v => FEMALE_RE.test(v.name)) ?? this._voices[0] ?? null;
    return this._voices.find(v => NEUTRAL_RE.test(v.name)) ?? this._voices[0] ?? null;
  }
}

export const tts = new TTSManager();
