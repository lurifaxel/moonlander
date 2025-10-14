# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Start menu updates: pilot name entry, selectable stored levels, and a procedurally generated run option with in-game timer and best-time tracking.
- Editor "Save Level" flow that serializes terrain, pad, spawn, meteors, and black holes into a human-readable JSON structure stored locally in the browser.
- Local level catalog and best-time data automatically loaded on startup from bundled JSON and browser storage, then reflected in the HUD.
- Thruster dust now spawns where the exhaust ray meets the terrain, matching lander tilt.
- Added oversized "Awesome Levels" with pronounced peaks, valleys, and hidden landing pads that require exploration between attempts.
- Start menu with a custom level editor: sculpt (or Alt-carve) voxel terrain, place spawn/landing zones, and press R to flight-test creations—including pads tucked inside caverns—before returning to editing.
- Black hole hazards that can be placed in the editor; they render as pixelated singularities, pull ships/bombs/debris, and consume the lander without triggering bomb explosions.
- Meteor showers that telegraph their path, blast fiery trails, deform the terrain on impact, and can be configured per-level (including timing, speed, angle, and size) directly from the editor.

### Fixed

- Text after successful landing does not signal restart.
- Meteor strikes now detonate the lander (and nearby bombs) when a projectile collides mid-air, matching hazard expectations.

### Changed

- Start menu layout updated to support pilot name entry, level selection, and procedural generation workflows.
- Enlarged and centered the playfield; canvas now scales with the browser up to 1280x720 for a more immersive layout.
- Level editor meteors feature clickable timing/speed/size inputs, digit hotkeys (1–4) for tool selection, and always spawn from above the visible playfield.
- Level editor entities (spawn point, landing zone, black holes, and meteor handles) can now be dragged to reposition or retarget hazards directly on the canvas.

## [0.1.0] - 2025-10-04

### Added

- Initial working version.
