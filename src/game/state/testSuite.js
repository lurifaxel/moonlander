function heightAt(points, x) {
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if ((x >= a.x && x <= b.x) || (x >= b.x && x <= a.x)) {
      const t = (x - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * t;
    }
  }
  return points[points.length - 1]?.y ?? 720;
}

function createResult(name, passed, detail = '') {
  return { name, passed, detail };
}

export function runRegressionSuite(level) {
  const results = [];
  results.push(testTerrainSlope(level.terrain));
  results.push(testLandingPad(level));
  results.push(testHazardDefinition(level));
  results.push(testFuelLevel(level));
  const passed = results.filter((r) => r.passed).length;
  return {
    passed,
    total: results.length,
    results
  };
}

function testTerrainSlope(points) {
  let lastHeight = heightAt(points, points[0].x);
  for (let x = 1; x < 950; x += 15) {
    const height = heightAt(points, x);
    if (!Number.isFinite(height)) {
      return createResult('Terrain height is finite', false, `height invalid at x=${x}`);
    }
    if (Math.abs(height - lastHeight) > 220) {
      return createResult('Terrain transitions smoothly', false, `cliff too steep near x=${x}`);
    }
    lastHeight = height;
  }
  return createResult('Terrain transitions smoothly', true);
}

function testLandingPad(level) {
  if (level.pad.width < 40) {
    return createResult('Landing pad width', false, 'Pad width too small');
  }
  if (level.pad.y >= level.terrain[0].y) {
    return createResult('Landing pad altitude', false, 'Pad is below baseline terrain');
  }
  return createResult('Landing pad configuration', true);
}

function testHazardDefinition(level) {
  const invalid = level.hazards?.find((hazard) => hazard.radius <= 0);
  if (invalid) {
    return createResult('Hazard radii positive', false, `Hazard ${invalid.type} radius <= 0`);
  }
  return createResult('Hazard radii positive', true);
}

function testFuelLevel(level) {
  if (level.fuel <= 0) {
    return createResult('Fuel reserve positive', false, 'Fuel must be greater than zero');
  }
  if (level.fuel > 999) {
    return createResult('Fuel reserve reasonable', false, 'Fuel exceeds 999 units');
  }
  return createResult('Fuel reserve reasonable', true);
}
