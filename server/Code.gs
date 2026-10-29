/**
 * «Тропа единства» — сервер подарочных купонов (Google Apps Script + Google Таблица).
 * Версия 1.0, 29.10.2026.
 *
 * Принципы:
 *  - источник истины — эта таблица; браузер гостя ничего не решает;
 *  - погашение = одна операция под LockService: повторная проверка → запись в «Купоны» и «Выдачи»;
 *  - расход подарков считается по журналу «Выдачи» (статус OK), а не по отдельному счётчику;
 *  - секреты (токен купона, ручной код, ключ сотрудника) хранятся только в виде хэша;
 *  - погашение возможно только POST-запросом со страницы сканера и ключом сотрудника.
 */

var SH = {
  SETTINGS: 'Настройки',
  RESIDENTS: 'Резиденты',
  COUPONS: 'Купоны',
  REDEMPTIONS: 'Выдачи',
  STAFF: 'Сотрудники',
  LOG: 'Журнал',
  SUMMARY: 'Сводка'
};

// Колонки (1-based) — менять только вместе с setupSheets_().
var C = {
  // Купоны
  C_ID: 1, C_TOKEN: 2, C_CODE: 3, C_ISSUED: 4, C_EXPIRES: 5, C_STATUS: 6, C_RES: 7, C_REDEEMED: 8, C_STAFF: 9, C_NOTE: 10,
  // Выдачи
  R_ID: 1, R_COUPON: 2, R_RES: 3, R_STAFF: 4, R_AT: 5, R_STATUS: 6, R_VIA: 7,
  // Сотрудники
  S_ID: 1, S_RES: 2, S_LABEL: 3, S_KEY: 4, S_ACTIVE: 5, S_CREATED: 6,
  // Резиденты
  P_ID: 1, P_NAME: 2, P_GIFT: 3, P_QUOTA: 4, P_ACTIVE: 5
};

var TZ = 'Asia/Yakutsk'; // Благовещенск, UTC+9
var QR_PREFIX = 'TE1.';
var CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 символа, без 0/O/1/I
var MAX_FAILS = 10;          // неверных кодов на одного сотрудника…
var FAIL_WINDOW_SEC = 600;   // …за 10 минут

/* ============================ HTTP ============================ */

function doGet(e) {
  // GET никогда ничего не меняет. Только проверка связи.
  var action = e && e.parameter && e.parameter.action;
  if (action === 'ping') return json_({ ok: true, pong: true, time: now_().getTime() });
  return json_({ ok: false, error: 'GET_NOT_ALLOWED' });
}

