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

// Metrics tracking
let metrics = {
  tweetsPerMinute: 0,
  totalTweets: 0,
  sentiment: { positive: 0, neutral: 0, negative: 0 },
  velocity: 0,
  lastMinuteTweets: []
};

// Simulate tweet stream
function simulateTweetStream() {
  console.log('📊 Starting simulated tweet stream...');
  
  const sampleTweets = [
    { text: 'Breaking news: Amazing AI breakthrough announced!', sentiment: 'positive' },
    { text: 'This is terrible news for the tech industry', sentiment: 'negative' },
    { text: 'Just another day in crypto markets', sentiment: 'neutral' },
    { text: 'Love this new feature! Awesome work!', sentiment: 'positive' },
    { text: 'Tech stocks showing great performance today', sentiment: 'positive' },
    { text: 'New regulations causing concern', sentiment: 'negative' },
    { text: 'Market update: steady trading continues', sentiment: 'neutral' },
    { text: 'Incredible innovation in renewable energy!', sentiment: 'positive' },
  ];

  setInterval(() => {
    const tweet = sampleTweets[Math.floor(Math.random() * sampleTweets.length)];
    
    metrics.totalTweets++;
    metrics.lastMinuteTweets.push(Date.now());
    
    // Update sentiment
    if (tweet.sentiment === 'positive') metrics.sentiment.positive++;
    else if (tweet.sentiment === 'negative') metrics.sentiment.negative++;
    else metrics.sentiment.neutral++;
    
    // Broadcast to clients
    io.emit('tweet:new', {
      id: Date.now().toString(),
      text: tweet.text,
      author: `user${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString()
    });
  }, 2000); // New tweet every 2 seconds
}

// Calculate velocity every second
setInterval(() => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  metrics.lastMinuteTweets = metrics.lastMinuteTweets.filter(
    timestamp => timestamp > oneMinuteAgo
  );

  metrics.tweetsPerMinute = metrics.lastMinuteTweets.length;
  metrics.velocity = metrics.tweetsPerMinute;

  // Broadcast updated metrics
  io.emit('metrics:update', metrics);
}, 1000);

// API Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    mode: 'simulation',
    message: 'Backend running with simulated data',
    totalTweets: metrics.totalTweets
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
  console.log(`🚀 X Pulse Backend running on port ${PORT}`);
  console.log(`⚠️  Running in SIMULATION mode`);
  console.log(`✅ CORS enabled for: xpulse.buzz, www.xpulse.buzz`);
  simulateTweetStream();
});
