import { useState } from 'react';
import * as db from '../data/db.js';
import { useDB } from '../lib/util.js';
import { Field } from '../components/ui.jsx';

const FIELDS = [
  { name: 'nameKz', label: 'Наименование (на казахском языке)', wide: true },
  { name: 'nameRu', label: 'Наименование (на русском языке)', wide: true },
  { name: 'shortName', label: 'Краткое наименование', wide: true },
  { name: 'authority', label: 'Уполномоченный орган', wide: true },
  { name: 'country', label: 'Страна' },
  { name: 'city', label: 'Город' },
  { name: 'address', label: 'Адрес', wide: true },
  { name: 'license', label: 'Лицензия (№, дата)', wide: true },
  { name: 'director', label: 'Директор (Ф.И.О.)' },
  { name: 'secretary', label: 'Секретарь (Ф.И.О.)' },
];

export default function InstitutionPage() {
  useDB();
  const [data, setData] = useState(db.getInstitution());
  const [saved, setSaved] = useState(false);

  const set = (name, val) => {
    setData((d) => ({ ...d, [name]: val }));
    setSaved(false);
  };

  const save = (e) => {
    e.preventDefault();
    db.updateInstitution(data);
    setSaved(true);
  };

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Учебное заведение</h1>
          <p className="muted">
            Реквизиты колледжа подставляются в печатные формы документов
          </p>
        </div>
      </header>

      <form className="entity-form card" onSubmit={save}>
        <div className="form-grid">
          {FIELDS.map((f) => (
            <Field
              key={f.name}
              field={f}
              value={data[f.name]}
              onChange={(v) => set(f.name, v)}
            />
          ))}
        </div>
        <div className="form-actions">
          {saved && <span className="ok-badge">✓ Сохранено</span>}
          <button type="submit" className="btn primary">
            Сохранить реквизиты
          </button>
        </div>
      </form>
    </section>
  );
}
