import { GRID_CELL_SIZE, PAD, PHYSICS_CONSTANTS } from './constants.js';

export function createLander() {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    rotateAccel: PHYSICS_CONSTANTS.ROTATE_ACCEL,
    rotateDamping: PHYSICS_CONSTANTS.ROTATE_DAMPING,
    fuel: 100,
    width: 20,
    height: 30,
    thrustPower: PHYSICS_CONSTANTS.THRUST_POWER,
    legLength: 10,
    legAttachOffset: 20 / 4,
    legFootOffset: 20 / 2,
  };
}

export function resetLander(lander, x, y) {
  lander.x = x;
  lander.y = y;
  lander.vx = 0;
  lander.vy = 0;
  lander.angle = 0;
  lander.angularVelocity = 0;
  lander.fuel = 100;
}

export function createPad() {
  return { x: 0, y: 0, w: PAD.WIDTH, h: PAD.HEIGHT };
}

export function createTerrain(cellSize = GRID_CELL_SIZE) {
  return {
    cellSize,
    cols: 0,
    rows: 0,
    solids: new Uint8Array(0),
    width: 0,
    height: 0,
    levelName: '',
    dirtyRender: true,
    blackHoles: [],
    meteors: [],
  };
}

export function cloneTerrainSolids(source) {
  const copy = new Uint8Array(source.length);
  copy.set(source);
  return copy;
}

export function createEditorState() {
  return {
    active: false,
    grid: null,
    placementOptions: ['spawn', 'landing', 'terrain', 'blackHole', 'meteor'],
    placementIndex: 0,
    spawn: { x: 180, y: 120 },
    isPainting: false,
    hasMoved: false,
    cursorWorld: null,
    lastPointer: null,
    pendingPaintStart: null,
    brushRadius: 26,
    activeBrushMode: 'add',
    camX: null,
    camY: null,
    testBaseline: null,
    blackHoles: [],
    meteors: [],
    meteorDefaults: {
      startMs: 3500,
      warningLeadMs: 1600,
      speed: 0.32,
      radius: 26,
    },
    pendingMeteor: null,
    isPlacingMeteor: false,
    selectedMeteor: -1,
    dragging: null,
  };
}

export function createRuntimeState() {
  return {
    lastTime: null,
    keys: {},
    gameOver: false,
    message: '',
    exploded: false,
    debris: [],
    landed: false,
    winFx: [],
    padFlash: 0,
    shouldRegen: false,
    padPulsePhase: 0,
    padGlowAlpha: 0.525,
    smoke: [],
    blastSmoke: [],
    wreckFlames: [],
    bombs: [],
    bombCooldown: 0,
    meteorTimeline: [],
    meteorWarnings: [],
    activeMeteors: [],
    meteorTime: 0,
    activeBlackHoles: [],
    blackHolePhase: 0,
    camX: null,
    camY: null,
    currentLevelIndex: 0,
    nextLevelIndex: 0,
  };
}

export function createGameState() {
  return {
    lander: createLander(),
    pad: createPad(),
    terrain: createTerrain(),
    editor: createEditorState(),
    runtime: createRuntimeState(),
  };
}
