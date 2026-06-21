  import { useEffect, useMemo, useState } from 'react';
  import * as db from '../data/db.js';
  import { GRADE_OPTIONS, fullName, gpa, useDB } from '../lib/util.js';

  export default function GradesPage() {
    useDB();
    const students = db.list('students');
    const [studentId, setStudentId] = useState(students[0]?.id || '');
    const [draft, setDraft] = useState({}); 
    const [saved, setSaved] = useState(false);

    const student = studentId ? db.get('students', studentId) : null;

    const disciplines = useMemo(
      () =>
        student
          ? db
              .list('disciplines', { specialtyId: student.specialtyId })
              .sort((a, b) => a.cycle.localeCompare(b.cycle))
          : [],
      [student],
    );

    useEffect(() => {
      if (!studentId) return;
      const map = {};
      db.getGrades(studentId).forEach((g) => (map[g.disciplineId] = g.value));
      setDraft(map);
      setSaved(false);
    }, [studentId]);

    const setGrade = (disciplineId, value) => {
      setDraft((d) => ({ ...d, [disciplineId]: value }));
      setSaved(false);
    };

    const save = () => {
      db.setGrades(
        studentId,
        Object.entries(draft).map(([disciplineId, value]) => ({
          disciplineId,
          value,
        })),
      );
      setSaved(true);
    };

    const average = gpa(Object.values(draft));
    const filled = Object.values(draft).filter(Boolean).length;

    return (
      <section className="page">
        <header className="page-head">
          <div>
            <h1>Ввод оценок</h1>
            <p className="muted">
              Экзаменационная ведомость студента по учебному плану специальности
            </p>
          </div>
          <select
            className="select-lg"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">— выберите студента —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {fullName(s)} · {db.label('specialties', s.specialtyId, 'code')}
              </option>
            ))}
          </select>
        </header>

        {!student && <p className="empty">Выберите студента для ввода оценок.</p>}

        {student && disciplines.length === 0 && (
          <p className="empty">
            Для специальности студента не заданы дисциплины. Добавьте их в
            справочнике «Дисциплины».
          </p>
        )}

        {student && disciplines.length > 0 && (
          <>
            <div className="grade-stats">
              <div className="stat">
                <span>Студент</span>
                <strong>{fullName(student)}</strong>
              </div>
              <div className="stat">
                <span>Заполнено</span>
                <strong>
                  {filled} / {disciplines.length}
                </strong>
              </div>
              <div className="stat">
                <span>Средний балл</span>
                <strong>{average ? average.toFixed(2) : '—'}</strong>
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>№</th>
                    <th style={{ width: '70px' }}>Цикл</th>
                    <th>Наименование дисциплины</th>
                    <th style={{ width: '90px' }}>Часы</th>
                    <th style={{ width: '260px' }}>Оценка</th>
                  </tr>
                </thead>
                <tbody>
                  {disciplines.map((disc, i) => (
                    <tr key={disc.id}>
                      <td>{i + 1}</td>
                      <td>{disc.cycle}</td>
                      <td>{disc.name}</td>
                      <td>{disc.hours}</td>
                      <td>
                        <select
                          value={draft[disc.id] || ''}
                          onChange={(e) => setGrade(disc.id, e.target.value)}
                        >
                          <option value="">— не выставлено —</option>
                          {GRADE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-actions sticky-actions">
              {saved && <span className="ok-badge">✓ Ведомость сохранена</span>}
              <button className="btn primary" onClick={save}>
                Сохранить ведомость
              </button>
            </div>
          </>
        )}
      </section>
    );
  }
