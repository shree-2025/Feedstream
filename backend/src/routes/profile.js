import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

function getUserIdentity(user) {
  if (user?.role === 'DEPT') return { userType: 'DEPT', userId: user.departmentId };
  if (user?.role === 'STAFF') return { userType: 'STAFF', userId: user.staffId };
  if (user?.role === 'ORG') return { userType: 'ORG', userId: user.orgId };
  return null;
}

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_type ENUM('DEPT','STAFF','ORG') NOT NULL,
      user_id INT NOT NULL,
      first_name VARCHAR(100) DEFAULT NULL,
      last_name VARCHAR(100) DEFAULT NULL,
      username VARCHAR(100) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(50) DEFAULT NULL,
      bio VARCHAR(512) DEFAULT NULL,
      facebook VARCHAR(512) DEFAULT NULL,
      twitter VARCHAR(512) DEFAULT NULL,
      linkedin VARCHAR(512) DEFAULT NULL,
      instagram VARCHAR(512) DEFAULT NULL,
      avatar_url VARCHAR(512) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user (user_type, user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  // Add missing columns on existing tables
  try { await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username VARCHAR(100) DEFAULT NULL`); } catch {}
  try { await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512) DEFAULT NULL`); } catch {}
  try { await query(`ALTER TABLE profiles MODIFY COLUMN user_type ENUM('DEPT','STAFF','ORG') NOT NULL`); } catch {}
}

export default function profileRouter() {
  // Optionally ensure table exists on load
  ensureTable().catch((e) => console.warn('[profiles] ensure table failed', e));

  // Get current user's profile
  router.get('/', requireAuth(['DEPT', 'STAFF', 'ORG']), async (req, res) => {
    const ident = getUserIdentity(req.user);
    if (!ident) return res.status(403).json({ error: 'Unsupported role' });
    const rows = await query(
      'SELECT id, user_type AS userType, user_id AS userId, first_name AS firstName, last_name AS lastName, username, email, phone, bio, facebook, twitter, linkedin, instagram, avatar_url AS avatarUrl, created_at AS createdAt, updated_at AS updatedAt FROM profiles WHERE user_type = ? AND user_id = ? LIMIT 1',
      [ident.userType, ident.userId]
    );
    if (!rows.length) {
      // Return an empty profile shape (frontend can display defaults)
      return res.json({ userType: ident.userType, userId: ident.userId, firstName: '', lastName: '', username: '', email: '', phone: '', bio: '', facebook: '', twitter: '', linkedin: '', instagram: '', avatarUrl: '' });
    }
    res.json(rows[0]);
  });

  // Create/Update current user's profile (upsert)
  router.put('/', requireAuth(['DEPT', 'STAFF', 'ORG']), async (req, res) => {
    const ident = getUserIdentity(req.user);
    if (!ident) return res.status(403).json({ error: 'Unsupported role' });

    const {
      firstName = '',
      lastName = '',
      username = '',
      email = '',
      phone = '',
      bio = '',
      facebook = '',
      twitter = '',
      linkedin = '',
      instagram = '',
      avatarUrl = ''
    } = req.body || {};

    // Upsert
    await query(
      `INSERT INTO profiles (user_type, user_id, first_name, last_name, username, email, phone, bio, facebook, twitter, linkedin, instagram, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         username = VALUES(username),
         email = VALUES(email),
         phone = VALUES(phone),
         bio = VALUES(bio),
         facebook = VALUES(facebook),
         twitter = VALUES(twitter),
         linkedin = VALUES(linkedin),
         instagram = VALUES(instagram),
         avatar_url = VALUES(avatar_url)`,
      [
        ident.userType,
        ident.userId,
        firstName,
        lastName,
        username,
        email,
        phone,
        bio,
        facebook,
        twitter,
        linkedin,
        instagram,
        avatarUrl,
      ]
    );

    const rows = await query(
      'SELECT id, user_type AS userType, user_id AS userId, first_name AS firstName, last_name AS lastName, username, email, phone, bio, facebook, twitter, linkedin, instagram, avatar_url AS avatarUrl, created_at AS createdAt, updated_at AS updatedAt FROM profiles WHERE user_type = ? AND user_id = ? LIMIT 1',
      [ident.userType, ident.userId]
    );
    res.json(rows[0]);
  });

  // Upload avatar via base64 data URL { image: 'data:image/png;base64,...' }
  router.post('/avatar', requireAuth(['DEPT','STAFF','ORG']), async (req, res) => {
    try {
      const ident = getUserIdentity(req.user);
      if (!ident) return res.status(403).json({ error: 'Unsupported role' });
      const { image } = req.body || {};
      if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image' });
      }
      const matches = image.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
      if (!matches) return res.status(400).json({ error: 'Unsupported image format' });
      const ext = matches[2] === 'jpeg' ? 'jpg' : matches[2];
      const buffer = Buffer.from(matches[3], 'base64');
      const dir = path.join(process.cwd(), 'uploads', 'avatars');
      fs.mkdirSync(dir, { recursive: true });
      const filename = `${ident.userType.toLowerCase()}-${ident.userId}-${Date.now()}.${ext}`;
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, buffer);
      const url = `/uploads/avatars/${filename}`;
      const base = process.env.APP_BASE_URL || process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
      const absoluteUrl = `${base.replace(/\/$/, '')}${url}`;
      return res.json({ url, absoluteUrl });
    } catch (e) {
      console.error('avatar upload failed', e);
      return res.status(500).json({ error: 'Failed to upload avatar' });
    }
  });

  return router;
}
