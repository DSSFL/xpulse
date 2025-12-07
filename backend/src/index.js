import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import pg from 'pg';

dotenv.config({ path: '../.env.local' });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://xpulse.buzz'
      : 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Database connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// X API Client - Using Bearer Token for streaming access
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

// Metrics tracking
let metrics = {
  tweetsPerMinute: 0,
  totalTweets: 0,
  sentiment: { positive: 0, neutral: 0, negative: 0 },
  topTopics: [],
  velocity: 0,
  lastMinuteTweets: []
};

// Calculate velocity every minute
setInterval(() => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Filter tweets from last minute
  metrics.lastMinuteTweets = metrics.lastMinuteTweets.filter(
    timestamp => timestamp > oneMinuteAgo
  );

  metrics.tweetsPerMinute = metrics.lastMinuteTweets.length;
  metrics.velocity = metrics.tweetsPerMinute;

  // Broadcast updated metrics
  io.emit('metrics:update', metrics);
}, 1000); // Update every second for smooth UI

// X Streaming API connection
async function startTwitterStream() {
  try {
    console.log('🔌 Connecting to X Streaming API...');

    // Check if stream rules exist
    const rules = await twitterClient.v2.streamRules();

    // Only add rules if none exist
    if (!rules.data || rules.data.length === 0) {
      console.log('📝 No rules found, adding new rules...');
      await twitterClient.v2.updateStreamRules({
        add: [
          { value: 'breaking news lang:en', tag: 'breaking-news' },
          { value: '#tech OR #AI OR #crypto', tag: 'tech' },
          { value: 'is:verified has:media', tag: 'verified-media' }
        ]
      });
      console.log('✅ Rules added successfully!');
    } else {
      console.log(`✅ Found ${rules.data.length} existing rule(s), using them.`);
    }

    // Start streaming
    const stream = await twitterClient.v2.searchStream({
      'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
      'user.fields': ['username', 'verified'],
      expansions: ['author_id']
    });

    console.log('✅ X Stream connected!');

    stream.on('data', async (tweet) => {
      try {
        metrics.totalTweets++;
        metrics.lastMinuteTweets.push(Date.now());

        // Simple sentiment analysis (basic)
        const text = tweet.data.text.toLowerCase();
        if (text.match(/great|amazing|love|awesome|excellent/)) {
          metrics.sentiment.positive++;
        } else if (text.match(/bad|terrible|hate|awful|worst/)) {
          metrics.sentiment.negative++;
        } else {
          metrics.sentiment.neutral++;
        }

        // Broadcast tweet to connected clients
        io.emit('tweet:new', {
          id: tweet.data.id,
          text: tweet.data.text,
          author: tweet.includes?.users?.[0]?.username || 'unknown',
          created_at: tweet.data.created_at,
          metrics: tweet.data.public_metrics
        });

      } catch (error) {
        console.error('Error processing tweet:', error);
      }
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      setTimeout(startTwitterStream, 5000); // Reconnect after 5s
    });

  } catch (error) {
    console.error('Failed to start Twitter stream:', error);
    setTimeout(startTwitterStream, 10000); // Retry after 10s
  }
}

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/metrics', (req, res) => {
  res.json(metrics);
});

app.get('/api/stream/rules', async (req, res) => {
  try {
    const rules = await twitterClient.v2.streamRules();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stream/rules', async (req, res) => {
  try {
    const { add } = req.body;
    await twitterClient.v2.updateStreamRules({ add });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('👤 Client connected:', socket.id);

  // Send current metrics immediately
  socket.emit('metrics:update', metrics);

  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 X Pulse Backend running on port ${PORT}`);
  startTwitterStream();
});
