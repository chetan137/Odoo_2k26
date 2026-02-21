require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log('🗑  Dropping old vehicles table...');
    // Remove FK from trips first, then drop vehicles
    await client.query(`ALTER TABLE trips DROP COLUMN IF EXISTS vehicle_id;`);
    await client.query(`DROP TABLE IF EXISTS "vehicles" CASCADE;`);
    console.log('✅ Old table dropped.');

    // ALTER TYPE must run OUTSIDE a transaction
    console.log('🔧 Ensuring VehicleStatus enum...');
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VehicleStatus') THEN
          CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'IN_SHOP');
        END IF;
      END $$;
    `);
    await client.query(`ALTER TYPE "VehicleCategory" ADD VALUE IF NOT EXISTS 'CONTAINER';`);
    console.log('✅ Enums ready.');

    // Now create the table with correct columns in a fresh transaction
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE "vehicles" (
        "id"               UUID           NOT NULL DEFAULT gen_random_uuid(),
        "vehicle_id"       TEXT           NOT NULL,
        "vehicle_name"     VARCHAR(150)   NOT NULL,
        "license_plate"    VARCHAR(20)    NOT NULL,
        "category"         "VehicleCategory" NOT NULL,
        "max_capacity"     INTEGER        NOT NULL,
        "current_odometer" INTEGER        NOT NULL DEFAULT 0,
        "status"           "VehicleStatus"   NOT NULL DEFAULT 'AVAILABLE',
        "acquisition_cost" DECIMAL(12,2)  NOT NULL,
        "created_at"       TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMPTZ    NOT NULL DEFAULT now(),
        CONSTRAINT "vehicles_pkey"              PRIMARY KEY ("id"),
        CONSTRAINT "vehicles_vehicle_id_key"    UNIQUE ("vehicle_id"),
        CONSTRAINT "vehicles_license_plate_key" UNIQUE ("license_plate")
      );
    `);
    await client.query(`
      ALTER TABLE "trips"
      ADD COLUMN IF NOT EXISTS "vehicle_id" UUID REFERENCES "vehicles"("id") ON DELETE SET NULL;
    `);
    await client.query('COMMIT');
    console.log('✅ New vehicles table created with correct schema.');

    // Seed data
    console.log('\n🚛 Seeding 10 demo vehicles...\n');
    const vehicles = [
      { vid: 'VHL-0001', name: 'Toyota Hilux Pickup',     plate: 'MH-12-AB-1001', cat: 'LIGHT',     cap: 1000,  odo: 12450,  status: 'AVAILABLE', cost: 950000 },
      { vid: 'VHL-0002', name: 'Ford Ranger LT',          plate: 'DL-01-CX-2202', cat: 'LIGHT',     cap: 1500,  odo: 8750,   status: 'AVAILABLE', cost: 1150000 },
      { vid: 'VHL-0003', name: 'Mahindra Bolero Pickup',  plate: 'KA-05-MN-3303', cat: 'LIGHT',     cap: 2000,  odo: 27800,  status: 'ON_TRIP',   cost: 720000 },
      { vid: 'VHL-0004', name: 'Tata Ace EX2',            plate: 'GJ-03-PQ-4404', cat: 'MEDIUM',    cap: 3500,  odo: 41200,  status: 'AVAILABLE', cost: 1800000 },
      { vid: 'VHL-0005', name: 'Eicher Pro 2049',         plate: 'RJ-14-RS-5505', cat: 'MEDIUM',    cap: 5000,  odo: 63400,  status: 'AVAILABLE', cost: 2250000 },
      { vid: 'VHL-0006', name: 'Ashok Leyland Dost+',     plate: 'UP-80-TU-6606', cat: 'MEDIUM',    cap: 6000,  odo: 88100,  status: 'IN_SHOP',   cost: 2050000 },
      { vid: 'VHL-0007', name: 'TATA LPT 3118 Heavy',     plate: 'TN-09-VW-7707', cat: 'HEAVY',     cap: 10000, odo: 115600, status: 'AVAILABLE', cost: 4500000 },
      { vid: 'VHL-0008', name: 'Bharat Benz 2823R',       plate: 'MP-04-XY-8808', cat: 'HEAVY',     cap: 12000, odo: 78300,  status: 'AVAILABLE', cost: 5200000 },
      { vid: 'VHL-0009', name: 'Volvo FM 440 Truck',      plate: 'HR-55-YZ-9909', cat: 'HEAVY',     cap: 15000, odo: 220000, status: 'AVAILABLE', cost: 8900000 },
      { vid: 'VHL-0010', name: 'Volvo FH 40FT Container', plate: 'MH-06-ZA-0010', cat: 'CONTAINER', cap: 28000, odo: 190500, status: 'AVAILABLE', cost: 14500000 },
    ];

    for (const v of vehicles) {
      const res = await client.query(`
        INSERT INTO "vehicles"
          (id, vehicle_id, vehicle_name, license_plate, category, max_capacity, current_odometer, status, acquisition_cost, created_at, updated_at)
        VALUES
          (gen_random_uuid(), $1, $2, $3, $4::"VehicleCategory", $5, $6, $7::"VehicleStatus", $8, now(), now())
        ON CONFLICT (vehicle_id) DO NOTHING
        RETURNING vehicle_id;
      `, [v.vid, v.name, v.plate, v.cat, v.cap, v.odo, v.status, v.cost]);

      console.log(`  ${res.rowCount > 0 ? '✅' : '⏭ '} ${v.vid}  ${v.name.padEnd(32)} [${v.cat.padEnd(9)}] ${v.status}`);
    }

    // Summary
    const statusRes = await client.query(`SELECT status::text, COUNT(*)::int AS cnt FROM "vehicles" GROUP BY status ORDER BY status;`);
    const catRes    = await client.query(`SELECT category::text, COUNT(*)::int AS cnt FROM "vehicles" GROUP BY category ORDER BY category;`);
    const total     = await client.query(`SELECT COUNT(*)::int AS cnt FROM "vehicles";`);

    console.log('\n──────────────────────────────────────────────────────────');
    console.log(`📦 Total vehicles in DB: ${total.rows[0].cnt}`);
    console.log('\n📊 Fleet Status:');
    statusRes.rows.forEach(r => console.log(`   ${r.status.padEnd(12)} → ${r.cnt} vehicle(s)`));
    console.log('\n🚛 Fleet by Category:');
    catRes.rows.forEach(r => console.log(`   ${r.category.padEnd(12)} → ${r.cnt} vehicle(s)`));
    const available = statusRes.rows.find(r => r.status === 'AVAILABLE')?.cnt || 0;
    const pct = Math.round((available / total.rows[0].cnt) * 100);
    console.log(`\n🟢 Availability rate: ${pct}% (target ≥ 70%) ${pct >= 70 ? '✅' : '❌'}`);

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
