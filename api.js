/* «Тропа единства» — клиент API сервера купонов. Общий для игры, сканера и проверки связи. */
(function () {
  'use strict';
  var cfg = window.TROPA_CONFIG || {};

  /**
   * POST text/plain (без preflight CORS), ответ JSON.
   * Любая сетевая ошибка, таймаут или не-JSON → исключение с code='NETWORK'.
   * Вызывающий код НИКОГДА не должен трактовать исключение как успех.
   */
  function call(action, data, opts) {
    opts = opts || {};
    if (!cfg.API_URL) return Promise.reject(err('NO_API'));
    var body = Object.assign({ action: action }, data || {});
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, opts.timeout || 20000);
    return fetch(cfg.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
      cache: 'no-store',
      credentials: 'omit',
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      if (!r.ok) throw err('NETWORK');
      return r.json().catch(function () { throw err('NETWORK'); });
    }, function () { throw err('NETWORK'); })
      .finally(function () { clearTimeout(timer); });
  }

  function err(code) { var e = new Error(code); e.code = code; return e; }

  window.TropaAPI = { call: call, configured: !!cfg.API_URL };
})();
