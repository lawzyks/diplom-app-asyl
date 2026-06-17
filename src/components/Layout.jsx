import { Link } from '../lib/router.jsx';
import * as db from '../data/db.js';
import { useDB } from '../lib/util.js';

const NAV = [
  { to: '/', label: 'Главная', icon: '▦' },
  { group: 'Справочники' },
  { to: '/institution', label: 'Учебное заведение', icon: '🏛' },
  { to: '/specialties', label: 'Специальности', icon: '🎓' },
  { to: '/qualifications', label: 'Квалификации', icon: '🛠' },
  { to: '/disciplines', label: 'Дисциплины', icon: '📚' },
  { to: '/students', label: 'Студенты', icon: '👥' },
  { group: 'Работа с документами' },
  { to: '/grades', label: 'Ввод оценок', icon: '✎' },
  { to: '/document', label: 'Печать диплома', icon: '🖨' },
];

export default function Layout({ children }) {
  useDB();
  const inst = db.getInstitution();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <img src="/polytech-logo.svg" alt="Polytech Logo" style={{width: '40px', height: '40px'}} />
          </div>
          <div className="brand-text">
            <strong>Polytech College</strong>
            <span>Almaty</span>
          </div>
        </div>
        <nav>
          {NAV.map((n, i) =>
            n.group ? (
              <div key={i} className="nav-group">
                {n.group}
              </div>
            ) : (
              <Link key={n.to} to={n.to} className="nav-link">
                <span className="nav-icon">{n.icon}</span>
                {n.label}
              </Link>
            ),
          )}
        </nav>
        <button
          className="reset-btn"
          onClick={() => {
            if (window.confirm('Сбросить все данные к демо-набору?')) {
              db.resetDB();
            }
          }}
        >
          Сбросить демо-данные
        </button>
      </aside>
      <main className="content">{children}</main>
      <div className="developer-credit">made by agpc student asylbek sovet</div>
    </div>
  );
}
