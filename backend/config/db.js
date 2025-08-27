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

async function initDB() {
  try {
    const pool = await getPool();
    // Create users table if it does not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'DepartmentAdmin',
        avatar_url VARCHAR(512) NULL,
        department VARCHAR(100) NULL,
        phone VARCHAR(30) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create feedback_responses table if it does not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        form_id INT NOT NULL,
        slug VARCHAR(64) NOT NULL,
        form_title VARCHAR(255) NULL,
        answers JSON NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_form (form_id),
        INDEX idx_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create feedback_forms table if it does not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback_forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NULL,
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

    // Ensure semester column exists on feedback_forms (tolerate older MySQL versions)
    try {
      await pool.query("ALTER TABLE feedback_forms ADD COLUMN IF NOT EXISTS semester VARCHAR(10) NULL AFTER end_date");
    } catch (e) {
      // Fallback when IF NOT EXISTS is unsupported: try a plain ADD and ignore duplicate column error
      try {
        await pool.query("ALTER TABLE feedback_forms ADD COLUMN semester VARCHAR(10) NULL AFTER end_date");
      } catch (inner) {
        // ER_DUP_FIELDNAME (1060) means column already exists; ignore
        if (!(inner && inner.errno === 1060)) {
          throw inner;
        }
      }
    }

    // Ensure title column exists on feedback_forms for older installations
    try {
      await pool.query("ALTER TABLE feedback_forms ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL AFTER id");
    } catch (e) {
      try {
        await pool.query("ALTER TABLE feedback_forms ADD COLUMN title VARCHAR(255) NULL AFTER id");
      } catch (inner) {
        if (!(inner && inner.errno === 1060)) {
          throw inner;
        }
      }
    }

    // Ensure form_title column exists on feedback_responses for older installations
    try {
      await pool.query("ALTER TABLE feedback_responses ADD COLUMN IF NOT EXISTS form_title VARCHAR(255) NULL AFTER slug");
    } catch (e) {
      try {
        await pool.query("ALTER TABLE feedback_responses ADD COLUMN form_title VARCHAR(255) NULL AFTER slug");
      } catch (inner) {
        if (!(inner && inner.errno === 1060)) {
          throw inner;
        }
      }
    }

    // Create subjects table if it does not exist
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

    // Ensure new profile columns exist (for previously created tables)
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512) NULL");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100) NULL");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NULL");

    // Seed three users if they don't exist
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

    // Create questions table if it does not exist
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

    // Create staff table if it does not exist
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

    console.log('MySQL connected and initialized');
  } catch (err) {
    console.error('MySQL init error:', err.message);
    process.exit(1);
  }
}

module.exports = { getPool, initDB };
