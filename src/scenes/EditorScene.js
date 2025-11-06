import Phaser from 'phaser';
import { Terrain } from '../game/state/terrain.js';
import { HazardField } from '../game/state/hazards.js';
import { gameEvents, GameEvent } from '../game/events.js';
import { saveCustomLevel, setActiveLevel } from '../game/state/levels.js';

export default class EditorScene extends Phaser.Scene {
  constructor() {
    super('editor');
    this.tool = 'terrain';
  }

  init(data) {
    this.originalLevel = data.level;
    this.level = JSON.parse(JSON.stringify(data.level));
  }

  create() {
    this.add.image(0, 0, 'space-far').setOrigin(0).setDepth(-2);
    this.add.image(0, 0, 'space-near').setOrigin(0).setDepth(-1);
    this.drawWorld();
    this.bindEvents();
    this.cameras.main.setBounds(0, 0, 960, 720);
    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.shutdown, this);
  }

  drawWorld() {
    this.terrain?.destroy();
    this.hazards?.destroy();
    this.terrain = new Terrain(this, this.level.terrain);
    this.hazards = new HazardField(this, this.level.hazards);
    this.spawnMarker?.destroy();
    this.padMarker?.destroy();
    this.spawnMarker = this.add.circle(this.level.spawn.x, this.level.spawn.y, 10, 0x38bdf8, 0.9).setDepth(4);
    this.padMarker = this.add.rectangle(this.level.pad.x, this.level.pad.y, this.level.pad.width, 12, 0xfacc15, 0.9).setDepth(4);
  }

  bindEvents() {
    this.cleanups = [
      gameEvents.on(GameEvent.EDITOR_TOOL_SELECTED, (tool) => {
        this.tool = tool;
      }),
      gameEvents.on(GameEvent.EDITOR_SAVE, () => this.saveLevel()),
      gameEvents.on(GameEvent.EDITOR_TEST, () => this.testLevel())
    ];
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
  }

  onPointerDown(pointer) {
    const { x, y } = this.getWorldPoint(pointer);
    this.draggingIndex = null;
    if (this.tool === 'terrain') {
      this.draggingIndex = this.findNearestVertex(x, y);
      if (this.draggingIndex == null) {
        return;
      }
    } else if (this.tool === 'spawn') {
      this.setSpawn(x, y);
    } else if (this.tool === 'pad') {
      this.setPad(x, y);
    } else if (this.tool === 'hazard') {
      this.toggleHazard(x, y);
    }
  }

  onPointerMove(pointer) {
    const { x, y } = this.getWorldPoint(pointer);
    if (this.tool === 'terrain' && this.draggingIndex != null && pointer.isDown) {
      this.level.terrain[this.draggingIndex].y = Phaser.Math.Clamp(y, 120, 680);
      this.drawWorld();
    }
  }

  onPointerUp() {
    this.draggingIndex = null;
  }

  findNearestVertex(x, y) {
    let index = null;
    let best = 48;
    this.level.terrain.forEach((point, i) => {
      const distance = Phaser.Math.Distance.Between(x, y, point.x, point.y);
      if (distance < best) {
        best = distance;
        index = i;
      }
    });
    return index;
  }

  setSpawn(x, y) {
    this.level.spawn = { x: Phaser.Math.Clamp(x, 40, 920), y: Phaser.Math.Clamp(y, 60, 400) };
    this.drawWorld();
  }

  setPad(x, y) {
    this.level.pad = {
      ...this.level.pad,
      x: Phaser.Math.Clamp(x, 80, 880),
      y: Phaser.Math.Clamp(y, 260, 620)
    };
    this.drawWorld();
  }

  toggleHazard(x, y) {
    const existingIndex = this.level.hazards.findIndex((hazard) => Phaser.Math.Distance.Between(x, y, hazard.x, hazard.y) < hazard.radius);
    if (existingIndex >= 0) {
      this.level.hazards.splice(existingIndex, 1);
    } else {
      this.level.hazards.push({ x, y, radius: 42, type: 'crater' });
    }
    this.drawWorld();
  }

  getWorldPoint(pointer) {
    if (typeof pointer.worldX === 'number' && typeof pointer.worldY === 'number') {
      return { x: pointer.worldX, y: pointer.worldY };
    }
    const camera = this.cameras.main;
    if (camera) {
      const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
      return { x: worldPoint.x, y: worldPoint.y };
    }
    return { x: pointer.x, y: pointer.y };
  }

  saveLevel() {
    saveCustomLevel({ ...this.level, name: 'Custom Mission' });
    setActiveLevel('custom');
  }

  testLevel() {
    this.saveLevel();
    this.scene.stop();
    gameEvents.emit(GameEvent.REQUEST_START);
  }

  shutdown() {
    this.cleanups?.forEach((fn) => fn && fn());
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointermove', this.onPointerMove, this);
    this.input.off('pointerup', this.onPointerUp, this);
  }
}
