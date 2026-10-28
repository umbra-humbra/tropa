/**
 * Меню организатора в Google Таблице. Сотрудники резидентов к таблице доступа не имеют.
 */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Тропа единства')
    .addItem('1. Первичная настройка таблицы', 'adminSetup')
    .addSeparator()
    .addItem('Создать ссылку сканера для сотрудника', 'adminCreateStaffLink')
    .addItem('Восстановить ошибочно погашенный купон', 'adminRestoreCoupon')
    .addItem('Выпустить купон вручную (замена)', 'adminIssueManual')
    .addItem('Проверить целостность учёта', 'adminCheckIntegrity')
    .addSeparator()
    .addItem('Очистить тестовые купоны и выдачи', 'adminClearTestData')
    .addToUi();
}

/** Любая правка организатора сбрасывает кэш настроек, чтобы изменения применились сразу. */
function onEdit(e) {
  try {
    var name = e && e.range && e.range.getSheet().getName();
    if (name === SH.SETTINGS || name === SH.RESIDENTS || name === SH.STAFF) {
      CacheService.getScriptCache().removeAll(['settings', 'residents', 'offers']);
    }
  } catch (err) { /* ignore */ }
}

function adminSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('PEPPER')) props.setProperty('PEPPER', Utilities.getUuid() + Utilities.getUuid());
  props.setProperty('SPREADSHEET_ID', ss.getId());
  setupSheets_(ss);
  ss.setSpreadsheetTimeZone(TZ);
  SpreadsheetApp.getUi().alert('Готово. Заполните листы «Резиденты» и «Настройки», затем опубликуйте скрипт как веб-приложение.');
}

function setupSheets_(ss) {
  function ensure(name, headers, widths) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#f3e3d3');
      sh.setFrozenRows(1);
      if (widths) widths.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
    }
    return sh;
  }
  var set = ensure(SH.SETTINGS, ['Параметр', 'Значение', 'Пояснение'], [190, 330, 480]);
  if (set.getLastRow() === 1) {
    set.getRange('B:B').setNumberFormat('@');
    set.getRange(2, 1, 10, 3).setValues([
      ['GIFTS_STOPPED', 'FALSE', 'СТОП-КРАН: галочка = выдача и выпуск купонов остановлены у всех (срабатывает в течение 30 секунд). Работает и из приложения Google Таблицы на телефоне.'],
      ['TEST_MODE', 'TRUE', 'TRUE — тестовый режим: окна выдачи не проверяются. Перед запуском поставить FALSE.'],
      ['ISSUE_FROM', '2026-11-04 00:00', 'С какого момента выпускаются купоны (время Благовещенска).'],
      ['ISSUE_TO', '2026-11-07 22:00', 'До какого момента выпускаются купоны.'],
      ['COUPON_EXPIRES', '2026-11-07 22:00', 'Срок действия всех купонов.'],
      ['REDEEM_WINDOWS', '2026-11-04 10:00-22:00; 2026-11-07 10:00-22:00', 'Окна выдачи подарков, через «;».'],
      ['REDEEM_TEXT', 'Подарки выдаются 4 и 7 ноября с 10:00 до 22:00.', 'Текст для гостя и сотрудника.'],
      ['MAX_COUPONS', '3000', 'Предохранитель: максимум купонов за акцию.'],
      ['ISSUE_RATE_PER_MIN', '120', 'Предохранитель: максимум новых купонов в минуту.'],
      ['SITE_URL', '', 'Адрес сайта игры, например https://….github.io/tropa/ — нужен для ссылок сканера.']
    ]);
    set.getRange('B2').insertCheckboxes().setValue(false);
    set.getRange('A2:C2').setBackground('#fde2dc').setFontWeight('bold');
  }
  var res = ensure(SH.RESIDENTS, ['resident_id', 'Название', 'Подарок', 'Квота', 'Активен', 'Выдано', 'Осталось'], [110, 230, 260, 70, 70, 70, 80]);
  if (res.getLastRow() === 1) {
    // Квота пустая = без лимита («до последнего участника»). Остановить резидента — снять «Активен».
    res.getRange(2, 1, 4, 5).setValues([
      ['dushechka', 'Кондитерская «Душечка»', 'Плюшка', '', true],
      ['fazenda', 'Пирожковая «Фазенда»', 'Подарок уточняется', '', true],
      ['moro', 'Мороженое «Моро»', 'Подарок уточняется', '', true],
      ['amurmania', 'Сувениры «АмурМания»', 'Открытка', '', true]
    ]);
    res.getRange('E2:E5').insertCheckboxes();
    res.getRange('E2:E5').setValue(true);
    for (var r = 2; r <= 5; r++) {
      res.getRange(r, 6).setFormula('=COUNTIFS(\'' + SH.REDEMPTIONS + '\'!C:C;A' + r + ';\'' + SH.REDEMPTIONS + '\'!F:F;"OK")'.replace(/;/g, ','));
      res.getRange(r, 7).setFormula('=IF(D' + r + '="","без лимита",D' + r + '-F' + r + ')');
    }
  }
  ensure(SH.COUPONS, ['coupon_id', 'token_hash', 'code_hash', 'Выпущен', 'Действует до', 'Статус', 'Резидент', 'Погашен', 'Сотрудник', 'Источник'], [90, 120, 120, 140, 140, 80, 100, 140, 80, 120]);
  ensure(SH.REDEMPTIONS, ['redemption_id', 'coupon_id', 'Резидент', 'Сотрудник', 'Время', 'Статус', 'Способ'], [160, 90, 100, 80, 140, 90, 70]);
  var staff = ensure(SH.STAFF, ['staff_id', 'resident_id', 'Подпись', 'key_hash', 'Активен', 'Создан'], [80, 110, 200, 120, 70, 140]);
  ensure(SH.LOG, ['Время', 'Действие', 'Объект', 'Кто', 'Результат', 'Подробности'], [140, 90, 90, 80, 110, 360]);
  var sum = ensure(SH.SUMMARY, ['Показатель', 'Значение'], [260, 120]);
  if (sum.getLastRow() === 1) {
    sum.getRange(2, 1, 5, 2).setValues([
      ['Купонов выпущено', '=COUNTA(\'' + SH.COUPONS + '\'!A2:A)'],
      ['Купонов погашено', '=COUNTIF(\'' + SH.COUPONS + '\'!F2:F,"redeemed")'],
      ['Выдач в журнале (OK)', '=COUNTIF(\'' + SH.REDEMPTIONS + '\'!F2:F,"OK")'],
      ['Выдано по резидентам', '=JOIN(" · ",ARRAYFORMULA(FILTER(\'' + SH.RESIDENTS + '\'!B2:B&": "&\'' + SH.RESIDENTS + '\'!F2:F,\'' + SH.RESIDENTS + '\'!A2:A<>"")))'],
      ['Выдача остановлена (стоп-кран)', '=\'' + SH.SETTINGS + '\'!B2']
    ]);
  }
  // Служебные листы защищаем от случайной правки (владелец всё равно может редактировать).
  [SH.COUPONS, SH.REDEMPTIONS, SH.LOG].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).length === 0) sh.protect().setWarningOnly(true);
  });
  var def = ss.getSheetByName('Лист1') || ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
}

