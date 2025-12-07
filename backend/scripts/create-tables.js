import pg from 'pg';
const { Pool } = pg;

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

async function createTables() {
  const client = await pool.connect();

  try {
    console.log('🔌 Connected to Supabase database');
    console.log('🔧 Creating tables...\n');

    // Create tracked_users table
    console.log('Creating tracked_users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tracked_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        profile_image_url TEXT,
        verified BOOLEAN DEFAULT false,
        followers_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        tweet_count INTEGER DEFAULT 0,
        description TEXT,
        first_tracked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        backfill_completed BOOLEAN DEFAULT false,
        backfill_completed_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('✅ tracked_users created');

    // Create user_posts table
    console.log('Creating user_posts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_posts (
        id SERIAL PRIMARY KEY,
        tweet_id VARCHAR(255) UNIQUE NOT NULL,
        tracked_user_id INTEGER REFERENCES tracked_users(id) ON DELETE CASCADE,
        author_username VARCHAR(255) NOT NULL,
        author_user_id VARCHAR(255) NOT NULL,
        tweet_text TEXT,
        tweet_type VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        like_count INTEGER DEFAULT 0,
        retweet_count INTEGER DEFAULT 0,
        reply_count INTEGER DEFAULT 0,
        quote_count INTEGER DEFAULT 0,
        impression_count INTEGER DEFAULT 0,
        sentiment VARCHAR(20),
        sentiment_score NUMERIC(3,2),
        has_geo BOOLEAN DEFAULT false,
        geo_place_id VARCHAR(255),
        geo_full_name VARCHAR(255),
        geo_country VARCHAR(255),
        geo_country_code VARCHAR(10),
        author_account_age_days INTEGER,
        is_coordinated BOOLEAN DEFAULT false,
        stored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ user_posts created');

    // Create analytics_snapshots table
    console.log('Creating analytics_snapshots table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_snapshots (
        id SERIAL PRIMARY KEY,
        tracked_user_id INTEGER REFERENCES tracked_users(id) ON DELETE CASCADE,
        snapshot_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        total_posts INTEGER DEFAULT 0,
        posts_per_minute NUMERIC(10,2) DEFAULT 0,
        virality_risk INTEGER DEFAULT 0,
        authenticity_score INTEGER DEFAULT 0,
        engagement_rate NUMERIC(10,4) DEFAULT 0,
        coordinated_activity INTEGER DEFAULT 0,
        account_age_risk INTEGER DEFAULT 0,
        sentiment_positive INTEGER DEFAULT 0,
        sentiment_neutral INTEGER DEFAULT 0,
        sentiment_negative INTEGER DEFAULT 0,
        top_countries JSONB,
        top_regions JSONB,
        us_county_bot_farms JSONB,
        us_heat_map_data JSONB,
        top_keywords JSONB,
        metrics_json JSONB
      );
    `);
    console.log('✅ analytics_snapshots created');

    // Create backfill_jobs table
    console.log('Creating backfill_jobs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS backfill_jobs (
        id SERIAL PRIMARY KEY,
        tracked_user_id INTEGER UNIQUE REFERENCES tracked_users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        tweets_fetched INTEGER DEFAULT 0,
        error_message TEXT
      );
    `);
    console.log('✅ backfill_jobs created');

    // Create indexes
    console.log('\nCreating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_posts_tracked_user_id ON user_posts(tracked_user_id);
      CREATE INDEX IF NOT EXISTS idx_user_posts_created_at ON user_posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_posts_tweet_type ON user_posts(tweet_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_tracked_user_id ON analytics_snapshots(tracked_user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_snapshot_time ON analytics_snapshots(snapshot_time DESC);
      CREATE INDEX IF NOT EXISTS idx_tracked_users_username ON tracked_users(username);
    `);
    console.log('✅ Indexes created');

    console.log('\n✅ ALL TABLES CREATED SUCCESSFULLY!\n');

    // Show tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('tracked_users', 'user_posts', 'analytics_snapshots', 'backfill_jobs')
      ORDER BY table_name;
    `);

    console.log('📊 Tables in database:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    client.release();
    await pool.end();
    console.log('\n🎉 Database is ready for backfill!');

  } catch (error) {
    console.error('\n❌ Error creating tables:', error.message);
    console.error(error);
    client.release();
    await pool.end();
    process.exit(1);
  }
}

createTables();
