-- XPulse Database Schema
-- Stores historical tracking data and enables backfilling

-- Table: tracked_users
-- Stores users that are being monitored
CREATE TABLE IF NOT EXISTS tracked_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) UNIQUE NOT NULL, -- X/Twitter user ID
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
  backfill_completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT tracked_users_username_key UNIQUE (username)
);

-- Table: user_posts
-- Stores historical posts (tweets) for tracked users
CREATE TABLE IF NOT EXISTS user_posts (
  id SERIAL PRIMARY KEY,
  tweet_id VARCHAR(255) UNIQUE NOT NULL,
  tracked_user_id INTEGER REFERENCES tracked_users(id) ON DELETE CASCADE,
  author_username VARCHAR(255) NOT NULL, -- Can be different from tracked user (mentions, replies)
  author_user_id VARCHAR(255) NOT NULL,
  tweet_text TEXT,
  tweet_type VARCHAR(50), -- 'own_post', 'mention', 'reply', 'quote'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  like_count INTEGER DEFAULT 0,
  retweet_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  quote_count INTEGER DEFAULT 0,
  impression_count INTEGER DEFAULT 0,
  sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
  sentiment_score NUMERIC(3,2), -- -1.00 to 1.00
  has_geo BOOLEAN DEFAULT false,
  geo_place_id VARCHAR(255),
  geo_full_name VARCHAR(255),
  geo_country VARCHAR(255),
  geo_country_code VARCHAR(10),
  author_account_age_days INTEGER,
  is_coordinated BOOLEAN DEFAULT false,
  stored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_posts_tweet_id_key UNIQUE (tweet_id)
);

-- Table: analytics_snapshots
-- Stores periodic snapshots of analytics metrics
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
  top_countries JSONB, -- [{country, count, sentiment_score}, ...]
  top_regions JSONB,
  us_county_bot_farms JSONB, -- [{location, state, score, posts, accounts}, ...]
  us_heat_map_data JSONB, -- {state_code: score}
  top_keywords JSONB, -- [{word, count}, ...]
  metrics_json JSONB -- Full metrics object for flexibility
);

-- Table: backfill_jobs
-- Tracks backfill operations for each user
CREATE TABLE IF NOT EXISTS backfill_jobs (
  id SERIAL PRIMARY KEY,
  tracked_user_id INTEGER REFERENCES tracked_users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  tweets_fetched INTEGER DEFAULT 0,
  error_message TEXT,
  CONSTRAINT backfill_jobs_tracked_user_id_key UNIQUE (tracked_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_posts_tracked_user_id ON user_posts(tracked_user_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_created_at ON user_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_posts_tweet_type ON user_posts(tweet_type);
CREATE INDEX IF NOT EXISTS idx_user_posts_sentiment ON user_posts(sentiment);
CREATE INDEX IF NOT EXISTS idx_user_posts_author_username ON user_posts(author_username);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_tracked_user_id ON analytics_snapshots(tracked_user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_snapshot_time ON analytics_snapshots(snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_tracked_users_username ON tracked_users(username);
CREATE INDEX IF NOT EXISTS idx_tracked_users_is_active ON tracked_users(is_active);

-- View: recent_user_activity
-- Quick access to recent posts for each tracked user
CREATE OR REPLACE VIEW recent_user_activity AS
SELECT
  tu.username as tracked_username,
  up.tweet_id,
  up.author_username,
  up.tweet_text,
  up.tweet_type,
  up.created_at,
  up.sentiment,
  up.like_count + up.retweet_count + up.reply_count + up.quote_count as total_engagement,
  up.geo_full_name
FROM user_posts up
JOIN tracked_users tu ON up.tracked_user_id = tu.id
WHERE tu.is_active = true
ORDER BY up.created_at DESC;

-- View: user_analytics_summary
-- Latest analytics for each tracked user
CREATE OR REPLACE VIEW user_analytics_summary AS
SELECT DISTINCT ON (tracked_user_id)
  tu.username,
  tu.display_name,
  a.snapshot_time,
  a.total_posts,
  a.virality_risk,
  a.authenticity_score,
  a.engagement_rate,
  a.coordinated_activity,
  a.account_age_risk,
  a.sentiment_positive,
  a.sentiment_neutral,
  a.sentiment_negative
FROM analytics_snapshots a
JOIN tracked_users tu ON a.tracked_user_id = tu.id
ORDER BY tracked_user_id, snapshot_time DESC;

COMMENT ON TABLE tracked_users IS 'Stores users that are being monitored by XPulse';
COMMENT ON TABLE user_posts IS 'Historical posts (tweets) for tracked users including mentions, replies, quotes';
COMMENT ON TABLE analytics_snapshots IS 'Periodic snapshots of analytics metrics for time-series analysis';
COMMENT ON TABLE backfill_jobs IS 'Tracks historical data backfill operations for each user';
