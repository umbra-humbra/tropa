/* «Тропа единства» — подарочный купон гостя.
   Купон хранится отдельно от прогресса игры: «Начать заново» его не удаляет и новый не выпускает.
   Это мягкое ограничение одного браузера; источник истины о выдаче — только сервер. */
(function () {
  'use strict';
  var KEY = 'amur_tropa_coupon_v1';
  var DEVICE_KEY = 'amur_tropa_device_v1';
  var POLL_MS = 30000;
  var api = window.TropaAPI;
  var host = null, pollTimer = null, issuing = false, lastError = null;

  function h(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load() { try { var c = JSON.parse(localStorage.getItem(KEY)); return c && c.token && c.qr ? c : null; } catch (e) { return null; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* приватный режим: купон живёт до закрытия вкладки */ } memory = c; }
  var memory = null;
  function current() { return load() || memory; }
  function device() {
    try {
      var d = localStorage.getItem(DEVICE_KEY);
      if (!d) { d = Math.random().toString(36).slice(2, 10); localStorage.setItem(DEVICE_KEY, d); }
      return d;
    } catch (e) { return ''; }
  }
  function fmtTime(ms) {
    if (!ms) return '';
    var d = new Date(ms);
    try {
      return d.toLocaleString('ru-RU', { timeZone: 'Asia/Yakutsk', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return d.toLocaleString('ru-RU'); }
  }

  function qrSvg(text) {
    var q = window.qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 6, margin: 4, scalable: true, alt: 'QR-код подарочного купона' });
  }

  var ISSUE_ERRORS = {
    NOT_STARTED: 'Подарочные купоны начнут выдавать в дни акции. Загляни в игру ещё раз в дни акции — прогресс сохранится.',
    CLOSED: 'Акция завершена: подарочные купоны больше не выпускаются. Спасибо за игру!',
    LIMIT: 'Подарочные купоны закончились. Спасибо за игру!',
    STOPPED: 'Сейчас подарочные купоны не выдаются. Спасибо за игру!',
    BUSY: 'Сервер сейчас занят. Подожди несколько секунд и нажми «Повторить».',
    NETWORK: 'Не удалось получить купон: нет связи с сервером. Проверь интернет и нажми «Повторить».',
    SERVER_ERROR: 'Сервер ответил ошибкой. Нажми «Повторить» чуть позже.'
  };

  function offersHtml(c) {
    var list = (c.offers || []).filter(function (o) { return o.available; });
    if (!c.offers) return '';
    if (!list.length) {
      return '<p class="coupon-warn">Сейчас подарков нет ни у одного резидента. Если организатор их пополнит, купон сработает.</p>';
    }
    return '<p class="coupon-sub">Выбери один подарок у любого резидента:</p><div class="gift-grid">' + list.map(function (o) {
      return '<div class="gift-card"><strong>' + h(o.name) + '</strong><span>' + h(o.gift) + '</span></div>';
    }).join('') + '</div>';
  }

  function view() {
    var c = current();
    if (!api || !api.configured) {
      return '<div class="coupon-box coupon-demo"><strong>Один подарок на выбор</strong><p>Подарочные купоны в этой версии не выпускаются.</p></div>';
    }
    if (!c) {
      if (lastError) {
        return '<div class="coupon-box" role="status"><strong class="coupon-title">Подарочный купон</strong><p class="coupon-warn">' + h(ISSUE_ERRORS[lastError] || ISSUE_ERRORS.NETWORK) + '</p>' +
          (lastError === 'CLOSED' || lastError === 'LIMIT' || lastError === 'STOPPED' ? '' : '<button type="button" class="primary" data-coupon="retry">Повторить</button>') + '</div>';
      }
      return '<div class="coupon-box" role="status" aria-busy="true"><strong class="coupon-title">Подарочный купон</strong><p class="coupon-sub">Выпускаем твой купон…</p><div class="coupon-spinner" aria-hidden="true"></div></div>';
    }
    if (c.status === 'redeemed') {
      return '<div class="coupon-box coupon-done" role="status"><div class="coupon-stamp" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m4 12 5 5L20 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div><strong class="coupon-title">Подарок получен</strong>' +
        '<p>' + h(c.residentName || '') + (c.gift ? ' · ' + h(c.gift) : '') + '</p><p class="coupon-sub">' + h(fmtTime(c.redeemedAt)) + '</p>' +
        '<p class="coupon-fine">Купон № ' + h(c.couponId) + ' использован. Спасибо за участие!</p></div>';
    }
    return '<div class="coupon-box coupon-live">' +
      '<strong class="coupon-title">Твой подарочный купон</strong>' +
      '<p class="coupon-lead">Один подарок на выбор у одного из резидентов</p>' +
      '<div class="coupon-qr">' + qrSvg(c.qr) + '</div>' +
      '<div class="coupon-code" aria-label="Код для ручного ввода">' + h(c.code) + '</div>' +
      '<p class="coupon-sub">Покажи QR-код сотруднику резидента — он отсканирует его своим телефоном. Если камера не сработает, сотрудник введёт код вручную.</p>' +
      (c.rules ? '<p class="coupon-rules">' + h(c.rules) + '</p>' : '') +
      offersHtml(c) +
      '<p class="coupon-fine">Купон № ' + h(c.couponId) + ' сохранён в этом браузере. Можно сделать скриншот: для получения подарка интернет на твоём телефоне не нужен.</p>' +
      '</div>';
  }

  function paint() { if (host && document.body.contains(host)) host.innerHTML = view(); }

  function issue() {
    if (issuing || current()) return;
    issuing = true; lastError = null; paint();
    api.call('issue', { device: device() }, { timeout: 25000 }).then(function (r) {
      if (r && r.ok && r.token) {
        save({ token: r.token, qr: r.qr, code: r.code, couponId: r.couponId, expiresAt: r.expiresAt, status: 'issued', offers: r.offers, rules: r.rules, issuedAt: Date.now() });
      } else {
        lastError = (r && r.error) || 'SERVER_ERROR';
      }
    }, function (e) { lastError = e.code === 'NETWORK' ? 'NETWORK' : 'SERVER_ERROR'; })
      .then(function () { issuing = false; paint(); schedule(); });
  }

  function refresh() {
    var c = current();
    if (!c || c.status === 'redeemed' || document.hidden) return Promise.resolve();
    return api.call('status', { token: c.token }, { timeout: 15000 }).then(function (r) {
      if (!r || !r.ok) return;
      var n = current(); if (!n || n.token !== c.token) return;
      n.status = r.status; n.residentName = r.residentName; n.gift = r.gift; n.redeemedAt = r.redeemedAt;
      if (r.offers) n.offers = r.offers;
      if (r.rules) n.rules = r.rules;
      save(n); paint();
    }, function () { /* нет связи: показываем сохранённый купон как есть */ });
  }

  function schedule() {
    clearInterval(pollTimer);
    var c = current();
    if (!c || c.status === 'redeemed') return;
    pollTimer = setInterval(function () {
      if (!host || !document.body.contains(host)) { clearInterval(pollTimer); return; }
      refresh();
    }, POLL_MS);
  }

  document.addEventListener('visibilitychange', function () { if (!document.hidden && host && document.body.contains(host)) refresh(); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-coupon="retry"]');
    if (b) issue();
  });

  /** Показать купон в контейнере; если купона нет и разрешён выпуск — выпустить. */
  function mount(el, opts) {
    host = el;
    opts = opts || {};
    paint();
    if (!api || !api.configured) return;
    if (current()) { refresh(); schedule(); }
    else if (opts.allowIssue) issue();
  }

  window.TropaCoupon = { mount: mount, has: function () { return !!current(); }, _key: KEY };
})();
