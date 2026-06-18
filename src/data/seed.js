// Начальные (демо) данные. Учебное заведение, специальности, квалификации и
// дисциплины основаны на данных КГКП «ALMATY POLYTECHNIC COLLEGE».
// Все поля редактируются сотрудником колледжа в интерфейсе справочников.

export const uid = () =>
  's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Стабильные идентификаторы для связей в демо-данных
const SP_SOFT = 'sp_soft';
const SP_NET = 'sp_net';
const SP_EL = 'sp_el';
const SP_DIG = 'sp_dig';
const SP_AUTO = 'sp_auto';

const SP_INFOSEC = 'sp_infosec';
const SP_RADIO = 'sp_radio';
const SP_MACHINE = 'sp_machine';

const QL_SOFT = 'ql_soft';
const QL_SOFT_IS = 'ql_soft_is';
const QL_NET = 'ql_net';
const QL_NET_SYS = 'ql_net_sys';
const QL_RADIO_INSTALL = 'ql_radio_install';
const QL_RADIO_MULTI = 'ql_radio_multi';
const QL_MACHINE = 'ql_machine';
const QL_EL = 'ql_el';
const QL_DIG = 'ql_dig';
const QL_AUTO = 'ql_auto';

const STUDENT_DEMO = 'st_demo';
const STUDENT_HONORS = 'st_honors';
const STUDENT_GOOD = 'st_good';
const STUDENT_AVG = 'st_avg';
const STUDENT_LOW = 'st_low';
const STUDENT_MIX = 'st_mix';
const STUDENT_IT2 = 'st_it2';
const STUDENT_NET = 'st_net';
const STUDENT_DAMIR = 'st_damir';

