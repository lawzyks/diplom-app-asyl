import ResourcePage from '../components/ResourcePage.jsx';

const config = {
  collection: 'specialties',
  title: 'Специальности',
  subtitle:
    'Классификатор специальностей технического и профессионального образования',
  titleKey: 'name',
  cascadeNote:
    'Вместе со специальностью будут удалены связанные квалификации, дисциплины, студенты и их оценки.',
  columns: [
    { key: 'code', label: 'Код', width: '140px' },
    { key: 'name', label: 'Наименование специальности' },
  ],
  fields: [
    { name: 'code', label: 'Код специальности', required: true },
    {
      name: 'name',
      label: 'Наименование специальности',
      required: true,
      wide: true,
    },
  ],
};

export default function SpecialtiesPage() {
  return <ResourcePage config={config} />;
}
