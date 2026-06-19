// Шаблон для печати поверх официального бланка диплома (ТжКБ / ТКБ).
//
// ──────────────────────────────────────────────────────────────────
// Технические требования:
//
//   • Страница строго 150 × 210 мм (A5), ориентация — книжная.
//   • Лист подаётся через ручную подачу короткой стороной вперёд.
//   • Печать в масштабе 100% (Actual size), без Fit to Page / Shrink to Fit.
//   • Начало координат (0,0) — верхний левый угол страницы.
//   • Все координаты задаются в МИЛЛИМЕТРАХ.
//   • Никакого автоматического центрирования: каждый элемент
//     позиционируется абсолютно относительно левого верхнего угла.
//   • Глобальный сдвиг dx / dy (мм) компенсирует возможный увод
//     принтера на 1–3 мм.
// ──────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useReducer, useState } from 'react';

// Физический размер бланка
const A5_W = 150;
const A5_H = 210;

const POS_KEY = 'apc_blank_positions_v1';
const OFFSET_KEY = 'apc_blank_offset_v1';
const OVERRIDES_KEY = 'apc_blank_overrides_v1';

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const MONTHS_KZ = [
  'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
  'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан',
];

// ── Поля по умолчанию ──────────────────────────────────────────────
// Координаты подобраны по фотографии заполненного бланка
// (Зарқымбек Дамир, ТКБ № 2208501) и являются стартовой сеткой.
// Точные значения подгоняются в режиме «Калибровка».
//
//   x  — отступ от левого края листа (мм)
//   y  — отступ от верхнего края листа (мм)
//   w  — ширина поля (мм)
//   fs — кегль (pt ≈ px при печати на 96 dpi)
//   b  — жирный
// Сетка откалибрована по строгому маппингу полей бланка (ТКБ № 2208501,
// Зарқымбек Дамир Дәулетұлы, 30.06.2025). В комментариях рядом с полем
// указан печатный «якорь» бланка, над/рядом с которым пишется значение.
// Тонкая подгонка ±1–2 мм — через глобальный сдвиг dx / dy.
const DEFAULTS_RU = {
  // ТКБ № [value]
  numRU:   { x: 45,  y: 44.0,  w: 35,  fs: 12, b: true,  label: 'ТКБ № (РУ)',                     dataKey: 'diplomaNumber' },
  // Настоящий диплом выдан [Фамилия]
  famRU:   { x: 72,  y: 51.0,  w: 60,  fs: 12, b: true,  label: 'Фамилия (РУ)',                   dataKey: 'lastName' },
  // [Имя Отчество]   ↑ над «(фамилия, имя, отчество)»
  nameRU:  { x: 13,  y: 58.0,  w: 90,  fs: 12, b: true,  label: 'Имя, отчество (РУ)',             dataKey: 'firstMiddle' },
  // в том, что он(-а) в [год] году поступил(-а)
  yInRU:   { x: 53,  y: 64.5,  w: 16,  fs: 12,           label: 'Год поступления (РУ)',           dataKey: 'admissionYear' },
  // [в КГКП «...»]   ↑ над «(полное наименование организации образования)»
  inst1RU: { x: 13,  y: 71.0,  w: 132, fs: 10,           label: 'Уч. заведение · строка 1 (РУ)',  dataKey: 'instLongV' },
  // и в [год] году окончил(-а) полный курс
  yOutRU:  { x: 9,   y: 78.0,  w: 14,  fs: 12,           label: 'Год окончания (РУ)',             dataKey: 'graduationYear' },
  // [КГКП «...»]   ↑ над «(полное наименование организации образования)»  (без «в»)
  inst2RU: { x: 13,  y: 84.5,  w: 95,  fs: 10,           label: 'Уч. заведение · строка 2 (РУ)',  dataKey: 'instLong' },
  // по профессии, специальности [КОД]   — код на правой части этой же строки
  codeRU:  { x: 115, y: 84.5,  w: 30,  fs: 10,           label: 'Код специальности (РУ)',         dataKey: 'specCode' },
  // [«Название специальности»]   ↑ над «(наименование профессии, специальности)»
  specRU:  { x: 13,  y: 91.5,  w: 130, fs: 10,           label: 'Наименование специальности (РУ)', dataKey: 'specName', multi: true },
  // Форма обучения [очное]   ↑ над «(очное или заочное или вечернее)»
  formRU:  { x: 47,  y: 104.0, w: 38,  fs: 11,           label: 'Форма обучения (РУ)',            dataKey: 'eduForm' },
  // Решением итоговой аттестационной комиссии от «[ДД]»
  pDayRU:  { x: 122, y: 110.0, w: 10,  fs: 11,           label: 'Дата комиссии · день (РУ)',      dataKey: 'protoDay' },
  // [месяц] [год] года ему (ей) присвоена квалификация
  pMonRU:  { x: 13,  y: 116.0, w: 22,  fs: 11,           label: 'Дата комиссии · месяц (РУ)',     dataKey: 'protoMonthRu' },
  pYrRU:   { x: 38,  y: 116.0, w: 14,  fs: 11,           label: 'Дата комиссии · год (РУ)',       dataKey: 'protoYear' },
  // [КОД «Название квалификации»]   ↑ над «(квалификации)» — две строки
  qualRU:  { x: 13,  y: 124.0, w: 130, fs: 10,           label: 'Квалификация (РУ)',              dataKey: 'qualFull', multi: true },
  // Руководитель __________ [ФИО]
  dirRU:   { x: 95,  y: 167.0, w: 50,  fs: 11,           label: 'Руководитель · ФИО (РУ)',        dataKey: 'directorName' },
  // Заместитель руководителя __________ [ФИО]
  depRU:   { x: 95,  y: 174.5, w: 50,  fs: 11,           label: 'Заместитель · ФИО (РУ)',         dataKey: 'deputyName' },
  // М.П.   Населенный пункт [г. Алматы]
  cityRU:  { x: 60,  y: 184.0, w: 60,  fs: 11,           label: 'Населённый пункт (РУ)',          dataKey: 'city' },
  // « [ДД] » [месяц] _________ [ГГГГ] года.
  iDayRU:  { x: 13,  y: 191.0, w: 8,   fs: 11,           label: 'День выдачи (РУ)',               dataKey: 'issDay' },
  iMonRU:  { x: 28,  y: 191.0, w: 24,  fs: 11,           label: 'Месяц выдачи (РУ)',              dataKey: 'issMonthRu' },
  iYrRU:   { x: 78,  y: 191.0, w: 16,  fs: 11,           label: 'Год выдачи (РУ)',                dataKey: 'issYear' },
  // Регистрационный номер №   [рег.№]
  regRU:   { x: 60,  y: 198.0, w: 60,  fs: 11,           label: 'Регистрационный № (РУ)',         dataKey: 'regNumber' },
};

const DEFAULTS_KZ = {
  numKZ:   { x: 42,  y: 43.5,  w: 35,  fs: 12, b: true,  label: 'ТКБ № (КЗ)',                     dataKey: 'diplomaNumber' },
  fioKZ:   { x: 13,  y: 53.0,  w: 130, fs: 12, b: true,  label: 'ФИО (КЗ)',                       dataKey: 'fullName' },
  yInKZ:   { x: 14,  y: 64.0,  w: 16,  fs: 12,           label: 'Жылы (КЗ)',                      dataKey: 'admissionYear' },
  inst1KZ: { x: 36,  y: 64.0,  w: 108, fs: 10,           label: 'Оқу орны · строка 1 (КЗ)',       dataKey: 'instLongKz' },
  yOutKZ:  { x: 20,  y: 71.0,  w: 16,  fs: 12,           label: 'Бітірген жылы (КЗ)',             dataKey: 'graduationYear' },
  inst2KZ: { x: 40,  y: 71.0,  w: 104, fs: 10,           label: 'Оқу орны · строка 2 (КЗ)',       dataKey: 'instLongKz' },
  codeKZ:  { x: 12,  y: 80.0,  w: 32,  fs: 10,           label: 'Код мамандығы (КЗ)',             dataKey: 'specCode' },
  specKZ:  { x: 13,  y: 87.0,  w: 130, fs: 10,           label: 'Мамандық атауы (КЗ)',            dataKey: 'specNameKz' },
  qualKZ:  { x: 13,  y: 102.0, w: 130, fs: 10,           label: 'Біліктілігі (КЗ)',               dataKey: 'qualFullKz' },
  pNumKZ:  { x: 100, y: 114.0, w: 18,  fs: 11,           label: 'Протокол № (КЗ)',                dataKey: 'protoNumber' },
  pDayKZ:  { x: 18,  y: 120.0, w: 8,   fs: 11,           label: 'Протокол · день (КЗ)',           dataKey: 'protoDay' },
  pMonKZ:  { x: 30,  y: 120.0, w: 24,  fs: 11,           label: 'Протокол · ай (КЗ)',             dataKey: 'protoMonthKz' },
  pYrKZ:   { x: 56,  y: 120.0, w: 14,  fs: 11,           label: 'Протокол · жыл (КЗ)',            dataKey: 'protoYear' },
  formKZ:  { x: 36,  y: 144.0, w: 50,  fs: 11,           label: 'Оқыту нысаны (КЗ)',              dataKey: 'eduFormKz' },
  dirKZ:   { x: 92,  y: 167.0, w: 50,  fs: 11,           label: 'Басшы · аты-жөні (КЗ)',          dataKey: 'directorName' },
  depKZ:   { x: 92,  y: 174.5, w: 50,  fs: 11,           label: 'Орынбасары · аты-жөні (КЗ)',     dataKey: 'deputyName' },
  cityKZ:  { x: 38,  y: 184.0, w: 50,  fs: 11,           label: 'Елді мекен (КЗ)',                dataKey: 'city' },
  iDayKZ:  { x: 12,  y: 191.0, w: 8,   fs: 11,           label: 'Күні (КЗ)',                      dataKey: 'issDay' },
  iMonKZ:  { x: 26,  y: 191.0, w: 24,  fs: 11,           label: 'Айы (КЗ)',                       dataKey: 'issMonthKz' },
  iYrKZ:   { x: 58,  y: 191.0, w: 14,  fs: 11,           label: 'Жылы (КЗ)',                      dataKey: 'issYear' },
  regKZ:   { x: 38,  y: 197.5, w: 60,  fs: 11,           label: 'Тіркеу нөмірі (КЗ)',             dataKey: 'regNumber' },
};

const ALL_DEFAULTS = { ru: DEFAULTS_RU, kz: DEFAULTS_KZ };

function clonePositions() {
  const out = { ru: {}, kz: {} };
  for (const side of ['ru', 'kz']) {
    for (const [id, f] of Object.entries(ALL_DEFAULTS[side])) {
      out[side][id] = { ...f };
    }
  }
  return out;
}

function loadPositions() {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return clonePositions();
    const stored = JSON.parse(raw);
    const merged = clonePositions();
    for (const side of ['ru', 'kz']) {
      if (!stored[side]) continue;
      for (const id of Object.keys(merged[side])) {
        if (stored[side][id]) Object.assign(merged[side][id], stored[side][id]);
      }
    }
    return merged;
  } catch {
    return clonePositions();
  }
}

function persistPositions(positions) {
  // Сохраняем калибруемые поля (x, y, w, fs, hidden) — остальное в коде.
  const minimal = { ru: {}, kz: {} };
  for (const side of ['ru', 'kz']) {
    for (const [id, f] of Object.entries(positions[side])) {
      const def = ALL_DEFAULTS[side]?.[id];
      minimal[side][id] = {
        x: +Number(f.x).toFixed(2),
        y: +Number(f.y).toFixed(2),
        w: +Number(f.w).toFixed(2),
        // fs сохраняем только если отличается от дефолта — экономим место
        ...(def && +Number(f.fs).toFixed(1) !== +Number(def.fs).toFixed(1)
          ? { fs: +Number(f.fs).toFixed(1) }
          : {}),
        ...(f.hidden ? { hidden: true } : {}),
      };
    }
  }
  localStorage.setItem(POS_KEY, JSON.stringify(minimal));
}

function loadOffset() {
  try {
    const raw = localStorage.getItem(OFFSET_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      return {
        dx: Number(o.dx) || 0,
        dy: Number(o.dy) || 0,
        dfs: Number(o.dfs) || 0,
      };
    }
  } catch {
    /* пусто */
  }
  return { dx: 0, dy: 0, dfs: 0 };
}

function persistOffset(offset) {
  localStorage.setItem(OFFSET_KEY, JSON.stringify(offset));
}

// Текстовые override'ы: задаются в режиме калибровки и подменяют
// значение поля. Структура — { ru: { fieldId: 'text' }, kz: {...} }.
function loadOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      return { ru: o.ru || {}, kz: o.kz || {} };
    }
  } catch {
    /* пусто */
  }
  return { ru: {}, kz: {} };
}

function persistOverrides(o) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
}

// ── Общий стор: координаты + сдвиг + override'ы текста ────────────
// И «Диплом» (превью со сканом), и «Бланк A5» работают с одним и тем
// же набором мм-координат и текстовых подмен: правка в одной вкладке
// мгновенно видна в другой. Реализовано как модуль-singleton с
// подпиской (useReducer + useEffect).
let _positions = null;
let _offset = null;
let _overrides = null;
const _subscribers = new Set();

function _ensureLoaded() {
  if (!_positions) _positions = loadPositions();
  if (!_offset) _offset = loadOffset();
  if (!_overrides) _overrides = loadOverrides();
}

function _notify() {
  _subscribers.forEach((cb) => cb());
}

export function useBlankPositions() {
  _ensureLoaded();
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    _subscribers.add(force);
    return () => { _subscribers.delete(force); };
  }, []);
  return {
    positions: _positions,
    offset: _offset,
    overrides: _overrides,
    updateField(side, id, patch) {
      _positions = {
        ..._positions,
        [side]: { ..._positions[side], [id]: { ..._positions[side][id], ...patch } },
      };
      _notify();
    },
    updateOffset(patch) {
      _offset = { ..._offset, ...patch };
      _notify();
    },
    // Подменить текст конкретного поля (override). Передать пустую
    // строку — стереть override и вернуться к данным студента.
    setOverride(side, id, text) {
      const sideObj = { ..._overrides[side] };
      if (text === '' || text == null) delete sideObj[id];
      else sideObj[id] = String(text);
      _overrides = { ..._overrides, [side]: sideObj };
      _notify();
    },
    clearAllOverrides() {
      _overrides = { ru: {}, kz: {} };
      _notify();
    },
    // Скрыть/показать поле. Скрытое не выводится ни на экран
    // (вне калибровки), ни на печать.
    setFieldHidden(side, id, hidden) {
      _positions = {
        ..._positions,
        [side]: { ..._positions[side], [id]: { ..._positions[side][id], hidden: !!hidden } },
      };
      _notify();
    },
    // Полный сброс ОДНОГО поля: координаты + ширина + hidden + override
    // → к дефолтам из кода.
    resetField(side, id) {
      const def = ALL_DEFAULTS[side]?.[id];
      if (!def) return;
      _positions = {
        ..._positions,
        [side]: { ..._positions[side], [id]: { ...def } },
      };
      const sideOvr = { ..._overrides[side] };
      delete sideOvr[id];
      _overrides = { ..._overrides, [side]: sideOvr };
      _notify();
    },
    save() {
      persistPositions(_positions);
      persistOffset(_offset);
      persistOverrides(_overrides);
    },
    reset() {
      localStorage.removeItem(POS_KEY);
      localStorage.removeItem(OFFSET_KEY);
      localStorage.removeItem(OVERRIDES_KEY);
      _positions = clonePositions();
      _offset = { dx: 0, dy: 0, dfs: 0 };
      _overrides = { ru: {}, kz: {} };
      _notify();
    },
    // Экспорт всей калибровки (координаты + сдвиг + override'ы) в
    // JSON для сохранения вне браузера — на случай очистки localStorage,
    // переноса на другую машину или работы в инкогнито.
    exportJson() {
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        positions: _positions,
        offset: _offset,
        overrides: _overrides,
      };
    },
    // Импорт из JSON-файла. Валидирует формат, мержит с дефолтами и
    // сразу пишет в localStorage, чтобы выдержать перезагрузку.
    importJson(data) {
      if (!data || typeof data !== 'object') {
        throw new Error('Файл повреждён или не JSON');
      }
      if (data.positions && data.positions.ru && data.positions.kz) {
        const merged = clonePositions();
        for (const side of ['ru', 'kz']) {
          for (const id of Object.keys(merged[side])) {
            if (data.positions[side]?.[id]) {
              Object.assign(merged[side][id], data.positions[side][id]);
            }
          }
        }
        _positions = merged;
      }
      if (data.offset && typeof data.offset === 'object') {
        _offset = {
          dx: Number(data.offset.dx) || 0,
          dy: Number(data.offset.dy) || 0,
          dfs: Number(data.offset.dfs) || 0,
        };
      }
      if (data.overrides && typeof data.overrides === 'object') {
        _overrides = {
          ru: data.overrides.ru || {},
          kz: data.overrides.kz || {},
        };
      }
      // Импорт = автосейв, чтобы пользователь не забыл нажать «💾».
      persistPositions(_positions);
      persistOffset(_offset);
      persistOverrides(_overrides);
      _notify();
    },
  };
}

// Скачать объект как JSON-файл с осмысленным именем.
function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Открыть file-picker и считать JSON.
function pickJson() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      try {
        const text = await file.text();
        resolve(JSON.parse(text));
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}

// UI-блок «Экспорт / Импорт» — общая кнопочная пара для обеих
// калибровочных панелей. Скачивает JSON и грузит его обратно.
function ExportImport({ store }) {
  const onExport = () => {
    const data = store.exportJson();
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(data, `diploma-calibration-${date}.json`);
  };
  const onImport = async () => {
    try {
      const data = await pickJson();
      if (!data) return;
      store.importJson(data);
      alert('Калибровка загружена.');
    } catch (e) {
      alert('Не удалось загрузить файл: ' + (e.message || e));
    }
  };
  return (
    <div style={{ display: 'flex', gap: '6px', margin: '6px 0' }}>
      <button
        className="btn"
        style={{ flex: 1, padding: '6px 8px', fontSize: '12px' }}
        onClick={onExport}
        title="Скачать JSON со всей калибровкой — на случай очистки браузера"
      >
        ⬇ Экспорт
      </button>
      <button
        className="btn"
        style={{ flex: 1, padding: '6px 8px', fontSize: '12px' }}
        onClick={onImport}
        title="Загрузить ранее сохранённый JSON"
      >
        ⬆ Импорт
      </button>
    </div>
  );
}

// ── Контекст данных для бланка ────────────────────────────────────
function parseISO(iso) {
  if (!iso) return { day: '', monthRu: '', monthKz: '', year: '' };
  const [y, m, d] = iso.split('-');
  return {
    day: String(Number(d)),
    monthRu: MONTHS_RU[Number(m) - 1] || '',
    monthKz: MONTHS_KZ[Number(m) - 1] || '',
    year: y,
  };
}

// Бланк пишет «очное / заочное / вечернее» (средний род — согласовано
// с «обучение»). В системе же форма хранится как «очная / заочная /
// вечерняя» (согласовано с «форма»). Здесь приводим к виду бланка.
const EDU_FORM_RU = {
  'очная': 'очное', 'очное': 'очное',
  'заочная': 'заочное', 'заочное': 'заочное',
  'вечерняя': 'вечернее', 'вечернее': 'вечернее',
};
const EDU_FORM_KZ = {
  'очная': 'күндізгі', 'очное': 'күндізгі',
  'заочная': 'сырттай', 'заочное': 'сырттай',
  'вечерняя': 'кешкі', 'вечернее': 'кешкі',
};

export function buildBlankCtx(t) {
  if (!t) return {};
  const { student: s, institution: inst, specialty, qualification } = t;
  const proto = parseISO(s.protocolDate);
  const iss = parseISO(s.issueDate);
  const cityRu = inst.city || '';
  const cityKz = inst.city || '';
  return {
    diplomaNumber: s.diplomaNumber || '',
    lastName: s.lastName || '',
    firstMiddle: [s.firstName, s.middleName].filter(Boolean).join(' '),
    fullName: [s.lastName, s.firstName, s.middleName].filter(Boolean).join(' '),
    admissionYear: String(s.admissionYear || ''),
    graduationYear: String(s.graduationYear || ''),
    // Имя организации без префикса (для второго появления на бланке —
    // строка после «и в [год] году окончил полный курс»).
    instLong:   inst.nameRu || '',
    instLongKz: inst.nameKz || '',
    // С префиксом «в » / «» для первого появления — строка после
    // «в том, что он(-а) в [год] году поступил(-а)».
    instLongV:   inst.nameRu ? `в ${inst.nameRu}` : '',
    instLongKzV: inst.nameKz ? `${inst.nameKz}` : '',
    specCode: specialty?.code || '',
    specName:   specialty?.name   ? `«${specialty.name}»`   : '',
    specNameKz: specialty?.nameKz ? `«${specialty.nameKz}»` : (specialty?.name ? `«${specialty.name}»` : ''),
    qualFull:   qualification ? `${qualification.code} «${qualification.name}»` : '',
    qualFullKz: qualification
      ? `${qualification.code} «${qualification.nameKz || qualification.name}»`
      : '',
    eduForm: EDU_FORM_RU[s.educationForm] || s.educationForm || '',
    eduFormKz: EDU_FORM_KZ[s.educationForm] || s.educationForm || '',
    protoNumber: s.protocolNumber || '',
    protoDay: proto.day,
    protoMonthRu: proto.monthRu,
    protoMonthKz: proto.monthKz,
    protoYear: proto.year,
    issDay: iss.day,
    issMonthRu: iss.monthRu,
    issMonthKz: iss.monthKz,
    issYear: iss.year,
    directorName: inst.director && inst.director !== '__________________' ? inst.director : '',
    deputyName: inst.secretary && inst.secretary !== '__________________' ? inst.secretary : '',
    // Город печатается с префиксом — на бланке «Населенный пункт» / «Елді мекен»
    // идёт без подсказки «г.», поэтому добавляем его сами.
    city:   cityRu ? `г. ${cityRu}` : '',
    cityKz: cityKz ? `${cityKz} қ.` : '',
    regNumber: s.registrationNumber || '',
  };
}

// ── Компонент ──────────────────────────────────────────────────────
// Пропс suppressPageStyle нужен в режиме «A4-разворот» — два
// BlankSheet'а рядом, @page A4 landscape ставит родитель сам.
export default function BlankSheet({ t, side, calibration, ghost, suppressPageStyle }) {
  const store = useBlankPositions();
  const { positions, offset, overrides } = store;
  const [selectedId, setSelectedId] = useState(null);

  const fields = positions[side];
  const ctx = buildBlankCtx(t);
  const ovr = overrides[side] || {};
  // Override побеждает значение из данных студента; пустая строка
  // принудительно скрывает поле.
  const valueOf = (id, dataKey) => (id in ovr ? ovr[id] : (ctx[dataKey] ?? ''));

  const updateField = useCallback((id, patch) => {
    store.updateField(side, id, patch);
  }, [store, side]);

  const setOffset = useCallback((patch) => {
    store.updateOffset(patch);
  }, [store]);

  const savePositions = useCallback(() => {
    store.save();
    alert('Координаты и сдвиг сохранены в этом браузере.');
  }, [store]);

  const resetPositions = useCallback(() => {
    if (!window.confirm('Сбросить все координаты и сдвиг к значениям по умолчанию?')) return;
    store.reset();
  }, [store]);

  // Перетаскивание поля мышью при калибровке
  const startMove = (e, id) => {
    if (!calibration) return;
    e.preventDefault();
    setSelectedId(id);
    const sheet = e.currentTarget.closest('.blank-sheet');
    const rect = sheet.getBoundingClientRect();
    const mmPerPxX = A5_W / rect.width;
    const mmPerPxY = A5_H / rect.height;
    const startX = e.clientX;
    const startY = e.clientY;
    const start = positions[side][id];
    const onMove = (ev) => {
      const dxMm = (ev.clientX - startX) * mmPerPxX;
      const dyMm = (ev.clientY - startY) * mmPerPxY;
      updateField(id, {
        x: clamp(start.x + dxMm, 0, A5_W - 2),
        y: clamp(start.y + dyMm, 0, A5_H - 2),
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <>
      {/* Динамическое правило @page применяется только для этого вида. */}
      {!suppressPageStyle && (
        <style>{`@page { size: ${A5_W}mm ${A5_H}mm portrait; margin: 0; }`}</style>
      )}

      <div
        className={`sheet blank-sheet${ghost ? ' ghost-on' : ''}`}
        style={{ width: `${A5_W}mm`, height: `${A5_H}mm` }}
      >
        {/* Линейка по краю — только в режиме калибровки на экране */}
        {calibration && <BlankRuler />}

        {/* Призрак формы — для визуальной ориентации в предпросмотре */}
        {ghost && <BlankGhost side={side} />}

        {Object.entries(fields).map(([id, f]) => {
          const value = valueOf(id, f.dataKey);
          // Скрытое поле: не показываем нигде, кроме калибровки (там
          // показываем полупрозрачно, чтобы можно было вернуть).
          if (f.hidden && !calibration) return null;
          if (!calibration && !value) return null;
          const selected = selectedId === id && calibration;
          const top = f.y + offset.dy;
          const left = f.x + offset.dx;
          return (
            <span
              key={id}
              className={[
                'bf',
                f.b && 'bf-bold',
                f.multi && 'bf-multi',
                calibration && 'bf-edit',
                selected && 'bf-selected',
                f.hidden && 'bf-hidden',
              ].filter(Boolean).join(' ')}
              style={{
                top: `${top}mm`,
                left: `${left}mm`,
                width: `${f.w}mm`,
                fontSize: `${Math.max(4, f.fs + (offset.dfs || 0))}px`,
              }}
              onMouseDown={(e) => startMove(e, id)}
              title={calibration ? f.label : undefined}
            >
              {value || (calibration ? `⟨${f.label}⟩` : '')}
            </span>
          );
        })}
      </div>

      {calibration && (
        <BlankCalibPanel
          fields={fields}
          side={side}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdate={updateField}
          offset={offset}
          onOffset={setOffset}
          onSave={savePositions}
          onReset={resetPositions}
          overrides={ovr}
          ctx={ctx}
          onOverride={(id, text) => store.setOverride(side, id, text)}
          store={store}
        />
      )}
    </>
  );
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ── Диплом: скан бланка на всю ширину + значения поверх ───────────
// Источник правды по координатам — общий стор useBlankPositions (мм
// от верхнего левого угла A5). Здесь мм линейно мапятся в % скана,
// потому что у скана свой декоративный запас сверху/по бокам.
// SCAN-константы калибруются один раз — если съезжает, крутить их.
const SCAN = {
  xScale: 0.892,   // содержимое формы занимает ~89% ширины скана
  xOffset: 5.2,    // ~5% левого декоративного поля
  yScale: 0.775,   // вертикально форма ужата (декор/герб сверху ~22%)
  yOffset: 22.3,   // ~22% верхнего декора (бьёт по линии «ДИПЛОМ»)
};

const toScanX = (mm) => mm / 300 * 100 * SCAN.xScale + SCAN.xOffset;
const toScanY = (mm) => mm / 210 * 100 * SCAN.yScale + SCAN.yOffset;
const toScanW = (mm) => mm / 300 * 100 * SCAN.xScale;

export function DiplomaSpread({ t, calibration }) {
  const store = useBlankPositions();
  const { positions, offset, overrides } = store;
  const [selectedId, setSelectedId] = useState(null);
  const ctx = buildBlankCtx(t);
  const valueOf = (sideKey, id, dataKey) => {
    const sideOvr = overrides[sideKey] || {};
    return id in sideOvr ? sideOvr[id] : (ctx[dataKey] ?? '');
  };

  // Перетаскивание поля мышью в режиме калибровки
  const startMove = (e, sideKey, id) => {
    if (!calibration) return;
    e.preventDefault();
    setSelectedId(`${sideKey}_${id}`);
    const container = e.currentTarget.closest('.diploma-preview');
    const rect = container.getBoundingClientRect();
    // 1px скана = (300mm / rect.width) / xScale мм по форме
    const mmPerPxX = 300 / rect.width / SCAN.xScale;
    const mmPerPxY = 210 / rect.height / SCAN.yScale;
    const startX = e.clientX;
    const startY = e.clientY;
    const start = positions[sideKey][id];
    const onMove = (ev) => {
      const dx = (ev.clientX - startX) * mmPerPxX;
      const dy = (ev.clientY - startY) * mmPerPxY;
      store.updateField(sideKey, id, {
        x: clamp(start.x + dx, 0, 150),
        y: clamp(start.y + dy, 0, 210),
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const renderField = (sideKey, id, f, xOffsetMm) => {
    const value = valueOf(sideKey, id, f.dataKey);
    if (f.hidden && !calibration) return null;
    if (!value && !calibration) return null;
    const xMm = f.x + offset.dx;
    const yMm = f.y + offset.dy;
    const isSelected = selectedId === `${sideKey}_${id}`;
    return (
      <span
        key={`${sideKey}_${id}`}
        className={[
          'sp-field',
          f.b && 'sp-bold',
          f.multi && 'sp-multi',
          calibration && 'sp-edit',
          isSelected && 'sp-selected',
          f.hidden && 'sp-hidden',
        ].filter(Boolean).join(' ')}
        style={{
          top: `${toScanY(yMm)}%`,
          left: `${toScanX(xMm + xOffsetMm)}%`,
          width: `${toScanW(f.w)}%`,
          fontSize: `${Math.max(4, f.fs + (offset.dfs || 0))}px`,
        }}
        title={f.label}
        onMouseDown={(e) => startMove(e, sideKey, id)}
      >
        {value || (calibration ? `⟨${f.label}⟩` : '')}
      </span>
    );
  };

  return (
    <>
      <div className="diploma-preview no-print">
        <img src="/diplom-template.jpg" alt="Бланк диплома" />
        <div className="diploma-preview-overlay">
          {Object.entries(positions.kz).map(([id, f]) => renderField('kz', id, f, 0))}
          {Object.entries(positions.ru).map(([id, f]) => renderField('ru', id, f, 150))}
        </div>
      </div>

      {calibration && (
        <DiplomaCalibPanel store={store} selectedId={selectedId} onSelect={setSelectedId} ctx={ctx} />
      )}
    </>
  );
}

function DiplomaCalibPanel({ store, selectedId, onSelect, ctx }) {
  const { positions, offset, overrides } = store;
  const [sideKey, id] = selectedId ? selectedId.split('_') : [null, null];
  const sel = sideKey && id ? positions[sideKey]?.[id] : null;
  const sideOvr = sideKey ? (overrides[sideKey] || {}) : {};
  const hasOverride = sel && id in sideOvr;
  const currentText = hasOverride ? sideOvr[id] : (sel ? (ctx?.[sel.dataKey] ?? '') : '');

  const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const nudge = (key, delta) => {
    if (!sel) return;
    store.updateField(sideKey, id, { [key]: clamp(sel[key] + delta, 0, key === 'y' ? 210 : 150) });
  };

  return (
    <aside className="calibration-panel no-print">
      <h3>Калибровка диплома</h3>
      <p className="muted">
        Тяни значения мышью прямо по скану — они сразу обновятся и на
        вкладке «Бланк A5». Кликни поле, чтобы выбрать.
      </p>

      <div className="calib-edit" style={{ background: '#eef6ff', borderColor: '#9cc7ff' }}>
        <strong>Глобальный сдвиг (компенсация принтера)</strong>
        <div className="calib-grid">
          <label>
            dx, мм
            <input
              type="number" step="0.1"
              value={Number(offset.dx).toFixed(1)}
              onChange={(e) => store.updateOffset({ dx: num(e.target.value) })}
            />
          </label>
          <label>
            dy, мм
            <input
              type="number" step="0.1"
              value={Number(offset.dy).toFixed(1)}
              onChange={(e) => store.updateOffset({ dy: num(e.target.value) })}
            />
          </label>
        </div>
        <div className="calib-nudge">
          <button onClick={() => store.updateOffset({ dy: offset.dy - 0.5 })} title="Вверх 0.5">↑ 0.5</button>
          <button onClick={() => store.updateOffset({ dy: offset.dy + 0.5 })} title="Вниз 0.5">↓ 0.5</button>
          <button onClick={() => store.updateOffset({ dx: offset.dx - 0.5 })} title="Влево 0.5">← 0.5</button>
          <button onClick={() => store.updateOffset({ dx: offset.dx + 0.5 })} title="Вправо 0.5">→ 0.5</button>
          <button onClick={() => store.updateOffset({ dx: 0, dy: 0 })} title="Сброс сдвига">⟲ 0</button>
        </div>
        <div className="calib-grid" style={{ marginTop: '8px' }}>
          <label>
            кегль Δ, px
            <input
              type="number" step="0.5" min="-20" max="20"
              value={Number(offset.dfs || 0).toFixed(1)}
              onChange={(e) => store.updateOffset({ dfs: clamp(num(e.target.value), -20, 20) })}
            />
          </label>
        </div>
        <div className="calib-nudge" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <button onClick={() => store.updateOffset({ dfs: clamp((offset.dfs || 0) - 0.5, -20, 20) })} title="Все надписи −0.5">A− все</button>
          <button onClick={() => store.updateOffset({ dfs: clamp((offset.dfs || 0) + 0.5, -20, 20) })} title="Все надписи +0.5">A+ все</button>
          <button onClick={() => store.updateOffset({ dfs: 0 })} title="Глобальную дельту шрифта в ноль">A↺ все</button>
        </div>
      </div>

      {sel ? (
        <div className="calib-edit">
          <strong>{sideKey.toUpperCase()} · {sel.label}</strong>
          <div className="calib-grid">
            <label>
              x, мм
              <input
                type="number" step="0.1"
                value={Number(sel.x).toFixed(1)}
                onChange={(e) => store.updateField(sideKey, id, { x: clamp(num(e.target.value), 0, 150) })}
              />
            </label>
            <label>
              y, мм
              <input
                type="number" step="0.1"
                value={Number(sel.y).toFixed(1)}
                onChange={(e) => store.updateField(sideKey, id, { y: clamp(num(e.target.value), 0, 210) })}
              />
            </label>
            <label>
              w, мм
              <input
                type="number" step="0.1"
                value={Number(sel.w).toFixed(1)}
                onChange={(e) => store.updateField(sideKey, id, { w: clamp(num(e.target.value), 2, 150) })}
              />
            </label>
          </div>
          <div className="calib-nudge">
            <button onClick={() => nudge('y', -0.2)}>↑</button>
            <button onClick={() => nudge('y', 0.2)}>↓</button>
            <button onClick={() => nudge('x', -0.2)}>←</button>
            <button onClick={() => nudge('x', 0.2)}>→</button>
            <button onClick={() => nudge('w', -0.5)}>−ш</button>
            <button onClick={() => nudge('w', 0.5)}>+ш</button>
          </div>

          <div className="calib-grid" style={{ marginTop: '10px' }}>
            <label>
              кегль, px
              <input
                type="number" step="0.5" min="6" max="40"
                value={Number(sel.fs).toFixed(1)}
                onChange={(e) => store.updateField(sideKey, id, {
                  fs: clamp(num(e.target.value), 6, 40),
                })}
              />
            </label>
          </div>
          <div className="calib-nudge" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <button onClick={() => store.updateField(sideKey, id, { fs: clamp(sel.fs - 0.5, 6, 40) })} title="Кегль −0.5">A−</button>
            <button onClick={() => store.updateField(sideKey, id, { fs: clamp(sel.fs + 0.5, 6, 40) })} title="Кегль +0.5">A+</button>
            <button
              onClick={() => {
                const def = positions[sideKey]?.[id] && (
                  ['kz','ru'].map(() => null), null  // placeholder; actual default from ALL_DEFAULTS via store
                );
                // Сбрасываем только fs к дефолту: используем resetField? Нет, он сбрасывает всё.
                // Берём fs из изначального DEFAULTS через сравнение метки — fs хранится в самом f.
                // Простейший путь — обновить fs на дефолтный, который лежит в DEFAULTS_*.
                const defFs = (sideKey === 'kz' ? DEFAULTS_KZ : DEFAULTS_RU)[id]?.fs;
                if (defFs != null) store.updateField(sideKey, id, { fs: defFs });
              }}
              title="Кегль к дефолту"
            >A↺</button>
          </div>

          <label style={{ display: 'block', marginTop: '10px', fontSize: '11px', color: 'var(--muted)' }}>
            Текст поля{hasOverride ? ' ✎ (override)' : ''}
            <input
              type="text"
              style={{ width: '100%', marginTop: '4px', fontSize: '12px', padding: '5px 7px' }}
              value={currentText}
              placeholder={ctx?.[sel.dataKey] ?? ''}
              onChange={(e) => store.setOverride(sideKey, id, e.target.value)}
            />
          </label>
          {hasOverride && (
            <button
              className="calib-btn calib-btn-ghost"
              onClick={() => store.setOverride(sideKey, id, null)}
              title="Снять текстовый override"
            >
              ↩ Вернуть текст из данных
            </button>
          )}

          <div className="calib-field-actions">
            <button
              className={`calib-btn ${sel.hidden ? 'calib-btn-ok' : 'calib-btn-danger'}`}
              onClick={() => store.setFieldHidden(sideKey, id, !sel.hidden)}
              title={sel.hidden ? 'Показать поле на бланке' : 'Скрыть поле на бланке (на печать не пойдёт)'}
            >
              {sel.hidden ? '👁 Показать поле' : '🗑 Скрыть поле'}
            </button>
            <button
              className="calib-btn calib-btn-info"
              onClick={() => { if (window.confirm('Сбросить координаты, текст и видимость этого поля к дефолту?')) store.resetField(sideKey, id); }}
              title="Откатить позицию, ширину, текст и видимость этого поля"
            >
              ♻ Сброс поля
            </button>
          </div>
        </div>
      ) : (
        <p className="muted">Кликни значение на скане или выбери ниже.</p>
      )}

      <div className="calib-global-actions">
        <button
          className="calib-btn calib-btn-primary"
          onClick={() => { store.save(); alert('Сохранено'); }}
        >
          💾 Сохранить всё
        </button>
        <button
          className="calib-btn calib-btn-danger"
          onClick={() => { if (window.confirm('Сбросить ВСЕ координаты, текст и видимость к дефолтам? Действие нельзя отменить.')) store.reset(); }}
        >
          🗑 Сбросить всё
        </button>
      </div>
      <ExportImport store={store} />

      <ul className="calib-list">
        {['ru', 'kz'].flatMap((sk) =>
          Object.entries(positions[sk]).map(([fid, f]) => {
            const isHidden = !!f.hidden;
            const hasOvr = fid in (overrides[sk] || {});
            return (
            <li key={`${sk}_${fid}`} className={[
              selectedId === `${sk}_${fid}` && 'active',
              isHidden && 'hidden-field',
            ].filter(Boolean).join(' ')}>
              <button onClick={() => onSelect(`${sk}_${fid}`)} title={f.label}>
                {sk.toUpperCase()} · {f.label}
                {isHidden && ' · 🗑'}
                {hasOvr && ' · ✎'}
              </button>
            </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}

// ── Линейка по краю листа (мм) ─────────────────────────────────────
function BlankRuler() {
  const ticksX = [];
  for (let mm = 0; mm <= A5_W; mm += 10) {
    ticksX.push(
      <span key={`x${mm}`} className="bf-tick bf-tick-x" style={{ left: `${mm}mm` }}>
        {mm % 50 === 0 ? mm : ''}
      </span>,
    );
  }
  const ticksY = [];
  for (let mm = 0; mm <= A5_H; mm += 10) {
    ticksY.push(
      <span key={`y${mm}`} className="bf-tick bf-tick-y" style={{ top: `${mm}mm` }}>
        {mm % 50 === 0 ? mm : ''}
      </span>,
    );
  }
  return (
    <div className="bf-ruler no-print" aria-hidden>
      {ticksX}
      {ticksY}
    </div>
  );
}

// ── «Призрак» формы (видим только на экране) ──────────────────────
// Подсказка, где какие поля. На печать не выводится.
function BlankGhost({ side }) {
  if (side === 'ru') {
    return (
      <div className="bf-ghost no-print" aria-hidden>
        <p style={{ top: '30mm', left: '50%', transform: 'translateX(-50%)' }}>ДИПЛОМ</p>
        <p style={{ top: '36mm', left: '50%', transform: 'translateX(-50%)', fontSize: '8px' }}>
          о техническом и профессиональном образовании
        </p>
        <p style={{ top: '43mm', left: '15mm' }}>ТКБ №</p>
        <p style={{ top: '51mm', left: '15mm' }}>Настоящий диплом выдан</p>
        <p style={{ top: '64mm', left: '15mm' }}>в том, что он(-а) в</p>
        <p style={{ top: '64mm', left: '72mm' }}>году поступил(-а)</p>
        <p style={{ top: '77.5mm', left: '12mm' }}>и в</p>
        <p style={{ top: '77.5mm', left: '36mm' }}>году окончил(-а) полный курс</p>
        <p style={{ top: '91mm', left: '15mm', color: '#bbb', fontSize: '7px' }}>(полное наименование организации образования)</p>
        <p style={{ top: '104mm', left: '15mm' }}>Форма обучения</p>
        <p style={{ top: '110mm', left: '15mm' }}>Решением итоговой аттест. комиссии от «     »</p>
        <p style={{ top: '116mm', left: '60mm' }}>года ему (ей) присвоена квалификация</p>
        <p style={{ top: '167mm', left: '15mm' }}>Руководитель</p>
        <p style={{ top: '174.5mm', left: '15mm' }}>Заместитель руководителя</p>
        <p style={{ top: '184mm', left: '15mm' }}>М.П.   Населённый пункт</p>
        <p style={{ top: '191mm', left: '12mm' }}>«       »</p>
        <p style={{ top: '191mm', left: '75mm' }}>года.</p>
        <p style={{ top: '197.5mm', left: '15mm' }}>Регистрационный номер №</p>
      </div>
    );
  }
  return (
    <div className="bf-ghost no-print" aria-hidden>
      <p style={{ top: '30mm', left: '50%', transform: 'translateX(-50%)' }}>ДИПЛОМ</p>
      <p style={{ top: '36mm', left: '50%', transform: 'translateX(-50%)', fontSize: '8px' }}>
        Техникалық және кәсіптік білім туралы
      </p>
      <p style={{ top: '43mm', left: '15mm' }}>ТКБ №</p>
      <p style={{ top: '51mm', left: '15mm' }}>Осы диплом</p>
      <p style={{ top: '60mm', left: '15mm' }}>берілді.</p>
      <p style={{ top: '64mm', left: '12mm' }}>Ол</p>
      <p style={{ top: '64mm', left: '30mm' }}>жылы</p>
      <p style={{ top: '71mm', left: '15mm' }}>түсіп,</p>
      <p style={{ top: '71mm', left: '36mm' }}>жылы толық курсын бітірді.</p>
      <p style={{ top: '102mm', left: '15mm' }}>біліктілігі (біліктіліктері) берілді.</p>
      <p style={{ top: '120mm', left: '15mm' }}>«    »</p>
      <p style={{ top: '120mm', left: '70mm' }}>жылғы протокол №</p>
      <p style={{ top: '144mm', left: '15mm' }}>Оқыту нысаны</p>
      <p style={{ top: '167mm', left: '15mm' }}>Басшы</p>
      <p style={{ top: '174.5mm', left: '15mm' }}>Басшының орынбасары</p>
      <p style={{ top: '184mm', left: '15mm' }}>М.О.   Елді мекен</p>
      <p style={{ top: '197.5mm', left: '15mm' }}>Тіркеу нөмірі №</p>
    </div>
  );
}

// ── Боковая панель калибровки ─────────────────────────────────────
function BlankCalibPanel({
  fields, side, selectedId, onSelect, onUpdate, offset, onOffset, onSave, onReset,
  overrides, ctx, onOverride, store,
}) {
  const sel = selectedId ? fields[selectedId] : null;
  const ovrCount = Object.keys(overrides || {}).length;
  const numVal = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const nudge = (id, key, delta) =>
    onUpdate(id, { [key]: clamp(fields[id][key] + delta, 0, key === 'y' ? A5_H : A5_W) });

  return (
    <aside className="calibration-panel no-print">
      <h3>Калибровка бланка ({side.toUpperCase()})</h3>
      <p className="muted">
        Все координаты в мм от верхнего левого угла. Перетаскивайте поле мышью
        прямо на листе или редактируйте числа здесь.
      </p>

      <div className="calib-edit" style={{ background: '#eef6ff', borderColor: '#9cc7ff' }}>
        <strong>Глобальный сдвиг (компенсация принтера)</strong>
        <div className="calib-grid">
          <label>
            dx, мм
            <input
              type="number"
              step="0.1"
              value={Number(offset.dx).toFixed(1)}
              onChange={(e) => onOffset({ dx: numVal(e.target.value) })}
            />
          </label>
          <label>
            dy, мм
            <input
              type="number"
              step="0.1"
              value={Number(offset.dy).toFixed(1)}
              onChange={(e) => onOffset({ dy: numVal(e.target.value) })}
            />
          </label>
        </div>
        <div className="calib-nudge">
          <button onClick={() => onOffset({ dy: offset.dy - 0.5 })} title="Все поля вверх">↑ 0.5</button>
          <button onClick={() => onOffset({ dy: offset.dy + 0.5 })} title="Все поля вниз">↓ 0.5</button>
          <button onClick={() => onOffset({ dx: offset.dx - 0.5 })} title="Все поля влево">← 0.5</button>
          <button onClick={() => onOffset({ dx: offset.dx + 0.5 })} title="Все поля вправо">→ 0.5</button>
          <button onClick={() => onOffset({ dx: 0, dy: 0 })} title="Без сдвига">⟲ 0</button>
        </div>
        <div className="calib-grid" style={{ marginTop: '8px' }}>
          <label>
            кегль Δ, px
            <input
              type="number" step="0.5" min="-20" max="20"
              value={Number(offset.dfs || 0).toFixed(1)}
              onChange={(e) => onOffset({ dfs: clamp(numVal(e.target.value), -20, 20) })}
            />
          </label>
        </div>
        <div className="calib-nudge" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <button onClick={() => onOffset({ dfs: clamp((offset.dfs || 0) - 0.5, -20, 20) })} title="Все надписи −0.5">A− все</button>
          <button onClick={() => onOffset({ dfs: clamp((offset.dfs || 0) + 0.5, -20, 20) })} title="Все надписи +0.5">A+ все</button>
          <button onClick={() => onOffset({ dfs: 0 })} title="Глобальную дельту шрифта в ноль">A↺ все</button>
        </div>
      </div>

      {sel ? (
        <div className="calib-edit">
          <strong>{sel.label}</strong>
          <div className="calib-grid">
            <label>
              x, мм
              <input
                type="number"
                step="0.1"
                value={Number(sel.x).toFixed(1)}
                onChange={(e) => onUpdate(selectedId, { x: clamp(numVal(e.target.value), 0, A5_W) })}
              />
            </label>
            <label>
              y, мм
              <input
                type="number"
                step="0.1"
                value={Number(sel.y).toFixed(1)}
                onChange={(e) => onUpdate(selectedId, { y: clamp(numVal(e.target.value), 0, A5_H) })}
              />
            </label>
            <label>
              w, мм
              <input
                type="number"
                step="0.1"
                value={Number(sel.w).toFixed(1)}
                onChange={(e) => onUpdate(selectedId, { w: clamp(numVal(e.target.value), 2, A5_W) })}
              />
            </label>
          </div>
          <div className="calib-nudge">
            <button onClick={() => nudge(selectedId, 'y', -0.2)} title="Вверх 0.2 мм">↑</button>
            <button onClick={() => nudge(selectedId, 'y', 0.2)} title="Вниз 0.2 мм">↓</button>
            <button onClick={() => nudge(selectedId, 'x', -0.2)} title="Влево 0.2 мм">←</button>
            <button onClick={() => nudge(selectedId, 'x', 0.2)} title="Вправо 0.2 мм">→</button>
            <button onClick={() => nudge(selectedId, 'w', -0.5)} title="Уже">−ш</button>
            <button onClick={() => nudge(selectedId, 'w', 0.5)} title="Шире">+ш</button>
          </div>

          <div className="calib-grid" style={{ marginTop: '10px' }}>
            <label>
              кегль, px
              <input
                type="number" step="0.5" min="6" max="40"
                value={Number(sel.fs).toFixed(1)}
                onChange={(e) => onUpdate(selectedId, { fs: clamp(numVal(e.target.value), 6, 40) })}
              />
            </label>
          </div>
          <div className="calib-nudge" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <button onClick={() => onUpdate(selectedId, { fs: clamp(sel.fs - 0.5, 6, 40) })} title="Кегль −0.5">A−</button>
            <button onClick={() => onUpdate(selectedId, { fs: clamp(sel.fs + 0.5, 6, 40) })} title="Кегль +0.5">A+</button>
            <button
              onClick={() => {
                const defFs = (side === 'kz' ? DEFAULTS_KZ : DEFAULTS_RU)[selectedId]?.fs;
                if (defFs != null) onUpdate(selectedId, { fs: defFs });
              }}
              title="Кегль к дефолту"
            >A↺</button>
          </div>

          <label style={{ display: 'block', marginTop: '10px', fontSize: '11px', color: 'var(--muted)' }}>
            Текст поля{(selectedId in (overrides || {})) ? ' ✎ (override)' : ''}
            <input
              type="text"
              style={{ width: '100%', marginTop: '4px', fontSize: '12px', padding: '5px 7px' }}
              value={(selectedId in (overrides || {})) ? overrides[selectedId] : (ctx?.[sel.dataKey] ?? '')}
              placeholder={ctx?.[sel.dataKey] ?? ''}
              onChange={(e) => onOverride(selectedId, e.target.value)}
            />
          </label>
          {(selectedId in (overrides || {})) && (
            <button
              className="calib-btn calib-btn-ghost"
              onClick={() => onOverride(selectedId, null)}
              title="Снять текстовый override"
            >
              ↩ Вернуть текст из данных
            </button>
          )}

          <div className="calib-field-actions">
            <button
              className={`calib-btn ${sel.hidden ? 'calib-btn-ok' : 'calib-btn-danger'}`}
              onClick={() => store.setFieldHidden(side, selectedId, !sel.hidden)}
              title={sel.hidden ? 'Показать поле на бланке' : 'Скрыть поле на бланке (на печать не пойдёт)'}
            >
              {sel.hidden ? '👁 Показать поле' : '🗑 Скрыть поле'}
            </button>
            <button
              className="calib-btn calib-btn-info"
              onClick={() => { if (window.confirm('Сбросить координаты, текст и видимость этого поля к дефолту?')) store.resetField(side, selectedId); }}
              title="Откатить позицию, ширину, текст и видимость этого поля"
            >
              ♻ Сброс поля
            </button>
          </div>
        </div>
      ) : (
        <p className="muted">Кликните по полю на бланке или выберите ниже.</p>
      )}

      <div className="calib-global-actions">
        <button className="calib-btn calib-btn-primary" onClick={onSave}>
          💾 Сохранить всё
        </button>
        <button
          className="calib-btn calib-btn-danger"
          onClick={() => { if (window.confirm('Сбросить ВСЕ координаты, текст и видимость к дефолтам? Действие нельзя отменить.')) store.reset(); }}
        >
          🗑 Сбросить всё
        </button>
      </div>
      <ExportImport store={store} />

      <ul className="calib-list">
        {Object.entries(fields).map(([id, f]) => {
          const isHidden = !!f.hidden;
          const hasOvr = id in (overrides || {});
          return (
            <li key={id} className={[
              id === selectedId && 'active',
              isHidden && 'hidden-field',
            ].filter(Boolean).join(' ')}>
              <button onClick={() => onSelect(id)} title={f.label}>
                {f.label} — ({Number(f.x).toFixed(1)}, {Number(f.y).toFixed(1)})
                {isHidden && ' · 🗑'}
                {hasOvr && ' · ✎'}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
