import Phaser from 'phaser';
import { gameConfig } from './config.js';

const game = new Phaser.Game(gameConfig);

if (import.meta.env.DEV) {
  window.__GAME__ = game;
}
