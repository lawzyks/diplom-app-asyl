# Polytech College Almaty - Database Setup

## Changes Made

### 1. **Database Setup (SQLite)**
- Created SQLite database system with the following tables:
  - `students` - Student information
  - `institutions` - Educational institutions
  - `specialties` - Specialization programs
  - `disciplines` - Course/subject information
  - `grades` - Student grades
  - `qualifications` - Student qualifications

### 2. **Backend API Server**
- Created Express.js server on port 3001
- API endpoints for all CRUD operations on database tables
- CORS enabled for frontend communication

### 3. **Branding Updates**
- Changed site title to "Polytech College Almaty"
- Updated favicon to Polytech logo (SVG)
- Updated sidebar branding to display Polytech logo and college name

## How to Run

### Start Frontend Development Server
```bash
npm run dev
```
The frontend will run on http://localhost:5173

### Start Backend API Server (in a new terminal)
```bash
npm run server
```
The API server will run on http://localhost:3001

### Database File
The SQLite database is created at: `server/src/diplomas.db`

## API Endpoints

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get specific student
- `POST /api/students` - Create new student

### Institutions
- `GET /api/institutions` - Get all institutions

### Specialties
- `GET /api/specialties` - Get all specialties

### Disciplines
- `GET /api/disciplines` - Get all disciplines

### Grades
- `GET /api/grades/:studentId` - Get student grades

### Qualifications
- `GET /api/qualifications/:studentId` - Get student qualifications

## Notes

### Logo
- Current logo is an SVG created based on Polytech College branding
- To use the actual PNG logo provided:
  1. Save the image as `polytech-logo.png` in the `public/` folder
  2. Update `index.html` to reference the PNG instead of SVG
  3. The logo will be displayed in the sidebar and browser tab

### Sample Data
The database is automatically seeded with sample data on first run:
- 3 sample students
- Multiple institutions, specialties, disciplines
- Sample grades and qualifications

## Dependencies Added
- `sqlite3` - SQLite database
- `express` - Backend API framework
- `cors` - Cross-Origin Resource Sharing