function doPost(e) {
  var req;
  try {
    req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'BAD_JSON' });
  }
  try {
    switch (req.action) {
      case 'ping': return json_({ ok: true, pong: true, time: now_().getTime() });
      case 'issue': return json_(apiIssue_(req));
      case 'status': return json_(apiStatus_(req));
      case 'offers': return json_(apiOffers_());
      case 'staffInfo': return json_(apiStaffInfo_(req));
      case 'redeem': return json_(apiRedeem_(req));
      default: return json_({ ok: false, error: 'UNKNOWN_ACTION' });
    }
  } catch (err) {
    log_('error', req && req.action, '', 'EXCEPTION', String(err && err.stack || err).slice(0, 400));
    return json_({ ok: false, error: 'SERVER_ERROR' });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================ API ============================ */

function apiIssue_(req) {
  var st = settings_();
  var now = now_();
  if (st.STOPPED) return { ok: false, error: 'STOPPED' };
  if (!st.TEST_MODE) {
    if (now < st.ISSUE_FROM) return { ok: false, error: 'NOT_STARTED', from: fmt_(st.ISSUE_FROM) };
    if (now > st.ISSUE_TO) return { ok: false, error: 'CLOSED' };
  }
  // Общий предохранитель от массового выпуска скриптами.
  var cache = CacheService.getScriptCache();
  var minuteKey = 'iss:' + Math.floor(now.getTime() / 60000);
  var perMin = Number(cache.get(minuteKey) || 0);
  if (perMin >= st.ISSUE_RATE_PER_MIN) return { ok: false, error: 'BUSY' };
  cache.put(minuteKey, String(perMin + 1), 120);

  var sh = sheet_(SH.COUPONS);
  if (sh.getLastRow() - 1 >= st.MAX_COUPONS) {
    log_('issue', '', '', 'LIMIT', 'MAX_COUPONS reached');
    return { ok: false, error: 'LIMIT' };
  }
  var c = createCoupon_(st, 'web', String(req.device || '').slice(0, 12));
  if (!c) return { ok: false, error: 'BUSY' };
  return {
    ok: true,
    token: c.token, qr: QR_PREFIX + c.token, code: c.codePretty, couponId: c.id,
    expiresAt: c.expires.getTime(),
    status: 'issued',
    offers: offers_(),
    rules: rulesText_(st)
  };
}

function apiStatus_(req) {
  var token = String(req.token || '');
  if (!/^[A-Za-z0-9_-]{22}$/.test(token)) return { ok: false, error: 'INVALID' };
  var hash = hash_('t', token);
  var cache = CacheService.getScriptCache();
  var cached = cache.get('cs:' + hash);
  var info = cached ? JSON.parse(cached) : null;
  if (!info) {
    var row = findRow_(sheet_(SH.COUPONS), C.C_TOKEN, hash);
    if (!row) return { ok: false, error: 'NOT_FOUND' };
    info = couponPublic_(row.values);
    cache.put('cs:' + hash, JSON.stringify(info), 60);
  }
  info.ok = true;
  info.offers = offers_();
  info.rules = rulesText_(settings_());
  return info;
}

function apiOffers_() {
  return { ok: true, offers: offers_(), rules: rulesText_(settings_()) };
}

function apiStaffInfo_(req) {
  var staff = authStaff_(req.staffKey);
  if (!staff) return { ok: false, error: 'STAFF_DENIED' };
  var res = residents_(true)[staff.residentId];
  if (!res) return { ok: false, error: 'STAFF_DENIED' };
  var used = usedByResident_()[staff.residentId] || 0;
  return {
    ok: true, residentId: res.id, residentName: res.name, gift: res.gift, staffLabel: staff.label,
    quota: res.quota, used: used, active: res.active && !settings_().STOPPED, rules: rulesText_(settings_())
  };
}

/**
 * Погашение. Ответ:
 *  result: 'OK' (зелёный) | 'DENY' (красный) | 'RETRY' (жёлтый, ничего не списано)
 */
function apiRedeem_(req) {
  var staff = authStaff_(req.staffKey);
  if (!staff) return { ok: false, result: 'DENY', reason: 'STAFF_DENIED', message: 'Доступ сканера отключён. Обратитесь к организатору.' };

  var via = 'qr', field, hash;
  var raw = String(req.payload || '').trim();
  if (raw.indexOf(QR_PREFIX) === 0 && /^[A-Za-z0-9_-]{22}$/.test(raw.slice(QR_PREFIX.length))) {
    field = C.C_TOKEN; hash = hash_('t', raw.slice(QR_PREFIX.length));
  } else {
    var code = normCode_(raw);
    if (!code) return deny_('INVALID', 'Это не купон «Тропы единства».');
    via = 'code'; field = C.C_CODE; hash = hash_('c', code);
  }

  var cache = CacheService.getScriptCache();
  var failKey = 'fail:' + staff.id;
  var fails = Number(cache.get(failKey) || 0);
  if (fails >= MAX_FAILS) return deny_('LOCKED', 'Слишком много неверных кодов. Подождите 10 минут.');

  var st = settings_();
  var now = now_();
  if (st.STOPPED) return deny_('STOPPED', 'Выдача подарков остановлена организатором. Купон гостя не списан.');
  if (!st.TEST_MODE && !inWindows_(now, st.REDEEM_WINDOWS)) {
    return deny_('OUTSIDE_HOURS', 'Сейчас подарки не выдаются. ' + rulesText_(st));
  }

  DEFER_LOG = []; // запись журнала — после снятия блокировки, чтобы не задерживать очередь
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    flushLog_();
    return { ok: false, result: 'RETRY', reason: 'BUSY', message: 'Сервер занят. Отсканируйте ещё раз.' };
  }
  try {
    var shC = sheet_(SH.COUPONS);
    var row = findRow_(shC, field, hash);
    if (!row) {
      cache.put(failKey, String(fails + 1), FAIL_WINDOW_SEC);
      log_('redeem', '', staff.id, 'NOT_FOUND', via);
      return deny_('NOT_FOUND', via === 'code' ? 'Код не найден. Проверьте буквы и цифры.' : 'Купон не найден.');
    }
    var v = row.values;
    var couponId = v[C.C_ID - 1];
    var residents = residents_(false); // кэш ≤30 с; правки организатора сбрасывают его сразу (onEdit)

    if (v[C.C_STATUS - 1] === 'redeemed') {
      var r0 = residents[v[C.C_RES - 1]];
      var same = v[C.C_STAFF - 1] === staff.id;
      log_('redeem', couponId, staff.id, 'USED', via);
      return deny_('USED', (same ? 'Этот купон уже погашен ВАМИ' : 'Подарок по купону уже получен') +
        ' — ' + (r0 ? r0.name : '') + ', ' + fmt_(asDate_(v[C.C_REDEEMED - 1])) + '.', { couponId: couponId });
    }
    var exp = asDate_(v[C.C_EXPIRES - 1]);
    if (exp && now > exp) {
      log_('redeem', couponId, staff.id, 'EXPIRED', via);
      return deny_('EXPIRED', 'Срок действия купона истёк.', { couponId: couponId });
    }
    var res = residents[staff.residentId];
    if (!res || !res.active) {
      log_('redeem', couponId, staff.id, 'PAUSED', via);
      return deny_('PAUSED', 'Выдача у вас приостановлена организатором. Купон гостя не списан.', { couponId: couponId });
    }
    var used = res.quota === null ? null : (usedByResident_()[res.id] || 0); // без лимита журнал под блокировкой не читаем
    if (res.quota !== null && used >= res.quota) {
      log_('redeem', couponId, staff.id, 'OUT_OF_STOCK', via);
      return deny_('OUT_OF_STOCK', 'Ваши подарки закончились. Купон гостя НЕ списан — он может получить подарок у другого резидента.', { couponId: couponId });
    }

    // --- запись (всё ещё под блокировкой) ---
    var redId = 'R' + Utilities.formatDate(now, TZ, 'MMddHHmmss') + '-' + randCode_(4);
    shC.getRange(row.row, C.C_STATUS, 1, 4).setValues([['redeemed', res.id, now, staff.id]]);
    sheet_(SH.REDEMPTIONS).appendRow([redId, couponId, res.id, staff.id, now, 'OK', via]);
    SpreadsheetApp.flush();
    cache.remove('cs:' + v[C.C_TOKEN - 1]);
    cache.remove('offers');
    cache.remove('used');
    var okResult = {
      ok: true, result: 'OK', reason: 'OK', couponId: couponId,
      message: res.gift, residentName: res.name, used: used === null ? null : used + 1, quota: res.quota
    };
  } finally {
    lock.releaseLock();
    flushLog_();
  }
  if (okResult.used === null) okResult.used = usedByResident_()[staff.residentId] || 0; // счётчик для экрана — уже вне блокировки
  return okResult;
}