function adminCreateStaffLink() {
  var ui = SpreadsheetApp.getUi();
  var residents = residents_(true);
  var ids = Object.keys(residents);
  var r1 = ui.prompt('Ссылка сканера', 'Введите resident_id (' + ids.join(', ') + '):', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  var rid = r1.getResponseText().trim();
  if (!residents[rid]) { ui.alert('Нет резидента «' + rid + '».'); return; }
  var r2 = ui.prompt('Подпись', 'Кто будет сканировать (например «Анна, телефон 1»):', ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  var key = randToken_() + randToken_().slice(0, 10); // 32 символа
  var sid = 'S' + randCode_(4);
  sheet_(SH.STAFF).appendRow([sid, rid, r2.getResponseText().trim(), hash_('s', key), true, now_()]);
  var last = sheet_(SH.STAFF).getLastRow();
  sheet_(SH.STAFF).getRange(last, C.S_ACTIVE).insertCheckboxes().setValue(true);
  log_('staff_link', sid, Session.getActiveUser().getEmail(), 'CREATED', rid);
  var site = settings_().SITE_URL || 'https://АДРЕС-САЙТА/';
  if (site.slice(-1) !== '/') site += '/';
  var url = site + 'scanner.html#k=' + key;
  var html = HtmlService.createHtmlOutput(
    '<div style="font:14px Arial">Ссылка для <b>' + residents[rid].name + '</b> (' + sid + '). ' +
    'Отправьте её сотруднику лично. Ссылка показывается один раз — в таблице хранится только хэш.<br><br>' +
    '<textarea style="width:100%;height:80px" onclick="this.select()">' + url + '</textarea><br><br>' +
    'Чтобы отключить доступ, снимите галочку «Активен» в листе «Сотрудники» (действует в течение минуты).</div>'
  ).setWidth(520).setHeight(260);
  ui.showModalDialog(html, 'Ссылка сканера');
}

function adminRestoreCoupon() {
  var ui = SpreadsheetApp.getUi();
  var r1 = ui.prompt('Восстановить купон', 'coupon_id (например K7HQ2MA) или 8-значный код гостя:', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  var r2 = ui.prompt('Причина', 'Почему восстанавливаем (обязательно):', ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK || !r2.getResponseText().trim()) { ui.alert('Нужна причина.'); return; }
  var msg = restoreCoupon_(r1.getResponseText().trim(), r2.getResponseText().trim(), Session.getActiveUser().getEmail() || 'admin');
  ui.alert(msg);
}

function restoreCoupon_(ref, reason, operator) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var shC = sheet_(SH.COUPONS);
    var row = /^K[0-9A-Z]{6}$/i.test(ref) ? findRow_(shC, C.C_ID, ref.toUpperCase()) : null;
    if (!row) { var code = normCode_(ref); if (code) row = findRow_(shC, C.C_CODE, hash_('c', code)); }
    if (!row) return 'Купон не найден.';
    var v = row.values, id = v[C.C_ID - 1];
    if (v[C.C_STATUS - 1] !== 'redeemed') return 'Купон ' + id + ' не погашен — восстанавливать нечего.';
    shC.getRange(row.row, C.C_STATUS, 1, 4).setValues([['issued', '', '', '']]);
    var shR = sheet_(SH.REDEMPTIONS), n = shR.getLastRow() - 1, count = 0;
    if (n > 0) {
      var vals = shR.getRange(2, 1, n, C.R_STATUS).getValues();
      for (var i = 0; i < vals.length; i++) {
        if (vals[i][C.R_COUPON - 1] === id && vals[i][C.R_STATUS - 1] === 'OK') {
          shR.getRange(i + 2, C.R_STATUS).setValue('REVERSED'); count++;
        }
      }
    }
    SpreadsheetApp.flush();
    CacheService.getScriptCache().removeAll(['cs:' + v[C.C_TOKEN - 1], 'offers']);
    log_('restore', id, operator, 'RESTORED', reason + ' (отменено выдач: ' + count + ')');
    return 'Купон ' + id + ' снова действует. Отменено записей о выдаче: ' + count + '.';
  } finally { lock.releaseLock(); }
}

function adminIssueManual() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Купон вручную', 'Причина выпуска (обязательно):', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK || !r.getResponseText().trim()) return;
  var c = createCoupon_(settings_(), 'admin', '');
  log_('manual_issue', c.id, Session.getActiveUser().getEmail() || 'admin', 'ISSUED', r.getResponseText().trim());
  ui.alert('Купон ' + c.id + '\n\nКод для гостя: ' + c.codePretty + '\n\nСотрудник вводит этот код в сканере через «Ввести код вручную». Код показывается один раз.');
}

