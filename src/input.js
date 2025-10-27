import { TOUCH_CONTROL_KEYS } from './constants.js';

export class InputManager {
  constructor() {
    this.keys = Object.create(null);
    this.physicalKeys = Object.create(null);
    this.virtualCounts = new Map();
    this.handlers = [];
  }

  attach(windowLike = window) {
    const onKeyDown = (event) => {
      this.physicalKeys[event.code || event.key] = true;
      this.keys[event.code || event.key] = true;
    };
    const onKeyUp = (event) => {
      const key = event.code || event.key;
      delete this.physicalKeys[key];
      if (!this.virtualCounts.has(key)) {
        delete this.keys[key];
      }
    };
    windowLike.addEventListener('keydown', onKeyDown);
    windowLike.addEventListener('keyup', onKeyUp);
    this.handlers.push(() => {
      windowLike.removeEventListener('keydown', onKeyDown);
      windowLike.removeEventListener('keyup', onKeyUp);
    });
  }

  dispose() {
    this.handlers.forEach((dispose) => dispose());
    this.handlers = [];
    this.keys = Object.create(null);
    this.physicalKeys = Object.create(null);
    this.virtualCounts.clear();
  }

  pressVirtualKey(key) {
    const count = this.virtualCounts.get(key) || 0;
    this.virtualCounts.set(key, count + 1);
    this.keys[key] = true;
  }

  releaseVirtualKey(key) {
    const count = this.virtualCounts.get(key) || 0;
    if (count <= 1) {
      this.virtualCounts.delete(key);
    } else {
      this.virtualCounts.set(key, count - 1);
    }
    if (!this.virtualCounts.has(key) && !this.physicalKeys[key]) {
      delete this.keys[key];
    }
  }

  clearVirtualKeys() {
    this.virtualCounts.forEach((_, key) => {
      if (!this.physicalKeys[key]) {
        delete this.keys[key];
      }
    });
    this.virtualCounts.clear();
  }

  isKeyPressed(key) {
    return !!this.keys[key];
  }

  getSnapshot() {
    return { ...this.keys };
  }

  resetControlKeys() {
    TOUCH_CONTROL_KEYS.forEach((key) => {
      delete this.physicalKeys[key];
      if (!this.virtualCounts.has(key)) {
        delete this.keys[key];
      }
    });
  }
}
