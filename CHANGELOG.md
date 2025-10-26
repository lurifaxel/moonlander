# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Node-driven test harness (`node tests/runTests.js`) covering terrain generation and lander physics helpers.
- Modular audio controller with basic thruster, crash, and win cues.

### Changed
- Refactored the browser build into ES modules (`src/`) with dedicated UI, physics, and terrain helpers for readability and reuse.
- Moved all styling into `styles/main.css` and trimmed `index.html` to a lightweight shell.
- Simplified gameplay focus on landing challenges while keeping responsive canvas sizing and touch controls.
- Updated documentation to reflect the new module layout and test instructions while restoring gameplay guides.

## [0.1.0] - 2025-10-04

### Added
- Initial working version.
