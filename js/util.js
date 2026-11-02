// Общие помощники для генераторов заданий. Подключается первым.
window.MB = { subjects: [] };

MB.R = {
  int(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; },
  // целое из [a, b], не равное нулю
  nz(a, b) { let n; do { n = MB.R.int(a, b); } while (n === 0); return n; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
};

MB.F = {
  // число для показа: минус типографский, дробная часть через запятую
  n(x) {
    const s = String(Math.round(x * 1e6) / 1e6).replace('.', ',');
    return s.startsWith('-') ? '−' + s.slice(1) : s;
  },
  // отрицательное число в скобках: 3 · (−2)
  p(x) { return x < 0 ? '(' + MB.F.n(x) + ')' : MB.F.n(x); },
  sup(base, e) { return `${base}<sup>${e}</sup>`; },
  frac(a, b) {
    if (b === 1 || a === 0) return MB.F.n(a);
    const neg = a * b < 0;
    return `${neg ? '−' : ''}<span class="frac"><span>${Math.abs(a)}</span><span>${Math.abs(b)}</span></span>`;
  },
  gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; },
  // сокращённая дробь как пара [числитель, знаменатель]
  reduce(a, b) { const g = MB.F.gcd(a, b); if (b < 0) { a = -a; b = -b; } return [a / g, b / g]; },
  // член многочлена: coef, переменная, первый ли он в записи
  term(c, v, first) {
    if (c === 0) return '';
    const abs = Math.abs(c);
    const body = (abs === 1 && v) ? v : abs + (v || '');
    if (first) return (c < 0 ? '−' : '') + body;
    return (c < 0 ? ' − ' : ' + ') + body;
  },
  poly(terms) { // [[coef, var], ...]
    let out = '', first = true;
    for (const [c, v] of terms) {
      if (c === 0) continue;
      out += MB.F.term(c, v, first);
      first = false;
    }
    return out || '0';
  },
};

// Собрать вопрос с выбором ответа: первый вариант правильный, дубли отбрасываются.
MB.choice = (q, correct, wrongs, ex) => {
  const opts = [correct];
  for (const w of wrongs) {
    if (opts.length >= 4) break;
    if (!opts.includes(w)) opts.push(w);
  }
  return { type: 'choice', q, opts, a: 0, ex };
};

// Числовые неправильные варианты рядом с правильным ответом
MB.nearNums = (x, spread = 5) => {
  const set = new Set();
  let guard = 0;
  while (set.size < 6 && guard++ < 100) {
    const d = MB.R.nz(-spread, spread);
    if (x + d !== x) set.add(x + d);
  }
  return [...set];
};
