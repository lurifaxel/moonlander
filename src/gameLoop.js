import { APP_MODE, VIEW_BOUNDS, PHYSICS_CONSTANTS, PAD, BOMB_CONSTANTS } from './constants.js';
import { LEVELS } from './game/levels.js';
import { createGameState, resetLander } from './state.js';
import {
  generateTerrain,
  resolvePenetrationAt,
  clamp,
  alignPadToSurface,
  groundYAt,
  findSurfaceAlongRay,
  clamp01,
  deformTerrainAt,
} from './terrain.js';
import { getLanderContactPoints, applyThrust, integrateLander, rotateLander } from './lander.js';
import {
  spawnDust,
  spawnExplosion,
  spawnConfetti,
  updateParticles,
  drawParticles,
  clearParticles,
} from './effects/particles.js';
import {
  computeBlackHoleAcceleration,
  findBlackHoleCapture,
  holeEventRadius,
} from './hazards/blackHoles.js';
import {
  resetMeteorState,
  updateMeteors,
  drawMeteors,
  drawMeteorWarnings,
} from './hazards/meteors.js';
import { canDropBomb, dropBomb, updateBombs, drawBombs } from './weapons/bombs.js';
import { EditorController } from './editor.js';

const LANDING_MAX_SPEED = 0.08;
const LANDING_MAX_ANGLE = Math.PI / 8;

export function computeSpawnX(padX, terrainWidth) {
  const worldWidth = Math.max(typeof terrainWidth === 'number' ? terrainWidth : 0, 40);
  return clamp(padX - 120, 40, Math.max(worldWidth - 40, 40));
}

export function clampLanderToWorld(lander, canvas, terrain, onAbyss = () => {}) {
  const worldWidth = Math.max(canvas?.width ?? 0, terrain?.width ?? 0);
  const worldHeight = Math.max(canvas?.height ?? 0, terrain?.height ?? 0);

  if (lander.x < 0) lander.x = 0;
  if (lander.x > worldWidth) lander.x = worldWidth;
  if (lander.y < 0) lander.y = 0;
  if (lander.y > worldHeight + 80 && typeof onAbyss === 'function') {
    onAbyss('You drifted into the abyss.');
  }

  return { width: worldWidth, height: worldHeight };
}

export function computeCameraX(landerX, viewWidth, worldWidth) {
  if (!Number.isFinite(viewWidth) || viewWidth <= 0) return 0;
  if (!Number.isFinite(worldWidth) || worldWidth <= viewWidth) {
    return 0;
  }
  const target = landerX - viewWidth * 0.5;
  return clamp(target, 0, worldWidth - viewWidth);
}

function refreshTerrainProfile(terrain) {
  const heights = new Array(terrain.cols);
  const cellSize = terrain.cellSize;
  for (let col = 0; col < terrain.cols; col++) {
    let row = 0;
    for (; row < terrain.rows; row++) {
      if (terrain.solids[row * terrain.cols + col] === 1) {
        heights[col] = row * cellSize;
        break;
      }
    }
    if (row === terrain.rows) {
      heights[col] = terrain.height;
    }
  }
  terrain.dirtyRender = false;
  return heights;
}

