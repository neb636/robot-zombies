import { BattleState }  from '../BattleState.js';
import { BATTLE_STATES, GAME_FLAGS, setFlag } from '../../utils/constants.js';

export class MarcusConversionState extends BattleState {
  enter(): void {
    const { dialogueManager, scene } = this.manager;
    const marcus = this.manager.allies.find(a => a.name === 'MARCUS');
    if (!marcus) {
      this.manager.goTo(BATTLE_STATES.ATB_TICKING);
      return;
    }

    const marcusSprite = marcus.sprite;
    const enemySprite = this.manager.enemy.sprite;

    // Step 1: Marcus steps forward
    dialogueManager.show('SYSTEM', ['Marcus steps forward.']);

    document.addEventListener('dialogue:advance', () => {
      // Step 2: Tween Marcus toward the enemy
      scene.tweens.add({
        targets: marcusSprite,
        x: enemySprite ? enemySprite.x - 40 : marcusSprite.x + 120,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          this._conversionBeam(marcusSprite);
        },
      });
    }, { once: true });
  }

  private _conversionBeam(marcusSprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle): void {
    const { scene, dialogueManager, hud } = this.manager;
    const { width, height } = scene.scale;

    // Step 3: Screen flash white (conversion beam)
    const flash = scene.add.rectangle(width / 2, height / 2, width, height, 0xffffff);
    flash.setAlpha(0).setDepth(100);

    scene.tweens.add({
      targets: flash,
      alpha: 0.8,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        flash.destroy();

        // Step 4: Tint Marcus cold blue/gray
        if ('setTint' in marcusSprite) {
          (marcusSprite as Phaser.GameObjects.Sprite).setTint(0x667799);
        } else {
          (marcusSprite as Phaser.GameObjects.Rectangle).setFillStyle(0x667799);
        }

        // Step 5: Dialogue — silence
        dialogueManager.show('SYSTEM', ['...']);

        document.addEventListener('dialogue:advance', () => {
          // Step 6: Marcus walks off-screen
          scene.tweens.add({
            targets: marcusSprite,
            x: scene.scale.width + 60,
            duration: 1200,
            ease: 'Linear',
            onComplete: () => {
              // Step 7: Remove Marcus from battle
              this.manager.removeAlly('MARCUS');
              hud.darkenAlly('MARCUS');

              // Step 8: Set flag
              setFlag(scene.registry, GAME_FLAGS.MARCUS_CONVERTED, true);

              // Step 9: Brief pause, then player continues alone
              dialogueManager.show('SYSTEM', ['You are alone now.']);
              document.addEventListener('dialogue:advance', () => {
                this.manager.goTo(BATTLE_STATES.ATB_TICKING);
              }, { once: true });
            },
          });
        }, { once: true });
      },
    });
  }
}
