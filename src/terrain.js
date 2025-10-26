import { METEOR_CONSTANTS, BLACK_HOLE_CONSTANTS, PAD } from './constants.js';
import { cloneTerrainSolids } from './state.js';

export function initTerrainGrid(terrain, worldWidthPx, canvasHeight) {
  const cellSize = terrain.cellSize;
  const cols = Math.max(1, Math.ceil(worldWidthPx / cellSize));
  const rows = Math.max(1, Math.ceil(canvasHeight / cellSize));
  terrain.cols = cols;
  terrain.rows = rows;
  terrain.width = cols * cellSize;
  terrain.height = rows * cellSize;
  terrain.solids = new Uint8Array(cols * rows);
  terrain.dirtyRender = true;
  if (!Array.isArray(terrain.blackHoles)) {
    terrain.blackHoles = [];
  }
  if (!Array.isArray(terrain.meteors)) {
    terrain.meteors = [];
  }
}

export function fillColumnSolid(terrain, col, fromRow) {
  if (col < 0 || col >= terrain.cols) return;
  for (let row = fromRow; row < terrain.rows; row++) {
    terrain.solids[row * terrain.cols + col] = 1;
  }
}

export function cloneBlackHoles(source) {
  if (!Array.isArray(source) || source.length === 0) return [];
  return source.map(hole => ({
    x: hole.x,
    y: hole.y,
    eventRadius: hole.eventRadius ?? BLACK_HOLE_CONSTANTS.EVENT_RADIUS,
    pullRadius: hole.pullRadius ?? BLACK_HOLE_CONSTANTS.PULL_RADIUS,
  }));
}

export function cloneMeteors(source) {
  if (!Array.isArray(source) || source.length === 0) return [];
  return source.map(m => ({
    id: m.id ?? null,
    startMs: Math.max(0, m.startMs ?? 0),
    warningLeadMs: Math.max(0, m.warningLeadMs ?? 0),
    speed: clamp(m.speed ?? 0.32, METEOR_CONSTANTS.MIN_SPEED, METEOR_CONSTANTS.MAX_SPEED),
    radius: clamp(m.radius ?? 20, METEOR_CONSTANTS.MIN_RADIUS, METEOR_CONSTANTS.MAX_RADIUS),
    spawn: { x: m.spawn?.x ?? 0, y: m.spawn?.y ?? 0 },
    target: {
      x: m.target?.x ?? 0,
      y: m.target?.y ?? 0,
      yRatio: m.target?.yRatio ?? null,
    },
  }));
}

export function generateTerrain({
  terrain,
  pad,
  level,
  canvasHeight,
  editorState,
  random = Math.random,
}) {
  if (!terrain || !level) {
    throw new Error('generateTerrain requires a terrain object and level');
  }
  terrain.levelName = level.name;
  initTerrainGrid(terrain, level.worldWidth, canvasHeight);
  terrain.blackHoles = [];
  terrain.meteors = cloneMeteors(level.meteors || []);

  const step = terrain.cellSize;
  const cols = terrain.cols;
  const heights = new Array(cols).fill(canvasHeight);

  const baseMin = canvasHeight * level.baseBand[0];
  const baseMax = canvasHeight * level.baseBand[1];
  const baseMid = (baseMin + baseMax) * 0.5;
  const amp = canvasHeight * level.amp;

  let y = baseMid;
  for (let i = 0; i < cols; i++) {
    const t = i * step;
    const primaryWave = Math.sin(t * level.waveFreq) * amp * level.waveScale;
    const secondaryWave = Math.sin((t + 500) * level.roughWaveFreq) * amp * 0.35;
    const target = baseMid + primaryWave + secondaryWave;
    const noise = (random() - 0.5) * amp * level.noiseScale;
    y = y * 0.55 + (target + noise) * 0.45;
    y = clamp(y, baseMin, baseMax);
    heights[i] = y | 0;
  }

  const padCols = Math.max(4, Math.round(PAD.WIDTH / step));
  const padStartPx = Math.floor(level.worldWidth * level.padOffset - PAD.WIDTH / 2);
  const padStartIdx = clamp(Math.floor(padStartPx / step), 0, cols - padCols - 1);
  let padY = heights[padStartIdx];
  for (let i = 1; i < padCols; i++) padY = Math.min(padY, heights[padStartIdx + i]);
  for (let i = 0; i < padCols; i++) heights[padStartIdx + i] = padY;

  for (let col = 0; col < cols; col++) {
    const fillStart = Math.floor(heights[col] / step);
    fillColumnSolid(terrain, col, fillStart);
  }

  pad.w = PAD.WIDTH;
  pad.x = padStartIdx * step;
  pad.y = padY - pad.h;
  alignPadToSurface(terrain, pad, pad.x + pad.w / 2, pad.y);

  if (terrain.meteors.length > 0) {
    terrain.meteors.forEach(meteor => {
      if (meteor.target && meteor.target.yRatio != null) {
        meteor.target.y = canvasHeight * meteor.target.yRatio;
      }
    });
  }

  if (editorState) {
    editorState.blackHoles = terrain.blackHoles;
    editorState.meteors = terrain.meteors;
    if (editorState.grid) {
      editorState.grid.solids = terrain.solids;
      editorState.grid.blackHoles = terrain.blackHoles;
      editorState.grid.meteors = terrain.meteors;
    }
  }

  terrain.dirtyRender = true;
  return { heights };
}

