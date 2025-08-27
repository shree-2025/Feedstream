const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

let pool;

async function ensureDatabaseExists() {
  const host = process.env.DB_HOST || 'sns5.bigrock.com';
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306);
  const user = process.env.MYSQL_USER || process.env.DB_USERNAME || 'ctronyt8_root';
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || 'ctx@2025';
  const dbName = process.env.MYSQL_DATABASE || process.env.DB_DATABASE || 'ctronyt8_feedstream';

  const conn = await mysql.createConnection({ host, port, user, password });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.end();
  return { host, port, user, password, dbName };
}

async function getPool() {
  if (!pool) {
    const { host, port, user, password, dbName } = await ensureDatabaseExists();
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

// ✅ Helper: safely add column if missing
async function addColumnIfNotExists(pool, table, column, definition) {
  const [rows] = await pool.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  if (rows.length === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
    console.log(`Added column ${column} to ${table}`);
  }
}

async function initDB() {
  try {
    const pool = await getPool();

    // ---------- USERS ----------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'DepartmentAdmin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await addColumnIfNotExists(pool, 'users', 'avatar_url', 'avatar_url VARCHAR(512) NULL');
    await addColumnIfNotExists(pool, 'users', 'department', 'department VARCHAR(100) NULL');
    await addColumnIfNotExists(pool, 'users', 'phone', 'phone VARCHAR(30) NULL');

    // ---------- FEEDBACK_RESPONSES ----------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        form_id INT NOT NULL,
        slug VARCHAR(64) NOT NULL,
        answers JSON NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_form (form_id),
        INDEX idx_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await addColumnIfNotExists(pool, 'feedback_responses', 'form_title', 'form_title VARCHAR(255) NULL AFTER slug');

    // ---------- FEEDBACK_FORMS ----------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback_forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        subject_id INT NOT NULL,
        question_ids JSON NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        slug VARCHAR(64) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_teacher (teacher_id),
        INDEX idx_subject (subject_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await addColumnIfNotExists(pool, 'feedback_forms', 'title', 'title VARCHAR(255) NULL AFTER id');
    await addColumnIfNotExists(pool, 'feedback_forms', 'semester', 'semester VARCHAR(10) NULL AFTER end_date');

    // ---------- SUBJECTS ----------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        department VARCHAR(100) NOT NULL,
        credits INT NOT NULL DEFAULT 0,
        description TEXT NULL,
        semester VARCHAR(10) NOT NULL,
        type VARCHAR(50) NULL,
        instructor VARCHAR(150) NULL,
        duration VARCHAR(100) NULL,
        prerequisites TEXT NULL,
        objectives TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // ---------- QUESTIONS ----------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        text TEXT NOT NULL,
        type ENUM('multiple-choice','text','rating') NOT NULL,
        options JSON NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NULL,
        is_required TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // ---------- STAFF ----------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(100) NOT NULL,
        status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
        department VARCHAR(100) NULL,
        subjects JSON NULL,
        phone VARCHAR(30) NULL,
        join_date DATE NULL,
        address VARCHAR(255) NULL,
        qualification VARCHAR(255) NULL,
        experience VARCHAR(100) NULL,
        specialization VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // ---------- SEED USERS ----------
    const seedUsers = [
      {
        name: 'Department Admin',
        email: 'admin@test.com',
        role: 'DepartmentAdmin',
        avatar_url: 'https://i.pravatar.cc/150?img=5',
        department: 'Computer Science',
        phone: '+1 555-0101',
      },
      {
        name: 'Staff Member',
        email: 'staff@test.com',
        role: 'Staff',
        avatar_url: 'https://i.pravatar.cc/150?img=8',
        department: 'Mathematics',
        phone: '+1 555-0102',
      },
      {
        name: 'Student User',
        email: 'student@test.com',
        role: 'Student',
        avatar_url: 'https://i.pravatar.cc/150?img=12',
        department: 'Physics',
        phone: '+1 555-0103',
      },
    ];

    for (const u of seedUsers) {
      const [exist] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [u.email]);
      if (!exist || exist.length === 0) {
        const hash = await bcrypt.hash('password123', 10);
        await pool.query(
          'INSERT INTO users (name, email, password, role, avatar_url, department, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [u.name, u.email, hash, u.role, u.avatar_url, u.department, u.phone]
        );
        console.log(`Seeded user: ${u.email} / password123`);
      }
    }

    console.log('MySQL connected and initialized');
  } catch (err) {
    console.error('MySQL init error:', err.message);
    process.exit(1);
  }
}

module.exports = { getPool, initDB };