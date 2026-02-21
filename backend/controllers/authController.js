const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/jwtHelper');
const { validatePassword } = require('../utils/passwordValidator');

// ─────────────────────────────────────────────
// @route   POST /api/auth/signup
// @desc    Register new user — always DISPATCHER
// @access  Public
// ─────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // 1. Name validation
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Full name must be at least 3 characters.', field: 'name' });
    }

    // 2. Confirm passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.', field: 'confirmPassword' });
    }

    // 3. Password strength (backend rules: 8+ chars, uppercase, number)
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return res.status(400).json({ success: false, message: pwCheck.message, field: 'password' });
    }

    // 4. Email uniqueness
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.', field: 'email' });
    }

    // 5. Hash & create — role is ALWAYS forced to DISPATCHER server-side
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await UserModel.create({ name, email, hashedPassword });

    // 6. JWT cookie
    const token = generateToken({ id: newUser.id });
    setTokenCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome aboard.',
      user: {
        id:         newUser.id,
        employeeId: newUser.employeeId,
        name:       newUser.name,
        email:      newUser.email,
        role:       newUser.role,
        isActive:   newUser.isActive,
        createdAt:  newUser.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Authenticate user — validates role too
// @access  Public
// ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 1. role must be MANAGER or DISPATCHER (ADMIN uses secure back-channel)
    const ALLOWED_LOGIN_ROLES = ['MANAGER', 'DISPATCHER'];
    if (!role || !ALLOWED_LOGIN_ROLES.includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid role to log in.',
        field: 'role',
      });
    }

    // 2. Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account does not exist.', field: 'email' });
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid password.', field: 'password' });
    }

    // 4. Strict role match — NEVER trust frontend role selection alone
    if (user.role !== role.toUpperCase()) {
      return res.status(403).json({
        success: false,
        message: 'Invalid role selected for this account.',
        field: 'role',
        code: 'ROLE_MISMATCH',
      });
    }

    // 5. Active check
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact an administrator.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // 6. Generate JWT — only ID in payload, role loaded fresh from DB each request
    const token = generateToken({ id: user.id });
    setTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back.',
      user: {
        id:         user.id,
        employeeId: user.employeeId,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        isActive:   user.isActive,
      },
      token,
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/logout
// @access  Private
// ─────────────────────────────────────────────
const logout = (req, res) => {
  clearTokenCookie(res);
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// ─────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get current session user
// @access  Private
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    return res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

module.exports = { signup, login, logout, getMe };
