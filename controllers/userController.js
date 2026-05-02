const pool = require('../db');

/**
 * GET /api/users
 * Get all users (admin only, for assignment dropdowns).
 */
const getUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY name ASC'
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers };
