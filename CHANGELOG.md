# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Node-driven test harness (`node tests/runTests.js`) now covering terrain generation, lander physics, particle systems, and hazard logic.
- Modular audio controller with basic thruster, crash, and win cues.
- Vanilla editor tooling for sculpting terrain, placing hazards, and testing custom levels.

### Changed
- Refactored the browser build into ES modules (`src/`) with dedicated UI, physics, and terrain helpers for readability and reuse.
- Moved all styling into `styles/main.css` and trimmed `index.html` to a lightweight shell.
- Reintroduced destructible terrain, particle effects, bombs, black holes, meteors, and post-landing celebrations within the modular architecture.
- Updated documentation to reflect the new module layout, editor workflow, and expanded test instructions while restoring gameplay guides.

## [0.1.0] - 2025-10-04

### Added
- Initial working version.
