-- Migration: Add must_change_password column to staff table
-- Run this against your active database (configured by DB_* in backend/.env)

ALTER TABLE staff
  ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 1 AFTER password_hash;
