import { strict as assert } from 'node:assert';
import { runTerrainTests } from './terrain.test.js';
import { runLanderTests } from './lander.test.js';
import { runInputTests } from './input.test.js';
import { runCameraTests } from './camera.test.js';

const suites = [
  { name: 'Terrain helpers', fn: runTerrainTests },
  { name: 'Lander physics', fn: runLanderTests },
  { name: 'Input manager', fn: runInputTests },
  { name: 'Camera and world bounds', fn: runCameraTests },
];

let passed = 0;

for (const suite of suites) {
  try {
    await suite.fn(assert);
    console.log(`✅ ${suite.name}`);
    passed += 1;
  } catch (err) {
    console.error(`❌ ${suite.name}`);
    console.error(err.stack || err.message || err);
    process.exitCode = 1;
  }
}

if (passed === suites.length) {
  console.log(`\nAll ${passed} test suites passed.`);
} else {
  console.log(`\n${passed}/${suites.length} test suites passed.`);
}
