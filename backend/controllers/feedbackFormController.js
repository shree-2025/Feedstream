const { getPool } = require('../config/db');

function randomSlug(len = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

exports.createFeedbackForm = async (req, res) => {
  try {
    const pool = await getPool();
    const { teacherId, subjectId, questionIds, startDate, endDate, semester, title } = req.body;

    if (!teacherId || !subjectId || !Array.isArray(questionIds) || questionIds.length === 0 || !startDate || !endDate) {
      return res.status(400).json({ message: 'teacherId, subjectId, questionIds[], startDate, endDate are required' });
    }

    // Ensure unique slug
    let slug;
    while (true) {
      slug = randomSlug(10);
      const [exist] = await pool.query('SELECT id FROM feedback_forms WHERE slug = ? LIMIT 1', [slug]);
      if (!exist || exist.length === 0) break;
    }

    const [result] = await pool.query(
      `INSERT INTO feedback_forms (title, teacher_id, subject_id, question_ids, start_date, end_date, slug, semester) VALUES (?,?,?,?,?,?,?,?)`,
      [title || null, teacherId, subjectId, JSON.stringify(questionIds), startDate, endDate, slug, semester || null]
    );

    const [rows] = await pool.query('SELECT * FROM feedback_forms WHERE id = ?', [result.insertId]);
    const form = rows[0];
    const isActive = (form.status && String(form.status).toLowerCase() === 'active') || (
      form.start_date && form.end_date && (new Date().toISOString().slice(0,10) >= String(form.start_date).slice(0,10)) && (new Date().toISOString().slice(0,10) <= String(form.end_date).slice(0,10))
    );
    res.status(201).json({
      id: form.id,
      slug: form.slug,
      title: form.title || null,
      teacherId: form.teacher_id,
      subjectId: form.subject_id,
      questionIds: JSON.parse(form.question_ids || '[]'),
      startDate: form.start_date,
      endDate: form.end_date,
      semester: form.semester || null,
      createdAt: form.created_at,
      status: form.status || null,
      isActive,
    });
  } catch (err) {
    console.error('createFeedbackForm error', err);
    res.status(500).json({ message: 'Failed to create feedback form' });
  }
};

// Delete a feedback form by id (also delete its responses)
exports.deleteFeedbackForm = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const formId = parseInt(id, 10);
    if (!Number.isFinite(formId)) return res.status(400).json({ message: 'Valid form id is required' });

    const [[exists]] = await pool.query('SELECT id FROM feedback_forms WHERE id = ? LIMIT 1', [formId]);
    if (!exists) return res.status(404).json({ message: 'Form not found' });

    // Delete child responses first to avoid FK issues
    await pool.query('DELETE FROM feedback_responses WHERE form_id = ?', [formId]);
    // Delete the form
    await pool.query('DELETE FROM feedback_forms WHERE id = ?', [formId]);

    res.json({ success: true });
  } catch (err) {
    console.error('deleteFeedbackForm error', err);
    res.status(500).json({ message: 'Failed to delete feedback form' });
  }
};

