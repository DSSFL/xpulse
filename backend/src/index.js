import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { AnalyticsEngine } from './analytics.js';

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

// Track processed posts to avoid duplicates
const processedPostIds = new Set();

// Fetch real posts from X API v2
async function fetchRealPosts() {
  try {
    console.log('🔍 Fetching real posts from X API v2...');

    // Search for recent posts about tech, AI, crypto, markets (trending topics)
    const searchQuery = '(tech OR AI OR crypto OR bitcoin OR market OR breaking) -is:retweet lang:en';

    const result = await roClient.v2.search(searchQuery, {
      max_results: 10,
      'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
      'user.fields': ['username', 'name', 'profile_image_url', 'verified'],
      expansions: ['author_id']
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
          post_count: author.public_metrics?.tweet_count || 0
        },
        public_metrics: {
          like_count: post.public_metrics?.like_count || 0,
          repost_count: post.public_metrics?.retweet_count || 0,
          reply_count: post.public_metrics?.reply_count || 0,
          quote_count: post.public_metrics?.quote_count || 0,
          impression_count: post.public_metrics?.impression_count || 0
        },
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

      console.log(`✅ Broadcasted post from @${author.username}: ${post.text.substring(0, 50)}...`);
    }

    // Cleanup old IDs to prevent memory leak (keep last 1000)
    if (processedPostIds.size > 1000) {
      const idsArray = Array.from(processedPostIds);
      processedPostIds.clear();
      idsArray.slice(-1000).forEach(id => processedPostIds.add(id));
    }

  } catch (error) {
    console.error('❌ Error fetching posts:', error.message);
    console.error('Error details:', error);
    if (error.code === 429) {
      console.log('⚠️  Rate limit reached. Waiting before next request...');
    }
  }
}

// Start real post stream
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

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('👤 Client connected:', socket.id, 'from', socket.handshake.headers.origin);
  socket.emit('metrics:update', analytics.getMetrics());

  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
  });
});

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
