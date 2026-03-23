import Phaser from 'phaser';

/**
 * PreloadScene — loads all game assets with a progress bar.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    this._buildProgressBar();

    // Tilemaps
    this.load.tilemapTiledJSON('world-map', 'assets/tilemaps/world.json');
    this.load.image('world-tiles', 'assets/tilesets/world_tiles.png');

    // Spritesheets — hero: 48x48, robot zombie: 64x64
    this.load.spritesheet('hero', 'assets/sprites/hero.png', {
      frameWidth: 48, frameHeight: 48,
    });
    this.load.spritesheet('robot_zombie', 'assets/sprites/robot_zombie.png', {
      frameWidth: 64, frameHeight: 64,
    });

    // Audio is handled by Howler (AudioManager) — no Phaser audio loads needed.
  }

  create() {
    if (!this.textures.exists('hero')) this._generateHeroTexture();
    this._registerAnimations();
    this.scene.start('TitleScene');
  }

  /**
   * Draws a simple top-down humanoid character into an 8-frame spritesheet
   * (48×48 per frame) and registers it as the 'hero' texture.
   * Frame layout: [down×2, left×2, right×2, up×2]
   */
  _generateHeroTexture() {
    const FW = 48, FH = 48;
    const g = this.make.graphics({ add: false });

    // Palette
    const SKIN   = 0xe8c090;
    const HAIR   = 0x3a2008;
    const SHIRT  = 0x3355cc;
    const SHIRT2 = 0x2244aa; // back-facing variant
    const PANTS  = 0x1e2a4a;
    const SHOES  = 0x2a1a0a;
    const EYE    = 0x111122;
    const MOUTH  = 0xc07050;

    const frames = [
      ['down', 0], ['down', 1],
      ['left', 0], ['left', 1],
      ['right',0], ['right',1],
      ['up',   0], ['up',   1],
    ];

    frames.forEach(([dir, leg], i) => {
      const ox = i * FW;       // frame x-offset in the atlas
      const cx = ox + FW / 2;  // centre x of this frame

      // Shadow under feet
      g.fillStyle(0x000000, 0.18);
      g.fillEllipse(cx, 44, 18, 7);

      // Leg alternation offset (simulates a walking cycle)
      const la = leg === 0 ? 2 : 0; // "left leg forward" offset
      const ra = 2 - la;             // "right leg forward" offset

      if (dir === 'down') {
        // Legs
        g.fillStyle(PANTS);
        g.fillRect(cx - 7, 30 + la, 5, 12);
        g.fillRect(cx + 2,  30 + ra, 5, 12);
        // Shoes
        g.fillStyle(SHOES);
        g.fillRect(cx - 8, 41, 7, 5);
        g.fillRect(cx + 1,  41, 7, 5);
        // Body
        g.fillStyle(SHIRT);
        g.fillRect(cx - 8, 20, 16, 12);
        // Arms
        g.fillStyle(SKIN);
        g.fillRect(cx - 13, 21 + la, 5, 9);
        g.fillRect(cx + 8,  21 + ra, 5, 9);
        // Head
        g.fillStyle(SKIN);
        g.fillCircle(cx, 13, 9);
        // Hair
        g.fillStyle(HAIR);
        g.fillRect(cx - 9, 5, 18, 7);
        g.fillRect(cx - 9, 7, 4, 8);
        g.fillRect(cx + 5, 7, 4, 8);
        // Eyes
        g.fillStyle(EYE);
        g.fillCircle(cx - 3, 14, 1.5);
        g.fillCircle(cx + 3, 14, 1.5);
        // Mouth
        g.fillStyle(MOUTH);
        g.fillRect(cx - 2, 18, 5, 2);

      } else if (dir === 'up') {
        // Legs (same silhouette, darker shirt back)
        g.fillStyle(PANTS);
        g.fillRect(cx - 7, 30 + la, 5, 12);
        g.fillRect(cx + 2,  30 + ra, 5, 12);
        g.fillStyle(SHOES);
        g.fillRect(cx - 8, 41, 7, 5);
        g.fillRect(cx + 1,  41, 7, 5);
        // Body (back view — slightly darker)
        g.fillStyle(SHIRT2);
        g.fillRect(cx - 8, 20, 16, 12);
        g.fillStyle(SKIN);
        g.fillRect(cx - 13, 21 + la, 5, 9);
        g.fillRect(cx + 8,  21 + ra, 5, 9);
        // Head (back — fully covered by hair)
        g.fillStyle(SKIN);
        g.fillCircle(cx, 13, 9);
        g.fillStyle(HAIR);
        g.fillCircle(cx, 12, 9);
        g.fillRect(cx - 9, 12, 18, 7);

      } else if (dir === 'left') {
        // Legs (one slightly behind the other)
        g.fillStyle(PANTS);
        g.fillRect(cx - 4, 30 + la, 5, 12);
        g.fillRect(cx - 2, 30 + ra, 4, 10);
        g.fillStyle(SHOES);
        g.fillRect(cx - 10, 41, 10, 4);
        // Body (side view — narrower)
        g.fillStyle(SHIRT);
        g.fillRect(cx - 6, 20, 11, 12);
        // Front arm swings
        g.fillStyle(SKIN);
        g.fillRect(cx - 11, 21 + la, 6, 9);
        // Head (profile left)
        g.fillStyle(SKIN);
        g.fillCircle(cx - 1, 13, 8);
        // Hair
        g.fillStyle(HAIR);
        g.fillRect(cx - 9, 6, 13, 6);
        g.fillRect(cx + 3, 7, 4, 9); // back of head
        // Eye
        g.fillStyle(EYE);
        g.fillCircle(cx - 6, 13, 1.5);
        // Nose
        g.fillStyle(MOUTH);
        g.fillRect(cx - 10, 17, 3, 2);

      } else { // right
        g.fillStyle(PANTS);
        g.fillRect(cx - 1, 30 + la, 5, 12);
        g.fillRect(cx - 2, 30 + ra, 4, 10);
        g.fillStyle(SHOES);
        g.fillRect(cx,     41, 10, 4);
        g.fillStyle(SHIRT);
        g.fillRect(cx - 5, 20, 11, 12);
        g.fillStyle(SKIN);
        g.fillRect(cx + 5, 21 + la, 6, 9);
        g.fillStyle(SKIN);
        g.fillCircle(cx + 1, 13, 8);
        g.fillStyle(HAIR);
        g.fillRect(cx - 4, 6, 13, 6);
        g.fillRect(cx - 7, 7, 4, 9);
        g.fillStyle(EYE);
        g.fillCircle(cx + 6, 13, 1.5);
        g.fillStyle(MOUTH);
        g.fillRect(cx + 7, 17, 3, 2);
      }
    });

    g.generateTexture('hero', FW * frames.length, FH);
    g.destroy();

    // generateTexture produces a plain texture with no frame data.
    // Manually register each frame so generateFrameNumbers() works correctly.
    const texture = this.textures.get('hero');
    for (let i = 0; i < frames.length; i++) {
      texture.add(i, 0, i * FW, 0, FW, FH);
    }
  }

  _buildProgressBar() {
    const { width, height } = this.scale;
    const bar = this.add.graphics();

    this.add.text(width / 2, height / 2 - 40, 'ROBOTS', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#7af',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 12, 'The Overly Helpful Apocalypse', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#556',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(0x222244);
      bar.fillRect(width * 0.1, height * 0.55, width * 0.8, 20);
      bar.fillStyle(0x44aaff);
      bar.fillRect(width * 0.1, height * 0.55, width * 0.8 * value, 20);
    });

    this.load.on('complete', () => bar.destroy());
  }

  _registerAnimations() {
    if (this.textures.exists('hero')) {
      [
        { key: 'hero-walk-down',  frames: [0, 1] },
        { key: 'hero-walk-left',  frames: [2, 3] },
        { key: 'hero-walk-right', frames: [4, 5] },
        { key: 'hero-walk-up',    frames: [6, 7] },
      ].forEach(({ key, frames }) => {
        this.anims.create({ key, frames: this.anims.generateFrameNumbers('hero', { frames }), frameRate: 6, repeat: -1 });
      });
      this.anims.create({
        key: 'hero-idle',
        frames: this.anims.generateFrameNumbers('hero', { frames: [0] }),
        frameRate: 1,
        repeat: -1,
      });
    }

    if (this.textures.exists('robot_zombie')) {
      this.anims.create({
        key: 'robot-walk',
        frames: this.anims.generateFrameNumbers('robot_zombie', { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1,
      });
      this.anims.create({
        key: 'robot-attack',
        frames: this.anims.generateFrameNumbers('robot_zombie', { start: 4, end: 7 }),
        frameRate: 8,
        repeat: 0,
      });
      this.anims.create({
        key: 'robot-idle',
        frames: this.anims.generateFrameNumbers('robot_zombie', { frames: [0] }),
        frameRate: 1,
        repeat: -1,
      });
    }
  }
}
