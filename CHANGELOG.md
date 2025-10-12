# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Touch HUD for mobile and other coarse-pointer devices with virtual thrust/rotate/bomb buttons and a toggle to force controls on or off.
- Thruster dust now spawns where the exhaust ray meets the terrain, matching lander tilt.
- Added oversized "Awesome Levels" with pronounced peaks, valleys, and hidden landing pads that require exploration between attempts.
- Start menu with a custom level editor: sculpt (or Alt-carve) voxel terrain, place spawn/landing zones, and press R to flight-test creations—including pads tucked inside caverns—before returning to editing.
- Black hole hazards that can be placed in the editor; they render as pixelated singularities, pull ships/bombs/debris, and consume the lander without triggering bomb explosions.
- Meteor showers that telegraph their path, blast fiery trails, deform the terrain on impact, and can be configured per-level (including timing, speed, angle, and size) directly from the editor.
- Mobile-friendly editor toolbar with icon buttons (1–5) for spawn, landing, terrain, black hole, and meteor tools so touch players can switch modes.

### Fixed

- Text after successful landing does not signal restart.
- Meteor strikes now detonate the lander (and nearby bombs) when a projectile collides mid-air, matching hazard expectations.
- Meteor projectiles now follow their warning trajectories precisely and impact at the marked destination.

### Changed

- Enlarged and centered the playfield; the canvas now expands to fill the viewport above touch/tool overlays while capping at 1280×1400 for consistent visibility.
- Level editor meteors feature clickable timing/speed/size inputs, digit hotkeys (1–5) for tool selection, and always spawn from above the visible playfield.
- Level editor entities (spawn point, landing zone, black holes, and meteor handles) now drag or tap-move regardless of the active tool, and spawn/landing can be relocated with a single click or touch.
- Terrain sculpting recognizes continuous touch drags, preventing long-press scrolling while allowing brush strokes to be painted on coarse pointers.
- Mobile touch HUD refined into a low-profile SNES-inspired footer with slimmer outline controls, a dedicated right-aligned thrust button, a scaled-down Start button, centered menus, and a delayed post-level overlay that only offers Next after successful landings (still supporting `R` restart / `N` advance).
- The floating info/status panel gained a collapsible header so editors can tuck it away while working on cramped screens.

## [0.1.0] - 2025-10-04

### Added

- Initial working version.
