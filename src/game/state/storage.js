const STORAGE_KEY = 'moonlander-phaser-state';

function readState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Unable to read storage', err);
    return {};
  }
}

function writeState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Unable to persist storage', err);
  }
}

export function loadPersistedState() {
  return readState();
}

export function savePersistedState(updater) {
  const current = readState();
  const next = typeof updater === 'function' ? updater(current) : updater;
  writeState(next);
}
