export const TOUCH_PREF_KEY = 'moonlander.touchControls';

export const APP_MODE = Object.freeze({
  MENU: 'menu',
  PLAY: 'play',
  EDITOR: 'editor',
  TEST: 'test',
});

export const VIEW_BOUNDS = Object.freeze({
  MAX_WIDTH: 1280,
  MAX_HEIGHT: 1400,
  MIN_WIDTH: 600,
  MIN_HEIGHT: 400,
});

export const GRID_CELL_SIZE = 8;

export const PAD = Object.freeze({
  WIDTH: 110,
  HEIGHT: 10,
  PULSE_PERIOD_MS: 3000,
});

export const BOMB_CONSTANTS = Object.freeze({
  FUSE_MS: 3000,
  ARM_DELAY_MS: 220,
  BLINK_BASE: 0.002,
  BLINK_ACCEL: 0.013,
  MAX_RADIUS: 68,
  MAX_DEPTH: 36,
  SELF_PUSH: 18,
  MAX_ACTIVE: 6,
  DROP_COOLDOWN_MS: 220,
  CHAIN_RADIUS: 86,
  EXPLOSION_KILL_RADIUS: 74,
  CRASH_CRATER_RADIUS: 78,
  CRASH_CRATER_DEPTH: 44,
});

export const METEOR_CONSTANTS = Object.freeze({
  TRAIL_INTERVAL_MS: 26,
  CRATER_RADIUS_SCALE: 2.1,
  CRATER_DEPTH_SCALE: 1.25,
  SPAWN_ABOVE_MARGIN: 60,
  SPAWN_HANDLE_OFFSET: 28,
  SPARK_COUNT: 18,
  IMPACT_SMOKE_SCALE: 0.2,
  WARNING_FLASH_MS: 280,
  WARNING_ALPHA_MIN: 0.22,
  WARNING_ALPHA_MAX: 0.8,
  MIN_RADIUS: 4,
  MAX_RADIUS: 140,
  MIN_SPEED: 0.02,
  MAX_SPEED: 2.5,
});

export const BLACK_HOLE_CONSTANTS = Object.freeze({
  EVENT_RADIUS: 42,
  PULL_RADIUS: 220,
  PULL_STRENGTH: 0.0014,
  MAX_FORCE: 0.0025,
  MIN_DISTANCE: 18,
  MIN_SPACING: 42 * 2.1,
});

export const DEBRIS_CONSTANTS = Object.freeze({
  GRAVITY_MULT: 3,
  LIFE_MULT: 3,
});

export const TOUCH_CONTROL_KEYS = Object.freeze(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space']);

export const PHYSICS_CONSTANTS = Object.freeze({
  GRAVITY: 0.00015,
  THRUST_POWER: 0.0007,
  ROTATE_ACCEL: 0.00001,
  ROTATE_DAMPING: 0.99,
});
