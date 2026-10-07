export class AudioManager {
  constructor() {
    this.context = null;
    this.master = null;
    this.music = null;
    this.musicGain = null;
    this.hidden = false;
    this.muted = false;
  }

  async unlock() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.11;
      this.master.connect(this.context.destination);
      this.music = new Audio("./assets/ningjing-xianshi.mp3");
      this.music.loop = true;
      this.music.preload = "auto";
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = 0;
      this.context.createMediaElementSource(this.music).connect(this.musicGain).connect(this.master);
    }
    if (this.context.state === "suspended") await this.context.resume();
    this.startMusic();
  }

  setMuted(value) {
    this.muted = value;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(value ? 0 : 0.11, this.context.currentTime, 0.03);
    }
    if (value) this.stopMusic();
    else this.startMusic();
  }

  setVisibility(hidden) {
    this.hidden = hidden;
    if (!this.context) return;
    if (hidden) {
      this.stopMusic();
      void this.context.suspend();
    } else {
      void this.context.resume().then(() => this.startMusic()).catch(() => {});
    }
  }

  startMusic() {
    if (!this.context || this.muted || this.hidden) return;
    if (!this.music.paused) return;
    const gain = this.musicGain.gain;
    const now = this.context.currentTime;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0.22, now + 1.1);
    void this.music.play().catch(() => {});
  }

  stopMusic() {
    if (!this.context) return;
    const now = this.context.currentTime;
    const gain = this.musicGain.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(0, now);
    this.music.pause();
  }

  tone(frequency = 520, duration = 0.11, type = "sine") {
    if (!this.context || this.muted) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.13, this.context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    osc.connect(gain).connect(this.master);
    osc.start();
    osc.stop(this.context.currentTime + duration + 0.03);
  }

  success() {
    this.tone(520, 0.12, "sine");
    window.setTimeout(() => this.tone(680, 0.14, "sine"), 85);
  }

  softError() {
    this.tone(210, 0.14, "triangle");
  }
}
