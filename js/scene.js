// Пейзажи под дорожкой уровней: у каждой темы свой «биом» (луг, лес, осень, река, зима, пустыня, ночь).
// Рисуем SVG после отрисовки карты, когда известны настоящие координаты кружков-уровней:
// через них прокладывается тропинка, поперёк — ручей с мостиком, вокруг — деревья, камни, цветы.
// Дальний слой (холмы, облака) при прокрутке сдвигается медленнее — эффект глубины.
MB.scene = (() => {
  const BIOMES = {
    meadow: { top: '#bdf0a0', bottom: '#8fd86a', hill: '#a9e88a', path: '#f3dba8', edge: '#d9b46e', deco: ['tree', 'tree', 'bush', 'flower', 'flower', 'rock'], leaf: ['#4cb83c', '#3fa232', '#62c94a'] },
    forest: { top: '#9fd98c', bottom: '#5fae55', hill: '#86c977', path: '#e9cf9a', edge: '#b88d55', deco: ['pine', 'pine', 'tree', 'bush', 'mushroom', 'rock'], leaf: ['#2f8a3a', '#2a7a34', '#3b9a45'] },
    autumn: { top: '#f3e2a2', bottom: '#d9c06e', hill: '#ecd58c', path: '#f6e3bd', edge: '#c99a55', deco: ['tree', 'tree', 'bush', 'leaf', 'rock', 'mushroom'], leaf: ['#f08a24', '#e05d2b', '#f2b134'] },
    river: { top: '#b8ecc6', bottom: '#7fcf9b', hill: '#a2e2b4', path: '#f1dcab', edge: '#c9a463', deco: ['tree', 'reed', 'reed', 'bush', 'flower', 'rock'], leaf: ['#3fae5a', '#35994d', '#56c06c'], extraStreams: 1 },
    winter: { top: '#f4f9ff', bottom: '#d6e8f8', hill: '#e6f1fb', path: '#e7dccb', edge: '#bfae93', deco: ['snowpine', 'snowpine', 'rock', 'snowman', 'bush'], leaf: ['#2f7a55', '#2a6b4b'], frozen: true },
    desert: { top: '#fbe6bf', bottom: '#efc98a', hill: '#f6d9a4', path: '#fff1d6', edge: '#d6a35c', deco: ['cactus', 'cactus', 'rock', 'rock', 'bush'], leaf: ['#5aa04a', '#4b8e3d'], noStream: true },
    magic: { top: '#5b3fa8', bottom: '#2b1d63', hill: '#4a3391', path: '#ffd86b', edge: '#d9a92c', deco: ['star', 'star', 'crystal', 'crystal', 'pine'], leaf: ['#7c5ce0', '#9a7cf0'], noStream: true, night: true },
  };
  const ORDER = ['meadow', 'forest', 'river', 'autumn', 'winter', 'desert'];
  const biomeFor = (index, isFinal) => (isFinal ? 'magic' : ORDER[index % ORDER.length]);

  // детерминированный «случай»: одна и та же тема всегда выглядит одинаково
  function rng(seedStr) {
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // плавная кривая через точки: вертикальные S-образные изгибы
  function curve(pts) {
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], dy = (b.y - a.y) / 2;
      d += ` C${a.x},${a.y + dy} ${b.x},${b.y - dy} ${b.x},${b.y}`;
    }
    return d;
  }
  // x тропинки на высоте y (линейно между соседними точками) — чтобы не ставить деревья на дорожку
  function pathXAt(pts, y) {
    for (let i = 1; i < pts.length; i++) {
      if (y <= pts[i].y) { const a = pts[i - 1], b = pts[i], t = (y - a.y) / Math.max(1, b.y - a.y); return a.x + (b.x - a.x) * t; }
    }
    return pts[pts.length - 1].x;
  }

  // ----- отдельные объекты (x, y — точка опоры на земле, s — масштаб «ближе/дальше») -----
  const shadow = (x, y, w) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.32}" fill="#000" opacity=".14"/>`;
  const DECO = {
    tree: (x, y, s, r, B) => { const c = B.leaf[Math.floor(r() * B.leaf.length)];
      return `${shadow(x + 4 * s, y, 18 * s)}<rect x="${x - 3 * s}" y="${y - 22 * s}" width="${6 * s}" height="${22 * s}" rx="${2 * s}" fill="#8a5a35"/>
        <circle cx="${x}" cy="${y - 34 * s}" r="${18 * s}" fill="${c}"/><circle cx="${x - 10 * s}" cy="${y - 26 * s}" r="${12 * s}" fill="${c}"/><circle cx="${x + 11 * s}" cy="${y - 27 * s}" r="${12 * s}" fill="${c}"/>
        <circle cx="${x - 6 * s}" cy="${y - 40 * s}" r="${6 * s}" fill="#fff" opacity=".22"/>`; },
    pine: (x, y, s, r, B) => { const c = B.leaf[Math.floor(r() * B.leaf.length)];
      return `${shadow(x + 4 * s, y, 15 * s)}<rect x="${x - 3 * s}" y="${y - 12 * s}" width="${6 * s}" height="${12 * s}" fill="#7a4e2d"/>
        <path d="M${x},${y - 58 * s} L${x + 16 * s},${y - 28 * s} L${x - 16 * s},${y - 28 * s}Z M${x},${y - 46 * s} L${x + 20 * s},${y - 12 * s} L${x - 20 * s},${y - 12 * s}Z" fill="${c}"/>
        <path d="M${x},${y - 58 * s} L${x - 16 * s},${y - 28 * s} L${x},${y - 30 * s}Z" fill="#fff" opacity=".12"/>`; },
    snowpine: (x, y, s, r, B) => DECO.pine(x, y, s, r, B) + `<path d="M${x},${y - 58 * s} L${x + 7 * s},${y - 45 * s} L${x - 7 * s},${y - 45 * s}Z M${x - 12 * s},${y - 22 * s} Q${x},${y - 28 * s} ${x + 12 * s},${y - 22 * s}" fill="#fff" stroke="#fff" stroke-width="${2 * s}"/>`,
    bush: (x, y, s, r, B) => { const c = B.leaf[Math.floor(r() * B.leaf.length)];
      return `${shadow(x, y, 15 * s)}<circle cx="${x - 7 * s}" cy="${y - 7 * s}" r="${9 * s}" fill="${c}"/><circle cx="${x + 7 * s}" cy="${y - 8 * s}" r="${10 * s}" fill="${c}"/><circle cx="${x}" cy="${y - 13 * s}" r="${9 * s}" fill="${c}"/>`; },
    rock: (x, y, s) => `${shadow(x, y, 13 * s)}<path d="M${x - 12 * s},${y} Q${x - 13 * s},${y - 13 * s} ${x - 2 * s},${y - 15 * s} Q${x + 12 * s},${y - 14 * s} ${x + 12 * s},${y} Z" fill="#a7a9b4"/><path d="M${x - 6 * s},${y - 11 * s} Q${x},${y - 14 * s} ${x + 5 * s},${y - 11 * s}" stroke="#fff" stroke-width="${2 * s}" fill="none" opacity=".5"/>`,
    flower: (x, y, s, r) => { const c = ['#ff6fa8', '#ffd23f', '#ffffff', '#b98cff'][Math.floor(r() * 4)];
      return [[-6, 0], [4, -3], [0, 5]].map(([dx, dy]) => `<line x1="${x + dx * s}" y1="${y + dy * s}" x2="${x + dx * s}" y2="${y + dy * s - 7 * s}" stroke="#3f9d3a" stroke-width="${1.5 * s}"/><circle cx="${x + dx * s}" cy="${y + dy * s - 8 * s}" r="${3.2 * s}" fill="${c}"/><circle cx="${x + dx * s}" cy="${y + dy * s - 8 * s}" r="${1.2 * s}" fill="#ffb300"/>`).join(''); },
    leaf: (x, y, s, r) => { const c = ['#f08a24', '#e05d2b', '#f2b134'][Math.floor(r() * 3)];
      return `<ellipse cx="${x}" cy="${y}" rx="${6 * s}" ry="${3 * s}" fill="${c}" transform="rotate(${Math.floor(r() * 180)} ${x} ${y})"/><ellipse cx="${x + 10 * s}" cy="${y + 4 * s}" rx="${5 * s}" ry="${2.5 * s}" fill="${c}" opacity=".85" transform="rotate(${Math.floor(r() * 180)} ${x + 10 * s} ${y + 4 * s})"/>`; },
    mushroom: (x, y, s) => `${shadow(x, y, 8 * s)}<rect x="${x - 2.5 * s}" y="${y - 9 * s}" width="${5 * s}" height="${9 * s}" rx="${2 * s}" fill="#fff4e0"/><path d="M${x - 9 * s},${y - 8 * s} Q${x},${y - 22 * s} ${x + 9 * s},${y - 8 * s} Z" fill="#e53935"/><circle cx="${x - 3 * s}" cy="${y - 13 * s}" r="${1.6 * s}" fill="#fff"/><circle cx="${x + 3 * s}" cy="${y - 11 * s}" r="${1.3 * s}" fill="#fff"/>`,
    reed: (x, y, s) => `${[-4, 0, 4].map(dx => `<path d="M${x + dx * s},${y} Q${x + dx * s - 2 * s},${y - 14 * s} ${x + dx * s + 2 * s},${y - 24 * s}" stroke="#4a8f3a" stroke-width="${2 * s}" fill="none"/>`).join('')}<rect x="${x - 1.5 * s}" y="${y - 30 * s}" width="${3 * s}" height="${9 * s}" rx="${1.5 * s}" fill="#7a4e2d"/>`,
    cactus: (x, y, s) => `${shadow(x, y, 12 * s)}<rect x="${x - 5 * s}" y="${y - 34 * s}" width="${10 * s}" height="${34 * s}" rx="${5 * s}" fill="#4f9a45"/><path d="M${x - 5 * s},${y - 18 * s} h-${6 * s} v-${10 * s}" stroke="#4f9a45" stroke-width="${6 * s}" fill="none" stroke-linecap="round"/><path d="M${x + 5 * s},${y - 22 * s} h${6 * s} v-${8 * s}" stroke="#4f9a45" stroke-width="${6 * s}" fill="none" stroke-linecap="round"/><line x1="${x - 1 * s}" y1="${y - 30 * s}" x2="${x - 1 * s}" y2="${y - 4 * s}" stroke="#fff" stroke-width="${1.2 * s}" opacity=".3"/>`,
    snowman: (x, y, s) => `${shadow(x, y, 12 * s)}<circle cx="${x}" cy="${y - 9 * s}" r="${10 * s}" fill="#fff" stroke="#d5e3f2"/><circle cx="${x}" cy="${y - 24 * s}" r="${7 * s}" fill="#fff" stroke="#d5e3f2"/><path d="M${x},${y - 24 * s} l${7 * s},${2 * s} l-${7 * s},${1 * s}z" fill="#ff8a00"/><circle cx="${x - 2.5 * s}" cy="${y - 26 * s}" r="${1 * s}" fill="#333"/><circle cx="${x + 1.5 * s}" cy="${y - 26 * s}" r="${1 * s}" fill="#333"/>`,
    star: (x, y, s, r) => { const k = 3 + r() * 4; return `<path d="M${x},${y - k * 2 * s} l${k * 0.5 * s},${k * 1.5 * s} ${k * 1.5 * s},${k * 0.5 * s} -${k * 1.5 * s},${k * 0.5 * s} -${k * 0.5 * s},${k * 1.5 * s} -${k * 0.5 * s},-${k * 1.5 * s} -${k * 1.5 * s},-${k * 0.5 * s} ${k * 1.5 * s},-${k * 0.5 * s}z" fill="#ffe680" opacity="${0.5 + r() * 0.5}" class="twinkle"/>`; },
    crystal: (x, y, s) => `${shadow(x, y, 12 * s)}<path d="M${x - 9 * s},${y} L${x - 5 * s},${y - 22 * s} L${x},${y - 30 * s} L${x + 5 * s},${y - 20 * s} L${x + 9 * s},${y} Z" fill="#8fe3ff" opacity=".9"/><path d="M${x},${y - 30 * s} L${x + 5 * s},${y - 20 * s} L${x + 9 * s},${y} L${x},${y} Z" fill="#4fb6e8" opacity=".8"/>`,
  };

  function build(pathEl, unitKey, biomeName) {
    const B = BIOMES[biomeName], r = rng(unitKey);
    const box = pathEl.getBoundingClientRect(), W = Math.round(box.width), H = Math.round(box.height);
    if (W < 50 || H < 50) return '';
    const nodes = [...pathEl.querySelectorAll('.node')].map(n => {
      const b = n.getBoundingClientRect();
      return { x: Math.round(b.left + b.width / 2 - box.left), y: Math.round(b.top + b.height / 2 - box.top) };
    });
    if (!nodes.length) return '';
    const pts = [{ x: nodes[0].x, y: 0 }, ...nodes, { x: nodes[nodes.length - 1].x, y: H }];
    const g = `g-${unitKey.replace(/\W/g, '')}`;
    let far = '', water = '', deco = [];

    // дальний слой: холмы и облака (двигается при прокрутке медленнее)
    for (let i = 0; i < 4; i++) {
      const cx = r() * W, cy = H * (0.15 + i * 0.25), rx = W * (0.35 + r() * 0.3);
      far += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${(rx * 0.32).toFixed(0)}" fill="${B.hill}" opacity=".7"/>`;
    }
    if (!B.night) for (let i = 0; i < 2; i++) {
      const cx = r() * W, cy = 20 + r() * (H - 40);
      far += `<g opacity=".55"><ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="34" ry="12" fill="#fff"/><ellipse cx="${(cx + 18).toFixed(0)}" cy="${(cy - 7).toFixed(0)}" rx="20" ry="11" fill="#fff"/></g>`;
    }

    // ручей поперёк тропинки (с мостиком), иногда два
    const streams = B.noStream || nodes.length < 2 ? 0 : 1 + (B.extraStreams || 0);
    const busy = [];   // зоны, где нельзя ставить деревья (вода, мост)
    for (let k = 0; k < streams; k++) {
      const i = Math.min(nodes.length - 2, Math.floor((k + 1) * nodes.length / (streams + 1)) - (k ? 0 : 0));
      const y = Math.round((nodes[Math.max(0, i)].y + nodes[Math.max(0, i) + 1].y) / 2);
      const amp = 14 + r() * 10, color = B.frozen ? '#cfe9ff' : '#62c3f5', light = B.frozen ? '#ffffff' : '#aee3ff';
      const d = `M-10,${y - amp} C${W * 0.25},${y + amp} ${W * 0.5},${y - amp} ${W * 0.75},${y + amp} S${W + 10},${y - amp / 2} ${W + 10},${y}`;
      water += `<path d="${d}" stroke="${B.frozen ? '#a9cbe8' : '#2f9fd8'}" stroke-width="30" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="${d}" stroke="${color}" stroke-width="22" fill="none" stroke-linecap="round"/>
        <path d="${d}" stroke="${light}" stroke-width="3" fill="none" stroke-dasharray="14 22" class="${B.frozen ? '' : 'flow'}" opacity=".9"/>`;
      busy.push({ y, h: 30 });
      // мостик там, где ручей пересекает тропинку
      const bx = pathXAt(pts, y);
      water += `<g class="bridge"><rect x="${bx - 26}" y="${y - 15}" width="52" height="30" rx="6" fill="#9b6a3f"/>
        ${[0, 1, 2, 3, 4].map(p => `<rect x="${bx - 24 + p * 10}" y="${y - 15}" width="8" height="30" rx="2" fill="#b98352"/>`).join('')}
        <rect x="${bx - 28}" y="${y - 17}" width="56" height="4" rx="2" fill="#6e4526"/><rect x="${bx - 28}" y="${y + 13}" width="56" height="4" rx="2" fill="#6e4526"/></g>`;
    }

    // объекты вокруг тропинки: сетка с разбросом, подальше от дорожки и воды
    for (let y = 30; y < H - 6; y += 44) {
      for (let col = 0; col < Math.max(3, Math.round(W / 90)); col++) {
        const x = Math.round((col + 0.15 + r() * 0.7) * W / Math.max(3, Math.round(W / 90))), yy = Math.round(y + r() * 26);
        if (Math.abs(x - pathXAt(pts, yy)) < 70) continue;                  // не на тропинке
        if (nodes.some(n => Math.hypot(n.x - x, n.y - yy) < 80)) continue;  // не на уровне
        if (busy.some(b => Math.abs(b.y - yy) < b.h + 14)) continue;        // не в ручье
        if (r() < 0.25) continue;                                           // немного пустоты
        const type = B.deco[Math.floor(r() * B.deco.length)];
        const s = 0.75 + (yy / H) * 0.45;   // ниже — ближе — крупнее
        deco.push({ y: yy, svg: DECO[type](x, yy, s, r, B) });
      }
    }
    deco.sort((a, b) => a.y - b.y);   // дальние рисуем раньше ближних

    const road = curve(pts);
    return `<svg class="scene" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${B.top}"/><stop offset="1" stop-color="${B.bottom}"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#${g})"/>
      <g class="far">${far}</g>
      ${water}
      <path d="${road}" stroke="#000" stroke-opacity=".08" stroke-width="44" fill="none" transform="translate(0,5)"/>
      <path d="${road}" stroke="${B.edge}" stroke-width="40" fill="none" stroke-linecap="round"/>
      <path d="${road}" stroke="${B.path}" stroke-width="32" fill="none" stroke-linecap="round"/>
      <path d="${road}" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-dasharray="3 18" stroke-linecap="round"/>
      ${deco.map(d => d.svg).join('')}
    </svg>`;
  }

  let parallaxBound = false;
  function parallax() {
    const vh = innerHeight;
    document.querySelectorAll('.path .scene .far').forEach(f => {
      const r = f.ownerSVGElement.getBoundingClientRect();
      f.setAttribute('transform', `translate(0 ${((r.top + r.height / 2 - vh / 2) * -0.12).toFixed(1)})`);
    });
  }

  // вызывается после отрисовки карты
  function decorate(root) {
    root.querySelectorAll('.unit[data-biome] .path').forEach(p => {
      const unit = p.closest('.unit');
      const old = p.querySelector(':scope > .scene');
      if (old) old.remove();
      p.insertAdjacentHTML('afterbegin', build(p, unit.dataset.unitId, unit.dataset.biome));
    });
    parallax();
    if (!parallaxBound) {
      parallaxBound = true;
      let raf = 0;
      addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; parallax(); }); }, { passive: true });
    }
  }

  return { decorate, biomeFor };
})();
