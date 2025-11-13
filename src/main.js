import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import PlayScene from './scenes/PlayScene.js';
import EditorScene from './scenes/EditorScene.js';
import { initUI } from './ui/index.js';
import { audioManager } from './game/state/audio.js';

initUI();

const gameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 720,
  backgroundColor: '#020617',
  parent: 'phaserRoot',
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 0.35 },
      enableSleeping: false
    }
  },
  scene: [BootScene, MenuScene, PlayScene, EditorScene]
};

const game = new Phaser.Game(gameConfig);

window.moonlanderGame = game;

document.addEventListener('pointerdown', () => audioManager.resume());
document.addEventListener('keydown', () => audioManager.resume(), { once: false });
