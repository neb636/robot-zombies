import { Howl, Howler } from 'howler';

/**
 * AudioManager — unified interface for:
 *   1. Background music  (Howler.js, looped)
 *   2. Sound effects     (Howler.js, one-shot)
 *   3. Robot voice lines (Web SpeechSynthesis API)
 */
export class AudioManager {
  constructor(_scene) {
    this._music      = null;
    this._sfxCache   = new Map();
    this._synth      = window.speechSynthesis || null;
    this._robotVoice = null;

    if (this._synth) {
      const pick = () => {
        const voices = this._synth.getVoices();
        this._robotVoice =
          voices.find(v => /daniel|karen|google|microsoft/i.test(v.name)) ||
          voices[0] || null;
      };
      pick();
      this._synth.onvoiceschanged = pick;
    }
  }

  // ─── Music ──────────────────────────────────────────────────────────────────

  playMusic(key, volume = 0.45) {
    this.stopMusic(0);
    this._music = new Howl({
      src:        [`assets/audio/music/${this._stem(key)}.ogg`],
      loop:       true,
      volume,
      autoplay:   true,
      onloaderror: () => { this._music = null; },
    });
  }

  stopMusic(fadeMs = 600) {
    if (!this._music) return;
    if (fadeMs > 0) {
      this._music.fade(this._music.volume(), 0, fadeMs);
      setTimeout(() => { this._music?.stop(); this._music = null; }, fadeMs);
    } else {
      this._music.stop();
      this._music = null;
    }
  }

  // ─── SFX ────────────────────────────────────────────────────────────────────

  playSfx(key, volume = 0.75) {
    let howl = this._sfxCache.get(key);
    if (!howl) {
      howl = new Howl({
        src:         [`assets/audio/sfx/${this._stem(key)}.ogg`],
        volume,
        onloaderror: () => this._sfxCache.delete(key),
      });
      this._sfxCache.set(key, howl);
    }
    howl.play();
  }

  // ─── Robot voice (SpeechSynthesis) ──────────────────────────────────────────

  speakRobotLine(text) {
    if (!this._synth) return;
    this._synth.cancel();
    const utt  = new SpeechSynthesisUtterance(text);
    utt.voice  = this._robotVoice;
    utt.rate   = 1.2;
    utt.pitch  = 0.35;
    utt.volume = 0.6;
    this._synth.speak(utt);
  }

  // ─── Global ─────────────────────────────────────────────────────────────────

  setMasterVolume(v) { Howler.volume(v); }

  /** 'music-overworld' → 'overworld', 'sfx-attack' → 'attack' */
  _stem(key) { return key.replace(/^(music|sfx)-/, ''); }
}
