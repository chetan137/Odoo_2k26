const { Prisma } = require('@prisma/client');

/**
 * Prisma Error Handler Middleware
 *
 * Translates Prisma-specific errors into the same HTTP response format
 * used throughout the application:
 *   { success: false, message: '...' }
 *
 * This ensures that switching from pg to Prisma does not change
 * the error response contract with the frontend.
 *
 * Usage: Add BEFORE the global error handler in server.js
 *   app.use(prismaErrorHandler);
 *   app.use(globalErrorHandler);  // existing
 */
const prismaErrorHandler = (err, req, res, next) => {
  // Only handle Prisma-specific errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      // Unique constraint violation (e.g., duplicate email)
      case 'P2002': {
        const field = err.meta?.target?.[0] || 'field';
        return res.status(409).json({
          success: false,
          message: `A record with this ${field} already exists.`,
          field,
        });
      }

      // Record not found (e.g., update/delete on non-existent record)
      case 'P2025':
        return res.status(404).json({
          success: false,
          message: err.meta?.cause || 'Record not found.',
        });

      // Foreign key constraint failure
      case 'P2003': {
        const fkField = err.meta?.field_name || 'field';
        return res.status(400).json({
          success: false,
          message: `Invalid reference: related ${fkField} does not exist.`,
          field: fkField,
        });
      }

      // Required field missing
      case 'P2011': {
        const missingField = err.meta?.constraint || 'field';
        return res.status(400).json({
          success: false,
          message: `Required field '${missingField}' is missing.`,
          field: missingField,
        });
      }

      // Value too long for column type
      case 'P2000': {
        const longField = err.meta?.column_name || 'field';
        return res.status(400).json({
          success: false,
          message: `Value too long for ${longField}.`,
          field: longField,
        });
      }

      default:
        console.error(`Unhandled Prisma Error [${err.code}]:`, err.message);
        return res.status(500).json({
          success: false,
          message: 'A database error occurred. Please try again.',
        });
    }
  }

  // Prisma validation errors (invalid data shape)
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error('Prisma Validation Error:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided.',
    });
  }

  // Prisma initialization errors (connection issues)
  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error('Prisma Init Error:', err.message);
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Please try again later.',
    });
  }

  // Connection pool timeout
  if (err instanceof Prisma.PrismaClientRustPanicError) {
    console.error('Prisma Critical Error:', err.message);
    return res.status(503).json({
      success: false,
      message: 'A critical database error occurred. Please contact support.',
    });
  }

  // Not a Prisma error — pass to next error handler
  next(err);
};

module.exports = { prismaErrorHandler };
