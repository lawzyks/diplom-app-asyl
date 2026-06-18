import { getDatabase } from './database.js';

const institutions = [
  {
    name: 'КГКП «ALMATY POLYTECHNIC COLLEGE»',
    description: 'Коммунальное государственное казённое предприятие «ALMATY POLYTECHNIC COLLEGE», г. Алматы'
  }
];

const specialties = [
  { code: 'IT-101', name: 'Information Technology', description: 'IT and Computer Science' },
  { code: 'ENG-201', name: 'Engineering', description: 'Mechanical and Civil Engineering' },
  { code: 'BUS-301', name: 'Business Administration', description: 'Business and Management' },
  { code: 'ARCH-401', name: 'Architecture', description: 'Architectural Design' }
];

const disciplines = [
  { name: 'Programming Fundamentals', code: 'PROG-101', description: 'Introduction to programming' },
  { name: 'Database Design', code: 'DB-201', description: 'SQL and database concepts' },
  { name: 'Web Development', code: 'WEB-301', description: 'Frontend and Backend development' },
  { name: 'Data Structures', code: 'DS-102', description: 'Algorithms and data structures' },
  { name: 'Mathematics', code: 'MATH-101', description: 'Advanced Mathematics' }
];

const students = [
  { name: 'Иван Сидоров', email: 'ivan@polytech.kz', phone: '+7701234567' },
  { name: 'Мария Петрова', email: 'maria@polytech.kz', phone: '+7701234568' },
  { name: 'Алексей Иванов', email: 'alexey@polytech.kz', phone: '+7701234569' }
];

export async function seedDatabase() {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Insert institutions
      institutions.forEach(inst => {
        db.run(
          'INSERT OR IGNORE INTO institutions (name, description) VALUES (?, ?)',
          [inst.name, inst.description]
        );
      });

      // Insert specialties
      specialties.forEach(spec => {
        db.run(
          'INSERT OR IGNORE INTO specialties (code, name, description) VALUES (?, ?, ?)',
          [spec.code, spec.name, spec.description]
        );
      });

      // Insert disciplines
      disciplines.forEach(disc => {
        db.run(
          'INSERT OR IGNORE INTO disciplines (name, code, description) VALUES (?, ?, ?)',
          [disc.name, disc.code, disc.description]
        );
      });

      // Insert students
      students.forEach(student => {
        db.run(
          'INSERT OR IGNORE INTO students (name, email, phone, institution_id, specialty_id) VALUES (?, ?, ?, 1, 1)',
          [student.name, student.email, student.phone],
          function(err) {
            if (err) console.error('Error inserting student:', err);
          }
        );
      });

      // Insert sample grades
      db.all('SELECT id FROM students LIMIT 3', (err, students) => {
        if (err) {
          reject(err);
          return;
        }
        
        db.all('SELECT id FROM disciplines LIMIT 5', (err, disciplines) => {
          if (err) {
            reject(err);
            return;
          }

          students.forEach(student => {
            disciplines.forEach(discipline => {
              const grade = Math.floor(Math.random() * 40) + 60; // 60-100
              db.run(
                'INSERT INTO grades (student_id, discipline_id, grade) VALUES (?, ?, ?)',
                [student.id, discipline.id, grade],
                (err) => {
                  if (err) console.error('Error inserting grade:', err);
                }
              );
            });
          });

          // Insert qualifications
          students.forEach(student => {
            db.run(
              'INSERT INTO qualifications (student_id, title, issued_date) VALUES (?, ?, ?)',
              [student.id, 'Bachelor of Information Technology', new Date().toISOString().split('T')[0]],
              (err) => {
                if (err) console.error('Error inserting qualification:', err);
              }
            );
          });

          resolve();
        });
      });
    });
  });
}
