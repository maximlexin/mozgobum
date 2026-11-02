// Мозгобум — движок игры. Весь прогресс хранится в localStorage этого браузера.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');
  const { shuffle, pick } = MB.R;

  const KEY = 'mozgobum-v1';
  const MAX_HEARTS = 5;
  const REGEN_MS = 30 * 60 * 1000;   // одно сердце за 30 минут
  const DAY = 86400000;
  const LESSON_SIZE = 8, EXAM_SIZE = 12, FINAL_SIZE = 20, REVIEW_SIZE = 10;
  const EXAM_PASS = 0.75;   // экзамен сдан на 4 и 5

  // ---------- Состояние ----------
  const defaults = () => ({
    onboarded: false, name: '', goal: 20, sound: true,
    xp: 0, gems: 50, hearts: MAX_HEARTS, heartsAt: Date.now(),
    streak: 0, bestStreak: 0, lastDay: null, freezes: 0,
    days: {}, progress: {}, mistakes: [],
    lessons: 0, perfect: 0, bosses: 0, fives: 0, finals: 0, fixed: 0, correctTotal: 0, bestCombo: 0,
    subjPlayed: {}, quests: { day: '', list: [] }, achievements: {},
    look: { hat: null, face: null, neck: null, skin: 'purple' }, owned: ['purple'], subject: 'math', since: Date.now(),
    boost: { shield: 1, fifty: 2, x2: 1, x2Until: 0 },   // стартовый набор бустеров
    play: { day: '', ms: 0, opened: [] },                 // минуты игры сегодня и открытые сундуки
    theoryRead: [],                                       // темы, где открывали теорию
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return migrate(Object.assign(defaults(), JSON.parse(raw)));
    } catch (e) { /* приватный режим или повреждённые данные */ }
    return defaults();
  }
  // первая версия хранила только шапку в S.hat
  function migrate(s) {
    if ('hat' in s) {
      if (s.hat) s.look[MB.ITEMS[s.hat] ? MB.ITEMS[s.hat].slot : 'hat'] = s.hat;
      delete s.hat;
    }
    if (!s.owned.includes('purple')) s.owned.push('purple');
    return s;
  }
  let S = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* нет хранилища */ } };

  const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => dayKey(new Date());
  const dayDiff = (a, b) => {
    const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY);
  };
  const plural = (n, f) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return f[2];
    if (b > 1 && b < 5) return f[1];
    if (b === 1) return f[0];
    return f[2];
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const subjById = id => MB.subjects.find(s => s.id === id) || MB.subjects[0];
  const todayXp = () => S.days[today()] || 0;

  // ---------- Сердца ----------
  function syncHearts() {
    if (S.hearts >= MAX_HEARTS) { S.heartsAt = Date.now(); return; }
    const gained = Math.floor((Date.now() - S.heartsAt) / REGEN_MS);
    if (gained > 0) {
      S.hearts = Math.min(MAX_HEARTS, S.hearts + gained);
      S.heartsAt += gained * REGEN_MS;
      if (S.hearts >= MAX_HEARTS) S.heartsAt = Date.now();
    }
  }
  function loseHeart() {
    if (S.hearts >= MAX_HEARTS) S.heartsAt = Date.now();
    S.hearts = Math.max(0, S.hearts - 1);
  }
  const minsToHeart = () => Math.max(1, Math.ceil((S.heartsAt + REGEN_MS - Date.now()) / 60000));

  // ---------- Серия дней ----------
  function checkStreak() {
    if (!S.lastDay) return;
    const gap = dayDiff(S.lastDay, today());
    if (gap < 2) return;
    const missed = gap - 1;
    if (S.streak > 0 && S.freezes >= missed) {
      S.freezes -= missed;
      S.lastDay = dayKey(new Date(Date.now() - DAY));
      setTimeout(() => toast('🧊 Заморозка спасла твою серию!'), 600);
    } else if (S.streak > 0) {
      setTimeout(() => toast(`Серия ${S.streak} ${plural(S.streak, ['день', 'дня', 'дней'])} сгорела 😢 Начнём новую!`), 600);
      S.streak = 0;
    }
  }
  function bumpStreak() {
    const t = today();
    if (S.lastDay === t) return false;
    S.streak = (S.lastDay && dayDiff(S.lastDay, t) === 1) ? S.streak + 1 : 1;
    S.lastDay = t;
    S.bestStreak = Math.max(S.bestStreak, S.streak);
    return true;
  }

  // ---------- Ежедневные задания ----------
  function ensureQuests() {
    if (S.quests.day === today()) return;
    const subj = pick(MB.subjects);
    const pool = [
      { kind: 'lessons', target: 3, text: 'Пройди 3 урока', reward: 15 },
      { kind: 'perfect', target: 1, text: 'Пройди урок без ошибок', reward: 15 },
      { kind: 'combo', target: 7, text: 'Ответь правильно 7 раз подряд', reward: 10 },
      { kind: 'correct', target: 25, text: 'Дай 25 правильных ответов', reward: 10 },
      { kind: 'subj:' + subj.id, target: 1, text: `Пройди урок: ${subj.title.toLowerCase()}`, reward: 10 },
    ];
    if (S.mistakes.length >= 2) pool.push({ kind: 'fix', target: 2, text: 'Повтори 2 ошибки', reward: 15 });
    const list = [{ kind: 'xp', target: S.goal, text: `Набери ${S.goal} XP`, reward: 10 }, ...shuffle(pool).slice(0, 2)];
    S.quests = { day: today(), list: list.map(q => ({ ...q, progress: 0, claimed: false })) };
    save();
  }
  function quest(kind, amount) {
    for (const q of S.quests.list) {
      if (q.kind !== kind || q.claimed) continue;
      q.progress = kind === 'combo' ? Math.max(q.progress, amount) : q.progress + amount;
      q.progress = Math.min(q.progress, q.target);
    }
  }
  const claimable = () => S.quests.list.filter(q => q.progress >= q.target && !q.claimed).length;

  // ---------- Достижения ----------
  const ACH = [
    { id: 'first', icon: '👣', title: 'Первый шаг', text: 'Пройди первый урок', test: () => S.lessons >= 1 },
    { id: 'streak3', icon: '🔥', title: 'Разогрев', text: 'Серия 3 дня', test: () => S.bestStreak >= 3 },
    { id: 'streak7', icon: '🔥', title: 'Неделя огня', text: 'Серия 7 дней', test: () => S.bestStreak >= 7 },
    { id: 'streak30', icon: '🌋', title: 'Вулкан', text: 'Серия 30 дней', test: () => S.bestStreak >= 30 },
    { id: 'xp100', icon: '⭐', title: 'Сотка', text: 'Набери 100 XP', test: () => S.xp >= 100 },
    { id: 'xp1000', icon: '🌟', title: 'Тысячник', text: 'Набери 1000 XP', test: () => S.xp >= 1000 },
    { id: 'perfect5', icon: '💯', title: 'Перфекционист', text: '5 уроков без ошибок', test: () => S.perfect >= 5 },
    { id: 'combo10', icon: '⚡', title: 'Комбо-мастер', text: '10 правильных подряд', test: () => S.bestCombo >= 10 },
    { id: 'fix10', icon: '🛠️', title: 'Над ошибками', text: 'Исправь 10 ошибок', test: () => S.fixed >= 10 },
    { id: 'boss', icon: '👑', title: 'Покоритель', text: 'Сдай экзамен по теме', test: () => S.bosses >= 1 },
    { id: 'excellent', icon: '🅰️', title: 'Отличник', text: 'Сдай экзамен на 5', test: () => S.fives >= 1 },
    { id: 'final', icon: '🎓', title: 'Выпускник', text: 'Сдай итоговый экзамен', test: () => S.finals >= 1 },
    { id: 'all', icon: '🎓', title: 'Универсал', text: 'Уроки по всем предметам', test: () => MB.subjects.every(s => S.subjPlayed[s.id]) },
    { id: 'rich', icon: '💎', title: 'Богач', text: 'Накопи 500 кристаллов', test: () => S.gems >= 500 },
    { id: 'fashion', icon: '👗', title: 'Модник', text: 'Собери 5 вещей для Бума', test: () => S.owned.filter(id => id !== 'purple').length >= 5 },
    { id: 'treasure', icon: '🗝️', title: 'Кладоискатель', text: 'Открой золотой сундук', test: () => S.play.opened.includes('gold') },
  ];
  function checkAchievements() {
    const fresh = [];
    for (const a of ACH) {
      if (!S.achievements[a.id] && a.test()) { S.achievements[a.id] = Date.now(); S.gems += 10; fresh.push(a); }
    }
    return fresh;
  }

  // ---------- Путь уроков ----------
  // Каждая тема заканчивается экзаменом, предмет — итоговым экзаменом.
  const finalUnit = subj => ({ id: subj.id + '-final', title: 'Итоговый экзамен', desc: 'Вся программа 7 класса по предмету', lessons: [] });
  function pathOf(subj) {
    const list = [];
    subj.units.forEach((u, ui) => {
      u.lessons.forEach((l, li) => list.push({ key: `${u.id}:${li}`, unit: u, ui, title: l.title, pool: l.pool, boss: false }));
      list.push({ key: `${u.id}:boss`, unit: u, ui, title: 'Экзамен по теме', pool: u.lessons.flatMap(l => l.pool), boss: true, size: EXAM_SIZE });
    });
    list.push({ key: `${subj.id}:final`, unit: finalUnit(subj), ui: subj.units.length, title: 'Итоговый экзамен', boss: true, final: true,
      pool: subj.units.flatMap(u => u.lessons.flatMap(l => l.pool)), size: FINAL_SIZE });
    return list;
  }
  const stars = key => (S.progress[key] && S.progress[key].stars) || 0;
  // уровень закрыт, если он дальше первого непройденного (в режиме разработчика открыто всё)
  function isLocked(path, e) {
    if (isDev() || stars(e.key)) return false;
    const curIdx = path.findIndex(x => !stars(x.key));
    return curIdx !== -1 && path.indexOf(e) > curIdx;
  }

  // ---------- Режим разработчика ----------
  // Включается ссылкой с ?dev, выключается ?nodev или кнопкой в профиле. Хранится отдельно от прогресса.
  const DEV_KEY = 'mozgobum-dev';
  try {
    const p = new URLSearchParams(location.search);
    if (p.has('dev')) localStorage.setItem(DEV_KEY, '1');
    if (p.has('nodev')) localStorage.removeItem(DEV_KEY);
    if (p.has('dev') || p.has('nodev')) history.replaceState(null, '', location.pathname);
  } catch (e) { /* без хранилища режим недоступен */ }
  function isDev() { try { return localStorage.getItem(DEV_KEY) === '1'; } catch (e) { return false; } }

  // ---------- Вопросы ----------
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const qid = q => hash(q.type + q.q + JSON.stringify(q.opts ? q.opts[q.a] : [q.a, q.pairs, q.items, q.tokens, q.words]));

  function prep(clean) {
    const q = JSON.parse(JSON.stringify(clean));
    q._raw = JSON.stringify(clean);
    q._id = qid(clean);
    if (q.type === 'choice') q._order = shuffle(q.opts.map((_, i) => i));
    if (q.type === 'match') { q._left = shuffle(q.pairs.map((_, i) => i)); q._right = shuffle(q.pairs.map((_, i) => i)); }
    if (q.type === 'sort') q._items = shuffle(q.items.map((_, i) => i));
    if (q.type === 'order') {
      let bank = shuffle(q.items), guard = 0;
      while (bank.join('|') === q.items.join('|') && guard++ < 10) bank = shuffle(q.items);
      q._bank = bank;
    }
    return q;
  }

  function buildQuestions(pool, count) {
    const out = [], seen = new Set();
    let bag = [], guard = 0;
    while (out.length < count && guard++ < count * 25) {
      if (!bag.length) bag = shuffle(pool);
      const item = bag.pop();
      const q = typeof item === 'function' ? item() : item;
      const id = qid(q);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(prep(q));
    }
    return out;
  }

  const normalize = s => String(s).toLowerCase().replace(/ё/g, 'е').replace(/−|–/g, '-').replace(/\s+/g, '').replace(',', '.');
  function matchInput(value, answer) {
    const answers = Array.isArray(answer) ? answer : [answer];
    const v = normalize(value);
    return answers.some(a => {
      const t = normalize(a);
      if (/^-?\d+(\.\d+)?$/.test(t)) {
        const num = parseFloat(v.match(/^-?\d+(\.\d+)?/) ? v.match(/^-?\d+(\.\d+)?/)[0] : NaN);
        return Math.abs(num - parseFloat(t)) < 1e-9;
      }
      return v === t;
    });
  }
  const isNumeric = q => q.type === 'input' && /^-?\d+([.,]\d+)?$/.test(String(Array.isArray(q.a) ? q.a[0] : q.a));
  const shownAnswer = q => {
    if (q.type === 'choice') return q.opts[q.a];
    if (q.type === 'input') return String(Array.isArray(q.a) ? q.a[0] : q.a).replace('.', ',').replace(/^-/, '−') + (q.unit ? ' ' + q.unit : '');
    if (q.type === 'order') return q.items.join(' → ');
    if (q.type === 'tf') return q.a ? 'верно' : 'неверно';
    if (q.type === 'find') return q.fix ? `${q.tokens[q.a]} → ${q.fix}` : q.tokens[q.a];
    if (q.type === 'sort') return q.groups.map((g, gi) => `${g}: ${q.items.filter(it => it[1] === gi).map(it => it[0]).join(', ')}`).join('; ');
    if (q.type === 'commas') return q.words.map((w, i) => w + (q.a.includes(i) ? ',' : '')).join(' ');
    return '';
  };

  // ---------- Ошибки (интервальное повторение) ----------
  function addMistake(q, subj) {
    const id = q._id, clean = JSON.parse(q._raw);
    const ex = S.mistakes.find(m => m.id === id);
    if (ex) { ex.box = 0; ex.due = Date.now(); return; }
    S.mistakes.unshift({ id, q: clean, due: Date.now(), box: 0, subj, at: Date.now() });
    if (S.mistakes.length > 200) S.mistakes.length = 200;
  }
  function reviewHit(q, ok) {
    const m = S.mistakes.find(x => x.id === q._id);
    if (!m) return;
    if (!ok) { m.box = 0; m.due = Date.now(); return; }
    if (m.box >= 1) {
      S.mistakes = S.mistakes.filter(x => x !== m);
      S.fixed++;
    } else {
      m.box = 1;
      m.due = Date.now() + 20 * 3600 * 1000; // вернётся завтра
    }
    quest('fix', 1);
  }
  const dueMistakes = () => S.mistakes.filter(m => m.due <= Date.now());

  // ---------- Бустеры ----------
  const BOOSTS = {
    shield: { icon: '🛡️', title: 'Щит', text: 'Ошибка не отнимет сердце (срабатывает сам)', price: 40 },
    fifty:  { icon: '🔮', title: 'Подсказка 50/50', text: 'Убирает два неверных варианта', price: 30 },
    x2:     { icon: '⚡', title: 'Зелье x2 XP', text: '15 минут двойного опыта', price: 80 },
  };
  const X2_MS = 15 * 60 * 1000;
  const x2Left = () => Math.max(0, S.boost.x2Until - Date.now());
  const fmtMin = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms % 60000 / 1000)).padStart(2, '0')}`;
  function boostChips() {
    return [
      x2Left() ? `<span class="chip x2">⚡ x2 XP · ${fmtMin(x2Left())}</span>` : '',
      S.boost.shield && L && L.mode !== 'review' ? `<span class="chip shield">🛡️ ${S.boost.shield}</span>` : '',
    ].join('');
  }
  function refreshBoosts() { const el = $('.boost-chips'); if (el) el.innerHTML = boostChips(); }
  function drinkX2() {
    if (!S.boost.x2) return;
    S.boost.x2--;
    S.boost.x2Until = Math.max(Date.now(), S.boost.x2Until) + X2_MS;
    save(); MB.sound.play('combo'); toast('⚡ Двойной опыт на 15 минут!');
  }

  // ---------- Сундуки за время игры ----------
  // Время копится, пока решаешь задания (не больше 90 секунд на одно задание).
  const CHESTS = [
    { id: 'bronze', min: 10, title: 'Бронзовый сундук', color: '#d08c4b' },
    { id: 'silver', min: 20, title: 'Серебряный сундук', color: '#9aa7b8' },
    { id: 'gold', min: 30, title: 'Золотой сундук', color: '#ffc800' },
  ];
  function ensurePlayDay() { if (S.play.day !== today()) S.play = { day: today(), ms: 0, opened: [] }; }
  function addPlayTime(ms) { ensurePlayDay(); S.play.ms += Math.max(0, ms); }
  const playMin = () => { ensurePlayDay(); return S.play.ms / 60000; };
  const chestsReady = () => CHESTS.filter(c => playMin() >= c.min && !S.play.opened.includes(c.id));
  let chestOpen = null;      // открытый сундук: { chest, rewards }

  function rollChest(c) {
    const r = [];
    const giveBoost = (k, n = 1) => { S.boost[k] += n; r.push({ icon: BOOSTS[k].icon, text: `${BOOSTS[k].title} ×${n}` }); };
    const giveGems = n => { S.gems += n; r.push({ icon: '💎', text: `${n} кристаллов` }); };
    if (c.id === 'bronze') { giveGems(15); giveBoost(pick(['shield', 'fifty'])); }
    if (c.id === 'silver') { giveGems(30); giveBoost('x2'); giveBoost('shield'); }
    if (c.id === 'gold') {
      giveGems(50); giveBoost('fifty', 2);
      const rare = Object.keys(MB.ITEMS).filter(id => MB.ITEMS[id].rare && !S.owned.includes(id));
      if (rare.length) {
        const id = pick(rare);
        S.owned.push(id);
        r.push({ icon: '✨', text: `Редкая вещь: ${MB.ITEMS[id].title}`, item: id });
      } else giveGems(100);
    }
    return r;
  }
  function openChest(id) {
    const c = CHESTS.find(x => x.id === id);
    if (!c) return;
    if (S.play.opened.includes(c.id)) { toast('Этот сундук уже открыт сегодня. Завтра будет новый!'); return; }
    if (playMin() < c.min) { toast(`${c.title} откроется через ${Math.ceil(c.min - playMin())} мин игры`); return; }
    S.play.opened.push(c.id);
    const rewards = rollChest(c);
    checkAchievements(); save();
    chestOpen = { chest: c, rewards };
    MB.sound.play('finish');
    render();
    setTimeout(() => confetti(90), 700);
  }
  function chestWidget() {
    const m = playMin(), pct = Math.min(100, m / 30 * 100);
    const next = CHESTS.find(c => m < c.min);
    return `<div class="card chests">
      <div class="ch-head"><b>🎁 Сундуки за игру</b><span>${Math.floor(Math.min(m, 30))} / 30 мин</span></div>
      <div class="ch-track"><div class="ch-fill" style="width:${pct}%"></div>
        ${CHESTS.map(c => {
          const st = S.play.opened.includes(c.id) ? 'opened' : m >= c.min ? 'ready' : 'locked';
          return `<button class="chest ${st}" style="left:${c.min / 30 * 100}%;--cc:${c.color}" data-act="chest" data-id="${c.id}" title="${c.title}">
            <span>${st === 'opened' ? '✓' : '🎁'}</span><small>${c.min} мин</small></button>`;
        }).join('')}
      </div>
      <p class="ch-note">${chestsReady().length ? 'Сундук готов — нажми, чтобы открыть!' : next ? `До следующего сундука ${Math.ceil(next.min - m)} мин игры` : 'Все сундуки на сегодня открыты. Завтра будут новые!'}</p>
    </div>`;
  }
  function chestModal() {
    const { chest, rewards } = chestOpen;
    return `<div class="sheet-bg" data-act="chest-close"><div class="sheet chest-modal" data-act="noop" style="--cc:${chest.color};--c:var(--gold);--cd:var(--gold-d)">
      <div class="big-chest">🎁</div>
      <h2>${chest.title}</h2>
      <div class="rewards">${rewards.map((r, i) => `<div class="reward" style="animation-delay:${0.5 + i * 0.25}s">
        ${r.item ? `<div class="rw-m">${MB.mascot('wow', { ...S.look, [MB.ITEMS[r.item].slot]: r.item })}</div>` : `<span class="rw-i">${r.icon}</span>`}<b>${r.text}</b></div>`).join('')}</div>
      <button class="btn big gold" data-act="chest-close">Забрать</button>
    </div></div>`;
  }

  // ---------- Навигация ----------
  let view = 'learn';
  let sheet = null;          // открытая карточка урока
  let L = null;              // текущий урок
  let onboardStep = 0;

  function go(v) { view = v; sheet = null; render(); window.scrollTo(0, 0); }

  // ---------- Шапка и меню ----------
  const NAV = [
    ['learn', '🏠', 'Учиться'], ['review', '🎯', 'Ошибки'], ['quests', '📜', 'Задания'], ['shop', '🛒', 'Магазин'], ['profile', '😎', 'Профиль'],
  ];
  function badge(id) {
    if (id === 'review') { const n = dueMistakes().length; return n ? `<span class="badge">${n}</span>` : ''; }
    if (id === 'quests') { const n = claimable(); return n ? '<span class="badge dot">!</span>' : ''; }
    return '';
  }
  function goalRing(size = 34) {
    const pct = Math.min(1, todayXp() / S.goal), r = 15, c = 2 * Math.PI * r;
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 36 36"><circle cx="18" cy="18" r="${r}" class="ring-bg"/>
      <circle cx="18" cy="18" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"/>
      <text x="18" y="22" text-anchor="middle">${pct >= 1 ? '✓' : Math.round(pct * 100)}</text></svg>`;
  }
  function topbar() {
    const played = S.lastDay === today();
    return `<header class="topbar">
      <div class="brand mobile-only">${MB.mascot('happy', S.look)}<span>Мозгобум</span></div>
      ${isDev() ? '<span class="dev-tag" title="Режим разработчика">DEV</span>' : ''}
      <div class="stats">
        <div class="stat streak ${played ? 'on' : ''}" title="Серия дней"><span class="ico">🔥</span><b>${S.streak}</b></div>
        <div class="stat gems" title="Кристаллы"><span class="ico">💎</span><b>${S.gems}</b></div>
        <div class="stat hearts" title="${S.hearts < MAX_HEARTS ? 'Следующее сердце через ' + minsToHeart() + ' мин' : 'Сердца полные'}"><span class="ico">❤️</span><b>${S.hearts}</b></div>
        <div class="stat goal mobile-only" title="Цель дня">${goalRing(30)}</div>
      </div>
    </header>`;
  }
  function shell(content) {
    return `<div class="shell">
      <nav class="sidebar">
        <div class="brand">${MB.mascot('happy', S.look)}<span>Мозгобум</span></div>
        ${NAV.map(([id, ic, t]) => `<button class="nav-item ${view === id ? 'active' : ''}" data-act="nav" data-v="${id}"><span class="ico">${ic}</span><span>${t}</span>${badge(id)}</button>`).join('')}
      </nav>
      <main class="main">${topbar()}<div class="content">${content}</div></main>
      <aside class="rail">${rail()}</aside>
      <nav class="tabbar">
        ${NAV.map(([id, ic, t]) => `<button class="tab ${view === id ? 'active' : ''}" data-act="nav" data-v="${id}"><span class="ico">${ic}</span><span class="t">${t}</span>${badge(id)}</button>`).join('')}
      </nav>
    </div>${sheet ? sheetHtml() : ''}${chestOpen ? chestModal() : ''}${theoryOpen ? theoryModal() : ''}`;
  }
  let theoryOpen = null;     // id темы, теорию которой читают
  function theoryModal() {
    const subj = MB.subjects.find(s => s.units.some(u => u.id === theoryOpen));
    const u = subj && subj.units.find(x => x.id === theoryOpen);
    if (!u) return '';
    const first = !S.theoryRead.includes(u.id);
    return `<div class="sheet-bg" data-act="theory-close"><div class="sheet theory" data-act="noop" style="--c:${subj.color};--cd:${subj.dark}">
      <div class="kicker">📖 Теория · ${subj.title}</div>
      <h2>${u.title}</h2>
      <div class="theory-body">${u.theory}</div>
      <button class="btn big" data-act="theory-read" data-u="${u.id}">${first ? 'Понятно! +5 💎' : 'Понятно!'}</button>
    </div></div>`;
  }
  function rail() {
    const due = dueMistakes().length;
    return `${chestWidget()}
      <div class="card widget">
        <div class="w-head"><span>Цель дня</span><button class="link" data-act="nav" data-v="profile">изменить</button></div>
        <div class="goal-line">${goalRing(52)}<div><b>${Math.min(todayXp(), S.goal)} / ${S.goal} XP</b><small>${todayXp() >= S.goal ? 'Выполнено! 🎉' : 'осталось ' + (S.goal - todayXp()) + ' XP'}</small></div></div>
      </div>
      <div class="card widget">
        <div class="w-head"><span>Задания дня</span><button class="link" data-act="nav" data-v="quests">все</button></div>
        ${S.quests.list.map(q => `<div class="mini-quest"><span>${esc(q.text)}</span><div class="pbar"><div style="width:${q.progress / q.target * 100}%"></div></div></div>`).join('')}
      </div>
      ${due ? `<div class="card widget review-w"><b>🎯 ${due} ${plural(due, ['ошибка ждёт', 'ошибки ждут', 'ошибок ждут'])} повторения</b><button class="btn small" data-act="review-start">Повторить</button></div>` : ''}
    `;
  }

  // ---------- Экран «Учиться» ----------
  const OFF = [0, 46, 72, 46, 0, -46, -72, -46];
  function mascotLine() {
    const due = dueMistakes().length;
    if (S.lastDay !== today()) return S.streak ? `Не дай серии сгореть! Пройди урок — будет 🔥 ${S.streak + 1}` : 'Пройди урок — и начнём серию дней 🔥';
    if (todayXp() < S.goal) return `До цели дня ${S.goal - todayXp()} XP. Погнали!`;
    if (due) return `Цель выполнена! А ещё есть ${due} ${plural(due, ['ошибка', 'ошибки', 'ошибок'])} для повторения 😉`;
    return pick(['Цель дня выполнена! Ты машина 💪', 'Мозг прокачан на сегодня! Но можно ещё 😏', 'Красота! Завтра продолжим?']);
  }
  function learnView() {
    const subj = subjById(S.subject), path = pathOf(subj);
    const curIdx = path.findIndex(e => !stars(e.key));
    let html = `<div class="subj-tabs">${MB.subjects.map(s => `<button class="subj ${s.id === subj.id ? 'active' : ''}" style="--c:${s.color};--cd:${s.dark}" data-act="subj" data-s="${s.id}"><span>${s.icon}</span>${s.title}</button>`).join('')}</div>
      <div class="hello"><div class="hello-m">${MB.mascot(S.lastDay === today() ? 'happy' : 'wow', S.look)}</div><div class="bubble">${mascotLine()}</div></div>
      <div class="map-chests">${chestWidget()}</div>
      ${x2Left() ? `<div class="x2-banner">⚡ Двойной опыт активен ещё ${Math.ceil(x2Left() / 60000)} мин</div>` : ''}`;
    [...subj.units, finalUnit(subj)].forEach((u, ui) => {
      const items = path.filter(e => e.ui === ui);
      const done = items.filter(e => stars(e.key)).length;
      const isFinal = ui === subj.units.length;
      html += `<section class="unit ${isFinal ? 'final' : ''}" style="--c:${subj.color};--cd:${subj.dark}">
        <div class="unit-head"><div><div class="kicker">${isFinal ? '🎓 Финал' : 'Тема ' + (ui + 1)}</div><h3>${u.title}</h3><p>${u.desc}</p></div><div class="unit-prog">${done}/${items.length}</div></div>
        ${u.theory ? `<button class="theory-cloud ${S.theoryRead.includes(u.id) ? 'read' : ''}" data-act="theory" data-u="${u.id}">
          <span>📖</span>${S.theoryRead.includes(u.id) ? 'Теория' : 'Теория · +5 💎'}</button>` : ''}
        <div class="path">`;
      items.forEach(e => {
        const i = path.indexOf(e), st = stars(e.key);
        const locked = isLocked(path, e), current = i === curIdx;
        const cls = [e.boss ? 'boss' : '', e.final ? 'final' : '', st ? 'done' : '', locked ? 'locked' : '', current ? 'current' : ''].join(' ');
        const icon = locked ? '🔒' : e.final ? '🏆' : e.boss ? '👑' : st ? '✓' : '★';
        const off = OFF[i % OFF.length];
        html += `<div class="node-row" style="--x:${off}px">
          ${current ? `<div class="start-bubble">${stars(path[0].key) ? 'ДАЛЬШЕ' : 'СТАРТ'}</div>` : ''}
          <button class="node ${cls}" data-act="node" data-k="${e.key}" aria-label="${esc(e.title)}">${icon}</button>
          ${st ? `<div class="node-stars">${'★'.repeat(st)}<span>${'★'.repeat(3 - st)}</span></div>` : ''}
          ${current ? `<div class="node-mascot ${off >= 0 ? 'left' : 'right'}">${MB.mascot('happy', S.look)}</div>` : ''}
        </div>`;
      });
      html += '</div></section>';
    });
    if (curIdx === -1) html += '<div class="card finish-all">🏆 Ты прошёл все темы предмета! Повторяй уроки, чтобы не забыть.</div>';
    return html;
  }
  function sheetHtml() {
    const subj = subjById(S.subject), path = pathOf(subj);
    const e = path.find(x => x.key === sheet);
    if (!e) return '';
    const locked = isLocked(path, e), st = stars(e.key);
    const best = S.progress[e.key] && S.progress[e.key].grade;
    const examText = `<p>${e.size} заданий из ${e.final ? 'всех тем предмета' : 'всей темы'}. Сердца не тратятся, но ошибки не повторяются.
      Нужно ${Math.round(EXAM_PASS * 100)}% правильных — это оценка 4 или 5.</p>
      <div class="grade-scale"><span class="g2">2</span><span class="g3">3</span><span class="g4">4 ✓</span><span class="g5">5 ✓</span></div>`;
    let action;
    if (!locked) action = `<button class="btn big" data-act="start" data-k="${e.key}">${st ? 'Пересдать' : 'Начать'} · +${e.final ? 50 : e.boss ? 20 : 10} XP</button>`;
    else if (e.boss) action = `<button class="btn big" data-act="start" data-k="${e.key}" data-jump="1">⏩ Сдать досрочно</button>
      <small class="muted center">Сдашь на 4 или 5 — все уровни до этого экзамена засчитаются, и можно идти дальше.</small>`;
    else action = '<button class="btn big gray" disabled>🔒 Сначала пройди предыдущие уровни</button>';
    if (!e.boss && !locked) action = action.replace('Пересдать', 'Повторить');
    return `<div class="sheet-bg" data-act="close-sheet"><div class="sheet" data-act="noop" style="--c:${subj.color};--cd:${subj.dark}">
      <div class="kicker">${subj.icon} ${subj.title} · ${e.final ? 'Финал' : `Тема ${e.ui + 1}: ${e.unit.title}`}</div>
      <h2>${e.final ? '🏆 ' : e.boss ? '👑 ' : ''}${esc(e.title)}</h2>
      ${e.boss ? examText : `<p>${LESSON_SIZE} заданий. Ошибки попадут в «Работу над ошибками».</p>`}
      ${best ? `<p>Лучшая оценка: <b class="grade-inline g${best}">${best}</b></p>` : st ? `<div class="sheet-stars">${'★'.repeat(st)}<span>${'★'.repeat(3 - st)}</span></div>` : ''}
      ${action}
      ${isDev() ? `<div class="dev-row"><span class="dev-tag">DEV</span>
        <button class="btn small ghost" data-act="dev-done" data-k="${e.key}">✅ Засчитать</button>
        <button class="btn small ghost" data-act="dev-upto" data-k="${e.key}">⏩ Засчитать всё до сюда</button></div>` : ''}
    </div></div>`;
  }

  // ---------- Урок ----------
  function startLesson(entry, jump = false) {
    syncHearts();
    if (!entry.boss && S.hearts <= 0) { L = null; go('fail'); return; }
    L = newLesson(entry.boss ? 'exam' : 'lesson', buildQuestions(entry.pool, entry.boss ? entry.size : LESSON_SIZE));
    L.jump = jump;
    L.entry = entry;
    L.subj = S.subject;
    sheet = null;
    view = 'lesson';
    render();
  }
  function startReview() {
    const due = dueMistakes().slice(0, REVIEW_SIZE);
    if (!due.length) { toast('Сейчас нечего повторять — молодец! 👌'); return; }
    L = newLesson('review', due.map(m => prep(m.q)));
    L.subj = due[0].subj;
    view = 'lesson';
    render();
  }
  function newLesson(mode, queue) {
    L = { mode, queue, idx: 0, total: queue.length, done: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0,
      start: Date.now(), wait: 0, chestsBefore: chestsReady().length };
    resetQuestionState();
    return L;
  }
  function resetQuestionState() {
    Object.assign(L, { state: 'answer', sel: null, ord: [], match: { left: null, done: [], err: 0 }, sort: { sel: null, place: {} }, commas: [],
      shielded: false, fiftyUsed: false, qStart: Date.now() });
  }

  function lessonView() {
    const q = L.queue[L.idx];
    const pct = L.done / L.total * 100;
    const titles = { choice: 'Выбери ответ', input: 'Впиши ответ', match: 'Найди пары', order: 'Расставь по порядку',
      tf: 'Верно или нет?', find: q.lines ? 'Найди ошибку в решении' : 'Найди ошибку', sort: 'Разложи по группам', commas: 'Расставь запятые' };
    const side = L.mode === 'review' ? '<div class="lhearts review-tag">🎯</div>'
      : L.mode === 'exam' ? `<div class="lhearts exam-tag">📝 <b>${Math.min(L.idx + 1, L.total)}/${L.total}</b></div>`
      : `<div class="lhearts">❤️ <b>${S.hearts}</b></div>`;
    const label = L.mode === 'review' ? '🎯 Работа над ошибками · ' : L.mode === 'exam' ? (L.entry.final ? '🏆 Итоговый экзамен · ' : '👑 Экзамен · ') : '';
    return `<div class="lesson ${L.mode}">
      <div class="lesson-top">
        <button class="icon-btn" data-act="quit" aria-label="Выйти">✕</button>
        <div class="lbar"><div style="width:${pct}%"></div></div>
        ${side}
        ${isDev() ? '<button class="icon-btn dev-skip" data-act="dev-skip" title="Засчитать задание (DEV)">⏭</button>' : ''}
      </div>
      <div class="boost-chips">${boostChips()}</div>
      <div class="combo-slot">${L.combo >= 3 ? `<div class="combo-badge">🔥 ${L.combo} подряд!</div>` : ''}</div>
      <div class="qcard" key="${L.idx}">
        <div class="qtype">${label}${titles[q.type]}</div>
        <div class="q-head"><div class="q-mascot">${MB.mascot('happy', S.look)}</div><h2 class="qtext">${q.q}</h2></div>
        <div class="qbody">${bodyHtml(q)}</div>
      </div>
      <div class="lesson-foot" id="foot">${footHtml(q)}</div>
    </div>`;
  }
  function bodyHtml(q) {
    if (q.type === 'choice') {
      const canFifty = q.opts.length >= 3 && L.mode === 'lesson';
      return `<div class="opts ${q.opts.length <= 2 ? 'two' : ''}">${q._order.map((oi, k) => `<button class="opt" data-act="opt" data-i="${oi}"><span class="key">${k + 1}</span><span class="txt">${q.opts[oi]}</span></button>`).join('')}</div>
        ${canFifty ? `<button class="boost-btn" data-act="fifty" ${S.boost.fifty ? '' : 'disabled'}>🔮 Подсказка 50/50 <b>${S.boost.fifty}</b></button>` : ''}`;
    }
    if (q.type === 'input') {
      const numeric = isNumeric(q);
      return `<div class="inp-wrap">
        ${numeric ? '<button class="neg-btn" data-act="neg" title="Поставить или убрать минус">±</button>' : ''}
        <input id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="${numeric ? 'decimal' : 'text'}" placeholder="Твой ответ">
        ${q.unit ? `<span class="u-suf">${q.unit}</span>` : ''}
      </div>`;
    }
    if (q.type === 'match') {
      const m = L.match;
      return `<div class="match">
        <div class="mcol">${q._left.map(i => `<button class="mbtn ${m.done.includes(i) ? 'gone' : ''} ${m.left === i ? 'sel' : ''}" data-act="ml" data-i="${i}">${q.pairs[i][0]}</button>`).join('')}</div>
        <div class="mcol">${q._right.map(i => `<button class="mbtn ${m.done.includes(i) ? 'gone' : ''}" data-act="mr" data-i="${i}">${q.pairs[i][1]}</button>`).join('')}</div>
      </div>`;
    }
    if (q.type === 'tf') {
      return `<div class="tf"><button class="tf-btn yes" data-act="tf" data-v="1"><span>✓</span>Верно</button><button class="tf-btn no" data-act="tf" data-v="0"><span>✗</span>Неверно</button></div>`;
    }
    if (q.type === 'find') {
      return `<div class="find ${q.lines ? 'lines' : ''}">${q.tokens.map((t, i) => `<button class="tok" data-act="tok" data-i="${i}">${t}</button>`).join('')}</div>`;
    }
    if (q.type === 'sort') {
      const s = L.sort, free = q._items.filter(i => !(i in s.place));
      return `<div class="sort">
        <div class="spool">${free.length ? free.map(i => `<button class="tile ${s.sel === i ? 'sel' : ''}" data-act="sitem" data-i="${i}">${q.items[i][0]}</button>`).join('')
          : '<span class="ohint">Все разложены — жми «Проверить»</span>'}</div>
        <div class="sgroups">${q.groups.map((g, gi) => `<div class="sgroup ${s.sel !== null ? 'armed' : ''}" data-act="sgroup" data-g="${gi}">
          <div class="sg-title">${g}</div>
          <div class="sg-items">${q._items.filter(i => s.place[i] === gi).map(i => `<button class="tile small" data-act="sback" data-i="${i}">${q.items[i][0]}</button>`).join('')}</div>
        </div>`).join('')}</div>
        <span class="ohint">Нажми на слово, потом на группу</span>
      </div>`;
    }
    if (q.type === 'commas') {
      return `<div class="commas">${q.words.map((w, i) => `<span class="cw">${w}${i < q.words.length - 1
        ? `<button class="gap ${L.commas.includes(i) ? 'on' : ''}" data-act="gap" data-i="${i}" aria-label="Запятая после «${w}»">${L.commas.includes(i) ? ',' : ''}</button>` : ''}</span>`).join(' ')}</div>
        <span class="ohint">Нажимай между словами, чтобы поставить или убрать запятую</span>`;
    }
    // order
    return `<div class="order">
      <div class="oans">${L.ord.length ? L.ord.map((bi, k) => `<button class="tile" data-act="oa" data-k="${k}">${q._bank[bi]}</button>`).join('') : '<span class="ohint">Нажимай на карточки снизу по порядку</span>'}</div>
      <div class="obank">${q._bank.map((w, bi) => `<button class="tile ${L.ord.includes(bi) ? 'used' : ''}" data-act="ob" data-i="${bi}">${w}</button>`).join('')}</div>
    </div>`;
  }
  function canCheck(q) {
    if (q.type === 'choice') return L.sel !== null;
    if (q.type === 'input') { const el = $('#ans'); return !!(el && el.value.trim()); }
    if (q.type === 'order') return L.ord.length === q.items.length;
    if (q.type === 'sort') return Object.keys(L.sort.place).length === q.items.length;
    if (q.type === 'commas') return true;
    if (q.type === 'tf' || q.type === 'find') return L.sel !== null;
    return false;
  }
  function footHtml(q) {
    if (L.state === 'answer') {
      if (q.type === 'match') return '<div class="foot-inner"><span class="foot-hint">Нажми на слово слева, потом на пару справа</span></div>';
      if (q.type === 'choice' || q.type === 'tf') return '<div class="foot-inner"><span class="foot-hint">Нажми на правильный ответ</span></div>';
      if (q.type === 'find') return `<div class="foot-inner"><span class="foot-hint">Нажми на ${q.lines ? 'строку' : 'слово'} с ошибкой</span></div>`;
      return `<div class="foot-inner"><button class="btn big" id="checkBtn" data-act="check" ${canCheck(q) ? '' : 'disabled'}>Проверить</button></div>`;
    }
    const ok = L.lastOk;
    const praise = pick(['Отлично!', 'Супер!', 'Точно!', 'Красава!', 'Мощно!', 'Так держать!', 'Огонь!', 'Верно!', 'Гений!']);
    const out = S.hearts <= 0 && L.mode === 'lesson' && !ok;
    return `<div class="foot-inner fb ${ok ? 'ok' : 'bad'}">
      <div class="fb-body">
        <div class="fb-title">${ok ? '✅ ' + praise : '❌ ' + pick(['Не совсем…', 'Почти!', 'Ошибочка'])}</div>
        ${!ok && q.type !== 'match' ? `<div class="fb-ans">Правильно: <b>${shownAnswer(q)}</b></div>` : ''}
        ${q.ex && (!ok || q.type === 'match') ? `<div class="fb-ex">${q.ex}</div>` : ''}
        ${L.shielded ? '<div class="fb-shield">🛡️ Щит спас сердце!</div>' : ''}
        ${!ok && L.mode === 'lesson' ? '<div class="fb-note">Вопрос вернётся в конце урока и попадёт в «Ошибки».</div>' : ''}
        ${!ok && L.mode === 'exam' ? '<div class="fb-note">Ошибка попадёт в «Работу над ошибками».</div>' : ''}
      </div>
      <button class="btn big next-btn ${ok ? '' : 'red'}" data-act="next">${out ? 'Ой…' : 'Дальше'}<i class="auto-bar" style="animation-duration:${L.wait}ms"></i></button>
    </div>`;
  }
  function refreshFoot() {
    const q = L.queue[L.idx], f = $('#foot');
    if (f) f.innerHTML = footHtml(q);
  }
  function refreshBody() {
    const q = L.queue[L.idx], b = $('.qbody');
    if (b) b.innerHTML = bodyHtml(q);
    refreshFoot();
  }

  function check() {
    if (!L || L.state !== 'answer') return;
    const q = L.queue[L.idx];
    if (!canCheck(q)) return;
    let ok = false;
    if (q.type === 'choice') ok = Number(L.sel) === q.a;
    else if (q.type === 'input') ok = matchInput($('#ans').value, q.a);
    else if (q.type === 'order') ok = L.ord.every((bi, k) => q._bank[bi] === q.items[k]);
    else if (q.type === 'tf') ok = (L.sel === '1') === q.a;
    else if (q.type === 'find') ok = Number(L.sel) === q.a;
    else if (q.type === 'sort') ok = q.items.every((it, i) => L.sort.place[i] === it[1]);
    else if (q.type === 'commas') ok = L.commas.slice().sort((a, b) => a - b).join() === q.a.slice().sort((a, b) => a - b).join();
    answer(ok);
  }
  function answer(ok) {
    const q = L.queue[L.idx];
    L.state = 'feedback';
    L.lastOk = ok;
    const exam = L.mode === 'exam';
    if (ok) {
      L.combo++; L.correct++; L.done++;
      L.maxCombo = Math.max(L.maxCombo, L.combo);
      S.correctTotal++;
      quest('correct', 1); quest('combo', L.combo);
      if (L.mode === 'review') reviewHit(q, true);
      MB.sound.play(L.combo >= 3 && L.combo % 5 === 0 ? 'combo' : 'correct');
    } else {
      L.combo = 0; L.wrong++;
      if (L.mode === 'review') reviewHit(q, false);
      else if (exam) { addMistake(q, L.subj); L.done++; }   // на экзамене без сердец и без повтора
      else {
        if (S.boost.shield > 0) { S.boost.shield--; L.shielded = true; }
        else loseHeart();
        addMistake(q, L.subj);
      }
      if (!exam) L.queue.push(prep(JSON.parse(q._raw)));
      MB.sound.play('wrong');
      if (navigator.vibrate) navigator.vibrate(120);
    }
    save();
    // подсветка ответа без перерисовки карточки
    if (q.type === 'choice') {
      document.querySelectorAll('.opt').forEach(b => {
        const i = Number(b.dataset.i);
        b.disabled = true;
        b.classList.remove('sel');
        if (i === q.a) b.classList.add('right');
        else if (i === Number(L.sel)) b.classList.add('wrong');
      });
    }
    if (q.type === 'input') { const el = $('#ans'); el.disabled = true; el.classList.add(ok ? 'right' : 'wrong'); }
    if (q.type === 'order') $('.oans').classList.add(ok ? 'right' : 'wrong');
    if (q.type === 'tf') document.querySelectorAll('.tf-btn').forEach(b => {
      b.disabled = true;
      if ((b.dataset.v === '1') === q.a) b.classList.add('right'); else b.classList.add(ok ? 'dim' : 'wrong');
    });
    if (q.type === 'find') document.querySelectorAll('.tok').forEach(b => {
      const i = Number(b.dataset.i); b.disabled = true;
      if (i === q.a) b.classList.add('right'); else if (i === Number(L.sel)) b.classList.add('wrong');
    });
    if (q.type === 'sort') document.querySelectorAll('.sg-items .tile').forEach(b => {
      const i = Number(b.dataset.i); b.disabled = true;
      b.classList.add(L.sort.place[i] === q.items[i][1] ? 'right' : 'wrong');
    });
    if (q.type === 'commas') document.querySelectorAll('.gap').forEach(b => {
      const i = Number(b.dataset.i), need = q.a.includes(i), put = L.commas.includes(i);
      b.disabled = true;
      if (need) { b.textContent = ','; b.classList.add(put ? 'right' : 'missed'); }
      else if (put) b.classList.add('wrong');
    });
    const qm = $('.q-mascot');
    if (qm) { qm.innerHTML = MB.mascot(ok ? (L.combo >= 3 ? 'wow' : 'happy') : 'sad', S.look); qm.classList.remove('hop'); void qm.offsetWidth; qm.classList.add('hop'); }
    const card = $('.qcard');
    if (card) { card.classList.remove('shake', 'pop'); void card.offsetWidth; card.classList.add(ok ? 'pop' : 'shake'); }
    const lb = $('.lbar > div'); if (lb) lb.style.width = (L.done / L.total * 100) + '%';
    const lh = $('.lhearts b'); if (lh) lh.textContent = S.hearts;
    const cs = $('.combo-slot'); if (cs) cs.innerHTML = L.combo >= 3 ? `<div class="combo-badge">🔥 ${L.combo} подряд!</div>` : '';
    refreshBoosts();
    // автопереход: на правильный ответ быстро, на ошибку — успеть прочитать объяснение
    L.wait = ok ? 1200 : Math.min(9000, 3500 + (q.ex || '').length * 30);
    refreshFoot();
    const cur = L;
    L.timer = setTimeout(() => { if (L === cur && L.state === 'feedback') next(); }, L.wait);
  }
  function next() {
    if (!L || L.state !== 'feedback') return;
    clearTimeout(L.timer);
    addPlayTime(Math.min(Date.now() - L.qStart, 90000));
    if (S.hearts <= 0 && L.mode === 'lesson') { MB.sound.play('fail'); L = null; go('fail'); return; }
    L.idx++;
    resetQuestionState();
    if (L.idx >= L.queue.length) { finish(); return; }
    render();
    const inp = $('#ans'); if (inp && matchMedia('(pointer: fine)').matches) inp.focus();
  }

  function finish() {
    const t = today(), before = todayXp(), perfect = L.wrong === 0;
    let xp, gems;
    if (L.mode === 'review') {
      xp = 5 + L.correct; gems = 3;
      S.hearts = Math.min(MAX_HEARTS, S.hearts + 1);
    } else if (L.mode === 'exam') {
      const pct = L.correct / Math.max(1, L.total);
      const grade = pct >= 0.9 ? 5 : pct >= EXAM_PASS ? 4 : pct >= 0.5 ? 3 : 2;
      const passed = grade >= 4, big = L.entry.final;
      Object.assign(L, { grade, passed, pct: Math.round(pct * 100) });
      xp = passed ? (big ? 50 : 20) + (grade === 5 ? 10 : 0) : 5;
      gems = passed ? (big ? 50 : 15) + (grade === 5 ? 10 : 0) : 0;
      const old = S.progress[L.entry.key] || { stars: 0, plays: 0 };
      if (passed) {
        const st = grade === 5 ? 3 : 2;
        S.progress[L.entry.key] = { stars: Math.max(old.stars, st), plays: old.plays + 1, grade: Math.max(old.grade || 0, grade) };
        L.stars = st;
        // досрочная сдача засчитывает все уровни до экзамена
        if (L.jump) {
          const path = pathOf(subjById(L.subj)), upto = path.findIndex(x => x.key === L.entry.key);
          path.slice(0, upto).forEach(x => { if (!stars(x.key)) S.progress[x.key] = { stars: 1, plays: 0 }; });
        }
        S.bosses++;
        if (grade === 5) S.fives++;
        if (big) S.finals++;
      } else {
        S.progress[L.entry.key] = { ...old, plays: old.plays + 1, grade: Math.max(old.grade || 0, grade) };
        if (!old.stars) S.progress[L.entry.key].stars = 0;
      }
      if (perfect) { S.perfect++; quest('perfect', 1); }
      S.lessons++;
      S.subjPlayed[L.subj] = true;
      quest('lessons', 1); quest('subj:' + L.subj, 1);
    } else {
      const bonus = Math.floor(L.maxCombo / 5) * 2;
      xp = 10 + (perfect ? 5 : 0) + bonus;
      gems = 5 + (perfect ? 5 : 0);
      const st = L.wrong === 0 ? 3 : L.wrong <= 2 ? 2 : 1;
      const old = S.progress[L.entry.key] || { stars: 0, plays: 0 };
      S.progress[L.entry.key] = { ...old, stars: Math.max(old.stars, st), plays: old.plays + 1 };
      L.stars = st;
      S.lessons++;
      if (perfect) { S.perfect++; quest('perfect', 1); }
      S.subjPlayed[L.subj] = true;
      quest('lessons', 1); quest('subj:' + L.subj, 1);
    }
    const doubled = x2Left() > 0;
    if (doubled) xp *= 2;
    S.xp += xp; S.gems += gems;
    S.days[t] = before + xp;
    quest('xp', xp);
    S.bestCombo = Math.max(S.bestCombo, L.maxCombo);
    const streakUp = bumpStreak();
    const fresh = checkAchievements();
    save();
    L.result = { xp, gems, perfect, streakUp, goalJust: before < S.goal && before + xp >= S.goal, fresh, doubled,
      chestNew: chestsReady().length > L.chestsBefore,
      acc: Math.round(L.correct / Math.max(1, L.correct + L.wrong) * 100), time: Math.round((Date.now() - L.start) / 1000) };
    if (L.mode === 'exam' && !L.passed) { MB.sound.play('fail'); go('result'); return; }
    MB.sound.play('finish');
    go('result');
    confetti();
  }

  // ---------- Экраны после урока ----------
  function resultView() {
    const r = L.result, mm = Math.floor(r.time / 60), ss = String(r.time % 60).padStart(2, '0');
    const exam = L.mode === 'exam';
    const title = exam ? (L.passed ? (L.entry.final ? 'Итоговый экзамен сдан!' : 'Экзамен сдан!') : 'Экзамен не сдан')
      : L.mode === 'review' ? 'Ошибки повторены!' : r.perfect ? 'Идеально!' : 'Урок пройден!';
    const gradeWord = { 5: 'Отлично', 4: 'Хорошо', 3: 'Удовлетворительно', 2: 'Неудовлетворительно' };
    return `<div class="full-screen result ${exam && !L.passed ? 'failed' : ''}">
      <div class="big-mascot ${exam && !L.passed ? '' : 'jump'}">${MB.mascot(exam && !L.passed ? 'sad' : r.perfect ? 'wow' : 'happy', S.look)}</div>
      <h1>${title}</h1>
      ${exam ? `<div class="grade-big g${L.grade}"><b>${L.grade}</b><span>${gradeWord[L.grade]}</span></div>
        <p>Правильно ${L.correct} из ${L.total} (${L.pct}%). ${L.passed ? (L.jump ? 'Все уровни до экзамена засчитаны — вперёд!' : 'Тема закрыта!') : `Нужно ${Math.round(EXAM_PASS * 100)}%. Повтори уроки темы и пересдай — ошибки уже ждут в «Работе над ошибками».`}</p>` : ''}
      ${L.stars && !exam ? `<div class="stars-big">${[1, 2, 3].map(i => `<span class="${i <= L.stars ? 'on' : ''}" style="animation-delay:${i * 0.18}s">★</span>`).join('')}</div>` : ''}
      <div class="tiles">
        <div class="rtile t-xp"><span>Опыт</span><b data-count="${r.xp}">+0</b></div>
        <div class="rtile t-acc"><span>Точность</span><b>${r.acc}%</b></div>
        <div class="rtile t-time"><span>Время</span><b>${mm}:${ss}</b></div>
      </div>
      <div class="earned">+${r.gems} 💎 ${L.mode === 'review' ? ' · +1 ❤️' : ''} ${L.maxCombo >= 5 ? ` · лучшее комбо 🔥${L.maxCombo}` : ''}</div>
      ${r.doubled ? '<div class="ach-pop x2">⚡ Двойной опыт сработал!</div>' : ''}
      ${r.chestNew ? '<div class="ach-pop chest">🎁 Ты наиграл на сундук! Открой его на карте</div>' : ''}
      ${r.fresh.map(a => `<div class="ach-pop">${a.icon} Достижение: <b>${a.title}</b> · +10 💎</div>`).join('')}
      <button class="btn big" data-act="res-continue">Продолжить</button>
    </div>`;
  }
  function streakView() {
    const r = L.result;
    const days = [];
    const now = new Date(), dow = (now.getDay() + 6) % 7; // 0 = понедельник
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() - (dow - i) * DAY);
      const k = dayKey(d);
      days.push({ name: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i], on: (S.days[k] || 0) > 0, today: i === dow, future: i > dow });
    }
    return `<div class="full-screen streak-screen">
      <div class="flame">🔥</div>
      <div class="streak-num">${S.streak}</div>
      <h1>${plural(S.streak, ['день', 'дня', 'дней'])} подряд!</h1>
      <div class="week">${days.map(d => `<div class="wd ${d.on ? 'on' : ''} ${d.today ? 'today' : ''} ${d.future ? 'future' : ''}"><span>${d.name}</span><i>${d.on ? '✓' : ''}</i></div>`).join('')}</div>
      <p>${r.goalJust ? '🎯 Цель дня выполнена! ' : ''}Заходи завтра, чтобы серия росла.${S.freezes ? ` У тебя ${S.freezes} 🧊 заморозки на случай пропуска.` : ''}</p>
      <button class="btn big orange" data-act="streak-continue">Продолжить</button>
    </div>`;
  }
  function failView() {
    syncHearts();
    const due = dueMistakes().length;
    return `<div class="full-screen fail">
      <div class="big-mascot">${MB.mascot('sad', S.look)}</div>
      <h1>Сердца закончились</h1>
      <p>Новое сердце появится через <b>${minsToHeart()} мин</b>. А пока можно заработать его, повторив ошибки.</p>
      ${due ? '<button class="btn big" data-act="review-start">🎯 Повторить ошибки · +1 ❤️</button>' : ''}
      <button class="btn big blue" data-act="buy" data-item="hearts" ${S.gems >= 50 ? '' : 'disabled'}>Восстановить за 50 💎</button>
      <button class="btn big ghost" data-act="nav" data-v="learn">На карту</button>
    </div>`;
  }

  // ---------- Ошибки ----------
  function reviewView() {
    const due = dueMistakes(), later = S.mistakes.length - due.length;
    const subjIcon = id => (MB.subjects.find(s => s.id === id) || { icon: '❔' }).icon;
    return `<h1 class="page-title">Работа над ошибками</h1>
      <div class="card review-hero">
        <div class="rh-m">${MB.mascot(due.length ? 'wow' : 'happy', S.look)}</div>
        <div>
          <h2>${due.length ? `${due.length} ${plural(due.length, ['задание ждёт', 'задания ждут', 'заданий ждут'])} повторения` : 'Всё повторено!'}</h2>
          <p>Ошибка уходит из списка, когда ответишь правильно два раза: сегодня и в другой день. Так запоминается надолго.${later ? ` Ещё ${later} вернутся позже.` : ''}</p>
          <button class="btn" data-act="review-start" ${due.length ? '' : 'disabled'}>Начать повторение · +1 ❤️</button>
        </div>
      </div>
      ${S.mistakes.length ? `<h3 class="sec">Мои ошибки</h3><div class="mlist">${S.mistakes.slice(0, 30).map(m => `<div class="mrow">
        <span class="mi">${subjIcon(m.subj)}</span><span class="mq">${String(m.q.q).replace(/<br>/g, ' ')}</span>
        <span class="mtag ${m.due <= Date.now() ? 'now' : ''}">${m.due <= Date.now() ? 'сейчас' : 'завтра'}</span></div>`).join('')}</div>` : '<p class="muted center">Ошибок пока нет. Они появятся, когда ошибёшься в уроке — и это нормально!</p>'}`;
  }

  // ---------- Задания ----------
  function questsView() {
    const ms = new Date(); ms.setHours(24, 0, 0, 0);
    const left = ms - Date.now(), h = Math.floor(left / 3600000), m = Math.floor(left % 3600000 / 60000);
    return `<h1 class="page-title">Задания дня</h1>
      <p class="muted">Обновятся через ${h} ч ${m} мин</p>
      <div class="quests">${S.quests.list.map((q, i) => {
        const done = q.progress >= q.target;
        return `<div class="card quest ${q.claimed ? 'claimed' : done ? 'ready' : ''}">
          <div class="q-ico">${q.claimed ? '✅' : done ? '🎁' : '📜'}</div>
          <div class="q-main"><b>${esc(q.text)}</b><div class="pbar big"><div style="width:${q.progress / q.target * 100}%"></div><span>${q.progress} / ${q.target}</span></div></div>
          ${q.claimed ? '<span class="q-rew">получено</span>' : done ? `<button class="btn small gold" data-act="claim" data-i="${i}">+${q.reward} 💎</button>` : `<span class="q-rew">${q.reward} 💎</span>`}
        </div>`;
      }).join('')}</div>
      <h3 class="sec">Достижения</h3>${achGrid()}`;
  }
  const achGrid = () => `<div class="ach-grid">${ACH.map(a => `<div class="ach ${S.achievements[a.id] ? 'got' : ''}"><div class="a-ico">${a.icon}</div><b>${a.title}</b><small>${a.text}</small></div>`).join('')}</div>`;

  // ---------- Магазин ----------
  function shopView() {
    return `<h1 class="page-title">Магазин</h1>
      <p class="muted">У тебя ${S.gems} 💎. Кристаллы дают за уроки, задания дня и достижения.</p>
      <div class="shop">
        <div class="card item"><div class="i-ico">❤️</div><div class="i-main"><b>Полные сердца</b><small>Сразу ${MAX_HEARTS} сердец</small></div>
          <button class="btn small blue" data-act="buy" data-item="hearts" ${S.hearts >= MAX_HEARTS || S.gems < 50 ? 'disabled' : ''}>${S.hearts >= MAX_HEARTS ? 'полные' : '50 💎'}</button></div>
        <div class="card item"><div class="i-ico">🧊</div><div class="i-main"><b>Заморозка серии</b><small>Спасёт серию, если пропустишь день. Есть: ${S.freezes}/2</small></div>
          <button class="btn small blue" data-act="buy" data-item="freeze" ${S.freezes >= 2 || S.gems < 100 ? 'disabled' : ''}>${S.freezes >= 2 ? 'максимум' : '100 💎'}</button></div>
      </div>
      <h3 class="sec">Бустеры</h3>
      <div class="card inventory">
        ${Object.entries(BOOSTS).map(([k, b]) => `<div class="inv"><span class="inv-i">${b.icon}</span><b>${S.boost[k]}</b><small>${b.title}</small></div>`).join('')}
        <button class="btn small orange" data-act="drink" ${S.boost.x2 ? '' : 'disabled'}>${x2Left() ? `⚡ ещё ${Math.ceil(x2Left() / 60000)} мин · продлить` : '⚡ Выпить зелье x2'}</button>
      </div>
      <div class="shop">${Object.entries(BOOSTS).map(([k, b]) => `<div class="card item"><div class="i-ico">${b.icon}</div><div class="i-main"><b>${b.title}</b><small>${b.text}</small></div>
          <button class="btn small blue" data-act="buy" data-item="boost:${k}" ${S.gems < b.price ? 'disabled' : ''}>${b.price} 💎</button></div>`).join('')}</div>
      <h3 class="sec">Гардероб Бума</h3>
      ${wardrobe()}`;
  }
  let wardSlot = 'sets';
  let pokes = 0;
  // образ надевается «начисто»: остальные слоты снимаются, цвет тела остаётся
  const setLook = set => {
    const look = { hat: null, face: null, neck: null, hand: null, skin: S.look.skin };
    set.items.forEach(i => { look[MB.ITEMS[i].slot] = i; });
    return look;
  };
  const setPrice = set => Math.round(set.items.filter(id => !S.owned.includes(id)).reduce((s, id) => s + (MB.ITEMS[id].price || 0), 0) * 0.8);
  function wardrobe() {
    const top = `<div class="card ward-top">
        <div class="ward-m">${MB.mascot('happy', S.look)}</div>
        <div class="seg ward-tabs">${MB.SLOTS.map(([id, ic, t]) => `<button class="${wardSlot === id ? 'on' : ''}" data-act="ward" data-slot="${id}">${ic}<small>${t}</small></button>`).join('')}</div>
      </div>`;
    if (wardSlot === 'sets') {
      return `${top}<div class="hats">${Object.entries(MB.SETS).map(([id, set]) => {
        const look = setLook(set);
        const worn = set.items.every(i => S.look[MB.ITEMS[i].slot] === i);
        const price = setPrice(set);
        return `<div class="card hat set ${worn ? 'worn' : ''}"><div class="hat-m">${MB.mascot('happy', look)}</div><b>${set.icon} ${set.title}</b>
          ${price ? `<button class="btn small gold" data-act="buy-set" data-set="${id}" ${S.gems < price ? 'disabled' : ''}>${price} 💎 <s>${Math.round(price / 0.8)}</s></button>`
            : `<button class="btn small ${worn ? 'ghost' : ''}" data-act="wear-set" data-set="${id}" ${worn ? 'disabled' : ''}>${worn ? 'Надето' : 'Надеть образ'}</button>`}
        </div>`;
      }).join('')}</div>`;
    }
    const items = Object.entries(MB.ITEMS).filter(([id, it]) => it.slot === wardSlot && (!it.secret || S.owned.includes(id)));
    return `${top}
      <div class="hats">${items.map(([id, it]) => {
        const owned = S.owned.includes(id), worn = S.look[it.slot] === id;
        const preview = { ...S.look, [it.slot]: id };
        let btn;
        if (owned) btn = it.slot === 'skin' && worn ? '<button class="btn small ghost" disabled>Надето</button>'
          : `<button class="btn small ${worn ? 'ghost' : ''}" data-act="wear" data-id="${id}">${worn ? 'Снять' : 'Надеть'}</button>`;
        else if (it.rare) btn = '<span class="rare-note">🎁 только из золотого сундука</span>';
        else btn = `<button class="btn small gold" data-act="buy" data-item="item:${id}" ${S.gems < it.price ? 'disabled' : ''}>${it.price} 💎</button>`;
        return `<div class="card hat ${worn ? 'worn' : ''} ${it.rare || it.secret ? 'rare' : ''}">${it.secret ? '<span class="rare-tag secret">секрет</span>' : it.rare ? '<span class="rare-tag">редкое</span>' : ''}
          <div class="hat-m">${MB.mascot('happy', preview)}</div><b>${it.title}</b>${btn}</div>`;
      }).join('')}</div>`;
  }

  // ---------- Профиль ----------
  function profileView() {
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY);
      week.push({ label: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()], xp: S.days[dayKey(d)] || 0 });
    }
    const max = Math.max(S.goal, ...week.map(w => w.xp));
    const done = Object.values(S.progress).filter(p => p.stars).length;
    return `<div class="card profile-hero">
        <div class="ph-m" data-act="poke">${MB.mascot('happy', S.look)}</div>
        <div><h1>${esc(S.name || 'Игрок')}</h1><p class="muted">В игре с ${new Date(S.since).toLocaleDateString('ru-RU')}</p></div>
      </div>
      <div class="stat-grid">
        <div class="card sg"><span>🔥</span><b>${S.streak}</b><small>серия дней</small></div>
        <div class="card sg"><span>🏅</span><b>${S.bestStreak}</b><small>лучшая серия</small></div>
        <div class="card sg"><span>⚡</span><b>${S.xp}</b><small>всего XP</small></div>
        <div class="card sg"><span>📚</span><b>${done}</b><small>уровней пройдено</small></div>
        <div class="card sg"><span>💯</span><b>${S.perfect}</b><small>без ошибок</small></div>
        <div class="card sg"><span>🛠️</span><b>${S.fixed}</b><small>ошибок исправлено</small></div>
      </div>
      <h3 class="sec">Опыт за неделю</h3>
      <div class="card chart">${week.map(w => `<div class="bar-col"><div class="bar-v">${w.xp || ''}</div><div class="bar" style="height:${Math.max(4, w.xp / max * 120)}px;${w.xp >= S.goal ? '' : 'opacity:.55'}"></div><small>${w.label}</small></div>`).join('')}
        <div class="goal-line-chart" style="bottom:${28 + S.goal / max * 120}px"><span>цель</span></div></div>
      <h3 class="sec">Настройки</h3>
      <div class="card settings">
        <div class="set-row"><span>Цель дня</span><div class="seg">${[[10, 'Легко'], [20, 'Норм'], [30, 'Серьёзно'], [50, 'Жёстко']].map(([g, t]) => `<button class="${S.goal === g ? 'on' : ''}" data-act="goal" data-g="${g}">${t}<small>${g} XP</small></button>`).join('')}</div></div>
        <div class="set-row"><span>Звук</span><button class="toggle ${S.sound ? 'on' : ''}" data-act="sound" aria-label="Звук"><i></i></button></div>
        <div class="set-row"><span>Имя</span><button class="btn small ghost" data-act="rename">${esc(S.name || 'Игрок')} ✏️</button></div>
        <div class="set-row col"><span>Перенос прогресса на другое устройство</span>
          <small class="muted">Входа нет, поэтому прогресс живёт в этом браузере. Скопируй код здесь и вставь на телефоне (или наоборот).</small>
          <div class="row-btns"><button class="btn small" data-act="export">Скопировать код</button><button class="btn small ghost" data-act="import">Вставить код</button></div>
          <textarea id="exportBox" class="export" readonly hidden></textarea></div>
        <div class="set-row"><span>Начать заново</span><button class="btn small red" data-act="reset">Сбросить прогресс</button></div>
      </div>
      ${isDev() ? `<h3 class="sec">🛠️ Режим разработчика</h3>
      <div class="card settings dev-panel">
        <p class="muted">Все уровни открыты, в уроке есть кнопка ⏭ (засчитать задание), в карточке уровня — «Засчитать».</p>
        <div class="row-btns">
          <button class="btn small" data-act="dev-gems">+1000 💎</button>
          <button class="btn small" data-act="dev-hearts">❤️ Полные сердца</button>
          <button class="btn small" data-act="dev-boost">+5 бустеров</button>
          <button class="btn small" data-act="dev-time">+10 мин игры</button>
          <button class="btn small" data-act="dev-chests">Сундуки заново</button>
          <button class="btn small" data-act="dev-items">Все вещи</button>
          <button class="btn small ghost" data-act="dev-map-reset">Сбросить карту</button>
          <button class="btn small red" data-act="dev-off">Выключить режим</button>
        </div>
      </div>` : ''}`;
  }

  // ---------- Знакомство ----------
  function onboardView() {
    if (onboardStep === 0) {
      return `<div class="full-screen onboard">
        <div class="big-mascot jump">${MB.mascot('wow')}</div>
        <h1>Привет! Я Бум 👋</h1>
        <p>Я помогу прокачать мозг по программе 7 класса: математика, русский, физика. Пара минут в день — и ты легенда.</p>
        <input id="nameInp" class="name-inp" maxlength="20" placeholder="Как тебя зовут?" value="${esc(S.name)}">
        <button class="btn big" data-act="ob-next">Дальше</button>
      </div>`;
    }
    return `<div class="full-screen onboard">
      <div class="big-mascot">${MB.mascot('happy')}</div>
      <h1>${S.name ? esc(S.name) + ', с' : 'С'}колько заниматься в день?</h1>
      <div class="goals">${[[10, 'Легко', '~3 мин'], [20, 'Нормально', '~6 мин'], [30, 'Серьёзно', '~10 мин'], [50, 'Жёстко', '~15 мин']].map(([g, t, m]) =>
        `<button class="goal-card ${S.goal === g ? 'on' : ''}" data-act="ob-goal" data-g="${g}"><b>${t}</b><span>${m} · ${g} XP</span></button>`).join('')}</div>
      <button class="btn big" data-act="ob-done">Поехали! 🚀</button>
    </div>`;
  }

  // ---------- Отрисовка ----------
  function render() {
    MB.sound.enabled = S.sound;
    document.body.className = 'v-' + view;
    if (!S.onboarded) { document.body.className = 'v-onboard'; app.innerHTML = onboardView(); return; }
    if (view === 'lesson' && L) { app.innerHTML = lessonView(); return; }
    if (view === 'result' && L) { app.innerHTML = resultView(); countUp(); return; }
    if (view === 'streak' && L) { app.innerHTML = streakView(); return; }
    if (view === 'fail') { app.innerHTML = failView(); return; }
    if (['lesson', 'result', 'streak'].includes(view)) view = 'learn';
    const pages = { learn: learnView, review: reviewView, quests: questsView, shop: shopView, profile: profileView };
    app.innerHTML = shell((pages[view] || learnView)());
    if (view === 'learn' && !sheet) scrollToCurrent();
  }
  let scrolledOnce = false;
  function scrollToCurrent() {
    if (scrolledOnce) return;
    scrolledOnce = true;
    const cur = $('.node.current');
    if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150);
  }
  function countUp() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = Number(el.dataset.count), t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / 900);
        el.textContent = '+' + Math.round(target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // ---------- Действия ----------
  const ACT = {
    nav: el => { if (el.dataset.v === 'learn') scrolledOnce = false; go(el.dataset.v); },
    subj: el => { S.subject = el.dataset.s; save(); scrolledOnce = false; render(); MB.sound.play('tap'); },
    node: el => { sheet = el.dataset.k; render(); MB.sound.play('tap'); },
    'close-sheet': () => { sheet = null; render(); },
    noop: () => {},
    start: el => { const e = pathOf(subjById(S.subject)).find(x => x.key === el.dataset.k); if (e) startLesson(e, el.dataset.jump === '1'); },
    tf: el => { if (L.state !== 'answer') return; L.sel = el.dataset.v; check(); },
    tok: el => { if (L.state !== 'answer') return; L.sel = el.dataset.i; check(); },
    sitem: el => { if (L.state !== 'answer') return; const i = Number(el.dataset.i); L.sort.sel = L.sort.sel === i ? null : i; MB.sound.play('tap'); refreshBody(); },
    sgroup: el => {
      if (L.state !== 'answer' || L.sort.sel === null) return;
      L.sort.place[L.sort.sel] = Number(el.dataset.g); L.sort.sel = null;
      MB.sound.play('tap'); refreshBody();
    },
    sback: el => { if (L.state !== 'answer') return; delete L.sort.place[Number(el.dataset.i)]; refreshBody(); },
    gap: el => {
      if (L.state !== 'answer') return;
      const i = Number(el.dataset.i), k = L.commas.indexOf(i);
      if (k >= 0) L.commas.splice(k, 1); else L.commas.push(i);
      MB.sound.play('tap'); refreshBody();
    },
    theory: el => { theoryOpen = el.dataset.u; render(); MB.sound.play('tap'); },
    'theory-close': () => { theoryOpen = null; render(); },
    'theory-read': el => {
      if (!S.theoryRead.includes(el.dataset.u)) { S.theoryRead.push(el.dataset.u); S.gems += 5; toast('📖 +5 💎 за изучение теории'); MB.sound.play('coin'); }
      theoryOpen = null; save(); render();
    },
    // ----- режим разработчика -----
    'dev-skip': () => { if (L && L.state === 'answer') answer(true); },
    'dev-done': el => { S.progress[el.dataset.k] = { stars: 3, plays: 0, grade: 5 }; save(); sheet = null; render(); toast('DEV: засчитано'); },
    'dev-upto': el => {
      const path = pathOf(subjById(S.subject)), upto = path.findIndex(x => x.key === el.dataset.k);
      path.slice(0, upto + 1).forEach(x => { S.progress[x.key] = { stars: 3, plays: 0, grade: x.boss ? 5 : undefined }; });
      save(); sheet = null; render(); toast('DEV: всё до этого уровня засчитано');
    },
    'dev-gems': () => { S.gems += 1000; save(); render(); },
    'dev-hearts': () => { S.hearts = MAX_HEARTS; save(); render(); },
    'dev-boost': () => { Object.keys(BOOSTS).forEach(k => { S.boost[k] += 5; }); save(); render(); },
    'dev-time': () => { addPlayTime(10 * 60000); save(); render(); toast('DEV: +10 минут игры'); },
    'dev-chests': () => { ensurePlayDay(); S.play.opened = []; save(); render(); },
    'dev-items': () => { Object.keys(MB.ITEMS).forEach(id => { if (!S.owned.includes(id)) S.owned.push(id); }); save(); render(); },
    'dev-map-reset': () => { if (confirm('DEV: сбросить пройденные уровни?')) { S.progress = {}; save(); render(); } },
    'dev-off': () => { try { localStorage.removeItem(DEV_KEY); } catch (e) { /* нет хранилища */ } render(); toast('Режим разработчика выключен'); },
    quit: () => {
      if (L.mode !== 'review' && !confirm('Выйти из урока? Прогресс этого урока пропадёт.')) return;
      const back = L.mode === 'review' ? 'review' : 'learn';
      clearTimeout(L.timer);
      L = null; go(back);
    },
    // выбор варианта сразу проверяется — без кнопки «Проверить»
    opt: el => {
      if (L.state !== 'answer') return;
      L.sel = el.dataset.i;
      check();
    },
    neg: () => { const el = $('#ans'); if (!el || el.disabled) return; el.value = el.value.startsWith('-') ? el.value.slice(1) : '-' + el.value; el.focus(); refreshFoot(); },
    check,
    next,
    ml: el => { if (L.state !== 'answer') return; L.match.left = Number(el.dataset.i); document.querySelectorAll('.mcol:first-child .mbtn').forEach(b => b.classList.toggle('sel', b === el)); MB.sound.play('tap'); },
    mr: el => {
      if (L.state !== 'answer' || L.match.left === null) return;
      const q = L.queue[L.idx], r = Number(el.dataset.i);
      if (r === L.match.left) {
        L.match.done.push(r); L.match.left = null;
        MB.sound.play('tap');
        refreshBody();
        if (L.match.done.length === q.pairs.length) answer(true);
      } else {
        L.match.err++;
        const lb = document.querySelector(`.mcol:first-child .mbtn[data-i="${L.match.left}"]`);
        [el, lb].forEach(b => { if (!b) return; b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); });
        MB.sound.play('wrong');
      }
    },
    ob: el => { if (L.state !== 'answer') return; const i = Number(el.dataset.i); if (L.ord.includes(i)) return; L.ord.push(i); MB.sound.play('tap'); refreshBody(); },
    oa: el => { if (L.state !== 'answer') return; L.ord.splice(Number(el.dataset.k), 1); refreshBody(); },
    'res-continue': () => {
      if (L.result.streakUp || L.result.goalJust) { view = 'streak'; render(); MB.sound.play('combo'); }
      else ACT['streak-continue']();
    },
    'streak-continue': () => { const back = L.mode === 'review' ? 'review' : 'learn'; L = null; scrolledOnce = false; go(back); },
    'review-start': startReview,
    claim: el => {
      const q = S.quests.list[Number(el.dataset.i)];
      if (!q || q.claimed || q.progress < q.target) return;
      q.claimed = true; S.gems += q.reward;
      checkAchievements(); save();
      MB.sound.play('coin'); confetti(60);
      toast(`+${q.reward} 💎 за задание!`);
      render();
    },
    buy: el => {
      const item = el.dataset.item;
      if (item === 'hearts' && S.gems >= 50 && S.hearts < MAX_HEARTS) { S.gems -= 50; S.hearts = MAX_HEARTS; toast('❤️ Сердца восстановлены!'); }
      else if (item === 'freeze' && S.gems >= 100 && S.freezes < 2) { S.gems -= 100; S.freezes++; toast('🧊 Заморозка куплена'); }
      else if (item.startsWith('item:')) {
        const id = item.slice(5), it = MB.ITEMS[id];
        if (!it || it.rare || it.secret || S.owned.includes(id) || S.gems < it.price) return;
        S.gems -= it.price; S.owned.push(id); S.look[it.slot] = id;
        toast(`Бум примерил: ${it.title}!`); confetti(50);
      } else if (item.startsWith('boost:')) {
        const k = item.slice(6), b = BOOSTS[k];
        if (!b || S.gems < b.price) return;
        S.gems -= b.price; S.boost[k]++;
        toast(`${b.icon} ${b.title} +1`);
      } else return;
      MB.sound.play('coin'); save();
      if (view === 'fail') go('learn'); else render();
    },
    wear: el => {
      const id = el.dataset.id, it = MB.ITEMS[id];
      if (!it || !S.owned.includes(id)) return;
      if (it.slot === 'skin') S.look.skin = id;
      else S.look[it.slot] = S.look[it.slot] === id ? null : id;
      save(); render(); MB.sound.play('tap');
    },
    ward: el => { wardSlot = el.dataset.slot; render(); MB.sound.play('tap'); },
    'buy-set': el => {
      const set = MB.SETS[el.dataset.set], price = set && setPrice(set);
      if (!set || !price || S.gems < price) return;
      S.gems -= price;
      set.items.forEach(id => { if (!S.owned.includes(id)) S.owned.push(id); });
      S.look = setLook(set);
      checkAchievements(); save();
      MB.sound.play('coin'); confetti(70); toast(`${set.icon} Образ «${set.title}» твой!`);
      render();
    },
    'wear-set': el => {
      const set = MB.SETS[el.dataset.set];
      if (!set || !set.items.every(id => S.owned.includes(id))) return;
      S.look = setLook(set);
      save(); render(); MB.sound.play('tap');
    },
    // секрет: 7 раз ткнуть в Бума в профиле
    poke: el => {
      pokes++;
      el.innerHTML = MB.mascot(pokes % 2 ? 'wow' : 'happy', S.look);
      el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop');
      MB.sound.play('tap');
      if (pokes >= 7 && !S.owned.includes('lexin')) {
        S.owned.push('lexin'); S.look.face = 'lexin'; save();
        MB.sound.play('finish'); confetti(160);
        toast('🤫 Секретная вещь найдена: Очки Максима Лексина!');
        setTimeout(render, 400);
      }
    },
    drink: () => { drinkX2(); render(); },
    fifty: el => {
      const q = L && L.queue[L.idx];
      if (!q || L.state !== 'answer' || L.fiftyUsed || !S.boost.fifty || q.type !== 'choice') return;
      S.boost.fifty--; L.fiftyUsed = true; save();
      const wrong = shuffle(q.opts.map((_, i) => i).filter(i => i !== q.a)).slice(0, q.opts.length >= 4 ? 2 : 1);
      wrong.forEach(i => { const b = document.querySelector(`.opt[data-i="${i}"]`); if (b) { b.disabled = true; b.classList.add('gone'); } });
      el.disabled = true; el.querySelector('b').textContent = S.boost.fifty;
      MB.sound.play('coin');
    },
    chest: el => openChest(el.dataset.id),
    'chest-close': () => { chestOpen = null; render(); },
    goal: el => {
      S.goal = Number(el.dataset.g);
      const xq = S.quests.list.find(q => q.kind === 'xp' && !q.claimed);
      if (xq) { xq.target = S.goal; xq.text = `Набери ${S.goal} XP`; xq.progress = Math.min(todayXp(), S.goal); }
      save(); render();
    },
    sound: () => { S.sound = !S.sound; save(); render(); MB.sound.play('tap'); },
    rename: () => { const n = prompt('Как тебя зовут?', S.name); if (n !== null) { S.name = n.trim().slice(0, 20); save(); render(); } },
    export: async () => {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
      const box = $('#exportBox'); box.hidden = false; box.value = code; box.select();
      try { await navigator.clipboard.writeText(code); toast('Код скопирован! Вставь его на другом устройстве.'); }
      catch (e) { toast('Скопируй код из поля ниже'); }
    },
    import: () => {
      const code = prompt('Вставь код прогресса:');
      if (!code) return;
      try {
        const data = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
        if (typeof data.xp !== 'number') throw new Error('bad');
        if (!confirm('Заменить текущий прогресс на загруженный?')) return;
        S = Object.assign(defaults(), data); save(); toast('Прогресс загружен ✅'); render();
      } catch (e) { alert('Код не подошёл. Проверь, что скопирован целиком.'); }
    },
    reset: () => { if (confirm('Точно стереть весь прогресс? Это нельзя отменить.')) { localStorage.removeItem(KEY); S = defaults(); onboardStep = 0; view = 'learn'; render(); } },
    'ob-next': () => { S.name = ($('#nameInp').value || '').trim().slice(0, 20); onboardStep = 1; render(); },
    'ob-goal': el => { S.goal = Number(el.dataset.g); render(); MB.sound.play('tap'); },
    'ob-done': () => { S.onboarded = true; S.quests.day = ''; ensureQuests(); save(); MB.sound.play('finish'); confetti(); render(); },
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (fn) fn(el, e);
  });
  document.addEventListener('input', e => { if (e.target.id === 'ans' && L && L.state === 'answer') refreshFoot(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'nameInp') { ACT['ob-next'](); return; }
    if (view !== 'lesson' || !L) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (L.state === 'answer') check(); else next();
      return;
    }
    if (e.target.tagName === 'INPUT') return;
    const q = L.queue[L.idx];
    if (L.state === 'answer' && q.type === 'tf' && /^[12]$/.test(e.key)) {
      ACT.tf({ dataset: { v: e.key === '1' ? '1' : '0' } });
      return;
    }
    if (L.state === 'answer' && q.type === 'choice' && /^[1-4]$/.test(e.key)) {
      const btn = document.querySelectorAll('.opt')[Number(e.key) - 1];
      if (btn && !btn.disabled) ACT.opt(btn);
    }
  });

  // ---------- Мелочи: тосты и конфетти ----------
  function toast(text) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    $('#toast-layer').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }
  function confetti(count = 140) {
    const c = $('#confetti'), ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const colors = ['#ff8a00', '#1cb0f6', '#a560ff', '#58cc02', '#ffc800', '#ff4b9b'];
    const parts = Array.from({ length: count }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
      r: Math.random() * 6 + 4, a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.3, c: pick(colors),
    }));
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
      }
      if (t - t0 < 3000) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })(t0);
  }

  // ---------- Старт ----------
  if (location.hostname === 'localhost') window.__mb = { lesson: () => L, state: () => S }; // для отладки
  syncHearts();
  checkStreak();
  ensureQuests();
  save();
  render();
  setInterval(() => {
    const before = S.hearts;
    syncHearts();
    if (S.hearts !== before) { save(); if (!['lesson', 'result', 'streak'].includes(view)) render(); }
  }, 30000);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
