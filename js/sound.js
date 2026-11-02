// Звуки синтезируются Web Audio — никаких файлов.
MB.sound = (() => {
  let ctx = null;
  const ac = () => (ctx = ctx || new (window.AudioContext || window.webkitAudioContext)());
  const last = {};          // когда последний раз звучал каждый звук
  let active = 0;           // сколько осцилляторов звучит прямо сейчас
  const MAX_ACTIVE = 16;

  function tone(freq, start, dur, type = 'sine', vol = 0.18) {
    if (active >= MAX_ACTIVE) return;
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime + start);
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
    o.connect(g).connect(c.destination);
    active++;
    o.onended = () => { active--; o.disconnect(); g.disconnect(); };
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

  // Пока вкладка скрыта, браузер приостанавливает звук; запланированные ноты копились бы
  // и потом звучали все разом. Поэтому в скрытой вкладке не играем вообще.
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.visibilityState === 'hidden') ctx.suspend().catch(() => {});
    else ctx.resume().catch(() => {});
  });

  return {
    enabled: true,
    play(name) {
      if (!this.enabled || !sets[name] || document.visibilityState === 'hidden') return;
      const now = performance.now();
      if (now - (last[name] || 0) < 120) return;   // один и тот же звук не чаще раза в 120 мс
      last[name] = now;
      try {
        const c = ac();
        if (c.state !== 'running') { c.resume().catch(() => {}); return; }   // не копим ноты, пока звук на паузе
        sets[name]();
      } catch (e) { /* звук не обязателен */ }
    },
  };
})();