export function cellIndex(terrain, col, row) {
  return row * terrain.cols + col;
}

export function isSolidCell(terrain, col, row) {
  if (col < 0 || col >= terrain.cols) return false;
  if (row < 0 || row >= terrain.rows) return true;
  return terrain.solids[cellIndex(terrain, col, row)] === 1;
}

export function setSolidCell(terrain, col, row, value) {
  if (col < 0 || col >= terrain.cols) return;
  if (row < 0 || row >= terrain.rows) return;
  terrain.solids[cellIndex(terrain, col, row)] = value ? 1 : 0;
  terrain.dirtyRender = true;
}

export function isSolidWorld(terrain, x, y) {
  const clampedX = clamp(x, 0, terrain.width - 1);
  const clampedY = clamp(y, 0, terrain.height - 1);
  const col = Math.floor(clampedX / terrain.cellSize);
  const row = Math.floor(clampedY / terrain.cellSize);
  return isSolidCell(terrain, col, row);
}

export function findSurfaceAlongRay(terrain, x, y, dirX, dirY, maxDistance = 1600) {
  const step = terrain.cellSize * 0.5;
  const steps = Math.ceil(maxDistance / step);
  let px = x;
  let py = y;
  for (let i = 0; i < steps; i++) {
    px += dirX * step;
    py += dirY * step;
    if (px < 0 || px >= terrain.width || py < 0 || py >= terrain.height) break;
    if (isSolidWorld(terrain, px, py)) {
      return { x: px, y: py };
    }
  }
  return null;
}

export function findSurfaceBelow(terrain, x, startY) {
  const hit = findSurfaceAlongRay(terrain, x, startY, 0, 1, terrain.height - startY + 16);
  if (!hit) return null;
  const row = Math.floor(hit.y / terrain.cellSize);
  return { x, y: row * terrain.cellSize };
}

export function findSurfaceAbove(terrain, x, startY) {
  const hit = findSurfaceAlongRay(terrain, x, startY, 0, -1, startY + 16);
  if (!hit) return null;
  const row = Math.floor(hit.y / terrain.cellSize);
  return { x, y: (row + 1) * terrain.cellSize };
}

export function alignPadToSurface(terrain, pad, centerX, hintY) {
  const searchStart = clamp(hintY ?? 0, 0, terrain.height - 1);
  const surface = findSurfaceBelow(terrain, centerX, searchStart);
  if (!surface) return;
  pad.y = clamp(surface.y - pad.h, 0, terrain.height - pad.h);
}

export function groundYAt(terrain, x, hintY = 0) {
  const surface = findSurfaceBelow(terrain, x, hintY);
  return surface ? surface.y : terrain.height;
}

export function resolvePenetrationAt(terrain, x, y) {
  const outsideSurface = findSurfaceBelow(terrain, x, y + terrain.cellSize * 0.6);
  if (!isSolidWorld(terrain, x, y)) {
    return {
      depth: 0,
      normal: { x: 0, y: -1 },
      surfaceY: outsideSurface ? outsideSurface.y : null,
    };
  }
  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 },
  ];
  const step = Math.max(terrain.cellSize * 0.3, 2);
  const maxSteps = 80;
  let best = null;
  for (const dir of directions) {
    let px = x;
    let py = y;
    let dist = 0;
    for (let i = 0; i < maxSteps; i++) {
      px += dir.x * step;
      py += dir.y * step;
      dist += step;
      if (px < 0 || px >= terrain.width || py < 0 || py >= terrain.height) {
        break;
      }
      if (!isSolidWorld(terrain, px, py)) {
        if (!best || dist < best.dist) {
          best = {
            dist,
            dir,
            exitX: px - dir.x * step * 0.5,
            exitY: py - dir.y * step * 0.5,
          };
        }
        break;
      }
    }
  }
  if (!best) {
    return {
      depth: 0,
      normal: { x: 0, y: -1 },
      surfaceY: outsideSurface ? outsideSurface.y : null,
    };
  }
  const normalLength = Math.hypot(best.dir.x, best.dir.y) || 1;
  return {
    depth: best.dist,
    normal: { x: -best.dir.x / normalLength, y: -best.dir.y / normalLength },
    exitPoint: { x: best.exitX, y: best.exitY },
    surfaceY: outsideSurface ? outsideSurface.y : null,
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return clamp(value, 0, 1);
}

