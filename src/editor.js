import { paintTerrainCircle, alignPadToSurface, clamp } from './terrain.js';
import { ensureHoleSpacing } from './hazards/blackHoles.js';

const TOOL_ORDER = ['spawn', 'landing', 'terrain', 'blackHole', 'meteor'];

export class EditorController {
  constructor({ canvas, toolbar, panel, state, terrain, pad, onRequestTest }) {
    this.canvas = canvas;
    this.toolbar = toolbar;
    this.panel = panel;
    this.state = state;
    this.terrain = terrain;
    this.pad = pad;
    this.onRequestTest = onRequestTest;
    this.tool = 'terrain';
    this.pointerDown = false;
    this.draggingMeteor = null;
    this._boundPointerDown = this.handlePointerDown.bind(this);
    this._boundPointerMove = this.handlePointerMove.bind(this);
    this._boundPointerUp = this.handlePointerUp.bind(this);
    this._boundKeyDown = this.handleKeyDown.bind(this);
    this._boundClick = this.handleToolbarClick.bind(this);
    this.pendingMeteor = null;
  }

  attach() {
    if (this.toolbar) {
      this.toolbar.addEventListener('click', this._boundClick);
    }
  }

  enter() {
    if (!this.canvas) return;
    this.state.active = true;
    this.tool = TOOL_ORDER[this.state.placementIndex] || 'terrain';
    this.canvas.addEventListener('pointerdown', this._boundPointerDown);
    window.addEventListener('pointermove', this._boundPointerMove);
    window.addEventListener('pointerup', this._boundPointerUp);
    window.addEventListener('keydown', this._boundKeyDown);
    this.updatePanelContent();
    this.updateToolbarButtons();
  }

  exit() {
    if (!this.canvas) return;
    this.state.active = false;
    this.pointerDown = false;
    this.pendingMeteor = null;
    this.canvas.removeEventListener('pointerdown', this._boundPointerDown);
    window.removeEventListener('pointermove', this._boundPointerMove);
    window.removeEventListener('pointerup', this._boundPointerUp);
    window.removeEventListener('keydown', this._boundKeyDown);
  }

  handleToolbarClick(event) {
    const button = event.target.closest('button[data-tool]');
    if (!button) return;
    const tool = button.getAttribute('data-tool');
    if (!tool) return;
    this.selectTool(tool);
  }

  selectTool(tool) {
    this.tool = tool;
    this.state.placementIndex = TOOL_ORDER.indexOf(tool);
    if (this.state.placementIndex < 0) this.state.placementIndex = 0;
    this.updateToolbarButtons();
    this.updatePanelContent();
  }

  updateToolbarButtons() {
    if (!this.toolbar) return;
    const buttons = this.toolbar.querySelectorAll('button[data-tool]');
    buttons.forEach(btn => {
      const tool = btn.getAttribute('data-tool');
      const active = tool === this.tool;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('active', active);
    });
    this.toolbar.classList.remove('hidden');
    this.toolbar.setAttribute('aria-hidden', 'false');
  }

  updatePanelContent() {
    if (!this.panel) return;
    const instructions = {
      spawn: '<strong>Spawn</strong>: Click to place the lander start point.',
      landing: '<strong>Landing zone</strong>: Click to reposition the pad on the surface.',
      terrain:
        '<strong>Terrain</strong>: Click and drag to add soil. Hold Alt to carve. Adjust brush with [ and ].',
      blackHole:
        '<strong>Black hole</strong>: Click to place a singularity. Alt + click removes the nearest hole.',
      meteor:
        '<strong>Meteor</strong>: Click to set a spawn, release to pick the strike location. Alt + click removes the nearest meteor.',
    };
    const meta = `Active tool: <em>${this.tool}</em>. Press R to test the level.`;
    this.panel.setContent(`${instructions[this.tool]}<br/><small>${meta}</small>`);
  }

  canvasToWorld(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.canvas.width + (this.state.camX || 0);
    const y = ((event.clientY - rect.top) / rect.height) * this.canvas.height + (this.state.camY || 0);
    return { x, y };
  }

  handlePointerDown(event) {
    if (event.button !== 0) return;
    this.pointerDown = true;
    const pos = this.canvasToWorld(event);
    this.applyToolDown(pos, event.altKey);
  }

  handlePointerMove(event) {
    if (!this.pointerDown) return;
    const pos = this.canvasToWorld(event);
    this.applyToolDrag(pos, event.altKey);
  }

  handlePointerUp(event) {
    if (!this.pointerDown) return;
    this.pointerDown = false;
    const pos = this.canvasToWorld(event);
    this.applyToolUp(pos, event.altKey);
    this.draggingMeteor = null;
  }

