import { createTerrain, createPad, createEditorState } from '../src/state.js';
import { LEVELS } from '../src/game/levels.js';
import {
  generateTerrain,
  resolvePenetrationAt,
  groundYAt,
  setSolidCell,
} from '../src/terrain.js';

export async function runTerrainTests(assert) {
  const terrain = createTerrain();
  const pad = createPad();
  const editor = createEditorState();
  const level = LEVELS[0];
  const canvasHeight = 480;
  const random = () => 0.5;

  const { heights } = generateTerrain({
    terrain,
    pad,
    level,
    canvasHeight,
    editorState: editor,
    random,
  });

  assert.equal(heights.length, terrain.cols, 'heights array matches terrain columns');
  assert.ok(terrain.cols > 0, 'terrain has columns');
  assert.ok(terrain.rows > 0, 'terrain has rows');
  const padGround = groundYAt(terrain, pad.x + pad.w / 2);
  assert.ok(Math.abs(padGround - (pad.y + pad.h)) <= terrain.cellSize, 'pad sits on the ground surface');

  const testX = pad.x + pad.w / 2;
  const testY = padGround + terrain.cellSize * 0.25;
  const penetration = resolvePenetrationAt(terrain, testX, testY);
  assert.ok(penetration.depth > 0, 'points inside terrain report penetration');

  // ensure setSolidCell clears cells
  const col = Math.floor(testX / terrain.cellSize);
  const row = Math.floor((padGround + terrain.cellSize) / terrain.cellSize);
  setSolidCell(terrain, col, row, 0);
  const cleared = resolvePenetrationAt(terrain, col * terrain.cellSize + 1, row * terrain.cellSize + 1);
  assert.equal(cleared.depth, 0, 'setSolidCell removes solid occupancy');
}
