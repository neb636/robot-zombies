import Phaser from 'phaser';
import { BattleManager }   from '../battle/BattleManager.js';
import { BattleHUD }       from '../ui/BattleHUD.js';
import { AudioManager }    from '../audio/AudioManager.js';
import { DialogueManager } from '../dialogue/DialogueManager.js';
import { EVENTS }          from '../utils/constants.js';
import { bus }             from '../utils/EventBus.js';

/**
 * BattleScene — launched in parallel on top of WorldMapScene.
 */
export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data) {
    this.enemyKey    = data.enemyKey    || 'robot_zombie';
    this.returnScene = data.returnScene || 'WorldMapScene';
  }

  create() {
    this._buildBackground();

    this.audioManager    = new AudioManager(this);
    this.dialogueManager = new DialogueManager(this);
    this.hud             = new BattleHUD(this);
    this.battleManager   = new BattleManager(this, {
      enemyKey:        this.enemyKey,
      hud:             this.hud,
      audioManager:    this.audioManager,
      dialogueManager: this.dialogueManager,
    });

    this.audioManager.playMusic('music-battle');
    this.battleManager.start();
  }

  update(time, delta) {
    this.battleManager.update(time, delta);
  }

  endBattle(victory) {
    this.audioManager.stopMusic();
    bus.emit(EVENTS.BATTLE_END, { victory });
    this.scene.stop();
    this.scene.resume(this.returnScene);
  }

  _buildBackground() {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, width, height);

    // Ground line
    this.add.graphics()
      .lineStyle(2, 0x334466)
      .lineBetween(0, height * 0.65, width, height * 0.65);

    // "ENCOUNTER" flash label
    const label = this.add.text(width / 2, height * 0.15, '! ENCOUNTER !', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ff4444',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: label,
      alpha: { from: 0, to: 1 },
      yoyo: true,
      duration: 400,
      repeat: 2,
    });
  }
}
