// js/audio.js — Web Audio API, all sounds generated programmatically

const AudioEngine = (() => {
  let ctx = null;

  function ensure() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function gain(value, when, duration) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(value, when);
    if (duration != null) {
      g.gain.exponentialRampToValueAtTime(0.001, when + duration);
    }
    g.connect(ctx.destination);
    return g;
  }

  function osc(type, freq, dest, when, dur) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    o.connect(dest);
    o.start(when);
    o.stop(when + dur);
    return o;
  }

  // Soft footstep when Finn moves one cell
  function playStep() {
    try {
      ensure();
      const t = ctx.currentTime;
      const g = gain(0.15, t, 0.06);
      osc('sine', 110, g, t, 0.06);
    } catch (e) { /* ignore audio errors */ }
  }

  // Quick click for turning
  function playTurn() {
    try {
      ensure();
      const t = ctx.currentTime;
      const g = gain(0.12, t, 0.04);
      osc('square', 600, g, t, 0.04);
    } catch (e) {}
  }

  // Block placed in tray
  function playBlockPlace() {
    try {
      ensure();
      const t = ctx.currentTime;
      const g = gain(0.1, t, 0.03);
      osc('sine', 1200, g, t, 0.03);
    } catch (e) {}
  }

  // Error bump
  function playBump() {
    try {
      ensure();
      const t = ctx.currentTime;
      const g1 = gain(0.25, t, 0.4);
      const g2 = gain(0.25, t, 0.4);
      osc('sawtooth', 180, g1, t, 0.4);
      osc('sawtooth', 195, g2, t, 0.4); // slight detune = "wah" beating
    } catch (e) {}
  }

  // Referee whistle on try
  function playWhistle() {
    try {
      ensure();
      const t = ctx.currentTime;
      const g = gain(0.35, t, 0.3);
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(880, t);
      o.frequency.setValueAtTime(1046, t + 0.09);
      o.frequency.setValueAtTime(880, t + 0.18);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.3);
    } catch (e) {}
  }

  // Crowd roar (white noise burst)
  function playCrowd() {
    try {
      ensure();
      const bufSize = ctx.sampleRate * 1.5;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buf;

      // Bandpass around 400Hz — gives a warm crowd-like tonality
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 400;
      bp.Q.value = 0.8;

      const g = ctx.createGain();
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.4, t + 0.3);
      g.gain.setValueAtTime(0.4, t + 1.0);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

      src.connect(bp);
      bp.connect(g);
      g.connect(ctx.destination);
      src.start(t);
    } catch (e) {}
  }

  // Ball kick (low thud)
  function playKick() {
    try {
      ensure();
      const t = ctx.currentTime;
      const g = gain(0.5, t, 0.15);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(80, t);
      o.frequency.exponentialRampToValueAtTime(30, t + 0.15);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.15);
    } catch (e) {}
  }

  // Missed kick (descending glide)
  function playMiss() {
    try {
      ensure();
      const t = ctx.currentTime;
      const g = gain(0.2, t, 0.5);
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(500, t);
      o.frequency.exponentialRampToValueAtTime(150, t + 0.5);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.5);
    } catch (e) {}
  }

  // Success fanfare — ascending 3-note chord
  function playLevelUnlock() {
    try {
      ensure();
      const t = ctx.currentTime;
      [523, 659, 784].forEach((freq, i) => {
        const g = gain(0.15, t + i * 0.12, 0.3);
        osc('sine', freq, g, t + i * 0.12, 0.3);
      });
    } catch (e) {}
  }

  // Conversion kick goal!
  function playConversionGoal() {
    try {
      ensure();
      playKick();
      const t = ctx.currentTime + 0.2;
      [523, 659, 784, 1046].forEach((freq, i) => {
        const g = gain(0.18, t + i * 0.1, 0.35);
        osc('sine', freq, g, t + i * 0.1, 0.35);
      });
    } catch (e) {}
  }

  // Run start sound
  function playRunStart() {
    try {
      ensure();
      const t = ctx.currentTime;
      const g = gain(0.12, t, 0.08);
      osc('sine', 880, g, t, 0.08);
    } catch (e) {}
  }

  // Jump whoosh — ascending then descending pitch arc
  function playJump() {
    try {
      ensure();
      const t = ctx.currentTime;
      const g = gain(0.18, t, 0.45);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(300, t);
      o.frequency.linearRampToValueAtTime(700, t + 0.2);
      o.frequency.linearRampToValueAtTime(200, t + 0.45);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.45);
    } catch (e) {}
  }

  // Tackle crunch — short sharp thud with a low rumble
  function playTackle() {
    try {
      ensure();
      const t = ctx.currentTime;
      const g1 = gain(0.35, t, 0.2);
      const g2 = gain(0.2, t, 0.35);
      osc('sawtooth', 120, g1, t, 0.2);
      osc('square', 60, g2, t, 0.35);
    } catch (e) {}
  }

  // Ball pickup — ascending swoop + soft thud
  function playPickupBall() {
    try {
      ensure();
      const t = ctx.currentTime;
      const g = gain(0.18, t, 0.25);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(350, t);
      o.frequency.linearRampToValueAtTime(750, t + 0.15);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.25);
      const g2 = gain(0.12, t, 0.1);
      osc('triangle', 180, g2, t, 0.1);
    } catch (e) {}
  }

  // Score try — triumphant short fanfare
  function playScoreTry() {
    try {
      ensure();
      const t = ctx.currentTime;
      [523, 659, 784, 1046].forEach((freq, i) => {
        const g = gain(0.2, t + i * 0.07, 0.25);
        osc('sine', freq, g, t + i * 0.07, 0.25);
      });
    } catch (e) {}
  }

  return {
    ensure,
    playStep,
    playTurn,
    playBlockPlace,
    playBump,
    playWhistle,
    playCrowd,
    playKick,
    playMiss,
    playLevelUnlock,
    playConversionGoal,
    playRunStart,
    playJump,
    playTackle,
    playScoreTry,
    playPickupBall,
  };
})();
