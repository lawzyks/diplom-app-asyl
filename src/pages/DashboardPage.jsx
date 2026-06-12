import * as db from '../data/db.js';
import { useDB } from '../lib/util.js';
import { Link } from '../lib/router.jsx';

export default function DashboardPage() {
  useDB();
  const inst = db.getInstitution();
  const stats = [
    { to: '/specialties', label: 'Специальности', n: db.list('specialties').length },
    { to: '/qualifications', label: 'Квалификации', n: db.list('qualifications').length },
    { to: '/disciplines', label: 'Дисциплины', n: db.list('disciplines').length },
    { to: '/students', label: 'Студенты', n: db.list('students').length },
  ];

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>{inst.shortName}</h1>
          <p className="muted">
            Автоматизация заполнения дипломов и приложений · документ
            государственного образца РК
          </p>
        </div>
      </header>

      <div className="card inst-card">
        <h3>{inst.nameRu}</h3>
        <p className="muted">{inst.nameKz}</p>
        <div className="inst-grid">
          <div>
            <span>Уполномоченный орган</span>
            <strong>{inst.authority}</strong>
          </div>
          <div>
            <span>Город</span>
            <strong>{inst.city}</strong>
          </div>
          <div>
            <span>Адрес</span>
            <strong>{inst.address}</strong>
          </div>
        </div>
      </div>

      <div className="stat-cards">
        {stats.map((s) => (
          <Link key={s.to} to={s.to} className="stat-card">
            <span className="stat-num">{s.n}</span>
            <span className="stat-label">{s.label}</span>
          </Link>
        ))}
      </div>

      <div className="card">
        <h3>Порядок работы</h3>
        <ol className="howto">
          <li>
            Проверьте реквизиты в разделе{' '}
            <Link to="/institution">«Учебное заведение»</Link>.
          </li>
          <li>
            Заполните связанные справочники: специальности → квалификации →
            дисциплины (учебный план).
          </li>
          <li>
            Внесите выпускников в раздел{' '}
            <Link to="/students">«Студенты»</Link>.
          </li>
          <li>
            В разделе <Link to="/grades">«Ввод оценок»</Link> выставьте
            экзаменационную ведомость.
          </li>
          <li>
            Сформируйте и распечатайте документ в разделе{' '}
            <Link to="/document">«Печать диплома»</Link>.
          </li>
        </ol>
      </div>
    </section>
  );
}
