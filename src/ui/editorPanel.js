import { gameEvents, GameEvent } from '../game/events.js';

const panel = document.getElementById('editorPanel');
const toolButtons = Array.from(panel.querySelectorAll('[data-editor]'));
const saveButton = document.getElementById('saveLevelButton');
const playButton = document.getElementById('playLevelButton');

let currentTool = 'terrain';

export function initEditorPanel() {
  toolButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setTool(button.dataset.editor);
    });
  });
  saveButton.addEventListener('click', () => gameEvents.emit(GameEvent.EDITOR_SAVE));
  playButton.addEventListener('click', () => gameEvents.emit(GameEvent.EDITOR_TEST));
  setTool(currentTool);
}

export function showEditorPanel(visible) {
  panel.classList.toggle('visible', visible);
}

function setTool(tool) {
  currentTool = tool;
  toolButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.editor === tool);
  });
  gameEvents.emit(GameEvent.EDITOR_TOOL_SELECTED, tool);
}
