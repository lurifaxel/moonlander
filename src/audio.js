export class AudioController {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.thruster = null;
    this.unlocked = false;
  }

  ensureContext() {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
      return null;
    }
    if (!this.ctx) {
      this.ctx = new window.AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  unlock() {
    const ctx = this.ensureContext();
    if (!ctx || this.unlocked) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    this.unlocked = true;
  }

  setThrusterActive(on) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.thruster) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(this.master);
      osc.start();
      this.thruster = { osc, gain };
    }
    const target = on ? 0.2 : 0.0001;
    const now = ctx.currentTime;
    this.thruster.gain.gain.cancelScheduledValues(now);
    this.thruster.gain.gain.setTargetAtTime(target, now, 0.12);
  }

  playExplosion() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      const envelope = Math.pow(1 - t, 2);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    source.connect(gain);
    gain.connect(this.master);
    source.start();
  }

  playWinFanfare() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.6);
    gain.gain.value = 0.5;
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.stop(ctx.currentTime + 0.6);
  }
}
