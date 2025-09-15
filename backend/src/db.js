import 'dotenv/config';
import mysql from 'mysql2/promise';

// Creates a singleton pool using DATABASE_URL or DB_* pieces
let pool;
export function getPool() {
  if (!pool) {
    let url = process.env.DATABASE_URL;
    if (!url) {
      const host = process.env.DB_HOST || 'localhost';
      const port = process.env.DB_PORT || '3306';
      const database = process.env.DB_DATABASE || '';
      const user = process.env.DB_USERNAME || 'root';
      const pass = process.env.DB_PASSWORD ?? '';
      const auth = pass === '' ? `${user}` : `${user}:${encodeURIComponent(pass)}`;
      url = `mysql://${auth}@${host}:${port}/${database}`;
    }
    // Extra pool options appended as params
    const sep = url.includes('?') ? '&' : '?';
    pool = mysql.createPool(url + `${sep}connectionLimit=10&enableKeepAlive=true`);
  }
  return pool;
}

export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}
