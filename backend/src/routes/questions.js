import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db.js';

const router = express.Router();

// Ensure questions table exists
async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      organization_id INT NOT NULL,
      department_id INT NOT NULL,
      subject_id INT NULL,
      type ENUM('MCQ_SINGLE','MCQ_MULTI','TRUE_FALSE','SHORT','LONG','NUMERIC') NOT NULL,
      difficulty ENUM('Easy','Medium','Hard') NOT NULL DEFAULT 'Easy',
      text TEXT NOT NULL,
      explanation TEXT NULL,
      options JSON NULL,
      correct JSON NULL,
      points INT NOT NULL DEFAULT 1,
      tags JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_q_org_dep_sub (organization_id, department_id, subject_id),
      INDEX idx_q_type (type),
      INDEX idx_q_difficulty (difficulty)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

const baseSchema = z.object({
  subjectId: z.number().int().positive().optional(),
  type: z.enum(['MCQ_SINGLE','MCQ_MULTI','TRUE_FALSE','SHORT','LONG','NUMERIC']),
  difficulty: z.enum(['Easy','Medium','Hard']).default('Easy'),
  text: z.string().min(1),
  explanation: z.string().optional().nullable(),
  points: z.number().int().min(0).default(1),
  tags: z.array(z.string()).optional().nullable(),
});

const mcqSchema = baseSchema.extend({
  type: z.enum(['MCQ_SINGLE','MCQ_MULTI']),
  options: z.array(z.object({ key: z.string(), value: z.string() })).min(2),
  // For UI-originated requests, correct may be missing; allow empty/omitted
  correct: z.array(z.string()).min(0).optional(),
});

const tfSchema = baseSchema.extend({
  type: z.literal('TRUE_FALSE'),
  correct: z.boolean(),
});

const shortLongSchema = baseSchema.extend({
  type: z.enum(['SHORT','LONG']),
  correct: z.string().optional().nullable(),
});

const numericSchema = baseSchema.extend({
  type: z.literal('NUMERIC'),
  correct: z.number().optional().nullable(),
});

const createSchema = z.discriminatedUnion('type', [mcqSchema, tfSchema, shortLongSchema, numericSchema]);

