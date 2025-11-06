export class AudioManager {
  constructor() {
    this.context = null;
  }

  ensureContext() {
    if (this.context) return;
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {
      console.warn('Audio context not available', err);
    }
  }

  async resume() {
    if (!this.context) {
      this.ensureContext();
    }
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  playSuccess() {
    this.playTone(880, 0.25);
  }

  playFailure() {
    this.playTone(220, 0.35);
  }

  playTone(frequency, duration) {
    this.ensureContext();
    if (!this.context) return;
    const ctx = this.context;
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}

export const audioManager = new AudioManager();
