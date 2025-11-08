import { gameEvents, GameEvent } from '../game/events.js';

const panel = document.getElementById('postLevelPanel');
const titleEl = document.getElementById('postLevelTitle');
const summaryEl = document.getElementById('postLevelSummary');
const nextButton = document.getElementById('nextLevelButton');
const retryButton = document.getElementById('retryButton');
const menuButton = document.getElementById('backToMenuButton');

export function initPostLevel() {
  nextButton.addEventListener('click', () => gameEvents.emit(GameEvent.REQUEST_NEXT_LEVEL));
  retryButton.addEventListener('click', () => gameEvents.emit(GameEvent.REQUEST_RETRY));
  menuButton.addEventListener('click', () => gameEvents.emit(GameEvent.REQUEST_MENU));

  gameEvents.on(GameEvent.LANDING_SUCCESS, ({ stats }) => {
    titleEl.textContent = 'Mission Complete';
    summaryEl.textContent = `Touchdown achieved in ${stats.duration.toFixed(1)}s.`;
    panel.classList.add('visible');
  });

  gameEvents.on(GameEvent.LANDING_FAILURE, ({ reason }) => {
    titleEl.textContent = 'Mission Failed';
    summaryEl.textContent = reason || 'The lander did not survive the attempt.';
    panel.classList.add('visible');
  });

  gameEvents.on(GameEvent.REQUEST_START, hide);
  gameEvents.on(GameEvent.REQUEST_RESUME, hide);
  gameEvents.on(GameEvent.REQUEST_EDITOR, hide);
  gameEvents.on(GameEvent.REQUEST_TESTS, hide);
  gameEvents.on(GameEvent.LEVEL_SELECTED, hide);
  gameEvents.on(GameEvent.REQUEST_RETRY, hide);
  gameEvents.on(GameEvent.REQUEST_NEXT_LEVEL, hide);
}

export function hide() {
  panel.classList.remove('visible');
}
