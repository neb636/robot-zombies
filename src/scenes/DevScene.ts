import Phaser from 'phaser';
import { jumpToScene } from '../utils/devJump.js';

const SCENES = [
  'TitleScene',
  'NameEntryScene',
  'PrologueScene',
  'NewBostonScene',
  'SubwayScene',
  'WorldMapScene',
  'BattleScene',
];

const PANEL_WIDTH  = 220;
const PANEL_PAD    = 14;
const ROW_HEIGHT   = 32;
const PANEL_HEIGHT = PANEL_PAD * 2 + SCENES.length * ROW_HEIGHT;

/**
 * DevScene — persistent dev overlay (active only in dev builds).
 * Press backtick (`) to toggle the scene-jump panel.
 */
export class DevScene extends Phaser.Scene {
  private panel!: Phaser.GameObjects.Container;
  private visible = false;

  constructor() {
    super({ key: 'DevScene', active: true });
  }

  create(): void {
    const { width, height } = this.scale;
    const x = width  - PANEL_WIDTH - 10;
    const y = height - PANEL_HEIGHT - 10;

    // Background rect
    const bg = this.add.rectangle(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 0x000000, 0.85)
      .setOrigin(0, 0);

    // Header
    const header = this.add.text(PANEL_PAD, PANEL_PAD - 4, '[DEV] jump to scene', {
      fontSize: '11px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    });

    // Scene buttons
    const buttons = SCENES.map((name, i) => {
      const ty = PANEL_PAD + 18 + i * ROW_HEIGHT;
      const label = this.add.text(PANEL_PAD, ty, name, {
        fontSize: '13px',
        color: '#00ff88',
        fontFamily: 'monospace',
      })
        .setInteractive({ useHandCursor: true })
        .on('pointerover',  () => { label.setColor('#ffffff'); })
        .on('pointerout',   () => { label.setColor('#00ff88'); })
        .on('pointerdown',  () => {
          this.panel.setVisible(false);
          this.visible = false;
          jumpToScene(this.game, name);
        });
      return label;
    });

    this.panel = this.add.container(x, y, [bg, header, ...buttons]);
    this.panel.setDepth(9999);
    this.panel.setVisible(false);

    // Reposition on resize
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.panel.setPosition(
        gameSize.width  - PANEL_WIDTH - 10,
        gameSize.height - PANEL_HEIGHT - 10,
      );
    });

    this.input.keyboard!.on('keydown-BACKTICK', () => {
      this.visible = !this.visible;
      this.panel.setVisible(this.visible);
    });
  }
}
