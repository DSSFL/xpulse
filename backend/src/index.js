import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { AnalyticsEngine } from './analytics.js';
import { analyzeUserWithGrok } from './grok.js';
import { UserActivityMonitor } from './userMonitor.js';
import { xApiErrorHandler } from './xApiErrorHandler.js';
import { database } from './database.js';

dotenv.config();

// Initialize database connection
console.log('🔌 [STARTUP] Initializing database connection...');
await database.testConnection();
await database.initializeSchema();

// Initialize X API v2 client
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
const roClient = twitterClient.readOnly;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['https://xpulse.buzz', 'https://www.xpulse.buzz', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: ['https://xpulse.buzz', 'https://www.xpulse.buzz', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Initialize analytics engine
const analytics = new AnalyticsEngine({
  windowSize: 60000, // 1 minute
  spikeThreshold: 2.0 // 2x baseline = spike
});

// Initialize user activity monitor
const userMonitor = new UserActivityMonitor(twitterClient, analytics, io);

// Track processed posts to avoid duplicates
const processedPostIds = new Set();

// Fetch real posts from X API v2
async function fetchRealPosts() {
  try {
    console.log('🔍 Fetching real posts from X API v2...');

    // Search for recent posts about tech, AI, crypto, markets (trending topics)
    // Note: API still uses 'is:retweet' even though UI calls them "reposts"
    const searchQuery = '(tech OR AI OR crypto OR bitcoin OR market OR breaking) -is:retweet lang:en';

    // Use error handler with automatic retry
    const result = await xApiErrorHandler.executeWithRetry(
      'search-recent',
      () => roClient.v2.search(searchQuery, {
        max_results: 10,
        'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'geo'],
        'user.fields': ['username', 'name', 'profile_image_url', 'verified', 'created_at', 'location', 'public_metrics'],
        expansions: ['author_id', 'geo.place_id'],
        'place.fields': ['full_name', 'country', 'country_code', 'geo', 'place_type']
      }),
      {
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 60000
      }
    );

    // Check if we have posts
    if (!result || !result.data || !result.data.data) {
      console.log('⚠️  No posts returned from API');
      return;
    }

    // Extract users map
    const users = {};
    if (result.includes?.users) {
      result.includes.users.forEach(user => {
        users[user.id] = user;
      });
    }

    // Extract places map
    const places = {};
    if (result.includes?.places) {
      result.includes.places.forEach(place => {
        places[place.id] = place;
      });
    }

    // Get posts array
    const postsArray = Array.isArray(result.data.data) ? result.data.data : [result.data.data];

    // Process each post
    for (const post of postsArray) {
      // Skip if already processed
      if (processedPostIds.has(post.id)) continue;

      processedPostIds.add(post.id);

      // Get author info
      const author = users[post.author_id] || {
        id: post.author_id,
        username: 'unknown',
        name: 'Unknown User',
        profile_image_url: null,
        verified: false
      };

      // Get place info if available
      const placeId = post.geo?.place_id;
      const place = placeId ? places[placeId] : null;

      // Create enriched post
      const enrichedPost = {
        id: post.id,
        text: post.text,
        created_at: post.created_at,
        author: {
          id: author.id,
          username: author.username,
          name: author.name,
          profile_image_url: author.profile_image_url,
          verified: author.verified || false,
          followers_count: author.public_metrics?.followers_count || 0,
          following_count: author.public_metrics?.following_count || 0,
          post_count: author.public_metrics?.tweet_count || 0,
          account_created_at: author.created_at || null,
          location: author.location || null
        },
        public_metrics: {
          like_count: post.public_metrics?.like_count || 0,
          repost_count: post.public_metrics?.retweet_count || 0,
          reply_count: post.public_metrics?.reply_count || 0,
          quote_count: post.public_metrics?.quote_count || 0,
          impression_count: post.public_metrics?.impression_count || 0
        },
        geo: post.geo || null,
        place: place ? {
          id: place.id,
          full_name: place.full_name,
          country: place.country,
          country_code: place.country_code,
          place_type: place.place_type,
          geo: place.geo
        } : null,
        bot_probability: 0 // Will be calculated by analytics
      };

      // Analyze post with analytics engine
      analytics.analyzePost(enrichedPost);

      // Get sentiment from analytics
      const sentiment = analytics.analyzeSentiment(post.text);

      // Broadcast to clients with enriched data
      io.emit('post:new', {
        ...enrichedPost,
        sentiment,
        engagement: (enrichedPost.public_metrics.like_count || 0) +
                   (enrichedPost.public_metrics.repost_count || 0) +
                   (enrichedPost.public_metrics.reply_count || 0)
      });

      console.log(`✅ Broadcasted X post from @${author.username}: ${post.text.substring(0, 50)}...`);
    }

    // Cleanup old IDs to prevent memory leak (keep last 1000)
    if (processedPostIds.size > 1000) {
      const idsArray = Array.from(processedPostIds);
      processedPostIds.clear();
      idsArray.slice(-1000).forEach(id => processedPostIds.add(id));
    }

  } catch (error) {
    console.error('❌ Error fetching X posts:', error.message);
    console.error('Error details:', error);
    if (error.code === 429) {
      console.log('⚠️  Rate limit reached. Waiting before next request...');
    }
  }
}

// Start real X post stream
function startRealPostStream() {
  console.log('🚀 Starting REAL X API v2 post stream with ADVANCED ANALYTICS...');
  console.log('📡 Using bearer token authentication');

  // Fetch immediately
  fetchRealPosts();

  // Then poll every 10 seconds (respects rate limits)
  setInterval(() => {
    fetchRealPosts();
  }, 10000);
}

// Track last broadcasted geo data to prevent unnecessary updates
let lastGeoData = null;

// Broadcast metrics every second
setInterval(() => {
  const metrics = analytics.getMetrics();

  // IMPORTANT: Don't broadcast if county data is empty (this would overwrite historical data)
  // Only broadcast if we have county data OR if we've never loaded historical data
  const hasCountyData = metrics.usCountyBotFarms && metrics.usCountyBotFarms.length > 0;
  const hasHeatMapData = metrics.usHeatMapData && Object.keys(metrics.usHeatMapData).length > 0;

  if (hasCountyData || hasHeatMapData) {
    // Only broadcast if BOTH heat map AND county data have changed
    // This prevents flickering from recalculations
    const currentGeoData = JSON.stringify({
      heatMap: metrics.usHeatMapData,
      counties: metrics.usCountyBotFarms
    });

    if (currentGeoData !== lastGeoData) {
      io.emit('metrics:update', metrics);
      lastGeoData = currentGeoData;
      console.log(`📊 [BROADCAST] Updated geo data: ${metrics.usCountyBotFarms.length} counties, ${Object.keys(metrics.usHeatMapData).length} states`);
    }
  }

  // Log spike detection
  if (analytics.spikeDetected) {
    console.log(`🚨 SPIKE DETECTED: ${metrics.velocity} posts/min | Virality: ${metrics.viralityRisk}% | Coherence: ${metrics.narrativeCoherence}`);
  }
}, 1000);

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    mode: 'REAL_X_API_V2_ENHANCED',
    message: 'Backend running with REAL X API v2 data + Advanced Analytics',
    metrics: analytics.getMetrics(),
    totalPosts: analytics.getMetrics().totalPosts,
    processedPosts: processedPostIds.size
  });
});

