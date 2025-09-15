import express from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

async function emitNotificationSafe({ type, title, message = '', link = '', roleScope = 'DepartmentAdmin', orgId = null, deptId = null }) {
  try {
    await query(
      'INSERT INTO notifications (type, title, message, link, role_scope, org_id, dept_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [type, title, message, link, roleScope, orgId, deptId]
    );
  } catch (e) {
    console.warn('[notify] emit failed:', e?.message || e);
  }
}

// Ensure feedback tables
async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS feedback_forms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      organization_id INT NOT NULL,
      department_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 0,
      access_code VARCHAR(32) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ff_org_dep (organization_id, department_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Public responses for feedback_master (simple) forms — single-table storage of all answers as JSON
  await query(`
    CREATE TABLE IF NOT EXISTS feedback_master_responses (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      master_id INT NOT NULL,
      organization_id INT NULL,
      department_id INT NULL,
      subject_id INT NULL,
      staff_id INT NULL,
      access_code VARCHAR(32) NULL,
      name VARCHAR(255) NULL,
      email VARCHAR(255) NULL,
      phone VARCHAR(50) NULL,
      answers LONGTEXT NULL, -- JSON object of questionId => answer
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (master_id) REFERENCES feedback_master(id) ON DELETE CASCADE,
      INDEX idx_fmr_master (master_id),
      INDEX idx_fmr_org_dep (organization_id, department_id),
      INDEX idx_fmr_subject (subject_id),
      INDEX idx_fmr_staff (staff_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  // Ensure composite unique index (master_id, email) to enforce one response per email per form
  try {
    const ix = await query(
      `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'feedback_master_responses' AND INDEX_NAME = 'uniq_fmr_master_email'`
    );
    if (!ix[0] || !ix[0].c) {
      await query(`CREATE UNIQUE INDEX uniq_fmr_master_email ON feedback_master_responses (master_id, email)`);
    }
  } catch (e) {
    console.warn('[feedback] ensure unique index (master_id,email) failed:', e?.message || e);
  }
  // Ensure new columns exist if the table was created previously without them
  await ensureColumn('feedback_master_responses', 'organization_id', 'organization_id INT NULL');
  await ensureColumn('feedback_master_responses', 'department_id', 'department_id INT NULL');
  await ensureColumn('feedback_master_responses', 'access_code', 'access_code VARCHAR(32) NULL');
  await ensureColumn('feedback_master_responses', 'answers', 'answers LONGTEXT NULL');
  await ensureColumn('feedback_master_responses', 'subject_id', 'subject_id INT NULL');
  await ensureColumn('feedback_master_responses', 'staff_id', 'staff_id INT NULL');
  await query(`
    CREATE TABLE IF NOT EXISTS feedback_master_answers (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      response_id BIGINT NOT NULL,
      question_key VARCHAR(64) NOT NULL,
      answer LONGTEXT NULL,
      FOREIGN KEY (response_id) REFERENCES feedback_master_responses(id) ON DELETE CASCADE,
      INDEX idx_fma_response (response_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  // Store shareable links for forms (history of links if regenerated)
  await query(`
    CREATE TABLE IF NOT EXISTS feedback_form_links (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      url VARCHAR(512) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (form_id) REFERENCES feedback_forms(id) ON DELETE CASCADE,
      INDEX idx_ffl_form (form_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS feedback_form_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      question_order INT NOT NULL,
      type ENUM('MCQ_SINGLE','MCQ_MULTI','TRUE_FALSE','SHORT','LONG','NUMERIC','RATING') NOT NULL,
      text TEXT NOT NULL,
      options LONGTEXT NULL,
      required TINYINT(1) NOT NULL DEFAULT 0,
      points INT NOT NULL DEFAULT 1,
      FOREIGN KEY (form_id) REFERENCES feedback_forms(id) ON DELETE CASCADE,
      INDEX idx_ffq_form (form_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  // Assign a form to semester, staff, subject (many rows per form)
  await query(`
    CREATE TABLE IF NOT EXISTS feedback_form_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      organization_id INT NOT NULL,
      department_id INT NOT NULL,
      semester VARCHAR(50) NOT NULL,
      staff_id INT NOT NULL,
      subject_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (form_id) REFERENCES feedback_forms(id) ON DELETE CASCADE,
      INDEX idx_ffa_form (form_id),
      INDEX idx_ffa_sem_staff_subj (semester, staff_id, subject_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS feedback_responses (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      respondent_id INT NULL,
      respondent_type ENUM('Student','Staff','Anonymous') NOT NULL DEFAULT 'Anonymous',
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (form_id) REFERENCES feedback_forms(id) ON DELETE CASCADE,
      INDEX idx_fr_form (form_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS feedback_answers (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      response_id BIGINT NOT NULL,
      form_question_id INT NOT NULL,
      answer LONGTEXT NULL,
      FOREIGN KEY (response_id) REFERENCES feedback_responses(id) ON DELETE CASCADE,
      FOREIGN KEY (form_question_id) REFERENCES feedback_form_questions(id) ON DELETE CASCADE,
      INDEX idx_fa_response (response_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Single-table storage for simplified workflows
  await query(`
    CREATE TABLE IF NOT EXISTS feedback_master (
      id INT AUTO_INCREMENT PRIMARY KEY,
      organization_id INT NOT NULL,
      department_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      semester VARCHAR(50) NOT NULL,
      description TEXT NULL,
      start_date DATE NULL,
      end_date DATE NULL,
      audience VARCHAR(30) NULL,
      staff_ids LONGTEXT NULL,      -- JSON array of staff IDs
      subject_ids LONGTEXT NULL,    -- JSON array of subject IDs
      questions LONGTEXT NULL,      -- JSON array of question objects or IDs
      is_active TINYINT(1) NOT NULL DEFAULT 0,
      access_code VARCHAR(32) UNIQUE,
      share_url VARCHAR(512) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_fm_org_dep (organization_id, department_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // If table already existed from previous version, ensure new columns exist (MySQL/MariaDB safe)
  async function ensureColumn(table, column, definition) {
    try {
      const rows = await query(
        `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      const exists = (rows?.[0]?.c || 0) > 0;
      if (!exists) {
        await query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
      }
    } catch (e) {
      console.warn(`[feedback] ensureColumn failed for ${table}.${column}:`, e?.message || e);
    }
  }
  await ensureColumn('feedback_master', 'description', 'TEXT NULL');
  await ensureColumn('feedback_master', 'start_date', 'DATE NULL');
  await ensureColumn('feedback_master', 'end_date', 'DATE NULL');
  await ensureColumn('feedback_master', 'audience', 'VARCHAR(30) NULL');
}

const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  semester: z.string().min(1),
  questions: z.array(z.object({
    id: z.number().int().optional(), // for updates
    type: z.enum(['MCQ_SINGLE','MCQ_MULTI','TRUE_FALSE','SHORT','LONG','NUMERIC','RATING']),
    text: z.string().min(1),
    options: z.array(z.string()).optional(),
    required: z.boolean().default(false),
    points: z.number().int().min(0).default(1),
  })).min(1),
  assignments: z.array(z.object({ staffId: z.number().int().positive(), subjectId: z.number().int().positive() })).min(1),
});

function toPageParams(q) {
  const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit || '10', 10) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

let tablesReady = false;
let tablesPromise = null;
let subjectsDeptColPromise = null;

async function getSubjectsDeptColumn() {
  if (!subjectsDeptColPromise) {
    subjectsDeptColPromise = (async () => {
      try {
        const rows = await query(
          `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subjects' AND COLUMN_NAME IN ('department_id','department')`
        );
        const names = rows.map(r => r.COLUMN_NAME);
        if (names.includes('department_id')) return 'department_id';
        if (names.includes('department')) return 'department';
      } catch {}
      return 'department'; // sensible fallback
    })();
  }
  return subjectsDeptColPromise;
}
export default function feedbackRouter() {
  if (!tablesPromise) {
    tablesPromise = ensureTables()
      .then(() => { tablesReady = true; })
      .catch(e => { console.warn('[feedback] ensure tables failed', e); tablesReady = true; });
  }
  // Gate all routes until tables are ensured once
  router.use(async (req, res, next) => {
    try { await tablesPromise; } catch {}
    next();
  });

  // Department-scoped analytics: aggregates ratings and counts with optional filters
  // Query params: from=YYYY-MM-DD, to=YYYY-MM-DD, staffId, subjectId
  router.get('/department/analytics', requireAuth(['DEPT','STAFF']), async (req, res) => {
    try {
      const orgId = req.user.orgId || 0;
      const depId = req.user.departmentId || 0;
      const { from, to, staffId, subjectId, semester } = req.query;

      const where = ['f.organization_id = ?', 'f.department_id = ?'];
      const params = [orgId, depId];
      if (staffId) { where.push('f.staff_ids LIKE ?'); params.push(`%${Number(staffId)}%`); }
      if (subjectId) { where.push('f.subject_ids LIKE ?'); params.push(`%${Number(subjectId)}%`); }

      // Pull responses joined with master for scoping and with optional date filtering
      const dateWhere = [];
      if (from) { dateWhere.push('r.submitted_at >= ?'); params.push(`${String(from)} 00:00:00`); }
      if (to) { dateWhere.push('r.submitted_at <= ?'); params.push(`${String(to)} 23:59:59`); }

      const rows = await query(
        `SELECT r.id, r.submitted_at AS submittedAt, r.answers, r.subject_id AS subjectId, r.staff_id AS staffId,
                f.id AS formId, f.subject_ids AS subjectIds, f.staff_ids AS staffIds
         FROM feedback_master_responses r
         JOIN feedback_master f ON f.id = r.master_id
         WHERE ${where.join(' AND ')}
           ${dateWhere.length ? ' AND ' + dateWhere.join(' AND ') : ''}
         ORDER BY r.submitted_at DESC`
        , params
      );

      // Fetch questions to know which are rating type and capture options for mapping
      const questions = await query(`SELECT id, type, options FROM questions`);
      const questionsById = new Map(questions.map(q => [Number(q.id), q]));
      const ratingQuestionIds = new Set(questions.filter(q => String(q.type) === 'rating').map(q => Number(q.id)));

      // Fetch subjects to map subjectId -> semester and name
      const subjRows = await query(`SELECT id, semester, name FROM subjects`);
      const subjectSemester = new Map(subjRows.map(r => [Number(r.id), String(r.semester ?? '')]));
      const subjectNameById = new Map(subjRows.map(r => [Number(r.id), String(r.name || '')]));

      // Fetch staff names
      let staffNameById = new Map();
      try {
        const staffRows = await query(`SELECT id, name FROM staff`);
        staffNameById = new Map(staffRows.map(r => [Number(r.id), String(r.name || '')]));
      } catch (e) {
        // ignore if table naming differs
      }

      const ratingBuckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let ratingSum = 0, ratingCount = 0;
      let totalResponses = 0;
      const perSubject = new Map(); // subjectId -> {responses, ratingSum, ratingCount}
      const perStaff = new Map(); // staffId -> {responses, ratingSum, ratingCount}
      const perSemester = new Map(); // semester -> responses

      for (const r of rows) {
        totalResponses += 1;
        let ans = {};
        try { ans = r.answers ? JSON.parse(r.answers) : {}; } catch { ans = {}; }
        // Optional filter: limit by semester if provided
        const sId = Number(r.subjectId) || null;
        if (semester && sId) {
          const semVal = subjectSemester.get(sId) || '';
          if (String(semVal) !== String(semester)) continue;
        }
        // accumulate subject/staff totals
        const tId = Number(r.staffId) || null;
        if (sId) {
          if (!perSubject.has(sId)) perSubject.set(sId, { responses: 0, ratingSum: 0, ratingCount: 0 });
          perSubject.get(sId).responses += 1;
          const sem = subjectSemester.get(sId) || '';
          const key = sem || 'N/A';
          perSemester.set(key, (perSemester.get(key) || 0) + 1);
        }
        if (tId) {
          if (!perStaff.has(tId)) perStaff.set(tId, { responses: 0, ratingSum: 0, ratingCount: 0 });
          perStaff.get(tId).responses += 1;
        }
        // accumulate ratings from answers using dynamic mapping
        for (const [k, raw] of Object.entries(ans)) {
          const qid = Number(k);
          if (!Number.isFinite(qid)) continue;
          const q = questionsById.get(qid) || {};
          let rv = null; // numeric rating 1..5

          // Direct numeric for rating type
          if (ratingQuestionIds.has(qid)) {
            const num = Number(raw);
            if (Number.isFinite(num)) rv = Math.max(1, Math.min(5, Math.round(num)));
          } else {
            const val = (raw ?? '').toString().trim().toLowerCase();
            // Try map common positive/negative choices to stars
            const positive5 = ['excellent','strongly agree','stronglyagree','very satisfied','very good','outstanding'];
            const positive4 = ['good','agree','satisfied','yes'];
            const neutral3  = ['neutral','average','ok','okay','maybe'];
            const negative2 = ['poor','disagree','no'];
            const negative1 = ['very poor','strongly disagree','stronglydisagree','terrible','bad'];

            const pick = (arr) => arr.some(w => val === w || val.includes(w));
            if (pick(positive5)) rv = 5;
            else if (pick(positive4)) rv = 4;
            else if (pick(neutral3)) rv = 3;
            else if (pick(negative2)) rv = 2;
            else if (pick(negative1)) rv = 1;
            else {
              // If options exist, attempt position-based mapping (higher index = higher rating)
              try {
                const opts = q?.options ? JSON.parse(q.options) : null;
                if (Array.isArray(opts) && opts.length > 1) {
                  const idx = opts.map(x => String(x).toLowerCase()).indexOf(val);
                  if (idx >= 0) {
                    const fraction = (idx) / (opts.length - 1); // 0..1
                    rv = Math.max(1, Math.min(5, Math.round(1 + fraction * 4)));
                  }
                }
              } catch {}
            }
          }

          if (rv != null) {
            ratingBuckets[rv] = (ratingBuckets[rv] || 0) + 1;
            ratingSum += rv;
            ratingCount += 1;
            if (sId && perSubject.has(sId)) { perSubject.get(sId).ratingSum += rv; perSubject.get(sId).ratingCount += 1; }
            if (tId && perStaff.has(tId)) { perStaff.get(tId).ratingSum += rv; perStaff.get(tId).ratingCount += 1; }
          }
        }
      }

      const avgRating = ratingCount ? (ratingSum / ratingCount) : 0;
      const subjectStats = Array.from(perSubject.entries()).map(([id, v]) => ({
        subjectId: id,
        subjectName: subjectNameById.get(Number(id)) || String(id),
        responses: v.responses,
        avgRating: v.ratingCount ? v.ratingSum / v.ratingCount : 0,
      }));
      const staffStats = Array.from(perStaff.entries()).map(([id, v]) => ({
        staffId: id,
        staffName: staffNameById.get(Number(id)) || String(id),
        responses: v.responses,
        avgRating: v.ratingCount ? v.ratingSum / v.ratingCount : 0,
      }));

      const semesterStats = Array.from(perSemester.entries()).map(([semester, responses]) => ({ semester, responses }));

      res.json({
        totalResponses,
        avgRating: Number(avgRating.toFixed(2)),
        ratingBuckets,
        subjectStats,
        staffStats,
        semesterStats,
      });
    } catch (e) {
      console.error('analytics error', e);
      res.status(500).json({ message: 'Failed to compute analytics' });
    }
  });

  // Department-scoped: list forms with response counts using feedback_master_responses
  router.get('/department/forms-with-counts', requireAuth(['DEPT','STAFF']), async (req, res) => {
    try {
      const orgId = req.user.orgId || 0;
      const depId = req.user.departmentId || 0;
      const rows = await query(
        `SELECT f.id,
                f.title,
                f.semester,
                f.access_code AS accessCode,
                f.staff_ids AS staffIds,
                f.subject_ids AS subjectIds,
                COUNT(r.id) AS responseCount,
                MAX(r.submitted_at) AS lastSubmittedAt
         FROM feedback_master f
         LEFT JOIN feedback_master_responses r ON r.master_id = f.id
         WHERE f.organization_id = ? AND f.department_id = ?
         GROUP BY f.id, f.title, f.semester, f.access_code, f.staff_ids, f.subject_ids
         ORDER BY f.id DESC`,
        [orgId, depId]
      );
      const items = rows.map(r => {
        let teacherId = null;
        let subjectId = null;
        try {
          const tids = r.staffIds ? JSON.parse(r.staffIds) : [];
          if (Array.isArray(tids) && tids.length) teacherId = Number(tids[0]) || null;
        } catch {}
        try {
          const sids = r.subjectIds ? JSON.parse(r.subjectIds) : [];
          if (Array.isArray(sids) && sids.length) subjectId = Number(sids[0]) || null;
        } catch {}
        return {
          id: r.id,
          title: r.title,
          semester: r.semester,
          slug: r.accessCode || null,
          teacherId,
          subjectId,
          responseCount: Number(r.responseCount) || 0,
          lastSubmittedAt: r.lastSubmittedAt || null,
        };
      });
      res.json({ items });
    } catch (e) {
      res.status(500).json({ message: 'Failed to load department forms' });
    }
  });

  // Department-scoped: list responses by numeric master_id (avoids slug/accessCode dependency)
  router.get('/forms/by-id/:id/responses', requireAuth(['DEPT','STAFF']), async (req, res) => {
    try {
      const { id } = req.params;
      const { page = '1', limit = '10', subjectId } = req.query;
      const p = Math.max(1, parseInt(String(page), 10) || 1);
      const l = Math.min(1000, Math.max(1, parseInt(String(limit), 10) || 10));
      const offset = (p - 1) * l;

      const formRows = await query(`SELECT id, organization_id AS orgId, department_id AS depId FROM feedback_master WHERE id = ? LIMIT 1`, [Number(id)]);
      if (!formRows.length) return res.status(404).json({ message: 'Form not found' });
      const userOrg = req.user.orgId;
      const userDep = req.user.departmentId;
      if ((userOrg != null && userOrg !== formRows[0].orgId) || (userDep != null && userDep !== formRows[0].depId)) {
        return res.status(403).json({ message: 'Not authorized for this form' });
      }

      const filters = ['master_id = ?'];
      const fparams = [Number(id)];
      if (subjectId) { filters.push('subject_id = ?'); fparams.push(Number(subjectId)); }

      const countRows = await query(`SELECT COUNT(*) AS total FROM feedback_master_responses WHERE ${filters.join(' AND ')}`, fparams);
      const total = countRows[0]?.total || 0;

      const rows = await query(
        `SELECT id, submitted_at AS submittedAt, name, email, phone, answers
         FROM feedback_master_responses
         WHERE ${filters.join(' AND ')}
         ORDER BY submitted_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        [...fparams, l, offset]
      );
      const items = rows.map(r => {
        let ans = {};
        try { ans = r.answers ? JSON.parse(r.answers) : {}; } catch { ans = {}; }
        if (r.name !== null && r.name !== undefined) ans.name = r.name;
        if (r.email !== null && r.email !== undefined) ans.email = r.email;
        if (r.phone !== null && r.phone !== undefined) ans.phone = r.phone;
        return {
          id: r.id,
          submittedAt: new Date(r.submittedAt).toISOString().replace('T', ' ').slice(0, 19),
          answers: ans,
        };
      });
      return res.json({ items, total, page: p, limit: l, totalPages: Math.ceil(total / l) });
    } catch (e) {
      return res.status(500).json({ message: 'Failed to load responses' });
    }
  });

  // Department-scoped: CSV export by numeric master_id
  router.get('/forms/by-id/:id/responses.csv', requireAuth(['DEPT','STAFF']), async (req, res) => {
    try {
      const { id } = req.params;
      const { subjectId } = req.query;
      const formRows = await query(`SELECT id, organization_id AS orgId, department_id AS depId FROM feedback_master WHERE id = ? LIMIT 1`, [Number(id)]);
      if (!formRows.length) return res.status(404).json({ message: 'Form not found' });
      const userOrg = req.user.orgId;
      const userDep = req.user.departmentId;
      if ((userOrg != null && userOrg !== formRows[0].orgId) || (userDep != null && userDep !== formRows[0].depId)) {
        return res.status(403).json({ message: 'Not authorized for this form' });
      }
      const filters = ['master_id = ?'];
      const fparams = [Number(id)];
      if (subjectId) { filters.push('subject_id = ?'); fparams.push(Number(subjectId)); }
      const rows = await query(
        `SELECT id, submitted_at AS submittedAt, name, email, phone, answers
         FROM feedback_master_responses
         WHERE ${filters.join(' AND ')}
         ORDER BY submitted_at DESC, id DESC`,
        fparams
      );
      // Resolve form title for nicer notification
      let formTitle = '';
      try {
        const t = await query(`SELECT title FROM feedback_master WHERE id = ? LIMIT 1`, [Number(id)]);
        formTitle = t?.[0]?.title || '';
      } catch {}
      const keys = new Set(['id','submittedAt','name','email','phone']);
      const parsed = rows.map(r => {
        let ans = {};
        try { ans = r.answers ? JSON.parse(r.answers) : {}; } catch { ans = {}; }
        Object.keys(ans).forEach(k => keys.add(String(k)));
        return { id: r.id, submittedAt: new Date(r.submittedAt).toISOString().replace('T',' ').slice(0,19), name: r.name || '', email: r.email || '', phone: r.phone || '', answers: ans };
      });
      const header = Array.from(keys);
      const csvRows = [header.join(',')];
      parsed.forEach(row => {
        const line = header.map(k => {
          const v = (k in row) ? (row)[k] : row.answers?.[k];
          const s = v === undefined || v === null ? '' : (Array.isArray(v) ? v.join('; ') : String(v));
          const esc = '"' + s.replace(/"/g, '""') + '"';
          return esc;
        }).join(',');
        csvRows.push(line);
      });
      const csv = csvRows.join('\n');
      // Emit notification: export done
      await emitNotificationSafe({
        type: 'export_done',
        title: 'CSV export is ready',
        message: `${formTitle ? formTitle + ' • ' : ''}${rows.length} row(s) exported`,
        link: '/department-admin/feedback/responses',
        roleScope: 'DepartmentAdmin',
        orgId: req.user.orgId || null,
        deptId: req.user.departmentId || null,
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="responses.csv"');
      return res.send(csv);
    } catch (e) {
      return res.status(500).json({ message: 'Failed to export CSV' });
    }
  });

  // Organization-wide feedback activity (combined master + legacy) with optional date range filters
  // Query: from=YYYY-MM-DD, to=YYYY-MM-DD (inclusive)
  router.get('/org/activity', requireAuth(['ORG']), async (req, res) => {
    try {
      const orgId = req.user.orgId || 0;
      const { from, to, limit = '100', departmentId, staffId, subjectId } = req.query;
      const l = Math.min(1000, Math.max(1, parseInt(String(limit), 10) || 100));

      const whereMaster = ['fmr.organization_id = ?'];
      const paramsMaster = [orgId];
      if (from) { whereMaster.push('DATE(fmr.submitted_at) >= ?'); paramsMaster.push(String(from)); }
      if (to) { whereMaster.push('DATE(fmr.submitted_at) <= ?'); paramsMaster.push(String(to)); }
      if (departmentId) { whereMaster.push('fmr.department_id = ?'); paramsMaster.push(Number(departmentId)); }
      if (staffId) { whereMaster.push('fmr.staff_id = ?'); paramsMaster.push(Number(staffId)); }
      if (subjectId) { whereMaster.push('fmr.subject_id = ?'); paramsMaster.push(Number(subjectId)); }

      const whereLegacy = ['f.organization_id = ?'];
      const paramsLegacy = [orgId];
      if (from) { whereLegacy.push('DATE(fr.submitted_at) >= ?'); paramsLegacy.push(String(from)); }
      if (to) { whereLegacy.push('DATE(fr.submitted_at) <= ?'); paramsLegacy.push(String(to)); }
      if (departmentId) { whereLegacy.push('a.department_id = ?'); paramsLegacy.push(Number(departmentId)); }
      if (staffId) { whereLegacy.push('a.staff_id = ?'); paramsLegacy.push(Number(staffId)); }
      if (subjectId) { whereLegacy.push('a.subject_id = ?'); paramsLegacy.push(Number(subjectId)); }

      const sql = `
        (
          SELECT fmr.id AS id,
                 fmr.submitted_at AS submittedAt,
                 fmr.name AS name,
                 fmr.email AS email,
                 fmr.phone AS phone,
                 fmr.department_id AS departmentId,
                 fmr.subject_id AS subjectId,
                 fmr.staff_id AS staffId,
                 COALESCE(d.name, CONCAT('Dept ', fmr.department_id)) AS departmentName,
                 COALESCE(su.name, CONCAT('Subject ', fmr.subject_id)) AS subjectName,
                 COALESCE(st.name, CONCAT('Staff ', fmr.staff_id)) AS staffName,
                 'MASTER' AS source
          FROM feedback_master_responses fmr
          LEFT JOIN departments d ON d.id = fmr.department_id AND d.organization_id = fmr.organization_id
          LEFT JOIN subjects su ON su.id = fmr.subject_id
          LEFT JOIN staff st ON st.id = fmr.staff_id
          WHERE ${whereMaster.join(' AND ')}
        )
        UNION ALL
        (
          SELECT fr.id AS id,
                 fr.submitted_at AS submittedAt,
                 NULL AS name,
                 NULL AS email,
                 NULL AS phone,
                 a.department_id AS departmentId,
                 a.subject_id AS subjectId,
                 a.staff_id AS staffId,
                 COALESCE(d2.name, CONCAT('Dept ', a.department_id)) AS departmentName,
                 COALESCE(su2.name, CONCAT('Subject ', a.subject_id)) AS subjectName,
                 COALESCE(st2.name, CONCAT('Staff ', a.staff_id)) AS staffName,
                 'LEGACY' AS source
          FROM feedback_responses fr
          JOIN feedback_forms f ON f.id = fr.form_id
          LEFT JOIN feedback_form_assignments a ON a.form_id = fr.form_id
          LEFT JOIN departments d2 ON d2.id = a.department_id AND d2.organization_id = f.organization_id
          LEFT JOIN subjects su2 ON su2.id = a.subject_id
          LEFT JOIN staff st2 ON st2.id = a.staff_id
          WHERE ${whereLegacy.join(' AND ')}
        )
        ORDER BY submittedAt DESC
        LIMIT ?`;
      const rows = await query(sql, [...paramsMaster, ...paramsLegacy, l]);
      const items = rows.map(r => ({
        id: r.id,
        submittedAt: new Date(r.submittedAt).toISOString().replace('T', ' ').slice(0,19),
        name: r.name || '',
        email: r.email || '',
        phone: r.phone || '',
        departmentId: r.departmentId || null,
        subjectId: r.subjectId || null,
        staffId: r.staffId || null,
        departmentName: r.departmentName || null,
        subjectName: r.subjectName || null,
        staffName: r.staffName || null,
        source: r.source,
      }));
      res.json({ items });
    } catch (e) {
      console.error('Error loading org activity:', e);
      res.status(500).json({ error: 'Failed to load activity' });
    }
  });

  router.get('/org/activity.csv', requireAuth(['ORG']), async (req, res) => {
    try {
      // Reuse JSON endpoint's logic for parameters
      const orgId = req.user.orgId || 0;
      const { from, to, departmentId, staffId, subjectId } = req.query;

      const whereMaster = ['fmr.organization_id = ?'];
      const paramsMaster = [orgId];
      if (from) { whereMaster.push('DATE(fmr.submitted_at) >= ?'); paramsMaster.push(String(from)); }
      if (to) { whereMaster.push('DATE(fmr.submitted_at) <= ?'); paramsMaster.push(String(to)); }
      if (departmentId) { whereMaster.push('fmr.department_id = ?'); paramsMaster.push(Number(departmentId)); }
      if (staffId) { whereMaster.push('fmr.staff_id = ?'); paramsMaster.push(Number(staffId)); }
      if (subjectId) { whereMaster.push('fmr.subject_id = ?'); paramsMaster.push(Number(subjectId)); }

      const whereLegacy = ['f.organization_id = ?'];
      const paramsLegacy = [orgId];
      if (from) { whereLegacy.push('DATE(fr.submitted_at) >= ?'); paramsLegacy.push(String(from)); }
      if (to) { whereLegacy.push('DATE(fr.submitted_at) <= ?'); paramsLegacy.push(String(to)); }
      if (departmentId) { whereLegacy.push('a.department_id = ?'); paramsLegacy.push(Number(departmentId)); }
      if (staffId) { whereLegacy.push('a.staff_id = ?'); paramsLegacy.push(Number(staffId)); }
      if (subjectId) { whereLegacy.push('a.subject_id = ?'); paramsLegacy.push(Number(subjectId)); }

      const sql = `
        (
          SELECT fmr.id AS id,
                 fmr.submitted_at AS submittedAt,
                 fmr.name AS name,
                 fmr.email AS email,
                 fmr.phone AS phone,
                 COALESCE(d.name, CONCAT('Dept ', fmr.department_id)) AS departmentName,
                 COALESCE(su.name, CONCAT('Subject ', fmr.subject_id)) AS subjectName,
                 COALESCE(st.name, CONCAT('Staff ', fmr.staff_id)) AS staffName,
                 'MASTER' AS source
          FROM feedback_master_responses fmr
          LEFT JOIN departments d ON d.id = fmr.department_id AND d.organization_id = fmr.organization_id
          LEFT JOIN subjects su ON su.id = fmr.subject_id
          LEFT JOIN staff st ON st.id = fmr.staff_id
          WHERE ${whereMaster.join(' AND ')}
        )
        UNION ALL
        (
          SELECT fr.id AS id,
                 fr.submitted_at AS submittedAt,
                 NULL AS name,
                 NULL AS email,
                 NULL AS phone,
                 COALESCE(d2.name, CONCAT('Dept ', a.department_id)) AS departmentName,
                 COALESCE(su2.name, CONCAT('Subject ', a.subject_id)) AS subjectName,
                 COALESCE(st2.name, CONCAT('Staff ', a.staff_id)) AS staffName,
                 'LEGACY' AS source
          FROM feedback_responses fr
          JOIN feedback_forms f ON f.id = fr.form_id
          LEFT JOIN feedback_form_assignments a ON a.form_id = fr.form_id
          LEFT JOIN departments d2 ON d2.id = a.department_id AND d2.organization_id = f.organization_id
          LEFT JOIN subjects su2 ON su2.id = a.subject_id
          LEFT JOIN staff st2 ON st2.id = a.staff_id
          WHERE ${whereLegacy.join(' AND ')}
        )
        ORDER BY submittedAt DESC`;
      const rows = await query(sql, [...paramsMaster, ...paramsLegacy]);
      const header = ['id','submittedAt','name','email','phone','department','subject','staff','source'];
      const csvRows = [header.join(',')];
      rows.forEach(r => {
        const out = [
          r.id,
          new Date(r.submittedAt).toISOString().replace('T',' ').slice(0,19),
          r.name || '',
          r.email || '',
          r.phone || '',
          r.departmentName || '',
          r.subjectName || '',
          r.staffName || '',
          r.source || '',
        ].map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',');
        csvRows.push(out);
      });
      const csv = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="org_activity.csv"');
      return res.send(csv);
    } catch (e) {
      console.error('Error exporting org activity CSV:', e);
      res.status(500).json({ error: 'Failed to export activity' });
    }
  });

  // Organization-level stats: total feedback count (master + legacy)
  router.get('/org/stats/total-feedback', requireAuth(['ORG']), async (req, res) => {
    try {
      const orgId = req.user.orgId || 0;
      const m = await query(`SELECT COUNT(*) AS c FROM feedback_master_responses WHERE organization_id = ?`, [orgId]);
      const l = await query(
        `SELECT COUNT(fr.id) AS c
         FROM feedback_responses fr
         JOIN feedback_forms f ON f.id = fr.form_id
         WHERE f.organization_id = ?`,
        [orgId]
      );
      const total = (m[0]?.c || 0) + (l[0]?.c || 0);
      res.json({ total });
    } catch (e) {
      console.error('Error loading org total feedback:', e);
      res.status(500).json({ error: 'Failed to load total feedback' });
    }
  });

  // Organization-level stats: total feedback responses by subject (legacy forms path), optional departmentId filter
  router.get('/org/stats/subject-responses', requireAuth(['ORG']), async (req, res) => {
    try {
      const { departmentId } = req.query;
      // 1) New path: feedback_master_responses grouped by subject_id
      const paramsFmr = [req.user.orgId || 0];
      let whereFmr = 'fmr.organization_id = ? AND fmr.subject_id IS NOT NULL';
      if (departmentId) { whereFmr += ' AND fmr.department_id = ?'; paramsFmr.push(Number(departmentId)); }
      const fmrRows = await query(
        `SELECT fmr.subject_id AS subjectId, COALESCE(sub.name, CONCAT('Subject ', fmr.subject_id)) AS subjectName, COUNT(fmr.id) AS responseCount
         FROM feedback_master_responses fmr
         LEFT JOIN subjects sub ON sub.id = fmr.subject_id
         WHERE ${whereFmr}
         GROUP BY fmr.subject_id, sub.name`,
        paramsFmr
      );

      // 2) Legacy path: feedback_forms + assignments + feedback_responses
      const paramsLegacy = [req.user.orgId || 0];
      let whereLegacy = 'f.organization_id = ?';
      if (departmentId) { whereLegacy += ' AND a.department_id = ?'; paramsLegacy.push(Number(departmentId)); }
      const legacyRows = await query(
        `SELECT a.subject_id AS subjectId, COALESCE(sub.name, CONCAT('Subject ', a.subject_id)) AS subjectName, COUNT(fr.id) AS responseCount
         FROM feedback_forms f
         JOIN feedback_form_assignments a ON a.form_id = f.id
         LEFT JOIN subjects sub ON sub.id = a.subject_id
         LEFT JOIN feedback_responses fr ON fr.form_id = f.id
         WHERE ${whereLegacy}
         GROUP BY a.subject_id, sub.name`,
        paramsLegacy
      );

      // Merge counts by subjectId
      const byId = new Map();
      for (const r of [...fmrRows, ...legacyRows]) {
        if (!r.subjectId) continue;
        const key = String(r.subjectId);
        const prev = byId.get(key) || { id: r.subjectId, name: r.subjectName || `Subject ${r.subjectId}`, responseCount: 0 };
        prev.responseCount += Number(r.responseCount) || 0;
        // Prefer a non-null, non-empty name
        if (r.subjectName) prev.name = r.subjectName;
        byId.set(key, prev);
      }
      const data = Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
      res.json(data);
    } catch (e) {
      console.error('Error loading org subject response stats:', e);
      res.status(500).json({ error: 'Failed to load subject response stats' });
    }
  });

  // Organization-level stats: total feedback responses by staff (legacy forms path), optional departmentId filter
  router.get('/org/stats/staff-responses', requireAuth(['ORG']), async (req, res) => {
    try {
      const { departmentId } = req.query;

      // 1) New path: feedback_master_responses grouped by staff_id
      const paramsFmr = [req.user.orgId || 0];
      let whereFmr = 'fmr.organization_id = ? AND fmr.staff_id IS NOT NULL';
      if (departmentId) { whereFmr += ' AND fmr.department_id = ?'; paramsFmr.push(Number(departmentId)); }
      const fmrRows = await query(
        `SELECT fmr.staff_id AS staffId, COALESCE(st.name, CONCAT('Staff ', fmr.staff_id)) AS staffName, COUNT(fmr.id) AS responseCount
         FROM feedback_master_responses fmr
         LEFT JOIN staff st ON st.id = fmr.staff_id
         WHERE ${whereFmr}
         GROUP BY fmr.staff_id, st.name`,
        paramsFmr
      );

      // 2) Legacy path: feedback_forms + assignments + feedback_responses
      const paramsLegacy = [req.user.orgId || 0];
      let whereLegacy = 'f.organization_id = ?';
      if (departmentId) { whereLegacy += ' AND a.department_id = ?'; paramsLegacy.push(Number(departmentId)); }
      const legacyRows = await query(
        `SELECT a.staff_id AS staffId, COALESCE(st.name, CONCAT('Staff ', a.staff_id)) AS staffName, COUNT(fr.id) AS responseCount
         FROM feedback_forms f
         JOIN feedback_form_assignments a ON a.form_id = f.id
         LEFT JOIN staff st ON st.id = a.staff_id
         LEFT JOIN feedback_responses fr ON fr.form_id = f.id
         WHERE ${whereLegacy}
         GROUP BY a.staff_id, st.name`,
        paramsLegacy
      );

      // Merge counts by staffId
      const byId = new Map();
      for (const r of [...fmrRows, ...legacyRows]) {
        if (!r.staffId) continue;
        const key = String(r.staffId);
        const prev = byId.get(key) || { id: r.staffId, name: r.staffName || `Staff ${r.staffId}`, responseCount: 0 };
        prev.responseCount += Number(r.responseCount) || 0;
        if (r.staffName) prev.name = r.staffName;
        byId.set(key, prev);
      }
      const data = Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
      res.json(data);
    } catch (e) {
      console.error('Error loading org staff response stats:', e);
      res.status(500).json({ error: 'Failed to load staff response stats' });
    }
  });

  // Organization-level stats: total feedback responses by department (feedback_master_responses)
  router.get('/org/stats/department-responses', requireAuth(['ORG']), async (req, res) => {
    try {
      const rows = await query(
        `SELECT d.id AS departmentId, d.name AS departmentName, COUNT(fmr.id) AS responseCount
         FROM departments d
         LEFT JOIN feedback_master_responses fmr
           ON fmr.department_id = d.id AND fmr.organization_id = d.organization_id
         WHERE d.organization_id = ?
         GROUP BY d.id, d.name
         ORDER BY d.name ASC`,
        [req.user.orgId || 0]
      );
      const data = rows.map(r => ({ id: r.departmentId, name: r.departmentName, responseCount: Number(r.responseCount) || 0 }));
      res.json(data);
    } catch (e) {
      console.error('Error loading org feedback response stats:', e);
      res.status(500).json({ error: 'Failed to load organization feedback stats' });
    }
  });

  // List forms
  router.get('/forms', requireAuth(['DEPT']), async (req, res) => {
    const { page, limit, offset } = toPageParams(req.query);
    const rows = await query(
      `SELECT id, title, description, is_active AS isActive, access_code AS accessCode, created_at AS createdAt, updated_at AS updatedAt
       FROM feedback_forms WHERE organization_id = ? AND department_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [req.user.orgId || 0, req.user.departmentId || 0, limit, offset]
    );
    const count = await query(`SELECT COUNT(*) AS total FROM feedback_forms WHERE organization_id = ? AND department_id = ?`, [req.user.orgId || 0, req.user.departmentId || 0]);
    res.json({ items: rows, total: count[0]?.total || 0, page, limit });
  });

  // Meta: dynamic lists based on selected semester
  // Query params (all optional except department context from auth):
  // - semester: string
  // - staffId: number (to narrow subjects taught by this staff in the semester)
  // - subjectId: number (to narrow staff who teach this subject in the semester)
  // Returns: { semesters, staff, subjects }
  router.get('/meta', requireAuth(['DEPT']), async (req, res) => {
    const { semester, staffId, subjectId } = req.query;
    const subjDeptCol = await getSubjectsDeptColumn();
    // Distinct semesters from subjects in this department
    const semRows = await query(
      `SELECT DISTINCT semester FROM subjects WHERE ${subjDeptCol} = ? ORDER BY 
       CASE WHEN semester REGEXP '^[0-9]+$' THEN CAST(semester AS UNSIGNED) ELSE 999 END, semester`,
      [req.user.departmentId || 0]
    );

    // Subjects for selected semester (or empty if not provided)
    let subjects = [];
    if (semester) {
      if (staffId) {
        // If staffId provided, prefer subjects taught by this staff in the selected semester
        try {
          subjects = await query(
            `SELECT sub.id, sub.name, sub.code, sub.semester
             FROM subjects sub
             JOIN staff_subjects ss ON ss.subject_id = sub.id
             WHERE sub.${subjDeptCol} = ? AND sub.semester = ? AND ss.staff_id = ?
             ORDER BY sub.name`,
            [req.user.departmentId || 0, String(semester), Number(staffId)]
          );
        } catch (e) {
          // Fallback if mapping table missing
          subjects = await query(
            `SELECT id, name, code, semester FROM subjects WHERE ${subjDeptCol} = ? AND semester = ? ORDER BY name`,
            [req.user.departmentId || 0, String(semester)]
          );
        }
      } else {
        // No staff selected yet: show all subjects for semester
        subjects = await query(
          `SELECT id, name, code, semester FROM subjects WHERE ${subjDeptCol} = ? AND semester = ? ORDER BY name`,
          [req.user.departmentId || 0, String(semester)]
        );
      }
    }

    // Staff list logic:
    // Priority narrowing: if subjectId present, return only staff who teach that subject (and optionally within semester).
    // Else, try to filter by semester via staff_subjects mapping; 
    // If mapping table doesn't exist or errors, fallback to department staff
    let staff = [];
    try {
      if (subjectId) {
        // Staff for a specific subject (and optionally semester)
        if (semester) {
          staff = await query(`
            SELECT DISTINCT s.id, COALESCE(s.name, CONCAT('Staff ', s.id)) AS name
            FROM staff s
            JOIN staff_subjects ss ON ss.staff_id = s.id
            JOIN subjects sub ON sub.id = ss.subject_id
            WHERE s.department_id = ? AND ss.subject_id = ? AND sub.semester = ?
            ORDER BY name
          `, [req.user.departmentId || 0, Number(subjectId), String(semester)]);
        } else {
          staff = await query(`
            SELECT DISTINCT s.id, COALESCE(s.name, CONCAT('Staff ', s.id)) AS name
            FROM staff s
            JOIN staff_subjects ss ON ss.staff_id = s.id
            WHERE s.department_id = ? AND ss.subject_id = ?
            ORDER BY name
          `, [req.user.departmentId || 0, Number(subjectId)]);
        }
      } else if (semester) {
        staff = await query(`
          SELECT DISTINCT s.id, COALESCE(s.name, CONCAT('Staff ', s.id)) AS name
          FROM staff s
          JOIN staff_subjects ss ON ss.staff_id = s.id
          JOIN subjects sub ON sub.id = ss.subject_id
          WHERE s.department_id = ? AND sub.semester = ?
          ORDER BY name
        `, [req.user.departmentId || 0, String(semester)]);
      } else {
        // No filters yet: all department staff
        staff = await query(
          `SELECT id, COALESCE(name, CONCAT('Staff ', id)) AS name FROM staff WHERE department_id = ? ORDER BY name`,
          [req.user.departmentId || 0]
        );
      }
    } catch (e) {
      // Fallback: try to infer via staff.subjects column if present (JSON or CSV of subject IDs)
      try {
        const depId = req.user.departmentId || 0;
        // Candidate subjects for current semester (if provided)
        const subRows = semester
          ? await query(`SELECT id FROM subjects WHERE ${subjDeptCol} = ? AND semester = ?`, [depId, String(semester)])
          : await query(`SELECT id FROM subjects WHERE ${subjDeptCol} = ?`, [depId]);
        const allowedSubIds = new Set(subRows.map(r => String(r.id)));
        const srows = await query(`SELECT id, COALESCE(name, CONCAT('Staff ', id)) AS name, subjects FROM staff WHERE department_id = ? ORDER BY name`, [depId]);
        const filtered = srows.filter(r => {
          const raw = r.subjects;
          if (raw == null) return false;
          try {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (Array.isArray(parsed)) {
              return parsed.some(x => allowedSubIds.has(String(x?.id ?? x?.subjectId ?? x)));
            }
          } catch {
            // CSV case
            if (typeof raw === 'string' && raw.trim()) {
              const parts = raw.split(',').map(t => t.trim()).filter(Boolean);
              return parts.some(p => allowedSubIds.has(p));
            }
          }
          return false;
        }).map(r => ({ id: r.id, name: r.name }));
        staff = filtered.length ? filtered : srows.map(r => ({ id: r.id, name: r.name }));
      } catch (e2) {
        // Final fallback: all staff in department
        staff = await query(
          `SELECT id, COALESCE(name, CONCAT('Staff ', id)) AS name FROM staff WHERE department_id = ? ORDER BY name`,
          [req.user.departmentId || 0]
        );
      }
    }

    res.json({
      semesters: semRows.map(r => r.semester).filter(Boolean),
      staff,
      subjects,
    });
  });

  // Get single form with questions
  router.get('/forms/:id', requireAuth(['DEPT']), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const forms = await query(`SELECT id, title, description, is_active AS isActive, access_code AS accessCode FROM feedback_forms WHERE id = ? AND organization_id = ? AND department_id = ?`, [id, req.user.orgId || 0, req.user.departmentId || 0]);
    if (!forms.length) return res.status(404).json({ message: 'Form not found' });
    const qs = await query(`SELECT id, question_order AS questionOrder, type, text, options, required, points FROM feedback_form_questions WHERE form_id = ? ORDER BY question_order ASC`, [id]);
    const questions = qs.map(q => ({ ...q, options: (()=>{ try{ const p = q.options? JSON.parse(q.options): null; return Array.isArray(p)? p: []; }catch{ return []; } })() }));
    const assigns = await query(`SELECT id, semester, staff_id AS staffId, subject_id AS subjectId FROM feedback_form_assignments WHERE form_id = ?`, [id]);
    res.json({ ...forms[0], questions, assignments: assigns });
  });

  // Create form + questions
  router.post('/forms', requireAuth(['DEPT']), async (req, res) => {
    const parsed = formSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });
    const { title, description, isActive, semester, questions, assignments } = parsed.data;
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    const fr = await query(
      `INSERT INTO feedback_forms (organization_id, department_id, title, description, is_active, access_code) VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.orgId || 0, req.user.departmentId || 0, title, description || null, isActive ? 1 : 0, code]
    );
    const formId = fr.insertId;
    if (Array.isArray(questions) && questions.length) {
      let order = 1;
      for (const q of questions) {
        await query(
          `INSERT INTO feedback_form_questions (form_id, question_order, type, text, options, required, points) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [formId, order++, q.type, q.text, q.options ? JSON.stringify(q.options) : null, q.required ? 1 : 0, q.points ?? 1]
        );
      }
    }
    // Assignments
    for (const a of assignments) {
      await query(`INSERT INTO feedback_form_assignments (form_id, organization_id, department_id, semester, staff_id, subject_id) VALUES (?, ?, ?, ?, ?, ?)`, [formId, req.user.orgId || 0, req.user.departmentId || 0, semester, a.staffId, a.subjectId]);
    }
    const created = await query(`SELECT id, title, description, is_active AS isActive, access_code AS accessCode FROM feedback_forms WHERE id = ?`, [formId]);
    res.status(201).json(created[0]);
  });

  // Update form + replace questions
  router.put('/forms/:id', requireAuth(['DEPT']), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const parsed = formSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });
    const { title, description, isActive, semester, questions, assignments } = parsed.data;

    const exists = await query(`SELECT id FROM feedback_forms WHERE id = ? AND organization_id = ? AND department_id = ?`, [id, req.user.orgId || 0, req.user.departmentId || 0]);
    if (!exists.length) return res.status(404).json({ message: 'Form not found' });

    await query(`UPDATE feedback_forms SET title = ?, description = ?, is_active = ?, updated_at = NOW() WHERE id = ?`, [title, description || null, isActive ? 1 : 0, id]);
    await query(`DELETE FROM feedback_form_questions WHERE form_id = ?`, [id]);
    let order = 1;
    for (const q of questions) {
      await query(`INSERT INTO feedback_form_questions (form_id, question_order, type, text, options, required, points) VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, order++, q.type, q.text, q.options ? JSON.stringify(q.options) : null, q.required ? 1 : 0, q.points ?? 1]);
    }
    await query(`DELETE FROM feedback_form_assignments WHERE form_id = ?`, [id]);
    for (const a of assignments) {
      await query(`INSERT INTO feedback_form_assignments (form_id, organization_id, department_id, semester, staff_id, subject_id) VALUES (?, ?, ?, ?, ?, ?)`, [id, req.user.orgId || 0, req.user.departmentId || 0, semester, a.staffId, a.subjectId]);
    }

    res.json({ ok: true });
  });

  // Delete form
  router.delete('/forms/:id', requireAuth(['DEPT']), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = await query(`DELETE FROM feedback_forms WHERE id = ? AND organization_id = ? AND department_id = ?`, [id, req.user.orgId || 0, req.user.departmentId || 0]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Form not found' });
    res.json({ ok: true });
  });

  // Publish/Unpublish toggles
  router.post('/forms/:id/publish', requireAuth(['DEPT']), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { active } = req.body || {};
    const forms = await query(`SELECT id, access_code AS accessCode FROM feedback_forms WHERE id = ? AND organization_id = ? AND department_id = ?`, [id, req.user.orgId || 0, req.user.departmentId || 0]);
    if (!forms.length) return res.status(404).json({ message: 'Form not found' });
    const accessCode = forms[0].accessCode || Math.random().toString(36).slice(2, 10).toUpperCase();
    await query(`UPDATE feedback_forms SET is_active = ?, access_code = ? WHERE id = ?`, [active ? 1 : 0, accessCode, id]);
    const base = process.env.FRONTEND_ORIGIN || `http://localhost:${process.env.PORT || 4000}`;
    const url = `${base.replace(/\/$/, '')}/api/feedback/public/form/${accessCode}`;
    await query(`INSERT INTO feedback_form_links (form_id, url) VALUES (?, ?)`, [id, url]);
    res.json({ ok: true, accessCode, url });
  });

  // List responses summary
  router.get('/forms/:id/responses', requireAuth(['DEPT']), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const form = await query(`SELECT id FROM feedback_forms WHERE id = ? AND organization_id = ? AND department_id = ?`, [id, req.user.orgId || 0, req.user.departmentId || 0]);
    if (!form.length) return res.status(404).json({ message: 'Form not found' });

    const responses = await query(`SELECT id, submitted_at AS submittedAt, respondent_id AS respondentId, respondent_type AS respondentType FROM feedback_responses WHERE form_id = ? ORDER BY id DESC`, [id]);
    res.json({ items: responses });
  });

  // Public: fetch form by access code (no auth)
  router.get('/public/form/:accessCode', async (req, res) => {
    const { accessCode } = req.params;
    const fs = await query(`SELECT id, title, description FROM feedback_forms WHERE access_code = ? AND is_active = 1 LIMIT 1`, [accessCode]);
    if (!fs.length) return res.status(404).json({ message: 'Form not found or inactive' });
    const formId = fs[0].id;
    const qs = await query(`SELECT id, question_order AS questionOrder, type, text, options, required FROM feedback_form_questions WHERE form_id = ? ORDER BY question_order ASC`, [formId]);
    const questions = qs.map(q => ({ ...q, options: (()=>{ try{ const p = q.options? JSON.parse(q.options): null; return Array.isArray(p)? p: []; }catch{ return []; } })() }));
    res.json({ id: formId, title: fs[0].title, description: fs[0].description, questions });
  });

  // Public: submit responses (no auth)
  router.post('/public/submit/:accessCode', async (req, res) => {
    const { accessCode } = req.params;
    const fs = await query(`SELECT id FROM feedback_forms WHERE access_code = ? AND is_active = 1 LIMIT 1`, [accessCode]);
    if (!fs.length) return res.status(404).json({ message: 'Form not found or inactive' });
    const formId = fs[0].id;

    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    // answers: [{ formQuestionId: number, answer: string | string[] | number | boolean }]
    const rr = await query(`INSERT INTO feedback_responses (form_id, respondent_id, respondent_type) VALUES (?, ?, ?)`, [formId, null, 'Anonymous']);
    const responseId = rr.insertId;

    for (const a of answers) {
      await query(`INSERT INTO feedback_answers (response_id, form_question_id, answer) VALUES (?, ?, ?)`, [responseId, Number(a.formQuestionId), a.answer !== undefined ? JSON.stringify(a.answer) : null]);
    }

    res.status(201).json({ ok: true, responseId });
  });

  // List responses for a form by slug/accessCode (supports department UI)
  router.get('/forms/:slug/responses', requireAuth(['DEPT','STAFF']), async (req, res) => {
    try {
      const { slug } = req.params;
      const { page = '1', limit = '10', subjectId } = req.query;
      const p = Math.max(1, parseInt(String(page), 10) || 1);
      const l = Math.min(1000, Math.max(1, parseInt(String(limit), 10) || 10));
      const offset = (p - 1) * l;

      // Resolve form by slug: accept numeric id, access_code, or share_url containing the slug
      // First resolve without org/dept constraint, then authorize against current user
      let formRows = [];
      if (/^\d+$/.test(String(slug))) {
        formRows = await query(`SELECT id, organization_id AS orgId, department_id AS depId FROM feedback_master WHERE id = ? LIMIT 1`, [Number(slug)]);
      }
      if (!formRows.length) {
        formRows = await query(`SELECT id, organization_id AS orgId, department_id AS depId FROM feedback_master WHERE (access_code = ? OR (share_url IS NOT NULL AND share_url LIKE ?)) LIMIT 1`, [String(slug), `%${String(slug)}%`]);
      }
      if (!formRows.length) return res.status(404).json({ message: 'Form not found' });
      const masterId = formRows[0].id;
      // Authorization: ensure the form belongs to the user's org/department if present on the token
      const userOrg = req.user.orgId;
      const userDep = req.user.departmentId;
      if ((userOrg != null && userOrg !== formRows[0].orgId) || (userDep != null && userDep !== formRows[0].depId)) {
        return res.status(403).json({ message: 'Not authorized for this form' });
      }

      // Optional filters
      const filters = ['master_id = ?'];
      const fparams = [masterId];
      if (subjectId) { filters.push('subject_id = ?'); fparams.push(Number(subjectId)); }

      const countRows = await query(`SELECT COUNT(*) AS total FROM feedback_master_responses WHERE ${filters.join(' AND ')}`, fparams);
      const total = countRows[0]?.total || 0;

      const rows = await query(
        `SELECT id, submitted_at AS submittedAt, name, email, phone, answers
         FROM feedback_master_responses
         WHERE ${filters.join(' AND ')}
         ORDER BY submitted_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        [...fparams, l, offset]
      );

      const items = rows.map(r => {
        let ans = {};
        try { ans = r.answers ? JSON.parse(r.answers) : {}; } catch { ans = {}; }
        // Merge identity fields into answers so UI can show them dynamically
        if (r.name !== null && r.name !== undefined) ans.name = r.name;
        if (r.email !== null && r.email !== undefined) ans.email = r.email;
        if (r.phone !== null && r.phone !== undefined) ans.phone = r.phone;
        return {
          id: r.id,
          submittedAt: new Date(r.submittedAt).toISOString().replace('T', ' ').slice(0, 19),
          answers: ans,
        };
      });

      return res.json({ items, total, page: p, limit: l, totalPages: Math.ceil(total / l) });
    } catch (e) {
      return res.status(500).json({ message: 'Failed to load responses' });
    }
  });

  // CSV export of responses
  router.get('/forms/:slug/responses.csv', requireAuth(['DEPT','STAFF']), async (req, res) => {
    try {
      const { slug } = req.params;
      const { subjectId } = req.query;
      // Resolve form: accept numeric id, access_code, or share_url containing the slug (no org filter), then authorize
      let formRows = [];
      if (/^\d+$/.test(String(slug))) {
        formRows = await query(`SELECT id, organization_id AS orgId, department_id AS depId FROM feedback_master WHERE id = ? LIMIT 1`, [Number(slug)]);
      }
      if (!formRows.length) {
        formRows = await query(`SELECT id, organization_id AS orgId, department_id AS depId FROM feedback_master WHERE (access_code = ? OR (share_url IS NOT NULL AND share_url LIKE ?)) LIMIT 1`, [String(slug), `%${String(slug)}%`]);
      }
      if (!formRows.length) return res.status(404).json({ message: 'Form not found' });
      const masterId = formRows[0].id;
      const userOrg = req.user.orgId;
      const userDep = req.user.departmentId;
      if ((userOrg != null && userOrg !== formRows[0].orgId) || (userDep != null && userDep !== formRows[0].depId)) {
        return res.status(403).json({ message: 'Not authorized for this form' });
      }

      // Load all responses
      const filters = ['master_id = ?'];
      const fparams = [masterId];
      if (subjectId) { filters.push('subject_id = ?'); fparams.push(Number(subjectId)); }
      const rows = await query(
        `SELECT id, submitted_at AS submittedAt, name, email, phone, answers
         FROM feedback_master_responses
         WHERE ${filters.join(' AND ')}
         ORDER BY submitted_at DESC, id DESC`,
        fparams
      );

      // Build unified header keys
      const keys = new Set(['id','submittedAt','name','email','phone']);
      const parsed = rows.map(r => {
        let ans = {};
        try { ans = r.answers ? JSON.parse(r.answers) : {}; } catch { ans = {}; }
        Object.keys(ans).forEach(k => keys.add(String(k)));
        return { id: r.id, submittedAt: new Date(r.submittedAt).toISOString().replace('T',' ').slice(0,19), name: r.name || '', email: r.email || '', phone: r.phone || '', answers: ans };
      });
      const header = Array.from(keys);
      const csvRows = [header.join(',')];
      parsed.forEach(row => {
        const line = header.map(k => {
          const v = (k in row) ? (row)[k] : row.answers?.[k];
          const s = v === undefined || v === null ? '' : (Array.isArray(v) ? v.join('; ') : String(v));
          // escape CSV
          const esc = '"' + s.replace(/"/g, '""') + '"';
          return esc;
        }).join(',');
        csvRows.push(line);
      });
      const csv = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="responses.csv"');
      return res.send(csv);
    } catch (e) {
      return res.status(500).json({ message: 'Failed to export CSV' });
    }
  });

  // SIMPLE (single-table) endpoints
  const simpleSchema = z.object({
    title: z.string().min(1),
    semester: z.string().min(1),
    description: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    audience: z.string().optional().nullable(),
    staffIds: z.array(z.number().int().positive()).min(1),
    subjectIds: z.array(z.number().int().positive()).min(1),
    // either array of question ids or full objects
    questions: z.array(z.union([
      z.number().int().positive(),
      z.object({ id: z.number().int().positive(), text: z.string(), type: z.string(), options: z.array(z.string()).optional() })
    ])).min(1),
    isActive: z.boolean().optional(),
  });

  router.get('/simple/forms', requireAuth(['DEPT']), async (req, res) => {
    const rows = await query(
      `SELECT id, title, semester, description, start_date AS startDate, end_date AS endDate, audience,
              staff_ids AS staffIds, subject_ids AS subjectIds, questions, is_active AS isActive,
              access_code AS accessCode, share_url AS shareUrl, created_at AS createdAt, updated_at AS updatedAt
       FROM feedback_master WHERE organization_id = ? AND department_id = ? ORDER BY id DESC`,
      [req.user.orgId || 0, req.user.departmentId || 0]
    );
    const items = rows.map(r => ({
      ...r,
      staffIds: (() => { try { return r.staffIds ? JSON.parse(r.staffIds) : []; } catch { return []; } })(),
      subjectIds: (() => { try { return r.subjectIds ? JSON.parse(r.subjectIds) : []; } catch { return []; } })(),
      questions: (() => { try { return r.questions ? JSON.parse(r.questions) : []; } catch { return []; } })(),
    }));
    res.json({ items });
  });

  router.post('/simple/forms', requireAuth(['DEPT']), async (req, res) => {
    const parsed = simpleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });
    const data = parsed.data;
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    const r = await query(
      `INSERT INTO feedback_master (organization_id, department_id, title, semester, description, start_date, end_date, audience, staff_ids, subject_ids, questions, is_active, access_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.orgId || 0,
        req.user.departmentId || 0,
        data.title,
        data.semester,
        data.description || null,
        data.startDate || null,
        data.endDate || null,
        data.audience || null,
        JSON.stringify(data.staffIds),
        JSON.stringify(data.subjectIds),
        JSON.stringify(data.questions),
        data.isActive ? 1 : 0,
        code,
      ]
    );
    const row = await query(`SELECT id, title, semester, description, start_date AS startDate, end_date AS EndDate, audience, is_active AS isActive, access_code AS accessCode FROM feedback_master WHERE id = ?`, [r.insertId]);
    // Resolve first staff/subject names for message context
    let staffName = '';
    let subjectName = '';
    try {
      const firstStaffId = Array.isArray(data.staffIds) && data.staffIds.length ? Number(data.staffIds[0]) : null;
      if (firstStaffId) {
        const s = await query(`SELECT COALESCE(name, CONCAT('Staff ', id)) AS name FROM staff WHERE id = ? LIMIT 1`, [firstStaffId]);
        staffName = s?.[0]?.name || '';
      }
    } catch {}
    try {
      const firstSubjectId = Array.isArray(data.subjectIds) && data.subjectIds.length ? Number(data.subjectIds[0]) : null;
      if (firstSubjectId) {
        const su = await query(`SELECT COALESCE(name, CONCAT('Subject ', id)) AS name FROM subjects WHERE id = ? LIMIT 1`, [firstSubjectId]);
        subjectName = su?.[0]?.name || '';
      }
    } catch {}
    // Emit notification: new form created (department scope)
    await emitNotificationSafe({
      type: 'new_form',
      title: `New form: ${data.title}`,
      message: `Semester ${data.semester}${subjectName ? ' • Subject: ' + subjectName : ''}${staffName ? ' • Staff: ' + staffName : ''}`,
      link: '/department-admin/feedback/generate',
      roleScope: 'DepartmentAdmin',
      orgId: req.user.orgId || null,
      deptId: req.user.departmentId || null,
    });
    res.status(201).json(row[0]);
  });

  router.put('/simple/forms/:id', requireAuth(['DEPT']), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const parsed = simpleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });
    const data = parsed.data;
    const ex = await query(`SELECT id FROM feedback_master WHERE id = ? AND organization_id = ? AND department_id = ?`, [id, req.user.orgId || 0, req.user.departmentId || 0]);
    if (!ex.length) return res.status(404).json({ message: 'Form not found' });
    await query(
      `UPDATE feedback_master SET title = ?, semester = ?, description = ?, start_date = ?, end_date = ?, audience = ?, staff_ids = ?, subject_ids = ?, questions = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
      [data.title, data.semester, data.description || null, data.startDate || null, data.endDate || null, data.audience || null, JSON.stringify(data.staffIds), JSON.stringify(data.subjectIds), JSON.stringify(data.questions), data.isActive ? 1 : 0, id]
    );
    res.json({ ok: true });
  });

  router.post('/simple/forms/:id/publish', requireAuth(['DEPT']), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const fm = await query(`SELECT id, access_code AS accessCode FROM feedback_master WHERE id = ? AND organization_id = ? AND department_id = ?`, [id, req.user.orgId || 0, req.user.departmentId || 0]);
    if (!fm.length) return res.status(404).json({ message: 'Form not found' });
    const accessCode = fm[0].accessCode || Math.random().toString(36).slice(2, 10).toUpperCase();
    // Always prefer frontend origin so the link opens the React page, not the JSON endpoint
    const base = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    // Point share URL to the SIMPLE public route in the SPA
    const url = `${base.replace(/\/$/, '')}/feedback/public/simple/${accessCode}`;
    await query(`UPDATE feedback_master SET is_active = 1, access_code = ?, share_url = ? WHERE id = ?`, [accessCode, url, id]);
    res.json({ ok: true, accessCode, url });
  });

  // Public SIMPLE: fetch a feedback_master form by access code (no auth)
  router.get('/public/simple/:accessCode', async (req, res) => {
    const { accessCode } = req.params;
    const rows = await query(
      `SELECT id, title, description, start_date AS startDate, end_date AS endDate, questions, is_active AS isActive, staff_ids AS staffIds, subject_ids AS subjectIds, semester, audience
       FROM feedback_master WHERE access_code = ? LIMIT 1`,
      [accessCode]
    );
    if (!rows.length) return res.status(404).json({ message: 'Form not found' });
    if (!rows[0].isActive) return res.status(404).json({ message: 'Form not found or inactive' });
    let questions = [];
    try { questions = rows[0].questions ? JSON.parse(rows[0].questions) : []; } catch { questions = []; }
    // Normalize questions: expand from questions table when only IDs are provided
    let norm = [];
    if (Array.isArray(questions) && questions.length) {
      const all = questions;
      // Collect ids that need expansion
      const ids = [];
      for (const q of all) {
        if (typeof q === 'number' || (typeof q === 'string' && q.trim() && !isNaN(Number(q)))) {
          ids.push(Number(q));
        } else if (q && typeof q === 'object' && (q.id != null) && (!q.text || !q.options)) {
          const n = Number(q.id);
          if (!isNaN(n)) ids.push(n);
        }
      }
      let dbById = {};
      if (ids.length) {
        try {
          const placeholders = ids.map(() => '?').join(',');
          const qrows = await query(`SELECT id, type, text, options FROM questions WHERE id IN (${placeholders})`, ids);
          dbById = Object.fromEntries(qrows.map(r => [String(r.id), r]));
        } catch {}
      }
      const mapType = (t) => {
        const s = String(t || '').toUpperCase().trim();
        if (s.startsWith('MCQ_S')) return 'multiple-choice'; // MCQ_SINGLE
        if (s === 'TRUE_FALSE' || s === 'TRUEFALSE' || s === 'TF') return 'multiple-choice';
        if (s.startsWith('MCQ_M')) return 'multiple-choice'; // MCQ_MULTI and common truncations
        if (s === 'NUMERIC' || s === 'RATING' || s.startsWith('NUM')) return 'rating';
        return 'text';
      };
      const isMulti = (t) => {
        const s = String(t || '').toUpperCase().trim();
        return s.startsWith('MCQ_M');
      };
      const isLongText = (t) => {
        const s = String(t || '').toUpperCase().trim();
        return s === 'LONG';
      };
      const mapOptions = (rawType, opts) => {
        // opts may be JSON from DB (array of {key,value} or string[])
        try {
          const parsed = typeof opts === 'string' ? JSON.parse(opts) : opts;
          if (Array.isArray(parsed)) {
            if (parsed.length && typeof parsed[0] === 'object' && parsed[0] && 'value' in parsed[0]) {
              return parsed.map(o => String(o.value));
            }
            if (typeof parsed[0] === 'string') return parsed.map(String);
          }
        } catch {}
        const t = String(rawType).toUpperCase();
        if (t === 'TRUE_FALSE') return ['True','False'];
        if (t === 'NUMERIC') return ['1','2','3','4','5'];
        // If opts is a non-JSON string, split by common delimiters
        if (typeof opts === 'string' && opts.trim()) {
          const parts = opts.split(/\r?\n|\||,|;|\t/).map(s => s.trim()).filter(Boolean);
          if (parts.length) return parts;
        }
        return [];
      };
      norm = all.map((q, idx) => {
        if (typeof q === 'number' || (typeof q === 'string' && q.trim() && !isNaN(Number(q)))) {
          const found = dbById[String(Number(q))];
          if (found) {
            const uiAsSelect = (!isMulti(found.type) && mapType(found.type) === 'multiple-choice' && mapOptions(found.type, found.options).length > 6);
            return {
              id: found.id,
              text: found.text || `Question ${idx + 1}`,
              type: mapType(found.type),
              options: mapOptions(found.type, found.options),
              multiSelect: isMulti(found.type),
              longText: isLongText(found.type),
              asSelect: uiAsSelect,
              required: false,
            };
          }
          return { id: Number(q) || idx + 1, text: `Question ${idx + 1}` , type: 'text', options: [] };
        } else if (q && typeof q === 'object') {
          // If object is already normalized, return as-is; else try to enrich from DB
          const idNum = q.id != null ? Number(q.id) : NaN;
          let text = q.text || q.question || q.label || `Question ${idx + 1}`;
          let type = q.type || 'text';
          let options = Array.isArray(q.options) ? q.options : [];
          if ((!q.text || !q.options) && !isNaN(idNum)) {
            const found = dbById[String(idNum)];
            if (found) {
              text = text || found.text;
              type = type || mapType(found.type);
              if (!options || options.length === 0) options = mapOptions(found.type, found.options);
            }
          }
          const baseType = mapType(type);
          const uiAsSelect = (!isMulti(type) && baseType === 'multiple-choice' && options.length > 6);
          return { id: q.id ?? idx + 1, text, type: baseType, options, multiSelect: isMulti(type), longText: isLongText(type), asSelect: uiAsSelect };
        }
        return { id: idx + 1, text: `Question ${idx + 1}`, type: 'text', options: [] };
      });
    } else {
      norm = [];
    }

    // Enrich staff and subject info for display
    let staffIds = [];
    let subjectIds = [];
    try { staffIds = rows[0].staffIds ? JSON.parse(rows[0].staffIds) : []; } catch { staffIds = []; }
    try { subjectIds = rows[0].subjectIds ? JSON.parse(rows[0].subjectIds) : []; } catch { subjectIds = []; }
    staffIds = Array.isArray(staffIds) ? staffIds.map(x => Number(x)).filter(n => Number.isFinite(n)) : [];
    subjectIds = Array.isArray(subjectIds) ? subjectIds.map(x => Number(x)).filter(n => Number.isFinite(n)) : [];

    let staff = [];
    let subjects = [];
    try {
      if (staffIds.length) {
        const placeholders = staffIds.map(() => '?').join(',');
        const srows = await query(`SELECT id, COALESCE(name, CONCAT('Staff ', id)) AS name, department_id AS departmentId FROM staff WHERE id IN (${placeholders})`, staffIds);
        staff = srows;
      }
    } catch {}
    try {
      if (subjectIds.length) {
        const placeholders = subjectIds.map(() => '?').join(',');
        const subrows = await query(`SELECT id, name, code, semester, department_id AS departmentId FROM subjects WHERE id IN (${placeholders})`, subjectIds);
        subjects = subrows;
      }
    } catch {}

    res.json({
      id: rows[0].id,
      title: rows[0].title,
      description: rows[0].description,
      startDate: rows[0].startDate,
      endDate: rows[0].endDate,
      semester: rows[0].semester,
      audience: rows[0].audience,
      staff,
      subjects,
      questions: norm,
    });
  });

  // Public SIMPLE: submit responses (no auth) — store all answers in one table (JSON)
  router.post('/public/simple/:accessCode/submit', async (req, res) => {
    const { accessCode } = req.params;
    const rows = await query(`SELECT id, is_active AS isActive, organization_id AS organizationId, department_id AS departmentId, subject_ids AS subjectIds, staff_ids AS staffIds FROM feedback_master WHERE access_code = ? LIMIT 1`, [accessCode]);
    if (!rows.length) return res.status(404).json({ message: 'Form not found' });
    const masterId = rows[0].id;
    if (!rows[0].isActive) return res.status(404).json({ message: 'Form not found or inactive' });

    const { name, email, phone, answers } = req.body || {};
    // Enforce single response per email per form (if email provided)
    if (email && String(email).trim()) {
      const dup = await query(`SELECT id FROM feedback_master_responses WHERE master_id = ? AND email = ? LIMIT 1`, [masterId, String(email).trim()]);
      if (dup.length) {
        return res.status(409).json({ message: 'A response with this email already exists for this form.' });
      }
    }
    // Normalize answers to an object of questionId => answer
    let normalized = {};
    if (answers && typeof answers === 'object') {
      if (Array.isArray(answers)) {
        for (const item of answers) {
          if (!item) continue;
          const key = item.questionKey != null ? String(item.questionKey) : (item.id != null ? String(item.id) : null);
          if (!key) continue;
          normalized[key] = item.answer !== undefined ? item.answer : null;
        }
      } else {
        normalized = answers;
      }
    }

    // Derive subject_id and staff_id from feedback_master (use first id if arrays)
    let subjectId = null;
    let staffId = null;
    try {
      const sids = rows[0].subjectIds ? JSON.parse(rows[0].subjectIds) : [];
      if (Array.isArray(sids) && sids.length) subjectId = Number(sids[0]) || null;
    } catch {}
    try {
      const tids = rows[0].staffIds ? JSON.parse(rows[0].staffIds) : [];
      if (Array.isArray(tids) && tids.length) staffId = Number(tids[0]) || null;
    } catch {}

    const rr = await query(
      `INSERT INTO feedback_master_responses (master_id, organization_id, department_id, subject_id, staff_id, access_code, name, email, phone, answers)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        masterId,
        rows[0].organizationId || null,
        rows[0].departmentId || null,
        subjectId,
        staffId,
        accessCode || null,
        name || null,
        email || null,
        phone || null,
        Object.keys(normalized).length ? JSON.stringify(normalized) : null,
      ]
    );
    const responseId = rr.insertId;
    // Resolve friendly names for notification
    let formTitle = '';
    let subjectName = '';
    let staffName = '';
    try {
      const t = await query(`SELECT title FROM feedback_master WHERE id = ? LIMIT 1`, [masterId]);
      formTitle = t?.[0]?.title || '';
    } catch {}
    try {
      if (subjectId) {
        const su = await query(`SELECT COALESCE(name, CONCAT('Subject ', id)) AS name FROM subjects WHERE id = ? LIMIT 1`, [subjectId]);
        subjectName = su?.[0]?.name || '';
      }
    } catch {}
    try {
      if (staffId) {
        const st = await query(`SELECT COALESCE(name, CONCAT('Staff ', id)) AS name FROM staff WHERE id = ? LIMIT 1`, [staffId]);
        staffName = st?.[0]?.name || '';
      }
    } catch {}
    const studentName = (name && String(name).trim()) ? String(name).trim() : '';
    // Emit notification: new response received (department scope)
    await emitNotificationSafe({
      type: 'new_response',
      title: `New response: ${formTitle || 'Feedback'}`,
      message: `${studentName ? 'Student: ' + studentName + ' • ' : ''}${subjectName ? 'Subject: ' + subjectName + ' • ' : ''}${staffName ? 'Staff: ' + staffName : ''}`.replace(/\s•\s$/,''),
      link: '/department-admin/feedback/responses',
      roleScope: 'DepartmentAdmin',
      orgId: rows[0].organizationId || null,
      deptId: rows[0].departmentId || null,
    });
    res.status(201).json({ ok: true, responseId });
  });

  // Delete a simple form
  router.delete('/simple/forms/:id', requireAuth(['DEPT']), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = await query(`DELETE FROM feedback_master WHERE id = ? AND organization_id = ? AND department_id = ?`, [id, req.user.orgId || 0, req.user.departmentId || 0]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Form not found' });
    res.json({ ok: true });
  });

  return router;
}
