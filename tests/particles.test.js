import { createTerrain, createRuntimeState } from '../src/state.js';
import {
  spawnDust,
  spawnExplosion,
  spawnConfetti,
  updateParticles,
} from '../src/effects/particles.js';

export async function runParticleTests(assert) {
  const terrain = createTerrain();
  terrain.width = 600;
  terrain.height = 400;
  terrain.cols = Math.floor(terrain.width / terrain.cellSize);
  terrain.rows = Math.floor(terrain.height / terrain.cellSize);
  terrain.solids = new Uint8Array(terrain.cols * terrain.rows);

  const runtime = createRuntimeState();

  spawnDust(runtime, terrain, { x: 200, y: 320, intensity: 4, proximity: 0.6 });
  assert.ok(runtime.smoke.length > 0, 'spawnDust creates particles');

  spawnExplosion(runtime, { x: 240, y: 240, vx: 0, vy: 0 });
  assert.ok(runtime.debris.length > 0, 'spawnExplosion generates debris shards');

  spawnConfetti(runtime, { x: 260, y: 200 });
  assert.ok(runtime.winFx.length > 0, 'spawnConfetti creates celebration particles');

  const initialSmoke = runtime.smoke.length;
  updateParticles(runtime, 16, 0.00015, terrain, () => null);
  assert.ok(runtime.smoke.length <= initialSmoke, 'updateParticles advances and prunes dust');
}
