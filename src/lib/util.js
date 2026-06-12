// Вспомогательные функции: оценки, средний балл, форматирование.

import { useEffect, useReducer } from 'react';
import { subscribe } from '../data/db.js';

// Хук подписки на изменения имитации БД — компонент перерисовывается
// при любом изменении данных через репозиторий.
export function useDB() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => subscribe(force), []);
}

export const GRADE_OPTIONS = [
  { value: '5', label: 'отлично (5)' },
  { value: '4', label: 'хорошо (4)' },
  { value: '3', label: 'удовлетворительно (3)' },
  { value: '2', label: 'неудовлетворительно (2)' },
  { value: 'зачтено', label: 'зачтено' },
  { value: 'не зачтено', label: 'не зачтено' },
];

const WORDS = {
  5: 'отлично',
  4: 'хорошо',
  3: 'удовлетворительно',
  2: 'неудовлетворительно',
};

// Текст оценки для печатной формы документа
export function gradeText(value) {
  if (!value) return '';
  if (value === 'зачтено' || value === 'не зачтено') return value;
  return WORDS[value] ? `${WORDS[value]} (${value})` : value;
}

// Средний балл по числовым оценкам (2–5); зачёты не учитываются
export function gpa(values) {
  const nums = values
    .map((v) => Number(v))
    .filter((n) => n >= 2 && n <= 5);
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Право на диплом с отличием: нет оценок «3» и ниже,
// доля «5» не менее 75 %, итоговая аттестация на «5».
export function honorsEligible(values, finalGrade) {
  const nums = values.map(Number).filter((n) => n >= 2 && n <= 5);
  if (!nums.length) return false;
  if (nums.some((n) => n < 4)) return false;
  const fives = nums.filter((n) => n === 5).length;
  if (fives / nums.length < 0.75) return false;
  return String(finalGrade) === '5';
}

export function fullName(s) {
  if (!s) return '';
  return [s.lastName, s.firstName, s.middleName].filter(Boolean).join(' ');
}

export function formatDate(iso) {
  if (!iso) return '«___» __________ ____ г.';
  const [y, m, day] = iso.split('-');
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ];
  return `«${Number(day)}» ${months[Number(m) - 1]} ${y} г.`;
}
