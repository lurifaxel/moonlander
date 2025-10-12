# Moonlander Game Specification

## Overview
- Moonlander is a single-page HTML5 canvas game where the player pilots a lunar module with arcade-style physics across procedurally generated moon terrain, using fuel-limited thrust, rotation, and situational awareness to land safely while enjoying dust, debris, and celebratory effects.【F:README.md†L1-L16】
- The experience runs directly in modern browsers without a build step, automatically scaling the playfield to ~90% of the viewport while respecting 600×400–1280×720 bounds so presentation stays centered and responsive.【F:README.md†L18-L20】【F:index.html†L196-L214】

## Application Modes and Flow
- `APP_MODE` tracks four states: menu, play, editor, and test. The game starts in the menu with Play and Create Level buttons overlaying the canvas.【F:index.html†L170-L195】
- `enterPlay()` hides the menu, regenerates the first built-in level, and calls `resetGame(true)` to seed ship position, pad glow, meteor timelines, and black hole copies for gameplay.【F:index.html†L1800-L1807】【F:index.html†L2360-L2416】
- `enterEditor()` prepares a custom terrain sandbox, cloning editor placements (spawn, pad, black holes, meteors), parking the lander off-screen, and exposing the editor overlay and meteor control panel.【F:index.html†L1809-L1829】【F:index.html†L1098-L1175】
- `enterEditorTest()` snapshots the edited grid, black holes, meteors, and pad, switches to `TEST` mode with gameplay physics on the custom terrain, and restores baseline data when returning to editing via `returnToEditorFromTest()`.【F:index.html†L1831-L1887】
- `enterMenu()` or Esc in gameplay resets input flags, halts the thruster loop, and re-displays the start menu overlay.【F:index.html†L1787-L1797】【F:index.html†L1903-L1937】

## Controls
- Gameplay keys: Arrow Up applies thrust while fuel remains, Arrow Left/Right accumulate angular velocity, Space drops bombs (respecting cooldown/arming), R restarts the round, and Esc returns to the menu or editor depending on mode.【F:index.html†L4108-L4138】【F:index.html†L1930-L1947】
- Editor shortcuts: mouse wheel or number keys 1–4 swap placement tools (spawn, landing, black hole, meteor); Alt modifies strokes to carve or delete hazards; meteor hotkeys adjust radius `[ / ]`, speed `-/=`, warning lead `,/.`, and arrival `;/'` for either the selected meteor or defaults.【F:index.html†L1736-L1761】【F:index.html†L1950-L2012】
- Debug/tuning overlay toggles with H and exposes real-time adjustments for camera, thrust, gravity, and debris behavior via Q/A through , keys, updating shared tuning constants live.【F:index.html†L2003-L2045】【F:index.html†L4028-L4078】

## Level Structure and Terrain
- Three built-in levels (“Crater Run”, “Basalt Dunes”, “Ridge Maze”) define world width, sinusoidal terrain bands, landing-pad offsets, and optional meteor schedules; the editor starts from a flat baseline sized to at least 1200px wide.【F:index.html†L202-L255】【F:index.html†L628-L669】
- Terrain uses an 8px voxel grid stored in `terrain.solids`. `generateTerrain()` synthesizes layered sine noise, clamps to band limits, carves a flat pad section, fills cells beneath the surface, and aligns the pad to the sampled surface.【F:index.html†L260-L481】
- `deformTerrainAt()` clears solids within a blast radius, marks the render buffer dirty, and realigns the pad so bomb and meteor craters immediately reshape collision geometry.【F:index.html†L3576-L3597】
- Helpers such as `groundYAt`, `findSurfaceBelow`, and `resolvePenetrationAt` cast rays through the grid to support landing checks, pad alignment, and particle-ground interactions.【F:index.html†L520-L613】

## Core Lander Simulation
- The lander tracks position, velocity, orientation, angular velocity, and fuel; main thrust applies acceleration based on the current angle while draining fuel, then gravity and black-hole acceleration update velocity each frame.【F:index.html†L1285-L1319】【F:index.html†L4108-L4122】
- Rotation uses gradual acceleration/damping, letting the ship carry momentum until counter-thrusted or damped by `lander.rotateDamping`. Horizontal bounds apply elastic reversal to keep the craft inside the generated world.【F:index.html†L4103-L4138】
- Engine dust spawns when a thrust ray hits terrain within 70px, scaling particle count, lift, and color by proximity; dust inherits gravity, slight drag, and optional black-hole pull before bouncing softly on contact.【F:index.html†L4144-L4170】【F:index.html†L3656-L3773】
- Collision resolution samples feet and body points, pushes the lander out of solids, cancels inward velocity, and uses landing thresholds (pad coverage, upright tolerance ~15°, velocity caps) to determine success versus crash.【F:index.html†L4173-L4263】

