import { METEOR_CONSTANTS } from '../constants.js';
import { clamp, groundYAt, deformTerrainAt } from '../terrain.js';

function normalizeMeteor(def, terrainWidth, terrainHeight, index = 0) {
  if (!def) return null;
  const spawnX = clamp(def.spawn?.x ?? terrainWidth / 2, 0, terrainWidth);
  const spawnYRaw = def.spawn?.y ?? -METEOR_CONSTANTS.SPAWN_ABOVE_MARGIN;
  const spawnY = Math.min(spawnYRaw, -METEOR_CONSTANTS.SPAWN_ABOVE_MARGIN);
  const targetX = clamp(def.target?.x ?? spawnX, 0, terrainWidth);
  const targetYRaw = def.target?.y ?? terrainHeight * 0.9;
  const targetY = clamp(targetYRaw, -400, terrainHeight + 600);
  const radius = clamp(
    def.radius ?? 24,
    METEOR_CONSTANTS.MIN_RADIUS,
    METEOR_CONSTANTS.MAX_RADIUS
  );
  const speed = clamp(
    def.speed ?? 0.32,
    METEOR_CONSTANTS.MIN_SPEED,
    METEOR_CONSTANTS.MAX_SPEED
  );
  const startMs = Math.max(0, def.startMs ?? 0);
  const warningLeadMs = Math.min(startMs, Math.max(0, def.warningLeadMs ?? 0));
  return {
    id: def.id || `meteor-${Date.now()}-${index}`,
    spawn: { x: spawnX, y: spawnY },
    target: { x: targetX, y: targetY },
    radius,
    speed,
    startMs,
    warningLeadMs,
    warningStart: Math.max(0, startMs - warningLeadMs),
    warningIssued: false,
  };
}

export function prepareMeteorTimeline(source, terrain) {
  if (!source || !source.length) return [];
  return source
    .map((def, index) => normalizeMeteor(def, terrain.width, terrain.height, index))
    .filter(Boolean)
    .sort((a, b) => a.startMs - b.startMs);
}

export function resetMeteorState(runtime, terrain) {
  runtime.meteorTime = 0;
  runtime.meteorWarnings = [];
  runtime.activeMeteors = [];
  runtime.meteorTimeline = prepareMeteorTimeline(terrain.meteors, terrain);
}

export function spawnMeteorWarning(runtime, event) {
  if (event.warningLeadMs <= 0) {
    event.warningIssued = true;
    return;
  }
  runtime.meteorWarnings.push({
    id: event.id,
    spawn: { ...event.spawn },
    target: { ...event.target },
    radius: event.radius,
    start: event.warningStart,
    end: event.startMs,
    flash: 0,
    progress: 0,
  });
  event.warningIssued = true;
}

export function spawnMeteor(runtime, event) {
  const dx = event.target.x - event.spawn.x;
  const dy = event.target.y - event.spawn.y;
  const distance = Math.hypot(dx, dy);
  const duration = distance / Math.max(event.speed, 0.0001);
  runtime.activeMeteors.push({
    id: event.id,
    radius: event.radius,
    spawn: { ...event.spawn },
    target: { ...event.target },
    pathDx: dx,
    pathDy: dy,
    duration,
    elapsed: 0,
    trailTimer: 0,
    exploded: false,
  });
}

