import pg from 'pg';
const { Pool } = pg;

// Testing: postgresql://postgres:Reefroad19642002$@db.ycjtxvabmxnxdzvogstj.supabase.co:5432/postgres
const pool = new Pool({
  host: 'db.ycjtxvabmxnxdzvogstj.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'Reefroad19642002$',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, current_database(), current_user');
    console.log('✅ Connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

testConnection();