export function buildSeed() {
  // Образец заполненного диплома (Зарқымбек Дамир, ТКБ № 2208501)
  // показывает, что на бланке колледж пишется как «ALMATY POLYTECHNIC
  // COLLEGE» с префиксом КГКП / КМҚК — этим и руководствуемся.
  const institution = {
    nameKz: '«ALMATY POLYTECHNIC COLLEGE» КМҚК',
    nameRu: 'КГКП «ALMATY POLYTECHNIC COLLEGE»',
    shortName: 'ALMATY POLYTECHNIC COLLEGE',
    authority: 'Управление образования города Алматы',
    country: 'Республика Казахстан',
    city: 'Алматы',
    address: 'Республика Казахстан, г. Алматы',
    license: 'KZ__LAA________ от __.__.____',
    director: 'М. Омарбеков',
    secretary: 'М. Мәлікова',
  };

  const specialties = [
    { id: SP_SOFT,    code: '06130100', name: 'Программное обеспечение',
      nameKz: 'Бағдарламалық қамтамасыз ету' },
    { id: SP_NET,     code: '06120100', name: 'Вычислительная техника и информационные сети',
      nameKz: 'Есептеу техникасы және ақпараттық желілер' },
    { id: SP_INFOSEC, code: '06120200', name: 'Системы информационной безопасности',
      nameKz: 'Ақпараттық қауіпсіздік жүйелері' },
    { id: SP_RADIO,   code: '07140900', name: 'Радиотехника, электроника и телекоммуникации',
      nameKz: 'Радиотехника, электроника және телекоммуникациялар' },
    { id: SP_MACHINE, code: '07151100', name: 'Эксплуатация и техническое обслуживание машин и оборудования',
      nameKz: 'Машиналар мен жабдықтарды пайдалану және техникалық қызмет көрсету' },
    { id: SP_EL,      code: '07130100', name: 'Электрооборудование (по видам и отраслям)',
      nameKz: 'Электр жабдықтары (түрлері мен салалары бойынша)' },
    { id: SP_DIG,     code: '07140500', name: 'Цифровая техника (по видам)',
      nameKz: 'Цифрлық техника (түрлері бойынша)' },
    { id: SP_AUTO,    code: '07161300', name: 'Техническое обслуживание, ремонт и эксплуатация автомобильного транспорта',
      nameKz: 'Автомобиль көлігіне техникалық қызмет көрсету, жөндеу және пайдалану' },
  ];

  const qualifications = [
    // 06130100 — Программное обеспечение
    { id: QL_SOFT,    specialtyId: SP_SOFT,    code: '4S06130103',
      name: 'Разработчик программного обеспечения',
      nameKz: 'Бағдарламалық қамтамасыз етуді әзірлеуші' },
    { id: QL_SOFT_IS, specialtyId: SP_SOFT,    code: '4S06130105',
      name: 'Техник информационных систем',
      nameKz: 'Ақпараттық жүйелер технигі' },

    // 06120100 — Вычислительная техника и информационные сети
    { id: QL_NET,     specialtyId: SP_NET,     code: '4S06120103',
      name: 'Техник по обслуживанию компьютерных устройств и сетей',
      nameKz: 'Компьютерлік құрылғылар мен желілерге қызмет көрсету жөніндегі техник' },
    { id: QL_NET_SYS, specialtyId: SP_NET,     code: '4S06120102',
      name: 'Техник сетевого и системного администрирования',
      nameKz: 'Желілік және жүйелік әкімшілендіру технигі' },

    // 07140900 — Радиотехника, электроника и телекоммуникации
    { id: QL_RADIO_INSTALL, specialtyId: SP_RADIO, code: '3W07140901',
      name: 'Электромонтажник-наладчик телекоммуникационного оборудования и каналов связи',
      nameKz: 'Телекоммуникациялық жабдықтар мен байланыс арналарын монтаждаушы-баптаушы' },
    { id: QL_RADIO_MULTI,   specialtyId: SP_RADIO, code: '4S07140905',
      name: 'Техник мультимедийных и цифровых систем',
      nameKz: 'Мультимедиялық және цифрлық жүйелер технигі' },

    // 07151100 — Эксплуатация и техническое обслуживание машин и оборудования
    { id: QL_MACHINE, specialtyId: SP_MACHINE, code: '4S07151102',
      name: 'Техник-механик',
      nameKz: 'Техник-механик' },

    // Прочие специальности колледжа
    { id: QL_EL,      specialtyId: SP_EL,      code: '4S07130103',
      name: 'Техник-электрик',
      nameKz: 'Техник-электрик' },
    { id: QL_DIG,     specialtyId: SP_DIG,     code: '4S07140503',
      name: 'Техник',
      nameKz: 'Техник' },
    { id: QL_AUTO,    specialtyId: SP_AUTO,    code: '4S07161303',
      name: 'Техник-механик',
      nameKz: 'Техник-механик' },
  ];

  // Учебный план специальности «Программное обеспечение (по видам)»
  const d = (name, hours, cycle) => ({
    id: uid(),
    specialtyId: SP_SOFT,
    name,
    hours,
    cycle, // ООД | БМ | ПМ
  });

  const disciplines = [
    d('Профессиональный казахский (русский) язык', 90, 'ООД'),
    d('Профессиональный иностранный язык', 90, 'ООД'),
    d('Физическая культура', 100, 'ООД'),
    d('Применение информационно-коммуникационных технологий в профессиональной деятельности', 90, 'БМ'),
    d('Применение основ экономики, организации и планирования производства', 120, 'БМ'),
    d('Применение основ права и антикоррупционной культуры', 60, 'БМ'),
    d('Разработка алгоритмов и программ на структурных языках программирования', 250, 'ПМ'),
    d('Объектно-ориентированное программирование', 220, 'ПМ'),
    d('Проектирование и разработка баз данных', 200, 'ПМ'),
    d('Разработка веб-приложений', 220, 'ПМ'),
    d('Тестирование и отладка программного обеспечения', 150, 'ПМ'),
    d('Проектирование информационных систем', 180, 'ПМ'),
    d('Администрирование операционных систем и компьютерных сетей', 160, 'ПМ'),
    d('Производственная практика', 720, 'ПМ'),
    d('Преддипломная практика', 180, 'ПМ'),
  ];

  // Базовый шаблон полей выпускника специальности «Программное обеспечение»
  const baseSoft = {
    specialtyId: SP_SOFT,
    qualificationId: QL_SOFT,
    educationForm: 'очная',
    prevEducation: 'основное среднее образование',
    admissionYear: 2021,
    graduationYear: 2024,
    diplomaSeries: 'ТКБ',
    issueDate: '2024-06-28',
    protocolNumber: '5',
    protocolDate: '2024-06-25',
    finalAttestationType: 'защита дипломного проекта',
  };

  const students = [
    {
      ...baseSoft,
      id: STUDENT_DEMO,
      lastName: 'Серіков',
      firstName: 'Алибек',
      middleName: 'Нұрланұлы',
      iin: '060115550123',
      birthDate: '2006-01-15',
      diplomaNumber: '0123456',
      registrationNumber: '1542',
      diplomaProjectTheme:
        'Разработка веб-приложения для автоматизации учёта успеваемости колледжа',
      finalGrade: '5',
      withHonors: false,
    },
    {
      ...baseSoft,
      id: STUDENT_HONORS,
      lastName: 'Аманжолова',
      firstName: 'Айгерим',
      middleName: 'Бақытқызы',
      iin: '060309550512',
      birthDate: '2006-03-09',
      diplomaNumber: '0123457',
      registrationNumber: '1543',
      diplomaProjectTheme:
        'Мобильное приложение для онлайн-расписания студентов колледжа',
      finalGrade: '5',
      withHonors: true,
    },
    {
      ...baseSoft,
      id: STUDENT_GOOD,
      lastName: 'Касенова',
      firstName: 'Дария',
      middleName: 'Ержанқызы',
      iin: '060527550720',
      birthDate: '2006-05-27',
      diplomaNumber: '0123458',
      registrationNumber: '1544',
      diplomaProjectTheme:
        'Информационная система учёта библиотечного фонда колледжа',
      finalGrade: '5',
      withHonors: true,
    },
    {
      ...baseSoft,
      id: STUDENT_AVG,
      lastName: 'Жунусов',
      firstName: 'Дамир',
      middleName: 'Ерболович',
      iin: '060812350319',
      birthDate: '2006-08-12',
      diplomaNumber: '0123459',
      registrationNumber: '1545',
      diplomaProjectTheme:
        'Веб-сервис для бронирования аудиторий колледжа',
      finalGrade: '4',
      withHonors: false,
    },
    {
      ...baseSoft,
      id: STUDENT_LOW,
      lastName: 'Нұрлан',
      firstName: 'Аскар',
      middleName: 'Серікұлы',
      iin: '061104350128',
      birthDate: '2006-11-04',
      diplomaNumber: '0123460',
      registrationNumber: '1546',
      diplomaProjectTheme:
        'Программный модуль для контроля посещаемости занятий',
      finalGrade: '3',
      withHonors: false,
    },
    {
      ...baseSoft,
      id: STUDENT_MIX,
      lastName: 'Бекмұратов',
      firstName: 'Дастан',
      middleName: 'Ерланұлы',
      iin: '061215350432',
      birthDate: '2006-12-15',
      diplomaNumber: '0123461',
      registrationNumber: '1547',
      diplomaProjectTheme:
        'Чат-бот «Помощник студента» для образовательного портала',
      finalGrade: '4',
      withHonors: false,
    },
    {
      ...baseSoft,
      id: STUDENT_IT2,
      lastName: 'Тлеубердинова',
      firstName: 'Жанар',
      middleName: 'Тимуровна',
      iin: '060710550911',
      birthDate: '2006-07-10',
      diplomaNumber: '0123462',
      registrationNumber: '1548',
      diplomaProjectTheme:
        'Система контроля версий учебных проектов на базе Git',
      finalGrade: '5',
      withHonors: false,
    },
    {
      id: STUDENT_NET,
      lastName: 'Орынбаев',
      firstName: 'Ерлан',
      middleName: 'Маратович',
      iin: '060220350844',
      birthDate: '2006-02-20',
      specialtyId: SP_NET,
      qualificationId: QL_NET,
      educationForm: 'очная',
      prevEducation: 'основное среднее образование',
      admissionYear: 2021,
      graduationYear: 2024,
      diplomaSeries: 'ТКБ',
      diplomaNumber: '0123463',
      registrationNumber: '1549',
      issueDate: '2024-06-28',
      protocolNumber: '5',
      protocolDate: '2024-06-25',
      diplomaProjectTheme:
        'Проектирование локальной сети учебного корпуса',
      finalAttestationType: 'защита дипломного проекта',
      finalGrade: '4',
      withHonors: false,
    },
    // Реальный выпускник 2025 года (по образцу диплома, ТКБ № 2208501).
    {
      id: STUDENT_DAMIR,
      lastName: 'Зарқымбек',
      firstName: 'Дамир',
      middleName: 'Дәулетұлы',
      iin: '',
      birthDate: '',
      specialtyId: SP_NET,
      qualificationId: QL_NET_SYS,
      educationForm: 'очная',
      prevEducation: 'основное среднее образование',
      admissionYear: 2024,
      graduationYear: 2025,
      diplomaSeries: 'ТКБ',
      diplomaNumber: '2208501',
      registrationNumber: '3132',
      issueDate: '2025-06-30',
      protocolNumber: '',
      protocolDate: '2025-06-24',
      diplomaProjectTheme: '',
      finalAttestationType: 'защита дипломного проекта',
      finalGrade: '5',
      withHonors: false,
    },
  ];

  // Шаблоны оценок: ключ — id студента, массив — оценка по дисциплине i.
  // Последние две дисциплины — практика (зачёты).
  const gradeMaps = {
    [STUDENT_DEMO]:   ['5','4','5','5','4','5','5','4','5','5','4','5','5','зачтено','зачтено'],
    [STUDENT_HONORS]: ['5','5','5','5','5','5','5','5','5','5','5','5','5','зачтено','зачтено'],
    [STUDENT_GOOD]:   ['5','5','5','4','5','5','5','4','5','5','4','5','5','зачтено','зачтено'],
    [STUDENT_AVG]:    ['4','4','4','3','4','4','4','3','4','4','4','3','4','зачтено','зачтено'],
    [STUDENT_LOW]:    ['3','3','4','3','3','4','3','3','4','3','3','4','3','зачтено','зачтено'],
    [STUDENT_MIX]:    ['5','4','3','5','4','4','4','5','3','5','4','4','5','зачтено','зачтено'],
    [STUDENT_IT2]:    ['5','4','5','4','5','5','4','5','4','5','5','5','4','зачтено','зачтено'],
  };

  const grades = [];
  for (const [studentId, values] of Object.entries(gradeMaps)) {
    disciplines.forEach((disc, i) => {
      const v = values[i];
      if (v) grades.push({ id: uid(), studentId, disciplineId: disc.id, value: v });
    });
  }

  return { institution, specialties, qualifications, disciplines, students, grades };
}
