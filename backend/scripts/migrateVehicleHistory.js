require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔧 Step 1: Creating VehicleEventType enum...');
    // Enums must be created OUTSIDE transactions
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "VehicleEventType" AS ENUM (
          'CREATED','UPDATED','STATUS_CHANGE','SERVICE',
          'OIL_CHANGE','TYRE_CHANGE','MAINTENANCE',
          'TRIP_ASSIGNED','TRIP_COMPLETED','EXPENSE_ADDED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log('✅ Enum ready.');

    console.log('🔧 Step 2: Adding cargo dimension columns to vehicles...');
    await client.query(`
      ALTER TABLE vehicles
        ADD COLUMN IF NOT EXISTS length_ft       DECIMAL(8,2) DEFAULT 0 NOT NULL,
        ADD COLUMN IF NOT EXISTS width_ft        DECIMAL(8,2) DEFAULT 0 NOT NULL,
        ADD COLUMN IF NOT EXISTS height_ft       DECIMAL(8,2) DEFAULT 0 NOT NULL,
        ADD COLUMN IF NOT EXISTS dimension_label VARCHAR(100) DEFAULT '' NOT NULL;
    `);
    console.log('✅ Dimension columns added.');

    console.log('🔧 Step 3: Creating vehicle_history table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_history (
        id               UUID          NOT NULL DEFAULT gen_random_uuid(),
        vehicle_id       UUID          NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        event_type       "VehicleEventType" NOT NULL,
        title            VARCHAR(255)  NOT NULL,
        description      TEXT          NOT NULL,
        service_date     DATE,
        cost             DECIMAL(12,2),
        previous_value   TEXT,
        new_value        TEXT,
        performed_by     VARCHAR(255)  DEFAULT 'System',
        created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT vehicle_history_pkey PRIMARY KEY (id)
      );
    `);
    console.log('✅ vehicle_history table ready.');

    console.log('🔧 Step 4: Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vh_vehicle_id   ON vehicle_history(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_vh_event_type   ON vehicle_history(event_type);
      CREATE INDEX IF NOT EXISTS idx_vh_service_date ON vehicle_history(service_date);
      CREATE INDEX IF NOT EXISTS idx_vh_created_at   ON vehicle_history(created_at DESC);
    `);
    console.log('✅ Indexes created.');

    // Seed CREATED history for all existing vehicles that have no history
    const existing = await client.query(`
      SELECT v.id, v.vehicle_name, v.vehicle_id AS vid, v.created_at
      FROM vehicles v
      WHERE NOT EXISTS (
        SELECT 1 FROM vehicle_history vh WHERE vh.vehicle_id = v.id
      )
    `);
    if (existing.rows.length > 0) {
      console.log(`🔧 Step 5: Seeding CREATED history for ${existing.rows.length} existing vehicles...`);
      for (const v of existing.rows) {
        await client.query(`
          INSERT INTO vehicle_history (vehicle_id, event_type, title, description, performed_by, created_at)
          VALUES ($1, 'CREATED'::"VehicleEventType", $2, $3, 'System', $4)
        `, [
          v.id,
          `Vehicle ${v.vid} Added to Fleet`,
          `${v.vehicle_name} (${v.vid}) was registered in the fleet management system.`,
          v.created_at,
        ]);
      }
      console.log('✅ CREATED history seeded.');
    }

    console.log('\n🎉 Migration complete!\n');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
