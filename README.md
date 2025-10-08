# Moonlander

This is a game about flying a little spaceshift and landing on the moon.

## What it is
A 2D lunar-lander style game with cartoon physics:
- Procedural terrain with peaks/valleys plus a flat pad.
- Smoothed camera with look‑ahead, parallax starfield background.
- Fuel‑limited thrust, rotational momentum.
- Crash explosion with bouncing debris.
- Ground‑sourced **dust** kicked up by the thrusters; size + opacity scale with proximity to the surface and exhaust ray impact.
- Editor-placed **black holes** that tug ships, bombs, dust, and debris; cross the event horizon and the lander shreds into inward-spiraling fragments while the singularity remains untouched.
- Configurable **meteors** with flashing warnings, fiery trails, and dust-heavy impacts that carve new craters into the terrain.
- Success celebration confetti + pad glow.
- Level regeneration **only after** a successful landing.
- Start menu with a built-in level editor for custom terrain, spawn, and landing pads.

## Run
Open `index.html` in a modern browser (Chrome/Firefox). No build step.
The playfield auto-resizes to roughly 90% of the viewport (capped at 1280x720 and never smaller than 600x400) and stays centered for an immersive view.

## Controls
- **↑**: Main engine thrust
- **← / →**: Rotate (with momentum)
- **R**: Restart round
- **H**: Toggle debug/tuning overlay (if enabled in code)
- **Esc**: Return to the main menu (or back to the editor when testing custom levels)

### Level editor
Choose **Create Level** on the start menu to enter the editor:
- **Left-click & drag**: sculpt the ground contour in realtime.
- **Scroll wheel**: cycle the active placement between spawn point, landing zone, black hole, and meteor.
- **Click** (without dragging): place the currently selected object. Black holes snap to open space and pull nearby objects during test flights.
- **R**: spawn the lander to test your custom level.
- **Esc**: leave test mode back to editing, or exit the editor to the start menu.
- **Hold Alt + drag**: carve terrain away to sculpt caverns and overhangs; release Alt to add material again.
- **Alt + click** while **Black hole** is selected: remove the nearest hole inside the dashed event-horizon guide.
- Landing pads snap to the surface you click—even under overhangs—so you can build cavern pads.
- **Meteor tool**: click and drag to define the meteor’s path, `Alt + click` to delete the nearest meteor, and use `[ / ]`, `- / =`, `, / .`, and `; / '` to tweak size, speed, warning lead time, and arrival time respectively.

## Gameplay rules
- Land while **over the pad**, roughly upright, and below speed thresholds. On success, you’ll see confetti and a glowing pad. Press **R** for the **next level** (terrain regenerates).
- On crash, debris flies and bounces. Press **R** to retry on the **same terrain**.
- Black holes are lethal: their gravity wells bend bomb arcs, drag dust streams, and if the lander slips inside the event horizon it collapses into debris with no terrain crater.
- Meteors telegraph with flashing ghost projections and a warning chime; vacate their path or they’ll vaporize the ship (and any bombs) while blasting new craters into the surface.

## Systems
- **Terrain**
  - `generateTerrain()` builds a solid grid of voxels, flattening a pad segment for stock levels while the editor can add or carve cells away.
  - Helpers such as `groundYAt(x)`/`findSurfaceBelow(x, y)` turn the grid into collision surfaces.
  - Regenerated only when `shouldRegen` is set by a successful landing.
- **Camera & Parallax**
  - Smoothed follow with velocity‑based look‑ahead. Parallax layers scroll by `camX/camY`.
- **Particles**
  - **Dust**: `spawnSmoke`/`updateSmoke`/`drawSmoke` emit from the **terrain** at the **exhaust ray impact** (`findThrusterImpact()`). Proximity controls emission density, size, and opacity.
  - **Debris**: `spawnExplosion` + `updateDebris` + `drawDebris` on crash.
  - **Confetti**: `spawnWinFx` + `updateWinFx` + `drawWinFx` on success.
- **Black holes**
  - Stored on `terrain.blackHoles` (editor) and cloned into `activeBlackHoles` for play. The editor placements are serialized alongside terrain voxels.
  - `computeBlackHoleAcceleration()` applies falloff-capped gravity to the lander, bombs, debris, dust, and blast smoke. `findBlackHoleCapture()` detects event-horizon entry for ships and particles.
  - `consumeLanderIntoBlackHole()` creates the singularity death sequence without deforming terrain, and `absorbBombIntoBlackHole()` swallows bombs without triggering `explodeBomb()`.
- **Meteors**
  - Level data supplies timed meteor entries (`startMs`, `warningLeadMs`, `radius`, `speed`, `spawn`, `target`). `resetMeteorState()` normalizes and schedules them while tests/plays clone editor definitions into `terrain.meteors`.
  - `updateMeteors()` handles warning ghosts (`spawnMeteorWarning()`), active projectile physics/trails, and impact resolution (`resolveMeteorImpact()`), chaining into `applyExplosionEffects()` so bombs and the lander react to meteor blasts.
  - Rendering splits between flashing path previews (`drawMeteorWarnings()`) and fiery streaks (`drawMeteors()`), reusing `blastSmoke` for dust plumes and `debris` for sparks.
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