export function updateMeteors(runtime, dt, terrain, pad, callbacks) {
  const { onImpact, onTrail, onWarningFlash } = callbacks || {};
  runtime.meteorTime += dt;
  if (runtime.meteorTimeline.length) {
    const remaining = [];
    for (const event of runtime.meteorTimeline) {
      if (!event.warningIssued && runtime.meteorTime >= event.warningStart) {
        spawnMeteorWarning(runtime, event);
      }
      if (runtime.meteorTime >= event.startMs) {
        spawnMeteor(runtime, event);
        continue;
      }
      remaining.push(event);
    }
    runtime.meteorTimeline = remaining;
  }

  if (runtime.meteorWarnings.length) {
    for (const warn of runtime.meteorWarnings) {
      warn.flash += dt;
      if (onWarningFlash) onWarningFlash(warn);
      warn.progress = warn.end > warn.start ? Math.min(1, (runtime.meteorTime - warn.start) / (warn.end - warn.start)) : 1;
    }
    runtime.meteorWarnings = runtime.meteorWarnings.filter(warn => runtime.meteorTime < warn.end);
  }

  if (!runtime.activeMeteors.length) return;
  const remainingMeteors = [];
  for (const meteor of runtime.activeMeteors) {
    if (meteor.exploded) continue;
    const prevX = meteor.x ?? meteor.spawn.x;
    const prevY = meteor.y ?? meteor.spawn.y;
    meteor.elapsed += dt;
    const progress = meteor.duration > 0 ? Math.min(1, meteor.elapsed / meteor.duration) : 1;
    meteor.x = meteor.spawn.x + meteor.pathDx * progress;
    meteor.y = meteor.spawn.y + meteor.pathDy * progress;
    if (dt > 0) {
      meteor.vx = (meteor.x - prevX) / dt;
      meteor.vy = (meteor.y - prevY) / dt;
    }
    meteor.angle = Math.atan2(meteor.vy || 0.0001, meteor.vx || 0.0001);
    meteor.trailTimer += dt;
    if (onTrail && meteor.trailTimer >= METEOR_CONSTANTS.TRAIL_INTERVAL_MS) {
      onTrail(meteor);
      meteor.trailTimer = 0;
    }
    const groundY = groundYAt(terrain, meteor.x, meteor.y);
    if (meteor.y >= groundY) {
      resolveMeteorImpact(runtime, meteor, terrain, pad, meteor.x, meteor.y, onImpact);
      continue;
    }
    if (progress >= 1) {
      resolveMeteorImpact(runtime, meteor, terrain, pad, meteor.x, meteor.y, onImpact);
      continue;
    }
    remainingMeteors.push(meteor);
  }
  runtime.activeMeteors = remainingMeteors;
}

function resolveMeteorImpact(runtime, meteor, terrain, pad, hitX, hitY, onImpact) {
  if (!meteor || meteor.exploded) return;
  meteor.exploded = true;
  const impactX = clamp(hitX, 0, terrain.width);
  const groundY = groundYAt(terrain, impactX, hitY);
  const craterRadius = Math.max(
    meteor.radius * 1.2,
    Math.min(METEOR_CONSTANTS.MAX_RADIUS * 1.6, meteor.radius * METEOR_CONSTANTS.CRATER_RADIUS_SCALE)
  );
  const craterDepth = Math.max(meteor.radius * 0.6, meteor.radius * METEOR_CONSTANTS.CRATER_DEPTH_SCALE);
  deformTerrainAt(terrain, pad, impactX, groundY, craterRadius, craterDepth);
  runtime.meteorWarnings = runtime.meteorWarnings.filter(w => w.id !== meteor.id);
  if (onImpact) {
    onImpact({ x: impactX, y: groundY, meteor });
  }
}

export function drawMeteorWarnings(ctx, runtime, camX) {
  if (!runtime.meteorWarnings.length) return;
  ctx.save();
  if (camX) ctx.translate(-camX, 0);
  for (const warn of runtime.meteorWarnings) {
    const alphaRange = METEOR_CONSTANTS.WARNING_ALPHA_MAX - METEOR_CONSTANTS.WARNING_ALPHA_MIN;
    const flash = Math.sin((warn.flash / METEOR_CONSTANTS.WARNING_FLASH_MS) * Math.PI * 2);
    const alpha = METEOR_CONSTANTS.WARNING_ALPHA_MIN + alphaRange * (0.5 + 0.5 * flash);
    ctx.strokeStyle = `rgba(255, 200, 120, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(warn.spawn.x, warn.spawn.y);
    ctx.lineTo(warn.target.x, warn.target.y);
    ctx.stroke();
  }
  ctx.restore();
  ctx.setLineDash([]);
}

export function drawMeteors(ctx, runtime, camX) {
  if (!runtime.activeMeteors.length) return;
  ctx.save();
  if (camX) ctx.translate(-camX, 0);
  for (const meteor of runtime.activeMeteors) {
    ctx.save();
    ctx.translate(meteor.x, meteor.y);
    ctx.rotate(meteor.angle || 0);
    const grd = ctx.createRadialGradient(0, 0, meteor.radius * 0.2, 0, 0, meteor.radius);
    grd.addColorStop(0, 'rgba(255,250,200,0.9)');
    grd.addColorStop(0.4, 'rgba(255,170,80,0.8)');
    grd.addColorStop(1, 'rgba(120,40,10,0.85)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, meteor.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
