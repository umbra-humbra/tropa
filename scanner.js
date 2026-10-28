/* «Тропа единства» — сканер сотрудника резидента.
   Одно регулярное действие: навести камеру. Зелёный экран — ТОЛЬКО после ответа сервера result=OK.
   Любая неопределённость (сеть, таймаут, неизвестный ответ) — жёлтый «повторите», без разрешения выдачи. */
(function () {
  'use strict';
  var KEY_STORE = 'amur_tropa_staff_key_v1';
  var RESULT_MS = 4500;          // показ результата, затем автоматический возврат к камере
  var SAME_CODE_IGNORE_MS = 8000; // тот же QR сразу после результата игнорируется (один кадр — одна проверка)
  var SCAN_EVERY_MS = 120;

  var $ = function (id) { return document.getElementById(id); };
  var api = window.TropaAPI;
  var staffKey = null, info = null;
  var stream = null, started = false, busy = false, lastText = '', lastAt = 0, toastAt = 0;
  var detector = null, canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
  var wakeLock = null, audio = null, scanTimer = null;

  /* ---------- ключ сотрудника ---------- */
  function readKey() {
    var m = location.hash.match(/k=([A-Za-z0-9_-]{20,64})/);
    if (m) {
      try { localStorage.setItem(KEY_STORE, m[1]); } catch (e) { /* без хранилища — ключ живёт до закрытия вкладки */ }
      history.replaceState(null, '', location.pathname + location.search);
      return m[1];
    }
    try { return localStorage.getItem(KEY_STORE); } catch (e) { return null; }
  }

  /* ---------- экран запуска ---------- */
  function gate(text, opts) {
    opts = opts || {};
    $('gate').hidden = false; $('cam').hidden = true;
    $('gate-text').textContent = text;
    $('start').hidden = !opts.start;
    $('gate-retry').hidden = !opts.retry;
  }

  function loadInfo() {
    gate('Проверяем доступ сканера…');
    return api.call('staffInfo', { staffKey: staffKey }, { timeout: 15000 }).then(function (r) {
      if (!r.ok) {
        try { localStorage.removeItem(KEY_STORE); } catch (e) {}
        $('manual-open').hidden = true;
        gate('Доступ этого сканера отключён или ссылка неверна.\nОбратитесь к организатору за новой ссылкой.');
        return;
      }
      info = r;
      $('resident').textContent = r.residentName;
      paintCounter();
      if (!started) gate('Вы — ' + r.residentName + '.\nПодарок: ' + r.gift + '.\n\n' + (r.rules || ''), { start: true });
    }, function () {
      gate('Нет связи с сервером.\nПроверьте мобильный интернет и нажмите «Повторить».', { retry: true });
    });
  }

  function paintCounter() {
    if (!info) return;
    $('counter').textContent = (info.staffLabel ? info.staffLabel + ' · ' : '') + 'выдано ' + info.used + (info.quota === null || info.quota === undefined ? '' : ' из ' + info.quota) + (info.active ? '' : ' · ВЫДАЧА ОСТАНОВЛЕНА');
  }

  /* ---------- камера ---------- */
  function startCamera() {
    unlockAudio();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      gate('Камера недоступна в этом браузере.\nОткройте ссылку в Safari (iPhone) или Chrome (Android).\nМожно вводить коды вручную — кнопка внизу.');
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(function (s) {
        stream = s; started = true;
        var v = $('video'); v.srcObject = s; v.setAttribute('playsinline', ''); v.muted = true;
        return v.play().catch(function () {});
      })
      .then(function () {
        if (!stream) return;
        $('gate').hidden = true; $('cam').hidden = false;
        setupTorch(); keepAwake(); loop();
      })
      .catch(function (e) {
        var denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
        gate(denied
          ? 'Нет разрешения на камеру.\niPhone: Настройки → Safari → Камера → «Разрешить».\nAndroid: значок замка в адресной строке → Камера → Разрешить.\nЗатем нажмите кнопку ещё раз.'
          : 'Не удалось включить камеру.\nПопробуйте ещё раз или вводите коды вручную.', { start: true });
      });
  }

  function stopCamera() {
    clearTimeout(scanTimer);
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    stream = null;
  }

  function setupTorch() {
    try {
      var track = stream.getVideoTracks()[0];
      var caps = track.getCapabilities ? track.getCapabilities() : {};
      if (caps.torch) {
        var on = false;
        $('torch').hidden = false;
        $('torch').onclick = function () { on = !on; track.applyConstraints({ advanced: [{ torch: on }] }).catch(function () {}); };
      }
    } catch (e) {}
  }

  function keepAwake() {
    if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then(function (w) { wakeLock = w; }).catch(function () {});
  }

  function initDetector() {
    if (!('BarcodeDetector' in window)) return Promise.resolve(null);
    return window.BarcodeDetector.getSupportedFormats().then(function (f) {
      return f.indexOf('qr_code') >= 0 ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
    }).catch(function () { return null; });
  }

  function loop() {
    clearTimeout(scanTimer);
    if (!stream) return;
    scanTimer = setTimeout(function () {
      if (busy || document.hidden) return loop();
      decode().then(function (text) { if (text) onText(text); }).catch(function () {}).then(loop);
    }, SCAN_EVERY_MS);
  }

  function decode() {
    var v = $('video');
    if (!v.videoWidth) return Promise.resolve(null);
    if (detector) {
      return detector.detect(v).then(function (codes) { return codes && codes[0] ? codes[0].rawValue : null; });
    }
    // jsQR: центральный квадрат кадра, уменьшенный до ~520 px
    var s = Math.min(v.videoWidth, v.videoHeight), sx = (v.videoWidth - s) / 2, sy = (v.videoHeight - s) / 2;
    var size = Math.min(520, s);
    canvas.width = size; canvas.height = size;
    ctx.drawImage(v, sx, sy, s, s, 0, 0, size, size);
    var img = ctx.getImageData(0, 0, size, size);
    var res = window.jsQR(img.data, size, size, { inversionAttempts: 'dontInvert' });
    return Promise.resolve(res ? res.data : null);
  }

  function onText(text) {
    var now = Date.now();
    if (text === lastText && now - lastAt < SAME_CODE_IGNORE_MS) return;
    if (text.indexOf('TE1.') !== 0) {
      if (now - toastAt > 3000) { toast('Это не купон «Тропы единства»'); toastAt = now; }
      return;
    }
    lastText = text; lastAt = now;
    redeem(text);
  }

  /* ---------- погашение ---------- */
  function redeem(payload) {
    if (busy) return;
    busy = true;
    showResult('busy', '…', 'Проверяем', 'Не отдавайте подарок до зелёного экрана', 0);
    api.call('redeem', { staffKey: staffKey, payload: payload }, { timeout: 25000 }).then(function (r) {
      if (r && r.result === 'OK') {
        if (info) { info.used = r.used; info.quota = r.quota; paintCounter(); }
        beep('ok'); vibrate([80, 60, 80]);
        showResult('ok', '✓', 'ВЫДАЙТЕ ПОДАРОК', r.message || '', RESULT_MS);
      } else if (r && r.result === 'DENY') {
        beep('deny'); vibrate([400]);
        showResult('deny', '✕', 'НЕ ВЫДАВАТЬ', r.message || 'Купон не принят.', RESULT_MS + 1000);
        if (r.reason === 'STAFF_DENIED') setTimeout(function () { stopCamera(); loadInfo(); }, RESULT_MS + 1000);
      } else {
        beep('deny'); vibrate([200, 100, 200]);
        showResult('retry', '!', 'НЕ УДАЛОСЬ ПРОВЕРИТЬ', (r && r.message) || 'Подарок не выдавать. Отсканируйте ещё раз.', RESULT_MS);
      }
    }, function () {
      beep('deny'); vibrate([200, 100, 200]);
      showResult('retry', '!', 'НЕ УДАЛОСЬ ПРОВЕРИТЬ', 'Нет связи с сервером. Подарок НЕ выдавать. Отсканируйте ещё раз.', RESULT_MS);
    });
  }

  var hideTimer = null;
  function showResult(kind, icon, title, text, ms) {
    clearTimeout(hideTimer);
    var el = $('result');
    el.dataset.kind = kind; el.hidden = false;
    $('result-icon').textContent = icon; $('result-title').textContent = title; $('result-text').textContent = text;
    var bar = $('result-progress');
    bar.style.transition = 'none'; bar.style.width = '0';
    if (!ms) return;
    void bar.offsetWidth;
    bar.style.transition = 'width ' + ms + 'ms linear'; bar.style.width = '100%';
    hideTimer = setTimeout(function () {
      el.hidden = true; busy = false;
      if (kind === 'retry') lastText = ''; // после «повторите» тот же код можно сразу сканировать снова
      lastAt = Date.now();
    }, ms);
  }

  function toast(t) {
    var el = $('toast'); el.textContent = t; el.hidden = false;
    clearTimeout(el._t); el._t = setTimeout(function () { el.hidden = true; }, 2200);
  }

  /* ---------- звук / вибрация ---------- */
  function unlockAudio() {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) { audio = null; }
  }
  function beep(kind) {
    if (!audio) return;
    try {
      var tones = kind === 'ok' ? [[880, 0, .12], [1320, .15, .18]] : [[220, 0, .45]];
      tones.forEach(function (t) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = t[0]; o.type = 'sine'; g.gain.value = .25;
        o.connect(g); g.connect(audio.destination);
        o.start(audio.currentTime + t[1]); o.stop(audio.currentTime + t[1] + t[2]);
      });
    } catch (e) {}
  }
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  /* ---------- ручной ввод ---------- */
  $('manual-open').onclick = function () { unlockAudio(); $('manual').hidden = false; $('code').value = ''; setTimeout(function () { $('code').focus(); }, 50); };
  $('manual-close').onclick = function () { $('manual').hidden = true; };
  $('manual-form').onsubmit = function (e) {
    e.preventDefault();
    var v = $('code').value.trim();
    if (!v) return;
    $('manual').hidden = true;
    if (!staffKey) return;
    redeem(v);
  };

  /* ---------- служебное ---------- */
  function netState() { $('net').hidden = navigator.onLine !== false; }
  window.addEventListener('online', netState);
  window.addEventListener('offline', netState);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stopCamera(); }
    else if (started && !stream) { startCamera(); }
  });
  $('start').onclick = startCamera;
  $('gate-retry').onclick = loadInfo;

  /* ---------- старт ---------- */
  netState();
  staffKey = readKey(); // ключ сохраняем сразу, даже если адрес сервера ещё не подтянулся
  if (!api || !api.configured) { gate('Сканер не настроен: не указан адрес сервера (config.js). Обновите страницу через минуту.'); return; }
  if (!staffKey) { gate('Откройте персональную ссылку сканера, которую прислал организатор.'); $('manual-open').hidden = true; return; }
  initDetector().then(function (d) { detector = d; });
  loadInfo();
})();
