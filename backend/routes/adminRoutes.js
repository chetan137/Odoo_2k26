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

const {
  listVehicles, createVehicle, getVehicle,
  updateVehicle, updateVehicleStatus,
  addServiceRecord, getVehicleHistory,
} = require('../controllers/vehicleController');

// ─────────────────────────────────────────────────────────────────────────────
// ── Fleet / Vehicle Management
// ─────────────────────────────────────────────────────────────────────────────

// GET  /api/admin/vehicles — ADMIN + MANAGER
router.get('/vehicles', managerOrAdmin, listVehicles);

// POST /api/admin/vehicles — ADMIN only
router.post(
  '/vehicles',
  adminOnly,
  [
    body('vehicleName').trim().notEmpty().withMessage('Vehicle name is required.'),
    body('licensePlate').trim().notEmpty().withMessage('License plate is required.'),
    body('category').isIn(['BIKE','LIGHT','MEDIUM','HEAVY','EXTRA_HEAVY','CONTAINER']).withMessage('Invalid category.'),
    body('maxCapacity').isInt({ min: 1 }).withMessage('Max capacity must be a positive number.'),
    body('acquisitionCost').isFloat({ min: 0 }).withMessage('Acquisition cost must be a number.'),
    body('lengthFt').isFloat({ gt: 0 }).withMessage('Length must be greater than 0.'),
    body('widthFt').isFloat({ gt: 0 }).withMessage('Width must be greater than 0.'),
    body('heightFt').isFloat({ gt: 0 }).withMessage('Height must be greater than 0.'),
  ],
  handleValidationErrors,
  createVehicle
);

// GET  /api/admin/vehicles/:id — ADMIN + MANAGER
router.get('/vehicles/:id', managerOrAdmin, getVehicle);

// PATCH /api/admin/vehicles/:id — update details — ADMIN only
router.patch(
  '/vehicles/:id',
  adminOnly,
  [
    body('maxCapacity').optional().isInt({ min: 1 }).withMessage('Max capacity must be a positive integer.'),
    body('currentOdometer').optional().isInt({ min: 0 }).withMessage('Odometer must be a non-negative integer.'),
    body('acquisitionCost').optional().isFloat({ min: 0 }).withMessage('Cost must be a non-negative number.'),
    body('lengthFt').optional().isFloat({ gt: 0 }).withMessage('Length must be > 0.'),
    body('widthFt').optional().isFloat({ gt: 0 }).withMessage('Width must be > 0.'),
    body('heightFt').optional().isFloat({ gt: 0 }).withMessage('Height must be > 0.'),
  ],
  handleValidationErrors,
  updateVehicle
);

// PATCH /api/admin/vehicles/:id/status — ADMIN + MANAGER
router.patch(
  '/vehicles/:id/status',
  managerOrAdmin,
  [body('status').isIn(['AVAILABLE','ON_TRIP','IN_SHOP']).withMessage('Invalid status.')],
  handleValidationErrors,
  updateVehicleStatus
);

// POST /api/admin/vehicles/:id/service — add service/maintenance record — ADMIN + MANAGER
router.post(
  '/vehicles/:id/service',
  managerOrAdmin,
  [
    body('eventType').isIn(['SERVICE','OIL_CHANGE','TYRE_CHANGE','MAINTENANCE','EXPENSE_ADDED']).withMessage('Invalid event type.'),
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('description').trim().notEmpty().withMessage('Description is required.'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a non-negative number.'),
  ],
  handleValidationErrors,
  addServiceRecord
);

// GET /api/admin/vehicles/:id/history — ADMIN + MANAGER
router.get('/vehicles/:id/history', managerOrAdmin, getVehicleHistory);

module.exports = router;
