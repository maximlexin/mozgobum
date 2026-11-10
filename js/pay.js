// Оплата «Мозгобум Плюс» через собственный платёжный сервер (см. backend/pay-server, ЮKassa).
// Пока MB.CONFIG.payApi пустой, оплата выключена (на localhost для проверки адрес можно задать в localStorage: mozgobum-payapi).
// Игрок анонимный: сервер знает только случайный UUID устройства и платежи (без имени и почты).
MB.pay = (() => {
  const LS = { uid: 'mozgobum-payuid', pending: 'mozgobum-paying', api: 'mozgobum-payapi' };
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* нет хранилища */ } };
  const isLocal = () => ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const api = () => String((MB.CONFIG && MB.CONFIG.payApi) || (isLocal() && get(LS.api)) || '').replace(/\/+$/, '');
  const on = () => !!api() && !!(MB.CONFIG.features && MB.CONFIG.features.plus);

  function uid() {
    let id = get(LS.uid);
    if (!id) {
      id = (crypto && crypto.randomUUID) ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
      set(LS.uid, id);
    }
    return id;
  }

  async function call(path, opt) {
    const r = await fetch(api() + path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opt));
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || ('http ' + r.status));
    return j;
  }

  async function buy() {
    const r = await call('/api/pay/create', { method: 'POST', body: JSON.stringify({ playerId: uid() }) });
    if (!r.paymentId || !/^https:\/\//.test(r.confirmationUrl || '')) throw new Error('bad response');
    set(LS.pending, JSON.stringify({ id: r.paymentId, at: Date.now() }));
    location.href = r.confirmationUrl;   // страница оплаты ЮKassa (в приложении Capacitor открывает внешний браузер)
  }

  const pending = () => { try { return JSON.parse(get(LS.pending) || 'null'); } catch (e) { return null; } };
  const hasPending = () => !!pending();

  // {status: 'paid'|'pending'|'canceled', plus_until} или null при сбое сети
  async function checkPending() {
    const p = pending();
    if (!p || !on()) return null;
    try {
      const r = await call('/api/pay/status?paymentId=' + encodeURIComponent(p.id));
      let status = 'pending';
      if (r.status === 'succeeded' && r.plusUntil) status = 'paid';
      else if (r.status === 'canceled') status = 'canceled';
      if (status !== 'pending' || Date.now() - p.at > 86400000) set(LS.pending, null);
      return { status, plus_until: r.plusUntil || null };
    } catch (e) { return null; }
  }

  return { on, uid, buy, hasPending, checkPending };
})();
