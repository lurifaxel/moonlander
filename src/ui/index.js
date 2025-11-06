import { initHud } from './hud.js';
import { initMenu } from './menu.js';
import { initPostLevel } from './postLevel.js';
import { initTouchControls } from './touchControls.js';
import { initEditorPanel } from './editorPanel.js';
import { initDiagnostics } from './diagnostics.js';

export function initUI() {
  initHud();
  initMenu();
  initPostLevel();
  initTouchControls();
  initEditorPanel();
  initDiagnostics();
}
