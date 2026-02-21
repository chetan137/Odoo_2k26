const { verifyToken } = require('../utils/jwtHelper');
const UserModel = require('../models/userModel');

/**
 * protect — verifies JWT and attaches user to req.user
 * Works with HTTP-only cookie or Authorization Bearer header
 */
const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies?.authToken) {
      token = req.cookies.authToken;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided. Please log in.' });
    }

    const decoded = verifyToken(token);
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact an administrator.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
    }
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

/**
 * requireRole — RBAC middleware factory.
 * Usage: requireRole('ADMIN') or requireRole('ADMIN', 'MANAGER')
 *
 * IMPORTANT: Always use AFTER protect middleware.
 * Role values are read from DB — never from client/JWT payload.
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}.`,
        code: 'INSUFFICIENT_ROLE',
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
};

// Convenience pre-built role guards
const adminOnly     = requireRole('ADMIN');
const managerOnly   = requireRole('MANAGER');
const dispatcherOnly = requireRole('DISPATCHER');
const managerOrAdmin = requireRole('ADMIN', 'MANAGER');
const anyRole        = requireRole('ADMIN', 'MANAGER', 'DISPATCHER');

module.exports = {
  protect,
  requireRole,
  adminOnly,
  managerOnly,
  dispatcherOnly,
  managerOrAdmin,
  anyRole,
};
