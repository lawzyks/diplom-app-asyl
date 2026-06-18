import { buildSeed, uid } from './seed.js';

const KEY = 'apc_diploma_db_v2';

let state = load();
const listeners = new Set();

// Мягкие миграции: применяются к старым данным в localStorage без
// сброса всей базы. Каждая миграция — идемпотентна и возвращает
// { state, changed } где changed=true означает «требуется persist».
function migrate(state) {
  if (!state || typeof state !== 'object') return { state, changed: false };
  let changed = false;

  // 2025-06: переименование колледжа
  // «Алматинский политехнический колледж» → КГКП «ALMATY POLYTECHNIC COLLEGE»
  const inst = state.institution;
  if (inst && typeof inst.nameRu === 'string' &&
      /Алматинский политехнический/i.test(inst.nameRu)) {
    state.institution = {
      ...inst,
      nameKz: '«ALMATY POLYTECHNIC COLLEGE» КМҚК',
      nameRu: 'КГКП «ALMATY POLYTECHNIC COLLEGE»',
      shortName: 'ALMATY POLYTECHNIC COLLEGE',
    };
    changed = true;
  }

  return { state, changed };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const { state: migrated, changed } = migrate(parsed);
      if (changed) {
        localStorage.setItem(KEY, JSON.stringify(migrated));
      }
      return migrated;
    }
  } catch {
    /* повреждённые данные — пересоздаём */
  }
  const seed = buildSeed();
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetDB() {
  state = buildSeed();
  persist();
}

// --- Универсальные операции над коллекциями ---

export function list(collection, filter) {
  let items = state[collection] ? [...state[collection]] : [];
  if (filter) {
    items = items.filter((it) =>
      Object.entries(filter).every(([k, v]) =>
        v == null || v === '' ? true : String(it[k]) === String(v),
      ),
    );
  }
  return items;
}

export function get(collection, id) {
  return (state[collection] || []).find((x) => x.id === id) || null;
}

export function create(collection, data) {
  const item = { id: uid(), ...data };
  state[collection] = [...(state[collection] || []), item];
  persist();
  return item;
}

export function update(collection, id, patch) {
  state[collection] = (state[collection] || []).map((x) =>
    x.id === id ? { ...x, ...patch, id } : x,
  );
  persist();
  return get(collection, id);
}

export function remove(collection, id) {
  state[collection] = (state[collection] || []).filter((x) => x.id !== id);

  // Каскадное удаление связанных сущностей
  if (collection === 'specialties') {
    state.qualifications = state.qualifications.filter((q) => q.specialtyId !== id);
    state.disciplines = state.disciplines.filter((d) => d.specialtyId !== id);
    const stu = state.students.filter((s) => s.specialtyId === id).map((s) => s.id);
    state.students = state.students.filter((s) => s.specialtyId !== id);
    state.grades = state.grades.filter((g) => !stu.includes(g.studentId));
  }
  if (collection === 'qualifications') {
    state.students = state.students.map((s) =>
      s.qualificationId === id ? { ...s, qualificationId: '' } : s,
    );
  }
  if (collection === 'disciplines') {
    state.grades = state.grades.filter((g) => g.disciplineId !== id);
  }
  if (collection === 'students') {
    state.grades = state.grades.filter((g) => g.studentId !== id);
  }
  persist();
}

// --- Учебное заведение (единственная запись) ---

export function getInstitution() {
  return state.institution;
}

export function updateInstitution(patch) {
  state.institution = { ...state.institution, ...patch };
  persist();
}

// --- Оценки ---

export function getGrades(studentId) {
  return list('grades', { studentId });
}

export function setGrades(studentId, entries) {
  // entries: [{ disciplineId, value }] — полная замена ведомости студента
  state.grades = state.grades.filter((g) => g.studentId !== studentId);
  const next = entries
    .filter((e) => e.value)
    .map((e) => ({ id: uid(), studentId, disciplineId: e.disciplineId, value: e.value }));
  state.grades = [...state.grades, ...next];
  persist();
}

// Имя связанной записи (для отображения справочников)
export function label(collection, id, field = 'name') {
  const it = get(collection, id);
  return it ? it[field] : '—';
}
