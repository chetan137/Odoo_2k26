/**
 * Admin Seeder Script
 *
 * Creates the initial ADMIN account securely.
 * ⚠️  Run ONCE only. If admin already exists, it will skip creation.
 *
 * Usage:
 *   node scripts/seedAdmin.js
 *
 * Or with custom credentials via env:
 *   ADMIN_EMAIL=admin@fleet.com ADMIN_PASSWORD=Fleet@Admin1 node scripts/seedAdmin.js
 */

require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Fleet Administrator';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@fleetmanager.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'FleetAdmin@2024';

async function main() {
  console.log('\n🌱 Fleet Management — Admin Seeder\n');
  console.log(`📧 Email: ${ADMIN_EMAIL}`);

  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`\n⚠️  Admin account already exists (ID: ${existing.id})`);
    console.log(`   EmployeeId: ${existing.employeeId}`);
    console.log(`   Role: ${existing.role}`);
    console.log('\nSeeder aborted — no changes made.\n');
    return;
  }

  // Generate employeeId for admin (first user gets EMP-0001)
  const lastUser = await prisma.user.findFirst({
    orderBy: { employeeId: 'desc' },
    select: { employeeId: true },
    where: { employeeId: { startsWith: 'EMP-' } },
  });

  let nextNum = 1;
  if (lastUser?.employeeId) {
    const parsed = parseInt(lastUser.employeeId.replace('EMP-', ''), 10);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }
  const employeeId = `EMP-${String(nextNum).padStart(4, '0')}`;

  // Hash password
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Create ADMIN user
  const admin = await prisma.user.create({
    data: {
      employeeId,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('\n✅ Admin account created successfully!');
  console.log('─'.repeat(40));
  console.log(`   ID:         ${admin.id}`);
  console.log(`   EmployeeId: ${admin.employeeId}`);
  console.log(`   Name:       ${admin.name}`);
  console.log(`   Email:      ${admin.email}`);
  console.log(`   Role:       ${admin.role}`);
  console.log(`   Password:   ${ADMIN_PASSWORD}`);
  console.log('─'.repeat(40));
  console.log('\n⚠️  Store these credentials securely and delete this log!\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeder failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