export function createGameLoop({
  canvas,
  infoPanel,
  startMenu,
  postMenu,
  input,
  audio,
  touchControls,
  editorPanel,
  toolbar,
}) {
  const ctx = canvas.getContext('2d');
  const state = createGameState();
  let mode = APP_MODE.MENU;
  let animationHandle = null;
  let lastTime = null;
  let terrainProfile = [];
  let backgroundPhase = 0;

  const editorController = new EditorController({
    canvas,
    toolbar,
    panel: editorPanel,
    state: state.editor,
    terrain: state.terrain,
    pad: state.pad,
    onRequestTest: () => beginEditorTest(),
  });
  editorController.attach();

  function resizeCanvas() {
    const availWidth = Math.max(0, window.innerWidth);
    const availHeight = Math.max(0, window.innerHeight);
    const targetWidth = clamp(availWidth, VIEW_BOUNDS.MIN_WIDTH, VIEW_BOUNDS.MAX_WIDTH);
    const targetHeight = clamp(availHeight, VIEW_BOUNDS.MIN_HEIGHT, VIEW_BOUNDS.MAX_HEIGHT);
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;
    state.runtime.camX = clamp(state.runtime.camX || 0, 0, Math.max(0, state.terrain.width - targetWidth));
  }

  function setupLevel(index, fromEditor = false) {
    const level = LEVELS[index % LEVELS.length];
    const { heights } = generateTerrain({
      terrain: state.terrain,
      pad: state.pad,
      level,
      canvasHeight: canvas.height,
      editorState: state.editor,
    });
    terrainProfile = heights;
    const spawnX = computeSpawnX(state.pad.x, state.terrain.width);
    const spawnY = Math.min(...heights) - 120;
    resetLander(state.lander, spawnX, Math.max(40, spawnY));
    state.lander.vx = 0.04;
    state.runtime.gameOver = false;
    state.runtime.landed = false;
    state.runtime.message = '';
    state.runtime.exploded = false;
    state.runtime.activeBlackHoles = fromEditor
      ? state.editor.blackHoles.slice()
      : state.terrain.blackHoles.slice();
    resetMeteorState(state.runtime, state.terrain);
    clearParticles(state.runtime);
    infoPanel.setTitle(level.name);
    infoPanel.setMessage(
      fromEditor
        ? 'Testing custom terrain. Press Esc to return to the editor.'
        : 'Touchdown gently on the illuminated pad. Arrow keys rotate/thrust.'
    );
  }

  function beginEditorTest() {
    editorController.exit();
    editorPanel.hide();
    if (toolbar) {
      toolbar.classList.add('hidden');
      toolbar.setAttribute('aria-hidden', 'true');
    }
    mode = APP_MODE.TEST;
    startMenu.hide();
    postMenu.hide();
    touchControls.setVisible(true);
    const baseline = {
      solids: state.terrain.solids.slice(),
      pad: { ...state.pad },
      blackHoles: state.editor.blackHoles.slice(),
      meteors: state.editor.meteors.slice(),
    };
    state.editor.testBaseline = baseline;
    state.terrain.blackHoles = state.editor.blackHoles.slice();
    state.terrain.meteors = state.editor.meteors.slice();
    setupLevel(state.runtime.currentLevelIndex, true);
    lastTime = null;
    updateCamera(true);
    runFrame(performance.now());
  }

  function showMenu() {
    mode = APP_MODE.MENU;
    cancelAnimationFrame(animationHandle);
    startMenu.show();
    postMenu.hide();
    infoPanel.clear();
    touchControls.setVisible(false);
    editorPanel.hide();
    if (toolbar) {
      toolbar.classList.add('hidden');
      toolbar.setAttribute('aria-hidden', 'true');
    }
  }

  function startLevel() {
    mode = APP_MODE.PLAY;
    startMenu.hide();
    postMenu.hide();
    editorPanel.hide();
    if (toolbar) {
      toolbar.classList.add('hidden');
      toolbar.setAttribute('aria-hidden', 'true');
    }
    touchControls.setVisible(true);
    state.runtime.currentLevelIndex = clamp(state.runtime.currentLevelIndex, 0, LEVELS.length - 1);
    setupLevel(state.runtime.currentLevelIndex, false);
    lastTime = null;
    updateCamera(true);
    runFrame(performance.now());
  }

  function startEditor() {
    mode = APP_MODE.EDITOR;
    cancelAnimationFrame(animationHandle);
    touchControls.setVisible(false);
    startMenu.hide();
    postMenu.hide();
    editorPanel.setTitle('Level Editor');
    editorPanel.setContent('Select a tool to sculpt terrain, place hazards, and configure the landing zone. Press R to test.');
    if (editorPanel.root) {
      editorPanel.root.classList.remove('hidden');
      editorPanel.root.setAttribute('aria-hidden', 'false');
    }
    if (toolbar) {
      toolbar.classList.remove('hidden');
      toolbar.setAttribute('aria-hidden', 'false');
    }
    if (!state.editor.grid) {
      state.editor.grid = { solids: state.terrain.solids };
    }
    state.terrain.blackHoles = state.editor.blackHoles.slice();
    state.terrain.meteors = state.editor.meteors.slice();
    terrainProfile = refreshTerrainProfile(state.terrain);
    editorController.enter();
    infoPanel.setTitle('Editor');
    infoPanel.setMessage('Click and drag to sculpt terrain. Press R to test.');
    render();
  }

  function returnToEditor() {
    if (!state.editor.testBaseline) {
      startEditor();
      return;
    }
    const baseline = state.editor.testBaseline;
    state.terrain.solids = baseline.solids.slice();
    state.terrain.blackHoles = baseline.blackHoles.slice();
    state.terrain.meteors = baseline.meteors.slice();
    Object.assign(state.pad, baseline.pad);
    terrainProfile = refreshTerrainProfile(state.terrain);
    startEditor();
  }

  function showPostMenu(message, success) {
    if (mode === APP_MODE.TEST) {
      infoPanel.setMessage(`${message} — Press Esc to return to the editor.`, 'Test Result');
      return;
    }
    postMenu.setMessage(message, success);
    postMenu.show();
  }

  function handleLandingSuccess() {
    state.runtime.gameOver = true;
    state.runtime.landed = true;
    state.runtime.message = 'Landing successful!';
    infoPanel.setMessage('Landing successful! Prepare for the next mission.', 'Mission Status');
    spawnConfetti(state.runtime, { x: state.pad.x + state.pad.w / 2, y: state.pad.y });
    audio.playWinFanfare();
    showPostMenu('Landing successful!', true);
  }

  function handleCrash(reason, { explode = true } = {}) {
    if (state.runtime.gameOver) return;
    state.runtime.gameOver = true;
    state.runtime.landed = false;
    state.runtime.message = reason;
    infoPanel.setMessage(reason, 'Mission Status');
    if (explode) {
      spawnExplosion(state.runtime, {
        x: state.lander.x,
        y: state.lander.y,
        vx: state.lander.vx,
        vy: state.lander.vy,
      });
      deformCrashCrater(state.lander.x, state.lander.y);
      audio.playExplosion();
    }
    showPostMenu(reason, false);
  }

  function deformCrashCrater(x, y) {
    const radius = BOMB_CONSTANTS.CRASH_CRATER_RADIUS;
    const depth = BOMB_CONSTANTS.CRASH_CRATER_DEPTH;
    const groundY = groundYAt(state.terrain, x, y);
    const craterY = Math.min(groundY, y);
    deformTerrainAt(state.terrain, state.pad, x, craterY, radius, depth);
    alignPadToSurface(state.terrain, state.pad, state.pad.x + state.pad.w / 2, state.pad.y);
    state.terrain.dirtyRender = true;
    refreshTerrainProfile(state.terrain);
    spawnDust(state.runtime, state.terrain, { x, y: craterY, intensity: 12, proximity: 1 });
  }

  function update(dt) {
    const keys = input.getSnapshot();
    const thrusting = !!keys.ArrowUp && state.lander.fuel > 0 && !state.runtime.gameOver;
    if (!state.runtime.gameOver) {
      if (keys.ArrowLeft) {
        rotateLander(state.lander, -1, dt);
      }
      if (keys.ArrowRight) {
        rotateLander(state.lander, 1, dt);
      }
      if (thrusting) {
        applyThrust(state.lander, dt, 1);
      }
      state.lander.vy += PHYSICS_CONSTANTS.GRAVITY * dt;
      const holeAccel = computeBlackHoleAcceleration(state.runtime.activeBlackHoles, state.lander.x, state.lander.y);
      if (holeAccel) {
        state.lander.vx += holeAccel.ax * dt;
        state.lander.vy += holeAccel.ay * dt;
      }
      integrateLander(state.lander, dt);
      if (thrusting) {
        emitThrusterDust();
      }
    }
    audio.setThrusterActive(thrusting);

    clampLanderToWorld(state.lander, canvas, state.terrain, reason => handleCrash(reason, { explode: false }));
    updateCamera();
    if (!state.runtime.gameOver) {
      evaluateContacts();
      checkBlackHoleCapture();
    }

    updateHazards(dt);
    updateParticles(state.runtime, dt, PHYSICS_CONSTANTS.GRAVITY, state.terrain, (x, y) =>
      computeBlackHoleAcceleration(state.runtime.activeBlackHoles, x, y)
    );
  }

  function emitThrusterDust() {
    const nozzleX = state.lander.x;
    const nozzleY = state.lander.y + state.lander.height / 2;
    const angle = state.lander.angle + Math.PI / 2;
    const dirX = Math.sin(angle);
    const dirY = Math.cos(angle);
    if (dirY <= 0) return;
    const hit = findSurfaceAlongRay(state.terrain, nozzleX, nozzleY, dirX, dirY, 320);
    if (!hit) return;
    const proximity = clamp01(1 - hit.distance / 320);
    spawnDust(state.runtime, state.terrain, {
      x: hit.x,
      y: hit.y,
      intensity: 6 + proximity * 6,
      proximity,
    });
  }

  function updateHazards(dt) {
    updateBombs(state.runtime, dt, state.terrain, state.pad, {
      onExplosion: bomb => {
        const dx = state.lander.x - bomb.x;
        const dy = state.lander.y - bomb.y;
        if (dx * dx + dy * dy <= BOMB_CONSTANTS.EXPLOSION_KILL_RADIUS ** 2) {
          handleCrash('Bomb blast vaporized the lander.');
        }
      },
    });

    updateMeteors(state.runtime, dt, state.terrain, state.pad, {
      onImpact: ({ x, y }) => {
        spawnExplosion(state.runtime, { x, y, vx: 0, vy: -0.2 });
        const dx = state.lander.x - x;
        const dy = state.lander.y - y;
        if (dx * dx + dy * dy <= BOMB_CONSTANTS.EXPLOSION_KILL_RADIUS ** 2) {
          handleCrash('Meteor impact destroyed the lander.');
        }
      },
    });
  }

  function checkBlackHoleCapture() {
    const capture = findBlackHoleCapture(state.runtime.activeBlackHoles, state.lander.x, state.lander.y);
    if (!capture) return;
    state.runtime.gameOver = true;
    state.runtime.message = 'Consumed by a black hole.';
    infoPanel.setMessage('The singularity ripped the lander apart. Press R to retry.', 'Mission Status');
    showPostMenu('Captured by a black hole.', false);
  }

  function updateCamera(force = false) {
    const worldWidth = Math.max(state.terrain.width || 0, canvas.width);
    const viewWidth = canvas.width;
    const camX = computeCameraX(state.lander.x, viewWidth, worldWidth);
    if (force || camX !== state.runtime.camX) {
      state.runtime.camX = camX;
      state.editor.camX = camX;
    }
  }

  function evaluateContacts() {
    const points = getLanderContactPoints(state.lander);
    let groundContact = null;
    points.forEach(point => {
      const penetration = resolvePenetrationAt(state.terrain, point.x, point.y);
      if (penetration.depth > 0) {
        groundContact = { point, penetration };
      }
    });
    if (!groundContact) return;

    const verticalSpeed = Math.abs(state.lander.vy);
    const rotation = Math.abs(state.lander.angle);
    const padTop = state.pad.y;
    const isOnPad =
      groundContact.point.y >= padTop - 2 &&
      groundContact.point.x >= state.pad.x - 4 &&
      groundContact.point.x <= state.pad.x + state.pad.w + 4;
    if (isOnPad && verticalSpeed < LANDING_MAX_SPEED && rotation < LANDING_MAX_ANGLE) {
      handleLandingSuccess();
    } else if (verticalSpeed > LANDING_MAX_SPEED * 1.6) {
      handleCrash('Crash landing!');
    } else {
      handleCrash('Landing failed. Align and slow down.');
    }
  }

  function drawBackground() {
    const camX = state.runtime.camX || 0;
    const parallaxFar = camX * 0.2;
    const parallaxNear = camX * 0.5;
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const starCount = 40;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < starCount; i++) {
      const x = ((i * 211 + Math.floor(parallaxFar)) % canvas.width);
      const y = ((i * 97 + Math.floor(backgroundPhase)) % canvas.height);
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.fillStyle = 'rgba(180,220,255,0.4)';
    for (let i = 0; i < starCount; i++) {
      const x = ((i * 137 + Math.floor(parallaxNear)) % canvas.width);
      const y = ((i * 83 + Math.floor(backgroundPhase * 0.6)) % canvas.height);
      ctx.fillRect(x, y, 3, 3);
    }
  }

  function drawTerrain() {
    if (state.terrain.dirtyRender || terrainProfile.length === 0) {
      terrainProfile = refreshTerrainProfile(state.terrain);
    }
    const camX = state.runtime.camX || 0;
    ctx.save();
    ctx.translate(-camX, 0);
    ctx.fillStyle = '#1a2638';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    const step = state.terrain.cellSize;
    terrainProfile.forEach((h, i) => {
      ctx.lineTo(i * step, h);
    });
    ctx.lineTo(state.terrain.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f8f4d6';
    ctx.fillRect(state.pad.x, state.pad.y, state.pad.w, state.pad.h);
    ctx.restore();
  }

  function drawLander() {
    const lander = state.lander;
    ctx.save();
    ctx.translate(lander.x - (state.runtime.camX || 0), lander.y);
    ctx.rotate(lander.angle);
    ctx.fillStyle = '#e8e8ff';
    ctx.beginPath();
    ctx.moveTo(0, -lander.height / 2);
    ctx.lineTo(-lander.width / 2, lander.height / 2);
    ctx.lineTo(lander.width / 2, lander.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c0c0f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-lander.legAttachOffset, lander.height / 2);
    ctx.lineTo(-lander.legFootOffset, lander.height / 2 + lander.legLength);
    ctx.moveTo(lander.legAttachOffset, lander.height / 2);
    ctx.lineTo(lander.legFootOffset, lander.height / 2 + lander.legLength);
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    backgroundPhase += 0.6;
    drawBackground();
    drawTerrain();
    drawMeteorWarnings(ctx, state.runtime, state.runtime.camX || 0);
    drawMeteors(ctx, state.runtime, state.runtime.camX || 0);
    drawBombs(ctx, state.runtime, state.runtime.camX || 0);
    drawParticles(ctx, state.runtime, state.runtime.camX || 0);
    drawLander();
    if (mode === APP_MODE.EDITOR) {
      editorController.renderOverlay(ctx, state.runtime.camX || 0);
    }
  }

  function runFrame(timestamp) {
    if (mode !== APP_MODE.PLAY && mode !== APP_MODE.TEST) return;
    if (lastTime == null) {
      lastTime = timestamp;
    }
    const dt = Math.min(32, timestamp - lastTime);
    lastTime = timestamp;
    update(dt);
    render();
    animationHandle = requestAnimationFrame(runFrame);
  }

  function restartLevel() {
    state.runtime.gameOver = false;
    if (mode === APP_MODE.TEST) {
      beginEditorTest();
    } else {
      startLevel();
    }
  }

  function nextLevel() {
    state.runtime.currentLevelIndex = (state.runtime.currentLevelIndex + 1) % LEVELS.length;
    restartLevel();
  }

  function dropBombIfPossible() {
    if (!canDropBomb(state.runtime)) return;
    dropBomb(state.runtime, state.lander);
  }

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (mode === APP_MODE.PLAY) {
        showMenu();
      } else if (mode === APP_MODE.TEST) {
        event.preventDefault();
        returnToEditor();
      } else if (mode === APP_MODE.EDITOR) {
        showMenu();
      }
    }
    if (event.code === 'Space' && (mode === APP_MODE.PLAY || mode === APP_MODE.TEST)) {
      event.preventDefault();
      dropBombIfPossible();
    }
  });

  return {
    resizeCanvas,
    startLevel,
    restartLevel,
    nextLevel,
    showMenu,
    startEditor,
    beginEditorTest,
    returnToEditor,
    isInPlay: () => mode === APP_MODE.PLAY,
    getMode: () => mode,
    dropBomb: dropBombIfPossible,
  };
}