function deny_(reason, message, extra) {
  var o = { ok: true, result: 'DENY', reason: reason, message: message };
  if (extra) for (var k in extra) o[k] = extra[k];
  return o;
}

/* ============================ Логика ============================ */

function createCoupon_(st, source, note) {
  // Параллельные appendRow в Google Таблице могут затирать друг друга (проверено испытанием 29.10):
  // запись купона делаем под той же блокировкой, что и погашение. Случайные значения готовим заранее.
  var token = randToken_();
  var id = 'K' + randCode_(6);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return null;
  try {
    var shC = sheet_(SH.COUPONS);
    var code, codeHash, tries = 0;
    do {
      code = randCode_(8);
      codeHash = hash_('c', code);
      tries++;
    } while (tries < 5 && findRow_(shC, C.C_CODE, codeHash));
    var now = now_();
    var expires = st.COUPON_EXPIRES;
    shC.appendRow([id, hash_('t', token), codeHash, now, expires, 'issued', '', '', '', source + (note ? ':' + note : '')]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return { id: id, token: token, code: code, codePretty: code.slice(0, 4) + '-' + code.slice(4), expires: expires };
}

function couponPublic_(v) {
  var res = residents_(false)[v[C.C_RES - 1]];
  return {
    couponId: v[C.C_ID - 1],
    status: v[C.C_STATUS - 1] === 'redeemed' ? 'redeemed' : 'issued',
    residentName: res ? res.name : '',
    gift: res ? res.gift : '',
    redeemedAt: v[C.C_STATUS - 1] === 'redeemed' ? asDate_(v[C.C_REDEEMED - 1]).getTime() : null,
    expiresAt: asDate_(v[C.C_EXPIRES - 1]) ? asDate_(v[C.C_EXPIRES - 1]).getTime() : null
  };
}

function offers_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('offers');
  if (hit) return JSON.parse(hit);
  var res = residents_(false), used = usedByResident_(), list = [], stopped = settings_().STOPPED;
  for (var id in res) {
    var r = res[id];
    list.push({ id: r.id, name: r.name, gift: r.gift, available: !stopped && r.active && (r.quota === null || (used[id] || 0) < r.quota) });
  }
  cache.put('offers', JSON.stringify(list), 20);
  return list;
}

function residents_(fresh) {
  var cache = CacheService.getScriptCache();
  if (!fresh) {
    var hit = cache.get('residents');
    if (hit) return JSON.parse(hit);
  }
  var sh = sheet_(SH.RESIDENTS);
  var n = sh.getLastRow() - 1, out = {};
  if (n > 0) {
    var vals = sh.getRange(2, 1, n, 5).getValues();
    for (var i = 0; i < vals.length; i++) {
      var id = String(vals[i][0]).trim();
      if (!id) continue;
      out[id] = {
        id: id, name: String(vals[i][1]).trim(), gift: String(vals[i][2]).trim(),
        quota: (vals[i][3] === '' || vals[i][3] === null) ? null : Math.max(0, Number(vals[i][3]) || 0), // пусто = без лимита
        active: vals[i][4] === true || String(vals[i][4]).toUpperCase() === 'TRUE' || String(vals[i][4]).toLowerCase() === 'да'
      };
    }
  }
  cache.put('residents', JSON.stringify(out), 30);
  return out;
}

/** Расход по журналу «Выдачи»: только строки со статусом OK. */
function usedByResident_() {
  var sh = sheet_(SH.REDEMPTIONS);
  var n = sh.getLastRow() - 1, out = {};
  if (n <= 0) return out;
  var vals = sh.getRange(2, C.R_RES, n, C.R_STATUS - C.R_RES + 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (vals[i][C.R_STATUS - C.R_RES] === 'OK') out[vals[i][0]] = (out[vals[i][0]] || 0) + 1;
  }
  return out;
}

function authStaff_(key) {
  key = String(key || '');
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(key)) return null;
  var h = hash_('s', key);
  var cache = CacheService.getScriptCache();
  var hit = cache.get('st:' + h);
  if (hit) return hit === '-' ? null : JSON.parse(hit);
  var row = findRow_(sheet_(SH.STAFF), C.S_KEY, h);
  var staff = null;
  if (row) {
    var a = row.values[C.S_ACTIVE - 1];
    var active = a === true || String(a).toUpperCase() === 'TRUE';
    if (active) staff = { id: row.values[C.S_ID - 1], residentId: String(row.values[C.S_RES - 1]).trim(), label: row.values[C.S_LABEL - 1] };
  }
  cache.put('st:' + h, staff ? JSON.stringify(staff) : '-', 60); // отзыв доступа действует в течение минуты
  return staff;
}

