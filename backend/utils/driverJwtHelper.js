const jwt = require('jsonwebtoken');

const DRIVER_SECRET  = process.env.DRIVER_JWT_SECRET  || 'driver_fallback_secret';
const DRIVER_EXPIRES = process.env.DRIVER_JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT for a driver — uses a DIFFERENT secret than system user tokens.
 * Payload always contains { driverId } — never contains 'id' or 'role'
 */
const generateDriverToken = (payload) => {
  return jwt.sign({ driverId: payload.driverId }, DRIVER_SECRET, { expiresIn: DRIVER_EXPIRES });
};

/**
 * Verify a driver JWT
 */
const verifyDriverToken = (token) => {
  return jwt.verify(token, DRIVER_SECRET);
};

/**
 * Set driver token as HTTP-only cookie
 */
const setDriverTokenCookie = (res, token) => {
  res.cookie('driverToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clear driver token cookie
 */
const clearDriverTokenCookie = (res) => {
  res.cookie('driverToken', '', { httpOnly: true, expires: new Date(0) });
};

module.exports = { generateDriverToken, verifyDriverToken, setDriverTokenCookie, clearDriverTokenCookie };
