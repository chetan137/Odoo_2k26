require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  const cols = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='vehicles' ORDER BY ordinal_position;`
  );
  console.log('vehicles columns:');
  cols.rows.forEach(r => console.log(' -', r.column_name, ':', r.data_type));
  client.release();
  await pool.end();
}
check().catch(e => { console.error(e.message); process.exit(1); });
