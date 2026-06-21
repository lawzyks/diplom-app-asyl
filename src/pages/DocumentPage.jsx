import { useMemo, useState } from 'react';
import * as db from '../data/db.js';
import {
  fullName,
  formatDate,
  gpa,
  gradeText,
  honorsEligible,
  useDB,
} from '../lib/util.js';
import BlankSheet, { DiplomaSpread } from './BlankSheet.jsx';

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
  const [view, setView] = useState('diploma'); 
  const [blankGhost, setBlankGhost] = useState(true);
  const [calibration, setCalibration] = useState(false);
 
  const [printMode, setPrintMode] = useState('a4-spread');

  const [printWithScan, setPrintWithScan] = useState(true);
  // Сдвиг всего разворота относительно физического листа — компенсация
  // механического захвата принтером (бланк уезжает на 2-5 мм при подаче).
  // Сохраняется в localStorage, чтобы пережить перезагрузку и не вводить
  // заново после каждой настройки.
  const [printShiftX, setPrintShiftX] = useState(() => {
    const v = Number(localStorage.getItem('apc_print_shift_x'));
    return Number.isFinite(v) ? v : 0;
  });
  const [printShiftY, setPrintShiftY] = useState(() => {
    const v = Number(localStorage.getItem('apc_print_shift_y'));
    return Number.isFinite(v) ? v : 0;
  });
  const updatePrintShiftX = (v) => {
    setPrintShiftX(v);
    localStorage.setItem('apc_print_shift_x', String(v));
  };
  const updatePrintShiftY = (v) => {
    setPrintShiftY(v);
    localStorage.setItem('apc_print_shift_y', String(v));
  };
  // Какой формат бумаги стоит в драйвере принтера. Это ключевой выбор:
  //  · 'custom-210x150' — драйвер настроен на custom 210×150 (точно бланк).
  //    Тогда @page=210×150, никаких уловок.
  //  · 'a4-portrait' — стандартный A4 portrait (210×297). Контент 210×150
  //    кладётся в ВЕРХНЮЮ часть листа (там, куда подаётся бланк короткой
  //    стороной вперёд, прижатый к верхней направляющей).
  //  · 'a4-landscape-right' — A4 landscape (297×210). Контент кладётся в
  //    ПРАВУЮ часть листа, т.к. пользователь прижимает бланк к правой
  //    направляющей лотка. Это решает «Chromium центрирует @page» —
  //    мы явно размещаем 210×150 в правой 210-мм-полосе A4 landscape.
  const [paperLayout, setPaperLayout] = useState(() => {
    return localStorage.getItem('apc_paper_layout') || 'a4-landscape-right';
  });
  const updatePaperLayout = (v) => {
    setPaperLayout(v);
    localStorage.setItem('apc_paper_layout', v);
  };
  const t = useTranscript(studentId);


  const handlePrint = () => {
    if (!t) return;
    window.print();
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
              title="Диплом: скан + значения. Калибровка и печать прямо отсюда"
            >
              Диплом
            </button>
            <button
              className={view === 'blank' ? 'on' : ''}
              onClick={() => setView('blank')}
              title="Чистый A5 без скана — для проверки 1:1 печати"
            >
              Бланк A5
            </button>
            <button
              className={view === 'appendix' ? 'on' : ''}
              onClick={() => setView('appendix')}
            >
              Приложение
            </button>
          </div>
          {(view === 'diploma' || view === 'blank') && (
            <>
              <button
                className={`btn${calibration ? ' primary' : ''}`}
                onClick={() => setCalibration((v) => !v)}
                title="Перетаскивай значения мышью; сохраняй в боковой панели"
              >
                {calibration ? '✓ Завершить калибровку' : '✎ Калибровка'}
              </button>
            </>
          )}
          {view === 'blank' && (
            <button
              className={`btn${blankGhost ? ' primary' : ''}`}
              onClick={() => setBlankGhost((v) => !v)}
              title="Полупрозрачные подсказки текста формы (только на экране)"
            >
              {blankGhost ? '👁 Подсказки вкл.' : '👁 Подсказки выкл.'}
            </button>
          )}
          {view !== 'appendix' && (
            <div className="seg" title="Как принтер видит бумагу">
              <button
                className={printMode === 'a4-spread' ? 'on' : ''}
                onClick={() => setPrintMode('a4-spread')}
                title="Разложенный диплом (A4 ландшафт, обе стороны рядом)"
              >
                A4 разворот
              </button>
              <button
                className={printMode === 'a5' ? 'on' : ''}
                onClick={() => setPrintMode('a5')}
                title="Сложенный диплом (две страницы A5 портрет, по очереди)"
              >
                A5 × 2
              </button>
            </div>
          )}
          {view !== 'appendix' && printMode === 'a4-spread' && (
            <button
              className={`btn${printWithScan ? ' primary' : ''}`}
              onClick={() => setPrintWithScan((v) => !v)}
              title={printWithScan
                ? 'Сейчас печатается с фоном бланка. Нажмите, чтобы печатать только текст (для физического бланка)'
                : 'Сейчас печатается только текст. Нажмите, чтобы добавить фон бланка'
              }
            >
              {printWithScan ? '🖼 Фон вкл.' : '🖼 Фон выкл.'}
            </button>
          )}
          {view !== 'appendix' && printMode === 'a4-spread' && (
            <div
              className="seg"
              title="Какой формат бумаги выбран в драйвере принтера. От этого зависит, как Chromium размещает контент на физическом листе."
            >
              <button
                className={paperLayout === 'a4-landscape-right' ? 'on' : ''}
                onClick={() => updatePaperLayout('a4-landscape-right')}
                title="A4 landscape (297×210мм) в драйвере, бланк прижат к правой направляющей лотка. Контент 210×150 печатается в правой части листа."
              >
                A4 → справа
              </button>
              <button
                className={paperLayout === 'a4-portrait' ? 'on' : ''}
                onClick={() => updatePaperLayout('a4-portrait')}
                title="A4 portrait (210×297мм) в драйвере, бланк подаётся короткой стороной вверху лотка. Контент 210×150 печатается в верхней части листа."
              >
                A4 ↑ вверху
              </button>
              <button
                className={paperLayout === 'custom-210x150' ? 'on' : ''}
                onClick={() => updatePaperLayout('custom-210x150')}
                title="В драйвере создан Custom paper size 210×150мм. @page точно совпадает с бумагой — без сдвигов."
              >
                Custom 210×150
              </button>
            </div>
          )}
          {view !== 'appendix' && printMode === 'a4-spread' && (
            <div
              className="print-shift-ctl"
              title="Двигает ВЕСЬ разворот (фон+поля) относительно физического листа. Используйте для компенсации механического захвата принтером: если бланк уезжает влево/вверх — задайте положительные X/Y, чтобы напечатать правее/ниже."
            >
              <span className="muted" style={{ fontSize: '12px' }}>↔ Сдвиг, мм:</span>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>X</span>
                <input
                  type="number"
                  step="0.5"
                  value={Number(printShiftX).toFixed(1)}
                  onChange={(e) => updatePrintShiftX(parseFloat(e.target.value) || 0)}
                  style={{ width: '64px', padding: '5px 7px', fontSize: '12px' }}
                />
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Y</span>
                <input
                  type="number"
                  step="0.5"
                  value={Number(printShiftY).toFixed(1)}
                  onChange={(e) => updatePrintShiftY(parseFloat(e.target.value) || 0)}
                  style={{ width: '64px', padding: '5px 7px', fontSize: '12px' }}
                />
              </label>
              {(printShiftX !== 0 || printShiftY !== 0) && (
                <button
                  className="btn"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  onClick={() => { updatePrintShiftX(0); updatePrintShiftY(0); }}
                  title="Обнулить сдвиг разворота"
                >⟲</button>
              )}
            </div>
          )}
          <button
            className="btn primary"
            disabled={!t}
            onClick={view === 'appendix' ? () => window.print() : handlePrint}
            title={
              view === 'appendix'
                ? 'Печать приложения'
                : printMode === 'a4-spread'
                  ? 'Печать на разложенном бланке (A4 ландшафт, обе стороны)'
                  : 'Печать двух A5: сначала RU, потом KZ'
            }
          >
            🖨 Печать ({printMode === 'a4-spread' ? 'A4' : 'A5×2'})
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

      {t && (view === 'diploma' || view === 'blank') && (
        <p className="muted no-print" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 8px' }}>
          Печать на физическом бланке 150×210 мм. В диалоге печати —
          <b> «Actual size» / «Реальный размер»</b>, без Fit to Page и
          Shrink to Fit. Подача — ручная, короткой стороной вперёд. Сдвиг
          принтера (1–3 мм) компенсируйте через <b>dx / dy</b> в калибровке.
        </p>
      )}

      {t && (
        <div className={`printable${view === 'blank' ? ' printable-blank' : ''}`}>
          {view === 'diploma' && (
            <>
              <DiplomaSpread t={t} calibration={calibration} />
              {}
              <PrintArea
                t={t}
                printMode={printMode}
                withScan={printWithScan}
                shiftX={printShiftX}
                shiftY={printShiftY}
                paperLayout={paperLayout}
              />
            </>
          )}
          {view === 'blank' && (
            <>
              <BlankSheet
                t={t}
                side="ru"
                calibration={calibration}
                ghost={blankGhost}
              />
              <BlankSheet
                t={t}
                side="kz"
                calibration={calibration}
                ghost={blankGhost}
              />

              <PrintArea
                t={t}
                printMode={printMode}
                withScan={printWithScan}
                shiftX={printShiftX}
                shiftY={printShiftY}
                paperLayout={paperLayout}
              />
            </>
          )}
          {view === 'appendix' && <AppendixSheet t={t} />}
        </div>
      )}
    </section>
  );
}

