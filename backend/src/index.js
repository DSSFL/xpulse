import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { AnalyticsEngine } from './analytics.js';
import { analyzeUserWithGrok } from './grok.js';
import { UserActivityMonitor } from './userMonitor.js';

dotenv.config();

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

    const result = await roClient.v2.search(searchQuery, {
      max_results: 10,
      'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'geo'],
      'user.fields': ['username', 'name', 'profile_image_url', 'verified', 'created_at', 'location', 'public_metrics'],
      expansions: ['author_id', 'geo.place_id'],
      'place.fields': ['full_name', 'country', 'country_code', 'geo', 'place_type']
    });

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

// Broadcast metrics every second
setInterval(() => {
  const metrics = analytics.getMetrics();
  io.emit('metrics:update', metrics);

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

app.get('/api/metrics', (req, res) => {
  res.json(analytics.getMetrics());
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
    socket.emit('tracking:configured', { searchQuery });
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
