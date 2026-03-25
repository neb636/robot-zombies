import Phaser from 'phaser';
import { BattleState }                   from '../BattleState.js';
import { calcDamage }                    from '../CombatEngine.js';
import { execute as executeTech }        from '../TechExecutor.js';
import { checkCombo }                    from '../ComboSystem.js';
import { BATTLE_STATES, PLAYER_ACTIONS } from '../../utils/constants.js';
import type { ATBCombatant, BattleMenuAction, Tech } from '../../types.js';

export class PlayerTurnState extends BattleState {
  private menuIndex:  number = 0;
  private menuItems:  BattleMenuAction[] = [];

  private _inTechsSubmenu: boolean = false;
  private _techItems:      Tech[] = [];
  private _techIndex:      number = 0;

  private _upKey?:    Phaser.Input.Keyboard.Key;
  private _downKey?:  Phaser.Input.Keyboard.Key;
  private _enterKey?: Phaser.Input.Keyboard.Key;
  private _spaceKey?: Phaser.Input.Keyboard.Key;
  private _escKey?:   Phaser.Input.Keyboard.Key;

  enter(): void {
    this._inTechsSubmenu = false;
    this.menuItems = this._getMenuItems();
    this.menuIndex = 0;
    this.manager.hud.showMenu(this.menuItems, this.menuIndex, (i) => {
      this.menuIndex = i;
      this._confirm();
    });
    this.manager.pauseATB();
    this._setupKeys();
  }

  exit(): void {
    this._removeKeys();
    this.manager.hud.hideMenu();
    this.manager.resumeATB();
  }

  private _setupKeys(): void {
    const kb = this.manager.scene.input.keyboard!;
    this._upKey    = kb.addKey('UP');
    this._downKey  = kb.addKey('DOWN');
    this._enterKey = kb.addKey('ENTER');
    this._spaceKey = kb.addKey('SPACE');
    this._escKey   = kb.addKey('ESC');

    this._upKey.on('down',    () => { this._navigate(-1); });
    this._downKey.on('down',  () => { this._navigate(1); });
    this._enterKey.on('down', () => { this._confirm(); });
    this._spaceKey.on('down', () => { this._confirm(); });
    this._escKey.on('down',   () => { this._back(); });
  }

  private _removeKeys(): void {
    [this._upKey, this._downKey, this._enterKey, this._spaceKey, this._escKey]
      .forEach(k => { k?.destroy(); });
  }

  private _navigate(dir: number): void {
    if (this._inTechsSubmenu) {
      this._techIndex = (this._techIndex + dir + this._techItems.length) % this._techItems.length;
      this.manager.hud.showMenu(this._techMenuItems(), this._techIndex, this._techSelectCallback());
    } else {
      this.menuIndex = (this.menuIndex + dir + this.menuItems.length) % this.menuItems.length;
      this.manager.hud.showMenu(this.menuItems, this.menuIndex, this._mainSelectCallback());
    }
    this.manager.audioManager.playSfx('sfx-menu');
  }

  private _back(): void {
    if (this._inTechsSubmenu) {
      this._inTechsSubmenu = false;
      this.manager.hud.showMenu(this.menuItems, this.menuIndex, this._mainSelectCallback());
    }
  }

  private _mainSelectCallback(): (i: number) => void {
    return (i) => { this.menuIndex = i; this._confirm(); };
  }

  private _techSelectCallback(): (i: number) => void {
    return (i) => {
      if (i >= this._techItems.length) { this._back(); return; }
      this._techIndex = i;
      this._confirm();
    };
  }

  private _confirm(): void {
    if (this._inTechsSubmenu) {
      const tech = this._techItems[this._techIndex];
      if (tech) this._executeTech(tech);
    } else {
      const item = this.menuItems[this.menuIndex];
      if (item) this._executeAction(item.action);
    }
  }