function PrintArea({ t, printMode, withScan, shiftX = 0, shiftY = 0, paperLayout = 'a4-landscape-right' }) {
  if (printMode === 'a4-spread') {
    // Размер @page = физический размер бумаги в драйвере принтера.
    // Без этого Chromium центрирует @page внутри физического листа, и
    // контент 210×150 уезжает мимо бланка, лежащего у правой направляющей.
    // CSS-переменные --print-shift-x/y — это дополнительная микро-юстировка
    // (компенсация механического сдвига захвата), применяется поверх
    // позиционирования по layout-классу.
    const shiftStyle = {
      '--print-shift-x': `${Number(shiftX) || 0}mm`,
      '--print-shift-y': `${Number(shiftY) || 0}mm`,
    };
    const pageSize =
      paperLayout === 'a4-portrait' ? '210mm 297mm'
      : paperLayout === 'a4-landscape-right' ? '297mm 210mm'
      : '210mm 150mm';
    return (
      <div
        className={`print-only print-area-a4 layout-${paperLayout}${withScan ? ' with-scan' : ''}`}
        aria-hidden
      >
        {/* @page подстраивается под физическую бумагу. Контент 210×150 mm
            позиционируется CSS-классом layout-* (см. index.css). */}
        <style>{`@page { size: ${pageSize}; margin: 0; }`}</style>
        <div className="print-spread-a4" style={shiftStyle}>
          {withScan && <div className="print-bg-scan" aria-hidden />}
          <div className="print-side">
            <BlankSheet t={t} side="kz" calibration={false} ghost={false} suppressPageStyle />
          </div>
          <div className="print-side">
            <BlankSheet t={t} side="ru" calibration={false} ghost={false} suppressPageStyle />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="print-only" aria-hidden>
      <BlankSheet t={t} side="ru" calibration={false} ghost={false} />
      <BlankSheet t={t} side="kz" calibration={false} ghost={false} suppressPageStyle />
    </div>
  );
}

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
        Итоговая аттестация ({s.finalAttestationType || '—'}) —{' '}
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
