import ResourcePage from '../components/ResourcePage.jsx';
import * as db from '../data/db.js';

const specialtyOptions = () =>
  db
    .list('specialties')
    .map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` }));

const config = {
  collection: 'disciplines',
  title: 'Дисциплины',
  subtitle: 'Учебный план: дисциплины и количество часов по специальностям',
  titleKey: 'name',
  cascadeNote: 'Связанные оценки студентов по этой дисциплине будут удалены.',
  searchKeys: ['name', 'cycle'],
  sort: (a, b) => a.cycle.localeCompare(b.cycle),
  columns: [
    {
      key: 'specialtyId',
      label: 'Специальность',
      render: (r) => db.label('specialties', r.specialtyId, 'code'),
      width: '120px',
    },
    { key: 'cycle', label: 'Цикл', width: '80px' },
    { key: 'name', label: 'Наименование дисциплины' },
    { key: 'hours', label: 'Часы', width: '90px' },
  ],
  defaults: { cycle: 'ПМ', hours: 0 },
  fields: [
    {
      name: 'specialtyId',
      label: 'Специальность',
      type: 'select',
      required: true,
      options: specialtyOptions,
    },
    {
      name: 'cycle',
      label: 'Цикл',
      type: 'select',
      required: true,
      options: [
        { value: 'ООД', label: 'ООД — общеобразовательные дисциплины' },
        { value: 'БМ', label: 'БМ — базовые модули' },
        { value: 'ПМ', label: 'ПМ — профессиональные модули' },
      ],
    },
    { name: 'name', label: 'Наименование дисциплины', required: true, wide: true },
    { name: 'hours', label: 'Количество часов', type: 'number', required: true },
  ],
};

export default function DisciplinesPage() {
  return <ResourcePage config={config} />;
}
