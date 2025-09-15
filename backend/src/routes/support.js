import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db.js';

const router = express.Router();

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS support_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_role VARCHAR(16) NOT NULL,
      user_id INT NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      attachment_url VARCHAR(512) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

export default function supportRouter() {
  ensureTable().catch(() => {});

  router.post('/support-requests', requireAuth(['DEPT','STAFF','ORG']), async (req, res) => {
    const role = req.user.role;
    const uid = (role === 'DEPT' ? req.user.departmentId : role === 'STAFF' ? req.user.staffId : req.user.orgId) || 0;
    const { subject, message, attachmentUrl } = req.body || {};
    if (!subject || !message) return res.status(400).json({ error: 'subject and message are required' });
    const r = await query(
      'INSERT INTO support_requests (user_role, user_id, subject, message, attachment_url) VALUES (?, ?, ?, ?, ?)',
      [role, uid, subject, message, attachmentUrl || null]
    );
    res.json({ id: r.insertId, ok: true });
  });

  router.get('/support-requests', requireAuth(['ORG']), async (req, res) => {
    const rows = await query('SELECT id, user_role AS userRole, user_id AS userId, subject, message, attachment_url AS attachmentUrl, created_at AS createdAt FROM support_requests ORDER BY id DESC LIMIT 100');
    res.json({ items: rows });
  });

  return router;
}
