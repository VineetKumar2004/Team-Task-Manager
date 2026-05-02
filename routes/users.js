const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { getUsers } = require('../controllers/userController');

// GET /api/users — all users (admin only)
router.get('/', auth, role('admin'), getUsers);

module.exports = router;