  private _getMenuItems(): BattleMenuAction[] {
    const actor    = (this.manager.activeMenuCombatant ?? this.manager.player) as ATBCombatant;
    const hasTechs = actor.techs.length > 0;
    const items: BattleMenuAction[] = [
      { label: 'ATTACK', action: PLAYER_ACTIONS.ATTACK },
    ];
    if (hasTechs) {
      items.push({ label: 'TECHS', action: PLAYER_ACTIONS.TECHS });
    }
    items.push({ label: 'HEAL', action: PLAYER_ACTIONS.HEAL });
    if (!this.manager.scripted) {
      items.push({ label: 'FLEE', action: PLAYER_ACTIONS.FLEE });
    }
    return items;
  }

  private _techMenuItems(): BattleMenuAction[] {
    const back: BattleMenuAction[] = [{ label: '← BACK', action: 'BACK' }];
    return [
      ...this._techItems.map(t => ({ label: t.label, action: t.id })),
      ...back,
    ];
  }

  /** After dealing damage, determine next state. */
  private _afterDamage(dead: boolean): void {
    if (dead) {
      this.manager.goTo(BATTLE_STATES.VICTORY);
      return;
    }
    const bossState = this.manager.checkBossThresholds();
    if (bossState) {
      this.manager.goTo(bossState);
      return;
    }
    this._returnToATB();
  }

  private _returnToATB(): void {
    const actor = (this.manager.activeMenuCombatant ?? this.manager.player) as ATBCombatant;
    actor.atb = 0;
    this.manager.activeMenuCombatant = null;
    this.manager.goTo(BATTLE_STATES.ATB_TICKING);
  }

  private _executeAction(action: string): void {
    const actor  = (this.manager.activeMenuCombatant ?? this.manager.player) as ATBCombatant;
    const { enemy, audioManager, dialogueManager } = this.manager;

    switch (action) {
      case PLAYER_ACTIONS.ATTACK: {
        const dmg  = calcDamage(actor.str, enemy.def, 'Physical', enemy.tags);
        const dead = enemy.takeDamage(dmg);
        audioManager.playSfx('sfx-attack');
        dialogueManager.show(actor.name, [`You strike ${enemy.name} for ${dmg} damage!`]);

        this._recordAndCheckCombo(actor);

        this._afterDamage(dead);
        break;
      }
      case PLAYER_ACTIONS.HEAL: {
        actor.heal(25);
        audioManager.playSfx('sfx-heal');
        dialogueManager.show(actor.name, ['You recover 25 HP.']);
        this._returnToATB();
        break;
      }
      case PLAYER_ACTIONS.TECHS: {
        // Open techs submenu
        this._techItems  = [...actor.techs];
        this._techIndex  = 0;
        this._inTechsSubmenu = true;
        this.manager.hud.showMenu(this._techMenuItems(), this._techIndex, this._techSelectCallback());
        break;
      }
      case PLAYER_ACTIONS.FLEE:
        dialogueManager.show(actor.name, ['You flee into the chaos...']);
        this.manager.endBattle(false);
        break;
      default:
        break;
    }
  }

  private _recordAndCheckCombo(actor: ATBCombatant): void {
    const now  = performance.now();
    // Player always registers as 'player' so combo table entries match regardless of chosen name
    const name = actor === (this.manager.player as ATBCombatant) ? 'player' : actor.name.toLowerCase();
    const prev = this.manager.lastPartyAction;

    const combo = checkCombo(name, now, prev?.name ?? null, prev?.ts ?? null);
    if (combo) {
      this.manager.hud.flashComboName(combo.label);
      this.manager.discoveredCombos.add(combo.id);
    }

    this.manager.lastPartyAction = { name, ts: now };
  }

  private _executeTech(tech: Tech): void {
    const actor = (this.manager.activeMenuCombatant ?? this.manager.player) as ATBCombatant;
    executeTech(tech, actor, { enemy: this.manager.enemy }, this.manager);

    this._recordAndCheckCombo(actor);

    const dead = !this.manager.enemy.isAlive();
    this._afterDamage(dead);
  }
}
