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
  due_date    DATE,
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Migration: convert due_date from TEXT to DATE if it was created as TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'due_date' AND data_type = 'text'
  ) THEN
    ALTER TABLE tasks ALTER COLUMN due_date TYPE DATE USING (
      CASE WHEN due_date IS NOT NULL AND due_date != '' THEN due_date::DATE ELSE NULL END
    );
  END IF;
END $$;
