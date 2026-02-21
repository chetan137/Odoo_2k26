require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createFirstAdmin() {
  const name = 'Global Admin';
  const email = 'admin@fleetos.com'; // Change this to your email
  const password = 'AdminPassword123!'; // Change this to your password

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await prisma.user.create({
      data: {
        employeeId: 'EMP-0001',
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    });
    console.log('✅ Admin created successfully!');
    console.log('Email:', email);
    console.log('ID:', admin.employeeId);
  } catch (err) {
    if (err.code === 'P2002') {
      console.log('❌ Admin already exists.');
    } else {
      console.error('❌ Error:', err);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createFirstAdmin();
