const prisma = require('../config/prismaClient');

/**
 * Auto-generate driverId in format DRV-0001, DRV-0002, …
 */
const generateDriverId = async () => {
  const last = await prisma.driver.findFirst({
    orderBy: { driverId: 'desc' },
    select: { driverId: true },
    where: { driverId: { startsWith: 'DRV-' } },
  });

  let nextNum = 1;
  if (last?.driverId) {
    const parsed = parseInt(last.driverId.replace('DRV-', ''), 10);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }
  return `DRV-${String(nextNum).padStart(4, '0')}`;
};

// Safe projection (no password)
const SAFE_SELECT = {
  id: true, driverId: true, name: true, email: true,
  phoneNumber: true, licenseNumber: true, licenseExpiryDate: true,
  vehicleCategory: true, yearsOfExperience: true, licensePhotoUrl: true,
  status: true, isApproved: true, createdAt: true, updatedAt: true,
};

const DriverModel = {
  /** Full record (includes password) — for auth only */
  findByEmailWithPassword: async (email) => {
    return prisma.driver.findUnique({ where: { email: email.toLowerCase() } });
  },

  /** Safe lookup by ID (no password) */
  findById: async (id) => {
    return prisma.driver.findUnique({ where: { id }, select: SAFE_SELECT });
  },

  /** Safe lookup by driverId */
  findByDriverId: async (driverId) => {
    return prisma.driver.findUnique({ where: { driverId }, select: SAFE_SELECT });
  },

  /** Check email existence */
  findByEmail: async (email) => {
    return prisma.driver.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });
  },

  /** Check license uniqueness */
  findByLicense: async (licenseNumber) => {
    return prisma.driver.findUnique({
      where: { licenseNumber },
      select: { id: true, licenseNumber: true },
    });
  },

  /** Register a new driver */
  create: async ({
    name, email, hashedPassword,
    phoneNumber, licenseNumber, licenseExpiryDate,
    vehicleCategory, yearsOfExperience, licensePhotoUrl,
  }) => {
    const driverId = await generateDriverId();
    return prisma.driver.create({
      data: {
        driverId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phoneNumber: phoneNumber.trim(),
        licenseNumber: licenseNumber.trim().toUpperCase(),
        licenseExpiryDate: new Date(licenseExpiryDate),
        vehicleCategory,
        yearsOfExperience: parseInt(yearsOfExperience, 10) || 0,
        licensePhotoUrl: licensePhotoUrl || null,
        status: 'AVAILABLE',
        isApproved: false,
      },
      select: SAFE_SELECT,
    });
  },

  /** Admin approve / revoke driver */
  setApproval: async (id, isApproved) => {
    return prisma.driver.update({
      where: { id },
      data: { isApproved },
      select: SAFE_SELECT,
    });
  },

  /** Admin/Manager update driver status */
  setStatus: async (id, status) => {
    return prisma.driver.update({
      where: { id },
      data: { status },
      select: SAFE_SELECT,
    });
  },

  /** List all drivers with optional filters */
  findAll: async ({ page = 1, limit = 20, status, isApproved, vehicleCategory } = {}) => {
    const where = {};
    if (status)          where.status = status;
    if (vehicleCategory) where.vehicleCategory = vehicleCategory;
    if (isApproved !== undefined) where.isApproved = isApproved;

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        select: SAFE_SELECT,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.driver.count({ where }),
    ]);

    return { drivers, total, page, limit };
  },

  /** Stats for dashboard */
  countByStatus: async () => {
    return prisma.driver.groupBy({ by: ['status'], _count: { _all: true } });
  },
  countByApproval: async () => {
    return prisma.driver.groupBy({ by: ['isApproved'], _count: { _all: true } });
  },
};

module.exports = DriverModel;
