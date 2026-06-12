import ResourcePage from '../components/ResourcePage.jsx';
import * as db from '../data/db.js';

const specialtyOptions = () =>
  db
    .list('specialties')
    .map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` }));

const config = {
  collection: 'qualifications',
  title: 'Квалификации',
  subtitle: 'Квалификации, присваиваемые по специальностям',
  titleKey: 'name',
  cascadeNote:
    'У студентов с этой квалификацией поле квалификации будет очищено.',
  searchKeys: ['code', 'name'],
  columns: [
    { key: 'code', label: 'Код', width: '140px' },
    { key: 'name', label: 'Квалификация' },
    {
      key: 'specialtyId',
      label: 'Специальность',
      render: (r) => db.label('specialties', r.specialtyId),
    },
  ],
  fields: [
    {
      name: 'specialtyId',
      label: 'Специальность',
      type: 'select',
      required: true,
      options: specialtyOptions,
    },
    { name: 'code', label: 'Код квалификации', required: true },
    { name: 'name', label: 'Наименование квалификации', required: true, wide: true },
  ],
};

export default function QualificationsPage() {
  return <ResourcePage config={config} />;
}
