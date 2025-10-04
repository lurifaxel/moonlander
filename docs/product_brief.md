# Product Brief — Moonlander

## 1. Project Overview / Description
Moonlander is a lightweight 2D lunar landing simulation with cartoon physics. The player controls a small spacecraft with limited fuel, attempting to land safely on procedurally generated terrain. The game balances accessible arcade controls with realistic momentum, particle effects, and a smooth camera system for an immersive yet playful feel.

## 2. Target Audience
- Indie and casual gamers who enjoy classic arcade-style challenges.
- Developers or students exploring simple physics simulation and game design.
- Fans of retro-style pixel art and open-source JavaScript games.

## 3. Primary Benefits / Features
- **Cartoon Physics:** Rotational momentum, thrust-based movement, and gravity-driven descent.
- **Procedural Terrain:** Random peaks, valleys, and landing pads for unique levels each playthrough.
- **Dynamic Dust & Particles:** Exhaust interacts with terrain, generating proximity-based dust and explosion debris.
- **Camera & Parallax:** Smooth delayed camera tracking and layered background parallax for visual depth.
- **Landing Logic:** Reward system for successful, gentle landings with confetti celebration; crashes trigger debris explosions.
- **Performance Simplicity:** Single-file HTML/JS implementation, no dependencies or build tools.

## 4. High-Level Tech / Architecture
- **Language:** Vanilla JavaScript (ES6) in a single HTML file.
- **Rendering:** HTML5 Canvas API for drawing and animation.
- **Game Loop:** `requestAnimationFrame` with delta-time integration.
- **Physics:** Basic vector math and damping for thrust, rotation, and gravity.
- **Procedural Generation:** Simple midpoint terrain algorithm and interpolation for smooth surfaces.
- **Particles:** Independent arrays for dust, debris, and confetti, each with update/draw cycles.
- **Camera:** Interpolated follow with optional lag and lookahead for natural motion.
