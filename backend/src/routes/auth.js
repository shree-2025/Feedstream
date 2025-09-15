import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signToken, requireAuth } from '../middleware/auth.js';
import { query } from '../db.js';
import { sendMail } from '../utils/mailer.js';

const router = express.Router();

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

export default function authRouter() {
  // Organization register (disabled by default)
  router.post('/org/register', async (req, res) => {
    if ((process.env.ALLOW_ORG_SELF_REGISTER || 'false').toLowerCase() !== 'true') {
      return res.status(403).json({ error: 'Organization self-registration is disabled' });
    }
    const parse = credsSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const { email: rawEmail, password, name } = parse.data;
    const email = rawEmail.trim().toLowerCase();
    const rows = await query('SELECT id FROM organizations WHERE email = ?', [email]);
    if (rows.length) return res.status(409).json({ error: 'Email already used' });
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query('INSERT INTO organizations (name, email, password_hash) VALUES (?, ?, ?)', [name || '', email, passwordHash]);
    const id = result.insertId;
    const token = signToken({ role: 'ORG', orgId: id, sub: `org:${id}` });
    res.json({ token, user: { id, role: 'ORG', email, name: name || '' } });
  });

  // Organization login
  router.post('/org/login', async (req, res) => {
    const parse = credsSchema.pick({ email: true, password: true }).safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const { email: rawEmail, password } = parse.data;
    const email = rawEmail.trim().toLowerCase();
    const rows = await query('SELECT id, name, email, password_hash FROM organizations WHERE email = ?', [email]);
    const org = rows[0];
    if (!org) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, org.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ role: 'ORG', orgId: org.id, sub: `org:${org.id}` });
    res.json({ token, user: { id: org.id, role: 'ORG', email: org.email, name: org.name } });
  });

  // Department login
  router.post('/department/login', async (req, res) => {
    const parse = credsSchema.pick({ email: true, password: true }).safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const { email: rawEmail, password } = parse.data;
    const email = rawEmail.trim().toLowerCase();
    const rows = await query('SELECT id, name, email, password_hash, organization_id, must_change_password FROM departments WHERE email = ?', [email]);
    const dep = rows[0];
    if (!dep) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, dep.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ role: 'DEPT', departmentId: dep.id, orgId: dep.organization_id, sub: `dept:${dep.id}` });
    res.json({ token, user: { id: dep.id, role: 'DEPT', email: dep.email, name: dep.name, organizationId: dep.organization_id }, requirePasswordChange: !!dep.must_change_password });
  });

  // Department change password (first-time or later)
  router.post('/department/change-password', requireAuth(['DEPT']), async (req, res) => {
    const schema = z.object({ oldPassword: z.string().min(6), newPassword: z.string().min(6) });
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const { oldPassword, newPassword } = parse.data;
    const rows = await query('SELECT id, password_hash FROM departments WHERE id = ?', [req.user.departmentId]);
    const dep = rows[0];
    if (!dep) return res.status(404).json({ error: 'Department not found' });
    const ok = await bcrypt.compare(oldPassword, dep.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid current password' });
    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE departments SET password_hash = ?, must_change_password = 0 WHERE id = ?', [newHash, req.user.departmentId]);
    return res.json({ ok: true });
  });

  // Staff login
  router.post('/staff/login', async (req, res) => {
    const parse = credsSchema.pick({ email: true, password: true }).safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const { email: rawEmail, password } = parse.data;
    const email = rawEmail.trim().toLowerCase();
    const rows = await query('SELECT id, name, email, password_hash, department_id, organization_id, must_change_password FROM staff WHERE email = ?', [email]);
    const staff = rows[0];
    if (!staff) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, staff.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ role: 'STAFF', staffId: staff.id, departmentId: staff.department_id, orgId: staff.organization_id, sub: `staff:${staff.id}` });
    res.json({ token, user: { id: staff.id, role: 'STAFF', email: staff.email, name: staff.name, departmentId: staff.department_id }, requirePasswordChange: !!staff.must_change_password });
  });

  // Staff change password (first-time or later)
  router.post('/staff/change-password', requireAuth(['STAFF']), async (req, res) => {
    const schema = z.object({ oldPassword: z.string().min(6), newPassword: z.string().min(6) });
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const { oldPassword, newPassword } = parse.data;
    const rows = await query('SELECT id, password_hash FROM staff WHERE id = ?', [req.user.staffId]);
    const staff = rows[0];
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    const ok = await bcrypt.compare(oldPassword, staff.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid current password' });
    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE staff SET password_hash = ?, must_change_password = 0 WHERE id = ?', [newHash, req.user.staffId]);
    return res.json({ ok: true });
  });

  // Ensure OTP table exists
  (async () => {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS password_otps (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_role ENUM('DEPT','STAFF','ORG') NOT NULL,
          user_id INT NOT NULL,
          email VARCHAR(255) NOT NULL,
          otp_code VARCHAR(12) NOT NULL,
          expires_at DATETIME NOT NULL,
          used TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user (user_role, user_id),
          INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch {}
  })();

  // Send OTP to change password (for logged-in users)
  router.post('/password/send-otp', requireAuth(['DEPT','STAFF','ORG']), async (req, res) => {
    const role = req.user.role;
    let email = '';
    let userId = 0;
    try {
      if (role === 'DEPT') {
        const rows = await query('SELECT id, email FROM departments WHERE id = ?', [req.user.departmentId]);
        if (!rows.length) return res.status(404).json({ error: 'Department not found' });
        email = rows[0].email; userId = rows[0].id;
      } else if (role === 'STAFF') {
        const rows = await query('SELECT id, email FROM staff WHERE id = ?', [req.user.staffId]);
        if (!rows.length) return res.status(404).json({ error: 'Staff not found' });
        email = rows[0].email; userId = rows[0].id;
      } else if (role === 'ORG') {
        const rows = await query('SELECT id, email FROM organizations WHERE id = ?', [req.user.orgId]);
        if (!rows.length) return res.status(404).json({ error: 'Organization not found' });
        email = rows[0].email; userId = rows[0].id;
      } else {
        return res.status(400).json({ error: 'Unsupported role' });
      }
      const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await query('INSERT INTO password_otps (user_role, user_id, email, otp_code, expires_at) VALUES (?, ?, ?, ?, ?)', [role, userId, email, otp, expires]);
      const mail = await sendMail({
        to: email,
        subject: 'Your OTP to change password',
        text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      });
      if (!mail.queued) {
        console.warn('[mail] failed to queue OTP email:', mail.error || 'unknown');
      }
      res.json({ ok: true });
    } catch (e) {
      console.error('send-otp failed', e);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  });

  // Verify OTP and change password
  router.post('/password/verify', requireAuth(['DEPT','STAFF','ORG']), async (req, res) => {
    const schema = z.object({ otp: z.string().min(4), newPassword: z.string().min(6) });
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const { otp, newPassword } = parse.data;

    const role = req.user.role;
    let userId = 0;
    let updateSql = '';
    let updateArgs = [];
    try {
      if (role === 'DEPT') {
        userId = req.user.departmentId;
        updateSql = 'UPDATE departments SET password_hash = ? WHERE id = ?';
      } else if (role === 'STAFF') {
        userId = req.user.staffId;
        updateSql = 'UPDATE staff SET password_hash = ? WHERE id = ?';
      } else if (role === 'ORG') {
        userId = req.user.orgId;
        updateSql = 'UPDATE organizations SET password_hash = ? WHERE id = ?';
      } else {
        return res.status(400).json({ error: 'Unsupported role' });
      }
      // Find latest unused OTP for this user
      const [row] = await query(
        `SELECT id, otp_code AS code, expires_at AS expires, used FROM password_otps
         WHERE user_role = ? AND user_id = ?
         ORDER BY id DESC LIMIT 1`,
        [role, userId]
      );
      if (!row) return res.status(400).json({ error: 'OTP not found. Please request a new one.' });
      if (row.used) return res.status(400).json({ error: 'OTP already used. Please request a new one.' });
      if (new Date(row.expires) < new Date()) return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
      if (String(row.code) !== String(otp)) return res.status(400).json({ error: 'Invalid OTP' });

      const hash = await bcrypt.hash(newPassword, 10);
      updateArgs = [hash, userId];
      await query(updateSql, updateArgs);
      await query('UPDATE password_otps SET used = 1 WHERE id = ?', [row.id]);
      return res.json({ ok: true });
    } catch (e) {
      console.error('verify-otp failed', e);
      return res.status(500).json({ error: 'Failed to change password' });
    }
  });

  return router;
}
