import { createLander } from '../src/state.js';
import { getLanderContactPoints, applyThrust, integrateLander, rotateLander } from '../src/lander.js';
import { PHYSICS_CONSTANTS } from '../src/constants.js';

export async function runLanderTests(assert) {
  const lander = createLander();
  lander.x = 100;
  lander.y = 100;
  const points = getLanderContactPoints(lander);
  assert.equal(points.length, 5, 'lander contact points include body and feet');
  const leftFoot = points.find(p => p.type === 'foot' && p.lx < 0);
  const rightFoot = points.find(p => p.type === 'foot' && p.lx > 0);
  assert.ok(Math.abs(leftFoot.y - rightFoot.y) < 1e-6, 'feet share same baseline when upright');

  const initialVy = lander.vy;
  applyThrust(lander, 16, 1);
  integrateLander(lander, 16);
  assert.ok(lander.vy < initialVy + PHYSICS_CONSTANTS.GRAVITY * 16, 'thrust counters gravity');

  const preAngle = lander.angle;
  rotateLander(lander, 1, 16);
  integrateLander(lander, 16);
  assert.ok(lander.angle !== preAngle, 'rotation changes lander angle');
}
