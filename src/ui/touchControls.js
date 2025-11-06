import { gameEvents, GameEvent } from '../game/events.js';

const state = {
  left: false,
  right: false,
  thrust: false,
  bomb: false
};

export function initTouchControls() {
  document.querySelectorAll('[data-touch]').forEach((button) => {
    const key = button.dataset.touch;
    const setHeld = (value) => {
      state[key] = value;
      button.classList.toggle('is-held', value);
      gameEvents.emit(GameEvent.INPUT_CHANGED, { ...state });
    };
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      setHeld(true);
    });
    button.addEventListener('pointerup', () => setHeld(false));
    button.addEventListener('pointercancel', () => setHeld(false));
    button.addEventListener('lostpointercapture', () => setHeld(false));
  });
}

export function resetTouchState() {
  Object.keys(state).forEach((key) => {
    state[key] = false;
  });
  gameEvents.emit(GameEvent.INPUT_CHANGED, { ...state });
}
