const { getPool } = require('../config/db');

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    department: row.department,
    subjects: row.subjects ? JSON.parse(row.subjects) : [],
    phone: row.phone,
    joinDate: row.join_date,
    address: row.address,
    qualification: row.qualification,
    experience: row.experience,
    specialization: row.specialization,
    createdAt: row.created_at,
  };
}

// Distinct options for staff filters
exports.metaStaff = async (req, res) => {
  try {
    const pool = await getPool();
    const [deptRows] = await pool.query('SELECT DISTINCT department FROM staff WHERE department IS NOT NULL AND department <> "" ORDER BY department ASC');
    const [roleRows] = await pool.query('SELECT DISTINCT role FROM staff WHERE role IS NOT NULL AND role <> "" ORDER BY role ASC');
    const [statusRows] = await pool.query('SELECT DISTINCT status FROM staff WHERE status IS NOT NULL AND status <> "" ORDER BY status ASC');
    res.json({
      departments: deptRows.map(r => r.department),
      roles: roleRows.map(r => r.role),
      statuses: statusRows.map(r => r.status),
    });
  } catch (err) {
    console.error('metaStaff error', err);
    res.status(500).json({ message: 'Failed to load staff filter options' });
  }
};

exports.listStaff = async (req, res) => {
  try {
    const pool = await getPool();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)));
    const search = (req.query.search || '').trim();
    const order = (req.query.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const sortByRaw = (req.query.sortBy || 'name').toString();
    const allowedSort = new Set(['name', 'email', 'role', 'department', 'created_at']);
    const sortBy = allowedSort.has(sortByRaw) ? sortByRaw : 'name';
    const department = (req.query.department || '').trim();
    const role = (req.query.role || '').trim();
    const status = (req.query.status || '').trim();
    const offset = (page - 1) * limit;

    let where = '';
    const params = [];
    const clauses = [];
    if (search) {
      clauses.push('(name LIKE ? OR email LIKE ? OR department LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (department) { clauses.push('department = ?'); params.push(department); }
    if (role) { clauses.push('role = ?'); params.push(role); }
    if (status) { clauses.push('status = ?'); params.push(status); }
    if (clauses.length > 0) where = 'WHERE ' + clauses.join(' AND ');

    const [countRows] = await pool.query(`SELECT COUNT(*) AS cnt FROM staff ${where}`, params);
    const total = countRows[0]?.cnt || 0;

    const [rows] = await pool.query(
      `SELECT * FROM staff ${where} ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ items: rows.map(mapRow), total, page, limit });
  } catch (err) {
    console.error('listStaff error', err);
    res.status(500).json({ message: 'Failed to fetch staff' });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const pool = await getPool();
    const { name, email, role, department, subjects, status } = req.body;
    if (!name || !email || !role) return res.status(400).json({ message: 'name, email, role are required' });

    const [result] = await pool.query(
      `INSERT INTO staff (name, email, role, department, subjects, status) VALUES (?, ?, ?, ?, ?, ?)` ,
      [name, email, role, department || null, subjects ? JSON.stringify(subjects) : null, status === 'Inactive' ? 'Inactive' : 'Active']
    );

    const [rows] = await pool.query('SELECT * FROM staff WHERE id = ?', [result.insertId]);
    res.status(201).json(mapRow(rows[0]));
  } catch (err) {
    console.error('createStaff error', err);
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists' });
    res.status(500).json({ message: 'Failed to create staff' });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const pool = await getPool();
    const id = parseInt(req.params.id, 10);
    const { name, email, role, department, subjects, status } = req.body;

    const [exist] = await pool.query('SELECT id FROM staff WHERE id = ? LIMIT 1', [id]);
    if (exist.length === 0) return res.status(404).json({ message: 'Staff not found' });

    await pool.query(
      `UPDATE staff SET name=?, email=?, role=?, department=?, subjects=?, status=? WHERE id=?`,
      [name, email, role, department || null, subjects ? JSON.stringify(subjects) : null, status === 'Inactive' ? 'Inactive' : 'Active', id]
    );

    const [rows] = await pool.query('SELECT * FROM staff WHERE id = ?', [id]);
    res.json(mapRow(rows[0]));
  } catch (err) {
    console.error('updateStaff error', err);
    res.status(500).json({ message: 'Failed to update staff' });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const pool = await getPool();
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM staff WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteStaff error', err);
    res.status(500).json({ message: 'Failed to delete staff' });
  }
};

// Bulk upsert staff (accepts JSON array). Use email as natural key.
exports.bulkUpsertStaff = async (req, res) => {
  try {
    const pool = await getPool();
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) return res.status(400).json({ message: 'items[] is required' });

    const results = [];
    for (const it of items) {
      const name = (it.name || '').trim();
      const email = (it.email || '').trim();
      const role = (it.role || '').trim();
      if (!name || !email || !role) {
        results.push({ email, status: 'skipped', reason: 'name, email, role required' });
        continue;
      }
      const department = (it.department || null) || null;
      const subjects = it.subjects ? JSON.stringify(it.subjects) : null;
      const status = it.status === 'Inactive' ? 'Inactive' : 'Active';

      // Try update by email; if none affected, insert
      const [upd] = await pool.query(
        `UPDATE staff SET name=?, role=?, department=?, subjects=?, status=? WHERE email=?`,
        [name, role, department, subjects, status, email]
      );
      if (upd.affectedRows === 0) {
        try {
          await pool.query(
            `INSERT INTO staff (name, email, role, department, subjects, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, role, department, subjects, status]
          );
          results.push({ email, status: 'inserted' });
        } catch (e) {
          results.push({ email, status: 'error', reason: e?.code || e?.message || 'insert failed' });
        }
      } else {
        results.push({ email, status: 'updated' });
      }
    }

    res.json({ success: true, count: results.length, results });
  } catch (err) {
    console.error('bulkUpsertStaff error', err);
    res.status(500).json({ message: 'Failed to bulk upsert staff' });
  }
};

// CSV template for staff import
exports.staffTemplate = async (_req, res) => {
  const headers = ['name','email','role','department','subjects','status'];
  const sample1 = ['Alice Johnson','alice@example.com','Professor','CSE','["SUB101","SUB102"]','Active'];
  const sample2 = ['Bob Smith','bob@example.com','Assistant Professor','ECE','[]','Inactive'];
  const csv = [headers.join(','), sample1.map(escapeCsv).join(','), sample2.map(escapeCsv).join(',')].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="staff-template.csv"');
  res.send(csv);
};

function escapeCsv(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('\n') || s.includes('"')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
