const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator results.
 * If there are validation errors, it returns a 400 response with the first error message.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      field: firstError.path,
    });
  }
  next();
};

module.exports = { handleValidationErrors };