// Update an existing feedback form
exports.updateFeedbackForm = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const formId = parseInt(id, 10);
    if (!Number.isFinite(formId)) return res.status(400).json({ message: 'Valid form id is required' });

    const { teacherId, subjectId, questionIds, startDate, endDate, semester, title, status } = req.body || {};

    // Basic validation (allow partial but at least one updatable field)
    const updates = [];
    const params = [];
    if (title !== undefined) { updates.push('title = ?'); params.push(title || null); }
    if (teacherId != null) { updates.push('teacher_id = ?'); params.push(teacherId); }
    if (subjectId != null) { updates.push('subject_id = ?'); params.push(subjectId); }
    if (Array.isArray(questionIds)) { updates.push('question_ids = ?'); params.push(JSON.stringify(questionIds)); }
    if (startDate != null) { updates.push('start_date = ?'); params.push(startDate); }
    if (endDate != null) { updates.push('end_date = ?'); params.push(endDate); }
    if (semester != null) { updates.push('semester = ?'); params.push(semester); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status || null); }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    params.push(formId);
    const sql = `UPDATE feedback_forms SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Form not found' });

    const [rows] = await pool.query('SELECT id, title, slug, teacher_id, subject_id, question_ids, start_date, end_date, semester, status, created_at FROM feedback_forms WHERE id = ? LIMIT 1', [formId]);
    const form = rows && rows[0];
    if (!form) return res.status(404).json({ message: 'Form not found' });
    const isActive = (form.status && String(form.status).toLowerCase() === 'active') || (
      form.start_date && form.end_date && (new Date().toISOString().slice(0,10) >= String(form.start_date).slice(0,10)) && (new Date().toISOString().slice(0,10) <= String(form.end_date).slice(0,10))
    );

    res.json({
      id: form.id,
      title: form.title || null,
      slug: form.slug,
      teacherId: form.teacher_id,
      subjectId: form.subject_id,
      questionIds: JSON.parse(form.question_ids || '[]'),
      startDate: form.start_date,
      endDate: form.end_date,
      semester: form.semester || null,
      createdAt: form.created_at,
    });
  } catch (err) {
    console.error('updateFeedbackForm error', err);
    res.status(500).json({ message: 'Failed to update feedback form' });
  }
};

exports.listForms = async (req, res) => {
  try {
    const pool = await getPool();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const [[countRow]] = await pool.query('SELECT COUNT(*) as cnt FROM feedback_forms');
    const total = countRow?.cnt || 0;
    const [rows] = await pool.query(
      `SELECT f.id, f.title, f.slug, f.teacher_id, f.subject_id, f.question_ids, f.start_date, f.end_date, f.semester, f.status, f.created_at,
              st.name AS staff_name, sub.name AS subject_name,
              CASE WHEN (LOWER(COALESCE(f.status, '')) = 'active') OR (CURRENT_DATE() BETWEEN f.start_date AND f.end_date) THEN 1 ELSE 0 END AS is_active
         FROM feedback_forms f
    LEFT JOIN staff st ON st.id = f.teacher_id
    LEFT JOIN subjects sub ON sub.id = f.subject_id
         ORDER BY f.created_at DESC
         LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const items = rows.map((form) => {
      const fallbackTitle = (form.subject_name && form.staff_name) ? `${form.subject_name} - ${form.staff_name}` : null;
      return {
        id: form.id,
        title: form.title || fallbackTitle,
        slug: form.slug,
        teacherId: form.teacher_id,
        subjectId: form.subject_id,
        questionIds: JSON.parse(form.question_ids || '[]'),
        startDate: form.start_date,
        endDate: form.end_date,
        semester: form.semester || null,
        status: form.status || null,
        createdAt: form.created_at,
        isActive: !!form.is_active,
      };
    });
    res.json({ items, total, page, limit });
  } catch (err) {
    console.error('listForms error', err);
    res.status(500).json({ message: 'Failed to list feedback forms' });
  }
};

exports.listResponses = async (req, res) => {
  try {
    const pool = await getPool();
    const { slug } = req.params;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const [[form]] = await pool.query('SELECT id FROM feedback_forms WHERE slug = ? LIMIT 1', [slug]);
    if (!form) return res.status(404).json({ message: 'Form not found' });

    const [[countRow]] = await pool.query('SELECT COUNT(*) as cnt FROM feedback_responses WHERE form_id = ?', [form.id]);
    const total = countRow?.cnt || 0;
    const [rows] = await pool.query(
      'SELECT id, form_title, answers, submitted_at FROM feedback_responses WHERE form_id = ? ORDER BY submitted_at DESC LIMIT ? OFFSET ?',
      [form.id, limit, offset]
    );

    const items = rows.map(r => ({ id: r.id, formTitle: r.form_title || null, answers: JSON.parse(r.answers), submittedAt: r.submitted_at }));
    res.json({ items, total, page, limit });
  } catch (err) {
    console.error('listResponses error', err);
    res.status(500).json({ message: 'Failed to fetch responses' });
  }
};