## Progression, Win, and Failure States
- `spawnExplosion()` handles crashes: it plays explosion/death audio, carves a crater, emits debris, smoke, and wreck flames, triggers explosion chain reactions, and sets restart messaging (“You Crashed!” or editor-specific failure).【F:index.html†L2419-L2552】
- Successful landings zero velocities, advance `nextLevelIndex`, queue celebratory confetti, flash the pad for 1.2s, and play the win chime while marking `shouldRegen` so the next Play round loads the following terrain.【F:index.html†L4233-L4258】
- `resetGame()` reinitializes fuel, states, particle arrays, bombs, meteor queues, and black-hole clones; it only regenerates stock terrain after a success or when forced (e.g., manual reset).【F:index.html†L2360-L2416】

## Bomb System
- Bomb constants define a 3s fuse, 220ms arming delay, blinking parameters, 68px crater radius, 36px depth, 6 active bomb cap, 220ms drop cooldown, and an 86px chain radius plus 74px lander kill radius.【F:index.html†L273-L286】
- `canDropBomb()` blocks drops when the game is over, landed, in cooldown, or at the active limit; `dropBomb()` inherits lander motion, offsets the spawn below the hull, and seeds blink state and fuse timers.【F:index.html†L1393-L1425】
- `updateBombs()` advances blink speed, applies gravity/drag, toggles grounded state, applies black hole pull, absorbs bombs that cross an event horizon, and detonates expired bombs (filtering detonated entries).【F:index.html†L3051-L3109】
- `explodeBomb()` triggers explosion audio, spawns shards/embers/smoke, deforms terrain, and calls `applyExplosionEffects()` which chains nearby bombs (respecting arming timers) and checks the lander kill radius.【F:index.html†L3482-L3574】

## Meteor System
- Level and editor meteors are normalized via `normalizeMeteorDef()` and scheduled by `prepareMeteorTimeline()` with warning start times capped to arrive before impact.【F:index.html†L3156-L3195】
- `spawnMeteorWarning()` generates flashing ghost paths, plays a warning tone once per meteor, and `spawnMeteor()` instantiates a projectile with direction, speed, radius, and trail timer while clearing the warning entry.【F:index.html†L3197-L3237】
- `updateMeteors()` progresses timeline events, animates warning flashes, integrates meteor kinematics with gravity scaling, emits fiery trails, destroys the lander or armed bombs on contact, resolves ground impacts by carving scaled craters, and prunes out-of-bounds projectiles.【F:index.html†L3327-L3413】
- `resolveMeteorImpact()` deforms terrain proportionally to meteor size, spawns dense dust plumes and sparks, plays the dedicated impact audio, and invokes `applyExplosionEffects()` so chain reactions and lander damage apply consistently.【F:index.html†L3270-L3325】

## Black Hole System
- Constants define a 42px event horizon, 220px pull radius, falloff-based acceleration capped at 0.0025, and minimum spacing to keep placements stable.【F:index.html†L305-L311】
- In gameplay, `activeBlackHoles` clones editor/level data; `computeBlackHoleAcceleration()` returns aggregated pull vectors within the pull radius, used for the lander, bombs, debris, dust, and blast smoke, while `findBlackHoleCapture()` checks event-horizon entry.【F:index.html†L305-L331】【F:index.html†L3607-L3644】
- `consumeLanderIntoBlackHole()` handles singularity deaths by stopping thrust audio, marking game over, resetting particle arrays, and spawning inward-spiraling debris and void wisps without deforming terrain.【F:index.html†L2554-L2640】
- `absorbBombIntoBlackHole()` flags bombs as detonated without explosions, replacing them with inward sparks, and `updateDebris()`/`updateSmoke()` terminate particles captured by the hole.【F:index.html†L2647-L2681】【F:index.html†L2683-L2755】【F:index.html†L3730-L3745】
- `drawBlackHoles()` renders pixel-aligned cores with animated rims and dashed editor guides visualize event and pull radii, reinforcing placement rules.【F:index.html†L3843-L3893】

