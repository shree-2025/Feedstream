import express from 'express';
import { query, getPool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

// Detect whether subjects table uses department_id or department (string)
let subjDeptColPromise = null;
async function getSubjectsDeptColumn() {
  if (!subjDeptColPromise) {
    subjDeptColPromise = (async () => {
      try {
        const rows = await query(
          `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subjects' AND COLUMN_NAME IN ('department_id','department')`
        );
        const names = rows.map(r => r.COLUMN_NAME);
        if (names.includes('department_id')) return 'department_id';
        if (names.includes('department')) return 'department';
      } catch {}
      return 'department';
    })();
  }
  return subjDeptColPromise;
}

// Detect if departments table exists for safe joins
let hasDepartmentsTablePromise = null;
async function hasDepartmentsTable() {
  if (!hasDepartmentsTablePromise) {
    hasDepartmentsTablePromise = (async () => {
      try {
        const rows = await query(
          `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'departments' LIMIT 1`
        );
        return rows && rows.length > 0;
      } catch {
        return false;
      }
    })();
  }
  return hasDepartmentsTablePromise;
}

const router = express.Router({ mergeParams: true });

// All routes in this file are prefixed with /api/subjects

// Get all subjects with pagination and filters
router.get('/', requireAuth(['DEPT','ORG']), async (req, res) => {
  try {
    const deptCol = await getSubjectsDeptColumn();
    const canJoinDepartments = await hasDepartmentsTable();
    const normalizeType = (t) => {
      if (!t) return '';
      const v = String(t).toLowerCase();
      if (v === 'core') return 'Core';
      if (v === 'elective') return 'Elective';
      if (v === 'lab' || v === 'laboratory') return 'Lab';
      if (v === 'project') return 'Project';
      return t;
    };
    const { page = 1, limit = 10, search = '', department = '', semester = '', type = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const whereParts = ['1=1'];
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereParts.push('(s.name LIKE ? OR s.code LIKE ? OR s.description LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
      paramIndex += 3;
    }

    if (department) {
      if (deptCol === 'department') {
        whereParts.push('s.department = ?');
        queryParams.push(department);
      } else {
        whereParts.push('s.department_id = ?');
        queryParams.push(Number(department) || req.user.departmentId);
      }
      paramIndex += 1;
    } else {
      // default scope to admin's department if using department_id
      if (deptCol === 'department_id') {
        whereParts.push('s.department_id = ?');
        queryParams.push(req.user.departmentId);
      }
    }

    if (semester) {
      whereParts.push('s.semester = ?');
      queryParams.push(semester);
      paramIndex += 1;
    }

    if (type) {
      whereParts.push('s.type = ?');
      queryParams.push(normalizeType(type));
    }

    const whereClause = `WHERE ${whereParts.join(' AND ')}`;
    
    // Get total count
    const countRows = await query(
      `SELECT COUNT(*) as total FROM subjects s ${whereClause}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;
    
    // Get paginated results
    const selectDept = (deptCol === 'department_id' && canJoinDepartments)
      ? 'COALESCE(d.name, "") AS department'
      : (deptCol === 'department' ? 's.department' : '"" AS department');
    const joinDept = (deptCol === 'department_id' && canJoinDepartments)
      ? 'LEFT JOIN departments d ON d.id = s.department_id'
      : '';

    const sql = `
      SELECT 
        s.id,
        s.name,
        s.code,
        ${selectDept},
        s.credits,
        s.description,
        s.semester,
        s.type,
        s.instructor_id,
        s.duration,
        s.prerequisites,
        s.objectives,
        s.created_at AS createdAt,
        s.updated_at AS updatedAt,
        u.name AS instructor
      FROM subjects s
      LEFT JOIN staff u ON s.instructor_id = u.id
      ${joinDept}
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const rows = await query(sql, [
      ...queryParams,
      parseInt(limit),
      parseInt(offset)
    ]);
    
    res.json({
      items: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
    
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects' });
  }
});

// Create a new subject
router.post('/', requireAuth(['DEPT','ORG']), async (req, res) => {
  try {
    const deptCol = await getSubjectsDeptColumn();
    const { 
      name, 
      code, 
      credits, 
      description, 
      semester, 
      type, 
      instructor_id, 
      duration, 
      prerequisites, 
      objectives 
    } = req.body;
    
    // Build insert dynamically to support department_id vs department
    const cols = ['name','code','credits','description','semester','type','instructor_id','duration','prerequisites','objectives'];
    const vals = [name, code, Number(credits), description, semester];
    
    
    // Normalize inputs
    const normType = (() => {
      const v = String(type || '').toLowerCase();
      if (v === 'core') return 'Core';
      if (v === 'elective') return 'Elective';
      if (v === 'lab' || v === 'laboratory') return 'Lab';
      if (v === 'project') return 'Project';
      return type;
    })();
    const instrId = instructor_id ? Number(instructor_id) : null;
    vals.push(normType, instrId, duration, prerequisites, objectives);

    // Department assignment: set from auth context, ignore any client-provided department
    if (deptCol === 'department_id') {
      cols.splice(2, 0, 'department_id'); // after code
      vals.splice(2, 0, req.user.departmentId);
    } else {
      // If only a text column exists, we could populate department name if available. As we don't have it in auth, set empty string.
      cols.splice(2, 0, 'department');
      vals.splice(2, 0, '');
    }

    const placeholders = cols.map(() => '?').join(', ');
    const sql = `INSERT INTO subjects (${cols.join(', ')}) VALUES (${placeholders})`;

    const result = await query(sql, vals);
    const newRows = await query('SELECT * FROM subjects WHERE id = LAST_INSERT_ID()');
    res.status(201).json(newRows[0]);
    
  } catch (error) {
    console.error('Error creating subject:', error);
    // MySQL duplicate entry error
    if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
      return res.status(400).json({ message: 'Subject with this code already exists' });
    }
    res.status(500).json({ message: 'Error creating subject' });
  }
});

// Update a subject
router.put('/:id', requireAuth(['DEPT','ORG']), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      code, 
      credits, 
      description, 
      semester, 
      type, 
      instructor_id, 
      duration, 
      prerequisites, 
      objectives 
    } = req.body;
    const deptCol = await getSubjectsDeptColumn();
    
    // Build update without allowing department changes; department is from auth context on creation only
    const sets = [
      'name = ?',
      'code = ?',
      'credits = ?',
      'description = ?',
      'semester = ?',
      'type = ?',
      'instructor_id = ?',
      'duration = ?',
      'prerequisites = ?',
      'objectives = ?',
      'updated_at = NOW()'
    ];
    
    const normType = (() => {
      const v = String(type || '').toLowerCase();
      if (v === 'core') return 'Core';
      if (v === 'elective') return 'Elective';
      if (v === 'lab' || v === 'laboratory') return 'Lab';
      if (v === 'project') return 'Project';
      return type;
    })();
    const instrId = instructor_id ? Number(instructor_id) : null;
    const values = [
      name, code, Number(credits), description, semester, 
      normType, instrId, duration, prerequisites, objectives
    ];
    const sql = `UPDATE subjects SET ${sets.join(', ')} WHERE id = ?`;
    values.push(id);
    
    const result = await query(sql, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    const updatedRows = await query('SELECT * FROM subjects WHERE id = ?', [id]);
    res.json(updatedRows[0]);
    
  } catch (error) {
    console.error('Error updating subject:', error);
    // MySQL duplicate entry error
    if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
      return res.status(400).json({ message: 'Subject with this code already exists' });
    }
    res.status(500).json({ message: 'Error updating subject' });
  }
});

// Delete a subject
router.delete('/:id', requireAuth(['DEPT','ORG']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM subjects WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    res.json({ message: 'Subject deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ message: 'Error deleting subject' });
  }
});

// Get subject by ID
router.get('/:id', requireAuth(['DEPT','ORG']), async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        s.id,
        s.name,
        s.code,
        s.department,
        s.credits,
        s.description,
        s.semester,
        s.type,
        s.instructor_id,
        s.duration,
        s.prerequisites,
        s.objectives,
        s.created_at AS createdAt,
        s.updated_at AS updatedAt,
        u.name AS instructor
      FROM subjects s
      LEFT JOIN staff u ON s.instructor_id = u.id
      WHERE s.id = ?
    `;
    
    const rows = await query(sql, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    res.json(rows[0]);
    
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ message: 'Error fetching subject' });
  }
});

export default () => router;
