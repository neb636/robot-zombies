import type Phaser from 'phaser';

/** A generator function that draws a procedural texture into `scene`. */
export type SpriteGenerator = (scene: Phaser.Scene) => void;
