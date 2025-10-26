import { DEBRIS_CONSTANTS } from '../constants.js';
import { clamp01, terrainHeightAt } from '../terrain.js';

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function spawnDust(runtime, terrain, { x, y, intensity = 1, proximity = 0 }) {
  const count = Math.max(0, Math.round(6 * intensity));
  const groundColor = [0x33, 0x2c, 0x4a];
  const highlight = groundColor.map((c, idx) => Math.min(255, c + [60, 52, 44][idx]));
  for (let i = 0; i < count; i++) {
    const radiusBase = randomRange(6, 12);
    const radius = radiusBase + radiusBase * proximity * randomRange(0.2, 0.8);
    const alpha = Math.min(230, 140 + Math.random() * 60 + proximity * 40);
    const tint = groundColor.map((c, idx) => {
      const target = highlight[idx];
      const mix = randomRange(0.1, 0.6) * (0.4 + proximity * 0.6);
      const value = Math.round(Math.max(0, Math.min(255, c + (target - c) * mix + randomRange(-6, 6))));
      return value;
    });
    const spawnX = Math.max(0, Math.min(terrain.width, x + randomRange(-12, 12)));
    const groundY = y;
    const life = randomRange(1200, 2200);
    runtime.smoke.push({
      x: spawnX,
      y: groundY - radius,
      vx: randomRange(-0.04, 0.04),
      vy: randomRange(-0.06, -0.02) * (0.6 + proximity * 0.6),
      r: radius,
      life,
      maxLife: life,
      color: [...tint, alpha],
      prox: proximity,
    });
  }
}

export function updateDust(runtime, dt, gravity, terrain, pullFn) {
  const remaining = [];
  for (const particle of runtime.smoke) {
    particle.life -= dt;
    if (particle.life <= 0) continue;
    particle.vy += gravity * dt * 0.2;
    particle.vx *= 0.995;
    if (pullFn) {
      const pull = pullFn(particle.x, particle.y);
      if (pull) {
        particle.vx += pull.ax * dt * 0.45;
        particle.vy += pull.ay * dt * 0.45;
      }
    }
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    const ground = terrainHeightClamp(terrain, particle.x, particle.y, particle.r);
    if (ground !== null && particle.y + particle.r >= ground) {
      particle.y = ground - particle.r;
      particle.vy *= -0.15;
      particle.vx *= 0.85;
    }
    remaining.push(particle);
  }
  runtime.smoke = remaining;
}

function terrainHeightClamp(terrain, x, y, radius) {
  if (!terrain || terrain.cols === 0) return null;
  return terrainHeightAt(terrain, x);
}

