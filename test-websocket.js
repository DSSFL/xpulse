const { io } = require('socket.io-client');

const backendUrl = 'https://api.xpulse.buzz';
console.log('🔌 Connecting to backend:', backendUrl);

const socket = io(backendUrl);

socket.on('connect', () => {
  console.log('✅ Connected to X Pulse backend');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from backend');
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

socket.on('metrics:update', (metrics) => {
  console.log('📊 Metrics received:', metrics);
  process.exit(0);
});

setTimeout(() => {
  console.log('⏱️ Timeout - no data received');
  process.exit(1);
}, 10000);
