// Универсальная страница справочника (CRUD) по конфигурации.

import { useMemo, useState } from 'react';
import * as db from '../data/db.js';
import { useDB } from '../lib/util.js';
import { DataTable, EntityForm, Modal } from './ui.jsx';

export default function ResourcePage({ config }) {
  useDB();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // объект | 'new' | null

  const rows = useMemo(() => {
    let items = db.list(config.collection);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((it) =>
        (config.searchKeys || config.columns.map((c) => c.key)).some((k) =>
          String(it[k] ?? '').toLowerCase().includes(q),
        ),
      );
    }
    return config.sort ? [...items].sort(config.sort) : items;
  }, [query, config, editing]);

  const optionsFor = (field, data) =>
    field.options
      ? typeof field.options === 'function'
        ? field.options(data || {})
        : field.options
      : [];

  const save = (data) => {
    if (editing === 'new') db.create(config.collection, data);
    else db.update(config.collection, editing.id, data);
    setEditing(null);
  };

  const del = (row) => {
    if (
      window.confirm(
        `Удалить запись «${row[config.titleKey || 'name']}»?\n${
          config.cascadeNote || ''
        }`,
      )
    ) {
      db.remove(config.collection, row.id);
    }
  };

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>{config.title}</h1>
          {config.subtitle && <p className="muted">{config.subtitle}</p>}
        </div>
        <div className="page-head-actions">
          <input
            className="search"
            placeholder="Поиск…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn primary" onClick={() => setEditing('new')}>
            + Добавить
          </button>
        </div>
      </header>

      <DataTable
        columns={config.columns}
        rows={rows}
        onEdit={(r) => setEditing(r)}
        onDelete={del}
      />

      {editing && (
        <Modal
          title={
            editing === 'new'
              ? `Новая запись · ${config.title}`
              : `Редактирование · ${config.title}`
          }
          onClose={() => setEditing(null)}
        >
          <EntityForm
            fields={config.fields}
            initial={editing === 'new' ? config.defaults || {} : editing}
            optionsFor={optionsFor}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </section>
  );
}
