const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const {
  listUsers, createUser, getUser,
  updateRole, updateStatus, adminResetPassword,
} = require('../controllers/adminController');

const {
  listDrivers, getDriver, approveDriver, updateDriverStatus,
} = require('../controllers/adminDriverController');

const { protect, adminOnly, managerOrAdmin } = require('../middleware/authMiddleware');
const { handleValidationErrors }             = require('../middleware/validationMiddleware');

// All admin routes require authentication
router.use(protect);

// ─────────────────────────────────────────────────────────────────────────────
// ── System User Management (ADMIN only for most, MANAGER can create DISPATCHER)
// ─────────────────────────────────────────────────────────────────────────────

// GET  /api/admin/users — ADMIN only
router.get('/users', adminOnly, listUsers);

// POST /api/admin/users — ADMIN can create MANAGER+DISPATCHER, MANAGER can create DISPATCHER only
router.post(
  '/users',
  managerOrAdmin,  // both roles allowed — controller enforces per-role restrictions
  [
    body('name').trim().notEmpty().withMessage('Full name is required.').isLength({ min: 3 }),
    body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('password').notEmpty().isLength({ min: 8 }).withMessage('Password min 8 chars.'),
    body('role').isIn(['MANAGER', 'DISPATCHER']).withMessage('Role must be MANAGER or DISPATCHER.'),
  ],
  handleValidationErrors,
  createUser
);

// GET  /api/admin/users/:id — ADMIN only
router.get('/users/:id', adminOnly, getUser);

// PATCH /api/admin/users/:id/role — ADMIN only
router.patch(
  '/users/:id/role',
  adminOnly,
  [body('role').isIn(['MANAGER', 'DISPATCHER']).withMessage('Role must be MANAGER or DISPATCHER.')],
  handleValidationErrors,
  updateRole
);

// PATCH /api/admin/users/:id/status — ADMIN only
router.patch(
  '/users/:id/status',
  adminOnly,
  [body('isActive').isBoolean().withMessage('isActive must be a boolean.')],
  handleValidationErrors,
  updateStatus
);

// PATCH /api/admin/users/:id/reset-password — ADMIN only
router.patch(
  '/users/:id/reset-password',
  adminOnly,
  [body('password').notEmpty().isLength({ min: 8 }).withMessage('Password min 8 chars.')],
  handleValidationErrors,
  adminResetPassword
);

// ─────────────────────────────────────────────────────────────────────────────
// ── Driver Management
// ─────────────────────────────────────────────────────────────────────────────

// GET  /api/admin/drivers — ADMIN + MANAGER
router.get('/drivers', managerOrAdmin, listDrivers);

// GET  /api/admin/drivers/:id — ADMIN + MANAGER
router.get('/drivers/:id', managerOrAdmin, getDriver);

// PATCH /api/admin/drivers/:id/approve — ADMIN only
router.patch(
  '/drivers/:id/approve',
  adminOnly,
  [body('isApproved').isBoolean().withMessage('isApproved must be a boolean.')],
  handleValidationErrors,
  approveDriver
);

// PATCH /api/admin/drivers/:id/status — ADMIN + MANAGER
router.patch(
  '/drivers/:id/status',
  managerOrAdmin,
  [body('status').isIn(['AVAILABLE', 'ON_TRIP', 'INACTIVE']).withMessage('Invalid status.')],
  handleValidationErrors,
  updateDriverStatus
);

module.exports = router;
