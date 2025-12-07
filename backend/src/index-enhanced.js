import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

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

// Enhanced metrics tracking
let metrics = {
  tweetsPerMinute: 0,
  totalTweets: 0,
  sentiment: { positive: 0, neutral: 0, negative: 0 },
  velocity: 0,
  lastMinuteTweets: [],

  // Enhanced threat vitals
  viralityRisk: 0,
  authenticityScore: 0,
  narrativeCoherence: 'low',
  responseWindow: 6,

  // Enriched data
  hashtags: {},
  keywords: {},
  engagementRate: 0,
  velocityTrend: [],
  sentimentTrend: [],
  topInfluencers: [],
  coordinatedActivity: 0
};

// Tweet storage for analysis
let recentTweets = [];
const MAX_RECENT_TWEETS = 200;

// Enhanced tweet simulation
const sampleTweets = [
  // Positive sentiment
  { text: 'Breaking: Revolutionary AI breakthrough announced! This changes everything! #AI #Innovation', sentiment: 'positive', engagement: 85, bot: false },
  { text: 'Amazing progress in renewable energy today. So proud of this team! #CleanEnergy #Progress', sentiment: 'positive', engagement: 70, bot: false },
  { text: 'Just incredible! This new technology is going to transform lives. #TechNews #Innovation', sentiment: 'positive', engagement: 92, bot: false },
  { text: 'Love this new feature! Awesome work by the dev team! 🔥 #ProductLaunch #Success', sentiment: 'positive', engagement: 65, bot: false },
  { text: 'Tech stocks showing incredible performance today! Market is strong! #Stocks #Investing', sentiment: 'positive', engagement: 78, bot: false },

  // Negative sentiment
  { text: 'This is terrible news for the industry. Major concerns ahead. #Breaking #Alert', sentiment: 'negative', engagement: 95, bot: false },
  { text: 'Disappointed by this decision. Complete disaster for consumers. #Outrage #Unacceptable', sentiment: 'negative', engagement: 88, bot: false },
  { text: 'New regulations causing serious concern among experts. Dark days ahead. #Policy #Concern', sentiment: 'negative', engagement: 82, bot: false },
  { text: 'Security breach exposed! This is a massive problem! Everyone needs to know! #Security #Breach', sentiment: 'negative', engagement: 98, bot: false },
  { text: 'Prices skyrocketing again! When will this end? #Economy #Inflation', sentiment: 'negative', engagement: 75, bot: false },

  // Neutral sentiment
  { text: 'Market update: Trading continues at steady pace today. #Markets #Update', sentiment: 'neutral', engagement: 45, bot: false },
  { text: 'New report released on industry trends. Data shows mixed results. #Report #Analysis', sentiment: 'neutral', engagement: 52, bot: false },
  { text: 'Conference scheduled for next week. Details to follow. #Event #Conference', sentiment: 'neutral', engagement: 38, bot: false },

  // Bot-like tweets
  { text: 'Check this out! Amazing opportunity! #Crypto #Investment', sentiment: 'positive', engagement: 12, bot: true },
  { text: 'This is the best! Everyone should know! #Trending #Viral', sentiment: 'positive', engagement: 8, bot: true },
];

// Function to calculate virality risk
function calculateViralityRisk() {
  if (recentTweets.length === 0) return 0;

  // Factors: velocity, engagement rate, negative sentiment momentum
  const velocityFactor = Math.min(metrics.velocity / 30, 1); // Normalize to 0-1
  const engagementFactor = metrics.engagementRate / 100;
  const negativeSentimentRatio = metrics.sentiment.negative / (metrics.totalTweets || 1);

  // Velocity trend (is it accelerating?)
  const recentVelocity = metrics.velocityTrend.slice(-5);
  const velocityAcceleration = recentVelocity.length > 2
    ? (recentVelocity[recentVelocity.length - 1] - recentVelocity[0]) / recentVelocity.length
    : 0;
  const accelerationFactor = velocityAcceleration > 0 ? Math.min(velocityAcceleration / 5, 0.3) : 0;

  // Calculate risk (0-100)
  const risk = Math.round(
    (velocityFactor * 40) +
    (engagementFactor * 30) +
    (negativeSentimentRatio * 20) +
    (accelerationFactor * 10)
  );

  return Math.min(risk, 100);
}