function toPageParams(q) {
  const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit || '10', 10) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export default function questionsRouter() {
  ensureTables().catch((e) => console.warn('[questions] ensure table failed', e));

  // Map QuestionBank.tsx payload to backend schema
  function mapFromUI(body) {
    // UI types: 'multiple-choice' | 'text' | 'rating'
    const uiType = String(body?.type || '').toLowerCase();
    let type = 'LONG';
    if (uiType === 'multiple-choice') type = 'MCQ_MULTI';
    else if (uiType === 'text') type = 'LONG';
    else if (uiType === 'rating') type = 'MCQ_SINGLE';

    // options may be array of strings; convert to [{key,value}]
    let options = undefined;
    if (Array.isArray(body?.options)) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      options = body.options
        .filter((s) => typeof s === 'string' && s.trim().length)
        .map((val, idx) => ({ key: letters[idx] || String(idx + 1), value: String(val) }));
    }

    // For rating type, if no options provided, use a default 1-5 scale
    if (uiType === 'rating' && (!options || options.length < 2)) {
      const defaults = ['1','2','3','4','5'];
      options = defaults.map((val, idx) => ({ key: String(idx + 1), value: val }));
    }

  // When subjectId is not provided but DB requires NOT NULL, attach a department-level default Subject.
  async function getOrCreateDefaultSubject(departmentId, orgId) {
    const code = `GEN-${departmentId}`;
    const name = 'General';
    // Try to find existing
    const found = await query('SELECT id FROM subjects WHERE code = ? AND department = ? LIMIT 1', [code, String(departmentId)]);
    if (found.length) return found[0].id;
    // Insert minimal subject row
    const res = await query(
      'INSERT INTO subjects (name, code, department, credits, description, semester, type, instructor_id, duration, prerequisites, objectives) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, code, String(departmentId), 0, 'Auto-created default subject', 'N/A', 'Core', null, 'N/A', null, null]
    );
    return res.insertId;
  }

    const payload = {
      subjectId: body?.subjectId ? Number(body.subjectId) : undefined,
      type,
      difficulty: body?.difficulty || 'Easy',
      text: String(body?.text || ''),
      explanation: body?.description || body?.explanation || null,
      options,
      // UI does not provide correct; store null
      correct: undefined,
      points: body?.points !== undefined ? Number(body.points) : 1,
      // Store category as tags array if provided
      tags: body?.category ? [String(body.category)] : undefined,
    };
    return payload;
  }

  // List with filters
  router.get('/', requireAuth(['DEPT','STAFF']), async (req, res) => {
    const { page, limit, offset } = toPageParams(req.query);
    const { search = '', subjectId = '', type = '', difficulty = '' } = req.query;

    const where = ['organization_id = ?','department_id = ?'];
    const params = [req.user.orgId || 0, req.user.departmentId || 0];

    if (subjectId) { where.push('subject_id = ?'); params.push(parseInt(subjectId, 10)); }
    if (type) { where.push('type = ?'); params.push(String(type)); }
    if (difficulty) { where.push('difficulty = ?'); params.push(String(difficulty)); }
    if (search) { where.push('(text LIKE ?)'); params.push(`%${search}%`); }

    const countRows = await query(`SELECT COUNT(*) AS total FROM questions WHERE ${where.join(' AND ')}`, params);
    const total = countRows[0]?.total || 0;

    const rows = await query(
      `SELECT id, subject_id AS subjectId, type, difficulty, text, explanation, options, correct, points, tags, created_at AS createdAt, updated_at AS updatedAt
       FROM questions
       WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const mapTypeForUI = (dbType) => {
      if (dbType === 'MCQ_SINGLE' || dbType === 'MCQ_MULTI' || dbType === 'TRUE_FALSE') return 'multiple-choice';
      if (dbType === 'SHORT' || dbType === 'LONG') return 'text';
      if (dbType === 'NUMERIC') return 'text';
      return 'text';
    };
    const mapOptionsForUI = (dbType, optionsJson) => {
      try {
        const parsed = optionsJson ? JSON.parse(optionsJson) : null;
        if (Array.isArray(parsed)) {
          // [{key,value}] -> [value]
          if (parsed.length && typeof parsed[0] === 'object' && parsed[0] !== null && 'value' in parsed[0]) {
            return parsed.map(o => o.value);
          }
          // already string[]
          if (typeof parsed[0] === 'string') return parsed;
        }
      } catch {}
      if (dbType === 'TRUE_FALSE') return ['True', 'False'];
      return [];
    };
    const mapCategory = (tagsJson) => {
      try {
        const t = tagsJson ? JSON.parse(tagsJson) : null;
        return Array.isArray(t) && t.length ? String(t[0]) : '';
      } catch { return ''; }
    };

    const items = rows.map(r => ({
      id: r.id,
      text: r.text,
      type: mapTypeForUI(r.type),
      options: mapOptionsForUI(r.type, r.options),
      category: mapCategory(r.tags),
      description: r.explanation || '',
      isRequired: false,
      createdAt: new Date(r.createdAt).toISOString().split('T')[0],
    }));

    res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  });

  // Place template and bulk routes BEFORE ":id" to avoid being captured by the param route
  // Serve a CSV template dynamically
  router.get('/template.csv', requireAuth(['DEPT']), async (req, res) => {
    const csvLines = [
      'text,type,options,category,description,isRequired,subjectId,difficulty,points',
      'Rate the course overall,rating,"[1,2,3,4,5]",Satisfaction,,true,,Medium,1',
      'How would you rate the instructor?,multiple-choice,"[""Excellent"",""Good"",""Average"",""Poor""]","Teaching Quality",,true,,Medium,1',
      'What improvements would you suggest?,text,,"Course Content",,false,,Easy,1'
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="questions-template.csv"');
    res.send(csvLines.join('\n'));
  });

  // Bulk upload: expects a FormData with field 'items' = JSON string array of UI-shaped questions
  router.post('/bulk', requireAuth(['DEPT']), async (req, res) => {
    try {
      let items = [];
      if (typeof req.body?.items === 'string') {
        try { items = JSON.parse(req.body.items); } catch { items = []; }
      } else if (Array.isArray(req.body?.items)) {
        items = req.body.items;
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'No items to import' });
      }

      const results = [];
      for (const raw of items) {
        try {
          const candidate = mapFromUI(raw);
          if (!candidate.text || !candidate.type) { results.push({ ok: false, error: 'Invalid row' }); continue; }

          let subjectId = candidate.subjectId ?? null;
          if (subjectId == null) {
            try { subjectId = await getOrCreateDefaultSubject(req.user.departmentId || 0, req.user.orgId || 0); } catch {}
          }

          await query(
            `INSERT INTO questions (organization_id, department_id, subject_id, type, difficulty, text, explanation, options, correct, points, tags)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.user.orgId || 0,
              req.user.departmentId || 0,
              subjectId,
              candidate.type,
              candidate.difficulty,
              candidate.text,
              candidate.explanation || null,
              candidate.options ? JSON.stringify(candidate.options) : null,
              candidate.correct !== undefined ? JSON.stringify(candidate.correct) : null,
              candidate.points ?? 1,
              candidate.tags ? JSON.stringify(candidate.tags) : null,
            ]
          );
          results.push({ ok: true });
        } catch (e) {
          results.push({ ok: false, error: 'Insert failed' });
        }
      }

      const ok = results.filter(r => r.ok).length;
      return res.json({ ok, failed: results.length - ok, results });
    } catch (e) {
      return res.status(500).json({ message: 'Bulk import failed' });
    }
  });

  // Get by id
  router.get('/:id', requireAuth(['DEPT','STAFF']), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const rows = await query(
      `SELECT id, subject_id AS subjectId, type, difficulty, text, explanation, options, correct, points, tags, created_at AS createdAt, updated_at AS updatedAt
       FROM questions WHERE id = ? AND organization_id = ? AND department_id = ? LIMIT 1`,
      [id, req.user.orgId || 0, req.user.departmentId || 0]
    );
    if (!rows.length) return res.status(404).json({ message: 'Question not found' });
    const r = rows[0];
    const type = (r.type === 'MCQ_SINGLE' || r.type === 'MCQ_MULTI' || r.type === 'TRUE_FALSE') ? 'multiple-choice' : 'text';
    let options = [];
    try {
      options = r.options ? JSON.parse(r.options) : [];
      if (options.length && typeof options[0] === 'object' && options[0] !== null && 'value' in options[0]) {
        options = options.map(o => o.value);
      }
    } catch { options = []; }
    if (r.type === 'TRUE_FALSE' && options.length === 0) options = ['True','False'];
    const category = (() => { try { const t = r.tags ? JSON.parse(r.tags) : null; return Array.isArray(t)&&t.length?String(t[0]):''; } catch { return ''; } })();
    res.json({ id: r.id, text: r.text, type, options, category, description: r.explanation || '', isRequired: false, createdAt: new Date(r.createdAt).toISOString().split('T')[0] });
  });

  // Create
  router.post('/', requireAuth(['DEPT']), async (req, res) => {
    // Accept both backend schema and UI schema from QuestionBank.tsx
    const candidate = (typeof req.body?.type === 'string' && ['multiple-choice','text','rating'].includes(String(req.body.type).toLowerCase()))
      ? mapFromUI(req.body)
      : { ...req.body, subjectId: Number(req.body?.subjectId), points: req.body?.points !== undefined ? Number(req.body.points) : undefined };

    const parsed = createSchema.safeParse(candidate);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });
    const data = parsed.data;

    // Validate MCQ correct keys exist in options
    if ((data.type === 'MCQ_SINGLE' || data.type === 'MCQ_MULTI') && data.options) {
      const keys = new Set(data.options.map(o => o.key));
      const answers = Array.isArray(data.correct) ? data.correct : [];
      const allExist = answers.every(k => keys.has(k));
      if (!allExist) return res.status(400).json({ message: 'Correct answer keys must be present in options' });
    }

    // Ensure subjectId: fallback to department default subject if column is NOT NULL in DB
    let subjectId = data.subjectId ?? null;
    if (subjectId == null) {
      try {
        subjectId = await getOrCreateDefaultSubject(req.user.departmentId || 0, req.user.orgId || 0);
      } catch (e) {
        // If subject creation fails, continue attempting NULL (in case schema allows it)
      }
    }

    const result = await query(
      `INSERT INTO questions (organization_id, department_id, subject_id, type, difficulty, text, explanation, options, correct, points, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.orgId || 0,
        req.user.departmentId || 0,
        subjectId,
        data.type,
        data.difficulty,
        data.text,
        data.explanation || null,
        data.options ? JSON.stringify(data.options) : null,
        data.correct !== undefined ? JSON.stringify(data.correct) : null,
        data.points ?? 1,
        data.tags ? JSON.stringify(data.tags) : null,
      ]
    );

    const newRows = await query('SELECT id, subject_id AS subjectId, type, difficulty, text, explanation, options, correct, points, tags, created_at AS createdAt, updated_at AS updatedAt FROM questions WHERE id = LAST_INSERT_ID()');
    res.status(201).json(newRows[0]);
  });

  // Update
  router.put('/:id', requireAuth(['DEPT']), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const candidate = (typeof req.body?.type === 'string' && ['multiple-choice','text','rating'].includes(String(req.body.type).toLowerCase()))
      ? mapFromUI(req.body)
      : { ...req.body, subjectId: req.body?.subjectId !== undefined ? Number(req.body.subjectId) : undefined, points: req.body?.points !== undefined ? Number(req.body.points) : undefined };

    const parsed = createSchema.partial({ subjectId: true }).safeParse(candidate);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });
    const data = parsed.data;

    // Optional MCQ validation
    if ((data.type === 'MCQ_SINGLE' || data.type === 'MCQ_MULTI') && data.options) {
      const keys = new Set(data.options.map(o => o.key));
      const answers = Array.isArray(data.correct) ? data.correct : [];
      const allExist = answers.every(k => keys.has(k));
      if (!allExist) return res.status(400).json({ message: 'Correct answer keys must be present in options' });
    }

    // Build dynamic update
    const fields = [];
    const values = [];
    const add = (sql, val) => { fields.push(sql); values.push(val); };
    if (data.subjectId !== undefined) add('subject_id = ?', data.subjectId ?? null);
    if (data.type !== undefined) add('type = ?', data.type);
    if (data.difficulty !== undefined) add('difficulty = ?', data.difficulty);
    if (data.text !== undefined) add('text = ?', data.text);
    if (data.explanation !== undefined) add('explanation = ?', data.explanation ?? null);
    if (data.options !== undefined) add('options = ?', data.options ? JSON.stringify(data.options) : null);
    if (data.correct !== undefined) add('correct = ?', data.correct !== undefined ? JSON.stringify(data.correct) : null);
    if (data.tags !== undefined) add('tags = ?', data.tags ? JSON.stringify(data.tags) : null);
    if (data.points !== undefined) add('points = ?', data.points ?? 1);
    if (!fields.length) return res.status(400).json({ message: 'No fields to update' });

    values.push(id, req.user.orgId || 0, req.user.departmentId || 0);

    const result = await query(
      `UPDATE questions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND organization_id = ? AND department_id = ?`,
      values
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Question not found' });

    const rows = await query('SELECT id, subject_id AS subjectId, type, difficulty, text, explanation, options, correct, points, tags, created_at AS createdAt, updated_at AS updatedAt FROM questions WHERE id = ?', [id]);
    res.json(rows[0]);
  });

  // Delete
  router.delete('/:id', requireAuth(['DEPT']), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = await query('DELETE FROM questions WHERE id = ? AND organization_id = ? AND department_id = ?', [id, req.user.orgId || 0, req.user.departmentId || 0]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Question not found' });
    res.json({ ok: true, message: 'Question deleted successfully' });
  });

  return router;
}
