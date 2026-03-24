import { Howl, Howler } from 'howler';
import Phaser from 'phaser';

/**
 * AudioManager — unified interface for:
 *   1. Background music (Howler.js, looped)
 *   2. Sound effects    (Howler.js, one-shot)
 */
export class AudioManager {
  private _music:    Howl | null = null;
  private _sfxCache: Map<string, Howl> = new Map();

  constructor(_scene: Phaser.Scene) {}

  // ─── Music ──────────────────────────────────────────────────────────────────

  playMusic(key: string, volume = 0.45): void {
    this.stopMusic(0);
    this._music = new Howl({
      src:         [`assets/audio/music/${this._stem(key)}.ogg`],
      loop:        true,
      volume,
      autoplay:    true,
      onloaderror: () => { this._music = null; },
    });
  }

  stopMusic(fadeMs = 600): void {
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

  playSfx(key: string, volume = 0.75): void {
    let howl = this._sfxCache.get(key);
    if (!howl) {
      howl = new Howl({
        src:         [`assets/audio/sfx/${this._stem(key)}.ogg`],
        volume,
        onloaderror: () => { this._sfxCache.delete(key); },
      });
      this._sfxCache.set(key, howl);
    }
    howl.play();
  }

  // ─── Global ─────────────────────────────────────────────────────────────────

  setMasterVolume(v: number): void { Howler.volume(v); }

  /** 'music-overworld' → 'overworld', 'sfx-attack' → 'attack' */
  private _stem(key: string): string { return key.replace(/^(music|sfx)-/, ''); }
}