## Particles, Visuals, and Camera
- Parallax backgrounds tile two starfield layers offset by camera position; the camera eases toward the lander with velocity-based look-ahead capped by `tune.lookCap` while clamping to terrain bounds and vertical limits.【F:index.html†L1260-L1280】【F:index.html†L4277-L4321】
- Rendering order draws terrain, active hazards, particles (smoke, blast smoke, wreck flames), lander, debris, and win confetti within the world transform before HUD/overlay elements.【F:index.html†L4325-L4347】
- Particle systems cover engine dust (`spawnSmoke`/`updateSmoke`/`drawSmoke`), explosion debris and embers (`updateDebris`/`drawDebris`), lingering wreck flames, blast smoke, meteor trails, and win confetti with bespoke physics, lifetimes, and color ramps.【F:index.html†L3656-L3775】【F:index.html†L2683-L2760】【F:index.html†L3000-L3048】

## Audio Cues
- A lazily initialized Web Audio pipeline gates playback until user input, maintaining master gain and cached oscillators/noise sources.【F:index.html†L1427-L1495】
- `audio.setThrusterActive()` ramps oscillator and noise gains with randomized timbre to simulate engine hum; `stopThrusterImmediate()` cuts it on reset or failure.【F:index.html†L1512-L1564】
- Discrete cues include explosion booms, a descending death tone, triad win chime, meteor warning chirp, and meteor impact rumble, each synthesized via oscillators/noise bursts and triggered from gameplay events.【F:index.html†L1565-L1712】【F:index.html†L2419-L2431】【F:index.html†L2554-L2566】【F:index.html†L3211-L3212】【F:index.html†L3320-L3323】

## HUD and Messaging
- `drawHUD()` shows level name, fuel, velocity, and angle during gameplay, or editor mode labels; game-over messages differ for crashes, landings, and test runs, and `info` visibility toggles alongside the debug overlay.【F:index.html†L4002-L4025】【F:index.html†L4015-L4020】
- The optional debug overlay prints tuning metrics, lander state, bomb timers, and black hole counts, hiding the DOM HUD while active for unobstructed diagnostics.【F:index.html†L4028-L4078】

## Level Editor Capabilities
- Editor state tracks grid snapshots, brush radius, spawn, pad, black holes, meteors, and camera focus; init routines ensure clones are kept in sync when entering/exiting editor/test modes.【F:index.html†L322-L347】【F:index.html†L628-L693】【F:index.html†L1831-L1887】
- Terrain sculpting uses circular brushes with add/carve modes, aligning spawn height between nearby ceiling and floor and snapping pads to surfaces; drags/alt-clicks reposition spawn, landing zone, black holes, or meteor handles with collision-aware constraints.【F:index.html†L1064-L1111】【F:index.html†L694-L744】【F:index.html†L2081-L2147】
- Meteor UI lists placed meteors, exposes per-meteor number inputs for timing/speed/size, and maintains defaults for new placements; change handlers clamp values to legal ranges and propagate updates to pending or selected meteors.【F:index.html†L1109-L1247】
- `drawEditorGuides()` outlines spawn, landing pad, black hole radii, meteor paths/handles, and the active cursor label so designers see placement feedback directly on the canvas.【F:index.html†L3893-L4000】

## Hazard Interactions and Chain Reactions
- `applyExplosionEffects()` centralizes blast aftermath, detonating nearby armed bombs within 86px and invoking `checkLanderExplosion()` to destroy the lander inside the 74px kill radius; the same routine is called from crashes, bomb blasts, and meteor impacts.【F:index.html†L3482-L3497】【F:index.html†L3147-L3153】
- Meteor-landed or crash explosions can ignite bombs, while black holes remove bombs/dust without triggering `applyExplosionEffects`, ensuring singularities remain indestructible.【F:index.html†L3084-L3090】【F:index.html†L2647-L2681】

## Testing and Restart Behavior
- Gameplay resets on R: in play mode it rebuilds (potentially new terrain post-success), in editor/test it relaunches the custom level. Esc leaves test back to the editor or returns to the menu from play, cancelling pending editor strokes or meteor placements.【F:index.html†L1939-L1959】【F:index.html†L2144-L2153】
