const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');
const path = require('path');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT id, name, email, password, role, avatar_url, department, phone FROM users WHERE email = ? LIMIT 1', [email]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const payload = {
      _id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url || null,
      department: user.department || null,
      phone: user.phone || null,
    };

    return res.json(payload);
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { authUser };
// @desc    Get user profile by id
// @route   GET /api/users/:id
// @access  Protected (assumed handled elsewhere)
const getProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT id, name, email, role, avatar_url, department, phone FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const u = rows[0];
    res.json({
      _id: String(u.id),
      name: u.name,
      email: u.email,
      role: u.role,
      avatar_url: u.avatar_url || null,
      department: u.department || null,
      phone: u.phone || null,
    });
  } catch (e) {
    console.error('Get profile error:', e.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile (name, department, phone)
// @route   PUT /api/users/:id
// @access  Protected
const updateProfile = async (req, res) => {
  const { id } = req.params;
  const { name, department, phone } = req.body;
  try {
    const pool = await getPool();
    // Update and ensure a row was actually affected (i.e., user exists)
    const [result] = await pool.query(
      'UPDATE users SET name = ?, department = ?, phone = ? WHERE id = ? LIMIT 1',
      [name || null, department || null, phone || null, id]
    );
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const [rows] = await pool.query(
      'SELECT id, name, email, role, avatar_url, department, phone FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const u = rows[0];
    res.json({
      _id: String(u.id),
      name: u.name,
      email: u.email,
      role: u.role,
      avatar_url: u.avatar_url || null,
      department: u.department || null,
      phone: u.phone || null,
    });
  } catch (e) {
    console.error(`Update profile error (id=${id}):`, e.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload avatar and update avatar_url
// @route   POST /api/users/:id/avatar
// @access  Protected
const uploadAvatar = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const relativePath = path.posix.join('/uploads/avatars', req.file.filename);
    const pool = await getPool();
    const [result] = await pool.query('UPDATE users SET avatar_url = ? WHERE id = ? LIMIT 1', [relativePath, id]);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const [rows] = await pool.query(
      'SELECT id, name, email, role, avatar_url, department, phone FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const u = rows[0];
    res.json({
      _id: String(u.id),
      name: u.name,
      email: u.email,
      role: u.role,
      avatar_url: u.avatar_url || null,
      department: u.department || null,
      phone: u.phone || null,
    });
  } catch (e) {
    console.error(`Upload avatar error (id=${id}):`, e.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { authUser, getProfile, updateProfile, uploadAvatar };