export function deformTerrainAt(terrain, pad, x, y, radius, depth) {
  if (!terrain || radius <= 0) return;
  const cellSize = terrain.cellSize;
  const radiusSq = radius * radius;
  const minCol = Math.max(0, Math.floor((x - radius) / cellSize));
  const maxCol = Math.min(terrain.cols - 1, Math.ceil((x + radius) / cellSize));
  const minRow = Math.max(0, Math.floor((y - depth - radius) / cellSize));
  const maxRow = Math.min(terrain.rows - 1, Math.ceil((y + radius) / cellSize));
  let removed = false;
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cx = (col + 0.5) * cellSize;
      const cy = (row + 0.5) * cellSize;
      const dx = cx - x;
      const dy = cy - y;
      if (dx * dx + dy * dy <= radiusSq) {
        const index = cellIndex(terrain, col, row);
        if (terrain.solids[index] !== 0) {
          terrain.solids[index] = 0;
          removed = true;
        }
      }
    }
  }
  if (removed) {
    terrain.dirtyRender = true;
    if (pad) {
      alignPadToSurface(terrain, pad, pad.x + pad.w / 2, pad.y + pad.h);
    }
  }
}

export function paintTerrainCircle(terrain, pad, x, y, radius, mode = 'add') {
  if (!terrain || radius <= 0) return;
  const cellSize = terrain.cellSize;
  const radiusSq = radius * radius;
  const minCol = Math.max(0, Math.floor((x - radius) / cellSize));
  const maxCol = Math.min(terrain.cols - 1, Math.ceil((x + radius) / cellSize));
  const minRow = Math.max(0, Math.floor((y - radius) / cellSize));
  const maxRow = Math.min(terrain.rows - 1, Math.ceil((y + radius) / cellSize));
  let changed = false;
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cx = (col + 0.5) * cellSize;
      const cy = (row + 0.5) * cellSize;
      const dx = cx - x;
      const dy = cy - y;
      if (dx * dx + dy * dy <= radiusSq) {
        const value = mode === 'remove' ? 0 : 1;
        const index = cellIndex(terrain, col, row);
        if (terrain.solids[index] !== value) {
          terrain.solids[index] = value;
          changed = true;
        }
      }
    }
  }
  if (changed) {
    terrain.dirtyRender = true;
    if (pad) {
      alignPadToSurface(terrain, pad, pad.x + pad.w / 2, pad.y + pad.h);
    }
  }
}

export function terrainHeightAt(terrain, x) {
  const clampedX = clamp(x, 0, terrain.width - 1);
  const col = Math.floor(clampedX / terrain.cellSize);
  for (let row = 0; row < terrain.rows; row++) {
    if (terrain.solids[cellIndex(terrain, col, row)] === 1) {
      return row * terrain.cellSize;
    }
  }
  return terrain.height;
}

export function restoreTerrainFromBaseline(terrain, pad, editorState) {
  const baseline = editorState?.testBaseline;
  if (!baseline) return;
  const solidSnapshot = baseline.solids ? baseline.solids : baseline;
  terrain.solids = cloneTerrainSolids(solidSnapshot);
  terrain.dirtyRender = true;
  const baselineHoles = baseline.blackHoles ? baseline.blackHoles : [];
  terrain.blackHoles = cloneBlackHoles(baselineHoles);
  editorState.blackHoles = terrain.blackHoles;
  const baselineMeteors = baseline.meteors ? baseline.meteors : [];
  terrain.meteors = cloneMeteors(baselineMeteors);
  editorState.meteors = terrain.meteors;
  if (baseline.pad) {
    pad.x = baseline.pad.x;
    pad.y = baseline.pad.y;
    pad.w = baseline.pad.w;
    pad.h = baseline.pad.h;
  }
  alignPadToSurface(terrain, pad, pad.x + pad.w / 2, pad.y + pad.h);
}