  handleKeyDown(event) {
    if (event.key === 'r' || event.key === 'R') {
      if (this.onRequestTest) {
        event.preventDefault();
        this.onRequestTest();
      }
    }
    if (event.key === '[') {
      this.state.brushRadius = clamp(this.state.brushRadius - 4, 6, 96);
      if (this.tool === 'terrain') this.updatePanelContent();
    } else if (event.key === ']') {
      this.state.brushRadius = clamp(this.state.brushRadius + 4, 6, 96);
      if (this.tool === 'terrain') this.updatePanelContent();
    }
    const digitIndex = TOOL_ORDER.findIndex((_, idx) => `${idx + 1}` === event.key);
    if (digitIndex >= 0) {
      event.preventDefault();
      this.selectTool(TOOL_ORDER[digitIndex]);
    }
  }

  applyToolDown(pos, alt) {
    switch (this.tool) {
      case 'spawn':
        this.state.spawn = { x: pos.x, y: pos.y };
        break;
      case 'landing':
        this.pad.x = clamp(pos.x - this.pad.w / 2, 0, this.terrain.width - this.pad.w);
        this.pad.y = Math.max(0, pos.y - this.pad.h);
        alignPadToSurface(this.terrain, this.pad, pos.x, pos.y);
        break;
      case 'terrain':
        paintTerrainCircle(this.terrain, this.pad, pos.x, pos.y, this.state.brushRadius, alt ? 'remove' : 'add');
        break;
      case 'blackHole':
        if (alt) {
          this.removeNearestBlackHole(pos);
        } else {
          this.addBlackHole(pos);
        }
        break;
      case 'meteor':
        if (alt) {
          this.removeNearestMeteor(pos);
        } else {
          this.pendingMeteor = { spawn: pos, target: pos };
        }
        break;
      default:
        break;
    }
  }

  applyToolDrag(pos, alt) {
    if (this.tool === 'terrain') {
      paintTerrainCircle(this.terrain, this.pad, pos.x, pos.y, this.state.brushRadius, alt ? 'remove' : 'add');
    }
    if (this.tool === 'meteor' && this.pendingMeteor) {
      this.pendingMeteor.target = pos;
    }
  }

  applyToolUp(pos, alt) {
    if (this.tool === 'meteor' && this.pendingMeteor) {
      const meteor = {
        id: `editor-meteor-${Date.now()}`,
        startMs: this.state.meteorDefaults.startMs,
        warningLeadMs: this.state.meteorDefaults.warningLeadMs,
        speed: this.state.meteorDefaults.speed,
        radius: this.state.meteorDefaults.radius,
        spawn: { ...this.pendingMeteor.spawn },
        target: { x: pos.x, y: pos.y },
      };
      this.state.meteors.push(meteor);
      this.pendingMeteor = null;
    }
  }

  addBlackHole(pos) {
    const hole = {
      x: clamp(pos.x, 0, this.terrain.width),
      y: clamp(pos.y, 0, this.terrain.height),
      eventRadius: undefined,
      pullRadius: undefined,
    };
    this.state.blackHoles.push(hole);
    this.state.blackHoles = ensureHoleSpacing(this.state.blackHoles);
  }

  removeNearestBlackHole(pos) {
    if (!this.state.blackHoles.length) return;
    let bestIdx = -1;
    let bestDist = Infinity;
    this.state.blackHoles.forEach((hole, index) => {
      const dx = hole.x - pos.x;
      const dy = hole.y - pos.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = index;
      }
    });
    if (bestIdx >= 0) {
      this.state.blackHoles.splice(bestIdx, 1);
    }
  }

  removeNearestMeteor(pos) {
    if (!this.state.meteors.length) return;
    let bestIdx = -1;
    let bestDist = Infinity;
    this.state.meteors.forEach((meteor, index) => {
      const dx = meteor.target.x - pos.x;
      const dy = meteor.target.y - pos.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = index;
      }
    });
    if (bestIdx >= 0) {
      this.state.meteors.splice(bestIdx, 1);
    }
  }

  renderOverlay(ctx, camX = 0) {
    if (!this.state.active) return;
    ctx.save();
    ctx.translate(-camX, 0);
    ctx.strokeStyle = '#4af7ff';
    ctx.fillStyle = '#4af7ff';
    ctx.lineWidth = 2;
    // spawn marker
    if (this.state.spawn) {
      ctx.beginPath();
      ctx.arc(this.state.spawn.x, this.state.spawn.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.state.spawn.x - 6, this.state.spawn.y + 10);
      ctx.lineTo(this.state.spawn.x + 6, this.state.spawn.y + 10);
      ctx.stroke();
    }

    // black holes
    this.state.blackHoles.forEach(hole => {
      ctx.save();
      ctx.strokeStyle = 'rgba(170,120,255,0.8)';
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // meteors
    this.state.meteors.forEach(meteor => {
      ctx.strokeStyle = 'rgba(255,200,140,0.8)';
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(meteor.spawn.x, meteor.spawn.y);
      ctx.lineTo(meteor.target.x, meteor.target.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(meteor.target.x, meteor.target.y, meteor.radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.restore();
  }
}