function adminCheckIntegrity() {
  SpreadsheetApp.getUi().alert(integrityReport_());
}

function integrityReport_() {
  var shC = sheet_(SH.COUPONS), shR = sheet_(SH.REDEMPTIONS);
  var nc = shC.getLastRow() - 1, nr = shR.getLastRow() - 1;
  var coupons = nc > 0 ? shC.getRange(2, 1, nc, C.C_STAFF).getValues() : [];
  var reds = nr > 0 ? shR.getRange(2, 1, nr, C.R_STATUS).getValues() : [];
  var redeemed = coupons.filter(function (x) { return x[C.C_STATUS - 1] === 'redeemed'; }).length;
  var okRows = reds.filter(function (x) { return x[C.R_STATUS - 1] === 'OK'; });
  var seen = {}, dup = [];
  okRows.forEach(function (x) { if (seen[x[1]]) dup.push(x[1]); seen[x[1]] = true; });
  var res = residents_(true), used = usedByResident_(), over = [];
  Object.keys(res).forEach(function (id) { if (res[id].quota !== null && (used[id] || 0) > res[id].quota) over.push(res[id].name); });
  var problems = [];
  if (redeemed !== okRows.length) problems.push('Погашено купонов ' + redeemed + ', а записей OK ' + okRows.length);
  if (dup.length) problems.push('Двойные выдачи по купонам: ' + dup.join(', '));
  if (over.length) problems.push('Превышена квота: ' + over.join(', '));
  return (problems.length ? 'ПРОБЛЕМЫ:\n' + problems.join('\n') : 'Расхождений нет.') +
    '\n\nКупонов: ' + coupons.length + ', погашено: ' + redeemed + ', выдач OK: ' + okRows.length;
}

function adminClearTestData() {
  var ui = SpreadsheetApp.getUi();
  if (ui.alert('Удалить ВСЕ купоны, выдачи и журнал?', 'Делайте это только перед запуском, после тестов. Резиденты, сотрудники и настройки сохранятся.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    [SH.COUPONS, SH.REDEMPTIONS, SH.LOG].forEach(function (n) {
      var sh = sheet_(n);
      if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
    });
    CacheService.getScriptCache().removeAll(['settings', 'residents', 'offers']);
    log_('clear', '', Session.getActiveUser().getEmail() || 'admin', 'CLEARED', 'Тестовые данные удалены');
  } finally { lock.releaseLock(); }
  ui.alert('Готово. Не забудьте поставить TEST_MODE = FALSE.');
}
