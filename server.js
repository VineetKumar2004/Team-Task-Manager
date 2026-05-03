const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./middleware/auth'), require('./controllers/taskController').getDashboard);
app.use('/api/users', require('./routes/users'));

// ─── SPA Fallback — serve index.html for non-API routes ──────────────────────

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack || err.message);

  // Handle PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(400).json({
      success: false,
      message: 'A record with that value already exists.',
    });
  }

  // Handle PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  // Handle PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'Invalid value provided.',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message,
  });
});

// ─── Database Init & Server Start ─────────────────────────────────────────────

const initDatabase = async () => {
  try {
    const schemaFile = process.env.DATABASE_URL ? 'schema-pg.sql' : 'schema.sql';
    const schemaPath = path.join(__dirname, 'db', schemaFile);
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.exec(schema);
    console.log(`✅ Database schema initialized using ${schemaFile}.`);
  } catch (error) {
    console.error('❌ Failed to initialize database schema:', error.message);
  }
};

const seedDatabase = async () => {
  try {
    const bcrypt = require('bcryptjs');
    
    // 1. Seed Users
    const users = [
      { name: 'Anish Admin', email: 'anish@admin.com', password: 'admin123', role: 'admin' },
      { name: 'Priya Member', email: 'priya@member.com', password: 'member123', role: 'member' }
    ];
    let userIds = {};
    for (const u of users) {
      let res = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (res.rows.length === 0) {
        const hash = await bcrypt.hash(u.password, 10);
        res = await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id', [u.name, u.email, hash, u.role]);
      }
      userIds[u.email] = res.rows[0].id;
    }

    // 2. Seed Projects (clearing old data first to get exact 55%)
    await pool.query('TRUNCATE projects CASCADE');
    console.log('🌱 Seeding mock projects and tasks for 55% completion...');
      const projects = [
        { name: 'Website Redesign', desc: 'Modernizing the corporate landing page.', owner: userIds['anish@admin.com'] },
        { name: 'Mobile App Alpha', desc: 'Developing the initial React Native build.', owner: userIds['anish@admin.com'] }
      ];
      
      for (const p of projects) {
        const pRes = await pool.query('INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING id', [p.name, p.desc, p.owner]);
        const pid = pRes.rows[0].id;
        
        // We need 11 DONE tasks and 9 others to reach 55% (11/20)
        // Project 1 gets 6 Done, 4 Todo
        // Project 2 gets 5 Done, 5 In Progress
        const isFirst = p.name === 'Website Redesign';
        const tasks = isFirst 
          ? [
              { title: 'Task 1', status: 'done' }, { title: 'Task 2', status: 'done' }, { title: 'Task 3', status: 'done' },
              { title: 'Task 4', status: 'done' }, { title: 'Task 5', status: 'done' }, { title: 'Task 6', status: 'done' },
              { title: 'Task 7', status: 'todo' }, { title: 'Task 8', status: 'todo' }, { title: 'Task 9', status: 'todo' }, { title: 'Task 10', status: 'todo' }
            ]
          : [
              { title: 'Task 11', status: 'done' }, { title: 'Task 12', status: 'done' }, { title: 'Task 13', status: 'done' },
              { title: 'Task 14', status: 'done' }, { title: 'Task 15', status: 'done' },
              { title: 'Task 16', status: 'in_progress' }, { title: 'Task 17', status: 'in_progress' },
              { title: 'Task 18', status: 'in_progress' }, { title: 'Task 19', status: 'in_progress' }, { title: 'Task 20', status: 'in_progress' }
            ];

        for (const t of tasks) {
          await pool.query(
            'INSERT INTO tasks (project_id, title, status, priority, due_date, created_by, assigned_to) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [pid, t.title, t.status, 'medium', '2026-05-10', userIds['anish@admin.com'], userIds['priya@member.com']]
          );
        }
      }
      console.log('✅ Mock data seeded for 55% completion.');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }
};

const startServer = async () => {
  await initDatabase();
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
  });
};

startServer();
