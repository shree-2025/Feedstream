import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import authRouter from './routes/auth.js';
import orgRouter from './routes/organization.js';
import deptRouter from './routes/department.js';
import staffRouter from './routes/staff.js';
import subjectRouter from './routes/subject.js';
import questionsRouter from './routes/questions.js';
import feedbackRouter from './routes/feedback.js';
import profileRouter from './routes/profile.js';
import notificationsRouter from './routes/notifications.js';
import supportRouter from './routes/support.js';
import { getPool } from './db.js';

const app = express();
// initialize pool early to fail fast if DATABASE_URL is missing
getPool();

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.FRONTEND_ORIGIN || '*';

app.use(cors({ origin: ORIGIN, credentials: true }));
// Increase body size limits to support base64 uploads and larger JSON payloads
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));
// Serve uploaded files (avatars, etc.)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use('/auth', authRouter());
// Also mount auth under /api/auth to match frontend axios baseURL `${API}/api`
app.use('/api/auth', authRouter());
app.use('/org', orgRouter());
app.use('/departments', deptRouter());
app.use('/staff', staffRouter()); // legacy path
app.use('/api/staff', staffRouter()); // align with frontend baseURL /api
app.use('/api/subjects', subjectRouter()); // Mount subjects router at /api/subjects
app.use('/api/profile', profileRouter()); // Current user profile CRUD
app.use('/api/questions', questionsRouter()); // Question Bank CRUD
app.use('/api/feedback', feedbackRouter()); // Feedback forms, questions, and responses
app.use('/api/notifications', notificationsRouter()); // In-app notifications
app.use('/api', supportRouter()); // Support requests

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
