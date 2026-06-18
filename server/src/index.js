import express from 'express';
import cors from 'cors';
import { initializeDatabase, closeDatabase, getDatabase } from './data/database.js';
import { seedDatabase } from './data/seed.js';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Initialize database
let dbInitialized = false;

async function startServer() {
  try {
    await initializeDatabase();
    await seedDatabase();
    dbInitialized = true;
    console.log('Database initialized and seeded');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }

  // API Routes
  const db = getDatabase();

  // Students
  app.get('/api/students', (req, res) => {
    db.all('SELECT * FROM students', (err, rows) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows);
    });
  });

  app.get('/api/students/:id', (req, res) => {
    db.get('SELECT * FROM students WHERE id = ?', [req.params.id], (err, row) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(row);
    });
  });

  app.post('/api/students', (req, res) => {
    const { name, email, phone, institution_id, specialty_id } = req.body;
    db.run(
      'INSERT INTO students (name, email, phone, institution_id, specialty_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, institution_id, specialty_id],
      function(err) {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ id: this.lastID });
      }
    );
  });

  // Institutions
  app.get('/api/institutions', (req, res) => {
    db.all('SELECT * FROM institutions', (err, rows) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows);
    });
  });

  // Specialties
  app.get('/api/specialties', (req, res) => {
    db.all('SELECT * FROM specialties', (err, rows) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows);
    });
  });

  // Disciplines
  app.get('/api/disciplines', (req, res) => {
    db.all('SELECT * FROM disciplines', (err, rows) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows);
    });
  });

  // Grades
  app.get('/api/grades/:studentId', (req, res) => {
    db.all(
      `SELECT g.*, d.name as discipline_name, d.code as discipline_code 
       FROM grades g 
       JOIN disciplines d ON g.discipline_id = d.id 
       WHERE g.student_id = ?`,
      [req.params.studentId],
      (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
      }
    );
  });

  // Qualifications
  app.get('/api/qualifications/:studentId', (req, res) => {
    db.all(
      'SELECT * FROM qualifications WHERE student_id = ?',
      [req.params.studentId],
      (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
      }
    );
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await closeDatabase();
  process.exit(0);
});
