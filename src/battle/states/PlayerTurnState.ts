import Phaser from 'phaser';
import { BattleState }                  from '../BattleState.js';
import { BATTLE_STATES, PLAYER_ACTIONS } from '../../utils/constants.js';
import type { BattleMenuAction }        from '../../types.js';

export class PlayerTurnState extends BattleState {
  private menuIndex: number = 0;
  private readonly menuItems: BattleMenuAction[] = [
    { label: 'ATTACK',  action: PLAYER_ACTIONS.ATTACK  },
    { label: 'HEAL',    action: PLAYER_ACTIONS.HEAL    },
    { label: 'SPECIAL', action: PLAYER_ACTIONS.SPECIAL },
    { label: 'FLEE',    action: PLAYER_ACTIONS.FLEE    },
  ];

  private _upKey?:    Phaser.Input.Keyboard.Key;
  private _downKey?:  Phaser.Input.Keyboard.Key;
  private _enterKey?: Phaser.Input.Keyboard.Key;
  private _spaceKey?: Phaser.Input.Keyboard.Key;

  enter(): void {
    this.manager.hud.showMenu(this.menuItems, this.menuIndex);
    this._setupKeys();
  }

  exit(): void {
    this._removeKeys();
    this.manager.hud.hideMenu();
  }

  private _setupKeys(): void {
    const kb = this.manager.scene.input.keyboard!;
    this._upKey    = kb.addKey('UP');
    this._downKey  = kb.addKey('DOWN');
    this._enterKey = kb.addKey('ENTER');
    this._spaceKey = kb.addKey('SPACE');

    this._upKey.on('down',    () => { this._navigate(-1); });
    this._downKey.on('down',  () => { this._navigate(1); });
    this._enterKey.on('down', () => { this._confirm(); });
    this._spaceKey.on('down', () => { this._confirm(); });
  }

  private _removeKeys(): void {
    [this._upKey, this._downKey, this._enterKey, this._spaceKey]
      .forEach(k => { k?.destroy(); });
  }

  private _navigate(dir: number): void {
    this.menuIndex = (this.menuIndex + dir + this.menuItems.length) % this.menuItems.length;
    this.manager.hud.showMenu(this.menuItems, this.menuIndex);
    this.manager.audioManager.playSfx('sfx-menu');
  }

  private _confirm(): void {
    const item = this.menuItems[this.menuIndex];
    if (item) this._executeAction(item.action);
  }

  private _executeAction(action: string): void {
    const { player, enemy, audioManager, dialogueManager } = this.manager;

    switch (action) {
      case PLAYER_ACTIONS.ATTACK: {
        const dmg  = player.attack + Math.floor(Math.random() * 8);
        const dead = enemy.takeDamage(dmg);
        audioManager.playSfx('sfx-attack');
        dialogueManager.show('Kai', [`You strike ${enemy.name} for ${dmg} damage!`]);
        this.manager.goTo(dead ? BATTLE_STATES.VICTORY : BATTLE_STATES.ENEMY_TURN);
        break;
      }
      case PLAYER_ACTIONS.HEAL: {
        const amt = 25;
        player.heal(amt);
        audioManager.playSfx('sfx-heal');
        dialogueManager.show('Kai', [`You recover ${amt} HP.`]);
        this.manager.goTo(BATTLE_STATES.ENEMY_TURN);
        break;
      }
      case PLAYER_ACTIONS.SPECIAL: {
        const dmg  = player.attack * 2 + Math.floor(Math.random() * 12);
        const dead = enemy.takeDamage(dmg);
        audioManager.playSfx('sfx-attack');
        dialogueManager.show('Kai', [
          'TEMPORAL SLASH!',
          `You deal ${dmg} damage through time itself!`,
        ]);
        this.manager.goTo(dead ? BATTLE_STATES.VICTORY : BATTLE_STATES.ENEMY_TURN);
        break;
      }
      case PLAYER_ACTIONS.FLEE:
        dialogueManager.show('Kai', ['You flee into the timeline...']);
        this.manager.endBattle(false);
        break;
      default:
        break;
    }
  }
}
