import pg from 'pg';
const { Pool } = pg;

/**
 * Database connection for XPulse
 * Connects to Supabase PostgreSQL for persistent storage
 */
class Database {
  constructor() {
    // Direct connection to Supabase PostgreSQL
    // postgresql://postgres:Reefroad19642002$@db.ycjtxvabmxnxdzvogstj.supabase.co:5432/postgres
    this.pool = new Pool({
      host: 'db.ycjtxvabmxnxdzvogstj.supabase.co',
      port: 5432,
      user: 'postgres',
      password: 'Reefroad19642002$',
      database: 'postgres',
      ssl: {
        rejectUnauthorized: false
      },
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.pool.on('error', (err) => {
      console.error('❌ [DATABASE] Unexpected error on idle client', err);
    });

    console.log('✅ [DATABASE] PostgreSQL pool initialized');
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      console.log('✅ [DATABASE] Connection successful:', result.rows[0].current_time);
      client.release();
      return true;
    } catch (error) {
      console.error('❌ [DATABASE] Connection failed:', error.message);
      return false;
    }
  }

  /**
   * Initialize database schema
   */
  async initializeSchema() {
    const client = await this.pool.connect();
    try {
      console.log('🔧 [DATABASE] Initializing schema...');

      // Create tracked_users table
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

      // Create user_posts table
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

      // Create analytics_snapshots table
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

      // Create backfill_jobs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS backfill_jobs (
          id SERIAL PRIMARY KEY,
          tracked_user_id INTEGER REFERENCES tracked_users(id) ON DELETE CASCADE UNIQUE,
          status VARCHAR(50) DEFAULT 'pending',
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          tweets_fetched INTEGER DEFAULT 0,
          error_message TEXT
        );
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_posts_tracked_user_id ON user_posts(tracked_user_id);
        CREATE INDEX IF NOT EXISTS idx_user_posts_created_at ON user_posts(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_user_posts_tweet_type ON user_posts(tweet_type);
        CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_tracked_user_id ON analytics_snapshots(tracked_user_id);
        CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_snapshot_time ON analytics_snapshots(snapshot_time DESC);
        CREATE INDEX IF NOT EXISTS idx_tracked_users_username ON tracked_users(username);
      `);

      console.log('✅ [DATABASE] Schema initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ [DATABASE] Schema initialization failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add or update a tracked user
   */
  async upsertTrackedUser(userInfo) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO tracked_users (
          username, user_id, display_name, profile_image_url, verified,
          followers_count, following_count, tweet_count, description, last_updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (username)
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          profile_image_url = EXCLUDED.profile_image_url,
          verified = EXCLUDED.verified,
          followers_count = EXCLUDED.followers_count,
          following_count = EXCLUDED.following_count,
          tweet_count = EXCLUDED.tweet_count,
          description = EXCLUDED.description,
          last_updated_at = NOW(),
          is_active = true
        RETURNING *;
      `, [
        userInfo.username,
        userInfo.user_id,
        userInfo.display_name,
        userInfo.profile_image_url,
        userInfo.verified || false,
        userInfo.followers_count || 0,
        userInfo.following_count || 0,
        userInfo.tweet_count || 0,
        userInfo.description || ''
      ]);

      console.log(`✅ [DATABASE] Upserted tracked user: @${userInfo.username}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [DATABASE] Error upserting tracked user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get tracked user by username
   */
  async getTrackedUser(username) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM tracked_users WHERE username = $1',
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ [DATABASE] Error getting tracked user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Store a post (tweet)
   */
  async storePost(post, trackedUserId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO user_posts (
          tweet_id, tracked_user_id, author_username, author_user_id,
          tweet_text, tweet_type, created_at, like_count, retweet_count,
          reply_count, quote_count, impression_count, sentiment, sentiment_score,
          has_geo, geo_place_id, geo_full_name, geo_country, geo_country_code,
          author_account_age_days, is_coordinated
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (tweet_id) DO NOTHING
        RETURNING *;
      `, [
        post.tweet_id,
        trackedUserId,
        post.author_username,
        post.author_user_id,
        post.tweet_text,
        post.tweet_type,
        post.created_at,
        post.like_count || 0,
        post.retweet_count || 0,
        post.reply_count || 0,
        post.quote_count || 0,
        post.impression_count || 0,
        post.sentiment,
        post.sentiment_score,
        post.has_geo || false,
        post.geo_place_id,
        post.geo_full_name,
        post.geo_country,
        post.geo_country_code,
        post.author_account_age_days,
        post.is_coordinated || false
      ]);

      return result.rows[0];
    } catch (error) {
      if (error.code !== '23505') { // Ignore unique constraint violations
        console.error('❌ [DATABASE] Error storing post:', error);
      }
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Store analytics snapshot
   */
  async storeAnalyticsSnapshot(trackedUserId, metrics) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO analytics_snapshots (
          tracked_user_id, total_posts, posts_per_minute, virality_risk,
          authenticity_score, engagement_rate, coordinated_activity,
          account_age_risk, sentiment_positive, sentiment_neutral, sentiment_negative,
          top_countries, top_regions, us_county_bot_farms, us_heat_map_data,
          top_keywords, metrics_json
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *;
      `, [
        trackedUserId,
        metrics.totalPosts || 0,
        metrics.velocity || 0,
        metrics.viralityRisk || 0,
        metrics.authenticityScore || 0,
        metrics.engagementRate || 0,
        metrics.coordinatedActivity || 0,
        metrics.accountAgeRisk || 0,
        metrics.sentiment?.positive || 0,
        metrics.sentiment?.neutral || 0,
        metrics.sentiment?.negative || 0,
        JSON.stringify(metrics.topCountries || []),
        JSON.stringify(metrics.topRegions || []),
        JSON.stringify(metrics.usCountyBotFarms || []),
        JSON.stringify(metrics.usHeatMapData || {}),
        JSON.stringify(metrics.topKeywords || []),
        JSON.stringify(metrics)
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ [DATABASE] Error storing analytics snapshot:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get recent posts for a tracked user
   */
  async getRecentPosts(username, limit = 100) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT up.*
        FROM user_posts up
        JOIN tracked_users tu ON up.tracked_user_id = tu.id
        WHERE tu.username = $1
        ORDER BY up.created_at DESC
        LIMIT $2;
      `, [username, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ [DATABASE] Error getting recent posts:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get analytics history for a tracked user
   */
  async getAnalyticsHistory(username, limit = 100) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT a.*
        FROM analytics_snapshots a
        JOIN tracked_users tu ON a.tracked_user_id = tu.id
        WHERE tu.username = $1
        ORDER BY a.snapshot_time DESC
        LIMIT $2;
      `, [username, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ [DATABASE] Error getting analytics history:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mark backfill as started
   */
  async startBackfillJob(trackedUserId) {
    const client = await this.pool.connect();
    try {
      // Check if job exists
      const existing = await client.query(
        'SELECT * FROM backfill_jobs WHERE tracked_user_id = $1',
        [trackedUserId]
      );

      let result;
      if (existing.rows.length > 0) {
        // Update existing job
        result = await client.query(`
          UPDATE backfill_jobs
          SET status = 'in_progress', started_at = NOW(), error_message = NULL
          WHERE tracked_user_id = $1
          RETURNING *;
        `, [trackedUserId]);
      } else {
        // Insert new job
        result = await client.query(`
          INSERT INTO backfill_jobs (tracked_user_id, status, started_at)
          VALUES ($1, 'in_progress', NOW())
          RETURNING *;
        `, [trackedUserId]);
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ [DATABASE] Error starting backfill job:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mark backfill as completed
   */
  async completeBackfillJob(trackedUserId, tweetsFetched) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE backfill_jobs
        SET status = 'completed', completed_at = NOW(), tweets_fetched = $2
        WHERE tracked_user_id = $1;
      `, [trackedUserId, tweetsFetched]);

      await client.query(`
        UPDATE tracked_users
        SET backfill_completed = true, backfill_completed_at = NOW()
        WHERE id = $1;
      `, [trackedUserId]);

      console.log(`✅ [DATABASE] Backfill completed for user ID ${trackedUserId}: ${tweetsFetched} tweets`);
    } catch (error) {
      console.error('❌ [DATABASE] Error completing backfill job:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mark backfill as failed
   */
  async failBackfillJob(trackedUserId, errorMessage) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE backfill_jobs
        SET status = 'failed', completed_at = NOW(), error_message = $2
        WHERE tracked_user_id = $1;
      `, [trackedUserId, errorMessage]);

      console.error(`❌ [DATABASE] Backfill failed for user ID ${trackedUserId}: ${errorMessage}`);
    } catch (error) {
      console.error('❌ [DATABASE] Error failing backfill job:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close the pool
   */
  async close() {
    await this.pool.end();
    console.log('👋 [DATABASE] Connection pool closed');
  }
}

// Export singleton instance
export const database = new Database();
