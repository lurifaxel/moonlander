import { InputManager } from '../src/input.js';
import { TOUCH_CONTROL_KEYS } from '../src/constants.js';

export async function runInputTests(assert) {
  const windowLike = {
    listeners: {
      keydown: new Set(),
      keyup: new Set(),
    },
    addEventListener(type, handler) {
      this.listeners[type].add(handler);
    },
    removeEventListener(type, handler) {
      this.listeners[type].delete(handler);
    },
    fire(type, event) {
      this.listeners[type].forEach((handler) => handler(event));
    },
  };

  const input = new InputManager();
  input.attach(windowLike);

  windowLike.fire('keydown', { code: 'ArrowUp' });
  assert.ok(input.isKeyPressed('ArrowUp'), 'physical keydown registers key');

  windowLike.fire('keyup', { code: 'ArrowUp' });
  assert.ok(!input.isKeyPressed('ArrowUp'), 'physical keyup clears key');

  input.pressVirtualKey('ArrowUp');
  assert.ok(input.isKeyPressed('ArrowUp'), 'virtual press sets key');
  input.releaseVirtualKey('ArrowUp');
  assert.ok(!input.isKeyPressed('ArrowUp'), 'virtual release clears key when not physical');

  // Combined physical and virtual presses keep the key active until both release.
  input.pressVirtualKey('ArrowLeft');
  windowLike.fire('keydown', { code: 'ArrowLeft' });
  input.releaseVirtualKey('ArrowLeft');
  assert.ok(input.isKeyPressed('ArrowLeft'), 'physical press keeps key active after virtual release');
  windowLike.fire('keyup', { code: 'ArrowLeft' });
  assert.ok(!input.isKeyPressed('ArrowLeft'), 'key clears only after physical release');

  input.pressVirtualKey('KeyX');
  input.clearVirtualKeys();
  assert.ok(!input.isKeyPressed('KeyX'), 'clearVirtualKeys removes virtual-only keys');

  TOUCH_CONTROL_KEYS.forEach((key) => windowLike.fire('keydown', { code: key }));
  input.resetControlKeys();
  TOUCH_CONTROL_KEYS.forEach((key) => {
    assert.ok(!input.isKeyPressed(key), 'resetControlKeys clears touch control bindings');
  });
  TOUCH_CONTROL_KEYS.forEach((key) => windowLike.fire('keyup', { code: key }));

  const snapshot = input.getSnapshot();
  assert.deepEqual(snapshot, {}, 'snapshot reflects current key state');

  input.pressVirtualKey('Space');
  input.dispose();
  assert.equal(windowLike.listeners.keydown.size, 0, 'dispose detaches keydown handlers');
  assert.equal(windowLike.listeners.keyup.size, 0, 'dispose detaches keyup handlers');
  assert.ok(!input.isKeyPressed('Space'), 'dispose clears current keys');
}
