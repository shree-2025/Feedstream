import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

async function main() {
  const name = process.env.SEED_ORG_NAME || 'Default Organization';
  const email = process.env.SEED_ORG_EMAIL || 'org@example.com';
  const password = process.env.SEED_ORG_PASSWORD || 'secret123';

  // Ensure table exists (no-op if you already imported schema.sql)
  await query(`CREATE TABLE IF NOT EXISTS organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  const existing = await query('SELECT id FROM organizations WHERE email = ?', [email]);
  if (existing.length) {
    console.log(`Organization already exists: ${email} (id=${existing[0].id})`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    'INSERT INTO organizations (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  );
  console.log(`Seeded organization id=${result.insertId}, email=${email}, password=${password}`);
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
