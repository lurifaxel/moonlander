import { gameEvents, GameEvent } from '../game/events.js';
import { listLevels, setActiveLevel } from '../game/state/levels.js';

const menuPanel = document.getElementById('menuPanel');
const startButton = document.getElementById('startButton');
const resumeButton = document.getElementById('resumeButton');
const editorButton = document.getElementById('editorButton');
const testsButton = document.getElementById('testsButton');
const levelList = document.getElementById('levelList');

export function initMenu() {
  startButton.addEventListener('click', () => gameEvents.emit(GameEvent.REQUEST_START));
  resumeButton.addEventListener('click', () => gameEvents.emit(GameEvent.REQUEST_RESUME));
  editorButton.addEventListener('click', () => gameEvents.emit(GameEvent.REQUEST_EDITOR));
  testsButton.addEventListener('click', () => gameEvents.emit(GameEvent.REQUEST_TESTS));
  renderLevels();

  gameEvents.on(GameEvent.GAME_READY, ({ hasActiveSession }) => {
    resumeButton.disabled = !hasActiveSession;
  });
  gameEvents.on(GameEvent.LANDING_SUCCESS, handleMissionOutcome);
  gameEvents.on(GameEvent.LANDING_FAILURE, handleMissionOutcome);
}

function renderLevels() {
  const levels = listLevels();
  levelList.innerHTML = '';
  levels.forEach((level) => {
    const button = document.createElement('button');
    button.textContent = level.completed ? `✔ ${level.name}` : level.name;
    button.addEventListener('click', () => {
      setActiveLevel(level.id);
      gameEvents.emit(GameEvent.LEVEL_SELECTED, level.id);
    });
    levelList.appendChild(button);
  });
}

function handleMissionOutcome() {
  renderLevels();
  resumeButton.disabled = true;
}

export function showMenu(visible) {
  menuPanel.style.display = visible ? 'block' : 'none';
}
