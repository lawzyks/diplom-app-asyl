import ResourcePage from '../components/ResourcePage.jsx';
import * as db from '../data/db.js';
import { fullName } from '../lib/util.js';

const specialtyOptions = () =>
  db
    .list('specialties')
    .map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` }));

// Квалификации фильтруются по выбранной специальности студента
const qualificationOptions = (data) =>
  db
    .list('qualifications', { specialtyId: data.specialtyId })
    .map((q) => ({ value: q.id, label: `${q.code} · ${q.name}` }));

const config = {
  collection: 'students',
  title: 'Студенты',
  subtitle: 'Реестр выпускников и данные для документа об образовании',
  titleKey: 'lastName',
  cascadeNote: 'Все оценки студента также будут удалены.',
  searchKeys: ['lastName', 'firstName', 'iin'],
  sort: (a, b) => a.lastName.localeCompare(b.lastName),
  columns: [
    { key: 'fio', label: 'Ф.И.О.', render: (r) => fullName(r) },
    { key: 'iin', label: 'ИИН', width: '150px' },
    {
      key: 'specialtyId',
      label: 'Специальность',
      render: (r) => db.label('specialties', r.specialtyId, 'code'),
      width: '110px',
    },
    {
      key: 'qualificationId',
      label: 'Квалификация',
      render: (r) => db.label('qualifications', r.qualificationId),
    },
    { key: 'graduationYear', label: 'Выпуск', width: '90px' },
  ],
  defaults: {
    educationForm: 'очная',
    prevEducation: 'основное среднее образование',
    finalAttestationType: 'защита дипломного проекта',
    withHonors: false,
  },
  fields: [
    { name: 'lastName', label: 'Фамилия', required: true },
    { name: 'firstName', label: 'Имя', required: true },
    { name: 'middleName', label: 'Отчество' },
    { name: 'iin', label: 'ИИН' },
    { name: 'birthDate', label: 'Дата рождения', type: 'date' },
    {
      name: 'specialtyId',
      label: 'Специальность',
      type: 'select',
      required: true,
      options: specialtyOptions,
    },
    {
      name: 'qualificationId',
      label: 'Квалификация',
      type: 'select',
      options: qualificationOptions,
    },
    {
      name: 'educationForm',
      label: 'Форма обучения',
      type: 'select',
      options: [
        { value: 'очная', label: 'очная' },
        { value: 'заочная', label: 'заочная' },
        { value: 'вечерняя', label: 'вечерняя' },
      ],
    },
    { name: 'prevEducation', label: 'Предыдущее образование', wide: true },
    { name: 'admissionYear', label: 'Год поступления', type: 'number' },
    { name: 'graduationYear', label: 'Год окончания', type: 'number' },
    { name: 'diplomaSeries', label: 'Серия диплома' },
    { name: 'diplomaNumber', label: 'Номер диплома' },
    { name: 'registrationNumber', label: 'Регистрационный №' },
    { name: 'issueDate', label: 'Дата выдачи', type: 'date' },
    { name: 'protocolNumber', label: '№ протокола ГЭК' },
    { name: 'protocolDate', label: 'Дата протокола', type: 'date' },
    {
      name: 'diplomaProjectTheme',
      label: 'Тема дипломного проекта',
      type: 'textarea',
      wide: true,
    },
    {
      name: 'finalAttestationType',
      label: 'Вид итоговой аттестации',
      wide: true,
    },
    {
      name: 'finalGrade',
      label: 'Оценка итоговой аттестации',
      type: 'select',
      options: [
        { value: '5', label: 'отлично (5)' },
        { value: '4', label: 'хорошо (4)' },
        { value: '3', label: 'удовлетворительно (3)' },
      ],
    },
    { name: 'withHonors', label: 'Диплом с отличием', type: 'checkbox' },
  ],
};

export default function StudentsPage() {
  return <ResourcePage config={config} />;
}
