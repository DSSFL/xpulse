const io = require('socket.io-client');

console.log('=== Frontend Connection Comparison Test ===\n');

// Simulate production environment (NODE_ENV === 'production')
const backendUrl = 'https://api.xpulse.buzz';

console.log('Connecting to backend:', backendUrl);
console.log('This mimics the frontend LiveDashboard.tsx connection\n');

// Connect exactly like the frontend does (line 47 in LiveDashboard.tsx)
const socketInstance = io(backendUrl);

let eventCount = {
  connect: 0,
  disconnect: 0,
  'metrics:update': 0,
  'tweet:new': 0
};

socketInstance.on('connect', () => {
  eventCount.connect++;
  console.log(`[${eventCount.connect}] ✅ Connected to X Pulse backend`);
  console.log('   Socket ID:', socketInstance.id);
  console.log('   Transport:', socketInstance.io.engine.transport.name);
  console.log('   Connected:', socketInstance.connected);
  console.log('');
});

socketInstance.on('disconnect', (reason) => {
  eventCount.disconnect++;
  console.log(`[${eventCount.disconnect}] ❌ Disconnected from backend`);
  console.log('   Reason:', reason);
  console.log('');
});

socketInstance.on('metrics:update', (data) => {
  eventCount['metrics:update']++;
  console.log(`[${eventCount['metrics:update']}] 📊 metrics:update received`);
  console.log('   Tweets per minute:', data.tweetsPerMinute);
  console.log('   Total tweets:', data.totalTweets);
  console.log('   Sentiment:', JSON.stringify(data.sentiment));
  console.log('   Velocity:', data.velocity);
  console.log('');
});

socketInstance.on('tweet:new', (tweet) => {
  eventCount['tweet:new']++;
  console.log(`[${eventCount['tweet:new']}] 🐦 tweet:new received`);
  console.log('   ID:', tweet.id);
  console.log('   Author:', tweet.author);
  console.log('   Text:', tweet.text);
  console.log('   Created:', tweet.created_at);
  console.log('');
});

socketInstance.on('connect_error', (error) => {
  console.log('❌ Connection Error:', error.message);
  console.log('   Error details:', error);
  console.log('');
});

socketInstance.on('error', (error) => {
  console.log('❌ Error event:', error);
  console.log('');
});

// Run for 15 seconds then disconnect
setTimeout(() => {
  console.log('---\n');
  console.log('=== Test Summary ===');
  console.log('Connection events:', eventCount.connect);
  console.log('Disconnect events:', eventCount.disconnect);
  console.log('Metrics updates received:', eventCount['metrics:update']);
  console.log('Tweets received:', eventCount['tweet:new']);
  console.log('\nConnection Status:', socketInstance.connected ? 'CONNECTED' : 'DISCONNECTED');

  if (socketInstance.connected) {
    console.log('\n✅ SUCCESS: Backend is working correctly!');
    console.log('   - Connection established successfully');
    console.log('   - Receiving real-time metrics updates');
    console.log('   - Receiving tweet events');
    console.log('\n💡 The backend is functioning properly.');
    console.log('   If the frontend is not updating, the issue is likely:');
    console.log('   1. Browser console errors');
    console.log('   2. React state management issue');
    console.log('   3. Component not re-rendering properly');
    console.log('   4. Production build cache issue');
  } else {
    console.log('\n❌ FAILED: Connection issues detected');
  }

  console.log('\nClosing connection...');
  socketInstance.close();

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}, 15000);

// Prevent premature exit
console.log('Test running for 15 seconds...\n');
console.log('---\n');
