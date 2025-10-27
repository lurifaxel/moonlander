import { createTerrain, createRuntimeState, createPad } from '../src/state.js';
import {
  computeBlackHoleAcceleration,
  findBlackHoleCapture,
  holeEventRadius,
} from '../src/hazards/blackHoles.js';
import {
  resetMeteorState,
  updateMeteors,
} from '../src/hazards/meteors.js';

export async function runHazardTests(assert) {
  const holes = [{ x: 200, y: 160, eventRadius: 40, pullRadius: 220 }];
  const accel = computeBlackHoleAcceleration(holes, 260, 160);
  assert.ok(accel && accel.ax < 0, 'computeBlackHoleAcceleration pulls objects toward the hole');
  const capture = findBlackHoleCapture(holes, holes[0].x + holeEventRadius(holes[0]) * 0.4, holes[0].y);
  assert.ok(capture, 'findBlackHoleCapture returns a hole when inside the event radius');

  const terrain = createTerrain();
  terrain.width = 800;
  terrain.height = 400;
  terrain.cols = Math.floor(terrain.width / terrain.cellSize);
  terrain.rows = Math.floor(terrain.height / terrain.cellSize);
  terrain.solids = new Uint8Array(terrain.cols * terrain.rows);
  for (let row = Math.floor(terrain.rows * 0.6); row < terrain.rows; row++) {
    for (let col = 0; col < terrain.cols; col++) {
      terrain.solids[row * terrain.cols + col] = 1;
    }
  }

  const pad = createPad();
  pad.x = 360;
  pad.y = 200;

  terrain.meteors = [
    {
      id: 'test-meteor',
      startMs: 12,
      warningLeadMs: 6,
      radius: 24,
      speed: 2.5,
      spawn: { x: 300, y: -120 },
      target: { x: 320, y: 360 },
    },
  ];

  const runtime = createRuntimeState();
  resetMeteorState(runtime, terrain);
  const impacts = [];
  updateMeteors(runtime, 8, terrain, pad, { onImpact: evt => impacts.push(evt) });
  updateMeteors(runtime, 40, terrain, pad, { onImpact: evt => impacts.push(evt) });
  updateMeteors(runtime, 400, terrain, pad, { onImpact: evt => impacts.push(evt) });
  assert.ok(impacts.length > 0, 'updateMeteors calls onImpact when a meteor lands');
}
