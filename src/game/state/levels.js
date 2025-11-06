import { loadPersistedState, savePersistedState } from './storage.js';

const defaultLevels = [
  {
    id: 'apollo',
    name: 'Apollo Valley',
    terrain: [
      { x: 0, y: 600 },
      { x: 200, y: 420 },
      { x: 380, y: 480 },
      { x: 640, y: 440 },
      { x: 800, y: 520 },
      { x: 960, y: 600 }
    ],
    spawn: { x: 160, y: 120 },
    pad: { x: 640, y: 420, width: 120 },
    hazards: [{ x: 500, y: 520, radius: 36, type: 'crater' }],
    gravity: 0.15,
    fuel: 120
  },
  {
    id: 'trench',
    name: 'Tycho Trench',
    terrain: [
      { x: 0, y: 560 },
      { x: 120, y: 420 },
      { x: 280, y: 380 },
      { x: 520, y: 580 },
      { x: 720, y: 460 },
      { x: 960, y: 600 }
    ],
    spawn: { x: 80, y: 120 },
    pad: { x: 280, y: 360, width: 90 },
    hazards: [
      { x: 420, y: 520, radius: 48, type: 'crater' },
      { x: 780, y: 540, radius: 60, type: 'crater' }
    ],
    gravity: 0.17,
    fuel: 100
  },
  {
    id: 'darkside',
    name: 'Darkside Ridge',
    terrain: [
      { x: 0, y: 520 },
      { x: 160, y: 460 },
      { x: 320, y: 540 },
      { x: 460, y: 420 },
      { x: 700, y: 360 },
      { x: 960, y: 500 }
    ],
    spawn: { x: 760, y: 160 },
    pad: { x: 460, y: 400, width: 120 },
    hazards: [{ x: 320, y: 520, radius: 42, type: 'crater' }],
    gravity: 0.2,
    fuel: 120
  }
];

const state = {
  levels: [...defaultLevels],
  activeLevelId: defaultLevels[0].id,
  completed: new Set(),
  customLevel: null
};

(function initFromStorage() {
  const persisted = loadPersistedState();
  if (!persisted) return;
  if (Array.isArray(persisted.completedLevels)) {
    state.completed = new Set(persisted.completedLevels);
  }
  if (persisted.activeLevelId) {
    state.activeLevelId = persisted.activeLevelId;
  }
  if (persisted.customLevel) {
    state.customLevel = persisted.customLevel;
  }
})();

function persist() {
  savePersistedState((previous = {}) => ({
    ...previous,
    completedLevels: Array.from(state.completed),
    activeLevelId: state.activeLevelId,
    customLevel: state.customLevel
  }));
}

export function listLevels() {
  return state.levels.map((level) => ({
    ...level,
    completed: state.completed.has(level.id)
  }));
}

export function getLevelById(id) {
  if (id === 'custom' && state.customLevel) {
    return state.customLevel;
  }
  return state.levels.find((level) => level.id === id) || state.levels[0];
}

export function getActiveLevel() {
  return getLevelById(state.activeLevelId);
}

export function setActiveLevel(id) {
  state.activeLevelId = id;
  persist();
}

export function markLevelCompleted(id) {
  state.completed.add(id);
  persist();
}

export function saveCustomLevel(level) {
  state.customLevel = {
    ...level,
    id: 'custom',
    name: level.name || 'Custom Mission'
  };
  persist();
}

export function getCustomLevel() {
  return state.customLevel;
}
