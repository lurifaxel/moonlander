# Moonlander

This is a game about flying a little spaceshift and landing on the moon.

## What it is
A 2D lunar-lander style game with cartoon physics:
- Procedural terrain with peaks/valleys plus a flat pad.
- Smoothed camera with look‑ahead, parallax starfield background.
- Fuel‑limited thrust, rotational momentum.
- Crash explosion with bouncing debris.
- Ground‑sourced **dust** kicked up by the thrusters; size + opacity scale with proximity to the surface and exhaust ray impact.
- Success celebration confetti + pad glow.
- Level regeneration **only after** a successful landing.

## Run
Open `index.html` in a modern browser (Chrome/Firefox). No build step.
The playfield auto-resizes to roughly 90% of the viewport (capped at 1280x720 and never smaller than 600x400) and stays centered for an immersive view.

## Controls
- **↑**: Main engine thrust
- **← / →**: Rotate (with momentum)
- **R**: Restart round
- **H**: Toggle debug/tuning overlay (if enabled in code)

## Gameplay rules
- Land while **over the pad**, roughly upright, and below speed thresholds. On success, you’ll see confetti and a glowing pad. Press **R** for the **next level** (terrain regenerates).
- On crash, debris flies and bounces. Press **R** to retry on the **same terrain**.

## Systems
- **Terrain**
  - `generateTerrain()` builds a smoothed random profile and carves a flat segment for the pad. `terrainY(x)` returns ground height.
  - Regenerated only when `shouldRegen` is set by a successful landing.
- **Camera & Parallax**
  - Smoothed follow with velocity‑based look‑ahead. Parallax layers scroll by `camX/camY`.
- **Particles**
  - **Dust**: `spawnSmoke`/`updateSmoke`/`drawSmoke` emit from the **terrain** at the **exhaust ray impact** (`findThrusterImpact()`). Proximity controls emission density, size, and opacity.
  - **Debris**: `spawnExplosion` + `updateDebris` + `drawDebris` on crash.
  - **Confetti**: `spawnWinFx` + `updateWinFx` + `drawWinFx` on success.
- **Success / Failure**
  - Landing thresholds are modest (upright tolerance, max speed, vx/vy). On success, `shouldRegen=true`; on crash, terrain persists.

## Tuning (live during play)
Some builds include a live tuning overlay and hotkeys. If present, the overlay shows current values and the keys below adjust them:
- Camera: lag (Q/A), look‑ahead gains (W/S, E/D), look cap (R/F)
- Parallax: far (T/G), near (Y/X)
- Ship: thrust (U/J), rotate accel (I/K), rotate damping (O/L)
- World: gravity (P/;), debris bounce (B/N), debris friction (M/,)

### Dust tuning
In `update()` emission block:
- `DUST_MAX_RAY`: when dust starts based on exhaust–terrain distance. // start dust only when nozzle-to-ground ray is shorter than this
- `intensity` curve: proximity response (e.g., `prox**2` vs `prox**3`).
- `spawnCount` formula: density.
- `spread`/`pushUp`: lateral spread and lift.

In `spawnSmoke()`:
- `baseR`: base dust size; `sizeBoost = 4 * prox` increases near ground. // stronger near-ground size gain
- Lifetimes: `life` and `maxLife`.

In `drawSmoke()`:
- `aProx = 0.25 + 0.75*(p.prox)`: proximity effect on opacity.

## Troubleshooting
- **Freeze on thrust**: Ensure `findThrusterImpact()` is defined at top level (not nested) and called from `update()`.
- **Overlay not visible**: It must draw in identity transform and be toggled with **H**; ensure DOM `#info` is not covering it when shown.
- **Fuel seems unchanged**: HUD now shows one decimal. Fuel depletion occurs only while thrusting.
