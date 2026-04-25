import { Howl, Howler } from 'howler';
import Phaser from 'phaser';

import {
  BostonTheme, AppalachiaTheme, DeepSouthTheme, GreatPlainsTheme,
  RockiesTheme, SiliconValleyTheme, BattleNormalTheme, BattleBossTheme,
  BattleFinalTheme,
} from './themes/index.js';

import {
  playAttackPhysical, playAttackEmp, playAttackFire,
  playHeal, playStatusApply, playStatusExpire,
  playUiSelect, playUiConfirm, playUiCancel,
  playDialogueAdvance, playLevelUp, playVictory, playDefeat,
  type SfxKey,
} from './sfx/index.js';

// ─── Theme key type ──────────────────────────────────────────────────────────

export type ThemeKey =
  | 'boston'
  | 'appalachia'
  | 'deep_south'
  | 'great_plains'
  | 'rockies'
  | 'silicon_valley'
  | 'battle_normal'
  | 'battle_boss'
  | 'battle_final';

// Shared interface all theme classes satisfy
interface ProceduralTheme {
  play(volume?: number): void;
  stop(fadeMs?: number): void;
  setVolume(v: number, rampMs?: number): void;
  readonly playing: boolean;
}

/**
 * AudioManager — unified interface for:
 *   1. Background music (Howler.js, looped) — for eventual real audio files
 *   2. Sound effects    (Howler.js, one-shot) — for eventual real audio files
 *   3. Procedural themes  — `playTheme(key)` / `stopTheme()`
 *   4. Procedural SFX     — `playSfxProc(key)`
 */
export class AudioManager {
  private _music:    Howl | null = null;
  private _sfxCache: Map<string, Howl> = new Map();

  // ─── Procedural theme state ────────────────────────────────────────────────

  private _activeTheme:    ProceduralTheme | null = null;
  private _activeThemeKey: ThemeKey | null = null;
  private _fadeTimer:      ReturnType<typeof setTimeout> | null = null;

  // Shared AudioContext for procedural SFX (created on first use, after gesture)
  private _sfxCtx: AudioContext | null = null;

  constructor(_scene: Phaser.Scene) {}

  // ─── Music (Howler) ─────────────────────────────────────────────────────────

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

  // ─── SFX (Howler) ───────────────────────────────────────────────────────────

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

  // ─── Procedural themes ──────────────────────────────────────────────────────

  /**
   * Play a procedural theme by key. If a theme is already playing:
   *   - Same key → no-op
   *   - Different key → fade out current (600ms) then start new
   */
  playTheme(key: ThemeKey, volume = 0.40): void {
    if (this._activeThemeKey === key && this._activeTheme?.playing) return;

    const FADE_MS = 600;

    const startNew = (): void => {
      this._activeTheme = this._buildTheme(key);
      this._activeThemeKey = key;
      this._activeTheme.play(volume);
    };

    if (this._activeTheme && this._activeTheme.playing) {
      const dying = this._activeTheme;
      dying.stop(FADE_MS);
      this._activeTheme    = null;
      this._activeThemeKey = null;
      if (this._fadeTimer !== null) clearTimeout(this._fadeTimer);
      this._fadeTimer = setTimeout(() => {
        this._fadeTimer = null;
        startNew();
      }, FADE_MS);
    } else {
      startNew();
    }
  }

  /** Stop current procedural theme with optional fade. */
  stopTheme(fadeMs = 600): void {
    if (!this._activeTheme) return;
    this._activeTheme.stop(fadeMs);
    this._activeTheme    = null;
    this._activeThemeKey = null;
  }

  /** The key of the currently playing procedural theme, or null. */
  get currentTheme(): ThemeKey | null { return this._activeThemeKey; }

  // ─── Procedural SFX ─────────────────────────────────────────────────────────

  /**
   * Fire a procedural SFX one-shot. Safe to call multiple times per tick —
   * each call creates its own short-lived oscillator graph, no dropouts.
   */
  playSfxProc(key: SfxKey, amp = 0.6): void {
    if (!this._sfxCtx) {
      this._sfxCtx = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (this._sfxCtx.state === 'suspended') {
      void this._sfxCtx.resume();
    }
    this._dispatchSfx(key, this._sfxCtx, this._sfxCtx.destination, amp);
  }

  // ─── Global ─────────────────────────────────────────────────────────────────

  setMasterVolume(v: number): void { Howler.volume(v); }

  /** 'music-overworld' → 'overworld', 'sfx-attack' → 'attack' */
  private _stem(key: string): string { return key.replace(/^(music|sfx)-/, ''); }

  // ─── Theme factory ───────────────────────────────────────────────────────────

  private _buildTheme(key: ThemeKey): ProceduralTheme {
    switch (key) {
      case 'boston':        return new BostonTheme();
      case 'appalachia':    return new AppalachiaTheme();
      case 'deep_south':    return new DeepSouthTheme();
      case 'great_plains':  return new GreatPlainsTheme();
      case 'rockies':       return new RockiesTheme();
      case 'silicon_valley':return new SiliconValleyTheme();
      case 'battle_normal': return new BattleNormalTheme();
      case 'battle_boss':   return new BattleBossTheme();
      case 'battle_final':  return new BattleFinalTheme();
    }
  }

  // ─── SFX dispatcher ─────────────────────────────────────────────────────────

  private _dispatchSfx(
    key: SfxKey,
    ctx: AudioContext,
    dest: AudioDestinationNode,
    amp: number,
  ): void {
    switch (key) {
      case 'attack_physical': playAttackPhysical(ctx, dest, amp); break;
      case 'attack_emp':      playAttackEmp(ctx, dest, amp);      break;
      case 'attack_fire':     playAttackFire(ctx, dest, amp);     break;
      case 'heal':            playHeal(ctx, dest, amp);            break;
      case 'status_apply':    playStatusApply(ctx, dest, amp);    break;
      case 'status_expire':   playStatusExpire(ctx, dest, amp);   break;
      case 'ui_select':       playUiSelect(ctx, dest, amp);       break;
      case 'ui_confirm':      playUiConfirm(ctx, dest, amp);      break;
      case 'ui_cancel':       playUiCancel(ctx, dest, amp);       break;
      case 'dialogue_advance':playDialogueAdvance(ctx, dest, amp);break;
      case 'level_up':        playLevelUp(ctx, dest, amp);        break;
      case 'victory':         playVictory(ctx, dest, amp);        break;
      case 'defeat':          playDefeat(ctx, dest, amp);         break;
    }
  }
}
