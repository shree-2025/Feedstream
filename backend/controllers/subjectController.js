const { getPool } = require('../config/db');

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    department: row.department,
    credits: row.credits,
    description: row.description,
    semester: row.semester,
    type: row.type,
    instructor: row.instructor,
    duration: row.duration,
    prerequisites: row.prerequisites,
    objectives: row.objectives,
    createdAt: row.created_at,
  };
}

// Distinct options for filters
exports.metaSubjects = async (req, res) => {
  try {
    const pool = await getPool();
    const [deptRows] = await pool.query('SELECT DISTINCT department FROM subjects WHERE department IS NOT NULL AND department <> "" ORDER BY department ASC');
    const [semRows] = await pool.query('SELECT DISTINCT semester FROM subjects WHERE semester IS NOT NULL AND semester <> "" ORDER BY semester ASC');
    const [typeRows] = await pool.query('SELECT DISTINCT type FROM subjects WHERE type IS NOT NULL AND type <> "" ORDER BY type ASC');
    res.json({
      departments: deptRows.map(r => r.department),
      semesters: semRows.map(r => r.semester),
      types: typeRows.map(r => r.type),
    });
  } catch (err) {
    console.error('metaSubjects error', err);
    res.status(500).json({ message: 'Failed to load subject filter options' });
  }
};

exports.listSubjects = async (req, res) => {
  try {
    const pool = await getPool();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)));
    const search = (req.query.search || '').trim();
    const order = (req.query.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const sortByRaw = (req.query.sortBy || 'name').toString();
    const allowedSort = new Set(['name', 'code', 'semester', 'department', 'created_at']);
    const sortBy = allowedSort.has(sortByRaw) ? sortByRaw : 'name';
    const department = (req.query.department || '').trim();
    const semester = (req.query.semester || '').trim();
    const type = (req.query.type || '').trim();
    const offset = (page - 1) * limit;

    let where = '';
    const params = [];
    const clauses = [];
    if (search) {
      clauses.push('(name LIKE ? OR code LIKE ? OR department LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (department) {
      clauses.push('department = ?');
      params.push(department);
    }
    if (semester) {
      clauses.push('semester = ?');
      params.push(semester);
    }
    if (type) {
      clauses.push('type = ?');
      params.push(type);
    }
    if (clauses.length > 0) where = 'WHERE ' + clauses.join(' AND ');

    const [countRows] = await pool.query(`SELECT COUNT(*) AS cnt FROM subjects ${where}`, params);
    const total = countRows[0]?.cnt || 0;

    const [rows] = await pool.query(
      `SELECT * FROM subjects ${where} ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ items: rows.map(mapRow), total, page, limit });
  } catch (err) {
    console.error('listSubjects error', err);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const pool = await getPool();
    const { name, code, department, credits, description, semester, type, instructor, duration, prerequisites, objectives } = req.body;
    if (!name || !code || !department || !semester) return res.status(400).json({ message: 'name, code, department, semester are required' });

    const [result] = await pool.query(
      `INSERT INTO subjects (name, code, department, credits, description, semester, type, instructor, duration, prerequisites, objectives) \
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, code, department, credits || 0, description || null, semester, type || null, instructor || null, duration || null, prerequisites || null, objectives || null]
    );

    const [rows] = await pool.query('SELECT * FROM subjects WHERE id = ?', [result.insertId]);
    res.status(201).json(mapRow(rows[0]));
  } catch (err) {
    console.error('createSubject error', err);
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Code already exists' });
    res.status(500).json({ message: 'Failed to create subject' });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const pool = await getPool();
    const id = parseInt(req.params.id, 10);
    const { name, code, department, credits, description, semester, type, instructor, duration, prerequisites, objectives } = req.body;

    const [exist] = await pool.query('SELECT id FROM subjects WHERE id = ? LIMIT 1', [id]);
    if (exist.length === 0) return res.status(404).json({ message: 'Subject not found' });

    await pool.query(
      `UPDATE subjects SET name=?, code=?, department=?, credits=?, description=?, semester=?, type=?, instructor=?, duration=?, prerequisites=?, objectives=? WHERE id=?`,
      [name, code, department, credits || 0, description || null, semester, type || null, instructor || null, duration || null, prerequisites || null, objectives || null, id]
    );

    const [rows] = await pool.query('SELECT * FROM subjects WHERE id = ?', [id]);
    res.json(mapRow(rows[0]));
  } catch (err) {
    console.error('updateSubject error', err);
    res.status(500).json({ message: 'Failed to update subject' });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const pool = await getPool();
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM subjects WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteSubject error', err);
    res.status(500).json({ message: 'Failed to delete subject' });
  }
};