function settings_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('settings');
  var raw;
  if (hit) raw = JSON.parse(hit);
  else {
    raw = {};
    var sh = sheet_(SH.SETTINGS);
    var n = sh.getLastRow() - 1;
    if (n > 0) {
      var vals = sh.getRange(2, 1, n, 2).getDisplayValues();
      for (var i = 0; i < vals.length; i++) if (vals[i][0]) raw[String(vals[i][0]).trim()] = String(vals[i][1]).trim();
    }
    cache.put('settings', JSON.stringify(raw), 30);
  }
  return {
    TEST_MODE: String(raw.TEST_MODE).toUpperCase() === 'TRUE' || String(raw.TEST_MODE).toLowerCase() === 'да',
    STOPPED: String(raw.GIFTS_STOPPED).toUpperCase() === 'TRUE' || String(raw.GIFTS_STOPPED).toLowerCase() === 'да',
    ISSUE_FROM: parseLocal_(raw.ISSUE_FROM) || new Date(0),
    ISSUE_TO: parseLocal_(raw.ISSUE_TO) || new Date(8640000000000000),
    COUPON_EXPIRES: parseLocal_(raw.COUPON_EXPIRES) || new Date(now_().getTime() + 7 * 864e5),
    REDEEM_WINDOWS: parseWindows_(raw.REDEEM_WINDOWS || ''),
    REDEEM_TEXT: raw.REDEEM_TEXT || '',
    MAX_COUPONS: Number(raw.MAX_COUPONS) || 3000,
    ISSUE_RATE_PER_MIN: Number(raw.ISSUE_RATE_PER_MIN) || 120,
    SITE_URL: raw.SITE_URL || ''
  };
}

