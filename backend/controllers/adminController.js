const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { validatePassword } = require('../utils/passwordValidator');

// ─────────────────────────────────────────────
// @route   GET /api/admin/users
// @desc    List all users with optional filters
// @access  ADMIN only
// ─────────────────────────────────────────────
const listUsers = async (req, res) => {
  try {
    const page   = parseInt(req.query.page, 10)  || 1;
    const limit  = parseInt(req.query.limit, 10) || 20;
    const { role, isActive } = req.query;

    const filters = {};
    if (role && ['ADMIN', 'MANAGER', 'DISPATCHER'].includes(role)) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const result = await UserModel.findAll({ page, limit, ...filters });
    const stats  = await UserModel.countByRole();

    return res.status(200).json({
      success: true,
      data: result,
      stats: stats.reduce((acc, s) => ({ ...acc, [s.role]: s._count._all }), {}),
    });
  } catch (error) {
    console.error('Admin listUsers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/admin/users
// @desc    Admin creates a new MANAGER or DISPATCHER
// @access  ADMIN only
// ─────────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;
    const requesterRole = req.user.role; // comes from DB via protect middleware

    // Validate name
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Full name must be at least 3 characters.', field: 'name' });
    }

    // Role authorization matrix:
    // ADMIN → can create MANAGER or DISPATCHER
    // MANAGER → can only create DISPATCHER
    if (!role || !['MANAGER', 'DISPATCHER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be MANAGER or DISPATCHER.', field: 'role' });
    }
    if (requesterRole === 'MANAGER' && role !== 'DISPATCHER') {
      return res.status(403).json({
        success: false,
        message: 'Managers can only create Dispatcher accounts.',
        field: 'role',
      });
    }

    // Validate password
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return res.status(400).json({ success: false, message: pwCheck.message, field: 'password' });
    }

    // Check email uniqueness
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.', field: 'email' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await UserModel.adminCreate({
      name, email, hashedPassword, role,
      isActive: isActive !== false,
    });

    return res.status(201).json({
      success: true,
      message: `${role} account created successfully.`,
      user: newUser,
    });
  } catch (error) {
    console.error('Admin createUser error:', error);
    if (error.message.includes('Cannot create ADMIN')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/users/:id
// @desc    Get single user detail
// @access  ADMIN only
// ─────────────────────────────────────────────
const getUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Admin getUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/admin/users/:id/role
// @desc    Promote or change role (MANAGER ↔ DISPATCHER)
// @access  ADMIN only
// ─────────────────────────────────────────────
const updateRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['MANAGER', 'DISPATCHER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be MANAGER or DISPATCHER.', field: 'role' });
    }

    // Prevent modifying ADMIN accounts via this endpoint
    const target = await UserModel.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });
    if (target.role === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot modify ADMIN accounts.' });
    }

    const updated = await UserModel.updateRole(req.params.id, role);
    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      user: updated,
    });
  } catch (error) {
    console.error('Admin updateRole error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update role.' });
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/admin/users/:id/status
// @desc    Activate or deactivate user account
// @access  ADMIN only
// ─────────────────────────────────────────────
const updateStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean.', field: 'isActive' });
    }

    const target = await UserModel.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });

    // Prevent deactivating ADMIN accounts
    if (target.role === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot deactivate ADMIN accounts.' });
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot deactivate your own account.' });
    }

    const updated = await UserModel.setActiveStatus(req.params.id, isActive);
    return res.status(200).json({
      success: true,
      message: `Account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      user: updated,
    });
  } catch (error) {
    console.error('Admin updateStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update account status.' });
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/admin/users/:id/reset-password
// @desc    Admin resets any user's password
// @access  ADMIN only
// ─────────────────────────────────────────────
const adminResetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return res.status(400).json({ success: false, message: pwCheck.message, field: 'password' });
    }

    const target = await UserModel.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    await UserModel.resetPassword(req.params.id, hashedPassword);

    return res.status(200).json({
      success: true,
      message: `Password reset successfully for ${target.email}.`,
    });
  } catch (error) {
    console.error('Admin resetPassword error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

module.exports = { listUsers, createUser, getUser, updateRole, updateStatus, adminResetPassword };
