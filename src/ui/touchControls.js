import { TOUCH_PREF_KEY } from '../constants.js';

export class TouchControls {
  constructor({ root, toggleButton, inputManager, onMenu, onBomb }) {
    this.root = root;
    this.toggleButton = toggleButton;
    this.input = inputManager;
    this.onMenu = onMenu;
    this.onBomb = onBomb;
    this.visible = false;
    this.manualPreference = null;
    this.wantsTouchControls = false;
    this.buttons = [];
    if (root) {
      this.buttons = Array.from(root.querySelectorAll('button[data-key], button[data-action]'));
      this.attachPointerHandlers();
    }
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        this.cyclePreference();
      });
    }
    this.loadPreference();
    this.updateToggleLabel();
  }

  attachPointerHandlers() {
    const start = (event, button) => {
      event.preventDefault();
      const key = button.dataset.key;
      const action = button.dataset.action;
      button.classList.add('is-pressed');
      if (key) {
        this.input.pressVirtualKey(key);
      }
      if (action === 'menu' && typeof this.onMenu === 'function') {
        this.onMenu();
      }
      if (action === 'bomb' && typeof this.onBomb === 'function') {
        this.onBomb();
      }
    };
    const end = (event, button) => {
      event.preventDefault();
      const key = button.dataset.key;
      button.classList.remove('is-pressed');
      if (key) {
        this.input.releaseVirtualKey(key);
      }
    };
    this.buttons.forEach((button) => {
      button.addEventListener('pointerdown', (event) => start(event, button));
      button.addEventListener('pointerup', (event) => end(event, button));
      button.addEventListener('pointerleave', (event) => end(event, button));
      button.addEventListener('pointercancel', (event) => end(event, button));
    });
  }

  loadPreference() {
    try {
      const stored = window.localStorage.getItem(TOUCH_PREF_KEY);
      if (stored === 'on' || stored === 'off') {
        this.manualPreference = stored;
      }
    } catch (err) {
      this.manualPreference = null;
    }
    this.refreshPreference();
  }

  refreshPreference() {
    if (this.manualPreference === 'on') {
      this.wantsTouchControls = true;
    } else if (this.manualPreference === 'off') {
      this.wantsTouchControls = false;
    } else {
      this.wantsTouchControls = this.computeDefaultPreference();
    }
    this.updateToggleLabel();
    this.setVisible(this.visible && this.wantsTouchControls);
  }

  computeDefaultPreference() {
    if (window.matchMedia) {
      try {
        const query = window.matchMedia('(pointer: coarse)');
        if (query && typeof query.matches === 'boolean' && query.matches) {
          return true;
        }
      } catch (_) {
        /* ignore */
      }
    }
    if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) {
      return true;
    }
    return 'ontouchstart' in window;
  }

  cyclePreference() {
    if (this.manualPreference === 'on') {
      this.manualPreference = 'off';
    } else if (this.manualPreference === 'off') {
      this.manualPreference = null;
    } else {
      this.manualPreference = 'on';
    }
    try {
      if (this.manualPreference === null) {
        window.localStorage.removeItem(TOUCH_PREF_KEY);
      } else {
        window.localStorage.setItem(TOUCH_PREF_KEY, this.manualPreference);
      }
    } catch (_) {
      /* ignore storage errors */
    }
    this.refreshPreference();
  }

  updateToggleLabel() {
    if (!this.toggleButton) return;
    const auto = this.manualPreference === null;
    const stateLabel = auto
      ? (this.wantsTouchControls ? 'Auto (On)' : 'Auto (Off)')
      : (this.manualPreference === 'on' ? 'On' : 'Off');
    this.toggleButton.textContent = `Touch HUD: ${stateLabel}`;
    this.toggleButton.setAttribute('aria-pressed', this.wantsTouchControls ? 'true' : 'false');
    this.toggleButton.classList.remove('hidden');
  }

  setVisible(visible) {
    const shouldShow = !!visible && this.wantsTouchControls;
    if (shouldShow === this.visible) return;
    this.visible = shouldShow;
    if (!this.root) return;
    if (shouldShow) {
      this.root.classList.remove('hidden');
      this.root.classList.add('visible');
      this.root.setAttribute('aria-hidden', 'false');
    } else {
      this.root.classList.remove('visible');
      this.root.classList.add('hidden');
      this.root.setAttribute('aria-hidden', 'true');
      this.input.clearVirtualKeys();
      this.buttons.forEach(button => button.classList.remove('is-pressed'));
    }
  }
}
