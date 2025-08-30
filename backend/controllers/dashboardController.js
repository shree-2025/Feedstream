const { getPool } = require('../config/db');

// GET /api/dashboard/stats
// Returns counts used by the department dashboard
async function getStats(req, res) {
  try {
    const pool = await getPool();

    // Count staff
    const [[{ count: staffCount }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM staff'
    );

    // Count students: prefer students table if exists, otherwise fallback to users with role='Student'
    let studentCount = 0;
    try {
      const [[{ count }]] = await pool.query(
        'SELECT COUNT(*) AS count FROM students'
      );
      studentCount = count;
    } catch (e) {
      // Fallback if students table doesn't exist
      const [[{ count }]] = await pool.query(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'Student'"
      );
      studentCount = count;
    }

    // Active feedback forms: status = 'active' OR current time within start/end window
    const [[{ count: activeForms }]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM feedback_forms
       WHERE status = 'active'
          OR (
            start_date IS NOT NULL AND end_date IS NOT NULL
            AND NOW() >= start_date AND NOW() <= end_date
          )`
    );

    // Total responses
    const [[{ count: responses }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM feedback_responses'
    );

    res.json({
      staffCount,
      studentCount,
      activeForms,
      responses,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ message: 'Failed to load stats' });
  }
}

module.exports = { getStats };
