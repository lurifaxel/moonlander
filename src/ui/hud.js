import { gameEvents, GameEvent } from '../game/events.js';

const fieldElements = new Map();

export function initHud() {
  document.querySelectorAll('[data-field]').forEach((el) => {
    fieldElements.set(el.dataset.field, el);
  });
  gameEvents.on(GameEvent.HUD_UPDATE, updateHud);
}

function updateHud(payload) {
  if (payload.altitude != null) {
    setValue('altitude', `${payload.altitude.toFixed(0)} m`);
  }
  if (payload.verticalSpeed != null) {
    setValue('vertical-speed', `${payload.verticalSpeed.toFixed(1)} m/s`);
  }
  if (payload.horizontalSpeed != null) {
    setValue('horizontal-speed', `${payload.horizontalSpeed.toFixed(1)} m/s`);
  }
  if (payload.fuelRatio != null) {
    const pct = Math.round(payload.fuelRatio * 100);
    setValue('fuel', `${pct}%`);
  }
}

function setValue(field, value) {
  const element = fieldElements.get(field);
  if (element) {
    element.textContent = value;
  }
}
