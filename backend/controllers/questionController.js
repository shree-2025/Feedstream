const { getPool } = require('../config/db');

function mapRow(row) {
  return {
    id: row.id,
    text: row.text,
    type: row.type,
    options: row.options ? JSON.parse(row.options) : undefined,
    category: row.category,
    description: row.description || '',
    isRequired: !!row.is_required,
    createdAt: row.created_at?.toISOString?.() ? row.created_at.toISOString().split('T')[0] : row.created_at,
  };
}

exports.listQuestions = async (req, res) => {
  try {
    const pool = await getPool();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)));
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;

    let where = '';
    let params = [];
    if (search) {
      where = 'WHERE text LIKE ? OR category LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) as cnt FROM questions ${where}`, params);
    const total = countRows[0]?.cnt || 0;

    const [rows] = await pool.query(
      `SELECT * FROM questions ${where} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const items = rows.map(mapRow);
    res.json({ items, total, page, limit });
  } catch (err) {
    console.error('listQuestions error', err);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const pool = await getPool();
    const { text, type, options, category, description, isRequired } = req.body;

    if (!text || !type || !category) {
      return res.status(400).json({ message: 'text, type, category are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO questions (text, type, options, category, description, is_required) VALUES (?, ?, ?, ?, ?, ?)` ,
      [text, type, options ? JSON.stringify(options) : null, category, description || null, isRequired ? 1 : 0]
    );

    const [rows] = await pool.query('SELECT * FROM questions WHERE id = ?', [result.insertId]);
    res.status(201).json(mapRow(rows[0]));
  } catch (err) {
    console.error('createQuestion error', err);
    res.status(500).json({ message: 'Failed to create question' });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const pool = await getPool();
    const id = parseInt(req.params.id, 10);
    const { text, type, options, category, description, isRequired } = req.body;

    const [existRows] = await pool.query('SELECT id FROM questions WHERE id = ? LIMIT 1', [id]);
    if (existRows.length === 0) return res.status(404).json({ message: 'Question not found' });

    await pool.query(
      `UPDATE questions SET text=?, type=?, options=?, category=?, description=?, is_required=? WHERE id=?`,
      [text, type, options ? JSON.stringify(options) : null, category, description || null, isRequired ? 1 : 0, id]
    );

    const [rows] = await pool.query('SELECT * FROM questions WHERE id = ?', [id]);
    res.json(mapRow(rows[0]));
  } catch (err) {
    console.error('updateQuestion error', err);
    res.status(500).json({ message: 'Failed to update question' });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const pool = await getPool();
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM questions WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteQuestion error', err);
    res.status(500).json({ message: 'Failed to delete question' });
  }
};

// Bulk upsert questions (accepts JSON array). Use text+category as natural key.
exports.bulkUpsertQuestions = async (req, res) => {
  try {
    const pool = await getPool();
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) return res.status(400).json({ message: 'items[] is required' });

    const results = [];
    for (const it of items) {
      const text = (it.text || '').trim();
      const type = (it.type || '').trim();
      const category = (it.category || '').trim();
      if (!text || !type || !category) {
        results.push({ text, status: 'skipped', reason: 'text, type, category required' });
        continue;
      }
      const options = it.options ? JSON.stringify(it.options) : null;
      const description = it.description || null;
      const isRequired = it.isRequired ? 1 : 0;

      // Try update by natural key
      const [upd] = await pool.query(
        `UPDATE questions SET type=?, options=?, description=?, is_required=? WHERE text=? AND category=?`,
        [type, options, description, isRequired, text, category]
      );
      if (upd.affectedRows === 0) {
        try {
          await pool.query(
            `INSERT INTO questions (text, type, options, category, description, is_required) VALUES (?, ?, ?, ?, ?, ?)`,
            [text, type, options, category, description, isRequired]
          );
          results.push({ text, status: 'inserted' });
        } catch (e) {
          results.push({ text, status: 'error', reason: e?.code || e?.message || 'insert failed' });
        }
      } else {
        results.push({ text, status: 'updated' });
      }
    }

    res.json({ success: true, count: results.length, results });
  } catch (err) {
    console.error('bulkUpsertQuestions error', err);
    res.status(500).json({ message: 'Failed to bulk upsert questions' });
  }
};

// CSV template for questions import
exports.questionsTemplate = async (_req, res) => {
  const headers = ['text','type','options','category','description','isRequired'];
  const sample1 = ['The instructor communicates clearly','rating','[]','Teaching','', 'true'];
  const sample2 = ['Overall satisfaction','multiple-choice','["Poor","Average","Good","Excellent"]','General','', 'true'];
  const csv = [headers.join(','), sample1.map(escapeCsv).join(','), sample2.map(escapeCsv).join(',')].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="questions-template.csv"');
  res.send(csv);
};

function escapeCsv(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('\n') || s.includes('"')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
