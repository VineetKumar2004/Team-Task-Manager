const pool = require('../db');

const getProjects = async (req, res, next) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(
        `SELECT p.*, u.name AS owner_name,
                (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) AS member_count,
                (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
                (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS done_count
         FROM projects p
         LEFT JOIN users u ON p.owner_id = u.id
         ORDER BY p.created_at DESC`
      );
    } else {
      result = await pool.query(
        `SELECT p.*, u.name AS owner_name,
                (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) AS member_count,
                (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
                (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS done_count
         FROM projects p
         LEFT JOIN users u ON p.owner_id = u.id
         INNER JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
         ORDER BY p.created_at DESC`,
        [req.user.id]
      );
    }
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const insertResult = await pool.query(
      `INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3)`,
      [name, description || null, req.user.id]
    );

    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = (SELECT last_insert_rowid())'
    );
    const project = projectResult.rows[0];

    await pool.query(
      `INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)`,
      [project.id, req.user.id]
    );

    res.status(201).json({ success: true, data: project, message: 'Project created successfully.' });
  } catch (error) {
    next(error);
  }
};

const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const projectResult = await pool.query(
      `SELECT p.*, u.name AS owner_name FROM projects p LEFT JOIN users u ON p.owner_id = u.id WHERE p.id = $1`,
      [id]
    );
    if (projectResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found.' });
    const project = projectResult.rows[0];

    if (req.user.role !== 'admin') {
      const memberCheck = await pool.query('SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2', [id, req.user.id]);
      if (memberCheck.rows.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const membersResult = await pool.query(`SELECT u.id, u.name, u.email, u.role FROM users u INNER JOIN project_members pm ON pm.user_id = u.id WHERE pm.project_id = $1 ORDER BY u.name`, [id]);
    const taskCountsResult = await pool.query(`SELECT status, COUNT(*) AS count FROM tasks WHERE project_id = $1 GROUP BY status`, [id]);
    
    const taskCounts = { todo: 0, in_progress: 0, done: 0 };
    taskCountsResult.rows.forEach(row => { taskCounts[row.status] = row.count; });

    res.json({ success: true, data: { ...project, members: membersResult.rows, taskCounts } });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    await pool.query(`UPDATE projects SET name = $1, description = $2 WHERE id = $3`, [name, description || null, id]);
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found.' });
    res.json({ success: true, data: result.rows[0], message: 'Project updated.' });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Project deleted.' });
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { id } = req.params; const { userId } = req.body;
    await pool.query(`INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)`, [id, userId]);
    const userRes = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    res.status(201).json({ success: true, data: userRes.rows[0], message: 'Member added.' });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.id, req.params.userId]);
    res.json({ success: true, message: 'Member removed.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };
