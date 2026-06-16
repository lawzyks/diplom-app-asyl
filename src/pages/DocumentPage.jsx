import { useCallback, useMemo, useState } from 'react';
import * as db from '../data/db.js';
import {
  fullName,
  formatDate,
  gpa,
  gradeText,
  honorsEligible,
  useDB,
} from '../lib/util.js';

const STORAGE_KEY = 'apc_diploma_positions_v1';

const DEFAULT_FIELDS = {
  numKZ:   { cls:'num',  top:38.1, left:18,   w:14, label:'ТКБ № (КЗ)',           dataKey:'diplomaNumber' },
  fioKZ:   { cls:'fio',  top:45.4, left:8,    w:25, label:'ФИО (КЗ)',             dataKey:'fullName' },
  yInKZ:   { cls:'sm',   top:54.0, left:13,   w:3,  label:'Год поступления (КЗ)',  dataKey:'yIn' },
  inst1KZ: { cls:'inst', top:54.0, left:23,   w:14, label:'Колледж · стр. 1 (КЗ)', dataKey:'instShort' },
  yOutKZ:  { cls:'sm',   top:58.0, left:17,   w:3,  label:'Год окончания (КЗ)',    dataKey:'yOut' },
  inst2KZ: { cls:'inst', top:58.0, left:24,   w:13, label:'Колледж · стр. 2 (КЗ)', dataKey:'instShort' },
  specKZ:  { cls:'spec', top:62.5, left:8,    w:10, label:'Специальность (КЗ)',    dataKey:'spec' },
  qualKZ:  { cls:'qual', top:66.5, left:30,   w:14, label:'Квалификация (КЗ)',     dataKey:'qual' },
  pYr1KZ:  { cls:'sm',   top:71.5, left:12,   w:3,  label:'Протокол · год 1 (КЗ)', dataKey:'protoYr' },
  pDayKZ:  { cls:'sm',   top:71.5, left:23,   w:5,  label:'Протокол · день (КЗ)',  dataKey:'protoDay' },
  pYr2KZ:  { cls:'sm',   top:71.5, left:32,   w:3,  label:'Протокол · год 2 (КЗ)', dataKey:'protoYr' },
  regKZ:   { cls:'sm',   top:91.9, left:20,   w:14, label:'Рег. № (КЗ)',           dataKey:'regNumber' },
  iYrKZ:   { cls:'sm',   top:93.8, left:11,   w:3,  label:'Год выдачи (КЗ)',       dataKey:'issYr' },
  iDayKZ:  { cls:'sm',   top:93.8, left:22,   w:4,  label:'День выдачи (КЗ)',      dataKey:'issDay' },

  // ─── Правая (РУ) ───────────────────────────────────────────
  numRU:   { cls:'num',  top:38.5, left:69,   w:14, label:'ТКБ № (РУ)',            dataKey:'diplomaNumber' },
  fioRU:   { cls:'fio',  top:45.7, left:55,   w:30, label:'ФИО (РУ)',              dataKey:'fullName' },
  yInRU:   { cls:'sm',   top:51.9, left:70,   w:3,  label:'Год поступления (РУ)',  dataKey:'yIn' },
  yOutRU:  { cls:'sm',   top:58.5, left:61,   w:3,  label:'Год окончания (РУ)',    dataKey:'yOut' },
  specRU:  { cls:'spec', top:64.8, left:67,   w:22, label:'Специальность (РУ)',    dataKey:'spec' },
  pDayRU:  { cls:'sm',   top:72.5, left:58,   w:4,  label:'Протокол · день (РУ)',  dataKey:'protoDay' },
  pYrRU:   { cls:'sm',   top:72.5, left:70,   w:3,  label:'Протокол · год (РУ)',   dataKey:'protoYr' },
  qualRU:  { cls:'qual', top:75.9, left:55,   w:38, label:'Квалификация (РУ)',     dataKey:'qual' },
  cityRU:  { cls:'sm',   top:89.4, left:69,   w:9,  label:'Город (РУ)',            dataKey:'city' },
  iYrRU:   { cls:'sm',   top:89.4, left:81,   w:3,  label:'Год выдачи (РУ)',       dataKey:'issYr' },
  regRU:   { cls:'sm',   top:92.3, left:83,   w:12, label:'Рег. № (РУ)',           dataKey:'regNumber' },
};
const FIELD_ORDER = Object.keys(DEFAULT_FIELDS);

function clone(obj) {
  const out = {};
  for (const k of Object.keys(obj)) out[k] = { ...obj[k] };
  return out;
}

function loadPositions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      const merged = clone(DEFAULT_FIELDS);
      for (const id of FIELD_ORDER) {
        if (stored[id]) Object.assign(merged[id], stored[id]);
      }
      return merged;
    }
  } catch {
  }
  return clone(DEFAULT_FIELDS);
}

function useFieldPositions() {
  const [positions, setPositions] = useState(loadPositions);

  const update = useCallback((id, patch) => {
    setPositions((p) => ({ ...p, [id]: { ...p[id], ...patch } }));
  }, []);

  const save = useCallback(() => {
    const minimal = {};
    for (const [id, f] of Object.entries(positions)) {
      minimal[id] = {
        top: +Number(f.top).toFixed(2),
        left: +Number(f.left).toFixed(2),
        w: +Number(f.w).toFixed(2),
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
  }, [positions]);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPositions(clone(DEFAULT_FIELDS));
  }, []);

  return { positions, update, save, reset };
}

function buildDataCtx(t) {
  if (!t) return {};
  const { student: s, institution: inst, specialty, qualification } = t;
  const yIn = String(s.admissionYear || '').slice(-2);
  const yOut = String(s.graduationYear || '').slice(-2);
  const protoYr = s.protocolDate
    ? String(new Date(s.protocolDate).getFullYear()).slice(-2)
    : '';
  const protoDay = s.protocolDate
    ? String(new Date(s.protocolDate).getDate()).padStart(2, '0')
    : '';
  const issYr = s.issueDate
    ? String(new Date(s.issueDate).getFullYear()).slice(-2)
    : yOut;
  const issDay = s.issueDate
    ? String(new Date(s.issueDate).getDate()).padStart(2, '0')
    : '';
  return {
    diplomaNumber: s.diplomaNumber || '',
    fullName: fullName(s),
    yIn,
    yOut,
    instShort: inst.shortName || '',
    spec: specialty ? `${specialty.code} ${specialty.name}` : '',
    qual: qualification?.name || '',
    protoYr,
    protoDay,
    regNumber: s.registrationNumber || '',
    issYr,
    issDay,
    city: inst.city || '',
  };
}

function useTranscript(studentId) {
  return useMemo(() => {
    if (!studentId) return null;
    const student = db.get('students', studentId);
    if (!student) return null;
    const institution = db.getInstitution();
    const specialty = db.get('specialties', student.specialtyId);
    const qualification = db.get('qualifications', student.qualificationId);
    const disciplines = db
      .list('disciplines', { specialtyId: student.specialtyId })
      .sort((a, b) => a.cycle.localeCompare(b.cycle));
    const gradeByDisc = {};
    db.getGrades(studentId).forEach((g) => (gradeByDisc[g.disciplineId] = g.value));
    const rows = disciplines.map((d, i) => ({
      n: i + 1,
      name: d.name,
      hours: d.hours,
      value: gradeByDisc[d.id] || '',
    }));
    const totalHours = disciplines.reduce((s, d) => s + Number(d.hours || 0), 0);
    const average = gpa(Object.values(gradeByDisc));
    return {
      student,
      institution,
      specialty,
      qualification,
      rows,
      totalHours,
      average,
      honorsHint: honorsEligible(
        Object.values(gradeByDisc),
        student.finalGrade,
      ),
    };
  }, [studentId]);
}

export default function DocumentPage() {
  useDB();
  const students = db.list('students');
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [view, setView] = useState('appendix'); // diploma | appendix
  const [calibration, setCalibration] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const t = useTranscript(studentId);
  const { positions, update, save, reset } = useFieldPositions();

  const onSave = () => {
    save();
    alert('Координаты полей сохранены в этом браузере.');
  };
  const onReset = () => {
    if (window.confirm('Сбросить все координаты к измеренным значениям?')) {
      reset();
    }
  };

  return (
    <section className="page">
      <header className="page-head doc-toolbar no-print">
        <div>
          <h1>Печать диплома</h1>
          <p className="muted">
            Документ государственного образца — диплом и приложение
          </p>
        </div>
        <div className="page-head-actions">
          <select
            className="select-lg"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">— выберите студента —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {fullName(s)}
              </option>
            ))}
          </select>
          <div className="seg">
            <button
              className={view === 'diploma' ? 'on' : ''}
              onClick={() => setView('diploma')}
            >
              Диплом
            </button>
            <button
              className={view === 'appendix' ? 'on' : ''}
              onClick={() => setView('appendix')}
            >
              Приложение
            </button>
          </div>
          {view === 'diploma' && (
            <>
              <button
                className={`btn${calibration ? ' primary' : ''}`}
                onClick={() => setCalibration((v) => !v)}
                title="Включить редактирование позиций полей"
              >
                {calibration ? '✓ Завершить калибровку' : '✎ Калибровка'}
              </button>
              {calibration && (
                <>
                  <button className="btn primary" onClick={onSave}>
                    💾 Сохранить
                  </button>
                  <button className="btn ghost" onClick={onReset}>
                    ↺ Сбросить
                  </button>
                </>
              )}
            </>
          )}
          <button
            className="btn primary"
            disabled={!t}
            onClick={() => window.print()}
          >
            🖨 Печать
          </button>
        </div>
      </header>

      {!t && (
        <p className="empty">Выберите студента, чтобы сформировать документ.</p>
      )}

      {t && t.honorsHint && !t.student.withHonors && !calibration && (
        <div className="hint no-print">
          Успеваемость студента соответствует диплому с отличием. Установите
          флажок «Диплом с отличием» в карточке студента.
        </div>
      )}

      {t && (
        <div className="printable">
          {view === 'diploma' ? (
            <DiplomaSheet
              t={t}
              positions={positions}
              calibration={calibration}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdate={update}
            />
          ) : (
            <AppendixSheet t={t} />
          )}
        </div>
      )}

      {view === 'diploma' && calibration && t && (
        <CalibrationPanel
          positions={positions}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdate={update}
        />
      )}
    </section>
  );
}

function DiplomaSheet({ t, positions, calibration, selectedId, onSelect, onUpdate }) {
  const { student: s } = t;
  const ctx = buildDataCtx(t);

  const startMove = (e, id) => {
    if (!calibration) return;
    e.preventDefault();
    onSelect(id);
    const canvas = e.currentTarget.closest('.diploma-canvas');
    const rect = canvas.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = positions[id];
    const onMove = (ev) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      onUpdate(id, {
        left: clamp(start.left + dx, 0, 99),
        top: clamp(start.top + dy, 0, 100),
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const startResize = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(id);
    const canvas = e.currentTarget.closest('.diploma-canvas');
    const rect = canvas.getBoundingClientRect();
    const startX = e.clientX;
    const startW = positions[id].w;
    const onMove = (ev) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      onUpdate(id, { w: clamp(startW + dx, 1, 45) });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className="sheet diploma-blank">
      <div className="diploma-canvas">
        <img src="/diplom-template.png" alt="Бланк диплома" className="no-print" />
        {FIELD_ORDER.map((id) => {
          const f = positions[id];
          const value = ctx[f.dataKey] ?? '';
          if (!calibration && !value) return null;
          const selected = selectedId === id;
          const cls = [
            'ov',
            `ov-${f.cls}`,
            calibration && 'editable',
            calibration && selected && 'selected',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <span
              key={id}
              className={cls}
              style={{
                top: `${f.top}%`,
                left: `${f.left}%`,
                width: `${f.w}%`,
              }}
              onMouseDown={(e) => startMove(e, id)}
              title={calibration ? f.label : undefined}
            >
              {value || (calibration ? `⟨${f.label}⟩` : '')}
              {calibration && (
                <span
                  className="ov-resize"
                  onMouseDown={(e) => startResize(e, id)}
                  title="Изменить ширину"
                />
              )}
            </span>
          );
        })}
        {s.withHonors && (
          <div className="honors-stamp">с отличием · үздік</div>
        )}
      </div>
      {!calibration && (
        <p className="muted no-print calibrate-hint">
          Бланк — государственный образец РК. Если поля смещены при печати —
          нажмите <b>«✎ Калибровка»</b> в верхней панели: можно перетащить
          поля мышью или ввести точные координаты.
        </p>
      )}
    </div>
  );
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ─── Боковая панель режима калибровки ─────────────────────────────
function CalibrationPanel({ positions, selectedId, onSelect, onUpdate }) {
  const sel = selectedId ? positions[selectedId] : null;
  const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const nudge = (id, key, delta) =>
    onUpdate(id, { [key]: clamp(positions[id][key] + delta, 0, 100) });

  return (
    <aside className="calibration-panel no-print">
      <h3>Калибровка полей</h3>
      <p className="muted">
        Перетащите поле на бланке мышью; правая красная полоска — изменение
        ширины. Стрелки ниже сдвигают на 0.2%.
      </p>

      {sel ? (
        <div className="calib-edit">
          <strong>{sel.label}</strong>
          <div className="calib-grid">
            <label>
              top, %
              <input
                type="number"
                step="0.1"
                value={Number(sel.top).toFixed(1)}
                onChange={(e) =>
                  onUpdate(selectedId, { top: clamp(num(e.target.value), 0, 100) })
                }
              />
            </label>
            <label>
              left, %
              <input
                type="number"
                step="0.1"
                value={Number(sel.left).toFixed(1)}
                onChange={(e) =>
                  onUpdate(selectedId, { left: clamp(num(e.target.value), 0, 100) })
                }
              />
            </label>
            <label>
              width, %
              <input
                type="number"
                step="0.1"
                value={Number(sel.w).toFixed(1)}
                onChange={(e) =>
                  onUpdate(selectedId, { w: clamp(num(e.target.value), 1, 60) })
                }
              />
            </label>
          </div>
          <div className="calib-nudge">
            <button onClick={() => nudge(selectedId, 'top', -0.2)} title="Вверх">↑</button>
            <button onClick={() => nudge(selectedId, 'top', 0.2)} title="Вниз">↓</button>
            <button onClick={() => nudge(selectedId, 'left', -0.2)} title="Влево">←</button>
            <button onClick={() => nudge(selectedId, 'left', 0.2)} title="Вправо">→</button>
            <button onClick={() => nudge(selectedId, 'w', -0.5)} title="Уже">−ш</button>
            <button onClick={() => nudge(selectedId, 'w', 0.5)} title="Шире">+ш</button>
          </div>
        </div>
      ) : (
        <p className="muted">Кликните на поле бланка или выберите ниже.</p>
      )}

      <ul className="calib-list">
        {FIELD_ORDER.map((id) => (
          <li key={id} className={id === selectedId ? 'active' : ''}>
            <button onClick={() => onSelect(id)}>{positions[id].label}</button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// ─── Приложение к диплому ─────────────────────────────────────────
function AppendixSheet({ t }) {
  const { student: s, institution: inst, specialty, qualification } = t;
  const InfoRow = ({ k, v }) => (
    <tr>
      <td className="k">{k}</td>
      <td className="v">{v || '—'}</td>
    </tr>
  );

  return (
    <div className="sheet appendix">
      <div className="serial">
        {s.diplomaSeries} № {s.diplomaNumber}
      </div>
      <h2 className="doc-title">ПРИЛОЖЕНИЕ К ДИПЛОМУ</h2>
      <p className="note">Дипломға қосымша · без диплома недействительно</p>
      <p className="inst-name">{inst.nameRu}</p>

      <table className="info">
        <tbody>
          <InfoRow k="Фамилия, имя, отчество" v={fullName(s)} />
          <InfoRow k="Дата рождения" v={s.birthDate} />
          <InfoRow k="ИИН" v={s.iin} />
          <InfoRow k="Предыдущее образование" v={s.prevEducation} />
          <InfoRow
            k="Год поступления / окончания"
            v={`${s.admissionYear} / ${s.graduationYear}`}
          />
          <InfoRow k="Форма обучения" v={s.educationForm} />
          <InfoRow
            k="Специальность"
            v={`${specialty?.code} «${specialty?.name}»`}
          />
          <InfoRow k="Квалификация" v={qualification?.name} />
        </tbody>
      </table>

      <p className="section-title">
        За время обучения сдал(а) экзамены и зачёты по следующим дисциплинам:
      </p>

      <table className="grades-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>№</th>
            <th>Наименование дисциплин</th>
            <th style={{ width: '70px' }}>Часы</th>
            <th style={{ width: '170px' }}>Оценка</th>
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r) => (
            <tr key={r.n}>
              <td className="c">{r.n}</td>
              <td>{r.name}</td>
              <td className="c">{r.hours}</td>
              <td>{gradeText(r.value) || '—'}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td />
            <td>Итого часов</td>
            <td className="c">{t.totalHours}</td>
            <td />
          </tr>
        </tbody>
      </table>

      <p className="body-text no-indent">
        Итоговая аттестация ({s.finalAttestationType}) —{' '}
        <b>{gradeText(s.finalGrade) || '—'}</b>.
      </p>
      {s.diplomaProjectTheme && (
        <p className="body-text">
          Тема дипломного проекта: «{s.diplomaProjectTheme}».
        </p>
      )}
      <p className="body-text no-indent">
        Всего часов: <b>{t.totalHours}</b>. Дисциплин:{' '}
        <b>{t.rows.length}</b>. Средний балл:{' '}
        <b>{t.average ? t.average.toFixed(2) : '—'}</b>.
      </p>

      <div className="sign-row">
        <div className="sign">
          <span className="sign-line" />
          Директор колледжа
        </div>
        <div className="sign">
          <span className="sign-line" />
          Секретарь
        </div>
      </div>
      <div className="place">
        Регистрационный № {s.registrationNumber}.&nbsp;&nbsp;{inst.city}
        &nbsp;&nbsp;{formatDate(s.issueDate)}
      </div>
    </div>
  );
}
