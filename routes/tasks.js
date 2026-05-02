const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getDashboard,
} = require('../controllers/taskController');

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Task creation validation rules
const taskCreateValidation = [
  body('projectId')
    .isInt({ min: 1 })
    .withMessage('Valid projectId is required.'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required.')
    .isLength({ max: 300 })
    .withMessage('Task title must be at most 300 characters.'),
  body('description')
    .optional()
    .trim(),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high.'),
  body('dueDate')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Due date must be a valid date.'),
  body('assignedTo')
    .optional({ values: 'null' })
    .isInt({ min: 1 })
    .withMessage('assignedTo must be a valid user ID.'),
];

// Task update validation rules
const taskUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task title cannot be empty.')
    .isLength({ max: 300 })
    .withMessage('Task title must be at most 300 characters.'),
  body('description')
    .optional()
    .trim(),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high.'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done'])
    .withMessage('Status must be one of: todo, in_progress, done.'),
  body('dueDate')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Due date must be a valid date.'),
  body('assignedTo')
    .optional({ values: 'null' })
    .isInt({ min: 1 })
    .withMessage('assignedTo must be a valid user ID.'),
];

// GET /api/dashboard — dashboard stats
router.get('/dashboard', auth, getDashboard);

// GET /api/tasks?projectId= — list tasks for a project
router.get('/', auth, getTasks);

// POST /api/tasks — create task (admin only)
router.post('/', auth, role('admin'), taskCreateValidation, validate, createTask);

// GET /api/tasks/:id — task detail
router.get('/:id', auth, getTask);

// PUT /api/tasks/:id — update task (admin only)
router.put('/:id', auth, role('admin'), taskUpdateValidation, validate, updateTask);

// PATCH /api/tasks/:id/status — update task status (member can update own)
router.patch(
  '/:id/status',
  auth,
  [
    body('status')
      .isIn(['todo', 'in_progress', 'done'])
      .withMessage('Status must be one of: todo, in_progress, done.'),
  ],
  validate,
  updateTaskStatus
);

// DELETE /api/tasks/:id — delete task (admin only)
router.delete('/:id', auth, role('admin'), deleteTask);

module.exports = router;
