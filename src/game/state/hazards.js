import Phaser from 'phaser';

const MATTER = Phaser.Physics.Matter.Matter;

export class HazardField {
  constructor(scene, hazards = []) {
    this.scene = scene;
    this.hazards = hazards;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(2);
    this.bodies = [];
    this.createHazards();
  }

  createHazards() {
    this.graphics.clear();
    this.graphics.lineStyle(2, 0xf87171, 0.7);
    this.graphics.fillStyle(0x991b1b, 0.4);
    this.hazards.forEach((hazard) => {
      this.graphics.fillCircle(hazard.x, hazard.y, hazard.radius);
      this.graphics.strokeCircle(hazard.x, hazard.y, hazard.radius);
      const body = MATTER.Bodies.circle(hazard.x, hazard.y, hazard.radius, {
        isStatic: true,
        isSensor: true,
        label: 'hazard'
      });
      this.bodies.push(body);
      this.scene.matter.world.add(body);
    });
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
    if (this.bodies) {
      this.bodies.forEach((body) => this.scene.matter.world.remove(body));
    }
  }
}
