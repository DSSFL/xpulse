/**
 * Test Grok-powered user analysis
 */

import { io } from 'socket.io-client';

const backendUrl = 'http://localhost:3001';
const testHandle = 'elonmusk'; // Test with a well-known account

console.log('🧪 Testing Grok Analysis Feature...\n');
console.log(`📡 Connecting to ${backendUrl}...`);

const socket = io(backendUrl);

socket.on('connect', () => {
  console.log('✅ Connected to backend\n');
  console.log(`🔍 Requesting analysis for @${testHandle}...`);

  socket.emit('analyze:user', { handle: testHandle });

  // Timeout after 45 seconds
  setTimeout(() => {
    console.log('\n⏱️  Test timed out after 45 seconds');
    process.exit(1);
  }, 45000);
});

socket.on('analysis:complete', (data) => {
  console.log('\n✅ Analysis Complete!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📊 Handle: @${data.handle}`);
  console.log(`🎯 Threat Level: ${data.analysis.threatLevel.toUpperCase()}`);
  console.log(`💭 Sentiment Score: ${data.analysis.sentimentScore}/100`);
  console.log(`📈 Virality Risk: ${data.analysis.viralityRisk}/100`);
  console.log(`🛡️  Authenticity: ${data.analysis.authenticityScore}%`);
  console.log(`📚 Narrative Coherence: ${data.analysis.narrativeCoherence}`);
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('🤖 Grok AI Insights:');
  console.log('-----------------------------------------------------------');
  console.log(data.analysis.grokInsights);
  console.log('-----------------------------------------------------------\n');

  console.log('🎯 Top Threats:');
  data.analysis.topThreats.forEach((threat, idx) => {
    console.log(`  ${idx + 1}. [${threat.severity}%] ${threat.type}`);
    console.log(`     ${threat.description}`);
  });
  console.log('');

  console.log('💡 Recommendations:');
  data.analysis.recommendations.forEach((rec, idx) => {
    console.log(`  ${idx + 1}. ${rec}`);
  });
  console.log('');

  console.log(`📮 Recent Posts: ${data.recentPosts.length} posts`);
  console.log(`📊 Total Mentions: ${data.metrics.totalMentions}`);
  console.log(`📈 Engagement Rate: ${data.metrics.engagementRate}%`);
  console.log(`🤖 Bot Activity: ${data.metrics.botActivityPercentage}%`);

  console.log('\n✅ Test successful! Grok analysis is working perfectly.');
  socket.disconnect();
  process.exit(0);
});

socket.on('analysis:error', (error) => {
  console.log('\n❌ Analysis Error:');
  console.log(error.message);
  socket.disconnect();
  process.exit(1);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection Error:', error.message);
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected from backend');
});
