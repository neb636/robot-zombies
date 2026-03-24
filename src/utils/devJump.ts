import Phaser from 'phaser';

export interface DevJumpOpts {
  enemy?: string;
}

/**
 * Bootstraps minimal game state and jumps directly to any scene.
 * Dev-only utility — never call from production code paths.
 */
export function jumpToScene(game: Phaser.Game, target: string, opts?: DevJumpOpts): void {
  game.registry.set('playerName', 'Dev');
  game.registry.set('flags', {});

  // Stop all active scenes except DevScene
  game.scene.getScenes(true).forEach(s => {
    if (s.scene.key !== 'DevScene') {
      game.scene.stop(s.scene.key);
    }
  });

  if (target === 'BattleScene') {
    game.scene.start('BattleScene', {
      enemyKey: opts?.enemy ?? 'compliance_drone',
      returnScene: 'WorldMapScene',
    });
  } else {
    game.scene.start(target);
  }
}
