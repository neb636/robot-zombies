import Phaser from 'phaser';
import { jumpToScene } from '../utils/devJump.js';
import { preloadApartmentAssets } from './PrologueRoomRenderer.js';
import { SaveManager } from '../save/SaveManager.js';
import { ProceduralMusic } from '../audio/ProceduralMusic.js';
import {
  // regions
  generateBostonTiles,
  generateAppalachiaTiles,
  generateDeepSouthTiles,
  generateGreatPlainsTiles,
  generateRockiesTiles,
  generateSiliconValleyTiles,
  // npcs
  generateMarcusSprite,
  generateMayaSprite,
  generateEliasSprite,
  generateDejaSprite,
  generateJeromeSprite,
  generateDrChenSprite,
  generateSurvivorSprite,
  generateMerchantSprite,
  generateConvertedSprite,
  generateChildSprite,
  generateFarmhandSprite,
  // enemies
  generateComplianceDroneSprite,
  generateEnforcerUnitSprite,
  generatePatrolBotSprite,
  generateEnforcerHeavySprite,
  generateSentinelDroneSprite,
  generateSentinelAerialSprite,
  generateMiningCrawlerSprite,
  generateBayouStalkerSprite,
  generateAerialSentinelSprite,
  generateStormWalkerSprite,
  generateSIEliteSprite,
  generateConvertedFighterSprite,
  generateComplianceWardenBetaSprite,
} from '../art/generators/index.js';

const ROTATION_DIRS = [
  'south', 'south-east', 'east', 'north-east',
  'north', 'north-west', 'west', 'south-west',
] as const;

const DIRS_8 = ROTATION_DIRS;
const DIRS_4 = ['south', 'east', 'north', 'west'] as const;

type HeroAnimKey = 'walking' | 'running' | 'jumping' | 'crouching' | 'poking';

interface HeroAnimDef {
  folder:    string;
  frames:    number;
  dirs:      readonly string[];
  frameRate: number;
  repeat:    number;
}

const HERO_ANIMS: Record<HeroAnimKey, HeroAnimDef> = {
  walking:   { folder: 'Walking-b5ada3a1',                                              frames: 6, dirs: DIRS_8, frameRate: 10, repeat: -1 },
  running:   { folder: 'Running-4263a14a',                                              frames: 6, dirs: DIRS_8, frameRate: 14, repeat: -1 },
  jumping:   { folder: 'Jumping-3b85dd59',                                              frames: 9, dirs: DIRS_8, frameRate: 12, repeat:  0 },
  crouching: { folder: 'Crouching-b9994c7c',                                            frames: 5, dirs: DIRS_4, frameRate:  8, repeat: -1 },
  poking:    { folder: 'poke_someone._similar_to_punching_but_less_violent-ebf05df7',   frames: 4, dirs: DIRS_4, frameRate: 10, repeat:  0 },
};

const CHARACTER_FRAME_SIZE = 108;

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * PreloadScene — loads all game assets behind the cinematic Quiet Machines splash,
 * then gates entry with a "PRESS ANY KEY TO START" prompt (also acts as title screen).
 */
export class PreloadScene extends Phaser.Scene {
  private _progressBar!:  Phaser.GameObjects.Graphics;
  private _loadingText!:  Phaser.GameObjects.Text;
  private _bgImage:       Phaser.GameObjects.Image | null     = null;
  private _bgBackdrop:    Phaser.GameObjects.Rectangle | null = null;
  private _startPrompt:   Phaser.GameObjects.Text | null      = null;
  private _continueText:  Phaser.GameObjects.Text | null      = null;
  private _music:         ProceduralMusic | null = null;
  private _started:       boolean                = false;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // The splash image is loaded by BootScene so it's already a texture by now.
    this._buildLoadScreen();

    this.load.tilemapTiledJSON('world-map', 'assets/tilemaps/world.json');
    this.load.image('world-tiles', 'assets/tilesets/world_tiles.png');

    // ── Character rotation sprites (8-directional, 108×108 each) ──────────
    for (const c of ['hero', 'maya'] as const) {
      for (const dir of ROTATION_DIRS) {
        this.load.image(`${c}_${dir}`, `assets/sprites/characters/${c}/rotations/${dir}.png`);
      }
    }

    // ── Hero action animation frames (Walking/Running/Jumping/Crouching/Poking) ──
    for (const [action, def] of Object.entries(HERO_ANIMS)) {
      for (const dir of def.dirs) {
        for (let i = 0; i < def.frames; i++) {
          const f = i.toString().padStart(3, '0');
          this.load.image(
            `hero_${action}_${dir}_${i}`,
            `assets/sprites/characters/hero/animations/${def.folder}/${dir}/frame_${f}.png`,
          );
        }
      }
    }

    this.load.spritesheet('robot_zombie', 'assets/sprites/robot_zombie.png', {
      frameWidth: 64, frameHeight: 64,
    });

    // ── Abandoned vehicles (Post Apocalyptic pack) ────────────────────────
    this.load.image('car_black', 'assets/sprites/props/cars/Car Black.png');
    this.load.image('car_white', 'assets/sprites/props/cars/Car White.png');
    this.load.image('car_red',   'assets/sprites/props/cars/Car Red.png');
    this.load.image('car_blue',  'assets/sprites/props/cars/Car Blue.png');
    this.load.image('car_taxi',  'assets/sprites/props/cars/Car Taxi.png');
    this.load.image('car_green', 'assets/sprites/props/cars/Car Green.png');

    // ── Street props (Post Apocalyptic pack) ──────────────────────────────
    this.load.image('prop_barrel',      'assets/sprites/props/misc/Barrel.png');
    this.load.image('prop_crate',       'assets/sprites/props/misc/Crate.png');
    this.load.image('prop_cone',        'assets/sprites/props/misc/Cone.png');
    this.load.image('prop_skull',       'assets/sprites/props/misc/Skull.png');
    this.load.image('prop_trash1',      'assets/sprites/props/misc/Trash Can 1.png');
    this.load.image('prop_trash2',      'assets/sprites/props/misc/Trash Can 2.png');
    this.load.image('prop_trash3',      'assets/sprites/props/misc/Trash Can 3.png');
    this.load.image('prop_barrier_red', 'assets/sprites/props/misc/Barrier red.png');
    this.load.image('prop_barrier_yel', 'assets/sprites/props/misc/Barrier yellow.png');

