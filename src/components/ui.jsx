// Переиспользуемые элементы интерфейса.

import { useEffect, useState } from 'react';

export function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

// Поле формы по описанию: text | number | date | select | textarea | checkbox
export function Field({ field, value, onChange, options }) {
  const id = `f_${field.name}`;
  const common = {
    id,
    value: value ?? '',
    onChange: (e) =>
      onChange(
        field.type === 'checkbox'
          ? e.target.checked
          : field.type === 'number'
            ? e.target.value === '' ? '' : Number(e.target.value)
            : e.target.value,
      ),
  };

  return (
    <div className={`form-field${field.wide ? ' wide' : ''}`}>
      <label htmlFor={id}>
        {field.label}
        {field.required && <span className="req">*</span>}
      </label>
      {field.type === 'select' ? (
        <select {...common}>
          <option value="">— не выбрано —</option>
          {(options || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea rows={3} {...common} />
      ) : field.type === 'checkbox' ? (
        <input
          id={id}
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
      ) : (
        <input type={field.type || 'text'} {...common} />
      )}
    </div>
  );
}

export function EntityForm({ fields, initial, optionsFor, onSubmit, onCancel }) {
  const [data, setData] = useState(initial || {});

  const set = (name, val) => setData((d) => ({ ...d, [name]: val }));

  const submit = (e) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && (data[f.name] === undefined || data[f.name] === '')) {
        alert(`Заполните поле: «${f.label}»`);
        return;
      }
    }
    onSubmit(data);
  };

  return (
    <form className="entity-form" onSubmit={submit}>
      <div className="form-grid">
        {fields.map((f) => (
          <Field
            key={f.name}
            field={f}
            value={data[f.name]}
            options={f.type === 'select' ? optionsFor?.(f, data) : undefined}
            onChange={(v) => set(f.name, v)}
          />
        ))}
      </div>
      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className="btn primary">
          Сохранить
        </button>
      </div>
    </form>
  );
}

export function DataTable({ columns, rows, onEdit, onDelete, renderActions }) {
  if (!rows.length) {
    return <p className="empty">Записей нет. Добавьте первую запись.</p>;
  }
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={c.width ? { width: c.width } : undefined}>
                {c.label}
              </th>
            ))}
            <th className="actions-col">Действия</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>
              ))}
              <td className="actions-col">
                {renderActions?.(r)}
                {onEdit && (
                  <button className="btn xs" onClick={() => onEdit(r)}>
                    Изменить
                  </button>
                )}
                {onDelete && (
                  <button
                    className="btn xs danger"
                    onClick={() => onDelete(r)}
                  >
                    Удалить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
