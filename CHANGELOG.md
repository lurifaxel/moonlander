# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Phaser 3 scene graph powering gameplay, menus, and the editor.
- Vite-based toolchain with hot module replacement and production builds.
- DOM-driven diagnostics panel with summaries for the regression suite.
- Simplified crater hazard toggling and Matter.js powered landing pad collisions.

### Changed

- Replaced the monolithic canvas script with a modular `src/` directory (scenes, state managers, UI bridges).
- Updated the HTML shell to mount Phaser beneath reusable HUD/menu/touch overlays.
- Reworked the editor into a drag-and-drop control-point experience with spawn/pad markers.
- Tuned lander thrust, rotation authority, and fuel consumption to make stable descents easier.

### Fixed

- Mission restarts from the menu, post-flight panel, and editor test mode reliably relaunch the play scene after crashes.
- Flush pending Phaser scene operations when swapping from the menu so retry and next-level buttons react immediately.

## [0.1.0] - 2025-10-04

### Added

- Initial working version.
