import Phaser from 'phaser';

const MATTER = Phaser.Physics.Matter.Matter;
const THRUST_FORCE = 0.00135;
const TORQUE_FORCE = 0.00038;
const FUEL_BURN_RATE = 16;

export class Lander {
  constructor(scene, spawn, { fuel = 120 } = {}) {
    this.scene = scene;
    this.fuelCapacity = fuel;
    this.fuel = fuel;
    this.sprite = scene.add.triangle(spawn.x, spawn.y, 0, 36, 32, 36, 16, 0, 0xffffff, 0.8);
    this.sprite.setStrokeStyle(2, 0x93c5fd, 0.9);
    this.sprite.setFillStyle(0x0f172a, 0.95);
    scene.matter.add.gameObject(this.sprite, {
      shape: { type: 'polygon', sides: 3, radius: 18 },
      frictionAir: 0.02,
      restitution: 0.12
    });
    this.sprite.setOrigin(0.5, 0.7);
    this.sprite.setDepth(5);
    this.body = this.sprite.body;
    this.body.label = 'lander';
    this.body.mass = 6;
    this.body.friction = 0.15;
    this.body.frictionStatic = 0.5;
    this.input = {
      thrust: false,
      left: false,
      right: false,
      bomb: false
    };
    this.alive = true;
  }

  reset(spawn, fuel = this.fuelCapacity) {
    MATTER.Body.setPosition(this.body, { x: spawn.x, y: spawn.y });
    MATTER.Body.setVelocity(this.body, { x: 0, y: 0 });
    MATTER.Body.setAngularVelocity(this.body, 0);
    MATTER.Body.setAngle(this.body, 0);
    this.fuelCapacity = fuel;
    this.fuel = fuel;
    this.alive = true;
  }

  setInput(nextInput) {
    this.input = { ...this.input, ...nextInput };
  }

  consumeFuel(amount) {
    this.fuel = Math.max(0, this.fuel - amount);
  }

  update(delta) {
    if (!this.alive) {
      return;
    }
    const dt = delta / 1000;
    const body = this.body;

    if (this.input.left) {
      MATTER.Body.setAngularVelocity(body, body.angularVelocity - TORQUE_FORCE * dt * 60);
    }
    if (this.input.right) {
      MATTER.Body.setAngularVelocity(body, body.angularVelocity + TORQUE_FORCE * dt * 60);
    }
    if (this.input.thrust && this.fuel > 0) {
      const angle = body.angle - Math.PI / 2;
      const force = {
        x: Math.cos(angle) * THRUST_FORCE,
        y: Math.sin(angle) * THRUST_FORCE
      };
      MATTER.Body.applyForce(body, body.position, force);
      this.consumeFuel(dt * FUEL_BURN_RATE);
      this.showThruster(force);
    } else {
      this.showThruster(null);
    }
  }

  showThruster(force) {
    if (!this.thruster) {
      this.thruster = this.scene.add.triangle(0, 0, 0, 0, 20, 0, 10, 28, 0xfacc15, 0.7);
      this.thruster.setDepth(4);
      this.thruster.setOrigin(0.5, 0);
    }
    const active = Boolean(force);
    this.thruster.setVisible(active);
    if (!active) {
      return;
    }
    const body = this.body;
    const angle = body.angle;
    const offsetX = Math.cos(angle + Math.PI / 2) * 26;
    const offsetY = Math.sin(angle + Math.PI / 2) * 26;
    this.thruster.setPosition(body.position.x + offsetX, body.position.y + offsetY);
    this.thruster.setRotation(angle);
    const flicker = Phaser.Math.FloatBetween(0.9, 1.2);
    this.thruster.setScale(1, flicker);
  }

  getFuelRatio() {
    return this.fuelCapacity > 0 ? this.fuel / this.fuelCapacity : 0;
  }

  destroy() {
    this.alive = false;
    if (this.sprite) {
      this.sprite.destroy();
    }
    if (this.thruster) {
      this.thruster.destroy();
    }
  }
}
