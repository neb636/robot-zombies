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

    // Audio
    this.load.audio('music-overworld', 'assets/audio/music/overworld.ogg');
    this.load.audio('music-battle',    'assets/audio/music/battle.ogg');
    this.load.audio('sfx-attack',      'assets/audio/sfx/attack.ogg');
    this.load.audio('sfx-heal',        'assets/audio/sfx/heal.ogg');
    this.load.audio('sfx-menu',        'assets/audio/sfx/menu_select.ogg');
  }

  create() {
    this._registerAnimations();
    this.scene.start('TitleScene');
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
