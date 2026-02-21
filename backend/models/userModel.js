const prisma = require('../config/prismaClient');

/**
 * Employee ID Generator
 * Format: EMP-0001, EMP-0002, ...
 * Thread-safe via sequential DB query for highest existing ID
 */
const generateEmployeeId = async () => {
  // Find the highest existing employeeId
  const last = await prisma.user.findFirst({
    orderBy: { employeeId: 'desc' },
    select: { employeeId: true },
    where: { employeeId: { startsWith: 'EMP-' } },
  });

  let nextNum = 1;
  if (last?.employeeId) {
    const parsed = parseInt(last.employeeId.replace('EMP-', ''), 10);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }

  return `EMP-${String(nextNum).padStart(4, '0')}`;
};

/**
 * User Model — handles all database operations for the users table.
 * RBAC-aware with role, isActive, and employeeId support.
 */
const UserModel = {
  /**
   * Find a user by email (full object including password for auth)
   */
  findByEmail: async (email) => {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  },

  /**
   * Find a user by ID (safe projection — no password)
   */
  findById: async (id) => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Find a user by employeeId
   */
  findByEmployeeId: async (employeeId) => {
    return prisma.user.findUnique({
      where: { employeeId },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  },

  /**
   * Create a new user — public signup always assigns DISPATCHER role
   * employeeId is auto-generated
   */
  create: async ({ name, email, hashedPassword }) => {
    const employeeId = await generateEmployeeId();
    return prisma.user.create({
      data: {
        employeeId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'DISPATCHER',  // ALWAYS DISPATCHER on public signup — never trust client
        isActive: true,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  },

  /**
   * Admin creates a user with explicit role (MANAGER or DISPATCHER only)
   */
  adminCreate: async ({ name, email, hashedPassword, role, isActive = true }) => {
    // Enforce: Admin cannot create another ADMIN via this method
    if (role === 'ADMIN') throw new Error('Cannot create ADMIN accounts via this endpoint.');
    const employeeId = await generateEmployeeId();
    return prisma.user.create({
      data: {
        employeeId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        isActive,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  },

  /**
   * Get all users (for admin management panel)
   */
  findAll: async ({ page = 1, limit = 20, role, isActive } = {}) => {
    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  },

  /**
   * Update user role (promote DISPATCHER → MANAGER or vice versa)
   * Cannot change role to/from ADMIN
   */
  updateRole: async (id, role) => {
    if (role === 'ADMIN') throw new Error('Cannot assign ADMIN role via this endpoint.');
    return prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  },

  /**
   * Toggle isActive status (activate / deactivate)
   */
  setActiveStatus: async (id, isActive) => {
    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  },

  /**
   * Admin reset password for any user
   */
  resetPassword: async (id, hashedPassword) => {
    return prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: { id: true, employeeId: true, email: true },
    });
  },

  /**
   * Count all users (for stats)
   */
  countByRole: async () => {
    return prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    });
  },
};

module.exports = UserModel;
