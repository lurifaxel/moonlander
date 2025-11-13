import Phaser from 'phaser';
import { gameEvents, GameEvent } from '../game/events.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    this.load.image('space-far', '/space_far.png');
    this.load.image('space-near', '/space_near.png');
  }

  create() {
    gameEvents.emit(GameEvent.GAME_READY, { hasActiveSession: false });
    this.scene.start('menu');
  }
}
