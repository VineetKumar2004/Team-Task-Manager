const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');

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

// Project validation rules
const projectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required.')
    .isLength({ max: 200 })
    .withMessage('Project name must be at most 200 characters.'),
  body('description')
    .optional()
    .trim(),
];

// GET /api/projects — list projects user belongs to
router.get('/', auth, getProjects);

// POST /api/projects — create project (admin only)
router.post('/', auth, role('admin'), projectValidation, validate, createProject);

// GET /api/projects/:id — project detail
router.get('/:id', auth, getProject);

// PUT /api/projects/:id — update project (admin only)
router.put('/:id', auth, role('admin'), projectValidation, validate, updateProject);

// DELETE /api/projects/:id — delete project (admin only)
router.delete('/:id', auth, role('admin'), deleteProject);

// POST /api/projects/:id/members — add member (admin only)
router.post(
  '/:id/members',
  auth,
  role('admin'),
  [body('userId').isInt({ min: 1 }).withMessage('Valid userId is required.')],
  validate,
  addMember
);

// DELETE /api/projects/:id/members/:userId — remove member (admin only)
router.delete('/:id/members/:userId', auth, role('admin'), removeMember);

module.exports = router;
