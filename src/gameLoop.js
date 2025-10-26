import { APP_MODE, VIEW_BOUNDS } from './constants.js';
import { LEVELS } from './game/levels.js';
import { createGameState, resetLander } from './state.js';
import { generateTerrain, resolvePenetrationAt, clamp } from './terrain.js';
import { getLanderContactPoints, applyThrust, integrateLander, rotateLander } from './lander.js';

const LANDING_MAX_SPEED = 0.08;
const LANDING_MAX_ANGLE = Math.PI / 8;

export function createGameLoop({
  canvas,
  infoPanel,
  startMenu,
  postMenu,
  input,
  audio,
  touchControls,
}) {
  const ctx = canvas.getContext('2d');
  const state = createGameState();
  let mode = APP_MODE.MENU;
  let animationHandle = null;
  let lastTime = null;
  let terrainProfile = [];

  function resizeCanvas() {
    const availWidth = Math.max(0, window.innerWidth);
    const availHeight = Math.max(0, window.innerHeight);
    const targetWidth = clamp(availWidth, VIEW_BOUNDS.MIN_WIDTH, VIEW_BOUNDS.MAX_WIDTH);
    const targetHeight = clamp(availHeight, VIEW_BOUNDS.MIN_HEIGHT, VIEW_BOUNDS.MAX_HEIGHT);
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;
  }

  function setupLevel(index) {
    const level = LEVELS[index % LEVELS.length];
    const { heights } = generateTerrain({
      terrain: state.terrain,
      pad: state.pad,
      level,
      canvasHeight: canvas.height,
      editorState: state.editor,
    });
    terrainProfile = heights;
    const spawnX = clamp(
      state.pad.x - 120,
      40,
      Math.max(state.terrain.width - 40, 40)
    );
    const spawnY = Math.min(...heights) - 120;
    resetLander(state.lander, spawnX, Math.max(40, spawnY));
    state.lander.vx = 0.04;
    infoPanel.setTitle(level.name);
    infoPanel.setMessage('Touchdown gently on the illuminated pad. Arrow keys rotate/thrust.');
    state.runtime.gameOver = false;
    state.runtime.landed = false;
    state.runtime.message = '';
  }

  function startLevel() {
    mode = APP_MODE.PLAY;
    startMenu.hide();
    postMenu.hide();
    touchControls.setVisible(true);
    setupLevel(state.runtime.currentLevelIndex);
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
  }

  function showPostMenu(message, success) {
    postMenu.setMessage(message, success);
    postMenu.show();
  }

  function handleLandingSuccess() {
    state.runtime.gameOver = true;
    state.runtime.landed = true;
    state.runtime.message = 'Landing successful!';
    infoPanel.setMessage('Landing successful! Prepare for the next mission.', 'Mission Status');
    audio.playWinFanfare();
    showPostMenu('Landing successful!', true);
  }

  function handleCrash(reason) {
    state.runtime.gameOver = true;
    state.runtime.landed = false;
    state.runtime.message = reason;
    infoPanel.setMessage(reason, 'Mission Status');
    audio.playExplosion();
    showPostMenu(reason, false);
  }

  function update(dt) {
    const keys = input.getSnapshot();
    if (!state.runtime.gameOver) {
      if (keys.ArrowLeft) {
        rotateLander(state.lander, -1, dt);
      }
      if (keys.ArrowRight) {
        rotateLander(state.lander, 1, dt);
      }
      const thrusting = !!keys.ArrowUp && state.lander.fuel > 0;
      if (thrusting) {
        applyThrust(state.lander, dt, 1);
      }
      audio.setThrusterActive(thrusting);
      integrateLander(state.lander, dt);
    } else {
      audio.setThrusterActive(false);
    }

    constrainLander();
    updateCamera();
    if (!state.runtime.gameOver) {
      evaluateContacts();
    }
  }

  function constrainLander() {
    const lander = state.lander;
    const width = Math.max(canvas.width, state.terrain.width || 0);
    const height = Math.max(canvas.height, state.terrain.height || 0);
    if (lander.x < 0) lander.x = 0;
    if (lander.x > width) lander.x = width;
    if (lander.y < 0) lander.y = 0;
    if (lander.y > height + 80) {
      handleCrash('You drifted into the abyss.');
    }
  }

  function updateCamera(force = false) {
    const worldWidth = Math.max(state.terrain.width || 0, canvas.width);
    const viewWidth = canvas.width;
    let camX = 0;
    if (worldWidth > viewWidth) {
      const target = state.lander.x - viewWidth * 0.5;
      camX = clamp(target, 0, worldWidth - viewWidth);
    }
    if (force || camX !== state.runtime.camX) {
      state.runtime.camX = camX;
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
    const isOnPad = groundContact.point.y >= padTop - 2 && groundContact.point.x >= state.pad.x - 4 && groundContact.point.x <= state.pad.x + state.pad.w + 4;
    if (isOnPad && verticalSpeed < LANDING_MAX_SPEED && rotation < LANDING_MAX_ANGLE) {
      handleLandingSuccess();
    } else if (verticalSpeed > LANDING_MAX_SPEED * 1.6) {
      handleCrash('Crash landing!');
    } else {
      handleCrash('Landing failed. Align and slow down.');
    }
  }

  function drawTerrain() {
    if (terrainProfile.length === 0) return;
    ctx.save();
    const camX = state.runtime.camX || 0;
    ctx.fillStyle = '#0f1928';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    ctx.restore();
  }

  function drawLander() {
    const lander = state.lander;
    ctx.save();
    ctx.translate(lander.x - (state.runtime.camX || 0), lander.y);
    ctx.rotate(lander.angle);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-lander.width / 2, -lander.height / 2, lander.width, lander.height);
    ctx.fillStyle = '#8fdfff';
    ctx.fillRect(-lander.legAttachOffset - 4, lander.height / 2, 8, lander.legLength);
    ctx.fillRect(lander.legAttachOffset - 4, lander.height / 2, 8, lander.legLength);
    ctx.restore();
  }

  function render() {
    drawTerrain();
    drawLander();
  }

  function runFrame(timestamp) {
    if (mode !== APP_MODE.PLAY) return;
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
    startLevel();
  }

  function nextLevel() {
    state.runtime.currentLevelIndex = (state.runtime.currentLevelIndex + 1) % LEVELS.length;
    restartLevel();
  }

  return {
    resizeCanvas,
    startLevel,
    restartLevel,
    nextLevel,
    showMenu,
    isInPlay: () => mode === APP_MODE.PLAY,
    getMode: () => mode,
  };
}
