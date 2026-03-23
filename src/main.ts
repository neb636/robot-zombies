/// <reference types="vite/client" />
import Phaser from 'phaser';
import { gameConfig } from './config.js';

declare global {
  interface Window {
    __GAME__?: Phaser.Game;
  }
}

const game = new Phaser.Game(gameConfig);

if (import.meta.env.DEV) {
  window.__GAME__ = game;
}
