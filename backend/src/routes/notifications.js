import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message VARCHAR(1024) DEFAULT NULL,
      link VARCHAR(512) DEFAULT NULL,
      role_scope ENUM('OrganizationAdmin','DepartmentAdmin','Staff') DEFAULT 'DepartmentAdmin',
      org_id INT DEFAULT NULL,
      dept_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS notifications_read (
      notification_id INT NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      PRIMARY KEY (notification_id, user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

export default function notificationsRouter() {
  ensureTable().catch(() => {});

  // List notifications (scoped)
  router.get('/', requireAuth(['DEPT','STAFF','ORG']), async (req, res) => {
    const user = req.user || {};
    const role = user.role === 'DEPT' ? 'DepartmentAdmin' : user.role === 'STAFF' ? 'Staff' : user.role === 'ORG' ? 'OrganizationAdmin' : 'DepartmentAdmin';
    const orgId = user.orgId || null;
    const deptId = user.departmentId || null;
    const userId = String(user.sub || user.id || user.staffId || user.departmentId || '');

    const rows = await query(
      `SELECT n.id, n.type, n.title, n.message, n.link, n.role_scope as roleScope, n.created_at as createdAt,
              CASE WHEN r.user_id IS NULL THEN 0 ELSE 1 END AS isRead
       FROM notifications n
       LEFT JOIN notifications_read r ON r.notification_id = n.id AND r.user_id = ?
       WHERE (n.role_scope = ?)
         AND (n.org_id IS NULL OR n.org_id = ?)
         AND (n.dept_id IS NULL OR n.dept_id = ?)
       ORDER BY n.id DESC
       LIMIT 50`,
      [userId, role, orgId, deptId]
    );

    // Normalize property name to 'read' boolean for frontend
    const mapped = rows.map(r => ({ ...r, read: Number(r.isRead || 0) }));
    res.json({ items: mapped });
  });

  // Summary (unread count)
  router.get('/summary', requireAuth(['DEPT','STAFF','ORG']), async (req, res) => {
    const user = req.user || {};
    const role = user.role === 'DEPT' ? 'DepartmentAdmin' : user.role === 'STAFF' ? 'Staff' : user.role === 'ORG' ? 'OrganizationAdmin' : 'DepartmentAdmin';
    const orgId = user.orgId || null;
    const deptId = user.departmentId || null;
    const userId = String(user.sub || user.id || user.staffId || user.departmentId || '');

    const rows = await query(
      `SELECT COUNT(*) as unread
       FROM notifications n
       LEFT JOIN notifications_read r ON r.notification_id = n.id AND r.user_id = ?
       WHERE (n.role_scope = ?)
         AND (n.org_id IS NULL OR n.org_id = ?)
         AND (n.dept_id IS NULL OR n.dept_id = ?)
         AND r.user_id IS NULL`,
      [userId, role, orgId, deptId]
    );
    res.json({ unread: rows[0]?.unread || 0 });
  });

  // Mark one as read
  router.post('/:id/read', requireAuth(['DEPT','STAFF','ORG']), async (req, res) => {
    const user = req.user || {};
    const userId = String(user.sub || user.id || user.staffId || user.departmentId || '');
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    await query('INSERT IGNORE INTO notifications_read (notification_id, user_id) VALUES (?, ?)', [id, userId]);
    res.json({ ok: true });
  });

  // Mark all as read
  router.post('/mark-all-read', requireAuth(['DEPT','STAFF','ORG']), async (req, res) => {
    const user = req.user || {};
    const userId = String(user.sub || user.id || user.staffId || user.departmentId || '');
    const role = user.role === 'DEPT' ? 'DepartmentAdmin' : user.role === 'STAFF' ? 'Staff' : user.role === 'ORG' ? 'OrganizationAdmin' : 'DepartmentAdmin';
    const orgId = user.orgId || null;
    const deptId = user.departmentId || null;

    const rows = await query(
      `SELECT n.id
       FROM notifications n
       WHERE (n.role_scope = ?)
         AND (n.org_id IS NULL OR n.org_id = ?)
         AND (n.dept_id IS NULL OR n.dept_id = ?)`,
      [role, orgId, deptId]
    );
    for (const r of rows) {
      await query('INSERT IGNORE INTO notifications_read (notification_id, user_id) VALUES (?, ?)', [r.id, userId]);
    }
    res.json({ ok: true });
  });

  // Emit a new notification (used by other back-end flows)
  router.post('/', requireAuth(['DEPT','STAFF']), async (req, res) => {
    const { type, title, message = '', link = '', roleScope, orgId, deptId } = req.body || {};
    if (!type || !title) return res.status(400).json({ message: 'type and title required' });
    const scope = roleScope || (req.user.role === 'DEPT' ? 'DepartmentAdmin' : 'DepartmentAdmin');
    const o = orgId ?? req.user.orgId ?? null;
    const d = deptId ?? req.user.departmentId ?? null;
    const result = await query(
      'INSERT INTO notifications (type, title, message, link, role_scope, org_id, dept_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [type, title, message, link, scope, o, d]
    );
    res.json({ id: result.insertId, ok: true });
  });

  return router;
}