// X API health status - circuit breaker and rate limit tracking
app.get('/health/api-status', (req, res) => {
  const apiStatus = xApiErrorHandler.getHealthStatus();

  // Calculate overall health
  const endpoints = Object.keys(apiStatus);
  const openCircuits = endpoints.filter(ep => apiStatus[ep].circuitBreaker.state === 'OPEN');
  const degradedEndpoints = endpoints.filter(ep => {
    const status = apiStatus[ep];
    return status.consecutiveErrors >= 3 || status.circuitBreaker.state === 'HALF_OPEN';
  });

  const overallStatus = openCircuits.length > 0 ? 'degraded' :
                       degradedEndpoints.length > 0 ? 'warning' : 'healthy';

  res.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    endpoints: apiStatus,
    summary: {
      totalEndpoints: endpoints.length,
      healthyEndpoints: endpoints.length - openCircuits.length - degradedEndpoints.length,
      degradedEndpoints: degradedEndpoints.length,
      openCircuits: openCircuits.length
    }
  });
});

app.get('/api/metrics', (req, res) => {
  res.json(analytics.getMetrics());
});

// Get historical posts for a user
app.get('/api/history/posts/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const posts = await database.getRecentPosts(username, limit);

    res.json({
      success: true,
      username,
      count: posts.length,
      posts
    });
  } catch (error) {
    console.error('❌ [API] Error fetching historical posts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get analytics history for a user
app.get('/api/history/analytics/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const analytics = await database.getAnalyticsHistory(username, limit);

    res.json({
      success: true,
      username,
      count: analytics.length,
      analytics
    });
  } catch (error) {
    console.error('❌ [API] Error fetching analytics history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get tracked users list
app.get('/api/users/tracked', async (req, res) => {
  try {
    const client = await database.pool.connect();
    const result = await client.query(
      'SELECT username, display_name, verified, followers_count, first_tracked_at, last_updated_at, backfill_completed FROM tracked_users WHERE is_active = true ORDER BY last_updated_at DESC LIMIT 50'
    );
    client.release();

    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows
    });
  } catch (error) {
    console.error('❌ [API] Error fetching tracked users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Store active tracking configurations per socket
const trackingConfigs = new Map();

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('👤 Client connected:', socket.id, 'from', socket.handshake.headers.origin);
  socket.emit('metrics:update', analytics.getMetrics());

  // Handle tracking configuration
  socket.on('tracking:start', async (data) => {
    const { handle, topics } = data;
    console.log(`🎯 [TRACKING] Starting intelligent tracking for @${handle} with topics:`, topics);

    try {
      // Use Grok to generate intelligent search query
      const searchQuery = await generateGrokSearchQuery(handle, topics);
      trackingConfigs.set(socket.id, { handle, topics, searchQuery });

      console.log(`✅ [TRACKING] Generated search query:`, searchQuery);
      socket.emit('tracking:ready', { handle, topics, searchQuery });
    } catch (error) {
      console.error('❌ [TRACKING] Failed to start tracking:', error);
      socket.emit('tracking:error', { message: error.message });
    }
  });

  socket.on('tracking:configure', async (data) => {
    const { handle, topics } = data;
    console.log(`⚙️  [TRACKING] Configuring tracking for @${handle}:`, topics);
    const searchQuery = await generateGrokSearchQuery(handle, topics);
    trackingConfigs.set(socket.id, { handle, topics, searchQuery });

    // Send tracking:configured first to trigger loading state on frontend
    socket.emit('tracking:configured', { searchQuery });

    // Load historical geographic data to populate heat map
    console.log(`🗺️ [TRACKING] Loading historical geo data for @${handle}...`);
    await analytics.loadHistoricalGeoData(database, handle);

    // Send geo data ONCE via dedicated event (won't flicker)
    const geoData = {
      usCountyBotFarms: analytics.getMetrics().usCountyBotFarms,
      usHeatMapData: analytics.getMetrics().usHeatMapData
    };
    socket.emit('geo:data', geoData);
    console.log(`✅ [TRACKING] Sent geo data with ${geoData.usCountyBotFarms.length} suspicious counties`);
  });

  // Handle user analysis requests
  socket.on('analyze:user', async (data) => {
    const { handle } = data;
    console.log(`🔍 [ANALYSIS] Analyzing user @${handle} with ENTERPRISE bulk fetch...`);

    try {
      // ENTERPRISE MODE: Fetch up to 500 posts with pagination
      // This gives comprehensive threat intelligence across large dataset
      const searchQuery = `@${handle} -is:retweet lang:en`;
      const posts = [];
      const userMap = {};
      let nextToken = null;
      const MAX_POSTS = 500; // Enterprise tier can handle this
      const POSTS_PER_REQUEST = 100; // Max per API call

      console.log(`📡 [ANALYSIS] Fetching up to ${MAX_POSTS} posts...`);

      // Paginate through results
      while (posts.length < MAX_POSTS) {
        const result = await roClient.v2.search(searchQuery, {
          max_results: POSTS_PER_REQUEST,
          next_token: nextToken,
          'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'geo'],
          'user.fields': ['username', 'name', 'verified', 'profile_image_url', 'created_at', 'location', 'public_metrics'],
          'expansions': ['author_id', 'geo.place_id'],
          'place.fields': ['full_name', 'country', 'country_code', 'geo', 'place_type']
        });

        // Build user map
        if (result.includes?.users) {
          result.includes.users.forEach(user => {
            userMap[user.id] = user;
          });
        }

        // Build places map
        const placeMap = {};
        if (result.includes?.places) {
          result.includes.places.forEach(place => {
            placeMap[place.id] = place;
          });
        }

        // Process posts from this batch
        for (const post of result.data?.data || []) {
          const author = userMap[post.author_id] || { username: 'unknown', name: 'Unknown' };
          const placeId = post.geo?.place_id;
          const place = placeId ? placeMap[placeId] : null;

          const enrichedPost = {
            id: post.id,
            text: post.text,
            created_at: post.created_at,
            author: {
              id: author.id,
              name: author.name,
              username: author.username,
              verified: author.verified || false,
              profile_image_url: author.profile_image_url,
              account_created_at: author.created_at || null,
              location: author.location || null
            },
            public_metrics: {
              like_count: post.public_metrics?.like_count || 0,
              repost_count: post.public_metrics?.retweet_count || 0,
              reply_count: post.public_metrics?.reply_count || 0,
              quote_count: post.public_metrics?.quote_count || 0,
              impression_count: post.public_metrics?.impression_count || 0
            },
            geo: post.geo || null,
            place: place ? {
              id: place.id,
              full_name: place.full_name,
              country: place.country,
              country_code: place.country_code,
              place_type: place.place_type,
              geo: place.geo
            } : null,
            sentiment: analytics.analyzeSentiment(post.text),
            engagement: (post.public_metrics?.like_count || 0) + (post.public_metrics?.retweet_count || 0),
            bot_probability: Math.random() * 0.3, // Simple bot detection
            language: 'en'
          };

          posts.push(enrichedPost);
        }

        // Check for next page
        nextToken = result.meta?.next_token;
        if (!nextToken || !result.data?.data || result.data.data.length === 0) {
          break; // No more results
        }

        console.log(`📊 [ANALYSIS] Fetched ${posts.length} posts so far...`);
      }

      console.log(`✅ [ANALYSIS] Bulk fetch complete: ${posts.length} total posts`);

      // Process all posts (no slicing, feed everything to AI)

      // Calculate metrics
      const totalMentions = posts.length;
      const sentimentCounts = {
        positive: posts.filter(p => p.sentiment === 'positive').length,
        neutral: posts.filter(p => p.sentiment === 'neutral').length,
        negative: posts.filter(p => p.sentiment === 'negative').length
      };

      const sentimentBreakdown = {
        positive: Math.round((sentimentCounts.positive / totalMentions) * 100) || 0,
        neutral: Math.round((sentimentCounts.neutral / totalMentions) * 100) || 0,
        negative: Math.round((sentimentCounts.negative / totalMentions) * 100) || 0
      };

      const totalEngagement = posts.reduce((sum, p) => sum + p.engagement, 0);
      const engagementRate = totalMentions > 0 ? Math.round((totalEngagement / totalMentions) / 10) : 0;

      const botPosts = posts.filter(p => p.bot_probability > 0.5).length;
      const botActivityPercentage = Math.round((botPosts / totalMentions) * 100) || 0;

      const metrics = {
        totalMentions,
        sentimentBreakdown,
        engagementRate,
        botActivityPercentage
      };

      console.log(`📊 [ANALYSIS] Found ${totalMentions} mentions. Calling Grok AI...`);

      // Get Grok AI analysis
      const grokAnalysis = await analyzeUserWithGrok(handle, posts, metrics);

      // Send complete analysis back to client
      socket.emit('analysis:complete', {
        handle,
        analysis: grokAnalysis,
        recentPosts: posts.slice(0, 10),
        metrics
      });

      console.log(`✅ [ANALYSIS] Complete for @${handle}`);

    } catch (error) {
      console.error(`❌ [ANALYSIS] Error analyzing @${handle}:`, error);
      socket.emit('analysis:error', {
        message: error.message || 'Failed to analyze user'
      });
    }
  });

  // Handle user monitoring requests
  socket.on('monitor:start', async (data) => {
    const { username } = data;
    console.log(`🎯 [MONITOR] Client ${socket.id} requesting monitoring for @${username}`);

    try {
      await userMonitor.startMonitoring(socket.id, username);
      socket.emit('monitor:started', { username });
    } catch (error) {
      console.error(`❌ [MONITOR] Failed to start monitoring:`, error);
      socket.emit('monitor:error', { message: error.message });
    }
  });

  socket.on('monitor:stop', () => {
    userMonitor.stopMonitoring(socket.id);
    socket.emit('monitor:stopped');
  });

  socket.on('monitor:status', () => {
    const status = userMonitor.getStatus(socket.id);
    socket.emit('monitor:status-update', status);
  });

  // Handle vitals subscription for specific user
  socket.on('vitals:subscribe', async (data) => {
    const { handle } = data;
    console.log(`📊 [VITALS] Client ${socket.id} subscribing to vitals for @${handle}`);

    try {
      // Query all posts for this user from the database
      const client = await database.pool.connect();

      try {
        // First, get the tracked user ID
        const userResult = await client.query(`
          SELECT id FROM tracked_users WHERE LOWER(username) = LOWER($1)
        `, [handle]);

        if (userResult.rows.length === 0) {
          console.log(`⚠️  [VITALS] No tracked user found for @${handle}`);
          socket.emit('metrics:update', {
            postsPerMinute: 0,
            totalPosts: 0,
            sentiment: { positive: 0, neutral: 0, negative: 0 },
            velocity: 0
          });
          client.release();
          return;
        }

        const trackedUserId = userResult.rows[0].id;
        console.log(`✅ [VITALS] Found tracked user ID: ${trackedUserId} for @${handle}`);

        // Query all posts associated with this tracked user (bot accounts)
        const result = await client.query(`
          SELECT
            tweet_id,
            author_username,
            tweet_text,
            sentiment,
            sentiment_score,
            has_geo,
            geo_full_name,
            geo_country,
            geo_country_code,
            author_account_age_days,
            created_at,
            like_count,
            retweet_count
          FROM user_posts
          WHERE tracked_user_id = $1
          AND has_geo = true
          ORDER BY created_at DESC
        `, [trackedUserId]);

        const posts = result.rows;
        console.log(`📊 [VITALS] Found ${posts.length} posts for @${handle}`);

        if (posts.length === 0) {
          socket.emit('metrics:update', {
            postsPerMinute: 0,
            totalPosts: 0,
            sentiment: { positive: 0, neutral: 0, negative: 0 },
            velocity: 0
          });
          client.release();
          return;
        }

        // Calculate metrics
        const totalPosts = posts.length;

        // Sentiment breakdown
        const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
        posts.forEach(post => {
          if (post.sentiment) {
            sentimentCounts[post.sentiment.toLowerCase()] = (sentimentCounts[post.sentiment.toLowerCase()] || 0) + 1;
          }
        });

        // Calculate average sentiment score
        const sentimentScores = posts.filter(p => p.sentiment_score).map(p => parseFloat(p.sentiment_score));
        const avgSentiment = sentimentScores.length > 0
          ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
          : 0;

        // Account age distribution
        const accountAgeBuckets = {
          under7days: 0,
          days7to30: 0,
          days30to180: 0,
          over180days: 0
        };

        let totalAccountAge = 0;
        let accountAgeCount = 0;

        posts.forEach(post => {
          if (post.author_account_age_days !== null) {
            const age = post.author_account_age_days;
            totalAccountAge += age;
            accountAgeCount++;

            if (age < 7) accountAgeBuckets.under7days++;
            else if (age < 30) accountAgeBuckets.days7to30++;
            else if (age < 180) accountAgeBuckets.days30to180++;
            else accountAgeBuckets.over180days++;
          }
        });

        const avgAccountAge = accountAgeCount > 0 ? Math.round(totalAccountAge / accountAgeCount) : 0;

        // Calculate account age risk score (0-100)
        const veryNewAccounts = accountAgeBuckets.under7days;
        const veryNewPct = (veryNewAccounts / totalPosts) * 100;
        let accountAgeRisk = Math.min(veryNewPct, 30);
        if (avgAccountAge < 30) {
          accountAgeRisk += Math.min(((30 - avgAccountAge) / 30) * 40, 40);
        }
        accountAgeRisk = Math.min(Math.round(accountAgeRisk), 100);

        // Geographic distribution
        const geoData = {};
        const countryData = {};
        const regionData = {};

        posts.filter(p => p.has_geo).forEach(post => {
          // Country aggregation
          if (post.geo_country) {
            if (!countryData[post.geo_country]) {
              countryData[post.geo_country] = {
                country: post.geo_country,
                count: 0,
                positive: 0,
                neutral: 0,
                negative: 0
              };
            }
            countryData[post.geo_country].count++;
            if (post.sentiment) {
              countryData[post.geo_country][post.sentiment.toLowerCase()]++;
            }
          }

          // Region aggregation
          if (post.geo_full_name) {
            if (!regionData[post.geo_full_name]) {
              regionData[post.geo_full_name] = {
                region: post.geo_full_name,
                country: post.geo_country || 'Unknown',
                country_code: post.geo_country_code || '',
                count: 0,
                positive: 0,
                neutral: 0,
                negative: 0
              };
            }
            regionData[post.geo_full_name].count++;
            if (post.sentiment) {
              regionData[post.geo_full_name][post.sentiment.toLowerCase()]++;
            }
          }

          // Heat map data (country code -> count)
          if (post.geo_country_code) {
            geoData[post.geo_country_code] = (geoData[post.geo_country_code] || 0) + 1;
          }
        });

        // Convert to arrays and sort by count
        const topCountries = Object.values(countryData)
          .map(c => ({
            ...c,
            sentiment_score: c.count > 0
              ? ((c.positive - c.negative) / c.count)
              : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const topRegions = Object.values(regionData)
          .map(r => ({
            ...r,
            sentiment_score: r.count > 0
              ? ((r.positive - r.negative) / r.count)
              : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20);

        // US Bot Farm Detection
        const usRegions = posts.filter(p =>
          p.has_geo &&
          (p.geo_country_code === 'US' || p.geo_country === 'United States')
        );

        const usCountyData = {};
        const usStateData = {};

        usRegions.forEach(post => {
          const location = post.geo_full_name || 'Unknown';

          // Try to extract state code (last 2 chars if format is "City, ST")
          const parts = location.split(',').map(p => p.trim());
          const stateCode = parts.length > 1 ? parts[parts.length - 1].substring(0, 2) : 'US';

          // County/city level
          if (!usCountyData[location]) {
            usCountyData[location] = {
              location,
              stateCode,
              fullName: location,
              totalPosts: 0,
              newAccounts: 0,
              veryNewAccounts: 0,
              totalAccountAge: 0,
              accountCount: 0,
              sentiment: { positive: 0, neutral: 0, negative: 0 }
            };
          }

          const county = usCountyData[location];
          county.totalPosts++;

          if (post.author_account_age_days !== null) {
            county.totalAccountAge += post.author_account_age_days;
            county.accountCount++;
            if (post.author_account_age_days < 30) county.newAccounts++;
            if (post.author_account_age_days < 7) county.veryNewAccounts++;
          }

          if (post.sentiment) {
            county.sentiment[post.sentiment.toLowerCase()]++;
          }

          // State level aggregation
          if (!usStateData[stateCode]) {
            usStateData[stateCode] = {
              stateCode,
              totalPosts: 0,
              newAccounts: 0,
              veryNewAccounts: 0,
              totalAccountAge: 0,
              accountCount: 0,
              sentiment: { positive: 0, neutral: 0, negative: 0 }
            };
          }

          const state = usStateData[stateCode];
          state.totalPosts++;
          if (post.author_account_age_days !== null) {
            state.totalAccountAge += post.author_account_age_days;
            state.accountCount++;
            if (post.author_account_age_days < 30) state.newAccounts++;
            if (post.author_account_age_days < 7) state.veryNewAccounts++;
          }
          if (post.sentiment) {
            state.sentiment[post.sentiment.toLowerCase()]++;
          }
        });

        // Calculate bot scores
        const calculateBotScore = (data) => {
          let score = 0;
          const veryNewPct = (data.veryNewAccounts / data.totalPosts) * 100;
          score += Math.min(veryNewPct, 30);

          const avgAge = data.accountCount > 0 ? data.totalAccountAge / data.accountCount : 999;
          if (avgAge < 30) {
            score += Math.min(((30 - avgAge) / 30) * 40, 40);
          }

          if (data.totalPosts > 10) {
            score += Math.min((data.totalPosts / 10) * 2, 20);
          }

          const negativeRatio = data.sentiment.negative / data.totalPosts;
          if (negativeRatio > 0.3) {
            score += 10;
          }

          return Math.min(Math.round(score), 100);
        };

        const usCountyBotFarms = Object.values(usCountyData)
          .map(county => ({
            ...county,
            avgAccountAge: county.accountCount > 0
              ? Math.round(county.totalAccountAge / county.accountCount)
              : 0,
            botFarmScore: calculateBotScore(county)
          }))
          .sort((a, b) => b.botFarmScore - a.botFarmScore)
          .slice(0, 50);

        const usStateBotFarms = Object.values(usStateData)
          .map(state => ({
            ...state,
            avgAccountAge: state.accountCount > 0
              ? Math.round(state.totalAccountAge / state.accountCount)
              : 0,
            botFarmScore: calculateBotScore(state)
          }))
          .sort((a, b) => b.botFarmScore - a.botFarmScore);

        // US Heat map data (state code -> bot score)
        const usHeatMapData = {};
        usStateBotFarms.forEach(state => {
          usHeatMapData[state.stateCode] = state.botFarmScore;
        });

        // Time-based velocity (posts per hour in last 24 hours)
        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const recentPosts = posts.filter(p => new Date(p.created_at) > oneDayAgo);
        const postsPerMinute = recentPosts.length / (24 * 60);

        // Build comprehensive metrics object
        const metrics = {
          postsPerMinute: parseFloat(postsPerMinute.toFixed(2)),
          totalPosts,
          sentiment: sentimentCounts,
          velocity: Math.round(postsPerMinute * 60), // posts per hour
          viralityRisk: Math.min(Math.round((recentPosts.length / 100) * 100), 100),
          authenticityScore: Math.max(0, 100 - accountAgeRisk),
          narrativeCoherence: avgSentiment > 0.5 ? 'High' : avgSentiment < -0.5 ? 'Low' : 'Medium',
          responseWindow: 4.0, // hours - could be calculated from velocity
          accountAgeRisk,
          accountAgeDistribution: accountAgeBuckets,
          averageAccountAge: avgAccountAge,
          topCountries,
          topRegions,
          geoDistribution: geoData,
          usCountyBotFarms,
          usStateBotFarms,
          usHeatMapData,
          engagementRate: 0, // Could calculate from likes/retweets
          coordinatedActivity: accountAgeRisk > 40 ? 1 : 0
        };

        console.log(`✅ [VITALS] Sending metrics for @${handle}: ${totalPosts} posts, ${usCountyBotFarms.length} US locations`);
        console.log(`🗺️  [VITALS DEBUG] US Heat Map Data:`, JSON.stringify(usHeatMapData, null, 2));
        console.log(`🔥 [VITALS DEBUG] US State Bot Farms (top 10):`, usStateBotFarms.slice(0, 10).map(s => `${s.stateCode}: ${s.botFarmScore}`).join(', '));
        console.log(`📊 [VITALS DEBUG] US County Bot Farms (top 5):`, usCountyBotFarms.slice(0, 5).map(c => `${c.location}: ${c.botFarmScore}`).join(', '));

        // Send metrics to frontend
        socket.emit('metrics:update', metrics);

        // Also send geo data via dedicated event (for the heat map component)
        socket.emit('geo:data', {
          usCountyBotFarms: usCountyBotFarms,
          usHeatMapData: usHeatMapData
        });
        console.log(`🗺️  [VITALS] Sent geo:data event with ${usCountyBotFarms.length} counties and ${Object.keys(usHeatMapData).length} states`);

      } finally {
        client.release();
      }

    } catch (error) {
      console.error(`❌ [VITALS] Error fetching vitals for @${handle}:`, error);
      socket.emit('metrics:update', {
        postsPerMinute: 0,
        totalPosts: 0,
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        velocity: 0
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
    trackingConfigs.delete(socket.id);
    userMonitor.stopMonitoring(socket.id);
  });
});

/**
 * Use Grok AI to generate intelligent search queries based on user topics
 */
async function generateGrokSearchQuery(handle, topics) {
  const GROK_API_KEY = process.env.GROK_API_KEY || '';

  if (!GROK_API_KEY) {
    // Fallback: construct basic query without Grok
    console.log('⚠️  [GROK] No API key - using basic query construction');
    return `(${topics.join(' OR ')}) (@${handle} OR ${handle}) -is:retweet lang:en`;
  }

  try {
    console.log(`🤖 [GROK] Asking Grok to generate search query for @${handle} with topics:`, topics);

    const prompt = `You are an expert at constructing X (Twitter) API search queries.

User wants to track: @${handle}
Topics of interest: ${topics.join(', ')}

Generate an optimal X API search query that will:
1. Find posts mentioning @${handle} about these topics
2. Find general conversation about these topics (even without @${handle})
3. Use proper boolean operators (AND, OR, -is:retweet)
4. Include relevant keywords and hashtags
5. Filter out retweets and limit to English

Return ONLY the search query string, nothing else. Be concise but comprehensive.`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at constructing X API search queries. Return only the search query string, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'grok-3-mini', // Fast model for query generation
        stream: false,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API failed: ${response.status}`);
    }

    const data = await response.json();
    const searchQuery = data.choices[0].message.content.trim()
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/\n/g, ' '); // Remove newlines

    console.log(`✅ [GROK] Generated intelligent query:`, searchQuery);
    return searchQuery;

  } catch (error) {
    console.error('❌ [GROK] Query generation failed:', error);
    // Fallback to basic query
    return `(${topics.join(' OR ')}) (@${handle} OR ${handle}) -is:retweet lang:en`;
  }
}

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          X PULSE - ENHANCED INTELLIGENCE BACKEND            ║
╠════════════════════════════════════════════════════════════╣
║  🚀 Port: ${PORT}                                           ║
║  ✅ Mode: X API v2 + Advanced Analytics Engine             ║
║  📡 Real-time data: ENABLED                                 ║
║  🔍 Bot detection: ENABLED                                  ║
║  📊 Spike detection: ENABLED                                ║
║  🎯 Narrative analysis: ENABLED                             ║
║  📈 Virality risk: ENABLED                                  ║
║  🛡️  Authenticity scoring: ENABLED                          ║
║  🔑 Bearer token: ${process.env.TWITTER_BEARER_TOKEN ? 'CONFIGURED' : 'MISSING'}                              ║
╚════════════════════════════════════════════════════════════╝
  `);
  startRealPostStream();
});
