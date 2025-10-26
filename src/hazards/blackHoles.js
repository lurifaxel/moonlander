import { BLACK_HOLE_CONSTANTS } from '../constants.js';

export function holeEventRadius(hole) {
  return hole && typeof hole.eventRadius === 'number' ? hole.eventRadius : BLACK_HOLE_CONSTANTS.EVENT_RADIUS;
}

export function holePullRadius(hole) {
  return hole && typeof hole.pullRadius === 'number' ? hole.pullRadius : BLACK_HOLE_CONSTANTS.PULL_RADIUS;
}

export function isInsideBlackHole(hole, x, y, radiusOverride = null) {
  if (!hole) return false;
  const radius = radiusOverride != null ? radiusOverride : holeEventRadius(hole);
  const dx = x - hole.x;
  const dy = y - hole.y;
  return dx * dx + dy * dy <= radius * radius;
}

export function computeBlackHoleAcceleration(holes, x, y) {
  if (!holes || holes.length === 0) return null;
  let ax = 0;
  let ay = 0;
  let influenced = false;
  const minDist = BLACK_HOLE_CONSTANTS.MIN_DISTANCE;
  for (const hole of holes) {
    const pullRadius = holePullRadius(hole);
    const dx = hole.x - x;
    const dy = hole.y - y;
    const distSq = dx * dx + dy * dy;
    if (distSq > pullRadius * pullRadius) continue;
    influenced = true;
    const dist = Math.sqrt(distSq) || minDist;
    const clampedDist = Math.max(dist, minDist);
    const falloff = 1 - Math.min(clampedDist / pullRadius, 1);
    const accelBase = BLACK_HOLE_CONSTANTS.PULL_STRENGTH * Math.pow(falloff, 0.8);
    const accel = Math.min(
      BLACK_HOLE_CONSTANTS.MAX_FORCE,
      accelBase * (pullRadius / (clampedDist + 0.0001))
    );
    const nx = dx / clampedDist;
    const ny = dy / clampedDist;
    ax += nx * accel;
    ay += ny * accel;
  }
  if (!influenced) return null;
  return { ax, ay };
}

export function findBlackHoleCapture(holes, x, y) {
  if (!holes || holes.length === 0) return null;
  for (const hole of holes) {
    if (isInsideBlackHole(hole, x, y)) {
      return hole;
    }
  }
  return null;
}

export function ensureHoleSpacing(holes) {
  const spacing = BLACK_HOLE_CONSTANTS.MIN_SPACING;
  if (!holes) return [];
  const filtered = [];
  for (const hole of holes) {
    const tooClose = filtered.some(existing => {
      const dx = existing.x - hole.x;
      const dy = existing.y - hole.y;
      return dx * dx + dy * dy < spacing * spacing;
    });
    if (!tooClose) {
      filtered.push(hole);
    }
  }
  return filtered;
}
