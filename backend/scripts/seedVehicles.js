require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Direct raw SQL seed — bypasses Prisma model mapping issues
const vehicles = [
  // LIGHT
  { vid: 'VHL-0001', name: 'Toyota Hilux (Light)',       plate: 'MH-12-AB-1001', cat: 'LIGHT',     cap: 1000,  odo: 12450,  status: 'AVAILABLE', cost: 950000.00 },
  { vid: 'VHL-0002', name: 'Ford Ranger LT',             plate: 'DL-01-CX-2202', cat: 'LIGHT',     cap: 1500,  odo: 8750,   status: 'AVAILABLE', cost: 1150000.00 },
  { vid: 'VHL-0003', name: 'Mahindra Bolero Pickup',     plate: 'KA-05-MN-3303', cat: 'LIGHT',     cap: 2000,  odo: 27800,  status: 'ON_TRIP',   cost: 720000.00 },
  // MEDIUM
  { vid: 'VHL-0004', name: 'Tata Ace EX2',               plate: 'GJ-03-PQ-4404', cat: 'MEDIUM',    cap: 3500,  odo: 41200,  status: 'AVAILABLE', cost: 1800000.00 },
  { vid: 'VHL-0005', name: 'Eicher Pro 2049',            plate: 'RJ-14-RS-5505', cat: 'MEDIUM',    cap: 5000,  odo: 63400,  status: 'AVAILABLE', cost: 2250000.00 },
  { vid: 'VHL-0006', name: 'Ashok Leyland Dost+',        plate: 'UP-80-TU-6606', cat: 'MEDIUM',    cap: 6000,  odo: 88100,  status: 'IN_SHOP',   cost: 2050000.00 },
  // HEAVY
  { vid: 'VHL-0007', name: 'TATA LPT 3118',              plate: 'TN-09-VW-7707', cat: 'HEAVY',     cap: 10000, odo: 115600, status: 'AVAILABLE', cost: 4500000.00 },
  { vid: 'VHL-0008', name: 'Bharat Benz 2823R',          plate: 'MP-04-XY-8808', cat: 'HEAVY',     cap: 12000, odo: 78300,  status: 'AVAILABLE', cost: 5200000.00 },
  { vid: 'VHL-0009', name: 'Volvo FM 440 Truck',         plate: 'HR-55-YZ-9909', cat: 'HEAVY',     cap: 15000, odo: 220000, status: 'AVAILABLE', cost: 8900000.00 },
  // CONTAINER
  { vid: 'VHL-0010', name: 'Volvo FH 40FT Container',   plate: 'MH-06-ZA-0010', cat: 'CONTAINER', cap: 28000, odo: 190500, status: 'AVAILABLE', cost: 14500000.00 },
];

async function seed() {
  console.log('🚛 Seeding fleet vehicles via raw SQL...\n');

  for (const v of vehicles) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO vehicles (id, vehicle_id, vehicle_name, license_plate, category, max_capacity, current_odometer, status, acquisition_cost, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4::\"VehicleCategory\", $5, $6, $7::\"VehicleStatus\", $8, now(), now())
        ON CONFLICT (vehicle_id) DO NOTHING;
      `, v.vid, v.name, v.plate, v.cat, v.cap, v.odo, v.status, v.cost);
      console.log(`  ✅ ${v.vid}  ${v.name.padEnd(35)} [${v.cat.padEnd(9)}] ${v.status}`);
    } catch (err) {
      console.error(`  ❌ ${v.vid} failed: ${err.message}`);
    }
  }

  // Summary
  const rows = await prisma.$queryRawUnsafe(`
    SELECT status, COUNT(*) as count FROM vehicles GROUP BY status ORDER BY status;
  `);
  const cats = await prisma.$queryRawUnsafe(`
    SELECT category, COUNT(*) as count FROM vehicles GROUP BY category ORDER BY category;
  `);

  console.log('\n──────────────────────────────────────────────────────');
  console.log('✔  Seeding complete!');
  console.log('\n📊 Fleet by Status:');
  rows.forEach(r => console.log(`   ${r.status.padEnd(12)} → ${r.count} vehicles`));
  console.log('\n🚛 Fleet by Category:');
  cats.forEach(c => console.log(`   ${c.category.padEnd(12)} → ${c.count} vehicles`));

  await prisma.$disconnect();
}

seed().catch(async (err) => {
  console.error('❌ Seed failed:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});
