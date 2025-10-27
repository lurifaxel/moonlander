import { BOMB_CONSTANTS } from '../constants.js';
import { clamp, groundYAt, deformTerrainAt } from '../terrain.js';
import { spawnExplosion } from '../effects/particles.js';

export function canDropBomb(runtime) {
  if (runtime.gameOver || runtime.landed) return false;
  if (runtime.bombCooldown > 0) return false;
  if (runtime.bombs.length >= BOMB_CONSTANTS.MAX_ACTIVE) return false;
  return true;
}

export function dropBomb(runtime, lander) {
  const radius = clamp(lander.width * 0.8, 10, BOMB_CONSTANTS.MAX_RADIUS * 0.6);
  runtime.bombs.push({
    x: lander.x,
    y: lander.y + lander.height / 2 + radius,
    vx: lander.vx * 0.4,
    vy: lander.vy,
    radius,
    fuse: BOMB_CONSTANTS.FUSE_MS,
    armedTime: BOMB_CONSTANTS.ARM_DELAY_MS,
    blinkPhase: 0,
    grounded: false,
    detonated: false,
  });
  runtime.bombCooldown = BOMB_CONSTANTS.DROP_COOLDOWN_MS;
}

export function updateBombs(runtime, dt, terrain, pad, callbacks) {
  if (runtime.bombCooldown > 0) {
    runtime.bombCooldown = Math.max(0, runtime.bombCooldown - dt);
  }
  const { onExplosion, onChain } = callbacks || {};
  const remaining = [];
  for (const bomb of runtime.bombs) {
    if (bomb.detonated) continue;
    bomb.fuse -= dt;
    bomb.armedTime = Math.max(0, bomb.armedTime - dt);
    bomb.blinkPhase += BOMB_CONSTANTS.BLINK_BASE * dt + (BOMB_CONSTANTS.BLINK_ACCEL * dt) / Math.max(bomb.fuse, 1);
    bomb.vy += dt * 0.0004 * 400;
    bomb.vx *= 0.998;
    bomb.x += bomb.vx * dt;
    bomb.y += bomb.vy * dt;
    if (bomb.x < 0) {
      bomb.x = 0;
      bomb.vx = Math.abs(bomb.vx) * 0.35;
    }
    if (bomb.x > terrain.width) {
      bomb.x = terrain.width;
      bomb.vx = -Math.abs(bomb.vx) * 0.35;
    }
    const groundY = groundYAt(terrain, bomb.x, bomb.y);
    if (bomb.y + bomb.radius >= groundY) {
      bomb.y = groundY - bomb.radius;
      if (bomb.vy > 0) bomb.vy = 0;
      bomb.grounded = true;
    } else if (bomb.grounded && bomb.y + bomb.radius < groundY - 1) {
      bomb.grounded = false;
    }
    if (bomb.fuse <= 0) {
      detonateBomb(runtime, bomb, terrain, pad, { onExplosion, onChain });
      continue;
    }
    remaining.push(bomb);
  }
  runtime.bombs = remaining;
}

function detonateBomb(runtime, bomb, terrain, pad, callbacks) {
  bomb.detonated = true;
  const { onExplosion, onChain } = callbacks || {};
  spawnExplosion(runtime, { x: bomb.x, y: bomb.y, vx: bomb.vx, vy: bomb.vy });
  runtime.blastSmoke.push({
    x: bomb.x,
    y: bomb.y,
    vx: (Math.random() - 0.5) * 0.08,
    vy: -0.03 - Math.random() * 0.04,
    radius: bomb.radius * 0.9,
    radiusStart: bomb.radius * 0.9,
    life: 1400 + Math.random() * 1200,
    lifeStart: 1400,
    heat: 0.9,
  });
  deformTerrainAt(terrain, pad, bomb.x, bomb.y, BOMB_CONSTANTS.MAX_RADIUS, BOMB_CONSTANTS.MAX_DEPTH);
  if (onExplosion) onExplosion(bomb);
  if (!runtime.bombs.length) return;
  const chainRadiusSq = BOMB_CONSTANTS.CHAIN_RADIUS * BOMB_CONSTANTS.CHAIN_RADIUS;
  for (const other of runtime.bombs) {
    if (other === bomb || other.detonated) continue;
    const dx = other.x - bomb.x;
    const dy = other.y - bomb.y;
    if (dx * dx + dy * dy <= chainRadiusSq && other.armedTime <= 0) {
      other.fuse = Math.min(other.fuse, 120);
      if (onChain) onChain(other);
    }
  }
}

export function drawBombs(ctx, runtime, camX) {
  if (!runtime.bombs.length) return;
  ctx.save();
  if (camX) ctx.translate(-camX, 0);
  for (const bomb of runtime.bombs) {
    if (bomb.detonated) continue;
    const fuseRatio = bomb.fuse > 0 ? clamp(bomb.fuse / BOMB_CONSTANTS.FUSE_MS, 0, 1) : 0;
    const heat = 1 - fuseRatio;
    const pulse = Math.sin(bomb.blinkPhase);
    const coreRadius = bomb.radius;
    const haloRadius = coreRadius * (1.4 + heat * 0.9 + Math.max(0, pulse) * 0.4);
    const halo = ctx.createRadialGradient(bomb.x, bomb.y, 0, bomb.x, bomb.y, haloRadius);
    const innerAlpha = Math.min(1, 0.35 + heat * 0.45 + Math.max(0, pulse) * 0.3);
    const midAlpha = innerAlpha * 0.55;
    halo.addColorStop(0, `rgba(255, ${Math.round(150 + heat * 100)}, ${Math.round(70 + heat * 70)}, ${innerAlpha})`);
    halo.addColorStop(0.55, `rgba(255, ${Math.round(110 + heat * 70)}, ${Math.round(40 + heat * 60)}, ${midAlpha})`);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = pulse > 0 ? '#ffe27a' : '#ff744a';
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#311f33';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y, coreRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