// Function to calculate authenticity score
function calculateAuthenticityScore() {
  if (recentTweets.length === 0) return 100;

  // Count bot-like tweets
  const botCount = recentTweets.filter(t => t.bot).length;
  const botRatio = botCount / recentTweets.length;

  // Check for coordinated activity (similar posting patterns)
  const uniqueTexts = new Set(recentTweets.map(t => t.text.substring(0, 50))).size;
  const uniquenessRatio = uniqueTexts / recentTweets.length;

  // Calculate authenticity (0-100, higher is more authentic)
  const score = Math.round(
    ((1 - botRatio) * 60) +
    (uniquenessRatio * 40)
  );

  return Math.max(0, Math.min(score, 100));
}

// Function to calculate narrative coherence
function calculateNarrativeCoherence() {
  if (Object.keys(metrics.hashtags).length === 0) return 'low';

  // Analyze hashtag concentration
  const hashtagValues = Object.values(metrics.hashtags);
  const totalHashtags = hashtagValues.reduce((a, b) => a + b, 0);
  const topHashtags = hashtagValues.sort((a, b) => b - a).slice(0, 3);
  const topHashtagConcentration = topHashtags.reduce((a, b) => a + b, 0) / (totalHashtags || 1);

  // Analyze keyword repetition
  const keywordValues = Object.values(metrics.keywords);
  const totalKeywords = keywordValues.reduce((a, b) => a + b, 0);
  const topKeywords = keywordValues.sort((a, b) => b - a).slice(0, 5);
  const topKeywordConcentration = topKeywords.reduce((a, b) => a + b, 0) / (totalKeywords || 1);

  // Determine coherence level
  const coherenceScore = (topHashtagConcentration + topKeywordConcentration) / 2;

  if (coherenceScore > 0.6) return 'high';
  if (coherenceScore > 0.35) return 'medium';
  return 'low';
}

// Function to calculate response window
function calculateResponseWindow() {
  // Base window is 6 hours
  let window = 6;

  // Reduce window based on velocity (faster spread = less time)
  window -= Math.min(metrics.velocity / 50, 4);

  // Reduce window based on virality risk
  window -= (metrics.viralityRisk / 100) * 2;

  // Check velocity acceleration
  const recentVelocity = metrics.velocityTrend.slice(-5);
  if (recentVelocity.length > 2) {
    const acceleration = recentVelocity[recentVelocity.length - 1] - recentVelocity[0];
    if (acceleration > 5) {
      window -= 1; // Accelerating = less time
    }
  }

  return Math.max(0.5, window);
}

// Function to extract hashtags and keywords
function analyzeText(text) {
  // Extract hashtags
  const hashtagRegex = /#(\w+)/g;
  const hashtags = text.match(hashtagRegex) || [];
  hashtags.forEach(tag => {
    const cleanTag = tag.toLowerCase();
    metrics.hashtags[cleanTag] = (metrics.hashtags[cleanTag] || 0) + 1;
  });

  // Extract keywords (simple: words longer than 4 chars, excluding common words)
  const commonWords = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'will', 'just', 'their', 'about', 'which', 'there']);
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4 && !commonWords.has(w));

  words.forEach(word => {
    metrics.keywords[word] = (metrics.keywords[word] || 0) + 1;
  });
}

