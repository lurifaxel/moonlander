import Phaser from 'phaser';
import { Lander } from '../game/objects/lander.js';
import { Terrain } from '../game/state/terrain.js';
import { HazardField } from '../game/state/hazards.js';
import { gameEvents, GameEvent } from '../game/events.js';
import { markLevelCompleted, setActiveLevel } from '../game/state/levels.js';
import { audioManager } from '../game/state/audio.js';

const MATTER = Phaser.Physics.Matter.Matter;

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super('play');
    this.pendingInput = { left: false, right: false, thrust: false, bomb: false };
  }

  init(data) {
    this.level = JSON.parse(JSON.stringify(data.level));
    this.levelId = data.level.id;
    setActiveLevel(this.levelId);
  }

  create() {
    this.pendingInput = { left: false, right: false, thrust: false, bomb: false };
    this.elapsed = 0;
    this.completed = false;
    this.createBackground();
    this.createWorld();
    this.createLander();
    this.bindInput();
    this.missionStart = this.time.now;
    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.shutdown, this);
  }

  createBackground() {
    this.add.image(0, 0, 'space-far').setOrigin(0).setDepth(-2);
    this.add.image(0, 0, 'space-near').setOrigin(0).setDepth(-1);
  }

  createWorld() {
    const gravity = typeof this.level.gravity === 'number' ? this.level.gravity : 0.25;
    this.matter.world.setGravity(0, gravity);
    this.terrain = new Terrain(this, this.level.terrain);
    this.hazards = new HazardField(this, this.level.hazards);
    const pad = this.level.pad;
    this.padGraphics = this.add.rectangle(pad.x, pad.y, pad.width, 12, 0x10b981, 0.9);
    this.padGraphics.setOrigin(0.5, 0.5).setDepth(3);
    this.padBody = MATTER.Bodies.rectangle(pad.x, pad.y, pad.width, 12, {
      isStatic: true,
      label: 'landing-pad'
    });
    this.matter.world.add(this.padBody);
  }

  createLander() {
    this.lander = new Lander(this, this.level.spawn, { fuel: this.level.fuel });
    this.cameras.main.setBounds(0, 0, 960, 720);
    this.cameras.main.startFollow(this.lander.sprite, true, 0.08, 0.08);
    this.registerCollisions();
  }

  registerCollisions() {
    this.collisionHandler = (event) => {
      event.pairs.forEach((pair) => this.handleCollision(pair));
    };
    this.matter.world.on('collisionstart', this.collisionHandler);
  }

  handleCollision(pair) {
    if (this.completed) return;
    const { bodyA, bodyB } = pair;
    const landerBody = bodyA.label === 'lander' ? bodyA : bodyB.label === 'lander' ? bodyB : null;
    const otherBody = landerBody === bodyA ? bodyB : bodyA;
    if (!landerBody) return;
    if (otherBody.label === 'landing-pad') {
      this.evaluateLanding();
    } else if (otherBody.label === 'hazard' || otherBody.label === 'terrain') {
      this.failMission('The lander was destroyed on impact.');
    }
  }

  bindInput() {
    this.touchOff = gameEvents.on(GameEvent.INPUT_CHANGED, (input) => {
      this.pendingInput = { ...this.pendingInput, ...input };
    });
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W
    });
    this.input.keyboard.on('keydown-B', () => this.triggerBomb());
    this.input.keyboard.on('keydown-SPACE', () => this.triggerThrust());
  }

  triggerBomb() {
    if (this.completed) return;
    this.pendingInput.bomb = true;
    this.handleBomb();
    this.pendingInput.bomb = false;
  }

  triggerThrust() {
    this.pendingInput.thrust = true;
  }

  handleBomb() {
    const hazard = this.level.hazards.find((h) => Phaser.Math.Distance.Between(h.x, h.y, this.lander.body.position.x, this.lander.body.position.y) < h.radius + 40);
    if (hazard) {
      this.hazards.destroy();
      this.level.hazards = this.level.hazards.filter((h) => h !== hazard);
      this.hazards = new HazardField(this, this.level.hazards);
    }
  }

  update(time, delta) {
    if (!this.lander) return;
    this.elapsed += delta;
    const keyboardInput = {
      left: this.keys.left.isDown || this.keys.a.isDown,
      right: this.keys.right.isDown || this.keys.d.isDown,
      thrust: this.keys.up.isDown || this.keys.w.isDown || this.pendingInput.thrust,
      bomb: this.pendingInput.bomb
    };
    this.pendingInput.thrust = false;
    this.lander.setInput(keyboardInput);
    this.lander.update(delta);
    this.updateHud();
    this.checkBounds();
  }

  updateHud() {
    const altitude = Math.max(0, this.lander.body.position.y - this.terrain.heightAt(this.lander.body.position.x));
    gameEvents.emit(GameEvent.HUD_UPDATE, {
      altitude,
      verticalSpeed: this.lander.body.velocity.y * 60,
      horizontalSpeed: this.lander.body.velocity.x * 60,
      fuelRatio: this.lander.getFuelRatio()
    });
  }

  checkBounds() {
    if (this.lander.body.position.y > 760 && !this.completed) {
      this.failMission('The lander drifted out of range.');
    }
  }

  evaluateLanding() {
    if (this.completed) return;
    const body = this.lander.body;
    const angleDeg = Math.abs(Phaser.Math.RadToDeg(body.angle));
    const verticalSpeed = Math.abs(body.velocity.y * 60);
    const horizontalSpeed = Math.abs(body.velocity.x * 60);
    const withinPad = Math.abs(body.position.x - this.level.pad.x) <= this.level.pad.width / 2;
    if (angleDeg < 25 && verticalSpeed < 28 && horizontalSpeed < 18 && withinPad) {
      this.completeMission();
    } else {
      this.failMission('Landing parameters exceeded safety limits.');
    }
  }

  completeMission() {
    if (this.completed) return;
    this.completed = true;
    audioManager.playSuccess();
    markLevelCompleted(this.levelId);
    this.time.delayedCall(100, () => {
      this.scene.stop();
      gameEvents.emit(GameEvent.LANDING_SUCCESS, {
        levelId: this.levelId,
        stats: {
          duration: (this.elapsed / 1000),
          fuelRemaining: this.lander.fuel
        }
      });
    });
  }

  failMission(reason) {
    if (this.completed) return;
    this.completed = true;
    audioManager.playFailure();
    this.time.delayedCall(100, () => {
      this.scene.stop();
      gameEvents.emit(GameEvent.LANDING_FAILURE, { levelId: this.levelId, reason });
    });
  }

  shutdown() {
    this.touchOff?.();
    if (this.collisionHandler) {
      this.matter.world.off('collisionstart', this.collisionHandler);
      this.collisionHandler = null;
    }
  }
}