exports.exportResponsesCSV = async (req, res) => {
  try {
    const pool = await getPool();
    const { slug } = req.params;
    const [[formRow]] = await pool.query('SELECT id, teacher_id, question_ids, semester FROM feedback_forms WHERE slug = ? LIMIT 1', [slug]);
    if (!formRow) return res.status(404).json({ message: 'Form not found' });

    const formId = formRow.id;
    const teacherId = formRow.teacher_id;
    const questionIds = JSON.parse(formRow.question_ids || '[]');
    const semester = formRow.semester || '';

    // Get teacher/staff name
    let staffName = '';
    try {
      const [[staffRow]] = await pool.query('SELECT name FROM staff WHERE id = ? LIMIT 1', [teacherId]);
      staffName = staffRow?.name || '';
    } catch {}

    // Get questions text map
    let qText = {};
    if (questionIds.length > 0) {
      const placeholders = questionIds.map(() => '?').join(',');
      const [qRows] = await pool.query(`SELECT id, text FROM questions WHERE id IN (${placeholders})`, questionIds);
      qText = (qRows || []).reduce((acc, r) => { acc[r.id] = r.text; return acc; }, {});
    }

    // Fetch responses
    const [rows] = await pool.query(
      'SELECT id, answers, submitted_at FROM feedback_responses WHERE form_id = ? ORDER BY submitted_at DESC',
      [formId]
    );

    // Headers: fixed then questions in order
    const fixedHeaders = ['id', 'submittedAt', 'name', 'email', 'phone', 'semester', 'staff'];
    const questionHeaders = questionIds.map((qid) => qText[qid] || `Q${qid}`);
    const headers = [...fixedHeaders, ...questionHeaders];

    // Build rows
    const esc = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const dataLines = rows.map(r => {
      const answers = JSON.parse(r.answers || '{}');
      // fixed columns
      const fixed = [
        r.id,
        r.submitted_at,
        answers.name || '',
        answers.email || '',
        answers.phone || '',
        semester || '',
        staffName || '',
      ];
      // questions ordered values
      const qValues = questionIds.map((qid) => answers[String(qid)] ?? '');
      const all = [...fixed, ...qValues];
      return all.map(esc).join(',');
    });

    const csv = [headers.join(','), ...dataLines].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="responses-${slug}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('exportResponsesCSV error', err);
    res.status(500).json({ message: 'Failed to export CSV' });
  }
};

exports.submitResponse = async (req, res) => {
  try {
    const pool = await getPool();
    const { slug } = req.params;
    const answers = req.body?.answers;
    if (!answers || typeof answers !== 'object') return res.status(400).json({ message: 'answers object is required' });

    const [rows] = await pool.query('SELECT * FROM feedback_forms WHERE slug = ? LIMIT 1', [slug]);
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Form not found' });
    const form = rows[0];

    await pool.query(
      'INSERT INTO feedback_responses (form_id, slug, form_title, answers) VALUES (?,?,?,?)',
      [form.id, slug, form.title || null, JSON.stringify(answers)]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('submitResponse error', err);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

exports.getFeedbackForm = async (req, res) => {
  try {
    const pool = await getPool();
    const { slug } = req.params;
    const [rows] = await pool.query('SELECT * FROM feedback_forms WHERE slug = ? LIMIT 1', [slug]);
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Form not found' });
    const form = rows[0];
    const isActive = (form.status && String(form.status).toLowerCase() === 'active') || (
      form.start_date && form.end_date && (new Date().toISOString().slice(0,10) >= String(form.start_date).slice(0,10)) && (new Date().toISOString().slice(0,10) <= String(form.end_date).slice(0,10))
    );
    res.json({
      id: form.id,
      title: form.title || null,
      slug: form.slug,
      teacherId: form.teacher_id,
      subjectId: form.subject_id,
      questionIds: JSON.parse(form.question_ids || '[]'),
      startDate: form.start_date,
      endDate: form.end_date,
      status: form.status || null,
      createdAt: form.created_at,
      isActive,
    });
  } catch (err) {
    console.error('getFeedbackForm error', err);
    res.status(500).json({ message: 'Failed to load feedback form' });
  }
};