export function drawDust(ctx, runtime, camX) {
  if (!runtime.smoke.length) return;
  ctx.save();
  if (camX) ctx.translate(-camX, 0);
  for (const particle of runtime.smoke) {
    if (particle.life <= 0) continue;
    const life = clamp01(particle.life / particle.maxLife);
    const alpha = clamp01((particle.color[3] / 255) * (0.25 + 0.75 * life));
    ctx.fillStyle = `rgba(${particle.color[0]},${particle.color[1]},${particle.color[2]},${alpha})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r * (1.1 - 0.4 * life), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function spawnExplosion(runtime, { x, y, vx = 0, vy = 0 }) {
  const count = 22 + (Math.random() * 10) | 0;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.4 + 0.1;
    const radius = randomRange(3, 8);
    const life = randomRange(900, 1600) * DEBRIS_CONSTANTS.LIFE_MULT;
    runtime.debris.push({
      x,
      y,
      vx: Math.cos(angle) * speed + vx * 0.4,
      vy: Math.sin(angle) * speed + vy * 0.4,
      radius,
      radiusStart: radius,
      life,
      lifeStart: life,
    });
  }
}

export function updateDebris(runtime, dt, gravity, terrain, pullFn) {
  const remaining = [];
  for (const shard of runtime.debris) {
    shard.life -= dt;
    if (shard.life <= 0) continue;
    shard.vy += gravity * dt * DEBRIS_CONSTANTS.GRAVITY_MULT;
    shard.vx *= 0.99;
    if (pullFn) {
      const pull = pullFn(shard.x, shard.y);
      if (pull) {
        shard.vx += pull.ax * dt;
        shard.vy += pull.ay * dt;
      }
    }
    shard.x += shard.vx * dt;
    shard.y += shard.vy * dt;
    const ground = terrainHeightClamp(terrain, shard.x, shard.y, shard.radius);
    if (ground !== null && shard.y + shard.radius >= ground) {
      shard.y = ground - shard.radius;
      shard.vy *= -0.25;
      shard.vx *= 0.7;
    }
    remaining.push(shard);
  }
  runtime.debris = remaining;
}

export function drawDebris(ctx, runtime, camX) {
  if (!runtime.debris.length) return;
  ctx.save();
  if (camX) ctx.translate(-camX, 0);
  ctx.fillStyle = '#f7d7a0';
  for (const shard of runtime.debris) {
    if (shard.life <= 0) continue;
    const life = clamp01(shard.life / shard.lifeStart);
    ctx.globalAlpha = 0.3 + 0.7 * life;
    ctx.beginPath();
    ctx.arc(shard.x, shard.y, shard.radius * (0.8 + 0.3 * life), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function spawnConfetti(runtime, { x, y }) {
  for (let i = 0; i < 48; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomRange(0.08, 0.2);
    const life = randomRange(1200, 2600);
    runtime.winFx.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.05,
      life,
      lifeStart: life,
      hue: Math.random() * 360,
    });
  }
}

export function updateConfetti(runtime, dt, gravity, pullFn) {
  const remaining = [];
  for (const fx of runtime.winFx) {
    fx.life -= dt;
    if (fx.life <= 0) continue;
    fx.vy += gravity * dt * 0.4;
    if (pullFn) {
      const pull = pullFn(fx.x, fx.y);
      if (pull) {
        fx.vx += pull.ax * dt * 0.3;
        fx.vy += pull.ay * dt * 0.3;
      }
    }
    fx.x += fx.vx * dt;
    fx.y += fx.vy * dt;
    remaining.push(fx);
  }
  runtime.winFx = remaining;
}

export function drawConfetti(ctx, runtime, camX) {
  if (!runtime.winFx.length) return;
  ctx.save();
  if (camX) ctx.translate(-camX, 0);
  for (const fx of runtime.winFx) {
    if (fx.life <= 0) continue;
    const life = clamp01(fx.life / fx.lifeStart);
    ctx.fillStyle = `hsla(${fx.hue}, 80%, 60%, ${0.3 + 0.7 * life})`;
    ctx.fillRect(fx.x - 2, fx.y - 2, 4, 4);
  }
  ctx.restore();
}

export function clearParticles(runtime) {
  runtime.smoke.length = 0;
  runtime.debris.length = 0;
  runtime.winFx.length = 0;
  runtime.blastSmoke.length = 0;
  runtime.wreckFlames.length = 0;
}

export function updateBlastSmoke(runtime, dt, gravity, pullFn) {
  if (!runtime.blastSmoke.length) return;
  const remaining = [];
  for (const puff of runtime.blastSmoke) {
    puff.life -= dt;
    if (puff.life <= 0) continue;
    puff.vy += gravity * dt * 0.12;
    if (pullFn) {
      const pull = pullFn(puff.x, puff.y);
      if (pull) {
        puff.vx += pull.ax * dt * 0.3;
        puff.vy += pull.ay * dt * 0.3;
      }
    }
    puff.x += puff.vx * dt;
    puff.y += puff.vy * dt;
    remaining.push(puff);
  }
  runtime.blastSmoke = remaining;
}

export function drawBlastSmoke(ctx, runtime, camX) {
  if (!runtime.blastSmoke.length) return;
  ctx.save();
  if (camX) ctx.translate(-camX, 0);
  for (const puff of runtime.blastSmoke) {
    if (puff.life <= 0) continue;
    const life = clamp01(puff.life / puff.lifeStart);
    const alpha = 0.4 + 0.4 * life;
    ctx.fillStyle = `rgba(180,150,120,${alpha})`;
    ctx.beginPath();
    ctx.arc(puff.x, puff.y, puff.radius * (1.2 - 0.5 * life), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function updateParticles(runtime, dt, gravity, terrain, pullFn) {
  updateDust(runtime, dt, gravity, terrain, pullFn);
  updateDebris(runtime, dt, gravity, terrain, pullFn);
  updateConfetti(runtime, dt, gravity, pullFn);
  updateBlastSmoke(runtime, dt, gravity, pullFn);
}

export function drawParticles(ctx, runtime, camX) {
  drawDust(ctx, runtime, camX);
  drawBlastSmoke(ctx, runtime, camX);
  drawDebris(ctx, runtime, camX);
  drawConfetti(ctx, runtime, camX);
}
