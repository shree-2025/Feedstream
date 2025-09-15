import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db.js';
import { sendMail } from '../utils/mailer.js';

const router = express.Router();

const staffCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  // password optional; if omitted, we generate a temp password
  password: z.string().min(6).optional(),
});

export default function deptRouter() {
  // List staff under a department
  router.get('/:departmentId/staff', requireAuth(['DEPT']), async (req, res) => {
    const departmentId = parseInt(req.params.departmentId, 10);
    if (!departmentId || departmentId !== req.user.departmentId) {
      return res.status(403).json({ error: 'Cannot view staff outside your department' });
    }
    const rows = await query(
      'SELECT id, name, email, department_id AS departmentId, organization_id AS organizationId, created_at AS createdAt FROM staff WHERE department_id = ? ORDER BY name ASC',
      [departmentId]
    );
    res.json(rows);
  });

  // Department creates Staff (teachers)
  router.post('/:departmentId/staff', requireAuth(['DEPT']), async (req, res) => {
    const parse = staffCreateSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

    const departmentId = parseInt(req.params.departmentId, 10);
    if (!departmentId || departmentId !== req.user.departmentId) {
      return res.status(403).json({ error: 'Cannot create staff outside your department' });
    }

    const { name, email } = parse.data;
    const exists = await query('SELECT id FROM staff WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ error: 'Email already used' });

    // Generate a temporary password if one is not provided
    const tempPassword = parse.data.password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2);
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const result = await query(
      'INSERT INTO staff (name, email, password_hash, must_change_password, department_id, organization_id) VALUES (?, ?, ?, 1, ?, ?)',
      [name, email, passwordHash, departmentId, req.user.orgId]
    );

    // Email login link and temp password
    const baseUrl = process.env.FRONTEND_ORIGIN || process.env.APP_BASE_URL || 'http://localhost:5173';
    const loginUrl = `${baseUrl}/login?role=Staff`;
    try {
      await sendMail({
        to: email,
        subject: 'Your ElogBook Staff Account',
        text: `Hello ${name},\n\nYour staff account has been created.\nLogin: ${loginUrl}\nTemporary Password: ${tempPassword}\n\nYou will be asked to change your password on first login.`,
        html: `<p>Hello ${name},</p><p>Your staff account has been created.</p><p><strong>Login:</strong> <a href="${loginUrl}">${loginUrl}</a><br/><strong>Temporary Password:</strong> ${tempPassword}</p><p>You will be asked to change your password on first login.</p>`,
      });
    } catch (e) {
      console.warn('[mail] failed to send staff invite', e);
    }

    res.json({ id: result.insertId, name, email, departmentId });
  });

  // Update a staff member's basic info (name, email)
  router.put('/:departmentId/staff/:staffId', requireAuth(['DEPT']), async (req, res) => {
    const departmentId = parseInt(req.params.departmentId, 10);
    const staffId = parseInt(req.params.staffId, 10);
    if (!departmentId || departmentId !== req.user.departmentId) {
      return res.status(403).json({ error: 'Cannot modify staff outside your department' });
    }
    if (!staffId) return res.status(400).json({ error: 'Invalid staff id' });

    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
    }).refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

    const parse = updateSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

    // Ensure staff belongs to this department
    const rows = await query('SELECT id, department_id FROM staff WHERE id = ?', [staffId]);
    const staff = rows[0];
    if (!staff || staff.department_id !== departmentId) {
      return res.status(404).json({ error: 'Staff not found in this department' });
    }

    // If changing email, ensure uniqueness
    if (parse.data.email) {
      const exists = await query('SELECT id FROM staff WHERE email = ? AND id <> ?', [parse.data.email, staffId]);
      if (exists.length) return res.status(409).json({ error: 'Email already used' });
    }

    const fields = [];
    const values = [];
    if (parse.data.name !== undefined) { fields.push('name = ?'); values.push(parse.data.name); }
    if (parse.data.email !== undefined) { fields.push('email = ?'); values.push(parse.data.email); }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    values.push(staffId);
    await query(`UPDATE staff SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ ok: true });
  });

  // Delete a staff member
  router.delete('/:departmentId/staff/:staffId', requireAuth(['DEPT']), async (req, res) => {
    const departmentId = parseInt(req.params.departmentId, 10);
    const staffId = parseInt(req.params.staffId, 10);
    if (!departmentId || departmentId !== req.user.departmentId) {
      return res.status(403).json({ error: 'Cannot delete staff outside your department' });
    }
    if (!staffId) return res.status(400).json({ error: 'Invalid staff id' });

    // Ensure staff belongs to this department
    const rows = await query('SELECT id, department_id FROM staff WHERE id = ?', [staffId]);
    const staff = rows[0];
    if (!staff || staff.department_id !== departmentId) {
      return res.status(404).json({ error: 'Staff not found in this department' });
    }

    await query('DELETE FROM staff WHERE id = ?', [staffId]);
    res.json({ ok: true });
  });

  return router;
}
