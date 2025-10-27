import { PHYSICS_CONSTANTS } from './constants.js';

export function getLanderContactPoints(lander) {
  const cos = Math.cos(lander.angle);
  const sin = Math.sin(lander.angle);
  const localPoints = [
    { type: 'body', lx: 0, ly: lander.height / 2 },
    { type: 'body', lx: -lander.legAttachOffset, ly: lander.height / 2 },
    { type: 'body', lx: lander.legAttachOffset, ly: lander.height / 2 },
    { type: 'foot', lx: -lander.legFootOffset, ly: lander.height / 2 + lander.legLength },
    { type: 'foot', lx: lander.legFootOffset, ly: lander.height / 2 + lander.legLength },
  ];
  return localPoints.map(pt => {
    const x = lander.x + pt.lx * cos - pt.ly * sin;
    const y = lander.y + pt.lx * sin + pt.ly * cos;
    return { ...pt, x, y };
  });
}

export function applyThrust(lander, dt, thrust, angleOverride = null) {
  if (lander.fuel <= 0 || thrust <= 0) return;
  const angle = angleOverride != null ? angleOverride : lander.angle - Math.PI / 2;
  const accel = lander.thrustPower * thrust;
  lander.vx += Math.cos(angle) * accel * dt;
  lander.vy += Math.sin(angle) * accel * dt;
  lander.fuel = Math.max(0, lander.fuel - thrust * dt * 0.04);
}

export function integrateLander(lander, dt) {
  lander.vy += PHYSICS_CONSTANTS.GRAVITY * dt;
  lander.x += lander.vx * dt;
  lander.y += lander.vy * dt;
  lander.angle += lander.angularVelocity * dt;
  lander.angularVelocity *= lander.rotateDamping;
}

export function rotateLander(lander, direction, dt) {
  const accel = lander.rotateAccel * dt * direction;
  lander.angularVelocity += accel;
}

export function resetLanderOrientation(lander) {
  lander.angle = 0;
  lander.angularVelocity = 0;
}
