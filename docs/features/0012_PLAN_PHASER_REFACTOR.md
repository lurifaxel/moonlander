# Feature 0012 - Phaser Refactor

## Context
The current Moon Lander build (`index.html`) bundles rendering, physics, menus, the terrain editor, and embedded regression tests into one vanilla canvas script. Refactoring the gameplay layer to Phaser 3 keeps the UX (menus, HUD, simplified editor, touch controls, regression diagnostics) but hands update/draw/physics orchestration to Phaser, giving us scene separation, asset management, and easier future extensions.

## Touch points
- `package.json`, `vite.config.js`
  - Introduce a Vite-powered bundler/toolchain with Phaser (`phaser`) as a dependency and npm scripts for `dev`, `build`, `preview`.
- `index.html`
  - Replace inline `<script>` with a Vite entry (`/src/main.js`), keep the DOM overlays (HUD, menu, editor palette, touch controls, diagnostics), and adjust styles to coexist with Phaser's injected canvas.
- `src/main.js`
  - Configure the Phaser game (canvas size, pixel density, physics) and wire the scene stack.
- `src/scenes/BootScene.js`
  - Preload assets (`space_far.png`, `space_near.png`, generated shapes) and forward to the menu when ready.
- `src/scenes/MenuScene.js`
  - Bridge the DOM-based menu buttons into scene transitions (`menu -> play`, `menu -> editor`, `menu -> tests`) and keep menu state in sync with level progress.
- `src/scenes/PlayScene.js`
  - Host lander gameplay: instantiate terrain meshes from stored level data, run Matter physics for the lander, hook thrust/rotate/bomb inputs, render parallax backgrounds/particles with Phaser display objects, and emit win/lose events back to the overlays.
- `src/scenes/EditorScene.js`
  - Provide a pared-back terrain editor (dragging control points, setting spawn/pad, toggling hazards) using Phaser input while reusing the terrain data structures, then save updates to storage.
- `src/scenes/TestRunnerScene.js`
  - Move the regression checks into a Phaser-driven harness that simulates levels without rendering, reporting pass/fail into the diagnostics DOM.
- `src/game/state/*.js`
  - Extract reusable systems (lander model, level definitions, terrain geometry, hazards, audio manager, storage bridge, test runner) from the old script into focused modules consumed by scenes.
- `src/ui/*.js`
  - Rewire DOM overlays (HUD, info panel, editor toolbar, touch controls, post-level dialog) to publish events for the active scene and subscribe to scene lifecycle hooks.
- `CHANGELOG.md`
  - Capture the Phaser migration, new project layout, and tooling updates.
- `README.md`
  - Document the new folder structure, development scripts, and how to run the game/editor/tests with Phaser.
- `AGENTS.md`
  - Refresh the project tree diagram so contributors can see the new `src/` breakdown.

## Plan
1. **Bootstrap Phaser toolchain** – Add `package.json` with Phaser/Vite dependencies plus `npm` scripts, drop in `vite.config.js`, and adjust `.gitignore` for `node_modules`/`dist`.
2. **Rewrite `index.html` shell** – Strip the monolithic `<script>`, include root DOM overlays (menus, HUD, editor controls, test panel), load `/src/main.js`, and massage CSS for Phaser's auto-inserted canvas element.
3. **Port data + services** – Split level definitions, terrain serialization, lander physics helpers, hazard logic, audio cues, and persistence helpers into `src/game/state/` modules derived from the existing script sections.
4. **Implement Phaser scenes** – Build `BootScene`, `MenuScene`, `PlayScene`, `EditorScene`, and `TestRunnerScene`, each consuming the shared state modules and translating DOM events to Phaser events.
5. **Rebind controls and HUD** – Replace the old canvas event wiring with a `ControlBridge` that listens for keyboard/touch/DOM actions and drives the active scene, pushing status/fuel/velocity updates back into the HUD + dialogs.
6. **Integrate regression tests** – Move `createTestSuite()` and its helpers into a module the TestRunner scene can run headlessly, echoing pass/fail output into the diagnostics DOM.
7. **Polish & docs** – Ensure scene transitions mirror the legacy UX, validate that editor updates persist and flow into play/tests, refresh README/CHANGELOG/AGENTS, and capture a fresh screenshot after verifying `npm run build` succeeds.
8. **Housekeeping** – Update lint/config files if necessary and keep the plan + refactor notes committed alongside the migration.

_Note: Remember to document the Phaser migration in `CHANGELOG.md`._
