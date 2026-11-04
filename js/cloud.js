// Связь с сервером (Supabase): анонимный вход, события аналитики, облачное сохранение,
// покупка «Плюса», рефералка. Пока сервер не настроен (MB.CONFIG пустой) — всё тихо выключено,
// игра работает офлайн как раньше. Персональных данных не отправляем: только случайный id устройства.
MB.cloud = (() => {
  const C = MB.CONFIG;
  // сервер настроен И игрок принял документы — до согласия ничего не отправляем
  let allowed = false;
  const on = () => !!(C.supabaseUrl && C.supabaseAnonKey) && allowed;
  const LS = { pid: 'mozgobum-pid', auth: 'mozgobum-auth', queue: 'mozgobum-events', ref: 'mozgobum-ref',
    refDone: 'mozgobum-ref-done', refCode: 'mozgobum-refcode', pay: 'mozgobum-pending-pay' };
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* нет хранилища */ } };
  const getJSON = (k, d) => { try { const v = JSON.parse(get(k)); return v == null ? d : v; } catch (e) { return d; } };

  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
  let pid = get(LS.pid);
  if (!pid) { pid = uuid(); set(LS.pid, pid); }
  const platform = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() ? 'android' : 'web';

  // ?ref=КОД — приглашение друга; ?pay_return=1 — возврат со страницы оплаты. Убираем их из адреса.
  try {
    const p = new URLSearchParams(location.search), code = p.get('ref');
    if (code && /^[A-Z0-9]{6,12}$/i.test(code) && !get(LS.refDone)) set(LS.ref, code.toUpperCase());
    if (p.has('ref') || p.has('pay_return')) {
      p.delete('ref'); p.delete('pay_return');
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
    }
  } catch (e) { /* старый браузер */ }

  // ---------- запросы и сессия ----------
  let session = getJSON(LS.auth, null);   // {access_token, refresh_token, expires_at, user:{id, email, is_anonymous}}
  function saveSession(s) {
    if (!s || !s.access_token) { session = null; set(LS.auth, null); return; }
    const u = s.user || (session && session.user) || {};
    session = { access_token: s.access_token, refresh_token: s.refresh_token,
      expires_at: s.expires_at || Math.floor(Date.now() / 1000) + (s.expires_in || 3600),
      user: { id: u.id, email: u.email || '', is_anonymous: !!u.is_anonymous } };
    set(LS.auth, JSON.stringify(session));
  }
  async function http(path, { method = 'GET', body, user = false, headers = {} } = {}) {
    const h = { apikey: C.supabaseAnonKey, 'Content-Type': 'application/json', ...headers,
      Authorization: `Bearer ${user && session ? session.access_token : C.supabaseAnonKey}` };
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const r = await fetch(C.supabaseUrl + path, { method, headers: h, body: payload, keepalive: !!payload && payload.length < 60000 });
    const text = await r.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    if (!r.ok) {
      const err = new Error((data && (data.msg || data.error_description || data.error || data.message)) || `HTTP ${r.status}`);
      err.status = r.status;
      throw err;
    }
    return data;
  }
  let authPromise = null;
  // Анонимная учётная запись Supabase: без почты и имени, нужна для облака и покупок.
  async function ensureAuth() {
    if (!on()) throw new Error('offline');
    if (session && session.expires_at - 60 > Date.now() / 1000) return session;
    if (authPromise) return authPromise;
    authPromise = (async () => {
      try {
        if (session && session.refresh_token) {
          try {
            saveSession(await http('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } }));
            return session;
          } catch (e) { if (!(e.status >= 400 && e.status < 500)) throw e; saveSession(null); }
        }
        saveSession(await http('/auth/v1/signup', { method: 'POST', body: { data: {} } }));
        return session;
      } finally { authPromise = null; }
    })();
    return authPromise;
  }
  const callFn = async (name, body, needUser = false) => {
    if (needUser) await ensureAuth();
    return http(`/functions/v1/${name}`, { method: 'POST', body, user: !!session });
  };

  // ---------- аналитика: очередь событий, отправка пачками ----------
  let queue = getJSON(LS.queue, []);
  let flushing = false;
  function track(name, props = {}) {
    queue.push({ name, props, ts: new Date().toISOString() });
    if (queue.length > 500) queue = queue.slice(-500);
    set(LS.queue, JSON.stringify(queue));
    if (queue.length >= 20) flush();
  }
  async function flush() {
    if (!on() || flushing || !queue.length || navigator.onLine === false) return;
    flushing = true;
    const batch = queue.slice(0, 50);
    try {
      await ensureAuth().catch(() => null);
      const res = await callFn('track', { player_id: pid, platform, app_version: C.appVersion, events: batch });
      queue = queue.slice(batch.length);
      set(LS.queue, JSON.stringify(queue));
      if (res && res.referral_code) set(LS.refCode, res.referral_code);
    } catch (e) { /* без сети — отправим позже */ } finally { flushing = false; }
  }
  setInterval(flush, 60000);
  addEventListener('online', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  // ---------- облачное сохранение ----------
  async function pushSave(state) {
    if (!on()) return false;
    try {
      const s = await ensureAuth();
      await http('/rest/v1/saves', { method: 'POST', user: true, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: { user_id: s.user.id, data: state, xp: state.xp | 0, updated_at: new Date().toISOString() } });
      return true;
    } catch (e) { return false; }
  }
  async function pullSave() {
    if (!on()) return null;
    try {
      await ensureAuth();
      const rows = await http('/rest/v1/saves?select=data,xp,updated_at', { user: true });
      return (rows && rows[0]) || null;
    } catch (e) { return null; }
  }

  // ---------- Плюс и оплата ----------
  // null — неизвестно (офлайн), число — время окончания Плюса (0 — нет)
  async function plusUntil() {
    if (!on()) return null;
    try {
      await ensureAuth();
      const rows = await http('/rest/v1/entitlements?select=plus_until', { user: true });
      return rows && rows[0] && rows[0].plus_until ? Date.parse(rows[0].plus_until) : 0;
    } catch (e) { return null; }
  }
  async function buy(sku) {
    const r = await callFn('pay-create', { sku, return_url: location.origin + location.pathname + '?pay_return=1' }, true);
    set(LS.pay, JSON.stringify({ id: r.payment_id, at: Date.now() }));
    // на сайте — переход на страницу оплаты, в приложении Capacitor откроет её во внешнем браузере
    location.href = r.confirmation_url;
  }
  const hasPending = () => !!getJSON(LS.pay, null);
  async function checkPending() {
    const p = getJSON(LS.pay, null);
    if (!p || !on()) return null;
    try {
      const r = await callFn('pay-status', { payment_id: p.id }, true);
      if (r.status !== 'pending' || Date.now() - p.at > 86400000) set(LS.pay, null);
      return r;
    } catch (e) { return null; }
  }

  // ---------- рефералка ----------
  const myCode = () => get(LS.refCode);
  const inviteLink = () => (myCode() ? `https://maximlexin.github.io/mozgobum/?ref=${myCode()}` : null);
  async function claimReferral() {
    const code = get(LS.ref);
    if (!code || !on()) return null;
    try {
      await flush();   // сервер проверяет, что первый урок уже пройден — события должны дойти
      const r = await callFn('referral-claim', { player_id: pid, code });
      if (r.status !== 'need_lesson') { set(LS.ref, null); set(LS.refDone, '1'); }
      return r.status;
    } catch (e) { return null; }
  }
  // серверный промокод: {status: ok|not_found|expired|used_up|already|inactive, ...} или null при сбое
  async function redeemPromo(code) {
    if (!on()) return null;
    try { return await callFn('promo-redeem', { player_id: pid, code }, true); } catch (e) { return null; }
  }
  async function fetchRewards() {
    if (!on()) return [];
    try { const r = await callFn('rewards', { player_id: pid }); return (r && r.rewards) || []; } catch (e) { return []; }
  }

  // ---------- вход по почте (выключен в MB.CONFIG.emailLogin) ----------
  // Сначала пробуем привязать почту к текущей анонимной записи (покупки и облако сохранятся),
  // если почта уже занята — это вход в существующую запись с другого устройства.
  async function emailStart(email) {
    await ensureAuth();
    try { await http('/auth/v1/user', { method: 'PUT', user: true, body: { email } }); return 'email_change'; }
    catch (e) { await http('/auth/v1/otp', { method: 'POST', body: { email, create_user: false } }); return 'email'; }
  }
  async function emailVerify(email, token, type) {
    const r = await http('/auth/v1/verify', { method: 'POST', user: type === 'email_change', body: { type, email, token } });
    if (r && r.access_token) saveSession(r);
    else if (session) saveSession(await http('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } }));
    return session && session.user;
  }
  function logout() { saveSession(null); }

  return { on, allow: v => { allowed = !!v; if (allowed) flush(); }, pid, platform, track, flush, pushSave, pullSave, plusUntil, buy, hasPending, checkPending,
    myCode, inviteLink, hasRef: () => !!get(LS.ref), claimReferral, fetchRewards, redeemPromo,
    emailStart, emailVerify, logout, user: () => (session && session.user) || null };
})();