function rulesText_(st) {
  return st.REDEEM_TEXT || 'Подарки выдаются в указанные организатором дни и часы.';
}

/** «2026-11-04 10:00-22:00; 2026-11-07 10:00-22:00» */
function parseWindows_(s) {
  var out = [];
  String(s).split(';').forEach(function (part) {
    var m = part.trim().match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (m) out.push({ from: parseLocal_(m[1] + ' ' + m[2]), to: parseLocal_(m[1] + ' ' + m[3]) });
  });
  return out;
}

function inWindows_(d, windows) {
  for (var i = 0; i < windows.length; i++) if (d >= windows[i].from && d <= windows[i].to) return true;
  return false;
}

function parseLocal_(s) {
  if (!s) return null;
  var m = String(s).trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?$/);
  if (!m) return null;
  var hh = m[4] ? ('0' + m[4]).slice(-2) : '00', mm = m[5] || '00';
  return Utilities.parseDate(m[1] + '-' + m[2] + '-' + m[3] + ' ' + hh + ':' + mm, TZ, 'yyyy-MM-dd HH:mm');
}

function fmt_(d) { return d ? Utilities.formatDate(d, TZ, 'dd.MM HH:mm') : ''; }
function asDate_(v) { if (!v) return null; return v instanceof Date ? v : new Date(v); }
function now_() { return new Date(); }

/* ============================ Криптография ============================ */

function pepper_() {
  var props = PropertiesService.getScriptProperties();
  var p = props.getProperty('PEPPER');
  if (!p) throw new Error('Не выполнена первичная настройка (нет PEPPER).');
  return p;
}

function hash_(kind, secret) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pepper_() + '|' + kind + '|' + secret, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

/** 128 случайных бит в base64url (22 символа). */
function randToken_() {
  var seed = Utilities.getUuid() + Utilities.getUuid() + Date.now();
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, seed, Utilities.Charset.UTF_8).slice(0, 16);
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}

function randCode_(len) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Utilities.getUuid(), Utilities.Charset.UTF_8);
  var s = '';
  for (var i = 0; i < len; i++) s += CODE_ALPHABET[(bytes[i] & 255) % 32];
  return s;
}

function normCode_(s) {
  // Сотрудник может набирать на русской раскладке: похожие кириллические буквы → латиница.
  var map = { 'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'У': 'Y' };
  var c = String(s || '').toUpperCase().replace(/[\s-]/g, '').replace(/[АВЕКМНРСТХУ]/g, function (ch) { return map[ch]; });
  return /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(c) ? c : null;
}

/* ============================ Таблица ============================ */

var SS_CACHE = null, SHEET_CACHE = {};
function ss_() {
  if (SS_CACHE) return SS_CACHE;
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  SS_CACHE = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  return SS_CACHE;
}

function sheet_(name) {
  if (SHEET_CACHE[name]) return SHEET_CACHE[name];
  var sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Нет листа ' + name);
  SHEET_CACHE[name] = sh;
  return sh;
}

function findRow_(sh, col, value) {
  var n = sh.getLastRow() - 1;
  if (n <= 0) return null;
  var cell = sh.getRange(2, col, n, 1).createTextFinder(String(value)).matchEntireCell(true).findNext();
  if (!cell) return null;
  var r = cell.getRow();
  return { row: r, values: sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0] };
}

var DEFER_LOG = null;
function log_(action, subject, operator, result, detail) {
  if (DEFER_LOG) { DEFER_LOG.push([now_(), action, subject || '', operator || '', result || '', detail || '']); return; }
  try {
    sheet_(SH.LOG).appendRow([now_(), action, subject || '', operator || '', result || '', detail || '']);
  } catch (e) { /* журнал не должен ломать основную операцию */ }
}

function flushLog_() {
  var rows = DEFER_LOG; DEFER_LOG = null;
  if (!rows || !rows.length) return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return; // журнал не важнее скорости выдачи
  try {
    var sh = sheet_(SH.LOG);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    SpreadsheetApp.flush();
  } catch (e) { /* журнал не должен ломать основную операцию */ }
  finally { lock.releaseLock(); }
}
