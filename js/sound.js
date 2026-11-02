// Звуки синтезируются Web Audio — никаких файлов.
MB.sound = (() => {
  let ctx = null;
  const ac = () => (ctx = ctx || new (window.AudioContext || window.webkitAudioContext)());

  function tone(freq, start, dur, type = 'sine', vol = 0.18) {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime + start);
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.05);
  }

  const sets = {
    tap:     () => tone(660, 0, 0.06, 'triangle', 0.08),
    correct: () => { tone(784, 0, 0.12, 'triangle'); tone(1175, 0.09, 0.22, 'triangle'); },
    wrong:   () => { tone(220, 0, 0.18, 'sawtooth', 0.08); tone(165, 0.12, 0.25, 'sawtooth', 0.08); },
    combo:   () => [880, 1109, 1319, 1760].forEach((f, i) => tone(f, i * 0.06, 0.15, 'triangle', 0.12)),
    finish:  () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25, 'triangle', 0.16)),
    coin:    () => { tone(988, 0, 0.08, 'square', 0.06); tone(1319, 0.07, 0.2, 'square', 0.06); },
    fail:    () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.18, 0.3, 'triangle', 0.14)),
  };

  return {
    enabled: true,
    play(name) {
      if (!this.enabled || !sets[name]) return;
      try { sets[name](); } catch (e) { /* звук не обязателен */ }
    },
  };
})();
