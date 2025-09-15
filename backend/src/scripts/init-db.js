import { query } from '../db.js';

async function createDatabase() {
  try {
    // Create database if not exists
    await query(`
      CREATE DATABASE IF NOT EXISTS newfeedstream
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // Use the database
    await query('USE newfeedstream');

    // Create subjects table
    await query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        department VARCHAR(100) NOT NULL,
        credits INT NOT NULL,
        description TEXT,
        semester VARCHAR(20) NOT NULL,
        type VARCHAR(50),
        instructor_id INT,
        duration VARCHAR(50),
        prerequisites TEXT,
        objectives TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (instructor_id) REFERENCES staff(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create indexes
    await query('CREATE INDEX idx_subjects_department ON subjects(department)');
    await query('CREATE INDEX idx_subjects_semester ON subjects(semester)');
    await query('CREATE INDEX idx_subjects_instructor ON subjects(instructor_id)');
    await query('CREATE INDEX idx_subjects_code ON subjects(code)');

    console.log('✅ Database and tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

createDatabase();