// Simulate tweet stream with enhanced data
function simulateTweetStream() {
  console.log('📊 Starting enhanced tweet stream...');

  setInterval(() => {
    const tweet = sampleTweets[Math.floor(Math.random() * sampleTweets.length)];

    // Create tweet object
    const tweetData = {
      id: Date.now().toString(),
      text: tweet.text,
      author: `user${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      sentiment: tweet.sentiment,
      engagement: tweet.engagement,
      bot: tweet.bot,
      timestamp: Date.now()
    };

    // Update metrics
    metrics.totalTweets++;
    metrics.lastMinuteTweets.push(Date.now());

    // Update sentiment
    if (tweet.sentiment === 'positive') metrics.sentiment.positive++;
    else if (tweet.sentiment === 'negative') metrics.sentiment.negative++;
    else metrics.sentiment.neutral++;

    // Store tweet for analysis
    recentTweets.push(tweetData);
    if (recentTweets.length > MAX_RECENT_TWEETS) {
      recentTweets = recentTweets.slice(-MAX_RECENT_TWEETS);
    }

    // Analyze text
    analyzeText(tweet.text);

    // Calculate average engagement
    const totalEngagement = recentTweets.reduce((sum, t) => sum + t.engagement, 0);
    metrics.engagementRate = Math.round(totalEngagement / recentTweets.length);

    // Broadcast new tweet
    io.emit('tweet:new', tweetData);
  }, 2000); // New tweet every 2 seconds
}

// Calculate and broadcast metrics every second
setInterval(() => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Clean up old tweets from velocity calculation
  metrics.lastMinuteTweets = metrics.lastMinuteTweets.filter(
    timestamp => timestamp > oneMinuteAgo
  );

  metrics.tweetsPerMinute = metrics.lastMinuteTweets.length;
  metrics.velocity = metrics.tweetsPerMinute;

  // Track velocity trend
  metrics.velocityTrend.push(metrics.velocity);
  if (metrics.velocityTrend.length > 20) {
    metrics.velocityTrend = metrics.velocityTrend.slice(-20);
  }

  // Track sentiment trend
  const totalSentiment = metrics.sentiment.positive + metrics.sentiment.neutral + metrics.sentiment.negative;
  const sentimentScore = totalSentiment > 0
    ? ((metrics.sentiment.positive - metrics.sentiment.negative) / totalSentiment) * 100
    : 0;
  metrics.sentimentTrend.push(sentimentScore);
  if (metrics.sentimentTrend.length > 20) {
    metrics.sentimentTrend = metrics.sentimentTrend.slice(-20);
  }

  // Calculate enhanced metrics
  metrics.viralityRisk = calculateViralityRisk();
  metrics.authenticityScore = calculateAuthenticityScore();
  metrics.narrativeCoherence = calculateNarrativeCoherence();
  metrics.responseWindow = calculateResponseWindow();

  // Calculate coordinated activity
  metrics.coordinatedActivity = Math.round((1 - (metrics.authenticityScore / 100)) * 100);

  // Get top hashtags
  const topHashtags = Object.entries(metrics.hashtags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Get top keywords
  const topKeywords = Object.entries(metrics.keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  // Broadcast enhanced metrics
  io.emit('metrics:update', {
    ...metrics,
    topHashtags,
    topKeywords
  });
}, 1000);

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    mode: 'enhanced_simulation',
    message: 'Enhanced backend with threat intelligence',
    totalTweets: metrics.totalTweets,
    viralityRisk: metrics.viralityRisk,
    authenticityScore: metrics.authenticityScore
  });
});

app.get('/api/metrics', (req, res) => {
  res.json(metrics);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('👤 Client connected:', socket.id, 'from', socket.handshake.headers.origin);
  socket.emit('metrics:update', metrics);

  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 X Pulse Enhanced Backend running on port ${PORT}`);
  console.log(`🧠 Enhanced threat intelligence mode enabled`);
  console.log(`✅ CORS enabled for: xpulse.buzz, www.xpulse.buzz`);
  simulateTweetStream();
});
