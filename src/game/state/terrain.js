import Phaser from 'phaser';

const MATTER = Phaser.Physics.Matter.Matter;

export class Terrain {
  constructor(scene, points) {
    this.scene = scene;
    this.points = points;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1);
    this.graphics.fillStyle(0x1f2937, 1);
    this.graphics.lineStyle(4, 0x38bdf8, 0.6);
    this.drawTerrain();
    this.bodies = [];
    this.createBodies();
  }

  drawTerrain() {
    const g = this.graphics;
    g.clear();
    g.fillStyle(0x0f172a, 1);
    g.beginPath();
    g.moveTo(0, 720);
    this.points.forEach((p) => g.lineTo(p.x, p.y));
    g.lineTo(960, 720);
    g.closePath();
    g.fillPath();
    g.lineStyle(3, 0x38bdf8, 0.5);
    g.beginPath();
    this.points.forEach((p, index) => {
      if (index === 0) {
        g.moveTo(p.x, p.y);
      } else {
        g.lineTo(p.x, p.y);
      }
    });
    g.strokePath();
  }

  createBodies() {
    const bodies = [];
    for (let i = 0; i < this.points.length - 1; i += 1) {
      const a = this.points[i];
      const b = this.points[i + 1];
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const body = MATTER.Bodies.rectangle(midX, midY, length, 24, {
        isStatic: true,
        angle,
        label: 'terrain'
      });
      bodies.push(body);
    }
    this.bodies = bodies;
    bodies.forEach((body) => this.scene.matter.world.add(body));
  }

  heightAt(x) {
    const pts = this.points;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const a = pts[i];
      const b = pts[i + 1];
      if ((x >= a.x && x <= b.x) || (x >= b.x && x <= a.x)) {
        const t = (x - a.x) / (b.x - a.x);
        return Phaser.Math.Linear(a.y, b.y, t);
      }
    }
    return pts[pts.length - 1]?.y ?? 720;
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
