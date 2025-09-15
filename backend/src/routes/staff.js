import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db.js';

const router = express.Router();

// Ensure aux tables for staff metadata and subject assignments
async function ensureTables() {
  // Details table holds role, department (string), status
  await query(`
    CREATE TABLE IF NOT EXISTS staff_details (
      staff_id INT PRIMARY KEY,
      role VARCHAR(100) NOT NULL,
      department VARCHAR(100) DEFAULT NULL,
      status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  // Mapping table for many-to-many staff<->subjects
  await query(`
    CREATE TABLE IF NOT EXISTS staff_subjects (
      staff_id INT NOT NULL,
      subject_id INT NOT NULL,
      PRIMARY KEY (staff_id, subject_id),
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

const staffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  department: z.string().optional().nullable(),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  subjects: z.array(z.string()).min(1), // list of subject names
});

function toPageParams(q) {
  const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit || '10', 10) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export default function staffRouter() {
  ensureTables().catch((e) => console.warn('[staff] ensure tables failed', e));

  // List staff for the department admin's department
  router.get('/', requireAuth(['DEPT']), async (req, res) => {
    const { search = '', order = 'asc', sortBy = 'name', department = '', role = '', status = '' } = req.query;
    const { page, limit, offset } = toPageParams(req.query);

    // Scope: only staff in this department
    const where = ['s.department_id = ?'];
    const params = [req.user.departmentId];

    if (search) {
      where.push('(s.name LIKE ? OR s.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (department) { where.push('sd.department = ?'); params.push(department); }
    if (role) { where.push('sd.role = ?'); params.push(role); }
    if (status) { where.push('sd.status = ?'); params.push(status); }

    const sortCol = ['name', 'email', 'role', 'status'].includes(String(sortBy)) ? String(sortBy) : 'name';
    const sortDir = String(order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Count
    const countRows = await query(
      `SELECT COUNT(*) as total
       FROM staff s
       LEFT JOIN staff_details sd ON sd.staff_id = s.id
       WHERE ${where.join(' AND ')}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Page items with aggregated subjects
    const items = await query(
      `SELECT 
         s.id, s.name, s.email,
         sd.role, sd.department, sd.status,
         COALESCE(GROUP_CONCAT(DISTINCT subj.name ORDER BY subj.name SEPARATOR '\u0001'), '') AS subjectsConcat
       FROM staff s
       LEFT JOIN staff_details sd ON sd.staff_id = s.id
       LEFT JOIN staff_subjects ss ON ss.staff_id = s.id
       LEFT JOIN subjects subj ON subj.id = ss.subject_id
       WHERE ${where.join(' AND ')}
       GROUP BY s.id
       ORDER BY ${sortCol} ${sortDir}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const mapped = items.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role || '',
      department: r.department || '',
      status: r.status || 'Active',
      subjects: (r.subjectsConcat ? String(r.subjectsConcat).split('\u0001').filter(Boolean) : []),
    }));

    res.json({ items: mapped, total, page, limit, totalPages: Math.ceil(total / limit) });
  });

  // Create staff + assign subjects
  router.post('/', requireAuth(['DEPT']), async (req, res) => {
    const parsed = staffSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });
    const { name, email, role, department: deptName, status, subjects } = parsed.data;

    // Check email uniqueness in staff
    const exists = await query('SELECT id FROM staff WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ message: 'Email already used' });

    // Make a temp password and invite flow could be added; for now, set must_change_password
    const result = await query(
      'INSERT INTO staff (name, email, password_hash, must_change_password, department_id, organization_id) VALUES (?, ?, ?, 1, ?, ?)',
      [name, email, '', req.user.departmentId, req.user.orgId]
    );
    const staffId = result.insertId;

    // Upsert details
    await query(
      `INSERT INTO staff_details (staff_id, role, department, status) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role), department = VALUES(department), status = VALUES(status)`,
      [staffId, role, deptName || null, status]
    );

    // Assign subjects by names -> ids
    if (subjects?.length) {
      const placeholders = subjects.map(() => '?').join(',');
      const subjectRows = await query(`SELECT id, name FROM subjects WHERE name IN (${placeholders})`, subjects);
      const ids = subjectRows.map(r => r.id);
      if (ids.length === 0) {
        return res.status(400).json({ message: 'Selected subjects not found' });
      }
      // clear and insert
      await query('DELETE FROM staff_subjects WHERE staff_id = ?', [staffId]);
      const values = ids.map(id => `(${staffId}, ${id})`).join(',');
      await query(`INSERT INTO staff_subjects (staff_id, subject_id) VALUES ${values}`);
    }

    res.status(201).json({ id: staffId });
  });

  // Update staff + subjects
  router.put('/:id', requireAuth(['DEPT']), async (req, res) => {
    const staffId = parseInt(req.params.id, 10);
    if (!staffId) return res.status(400).json({ message: 'Invalid staff id' });
    const parsed = staffSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });
    const { name, email, role, department: deptName, status, subjects } = parsed.data;

    // Ensure staff is in this department
    const rows = await query('SELECT id FROM staff WHERE id = ? AND department_id = ?', [staffId, req.user.departmentId]);
    if (!rows.length) return res.status(404).json({ message: 'Staff not found' });

    // If changing email, ensure uniqueness
    const emailExists = await query('SELECT id FROM staff WHERE email = ? AND id <> ?', [email, staffId]);
    if (emailExists.length) return res.status(409).json({ message: 'Email already used' });

    await query('UPDATE staff SET name = ?, email = ? WHERE id = ?', [name, email, staffId]);
    await query(
      `INSERT INTO staff_details (staff_id, role, department, status) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role), department = VALUES(department), status = VALUES(status)`,
      [staffId, role, deptName || null, status]
    );

    // Update subjects
    await query('DELETE FROM staff_subjects WHERE staff_id = ?', [staffId]);
    if (subjects?.length) {
      const placeholders = subjects.map(() => '?').join(',');
      const subjectRows = await query(`SELECT id, name FROM subjects WHERE name IN (${placeholders})`, subjects);
      const ids = subjectRows.map(r => r.id);
      if (ids.length) {
        const values = ids.map(id => `(${staffId}, ${id})`).join(',');
        await query(`INSERT INTO staff_subjects (staff_id, subject_id) VALUES ${values}`);
      }
    }

    res.json({ ok: true });
  });

  // Delete staff
  router.delete('/:id', requireAuth(['DEPT']), async (req, res) => {
    const staffId = parseInt(req.params.id, 10);
    if (!staffId) return res.status(400).json({ message: 'Invalid staff id' });
    // Ensure in dept
    const rows = await query('SELECT id FROM staff WHERE id = ? AND department_id = ?', [staffId, req.user.departmentId]);
    if (!rows.length) return res.status(404).json({ message: 'Staff not found' });
    await query('DELETE FROM staff WHERE id = ?', [staffId]);
    res.json({ ok: true });
  });

  // Meta options
  router.get('/meta', requireAuth(['DEPT']), async (req, res) => {
    const roles = ['Lecturer', 'Assistant Professor', 'Lab Assistant', 'Professor'];
    const statuses = ['Active', 'Inactive'];
    // Departments could be dynamic; return unique values from staff_details
    const d = await query('SELECT DISTINCT department FROM staff_details WHERE department IS NOT NULL AND department <> "" ORDER BY department ASC');
    const departments = d.map(r => r.department);
    res.json({ roles, statuses, departments });
  });

  // Bulk add
  router.post('/bulk', requireAuth(['DEPT']), async (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ message: 'No items' });

    const results = [];
    for (const item of items) {
      const parsed = staffSchema.safeParse(item);
      if (!parsed.success) { results.push({ ok: false, error: 'Invalid', item }); continue; }
      try {
        // Reuse create logic
        const { name, email, role, department, status, subjects } = parsed.data;
        const exists = await query('SELECT id FROM staff WHERE email = ?', [email]);
        if (exists.length) { results.push({ ok: false, error: 'Email exists', email }); continue; }
        const result = await query('INSERT INTO staff (name, email, password_hash, must_change_password, department_id, organization_id) VALUES (?, ?, ?, 1, ?, ?)', [name, email, '', req.user.departmentId, req.user.orgId]);
        const staffId = result.insertId;
        await query(`INSERT INTO staff_details (staff_id, role, department, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role), department = VALUES(department), status = VALUES(status)`, [staffId, role, department || null, status]);
        if (subjects?.length) {
          const placeholders = subjects.map(() => '?').join(',');
          const subjectRows = await query(`SELECT id, name FROM subjects WHERE name IN (${placeholders})`, subjects);
          const ids = subjectRows.map(r => r.id);
          if (ids.length) {
            const values = ids.map(id => `(${staffId}, ${id})`).join(',');
            await query(`INSERT INTO staff_subjects (staff_id, subject_id) VALUES ${values}`);
          }
        }
        results.push({ ok: true, id: staffId, email });
      } catch (e) {
        results.push({ ok: false, error: 'Unknown', email: item?.email });
      }
    }
    res.json({ results });
  });

  return router;
}
