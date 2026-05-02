# Team Task Manager

A production-ready full-stack web application for team project management with role-based access control, Kanban boards, and real-time task tracking.

## Live Demo
[Deploy to Railway to generate your URL]

## Features
- **Authentication** — Signup/Login with JWT tokens and bcrypt password hashing
- **Role-Based Access** — Admin and Member roles with granular permissions
- **Project Management** — Create, update, delete projects; manage team members
- **Task Management** — Full CRUD with assignment, priorities, due dates, and status tracking
- **Kanban Board** — Visual task board with Todo / In Progress / Done columns
- **Dashboard** — Stats cards, donut chart, overdue alerts, recent activity feed
- **Responsive Design** — Dark enterprise UI that works on desktop and mobile
- **Search & Filter** — Filter tasks by keyword, priority, and status
- **Toast Notifications** — Real-time feedback for all user actions
- **Input Validation** — Server-side validation with express-validator

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | PostgreSQL (node-postgres) |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Frontend | Vanilla HTML/CSS/JS |
| HTTP Client | Axios (CDN) |
| Deploy | Railway |

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Clone & Install
```bash
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager
npm install
```

### Database Setup
```sql
-- Create database
CREATE DATABASE team_task_manager;
```
Tables are auto-created on server startup via `db/schema.sql`.

### Environment Variables
```bash
cp .env.example .env
# Edit .env with your values:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/team_task_manager
# JWT_SECRET=your_secret_key_at_least_32_characters_long
# PORT=3000
# NODE_ENV=development
```

### Run Dev Server
```bash
npm run dev
# Server starts at http://localhost:3000
```

## API Documentation

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register new user | No |
| POST | /api/auth/login | Login user | No |
| GET | /api/auth/me | Get current user | Yes |
| GET | /api/projects | List user's projects | Yes |
| POST | /api/projects | Create project | Admin |
| GET | /api/projects/:id | Project detail | Yes |
| PUT | /api/projects/:id | Update project | Admin |
| DELETE | /api/projects/:id | Delete project | Admin |
| POST | /api/projects/:id/members | Add member | Admin |
| DELETE | /api/projects/:id/members/:uid | Remove member | Admin |
| GET | /api/tasks?projectId= | List tasks | Yes |
| POST | /api/tasks | Create task | Admin |
| GET | /api/tasks/:id | Task detail | Yes |
| PUT | /api/tasks/:id | Update task | Admin |
| PATCH | /api/tasks/:id/status | Update status | Owner |
| DELETE | /api/tasks/:id | Delete task | Admin |
| GET | /api/dashboard | Dashboard stats | Yes |
| GET | /api/users | All users | Admin |
| GET | /api/health | Health check | No |

## Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create/Edit/Delete Projects | ✅ | ❌ |
| Add/Remove Members | ✅ | ❌ |
| Create/Edit/Delete Tasks | ✅ | ❌ |
| View Projects (member of) | ✅ | ✅ |
| View Tasks | ✅ | ✅ |
| Update Own Task Status | ✅ | ✅ |
| View All Users | ✅ | ❌ |

## Deployment (Railway)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) and create a new project
3. Add a **PostgreSQL** plugin from the Railway dashboard
4. Connect your GitHub repo
5. Railway auto-detects `Procfile` and `railway.json`
6. Set environment variables in Railway dashboard:
   - `JWT_SECRET` — a strong 32+ character secret
   - `DATABASE_URL` — auto-set by Railway PostgreSQL plugin
   - `NODE_ENV` — `production`
7. Deploy — tables are auto-created on first run



## Author
Built for the Ethara Full-Stack Assessment.
