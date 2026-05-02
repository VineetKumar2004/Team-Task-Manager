const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

const pool = {
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
  }
};

console.log('✅ SQLite Database connected at', dbPath);
module.exports = pool;
