import jwt from 'jsonwebtoken';

export function requireAuth(roles = []) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'Missing token' });
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      req.user = payload; // { role, orgId?, departmentId?, staffId?, sub }
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

export function signToken(payload) {
  const opts = { expiresIn: '7d' };
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', opts);
}
