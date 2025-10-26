# Moonlander

A lightweight lunar lander demo rendered with vanilla HTML and JavaScript. Guide the ship to a gentle touchdown on the glowing pad without crashing.

## Features
- Procedurally generated terrain with a dedicated landing pad
- Keyboard and touch control support (auto-detected with a manual toggle)
- Audio feedback for thrust, crashes, and successful landings
- Responsive canvas sizing for desktop and mobile browsers

## Run
Open `index.html` in any modern browser—no build step required. The playfield scales to the current viewport while staying within a comfortable min/max range.

## Controls
- **↑** – Fire the main thruster
- **← / →** – Rotate the lander
- **Start button** – return to the main menu when using touch controls

## Tests
A minimal Node-based harness exercises the pure terrain and physics helpers.

```bash
node tests/runTests.js
```

## Project layout
```
styles/        Extracted CSS for the game shell and overlays
src/constants  Shared tunables and enumerations
src/terrain    Terrain generation & collision helpers
src/lander     Lander physics utilities
src/ui         Vanilla DOM helpers for overlays and touch HUD
src/main.js    Browser bootstrap wiring everything together
```
