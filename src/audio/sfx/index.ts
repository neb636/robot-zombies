export { playAttackPhysical } from './attack_physical.js';
export { playAttackEmp }      from './attack_emp.js';
export { playAttackFire }     from './attack_fire.js';
export { playHeal }           from './heal.js';
export { playStatusApply }    from './status_apply.js';
export { playStatusExpire }   from './status_expire.js';
export { playUiSelect }       from './ui_select.js';
export { playUiConfirm }      from './ui_confirm.js';
export { playUiCancel }       from './ui_cancel.js';
export { playDialogueAdvance } from './dialogue_advance.js';
export { playLevelUp }        from './level_up.js';
export { playVictory }        from './victory.js';
export { playDefeat }         from './defeat.js';

export type SfxKey =
  | 'attack_physical'
  | 'attack_emp'
  | 'attack_fire'
  | 'heal'
  | 'status_apply'
  | 'status_expire'
  | 'ui_select'
  | 'ui_confirm'
  | 'ui_cancel'
  | 'dialogue_advance'
  | 'level_up'
  | 'victory'
  | 'defeat';
