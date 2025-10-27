import { clampLanderToWorld, computeCameraX } from '../src/gameLoop.js';

export async function runCameraTests(assert) {
  const canvas = { width: 600, height: 400 };
  const terrain = { width: 2000, height: 800 };

  const travelingLander = { x: 1500, y: 120 };
  clampLanderToWorld(travelingLander, canvas, terrain);
  assert.equal(travelingLander.x, 1500, 'allows traveling past the viewport width');

  const edgeLander = { x: 2500, y: 120 };
  clampLanderToWorld(edgeLander, canvas, terrain);
  assert.equal(edgeLander.x, terrain.width, 'clamps lander to world width');

  const abyssLander = { x: 120, y: terrain.height + 200 };
  let abyssMessage = '';
  clampLanderToWorld(abyssLander, canvas, terrain, message => {
    abyssMessage = message;
  });
  assert.equal(abyssMessage, 'You drifted into the abyss.', 'reports abyss crash when falling below the world');

  const worldWidth = Math.max(canvas.width, terrain.width);
  const cameraX = computeCameraX(1500, canvas.width, worldWidth);
  assert.equal(cameraX, 1200, 'centers the camera on the lander when the world is wider than the viewport');

  const smallWorldCamera = computeCameraX(120, 800, 500);
  assert.equal(smallWorldCamera, 0, 'does not scroll when the world fits inside the viewport');
}
