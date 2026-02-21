const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { signup, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

// ─── Sign Up Validators ───────────────────────────────────────────────────────
const signupValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be at least 3 characters.'),
  body('email')
    .trim().notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password.'),
];

// ─── Login Validators ─────────────────────────────────────────────────────────
const loginValidators = [
  body('email')
    .trim().notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.'),
  body('role')
    .notEmpty().withMessage('Please select your role.')
    .isIn(['MANAGER', 'DISPATCHER', 'ADMIN']).withMessage('Invalid role selected.'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────
router.post('/signup', signupValidators, handleValidationErrors, signup);
router.post('/login',  loginValidators,  handleValidationErrors, login);

// Protected
router.post('/logout', protect, logout);
router.get('/me',      protect, getMe);

module.exports = router;
