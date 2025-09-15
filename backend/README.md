# Feedstream Backend

Express + MySQL (mysql2, raw SQL) API implementing the hierarchy:

- Organization -> creates Departments
- Department -> creates Staff (teachers)
- Staff -> creates Students

JWT-based auth with roles (ORG, DEPT, STAFF). Strict scoping: each role can only manage its own data.

## Setup

1) Create `.env` from example and set values:
```
cp .env.example .env
# Edit DATABASE_URL (e.g. mysql://user:pass@localhost:3306/feedstream)
```

2) Apply database schema (one-time):
- Open your MySQL client and run the SQL at `sql/schema.sql` on your database.

3) Install deps and run server:
```
npm i
npm run dev
```

Server runs on `PORT` (default 4000). Health check at `/health`.

## Endpoints (MVP)

- POST `/auth/org/register` { name, email, password }
- POST `/auth/org/login` { email, password }
- POST `/org/departments` (Bearer ORG) { name, email, password }
- POST `/auth/department/login` { email, password }
- POST `/departments/:departmentId/staff` (Bearer DEPT) { name, email, password }
- POST `/auth/staff/login` { email, password }
- POST `/staff/:staffId/students` (Bearer STAFF) { name, email }

Use header `Authorization: Bearer <token>`.
