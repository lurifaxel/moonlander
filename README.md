# Moonlander (Phaser Edition)

A Phaser 3 powered lunar landing game featuring arcade physics, a streamlined level editor, and built-in diagnostics. Pilot a retro lander across handcrafted missions or sculpt your own terrain, all while enjoying a modern tooling setup backed by Vite.

## Features
- **Phaser gameplay loop** – Matter.js physics powers the lander, terrain, and landing checks with smooth camera follow and parallax space backdrops.
- **Mission roster** – Three built-in scenarios (Apollo Valley, Tycho Trench, Darkside Ridge) plus a persistent custom slot saved to localStorage.
- **Touch + keyboard controls** – Desktop players use the arrow keys/WASD; mobile devices get a dedicated virtual pad for thrust, yaw, and bomb actions.
- **In-browser editor** – Drag terrain control points, reposition spawn/pad markers, and toggle circular crater hazards directly inside the Phaser scene.
- **Diagnostics harness** – One-click regression checks validate pad sizing, hazard definitions, terrain continuity, and fuel budgets with results streamed to the diagnostics panel.
- **Accessible overlays** – DOM-driven HUD, pause/menu dialogs, and post-mission summaries stay in sync with the active Phaser scene via a shared event bus.

## Getting started

```bash
npm install
npm run dev
```

Then open the reported local URL (defaults to `http://localhost:5173/`). The development build supports hot module replacement—changes to UI panels, scenes, or state modules reload instantly.

For a production build run:

```bash
npm run build
npm run preview
```

## Controls
- **Thrust** – <kbd>Up</kbd> / <kbd>W</kbd> or tap the on-screen Thrust button
- **Rotate** – <kbd>Left</kbd>/<kbd>Right</kbd> arrows or <kbd>A</kbd>/<kbd>D</kbd>; touch pad provides dedicated yaw buttons
- **Bomb** – Press <kbd>B</kbd> (desktop) or tap Bomb to clear the nearest crater hazard
- **Menu** – Choose _Start Mission_, _Resume_, _Open Editor_, or _Run Diagnostics_ from the overlay

## Level editor workflow
1. From the main menu pick **Open Editor**.
2. Use the palette to choose a tool:
   - **Terrain** – drag existing control points to reshape ridges and valleys.
   - **Set Spawn** – tap a new launch location within the safe airspace band.
   - **Set Landing Pad** – place the pad horizontally; width is preserved.
   - **Toggle Hazard** – tap to add/remove crater hazards (red circles).
3. Click **Save Level** to persist the layout as the **Custom Mission** slot.
4. **Test Level** exits the editor and launches straight into a play session using the custom configuration.

## Diagnostics
Select **Run Diagnostics** from the menu to execute the regression suite against the active mission. The diagnostics panel reports pass/fail counts alongside detailed notes for any failing checks. Close the panel to return to the menu and adjust your level.

## Project structure
```
.
├── AGENTS.md                 # Contributor guidelines and project tree
├── CHANGELOG.md              # Historical summary of notable changes
├── README.md                 # This document
├── docs/                     # Process notes and feature plans
├── index.html                # Root HTML shell containing DOM overlays
├── package.json              # npm scripts and dependencies (Phaser, Vite)
├── src/
│   ├── main.js               # Vite entry point that boots Phaser + UI bridge
│   ├── scenes/               # Boot, menu, play, and editor Phaser scenes
│   ├── game/
│   │   ├── events.js         # Shared event bus for scenes and overlays
│   │   ├── objects/          # Game objects (e.g., Lander)
│   │   └── state/            # Level data, terrain helpers, audio, diagnostics
│   └── ui/                   # DOM overlay controllers (HUD, menu, touch, etc.)
├── space_far.png             # Parallax background (distant stars)
└── space_near.png            # Parallax background (foreground stars)
```

## Browser support
Moonlander targets modern Chromium, Firefox, and Safari releases. Mobile devices automatically surface the touch controls. Audio playback is optional and activates once the user interacts with the page.

## License
The project ships without an explicit license—treat it as all rights reserved unless instructed otherwise.
