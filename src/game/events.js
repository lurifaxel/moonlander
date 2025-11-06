class Emitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, handler) {
    const handlers = this.listeners.get(event) || [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
    return () => this.off(event, handler);
  }

  once(event, handler) {
    const off = this.on(event, (...args) => {
      off();
      handler(...args);
    });
    return off;
  }

  off(event, handler) {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx >= 0) {
      handlers.splice(idx, 1);
    }
    if (handlers.length === 0) {
      this.listeners.delete(event);
    }
  }

  emit(event, ...args) {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.slice().forEach((handler) => handler(...args));
  }
}

export const gameEvents = new Emitter();

export const GameEvent = Object.freeze({
  REQUEST_START: 'request-start',
  REQUEST_RESUME: 'request-resume',
  REQUEST_MENU: 'request-menu',
  REQUEST_EDITOR: 'request-editor',
  REQUEST_TESTS: 'request-tests',
  REQUEST_NEXT_LEVEL: 'request-next-level',
  REQUEST_RETRY: 'request-retry',
  LEVEL_SELECTED: 'level-selected',
  GAME_READY: 'game-ready',
  HUD_UPDATE: 'hud-update',
  LANDING_SUCCESS: 'landing-success',
  LANDING_FAILURE: 'landing-failure',
  INPUT_CHANGED: 'input-changed',
  EDITOR_TOOL_SELECTED: 'editor-tool-selected',
  EDITOR_SAVE: 'editor-save',
  EDITOR_TEST: 'editor-test',
  TEST_RESULTS: 'test-results',
  CLOSE_DIAGNOSTICS: 'close-diagnostics'
});
