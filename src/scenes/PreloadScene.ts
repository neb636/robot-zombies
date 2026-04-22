import Phaser from 'phaser';
import { jumpToScene } from '../utils/devJump.js';

/**
 * PreloadScene — loads all game assets with a progress bar.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this._buildProgressBar();

    this.load.tilemapTiledJSON('world-map', 'assets/tilemaps/world.json');
    this.load.image('world-tiles', 'assets/tilesets/world_tiles.png');

    this.load.spritesheet('hero', 'assets/sprites/hero.png', {
      frameWidth: 48, frameHeight: 48,
    });
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
  }

  create(): void {
    if (!this.textures.exists('hero'))            this._generateHeroTexture();
    if (!this.textures.exists('maya'))            this._generateMayaTexture();
    if (!this.textures.exists('warden_alpha'))    this._generateWardenAlphaTexture();
    if (!this.textures.exists('excavator_prime')) this._generateExcavatorPrimeTexture();
    if (!this.textures.exists('the_governor'))    this._generateTheGovernorTexture();
    if (!this.textures.exists('sentinel_spire'))  this._generateSentinelSpireTexture();
    if (!this.textures.exists('gate_colossus'))   this._generateGateColossusTexture();
    if (!this.textures.exists('elise_voss'))      this._generateEliseVossTexture();
    this._registerAnimations();

    if (import.meta.env.DEV) {
      this.scene.launch('DevScene');
      const params = new URLSearchParams(window.location.search);
      const devTarget = params.get('dev');
      if (devTarget) {
        const enemy = params.get('enemy');
        jumpToScene(this.game, devTarget, enemy ? { enemy } : undefined);
        return;
      }
    }

    this.scene.start('TitleScene');
  }

  /**
   * Hero — bearded survivor in navy sweater, jean shorts, black shoes.
   * 48×48 per frame, 8 frames: [down×2, left×2, right×2, up×2].
   */
  private _generateHeroTexture(): void {
    const FW = 48, FH = 48;
    const g = this.make.graphics({}, false);

    const SKIN     = 0xe6b890;
    const SKIN_DK  = 0xb08460;
    const HAIR     = 0x4a2e14;
    const HAIR_HL  = 0x6a4220;
    const BEARD    = 0x2a1608;
    const SWEATER  = 0x1a2442;
    const SWEATER_D= 0x10182e;
    const DENIM    = 0x5478b0;
    const DENIM_D  = 0x3a568a;
    const SHOE     = 0x0e0e0e;
    const EYE      = 0x1a1a1a;
    const MOUTH    = 0x7a3a22;

    const frames: Array<['down' | 'left' | 'right' | 'up', 0 | 1]> = [
      ['down', 0], ['down', 1],
      ['left', 0], ['left', 1],
      ['right', 0], ['right', 1],
      ['up',   0], ['up',   1],
    ];

    const drawHeroFront = (cx: number): void => {
      // hair (back halo + top)
      g.fillStyle(HAIR);
      g.fillRect(cx - 7, 3, 14, 4);
      g.fillRect(cx - 8, 5, 16, 3);
      g.fillRect(cx - 8, 7, 3, 6);
      g.fillRect(cx + 5, 7, 3, 6);
      // face
      g.fillStyle(SKIN);
      g.fillRect(cx - 5, 6, 10, 9);
      g.fillRect(cx - 6, 8, 1, 5);
      g.fillRect(cx + 5, 8, 1, 5);
      // hair tousle highlights
      g.fillStyle(HAIR_HL);
      g.fillRect(cx - 4, 4, 3, 1);
      g.fillRect(cx + 1, 4, 3, 1);
      // eyes
      g.fillStyle(EYE);
      g.fillRect(cx - 4, 9, 2, 2);
      g.fillRect(cx + 2, 9, 2, 2);
      // beard
      g.fillStyle(BEARD);
      g.fillRect(cx - 6, 12, 12, 3);
      g.fillRect(cx - 5, 14, 10, 2);
      g.fillRect(cx - 7, 11, 2, 3);
      g.fillRect(cx + 5, 11, 2, 3);
      // mouth inside beard
      g.fillStyle(MOUTH);
      g.fillRect(cx - 1, 13, 3, 1);
    };

    const drawHeroBack = (cx: number): void => {
      // full head of hair
      g.fillStyle(HAIR);
      g.fillRect(cx - 7, 3, 14, 11);
      g.fillRect(cx - 8, 6, 16, 7);
      // hair highlights
      g.fillStyle(HAIR_HL);
      g.fillRect(cx - 5, 4, 3, 1);
      g.fillRect(cx + 1, 4, 3, 1);
      g.fillRect(cx - 2, 7, 4, 1);
      // neck
      g.fillStyle(SKIN);
      g.fillRect(cx - 2, 14, 4, 2);
    };

    const drawHeroProfile = (cx: number, facingLeft: boolean): void => {
      const s = facingLeft ? -1 : 1;
      // hair
      g.fillStyle(HAIR);
      g.fillRect(cx - 6, 3, 12, 4);
      g.fillRect(cx - 6, 5, 12, 3);
      g.fillRect(cx - 6 + (facingLeft ? 0 : 10), 5, 2, 7);
      // face profile
      g.fillStyle(SKIN);
      g.fillRect(cx - 5, 6, 10, 9);
      // nose bump
      g.fillStyle(SKIN_DK);
      g.fillRect(cx + 5 * s, 9, 1, 2);
      // hair highlight
      g.fillStyle(HAIR_HL);
      g.fillRect(cx - 3, 4, 3, 1);
      g.fillRect(cx + 1, 4, 3, 1);
      // eye (single, facing direction)
      g.fillStyle(EYE);
      g.fillRect(cx + 2 * s, 9, 2, 2);
      // beard
      g.fillStyle(BEARD);
      g.fillRect(cx - 5, 12, 10, 3);
      g.fillRect(cx - 5, 14, 9, 2);
      g.fillRect(cx - 6 + (facingLeft ? 0 : 10), 11, 2, 3);
    };

    frames.forEach(([dir, leg], i) => {
      const ox = i * FW;
      const cx = ox + FW / 2;

      // shadow
      g.fillStyle(0x000000, 0.22);
      g.fillEllipse(cx, 46, 20, 6);

      const la = leg === 0 ? 1 : -1;
      const ra = -la;

      if (dir === 'down' || dir === 'up') {
        // shoes (with leg-alternation offset)
        g.fillStyle(SHOE);
        g.fillRect(cx - 7, 43 + la, 6, 3);
        g.fillRect(cx + 1, 43 + ra, 6, 3);
        // shins (skin between shorts hem and shoes)
        g.fillStyle(SKIN);
        g.fillRect(cx - 6, 38 + la, 4, 5);
        g.fillRect(cx + 2, 38 + ra, 4, 5);
        // denim shorts
        g.fillStyle(DENIM);
        g.fillRect(cx - 8, 28, 16, 11);
        g.fillStyle(DENIM_D);
        g.fillRect(cx - 8, 37, 16, 2); // rolled cuff shadow
        g.fillRect(cx - 1, 28, 2, 11); // inseam
        // sweater torso
        g.fillStyle(SWEATER);
        g.fillRect(cx - 9, 16, 18, 13);
        g.fillStyle(SWEATER_D);
        g.fillRect(cx - 9, 27, 18, 2); // hem
        // arms
        g.fillStyle(SWEATER);
        g.fillRect(cx - 13, 17, 4, 11);
        g.fillRect(cx + 9,  17, 4, 11);
        // hands
        g.fillStyle(SKIN);
        g.fillRect(cx - 13, 27, 4, 3);
        g.fillRect(cx + 9,  27, 4, 3);
        // neck
        g.fillStyle(SKIN);
        g.fillRect(cx - 2, 15, 4, 2);

        if (dir === 'down') {
          drawHeroFront(cx);
        } else {
          drawHeroBack(cx);
        }

      } else {
        const facingLeft = dir === 'left';
        const s = facingLeft ? -1 : 1;

        // shoes (side-on, one foot ahead)
        g.fillStyle(SHOE);
        g.fillRect(cx - 5 + (leg === 0 ? -1 * s : 2 * s), 43, 8, 3);
        // shins
        g.fillStyle(SKIN);
        g.fillRect(cx - 4, 38, 3, 5);
        g.fillRect(cx + 1, 38, 3, 5);
        // shorts (narrower silhouette)
        g.fillStyle(DENIM);
        g.fillRect(cx - 5, 28, 10, 11);
        g.fillStyle(DENIM_D);
        g.fillRect(cx - 5, 37, 10, 2);
        // sweater torso (profile — narrower)
        g.fillStyle(SWEATER);
        g.fillRect(cx - 6, 16, 12, 13);
        g.fillStyle(SWEATER_D);
        g.fillRect(cx - 6, 27, 12, 2);
        // near-side arm swings
        const armX = facingLeft ? cx - 7 : cx + 3;
        const armSwing = leg === 0 ? 1 : -1;
        g.fillStyle(SWEATER);
        g.fillRect(armX, 17 + armSwing, 4, 11);
        g.fillStyle(SKIN);
        g.fillRect(armX, 27 + armSwing, 4, 3);
        // neck
        g.fillStyle(SKIN);
        g.fillRect(cx - 2, 15, 4, 2);

        drawHeroProfile(cx, facingLeft);
      }
    });

    g.generateTexture('hero', FW * frames.length, FH);
    g.destroy();

    const texture = this.textures.get('hero');
    for (let i = 0; i < frames.length; i++) {
      texture.add(i, 0, i * FW, 0, FW, FH);
    }
  }

  /**
   * Maya — tech specialist, long brown hair, blue hoodie over light tee, dark jeans, sneakers.
   * 48×48 per frame, 8 frames: [down×2, left×2, right×2, up×2].
   */
  private _generateMayaTexture(): void {
    const FW = 48, FH = 48;
    const g = this.make.graphics({}, false);

    const SKIN     = 0xe8c4a0;
    const SKIN_DK  = 0xb0866a;
    const HAIR     = 0x3a2010;
    const HAIR_HL  = 0x5a3420;
    const HOODIE   = 0x1e2a4a;
    const HOODIE_D = 0x131c33;
    const TEE      = 0x77bbdd;
    const TEE_D    = 0x5593b0;
    const JEANS    = 0x1a2040;
    const JEANS_D  = 0x10142a;
    const SNEAKER  = 0x6a4a2a;
    const SOLE     = 0xeeeeee;
    const EYE      = 0x1a1a1a;
    const MOUTH    = 0x993344;

    const frames: Array<['down' | 'left' | 'right' | 'up', 0 | 1]> = [
      ['down', 0], ['down', 1],
      ['left', 0], ['left', 1],
      ['right', 0], ['right', 1],
      ['up',   0], ['up',   1],
    ];

    const drawMayaFront = (cx: number): void => {
      // back hair flows past shoulders
      g.fillStyle(HAIR);
      g.fillRect(cx - 9, 4, 18, 5);
      g.fillRect(cx - 10, 7, 4, 18); // left flow
      g.fillRect(cx + 6,  7, 4, 18); // right flow
      // face
      g.fillStyle(SKIN);
      g.fillRect(cx - 5, 6, 10, 9);
      g.fillRect(cx - 6, 8, 1, 5);
      g.fillRect(cx + 5, 8, 1, 5);
      // hair top / fringe
      g.fillStyle(HAIR);
      g.fillRect(cx - 6, 4, 12, 4);
      g.fillRect(cx - 6, 7, 3, 2);
      g.fillRect(cx + 3, 7, 3, 2);
      // hair highlights
      g.fillStyle(HAIR_HL);
      g.fillRect(cx - 4, 5, 3, 1);
      g.fillRect(cx + 1, 5, 3, 1);
      g.fillRect(cx - 10, 10, 1, 10);
      g.fillRect(cx + 9,  10, 1, 10);
      // eyes
      g.fillStyle(EYE);
      g.fillRect(cx - 4, 10, 2, 2);
      g.fillRect(cx + 2, 10, 2, 2);
      // cheeks
      g.fillStyle(SKIN_DK);
      g.fillRect(cx - 4, 13, 1, 1);
      g.fillRect(cx + 3, 13, 1, 1);
      // mouth — small smile
      g.fillStyle(MOUTH);
      g.fillRect(cx - 1, 13, 3, 1);
    };

    const drawMayaBack = (cx: number): void => {
      // hair covers entire head + past shoulders
      g.fillStyle(HAIR);
      g.fillRect(cx - 7, 3, 14, 12);
      g.fillRect(cx - 9, 6, 18, 10);
      g.fillRect(cx - 10, 10, 4, 15);
      g.fillRect(cx + 6,  10, 4, 15);
      // hair highlight streaks
      g.fillStyle(HAIR_HL);
      g.fillRect(cx - 5, 5, 3, 1);
      g.fillRect(cx + 1, 5, 3, 1);
      g.fillRect(cx - 2, 9, 4, 1);
      g.fillRect(cx - 9, 14, 1, 10);
      g.fillRect(cx + 8, 14, 1, 10);
    };

    const drawMayaProfile = (cx: number, facingLeft: boolean): void => {
      const s = facingLeft ? -1 : 1;
      // long hair flowing behind
      g.fillStyle(HAIR);
      g.fillRect(cx - 6, 3, 12, 5);
      g.fillRect(cx - 6, 7, 12, 3);
      g.fillRect(cx - 6 + (facingLeft ? -1 : 10), 7, 3, 18);
      // face
      g.fillStyle(SKIN);
      g.fillRect(cx - 5, 6, 10, 9);
      // fringe over brow
      g.fillStyle(HAIR);
      g.fillRect(cx - 5, 7, 10, 2);
      g.fillStyle(HAIR_HL);
      g.fillRect(cx - 3, 5, 3, 1);
      g.fillRect(cx + 1, 5, 3, 1);
      // nose
      g.fillStyle(SKIN_DK);
      g.fillRect(cx + 5 * s, 10, 1, 2);
      // eye (single, facing direction)
      g.fillStyle(EYE);
      g.fillRect(cx + 2 * s, 10, 2, 2);
      // mouth
      g.fillStyle(MOUTH);
      g.fillRect(cx + 0, 13, 2, 1);
    };

    frames.forEach(([dir, leg], i) => {
      const ox = i * FW;
      const cx = ox + FW / 2;

      // shadow
      g.fillStyle(0x000000, 0.22);
      g.fillEllipse(cx, 46, 18, 6);

      const la = leg === 0 ? 1 : -1;
      const ra = -la;

      if (dir === 'down' || dir === 'up') {
        // sneakers with white soles
        g.fillStyle(SNEAKER);
        g.fillRect(cx - 6, 41 + la, 5, 4);
        g.fillRect(cx + 1, 41 + ra, 5, 4);
        g.fillStyle(SOLE);
        g.fillRect(cx - 6, 44 + la, 5, 1);
        g.fillRect(cx + 1, 44 + ra, 5, 1);
        // jeans (full length)
        g.fillStyle(JEANS);
        g.fillRect(cx - 7, 28, 14, 14);
        g.fillStyle(JEANS_D);
        g.fillRect(cx - 1, 28, 2, 14); // inseam
        g.fillRect(cx - 7, 40, 14, 2); // cuff
        // hoodie (unzipped, showing tee)
        g.fillStyle(HOODIE);
        g.fillRect(cx - 8, 16, 16, 13);
        // tee showing in center
        g.fillStyle(TEE);
        g.fillRect(cx - 2, 16, 4, 12);
        g.fillStyle(TEE_D);
        g.fillRect(cx - 2, 27, 4, 1);
        // zipper edges
        g.fillStyle(HOODIE_D);
        g.fillRect(cx - 3, 16, 1, 12);
        g.fillRect(cx + 2, 16, 1, 12);
        g.fillRect(cx - 8, 28, 16, 1);
        // hood lump at back of neck (small)
        g.fillStyle(HOODIE_D);
        g.fillRect(cx - 5, 15, 10, 2);
        // sleeves
        g.fillStyle(HOODIE);
        g.fillRect(cx - 12, 17, 4, 11);
        g.fillRect(cx + 8,  17, 4, 11);
        g.fillStyle(HOODIE_D);
        g.fillRect(cx - 12, 26, 4, 2);
        g.fillRect(cx + 8,  26, 4, 2);
        // hands
        g.fillStyle(SKIN);
        g.fillRect(cx - 12, 28, 4, 3);
        g.fillRect(cx + 8,  28, 4, 3);
        // neck
        g.fillStyle(SKIN);
        g.fillRect(cx - 2, 14, 4, 2);

        if (dir === 'down') {
          drawMayaFront(cx);
        } else {
          drawMayaBack(cx);
        }

      } else {
        const facingLeft = dir === 'left';
        const s = facingLeft ? -1 : 1;

        // sneakers (side, one foot ahead)
        g.fillStyle(SNEAKER);
        g.fillRect(cx - 4 + (leg === 0 ? -1 * s : 2 * s), 41, 7, 3);
        g.fillStyle(SOLE);
        g.fillRect(cx - 4 + (leg === 0 ? -1 * s : 2 * s), 43, 7, 1);
        // jeans
        g.fillStyle(JEANS);
        g.fillRect(cx - 5, 28, 10, 13);
        g.fillStyle(JEANS_D);
        g.fillRect(cx - 5, 39, 10, 2);
        // hoodie
        g.fillStyle(HOODIE);
        g.fillRect(cx - 6, 16, 12, 13);
        g.fillStyle(HOODIE_D);
        g.fillRect(cx - 6, 27, 12, 2);
        // near-side sleeve swings with leg
        const armX = facingLeft ? cx - 7 : cx + 3;
        const armSwing = leg === 0 ? 1 : -1;
        g.fillStyle(HOODIE);
        g.fillRect(armX, 17 + armSwing, 4, 11);
        g.fillStyle(SKIN);
        g.fillRect(armX, 27 + armSwing, 4, 3);
        // neck
        g.fillStyle(SKIN);
        g.fillRect(cx - 2, 14, 4, 2);

        drawMayaProfile(cx, facingLeft);
      }
    });

    g.generateTexture('maya', FW * frames.length, FH);
    g.destroy();

    const texture = this.textures.get('maya');
    for (let i = 0; i < frames.length; i++) {
      texture.add(i, 0, i * FW, 0, FW, FH);
    }
  }

  private _buildProgressBar(): void {
    const { width, height } = this.scale;
    const bar = this.add.graphics();

    this.add.text(width / 2, height / 2 - 40, 'ROBOTS', {
      fontFamily: 'monospace',
      fontSize:   '32px',
      color:      '#7af',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 12, 'The Overly Helpful Apocalypse', {
      fontFamily: 'monospace',
      fontSize:   '14px',
      color:      '#556',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x222244);
      bar.fillRect(width * 0.1, height * 0.55, width * 0.8, 20);
      bar.fillStyle(0x44aaff);
      bar.fillRect(width * 0.1, height * 0.55, width * 0.8 * value, 20);
    });

    this.load.on('complete', () => { bar.destroy(); });
  }

  private _registerAnimations(): void {
    if (this.textures.exists('hero')) {
      const heroAnims: Array<{ key: string; frames: number[] }> = [
        { key: 'hero-walk-down',  frames: [0, 1] },
        { key: 'hero-walk-left',  frames: [2, 3] },
        { key: 'hero-walk-right', frames: [4, 5] },
        { key: 'hero-walk-up',    frames: [6, 7] },
      ];
      heroAnims.forEach(({ key, frames }) => {
        this.anims.create({
          key,
          frames:    this.anims.generateFrameNumbers('hero', { frames }),
          frameRate: 6,
          repeat:    -1,
        });
      });
      this.anims.create({
        key:       'hero-idle',
        frames:    this.anims.generateFrameNumbers('hero', { frames: [0] }),
        frameRate: 1,
        repeat:    -1,
      });
    }

    if (this.textures.exists('maya')) {
      const mayaAnims: Array<{ key: string; frames: number[] }> = [
        { key: 'maya-walk-down',  frames: [0, 1] },
        { key: 'maya-walk-left',  frames: [2, 3] },
        { key: 'maya-walk-right', frames: [4, 5] },
        { key: 'maya-walk-up',    frames: [6, 7] },
      ];
      mayaAnims.forEach(({ key, frames }) => {
        this.anims.create({
          key,
          frames:    this.anims.generateFrameNumbers('maya', { frames }),
          frameRate: 6,
          repeat:    -1,
        });
      });
      this.anims.create({
        key:       'maya-idle',
        frames:    this.anims.generateFrameNumbers('maya', { frames: [0] }),
        frameRate: 1,
        repeat:    -1,
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
