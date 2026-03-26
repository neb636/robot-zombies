import Phaser from 'phaser';
import { BattleManager }   from '../battle/BattleManager.js';
import { BattleHUD }       from '../ui/BattleHUD.js';
import { AudioManager }    from '../audio/AudioManager.js';
import { DialogueManager } from '../dialogue/DialogueManager.js';
import { EVENTS }          from '../utils/constants.js';
import { bus }             from '../utils/EventBus.js';
import type { BattleInitData } from '../types.js';
import { pauseMenu }           from '../ui/PauseMenu.js';

/**
 * BattleScene — launched in parallel on top of another scene.
 */
export class BattleScene extends Phaser.Scene {
  private initData!:        BattleInitData;
  private audioManager!:    AudioManager;
  private dialogueManager!: DialogueManager;
  private battleManager!:   BattleManager;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: Partial<BattleInitData>): void {
    const base: BattleInitData = {
      enemyKey:    data.enemyKey    ?? 'compliance_drone',
      returnScene: data.returnScene ?? 'WorldMapScene',
    };
    if (data.allies)     base.allies     = data.allies;
    if (data.scripted != null) base.scripted = data.scripted;
    if (data.bossConfig) base.bossConfig = data.bossConfig;
    this.initData = base;
  }

  create(): void {
    pauseMenu.setBlocked(true);
    this._buildBackground();

    this.audioManager    = new AudioManager(this);
    this.dialogueManager = new DialogueManager(this);
    const hud            = new BattleHUD(this);
    this.battleManager   = new BattleManager(this, {
      initData:        this.initData,
      hud,
      audioManager:    this.audioManager,
      dialogueManager: this.dialogueManager,
    });

    this.audioManager.playMusic('music-battle');
    this.battleManager.start();
  }

  update(time: number, delta: number): void {
    this.battleManager.update(time, delta);
  }

  endBattle(victory: boolean): void {
    pauseMenu.setBlocked(false);
    this.audioManager.stopMusic();
    bus.emit(EVENTS.BATTLE_END, { victory });
    this.scene.stop();
    this.scene.resume(this.initData.returnScene);
  }

  private _buildBackground(): void {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, width, height);

    this.add.graphics()
      .lineStyle(2, 0x334466)
      .lineBetween(0, height * 0.65, width, height * 0.65);

    const label = this.add.text(width / 2, height * 0.15, '! ENCOUNTER !', {
      fontFamily: 'monospace',
      fontSize:   '22px',
      color:      '#ff4444',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets:  label,
      alpha:    { from: 0, to: 1 },
      yoyo:     true,
      duration: 400,
      repeat:   2,
    });
  }
}
