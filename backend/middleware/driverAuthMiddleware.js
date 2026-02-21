const { verifyDriverToken } = require('../utils/driverJwtHelper');
const DriverModel = require('../models/driverModel');

/**
 * protectDriver — verifies driver JWT (uses DRIVER_JWT_SECRET, not the user secret)
 * Attaches driver to req.driver
 */
const protectDriver = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies?.driverToken) {
      token = req.cookies.driverToken;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Driver access denied. No token provided.' });
    }

    const decoded = verifyDriverToken(token);

    if (!decoded.driverId) {
      return res.status(401).json({ success: false, message: 'Invalid driver token structure.' });
    }

    const driver = await DriverModel.findById(decoded.driverId);

    if (!driver) {
      return res.status(401).json({ success: false, message: 'Driver account no longer exists.' });
    }

    if (!driver.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your driver account is pending approval.',
        code: 'DRIVER_PENDING_APPROVAL',
      });
    }

    if (driver.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your driver account has been deactivated.',
        code: 'DRIVER_INACTIVE',
      });
    }

    req.driver = driver;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Driver session expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid driver token.' });
    }
    return res.status(500).json({ success: false, message: 'Driver authentication error.' });
  }
};

module.exports = { protectDriver };
