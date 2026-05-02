const path = require('path');

let pool;

if (process.env.DATABASE_URL) {
  // ─── PostgreSQL for Railway / Production ─────────────────────────────────────
  const { Pool } = require('pg');

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Add exec() helper to match the SQLite interface used by server.js
  pool.exec = async (sql) => {
    const client = await pool.connect();
    try {
      await client.query(sql);
    } finally {
      client.release();
    }
  };

  console.log('✅ Connected to PostgreSQL (Railway)');
} else {
  // ─── SQLite for Local Development ────────────────────────────────────────────
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, '../database.sqlite');
  const db = new sqlite3.Database(dbPath);

  db.run('PRAGMA foreign_keys = ON');

  pool = {
    query: (text, params = []) => {
      return new Promise((resolve, reject) => {
        const sql = text.replace(/\$\d+/g, '?');
        const trimmed = sql.trim().toUpperCase();

        if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
          db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows: rows || [] });
          });
        } else {
          db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ rows: [], lastID: this.lastID, changes: this.changes });
          });
        }
      });
    },
    exec: (sql) => {
      return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
  };

  console.log('✅ SQLite Database connected at', dbPath);
}

module.exports = pool;
