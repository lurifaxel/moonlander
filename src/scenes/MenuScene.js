import Phaser from 'phaser';
import { gameEvents, GameEvent } from '../game/events.js';
import { getActiveLevel, setActiveLevel, listLevels } from '../game/state/levels.js';
import { showMenu } from '../ui/menu.js';
import { showEditorPanel } from '../ui/editorPanel.js';
import { runRegressionSuite } from '../game/state/testSuite.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
    this.hasActiveSession = false;
    this.activeLevelId = getActiveLevel().id;
  }

  create() {
    this.createBackground();
    this.bindEvents();
    showMenu(true);
    showEditorPanel(false);
    gameEvents.emit(GameEvent.GAME_READY, { hasActiveSession: this.hasActiveSession });
    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  }

  createBackground() {
    const far = this.add.image(0, 0, 'space-far').setOrigin(0);
    far.setDepth(0);
    const near = this.add.image(0, 0, 'space-near').setOrigin(0);
    near.setDepth(0.5);
  }

  bindEvents() {
    this.unsubscribers = [
      gameEvents.on(GameEvent.REQUEST_START, () => this.startMission(false)),
      gameEvents.on(GameEvent.REQUEST_RESUME, () => this.startMission(true)),
      gameEvents.on(GameEvent.REQUEST_MENU, () => this.returnToMenu()),
      gameEvents.on(GameEvent.REQUEST_EDITOR, () => this.openEditor()),
      gameEvents.on(GameEvent.REQUEST_TESTS, () => this.runDiagnostics()),
      gameEvents.on(GameEvent.LEVEL_SELECTED, (id) => {
        this.activeLevelId = id;
        setActiveLevel(id);
      }),
      gameEvents.on(GameEvent.REQUEST_NEXT_LEVEL, () => this.advanceLevel()),
      gameEvents.on(GameEvent.REQUEST_RETRY, () => this.startMission(false)),
      gameEvents.on(GameEvent.CLOSE_DIAGNOSTICS, () => {
        showMenu(true);
      })
    ];
  }

  startMission(resume) {
    showMenu(false);
    showEditorPanel(false);
    const level = getActiveLevel();
    const data = { level, resume };
    const playIsRunning = this.scene.isActive('play') || this.scene.isPaused?.('play') || this.scene.isSleeping?.('play');
    if (playIsRunning) {
      const playScene = this.scene.get('play');
      playScene?.scene.restart(data);
    } else {
      this.scene.run('play', data);
    }
    if (!resume) {
      this.hasActiveSession = true;
    }
    this.scene.bringToTop('play');
    gameEvents.emit(GameEvent.GAME_READY, { hasActiveSession: this.hasActiveSession });
  }

  returnToMenu() {
    this.scene.stop('play');
    this.scene.stop('editor');
    showEditorPanel(false);
    showMenu(true);
    this.hasActiveSession = false;
    gameEvents.emit(GameEvent.GAME_READY, { hasActiveSession: this.hasActiveSession });
  }

  openEditor() {
    const level = getActiveLevel();
    showMenu(false);
    showEditorPanel(true);
    this.scene.launch('editor', { level });
    this.scene.bringToTop('editor');
  }

  runDiagnostics() {
    const level = getActiveLevel();
    const results = runRegressionSuite(level);
    gameEvents.emit(GameEvent.TEST_RESULTS, results);
    showMenu(false);
  }

  advanceLevel() {
    const levels = listLevels();
    const index = levels.findIndex((lvl) => lvl.id === this.activeLevelId);
    if (index >= 0 && index < levels.length - 1) {
      const next = levels[index + 1];
      this.activeLevelId = next.id;
      setActiveLevel(next.id);
      this.startMission(false);
    } else {
      this.returnToMenu();
    }
  }

  cleanup() {
    this.unsubscribers?.forEach((unsubscribe) => typeof unsubscribe === 'function' && unsubscribe());
  }
}
