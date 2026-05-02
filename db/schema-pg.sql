-- Team Task Manager — PostgreSQL Schema (Railway)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id)    ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status      TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority    TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date    TEXT,
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW()
);
