const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const { registerDriver, loginDriver, logoutDriver, getDriverMe } = require('../controllers/driverController');
const { protectDriver }   = require('../middleware/driverAuthMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');
const { upload }          = require('../config/cloudinary');

// ── Driver Registration ───────────────────────────────────────────────────────
// Uses multer to handle optional file upload (licensePhoto)
router.post(
  '/register',
  upload.single('licensePhoto'), // optional
  [
    body('name').trim().notEmpty().withMessage('Full name is required.').isLength({ min: 3 }),
    body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('password').notEmpty().isLength({ min: 8 }).withMessage('Password min 8 characters.'),
    body('confirmPassword').notEmpty().withMessage('Please confirm your password.'),
    body('phoneNumber').notEmpty().withMessage('Phone number is required.'),
    body('licenseNumber').notEmpty().withMessage('License number is required.'),
    body('licenseExpiryDate').notEmpty().isISO8601().withMessage('Valid license expiry date required.'),
    body('vehicleCategory').notEmpty().isIn(['LIGHT','MEDIUM','HEAVY','EXTRA_HEAVY']).withMessage('Invalid vehicle category.'),
    body('yearsOfExperience').isInt({ min: 0 }).withMessage('Years of experience must be 0 or more.'),
  ],
  handleValidationErrors,
  registerDriver
);

// ── Driver Login ──────────────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  handleValidationErrors,
  loginDriver
);

// ── Protected Driver Routes ───────────────────────────────────────────────────
router.post('/logout', protectDriver, logoutDriver);
router.get('/me',      protectDriver, getDriverMe);

module.exports = router;
