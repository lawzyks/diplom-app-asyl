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
  const [view, setView] = useState('diploma'); // diploma | appendix | blank
  const [blankGhost, setBlankGhost] = useState(true);
  const [calibration, setCalibration] = useState(false);
  const t = useTranscript(studentId);

  // Печать всегда выводит A5 выбранной стороны: на экране показан
  // скан-превью, а под капотом в .print-only висит BlankSheet — при
  // window.print() @media print прячет скан и показывает A5-страницу.
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
          <button
            className="btn primary"
            disabled={!t}
            onClick={view === 'appendix' ? () => window.print() : handlePrint}
            title="Печать на физическом бланке (A5, обе стороны)"
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
              {/* Скрытые BlankSheet обе стороны — для печати. */}
              <div className="print-only" aria-hidden>
                <BlankSheet t={t} side="ru" calibration={false} ghost={false} />
              </div>
              <div className="print-only" aria-hidden>
                <BlankSheet t={t} side="kz" calibration={false} ghost={false} />
              </div>
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
            </>
          )}
          {view === 'appendix' && <AppendixSheet t={t} />}
        </div>
      )}
    </section>
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
