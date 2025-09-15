import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db.js';
import { sendMail } from '../utils/mailer.js';

const router = express.Router();

const deptCreateSchema = z.object({
  name: z.string().min(1),
  managerName: z.string().min(1),
  email: z.string().email(),
});

const bulkSchema = z.object({
  departments: z.array(deptCreateSchema).min(1),
});

function genTempPassword(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function orgRouter() {
  // Ensure additional column exists for manager name (HOD)
  (async () => {
    try {
      await query('ALTER TABLE departments ADD COLUMN IF NOT EXISTS hod_name VARCHAR(255) NULL');
    } catch (e) {
      // ignore if lacks privilege or already exists on older MySQL versions
    }
  })();

  // Update Department
  router.put('/departments/:id', requireAuth(['ORG']), async (req, res) => {
    const schema = z.object({
      name: z.string().min(1),
      managerName: z.string().min(1),
      email: z.string().email()
    });

  // Resolve staff department column once per boot
  let staffDeptColPromise;
  async function getStaffDeptColumn() {
    if (!staffDeptColPromise) {
      staffDeptColPromise = (async () => {
        try {
          const rows = await query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff' AND COLUMN_NAME IN ('department_id','department')`
          );
          const names = rows.map(r => r.COLUMN_NAME);
          if (names.includes('department_id')) return 'department_id';
          if (names.includes('department')) return 'department';
        } catch {}
        return 'department_id';
      })();
    }
    return staffDeptColPromise;
  }

  // List staff for a specific department within this organization (for charts)
  router.get('/staff', requireAuth(['ORG']), async (req, res) => {
    try {
      const depId = parseInt(String(req.query.departmentId || ''), 10);
      if (!depId) return res.status(400).json({ error: 'departmentId is required' });
      const deptCol = await getStaffDeptColumn();
      const rows = await query(
        `SELECT id,
                COALESCE(name, full_name, staff_name, CONCAT(first_name, ' ', last_name), email, CONCAT('Staff ', id)) AS name
         FROM staff
         WHERE organization_id = ? AND ${deptCol} = ?
         ORDER BY name ASC`,
        [req.user.orgId, depId]
      );
      res.json(rows.map(r => ({ id: r.id, name: r.name })));
    } catch (e) {
      console.error('Error listing staff for department:', e);
      res.status(500).json({ error: 'Failed to load staff list' });
    }
  });

    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
    const { name, managerName, email } = parse.data;
    const departmentId = parseInt(req.params.id, 10);
  
    try {
      // Check if department exists and belongs to this org
      const [dept] = await query(
        'SELECT id FROM departments WHERE id = ? AND organization_id = ?', 
        [departmentId, req.user.orgId]
      );
      
      if (!dept) {
        return res.status(404).json({ error: 'Department not found' });
      }
      
      // Check if email is already used by another department in this org
      const [existing] = await query(
        'SELECT id FROM departments WHERE email = ? AND organization_id = ? AND id != ?',
        [email, req.user.orgId, departmentId]
      );
      
      if (existing) {
        return res.status(409).json({ error: 'Email already in use by another department' });
      }
      
      await query(
        'UPDATE departments SET name = ?, hod_name = ?, email = ? WHERE id = ?',
        [name, managerName, email, departmentId]
      );
      
      res.json({ id: departmentId, name, managerName, email });
    } catch (error) {
      console.error('Error updating department:', error);
      res.status(500).json({ error: 'Failed to update department' });
    }
  });

  // Delete Department
  router.delete('/departments/:id', requireAuth(['ORG']), async (req, res) => {
    const departmentId = parseInt(req.params.id, 10);
  
    try {
      // Check if department exists and belongs to this org
      const [dept] = await query(
        'SELECT id FROM departments WHERE id = ? AND organization_id = ?', 
        [departmentId, req.user.orgId]
      );
      
      if (!dept) {
        return res.status(404).json({ error: 'Department not found' });
      }
      
      // Delete department (CASCADE will handle related staff/students)
      await query('DELETE FROM departments WHERE id = ?', [departmentId]);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(500).json({ error: 'Failed to delete department' });
    }
  });

  // Create Department under Organization
  router.post('/departments', requireAuth(['ORG']), async (req, res) => {
    const parse = deptCreateSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const { name, managerName, email } = parse.data;
    const exists = await query('SELECT id FROM departments WHERE email = ? AND organization_id = ?', [email, req.user.orgId]);
    if (exists.length) return res.status(409).json({ error: 'Email already used' });

    const tempPassword = genTempPassword(12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const result = await query(
      'INSERT INTO departments (name, hod_name, email, password_hash, organization_id) VALUES (?, ?, ?, ?, ?)',
      [name, managerName, email, passwordHash, req.user.orgId]
    );

    const frontendOrigin = process.env.FRONTEND_ORIGIN || '';
    const loginUrl = `${frontendOrigin}`;
    const emailResult = await sendMail({
      to: email,
      subject: 'Your Department Account Credentials',
      text: `Hello ${managerName},\n\nYour department account has been created for ${name}.\n\nLogin URL: ${loginUrl}/login\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password immediately.`,
    });
    
    if (!emailResult.queued) {
      console.warn('Failed to send department credential email:', emailResult.error || 'Unknown error');
      console.warn('Department created, but email not sent. Credentials:', {
        email,
        tempPassword,
        loginUrl: `${loginUrl}/login`
      });
    }

    res.json({ id: result.insertId, name, managerName, email });
  });

  // Bulk create departments
  router.post('/departments/bulk', requireAuth(['ORG']), async (req, res) => {
    const parse = bulkSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const created = [];
    const skipped = [];
    const frontendOrigin = process.env.FRONTEND_ORIGIN || '';
    const loginUrl = `${frontendOrigin}`;
    for (const d of parse.data.departments) {
      try {
        const exists = await query('SELECT id FROM departments WHERE email = ? AND organization_id = ?', [d.email, req.user.orgId]);
        if (exists.length) {
          skipped.push({ email: d.email, reason: 'duplicate' });
          continue;
        }
        const temp = genTempPassword(12);
        const passwordHash = await bcrypt.hash(temp, 10);
        const result = await query(
          'INSERT INTO departments (name, hod_name, email, password_hash, organization_id) VALUES (?, ?, ?, ?, ?)',
          [d.name, d.managerName, d.email, passwordHash, req.user.orgId]
        );
        const emailResult = await sendMail({
          to: d.email,
          subject: 'Your Department Account Credentials',
          text: `Hello ${d.managerName},\n\nYour department account has been created for ${d.name}.\n\nLogin URL: ${loginUrl}/login\nEmail: ${d.email}\nTemporary Password: ${temp}\n\nPlease log in and change your password immediately.`,
        });
        
        if (!emailResult.queued) {
          console.warn(`Failed to send email to ${d.email}:`, emailResult.error || 'Unknown error');
          // Log credentials to console for recovery purposes
          console.warn('Department created, but email not sent. Credentials:', {
            email: d.email,
            tempPassword: temp,
            loginUrl: `${loginUrl}/login`
          });
        }
        created.push({ id: result.insertId, email: d.email });
      } catch (e) {
        skipped.push({ email: d.email, reason: 'error' });
      }
    }
    res.json({ created, skipped });
  });

  // List departments for the organization
  router.get('/departments', requireAuth(['ORG']), async (req, res) => {
    const rows = await query(
      'SELECT id, name, hod_name AS managerName, email FROM departments WHERE organization_id = ? ORDER BY id DESC',
      [req.user.orgId]
    );
    res.json(rows);
  });

  // Department stats for charts: staffCount and studentCount per department
  router.get('/departments/stats', requireAuth(['ORG']), async (req, res) => {
    try {
      // Detect if a students table exists
      const studentsTable = await query(
        `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' LIMIT 1`
      );

      // Base staff counts grouped by department
      const staffCounts = await query(
        `SELECT d.id AS departmentId, d.name AS departmentName, COUNT(s.id) AS staffCount
         FROM departments d
         LEFT JOIN staff s ON s.department_id = d.id AND s.organization_id = d.organization_id
         WHERE d.organization_id = ?
         GROUP BY d.id, d.name
         ORDER BY d.id DESC`,
        [req.user.orgId]
      );

      let studentCountsMap = new Map();
      if (studentsTable && studentsTable.length) {
        try {
          const studentCounts = await query(
            `SELECT d.id AS departmentId, COUNT(st.id) AS studentCount
             FROM departments d
             LEFT JOIN students st ON st.department_id = d.id AND st.organization_id = d.organization_id
             WHERE d.organization_id = ?
             GROUP BY d.id`,
            [req.user.orgId]
          );
          studentCountsMap = new Map(studentCounts.map(r => [r.departmentId, r.studentCount]));
        } catch (e) {
          // If join fails, default to 0
        }
      }

      const result = staffCounts.map(r => ({
        id: r.departmentId,
        name: r.departmentName,
        staffCount: Number(r.staffCount) || 0,
        studentCount: Number(studentCountsMap.get(r.departmentId) || 0),
      }));

      res.json(result);
    } catch (error) {
      console.error('Error building department stats:', error);
      res.status(500).json({ error: 'Failed to load department stats' });
    }
  });

  // Total staff count for the organization
  router.get('/staff/count', requireAuth(['ORG']), async (req, res) => {
    try {
      const rows = await query('SELECT COUNT(*) AS total FROM staff WHERE organization_id = ?', [req.user.orgId]);
      const total = rows[0]?.total || 0;
      res.json({ total });
    } catch (error) {
      console.error('Error fetching staff count:', error);
      res.status(500).json({ error: 'Failed to load staff count' });
    }
  });

  return router;
}
