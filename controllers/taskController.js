const pool = require('../db');

const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ success: false, message: 'projectId required.' });

    if (req.user.role !== 'admin') {
      const memberCheck = await pool.query('SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
      if (memberCheck.rows.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const result = await pool.query(
      `SELECT t.*, u_assigned.name AS assigned_name, u_created.name AS creator_name
       FROM tasks t
       LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
       LEFT JOIN users u_created ON t.created_by = u_created.id
       WHERE t.project_id = $1
       ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, t.created_at DESC`,
      [projectId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { projectId, title, description, assignedTo, priority, dueDate } = req.body;

    let task;
    if (process.env.DATABASE_URL) {
      // PostgreSQL: use RETURNING to get the new task ID
      const insertResult = await pool.query(
        `INSERT INTO tasks (project_id, title, description, assigned_to, priority, due_date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [projectId, title, description || null, assignedTo || null, priority || 'medium', dueDate || null, req.user.id]
      );
      const newId = insertResult.rows[0].id;
      const fullTask = await pool.query(
        `SELECT t.*, u_assigned.name AS assigned_name, u_created.name AS creator_name
         FROM tasks t
         LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
         LEFT JOIN users u_created ON t.created_by = u_created.id
         WHERE t.id = $1`, [newId]
      );
      task = fullTask.rows[0];
    } else {
      // SQLite: use last_insert_rowid()
      await pool.query(
        `INSERT INTO tasks (project_id, title, description, assigned_to, priority, due_date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [projectId, title, description || null, assignedTo || null, priority || 'medium', dueDate || null, req.user.id]
      );
      const fullTask = await pool.query(
        `SELECT t.*, u_assigned.name AS assigned_name, u_created.name AS creator_name
         FROM tasks t
         LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
         LEFT JOIN users u_created ON t.created_by = u_created.id
         WHERE t.id = (SELECT last_insert_rowid())`
      );
      task = fullTask.rows[0];
    }

    res.status(201).json({ success: true, data: task, message: 'Task created.' });
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT t.*, u_assigned.name AS assigned_name, u_created.name AS creator_name, p.name AS project_name
       FROM tasks t
       LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
       LEFT JOIN users u_created ON t.created_by = u_created.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1`, [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, priority, dueDate, status } = req.body;
    await pool.query(
      `UPDATE tasks SET title = $1, description = $2, assigned_to = $3, priority = $4, due_date = $5, status = $6 WHERE id = $7`,
      [title, description, assignedTo, priority, dueDate, status, id]
    );
    const fullTask = await pool.query(
      `SELECT t.*, u_assigned.name AS assigned_name, u_created.name AS creator_name
       FROM tasks t
       LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
       LEFT JOIN users u_created ON t.created_by = u_created.id
       WHERE t.id = $1`, [id]
    );
    res.json({ success: true, data: fullTask.rows[0], message: 'Task updated.' });
  } catch (error) {
    next(error);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params; const { status } = req.body;
    await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', [status, id]);
    const fullTask = await pool.query(
      `SELECT t.*, u_assigned.name AS assigned_name, u_created.name AS creator_name
       FROM tasks t
       LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
       LEFT JOIN users u_created ON t.created_by = u_created.id
       WHERE t.id = $1`, [id]
    );
    res.json({ success: true, data: fullTask.rows[0], message: 'Status updated.' });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    let pf = '', params = [];
    if (req.user.role !== 'admin') { pf = `AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = $1)`; params = [req.user.id]; }

    const tpQ = req.user.role === 'admin' ? await pool.query('SELECT COUNT(*) AS count FROM projects') : await pool.query('SELECT COUNT(*) AS count FROM project_members WHERE user_id = $1', [req.user.id]);
    const totalProjects = tpQ.rows[0].count;

    const ttQ = await pool.query(`SELECT COUNT(*) AS count FROM tasks t WHERE 1=1 ${pf}`, params);
    const totalTasks = ttQ.rows[0].count;

    const sQ = await pool.query(`SELECT status, COUNT(*) AS count FROM tasks t WHERE 1=1 ${pf} GROUP BY status`, params);
    const tasksByStatus = { todo: 0, in_progress: 0, done: 0 };
    sQ.rows.forEach(r => { tasksByStatus[r.status] = r.count; });

    const overdueCondition = process.env.DATABASE_URL
      ? `t.due_date IS NOT NULL AND t.due_date::DATE < CURRENT_DATE`
      : `t.due_date IS NOT NULL AND t.due_date < date('now')`;
    const oQ = await pool.query(`SELECT t.id, t.title, t.due_date, t.status, p.name AS project_name, u.name AS assigned_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id LEFT JOIN users u ON t.assigned_to = u.id WHERE ${overdueCondition} AND t.status != 'done' ${pf} ORDER BY t.due_date ASC LIMIT 10`, params);
    const rQ = await pool.query(`SELECT t.id, t.title, t.status, t.priority, t.created_at, p.name AS project_name, u.name AS assigned_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id LEFT JOIN users u ON t.assigned_to = u.id WHERE 1=1 ${pf} ORDER BY t.created_at DESC LIMIT 5`, params);

    res.json({ success: true, data: { totalProjects, totalTasks, tasksByStatus, overdueTasks: oQ.rows, recentActivity: rQ.rows } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, updateTaskStatus, deleteTask, getDashboard };
