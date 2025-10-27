import { createGameLoop } from './gameLoop.js';
import { InputManager } from './input.js';
import { AudioController } from './audio.js';
import { InfoPanel } from './ui/infoPanel.js';
import { EditorPanel } from './ui/editorPanel.js';
import { TouchControls } from './ui/touchControls.js';
import { MenuOverlay } from './ui/menus.js';
import { PostLevelMenu } from './ui/postLevelMenu.js';

function ready(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

ready(() => {
  const canvas = document.getElementById('gameCanvas');
  const infoPanelEl = document.getElementById('info');
  const startMenuEl = document.getElementById('startMenu');
  const postMenuEl = document.getElementById('postLevelMenu');
  const touchControlsEl = document.getElementById('touchControls');
  const touchToggle = document.getElementById('touchToggle');
  const editorPanelEl = document.getElementById('editorPanel');

  const infoPanel = new InfoPanel(infoPanelEl);
  const editorPanel = new EditorPanel(editorPanelEl);
  editorPanel.hide();

  const startMenu = new MenuOverlay(startMenuEl);
  const postMenu = new PostLevelMenu(postMenuEl);

  const input = new InputManager();
  input.attach(window);

  const audio = new AudioController();

  const toolbar = document.getElementById('editorToolBar');

  let game = null;

  const touchControls = new TouchControls({
    root: touchControlsEl,
    toggleButton: touchToggle,
    inputManager: input,
    onMenu: () => game && game.showMenu(),
    onBomb: () => game && game.dropBomb(),
  });

  game = createGameLoop({
    canvas,
    infoPanel,
    startMenu,
    postMenu,
    input,
    audio,
    touchControls,
    editorPanel,
    toolbar,
  });

  const menuPlayBtn = document.getElementById('menuPlay');
  const menuEditorBtn = document.getElementById('menuEditor');
  const postRestartBtn = document.getElementById('postRestart');
  const postNextBtn = document.getElementById('postNext');
  const postMenuBtn = document.getElementById('postMainMenu');

  if (menuPlayBtn) {
    menuPlayBtn.addEventListener('click', () => {
      audio.unlock();
      game.resizeCanvas();
      game.startLevel();
    });
  }

  if (menuEditorBtn) {
    menuEditorBtn.addEventListener('click', () => {
      audio.unlock();
      game.startEditor();
    });
  }

  if (postRestartBtn) {
    postRestartBtn.addEventListener('click', () => {
      audio.unlock();
      game.restartLevel();
    });
  }

  if (postNextBtn) {
    postNextBtn.addEventListener('click', () => {
      audio.unlock();
      game.nextLevel();
    });
  }

  if (postMenuBtn) {
    postMenuBtn.addEventListener('click', () => {
      if (game.getMode() === 'test') {
        game.returnToEditor();
      } else {
        game.showMenu();
      }
    });
  }

  window.addEventListener('resize', () => {
    game.resizeCanvas();
  });

  startMenu.show();
  game.resizeCanvas();
});