    // ── Signs (Post Apocalyptic pack) ─────────────────────────────────────
    this.load.image('sign_base',     'assets/sprites/props/signs/Sign Base.png');
    this.load.image('sign_danger',   'assets/sprites/props/signs/Sign Danger.png');
    this.load.image('sign_no_entry', 'assets/sprites/props/signs/Sign No Entry.png');
    this.load.image('sign_stop',     'assets/sprites/props/signs/Sign Stop.png');
    this.load.image('sign_radioact', 'assets/sprites/props/signs/Sign RadioActive.png');

    // ── Prologue apartment (tilesets + interior props) ────────────────────
    preloadApartmentAssets(this);
  }

  create(): void {
    if (!this.textures.exists('hero'))            this._buildCharacterSpritesheet('hero');
    if (!this.textures.exists('maya'))            this._buildCharacterSpritesheet('maya');
    this._buildHeroAnimationTextures();
    if (!this.textures.exists('warden_alpha'))    this._generateWardenAlphaTexture();
    if (!this.textures.exists('excavator_prime')) this._generateExcavatorPrimeTexture();
    if (!this.textures.exists('the_governor'))    this._generateTheGovernorTexture();
    if (!this.textures.exists('sentinel_spire'))  this._generateSentinelSpireTexture();
    if (!this.textures.exists('gate_colossus'))   this._generateGateColossusTexture();
    if (!this.textures.exists('elise_voss'))      this._generateEliseVossTexture();

    // ── Region tileset generators ──────────────────────────────────────────
    if (!this.textures.exists('tileset_boston'))         generateBostonTiles(this);
    if (!this.textures.exists('tileset_appalachia'))     generateAppalachiaTiles(this);
    if (!this.textures.exists('tileset_deep_south'))     generateDeepSouthTiles(this);
    if (!this.textures.exists('tileset_great_plains'))   generateGreatPlainsTiles(this);
    if (!this.textures.exists('tileset_rockies'))        generateRockiesTiles(this);
    if (!this.textures.exists('tileset_silicon_valley')) generateSiliconValleyTiles(this);

    // ── NPC sprite generators ──────────────────────────────────────────────
    if (!this.textures.exists('npc_marcus'))    generateMarcusSprite(this);
    if (!this.textures.exists('npc_maya'))      generateMayaSprite(this);
    if (!this.textures.exists('npc_elias'))     generateEliasSprite(this);
    if (!this.textures.exists('npc_deja'))      generateDejaSprite(this);
    if (!this.textures.exists('npc_jerome'))    generateJeromeSprite(this);
    if (!this.textures.exists('npc_dr_chen'))   generateDrChenSprite(this);
    if (!this.textures.exists('npc_survivor'))  generateSurvivorSprite(this);
    if (!this.textures.exists('npc_merchant'))  generateMerchantSprite(this);
    if (!this.textures.exists('npc_converted')) generateConvertedSprite(this);
    if (!this.textures.exists('npc_child'))     generateChildSprite(this);
    if (!this.textures.exists('npc_farmhand'))  generateFarmhandSprite(this);

    // ── Enemy sprite generators ────────────────────────────────────────────
    if (!this.textures.exists('enemy_compliance_drone'))
      generateComplianceDroneSprite(this);
    if (!this.textures.exists('enemy_enforcer_unit'))
      generateEnforcerUnitSprite(this);
    if (!this.textures.exists('enemy_patrol_bot'))
      generatePatrolBotSprite(this);
    if (!this.textures.exists('enemy_enforcer_heavy'))
      generateEnforcerHeavySprite(this);
    if (!this.textures.exists('enemy_sentinel_drone'))
      generateSentinelDroneSprite(this);
    if (!this.textures.exists('enemy_sentinel_aerial'))
      generateSentinelAerialSprite(this);
    if (!this.textures.exists('enemy_mining_crawler'))
      generateMiningCrawlerSprite(this);
    if (!this.textures.exists('enemy_bayou_stalker'))
      generateBayouStalkerSprite(this);
    if (!this.textures.exists('enemy_aerial_sentinel'))
      generateAerialSentinelSprite(this);
    if (!this.textures.exists('enemy_storm_walker'))
      generateStormWalkerSprite(this);
    if (!this.textures.exists('enemy_si_elite'))
      generateSIEliteSprite(this);
    if (!this.textures.exists('enemy_converted_fighter'))
      generateConvertedFighterSprite(this);
    if (!this.textures.exists('enemy_compliance_warden_beta'))
      generateComplianceWardenBetaSprite(this);

    this._registerAnimations();

    if (import.meta.env.DEV) {
      this.scene.launch('DevScene');
      const params = new URLSearchParams(window.location.search);
      const build = params.get('build');
      if (build) {
        this.scene.start('SceneBuilderScene', { layout: build });
        return;
      }
      const devTarget = params.get('dev');
      if (devTarget) {
        const enemy = params.get('enemy');
        jumpToScene(this.game, devTarget, enemy ? { enemy } : undefined);
        return;
      }
    }

    this._showStartPrompt();
  }

  /**
   * Build an 8-frame directional spritesheet (108×108 per frame) from individual
   * rotation PNGs loaded in preload(). Frame order matches ROTATION_DIRS:
   * 0:south 1:south-east 2:east 3:north-east 4:north 5:north-west 6:west 7:south-west.
   */
  private _buildCharacterSpritesheet(key: 'hero' | 'maya'): void {
    const size = CHARACTER_FRAME_SIZE;
    const canvas = this.textures.createCanvas(key, size * ROTATION_DIRS.length, size);
    if (!canvas) return;

    ROTATION_DIRS.forEach((dir, i) => {
      const srcKey = `${key}_${dir}`;
      if (!this.textures.exists(srcKey)) return;
      canvas.drawFrame(srcKey, undefined, i * size, 0);
    });
    canvas.refresh();

    for (let i = 0; i < ROTATION_DIRS.length; i++) {
      canvas.add(i, 0, i * size, 0, size, size);
    }
  }

  /**
   * Build one canvas spritesheet per (action, direction) from the individually
   * loaded PNG frames. Produces textures keyed `hero_<action>_<direction>` with
   * N indexed frames laid out horizontally.
   */
  private _buildHeroAnimationTextures(): void {
    const size = CHARACTER_FRAME_SIZE;
    for (const [action, def] of Object.entries(HERO_ANIMS)) {
      for (const dir of def.dirs) {
        const textureKey = `hero_${action}_${dir}`;
        if (this.textures.exists(textureKey)) continue;
        const canvas = this.textures.createCanvas(textureKey, size * def.frames, size);
        if (!canvas) continue;
        for (let i = 0; i < def.frames; i++) {
          const srcKey = `hero_${action}_${dir}_${i}`;
          if (!this.textures.exists(srcKey)) continue;
          canvas.drawFrame(srcKey, undefined, i * size, 0);
        }
        canvas.refresh();
        for (let i = 0; i < def.frames; i++) {
          canvas.add(i, 0, i * size, 0, size, size);
        }
      }
    }
  }

  /**
   * Cinematic loading visual: full-bleed splash painting, fades in from black,
   * with a thin amber progress bar near the bottom while the rest of the assets load.
   * Uses "cover" scaling so the splash fills the viewport at any aspect ratio.
   */
  private _buildLoadScreen(): void {
    const { width, height } = this.scale;

    // Black backdrop sits behind everything in case of any sub-pixel gap.
    this._bgBackdrop = this.add.rectangle(0, 0, width, height, 0x000000)
      .setOrigin(0, 0)
      .setDepth(-2);

    if (this.textures.exists('load_screen_bg')) {
      this._bgImage = this.add.image(width / 2, height / 2, 'load_screen_bg')
        .setOrigin(0.5)
        .setDepth(-1);
      this._fitBackgroundCover();
      // Subtle settle: drift the image up 4px while it fades in for a touch of motion.
      this._bgImage.y += 4;
      this.tweens.add({ targets: this._bgImage, y: height / 2, duration: 1200, ease: 'Sine.easeOut' });
    }

    // Cinematic fade in from black.
    this.cameras.main.fadeIn(900, 0, 0, 0);

    this._progressBar = this.add.graphics().setDepth(10);
    this._loadingText = this.add.text(0, 0, 'LOADING…', {
      fontFamily:    'monospace',
      fontSize:      '11px',
      color:         '#998877',
      letterSpacing: 3,
    }).setOrigin(0.5).setDepth(10).setAlpha(0.8);

    let lastProgress = 0;
    const drawBar = (value: number): void => {
      lastProgress = value;
      const w = this.scale.width;
      const h = this.scale.height;
      const barY     = Math.floor(h * 0.965);
      const barLeft  = Math.floor(w * 0.18);
      const barRight = Math.floor(w * 0.82);
      const barW     = barRight - barLeft;

      this._progressBar.clear();
      this._progressBar.fillStyle(0x000000, 0.55);
      this._progressBar.fillRect(barLeft - 1, barY - 1, barW + 2, 4);
      this._progressBar.fillStyle(0x442a1a, 0.9);
      this._progressBar.fillRect(barLeft, barY, barW, 2);
      this._progressBar.fillStyle(0xaa8866, 1);
      this._progressBar.fillRect(barLeft, barY, Math.max(0, Math.floor(barW * value)), 2);

      this._loadingText.setPosition(w / 2, barY - 14);
    };

    drawBar(0);
    this.load.on('progress', (value: number) => { drawBar(value); });

    this.load.on('complete', () => {
      // Fade the loading bar away — sprite generators in create() take over briefly.
      this.tweens.add({
        targets:  [this._progressBar, this._loadingText],
        alpha:    0,
        duration: 400,
        onComplete: () => {
          this._progressBar.destroy();
          this._loadingText.destroy();
        },
      });
    });

    this.scale.on('resize', this._handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this._handleResize, this);
    });

    // Re-draw the bar on resize using the most recent progress value.
    this.scale.on('resize', () => drawBar(lastProgress));
  }

  /** Scale the splash to "cover" the viewport — fills both axes, crops the longer one. */
  private _fitBackgroundCover(): void {
    if (this._bgImage === null) return;
    const tex = this.textures.get('load_screen_bg').getSourceImage() as HTMLImageElement;
    const w = this.scale.width;
    const h = this.scale.height;
    // 1.01 overscan absorbs the 4px settle-tween so no black edge appears mid-animation.
    const scale = Math.max(w / tex.width, h / tex.height) * 1.01;
    this._bgImage.setScale(scale);
    this._bgImage.setPosition(w / 2, h / 2);
  }

  /** Keep the splash, backdrop, and start-prompt centered if the user resizes the window. */
  private _handleResize(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    if (this._bgBackdrop !== null) {
      this._bgBackdrop.setSize(w, h);
    }
    this._fitBackgroundCover();

    if (this._startPrompt !== null) {
      this._startPrompt.setPosition(w / 2, h * 0.86);
    }
    if (this._continueText !== null) {
      this._continueText.setPosition(w / 2, h * 0.92);
    }
  }

  /**
   * Once create() finishes its synchronous sprite generation, fade in the
   * "PRESS ANY KEY TO START" prompt and arm input listeners. If a save exists,
   * also surface a smaller [C] CONTINUE affordance underneath.
   */
  private _showStartPrompt(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Music fades in alongside the prompt — the painting is now the title screen.
    this._music = new ProceduralMusic();
    this._music.play(0.32);

    const promptSize = clamp(width * 0.024, 14, 22);
    const prompt = this.add.text(cx, height * 0.86, 'PRESS ANY KEY TO START', {
      fontFamily:      'monospace',
      fontSize:        promptSize + 'px',
      color:           '#e8d8b8',
      stroke:          '#000000',
      strokeThickness: 4,
      letterSpacing:   3,
    }).setOrigin(0.5).setAlpha(0).setDepth(20);
    this._startPrompt = prompt;

    this.tweens.add({
      targets:    prompt,
      alpha:      1,
      duration:   800,
      ease:       'Sine.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets:  prompt,
          alpha:    0.3,
          yoyo:     true,
          duration: 700,
          repeat:   -1,
          ease:     'Sine.easeInOut',
        });
      },
    });

    // Optional Continue affordance.
    const summary = SaveManager.getSummary();
    let continueText: Phaser.GameObjects.Text | null = null;
    if (summary !== null) {
      const dateStr = summary.savedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const label   = `[C]  CONTINUE  —  ${summary.playerName}  ·  Ch.${summary.chapter}  ·  ${dateStr}`;
      continueText = this.add.text(cx, height * 0.92, label, {
        fontFamily: 'monospace',
        fontSize:   '12px',
        color:      '#a89878',
        stroke:     '#000000',
        strokeThickness: 3,
      })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(20)
        .setInteractive({ useHandCursor: true });

      this.tweens.add({ targets: continueText, alpha: 1, duration: 700, delay: 400 });
      this._continueText = continueText;
    }

    // Input wiring — keyboard + pointer for both paths (CLAUDE.md mobile rule).
    const startNew = (): void => { this._startGame('PrologueScene', true); };
    const resume   = (): void => {
      const data = SaveManager.load();
      if (data === null) { this._startGame('PrologueScene', true); return; }
      SaveManager.restore(this.game, data);
      this._startGame(data.currentScene, false);
    };

    if (continueText !== null) {
      continueText.on('pointerdown', (_: unknown, __: unknown, ___: unknown, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        resume();
      });
      this.input.keyboard!.once('keydown-C', resume);
    }

    this.input.keyboard!.once('keydown', (e: KeyboardEvent) => {
      // 'C' is consumed above when a save exists.
      if (continueText !== null && e.key.toLowerCase() === 'c') return;
      startNew();
    });
    this.input.once('pointerdown', startNew);
  }

  private _startGame(targetScene: string, isNewGame: boolean): void {
    if (this._started) return;
    this._started = true;

    if (isNewGame) {
      this.registry.set('playerName', 'Arlo');
      this.registry.set('chapter', 1);
    }

    this._music?.stop(700);
    this.cameras.main.fade(800, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) this.scene.start(targetScene);
    });
  }

  private _registerAnimations(): void {
    // Directional spritesheet frame indexes (see _buildCharacterSpritesheet):
    // 0:S 1:SE 2:E 3:NE 4:N 5:NW 6:W 7:SW
    // Per-direction idle frames pulled from the 8-frame rotation sheet.
    const idleFrameByDir: Record<string, number> = {
      'south':      0, 'south-east': 1, 'east':       2, 'north-east': 3,
      'north':      4, 'north-west': 5, 'west':       6, 'south-west': 7,
    };

    // Maya still uses the legacy 4-direction static walk keys.
    const mayaStaticAnims: Array<{ key: string; frames: number[] }> = [
      { key: 'maya-walk-down',  frames: [0] },
      { key: 'maya-walk-right', frames: [2] },
      { key: 'maya-walk-up',    frames: [4] },
      { key: 'maya-walk-left',  frames: [6] },
      { key: 'maya-idle',       frames: [0] },
    ];
    if (this.textures.exists('maya')) {
      for (const { key, frames } of mayaStaticAnims) {
        this.anims.create({
          key,
          frames:    this.anims.generateFrameNumbers('maya', { frames }),
          frameRate: 1,
          repeat:    -1,
        });
      }
    }

    // Hero per-direction idles + legacy aliases (hero-idle, hero-walk-{down/up/left/right}).
    if (this.textures.exists('hero')) {
      for (const [dir, frame] of Object.entries(idleFrameByDir)) {
        this.anims.create({
          key:       `hero-idle-${dir}`,
          frames:    this.anims.generateFrameNumbers('hero', { frames: [frame] }),
          frameRate: 1,
          repeat:    -1,
        });
      }
      this.anims.create({
        key:       'hero-idle',
        frames:    this.anims.generateFrameNumbers('hero', { frames: [0] }),
        frameRate: 1,
        repeat:    -1,
      });
    }

    // Hero action animations (walking/running/jumping/crouching/poking × directions).
    for (const [action, def] of Object.entries(HERO_ANIMS)) {
      for (const dir of def.dirs) {
        const textureKey = `hero_${action}_${dir}`;
        if (!this.textures.exists(textureKey)) continue;
        this.anims.create({
          key:       `hero-${action}-${dir}`,
          frames:    this.anims.generateFrameNumbers(textureKey, { start: 0, end: def.frames - 1 }),
          frameRate: def.frameRate,
          repeat:    def.repeat,
        });
      }
    }

    // Legacy 4-direction walk aliases — map to the new walking animation frames.
    const walkAliasByDir: Array<[string, string]> = [
      ['hero-walk-down',  'south'],
      ['hero-walk-up',    'north'],
      ['hero-walk-left',  'west'],
      ['hero-walk-right', 'east'],
    ];
    const walkDef = HERO_ANIMS.walking;
    for (const [alias, dir] of walkAliasByDir) {
      const textureKey = `hero_walking_${dir}`;
      if (!this.textures.exists(textureKey)) continue;
      this.anims.create({
        key:       alias,
        frames:    this.anims.generateFrameNumbers(textureKey, { start: 0, end: walkDef.frames - 1 }),
        frameRate: walkDef.frameRate,
        repeat:    walkDef.repeat,
      });
    }

    if (this.textures.exists('robot_zombie')) {
      this.anims.create({
        key:       'robot-walk',
        frames:    this.anims.generateFrameNumbers('robot_zombie', { start: 0, end: 3 }),
        frameRate: 4,
        repeat:    -1,
      });
      this.anims.create({
        key:       'robot-attack',
        frames:    this.anims.generateFrameNumbers('robot_zombie', { start: 4, end: 7 }),
        frameRate: 8,
        repeat:    0,
      });
      this.anims.create({
        key:       'robot-idle',
        frames:    this.anims.generateFrameNumbers('robot_zombie', { frames: [0] }),
        frameRate: 1,
        repeat:    -1,
      });
    }

    const bossKeys = [
      'warden_alpha', 'excavator_prime', 'the_governor',
      'sentinel_spire', 'gate_colossus', 'elise_voss',
    ] as const;

    for (const key of bossKeys) {
      if (this.textures.exists(key)) {
        this.anims.create({
          key:       `${key}-idle`,
          frames:    this.anims.generateFrameNumbers(key, { frames: [0, 1] }),
          frameRate: 2,
          repeat:    -1,
        });
        this.anims.create({
          key:       `${key}-attack`,
          frames:    this.anims.generateFrameNumbers(key, { frames: [2] }),
          frameRate: 8,
          repeat:    0,
        });
        this.anims.create({
          key:       `${key}-hit`,
          frames:    this.anims.generateFrameNumbers(key, { frames: [3] }),
          frameRate: 4,
          repeat:    0,
        });
      }
    }
  }

  // ─── Boss sprite generators ────────────────────────────────────────────────

  /**
   * Warden Alpha — harbor-district enforcer bot.
   * 64×80 per frame, 4 frames: idle-A, idle-B, attack, hit.
   */
  private _generateWardenAlphaTexture(): void {
    const FW = 64, FH = 80;
    const STEEL = 0x2a2a2a;
    const RED   = 0xcc2200;
    const LIGHT = 0x555555;
    const BLACK = 0x111111;

    const g = this.make.graphics({}, false);

    for (let f = 0; f < 4; f++) {
      const ox = f * FW;
      const cx = ox + FW / 2;

      // shadow
      g.fillStyle(0x000000, 0.15);
      g.fillEllipse(cx, FH - 4, 40, 8);

      // feet
      g.fillStyle(STEEL);
      g.fillRect(cx - 16, 72, 14, 6);
      g.fillRect(cx + 2,  72, 14, 6);

      // legs
      g.fillStyle(BLACK);
      g.fillRect(cx - 11, 46, 10, 26);
      g.fillRect(cx + 1,  46, 10, 26);
      g.fillStyle(LIGHT);
      g.fillRect(cx - 11, 46, 10, 3);
      g.fillRect(cx + 1,  46, 10, 3);

      // arms — vary per frame
      const armDY = (f === 1) ? 1 : 0;
      const rightExtend = (f === 2) ? 6 : 0;

      g.fillStyle(STEEL);
      g.fillRect(cx - 22, 24 + armDY, 8, 18);
      g.fillRect(cx + 14 + rightExtend, 24 + armDY, 8, 18);
      g.fillStyle(BLACK);
      g.fillRect(cx - 22, 40 + armDY, 8, 2);
      g.fillRect(cx + 14 + rightExtend, 40 + armDY, 8, 2);

      // torso
      g.fillStyle(STEEL);
      g.fillRect(cx - 14, 24, 28, 22);
      g.fillStyle(f === 3 ? 0x221100 : RED);
      g.fillRect(cx - 6, 25, 3, 20);
      g.fillRect(cx + 3,  25, 3, 20);
      g.fillStyle(LIGHT);
      g.fillRect(cx - 14, 24, 28, 2);

      // shoulders
      g.fillStyle(STEEL);
      g.fillRect(cx - 24, 18, 10, 6);
      g.fillRect(cx + 14,  18, 10, 6);
      g.fillStyle(LIGHT);
      g.fillRect(cx - 24, 18, 10, 2);
      g.fillRect(cx + 14,  18, 10, 2);

      // head
      const headX = (f === 3) ? 2 : 0;
      g.fillStyle(STEEL);
      g.fillRect(cx - 10 + headX, 4, 20, 14);
      g.fillStyle(LIGHT);
      g.fillRect(cx - 10 + headX, 4, 20, 2);
      // eyes
      const eyeColor = (f === 2) ? 0xff4400 : (f === 3) ? 0x441100 : RED;
      g.fillStyle(eyeColor);
      g.fillRect(cx - 8 + headX, 9, 4, 4);
      g.fillRect(cx + 4 + headX, 9, 4, 4);
    }

    g.generateTexture('warden_alpha', FW * 4, FH);
    g.destroy();

    const tex = this.textures.get('warden_alpha');
    for (let i = 0; i < 4; i++) {
      tex.add(i, 0, i * FW, 0, FW, FH);
    }
  }

  /**
   * Excavator Prime — massive mining bot.
   * 80×96 per frame, 4 frames: idle-A, idle-B, attack (drill raised), hit (damaged).
   */
  private _generateExcavatorPrimeTexture(): void {
    const FW = 80, FH = 96;
    const BROWN  = 0x5a3a1a;
    const METAL  = 0x7a6040;
    const YELLOW = 0xccaa00;
    const DARK   = 0x1a0a00;

    const g = this.make.graphics({}, false);

    for (let f = 0; f < 4; f++) {
      const ox = f * FW;
      const cx = ox + FW / 2;

      // shadow
      g.fillStyle(0x000000, 0.15);
      g.fillEllipse(cx, FH - 4, 56, 8);

      // treads
      g.fillStyle(DARK);
      g.fillRect(cx - 28, 82, 26, 14);
      g.fillRect(cx + 2,  82, 26, 14);
      g.fillStyle(METAL);
      g.fillRect(cx - 28, 82, 26, 3);
      g.fillRect(cx + 2,  82, 26, 3);

      // drill arm (right side) — shifts per frame
      const drillY = (f === 1) ? 34 : (f === 2) ? 20 : 32;
      const drillSplitLeft  = (f === 3) ? -2 : 0;
      const drillSplitRight = (f === 3) ?  2 : 0;
      g.fillStyle(BROWN);
      g.fillRect(ox + 58 + drillSplitLeft,  drillY, 6, 20);
      g.fillRect(ox + 58 + drillSplitRight, drillY + 20, 6, 20);
      // warning stripes on drill
      for (let s = 0; s < 5; s++) {
        g.fillStyle(s % 2 === 0 ? YELLOW : BROWN);
        g.fillRect(ox + 58, drillY + s * 8, 6, 8);
      }

      // clamp arm (left side)
      g.fillStyle(BROWN);
      g.fillRect(ox + 4, 32, 10, 16);
      g.fillRect(ox + 4, 48, 14, 8);  // wider at base = claw

      // torso / drill housing
      g.fillStyle(BROWN);
      g.fillRect(cx - 18, 40, 36, 28);
      // warning stripes on torso sides
      g.fillStyle(YELLOW);
      g.fillRect(cx - 18, 40, 4, 28);
      g.fillRect(cx + 14,  40, 4, 28);
      // dark energy recess
      g.fillStyle(DARK);
      g.fillRect(cx - 10, 46, 20, 16);

      // shoulders
      g.fillStyle(METAL);
      g.fillRect(cx - 28, 22, 16, 12);
      g.fillRect(cx + 12,  22, 16, 12);
      g.fillStyle(YELLOW);
      g.fillRect(cx - 28, 22, 16, 2);
      g.fillRect(cx + 12,  22, 16, 2);

      // head/cab
      const headTilt = (f === 3) ? 3 : 0;
      g.fillStyle(METAL);
      g.fillRect(cx - 15 + headTilt, 4, 30, 18);
      g.fillStyle(DARK);
      g.fillRect(cx - 15 + headTilt, 4, 30, 18);
      g.fillStyle(YELLOW);
      g.fillRect(cx - 10 + headTilt, 8, 4, 4);
      g.fillRect(cx + 6 + headTilt,  8, 4, 4);
      g.fillStyle(METAL);
      g.fillRect(cx - 15 + headTilt, 4, 30, 3);
    }

    g.generateTexture('excavator_prime', FW * 4, FH);
    g.destroy();

    const tex = this.textures.get('excavator_prime');
    for (let i = 0; i < 4; i++) {
      tex.add(i, 0, i * FW, 0, FW, FH);
    }
  }

  /**
   * The Governor — human collaborator in a suit.
   * 32×48 per frame, 4 frames: arms crossed, gesturing, commanding, shocked.
   */
  private _generateTheGovernorTexture(): void {
    const FW = 32, FH = 48;
    const SUIT  = 0x1a1a2e;
    const SHIRT = 0xe8e8e8;
    const SKIN  = 0xd4a880;
    const HAIR  = 0x2a2010;
    const BLACK = 0x111111;

    const g = this.make.graphics({}, false);

    for (let f = 0; f < 4; f++) {
      const ox = f * FW;
      const cx = ox + FW / 2;

      // shoes
      g.fillStyle(BLACK);
      g.fillRect(cx - 8, 44, 7, 4);
      g.fillRect(cx + 1,  44, 7, 4);

      // trousers
      g.fillStyle(SUIT);
      g.fillRect(cx - 7, 36, 6, 8);
      g.fillRect(cx + 1,  36, 6, 8);

      // jacket
      g.fillStyle(SUIT);
      g.fillRect(cx - 10, 20, 20, 17);

      // lapels (shirt)
      g.fillStyle(SHIRT);
      g.fillRect(cx - 7, 20, 4, 10);
      g.fillRect(cx + 3,  20, 4, 10);
      // shirt front
      g.fillRect(cx - 2, 16, 4, 5);

      // arms — vary per frame
      if (f === 0) {
        // arms crossed
        g.fillStyle(SUIT);
        g.fillRect(cx - 10, 22, 6, 12);
        g.fillRect(cx + 4,  22, 6, 12);
        g.fillStyle(SKIN);
        g.fillRect(cx - 10, 34, 6, 4);
        g.fillRect(cx + 4,  34, 6, 4);
      } else if (f === 1) {
        // right arm down, left raised
        g.fillStyle(SUIT);
        g.fillRect(cx - 10, 22, 6, 14);
        g.fillRect(cx + 4,  18, 6, 10);
        g.fillStyle(SKIN);
        g.fillRect(cx - 10, 36, 6, 4);
        g.fillRect(cx + 4,  28, 6, 4);
      } else if (f === 2) {
        // both outstretched (commanding)
        g.fillStyle(SUIT);
        g.fillRect(cx - 14, 22, 8, 10);
        g.fillRect(cx + 6,  22, 8, 10);
        g.fillStyle(SKIN);
        g.fillRect(cx - 14, 32, 6, 4);
        g.fillRect(cx + 8,  32, 6, 4);
      } else {
        // f === 3: shocked, bent posture
        g.fillStyle(SUIT);
        g.fillRect(cx - 10, 24, 6, 10);
        g.fillRect(cx + 4,  24, 6, 10);
        g.fillStyle(SKIN);
        g.fillRect(cx - 10, 34, 6, 4);
        g.fillRect(cx + 4,  34, 6, 4);
      }

      // head — shift down 1px on f===3
      const headY = (f === 3) ? 1 : 0;
      g.fillStyle(SKIN);
      g.fillCircle(cx, 10 + headY, 7);

      // hair
      g.fillStyle(HAIR);
      g.fillRect(cx - 7, 3 + headY, 14, 5);
      g.fillRect(cx - 7, 6 + headY, 3, 5);
      g.fillRect(cx + 4,  6 + headY, 3, 5);

      // eyes — narrow
      g.fillStyle(BLACK);
      g.fillRect(cx - 4, 10 + headY, 2, 2);
      g.fillRect(cx + 2,  10 + headY, 2, 2);

      // mouth — straight line (not smiling); wider on f===3 (shock)
      g.fillStyle(BLACK);
      if (f === 3) {
        g.fillRect(cx - 3, 15 + headY, 6, 2);
      } else {
        g.fillRect(cx - 2, 15 + headY, 4, 1);
      }
    }

    g.generateTexture('the_governor', FW * 4, FH);
    g.destroy();

    const tex = this.textures.get('the_governor');
    for (let i = 0; i < 4; i++) {
      tex.add(i, 0, i * FW, 0, FW, FH);
    }
  }

  /**
   * Sentinel Spire — tower-sized broadcast jammer.
   * 48×96 per frame, 4 frames: idle-A, idle-B, attack (dishes angled in), hit (damaged).
   */
  private _generateSentinelSpireTexture(): void {
    const FW = 48, FH = 96;
    const GRAY   = 0x5a5a5a;
    const SILVER = 0x9aaa9a;
    const GREEN  = 0x00aa44;
    const DARK   = 0x222222;

    const g = this.make.graphics({}, false);

    for (let f = 0; f < 4; f++) {
      const ox = f * FW;
      const cx = ox + FW / 2;

      // silo base
      g.fillStyle(GRAY);
      g.fillRect(cx - 18, 76, 36, 20);
      g.fillStyle(DARK);
      g.fillRect(cx - 18, 76, 36, 2);

      // tower shaft
      g.fillStyle(GRAY);
      g.fillRect(cx - 8, 16, 16, 60);
      // vertical edge lines
      g.fillStyle(DARK);
      g.fillRect(cx - 8, 16, 2, 60);
      g.fillRect(cx + 6,  16, 2, 60);

      // signal strips — left and right of shaft
      // on f===3 damaged: leave a gap in the left strip
      if (f === 3) {
        g.fillStyle(GREEN);
        g.fillRect(cx - 6, 16, 2, 25);
        // gap at 41–47
        g.fillRect(cx - 6, 48, 2, 28);
      } else {
        g.fillStyle(GREEN);
        g.fillRect(cx - 6, 16, 2, 60);
      }
      g.fillStyle(GREEN);
      g.fillRect(cx + 4,  16, 2, 60);

      // broadcast dishes — asymmetric heights
      const leftDishY  = (f === 0) ? 30 : (f === 1) ? 28 : (f === 2) ? 32 : 30;
      const rightDishY = (f === 0) ? 44 : (f === 1) ? 46 : (f === 2) ? 42 : 44;
      const leftInset  = (f === 2) ? 2 : 0;
      const rightInset = (f === 2) ? 2 : 0;

      // left dish
      g.fillStyle(DARK);
      g.fillRect(cx - 18,          leftDishY,  4, 6);  // mounting bracket
      g.fillStyle(SILVER);
      g.fillRect(cx - 22 + leftInset, leftDishY,  16, 12);
      g.fillStyle(GRAY);
      g.fillRect(cx - 22 + leftInset, leftDishY,  16, 2);

      // right dish (damaged on f===3 — shifted sharply)
      const rightDmg = (f === 3) ? 4 : 0;
      g.fillStyle(DARK);
      g.fillRect(cx + 14,           rightDishY,  4, 6);
      g.fillStyle(SILVER);
      g.fillRect(cx + 8 - rightInset + rightDmg, rightDishY, 16, 12);
      g.fillStyle(GRAY);
      g.fillRect(cx + 8 - rightInset + rightDmg, rightDishY, 16, 2);

      // sensor cluster at top
      g.fillStyle(DARK);
      g.fillRect(cx - 10, 4, 20, 14);
      g.fillStyle(SILVER);
      g.fillRect(cx - 10, 4, 20, 2);
      // green sensor squares
      g.fillStyle(GREEN);
      g.fillRect(cx - 7, 8, 4, 4);
      g.fillRect(cx + 3,  8, 4, 4);
    }

    g.generateTexture('sentinel_spire', FW * 4, FH);
    g.destroy();

    const tex = this.textures.get('sentinel_spire');
    for (let i = 0; i < 4; i++) {
      tex.add(i, 0, i * FW, 0, FW, FH);
    }
  }

  /**
   * Gate Colossus — titan-class border guardian.
   * 80×96 per frame, 4 frames: idle-A, idle-B, attack (gate closing), hit (damage).
   */
  private _generateGateColossusTexture(): void {
    const FW = 80, FH = 96;
    const DARK  = 0x0d0d1a;
    const STEEL = 0x2a2a44;
    const BLUE  = 0x0044aa;
    const WHITE = 0xeeeeff;

    const g = this.make.graphics({}, false);

    for (let f = 0; f < 4; f++) {
      const ox = f * FW;
      const cx = ox + FW / 2;

      // shadow
      g.fillStyle(0x000000, 0.15);
      g.fillEllipse(cx, FH - 4, 60, 8);

      // foot plates
      g.fillStyle(STEEL);
      g.fillRect(cx - 26, 86, 20, 10);
      g.fillRect(cx + 6,  86, 20, 10);

      // legs
      g.fillStyle(DARK);
      g.fillRect(cx - 18, 72, 16, 18);
      g.fillRect(cx + 2,  72, 16, 18);
      g.fillStyle(STEEL);
      g.fillRect(cx - 18, 72, 16, 3);
      g.fillRect(cx + 2,  72, 16, 3);

      // fists/weapons — move inward on f===2
      const fistInset = (f === 2) ? 8 : 0;
      g.fillStyle(STEEL);
      g.fillRect(cx - 28 + fistInset, 62, 18, 14);
      g.fillRect(cx + 10 - fistInset, 62, 18, 14);
      g.fillStyle(DARK);
      g.fillRect(cx - 28 + fistInset, 62, 18, 2);
      g.fillRect(cx + 10 - fistInset, 62, 18, 2);

      // arms
      const armInset = (f === 2) ? 4 : 0;
      g.fillStyle(STEEL);
      g.fillRect(cx - 24 + armInset, 34, 14, 28);
      g.fillRect(cx + 10 - armInset, 34, 14, 28);
      // light clusters on arms
      g.fillStyle(WHITE);
      g.fillRect(cx - 22 + armInset, 44, 4, 4);
      g.fillRect(cx + 18 - armInset, 44, 4, 4);

      // massive shoulders (extend to edges)
      g.fillStyle(STEEL);
      g.fillRect(ox,      28, 18, 14);
      g.fillRect(ox + 62, 28, 18, 14);
      g.fillStyle(WHITE);
      g.fillRect(ox,      28, 18, 2);
      g.fillRect(ox + 62, 28, 18, 2);

      // torso
      const bodyShift = (f === 3) ? 3 : 0;
      g.fillStyle(DARK);
      g.fillRect(cx - 18 + bodyShift, 42, 36, 30);
      // blue scanner stripe
      const scannerBlue = (f === 2) ? 0x0088ff : BLUE;
      g.fillStyle(scannerBlue);
      g.fillRect(cx - 4 + bodyShift, 44, 8, 26);
      g.fillStyle(STEEL);
      g.fillRect(cx - 18 + bodyShift, 42, 36, 3);

      // neck brace
      g.fillStyle(STEEL);
      g.fillRect(cx - 16 + bodyShift, 28, 32, 8);

      // head
      g.fillStyle(DARK);
      g.fillRect(cx - 12 + bodyShift, 4, 24, 16);
      g.fillStyle(STEEL);
      g.fillRect(cx - 12 + bodyShift, 4, 24, 2);

      // eye arrays — expand on f===1, one goes white on f===3
      const eyeW1 = (f === 1) ? 8 : 6;
      const eye1Color = (f === 3) ? WHITE : (f === 2) ? 0x0088ff : BLUE;
      const eye2Color = (f === 2) ? 0x0088ff : BLUE;
      g.fillStyle(eye1Color);
      g.fillRect(cx - 10 + bodyShift, 9, eyeW1, 4);
      g.fillStyle(eye2Color);
      g.fillRect(cx + 4 + bodyShift,  9, 6, 4);
    }

    g.generateTexture('gate_colossus', FW * 4, FH);
    g.destroy();

    const tex = this.textures.get('gate_colossus');
    for (let i = 0; i < 4; i++) {
      tex.add(i, 0, i * FW, 0, FW, FH);
    }
  }

  /**
   * Elise Voss — final boss, human, 58, composed.
   * 32×48 per frame, 4 frames: composed, grief-stricken, resolved (attack), crack in composure (hit).
   */
  private _generateEliseVossTexture(): void {
    const FW = 32, FH = 48;
    const JACKET = 0x334455;
    const SHIRT  = 0xccddcc;
    const SKIN   = 0xd4a880;
    const HAIR   = 0x888878;
    const BLACK  = 0x111111;
    const WHITE  = 0xeeeeff;

    const g = this.make.graphics({}, false);

    for (let f = 0; f < 4; f++) {
      const ox = f * FW;
      const cx = ox + FW / 2;

      // shoes
      g.fillStyle(BLACK);
      g.fillRect(cx - 7, 44, 6, 4);
      g.fillRect(cx + 1,  44, 6, 4);

      // f===3: torso shifted back 2px
      const bodyShift = (f === 3) ? 2 : 0;
      // f===1: hands inward 2px (closed posture)
      const handInset = (f === 1) ? 2 : 0;
      // f===2: right hand raised 8px
      const rightHandY = (f === 2) ? 22 : 34;

      // trousers (proper placement)
      g.fillStyle(JACKET);
      g.fillRect(cx - 6 + bodyShift, 36, 5, 8);
      g.fillRect(cx + 1 + bodyShift,  36, 5, 8);

      // jacket
      g.fillRect(cx - 10 + bodyShift, 20, 20, 17);

      // lapels
      g.fillStyle(SHIRT);
      g.fillRect(cx - 7 + bodyShift, 20, 4, 10);
      g.fillRect(cx + 3 + bodyShift,  20, 4, 10);
      // shirt front
      g.fillRect(cx - 2 + bodyShift, 16, 4, 5);

      // arms
      g.fillStyle(JACKET);
      // left arm
      g.fillRect(cx - 10 + bodyShift + handInset, 22, 5, 12);
      // right arm
      g.fillRect(cx + 5 + bodyShift - handInset,  22, 5, 12);

      // hands
      g.fillStyle(SKIN);
      // left hand
      g.fillRect(cx - 10 + bodyShift + handInset, 34, 4, 4);
      // right hand — raised on f===2
      g.fillRect(cx + 5 + bodyShift - handInset,  rightHandY, 4, 4);

      // head — drop 1px on f===1
      const headDrop = (f === 1) ? 1 : 0;
      g.fillStyle(SKIN);
      g.fillCircle(cx + bodyShift, 10 + headDrop, 7);

      // hair — swept back (no bangs)
      g.fillStyle(HAIR);
      g.fillRect(cx - 7 + bodyShift, 3 + headDrop, 14, 6);
      g.fillRect(cx + 5 + bodyShift,  5 + headDrop, 4, 8);

      // brow — furrow on f===1
      const browInset = (f === 1) ? 1 : 0;
      g.fillStyle(0x997766);
      g.fillRect(cx - 6 + bodyShift + browInset, 8 + headDrop, 3, 1);
      g.fillRect(cx + 3 + bodyShift - browInset, 8 + headDrop, 3, 1);

      // eyes — narrow; one drops on f===3
      g.fillStyle(BLACK);
      const leftEyeY  = 11 + headDrop;
      const rightEyeY = (f === 3) ? 12 + headDrop : 11 + headDrop;
      g.fillRect(cx - 5 + bodyShift, leftEyeY,  2, 2);
      g.fillRect(cx + 3 + bodyShift, rightEyeY, 2, 2);
      // eye highlight
      g.fillStyle(WHITE);
      g.fillRect(cx - 4 + bodyShift, leftEyeY,  1, 1);
      g.fillRect(cx + 4 + bodyShift, rightEyeY, 1, 1);

      // mouth — neutral, slight ambiguity
      g.fillStyle(BLACK);
      g.fillRect(cx - 2 + bodyShift, 16 + headDrop, 4, 1);
      // slight upturn pixels (ambiguous expression)
      g.fillStyle(0xc09080);
      g.fillRect(cx - 3 + bodyShift, 17 + headDrop, 1, 1);
      g.fillRect(cx + 2 + bodyShift, 17 + headDrop, 1, 1);
    }

    g.generateTexture('elise_voss', FW * 4, FH);
    g.destroy();

    const tex = this.textures.get('elise_voss');
    for (let i = 0; i < 4; i++) {
      tex.add(i, 0, i * FW, 0, FW, FH);
    }
  }
}
