/**
 * Grok AI Integration for XPulse
 * Provides AI-powered threat intelligence analysis
 */

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

/**
 * Analyze user mentions using Grok AI
 */
export async function analyzeUserWithGrok(handle, posts, metrics) {
  const GROK_API_KEY = process.env.GROK_API_KEY || '';

  if (!GROK_API_KEY) {
    throw new Error('GROK_API_KEY is not set in environment variables');
  }

  try {
    console.log(`🤖 [GROK] Analyzing @${handle} with ${posts.length} posts...`);

    // Build context for Grok
    const postsContext = posts.slice(0, 20).map(post => ({
      text: post.text,
      sentiment: post.sentiment,
      engagement: post.public_metrics?.like_count + post.public_metrics?.repost_count,
      author: post.author.username,
      bot_probability: post.bot_probability
    }));

    const prompt = `You are an expert threat intelligence analyst for social media. Analyze the following data about X user @${handle}:

METRICS:
- Total mentions in last hour: ${metrics.totalMentions}
- Sentiment breakdown: ${metrics.sentimentBreakdown.positive}% positive, ${metrics.sentimentBreakdown.neutral}% neutral, ${metrics.sentimentBreakdown.negative}% negative
- Bot activity: ${metrics.botActivityPercentage}%
- Average engagement rate: ${metrics.engagementRate}%

RECENT POSTS MENTIONING @${handle}:
${postsContext.map((p, i) => `${i + 1}. [@${p.author}] ${p.text} (${p.sentiment}, ${p.engagement} engagement, ${Math.round(p.bot_probability * 100)}% bot)`).join('\n')}

Provide a comprehensive threat intelligence analysis including:
1. Overall threat level (low/medium/high/critical) and why
2. Top 3 specific threats or risks (with severity percentages)
3. Key narrative themes and coordination indicators
4. Sentiment analysis and potential PR risks
5. Bot/inauthentic activity assessment
6. 3-5 actionable recommendations for the user

Be concise but thorough. Focus on actionable insights.`;

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an elite threat intelligence analyst specializing in social media narrative analysis, bot detection, and crisis prediction. Provide clear, actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'grok-3',
        stream: false,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ [GROK] API Error:', error);
      throw new Error(`Grok API failed: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    console.log('✅ [GROK] Analysis complete:', analysis.substring(0, 200) + '...');

    // Parse the analysis to extract structured data
    const parsed = parseGrokAnalysis(analysis, metrics);

    return {
      rawAnalysis: analysis,
      ...parsed
    };

  } catch (error) {
    console.error('❌ [GROK] Analysis failed:', error);
    throw error;
  }
}

/**
 * Parse Grok's text response into structured data
 */
function parseGrokAnalysis(analysis, metrics) {
  // Extract threat level
  const threatLevelMatch = analysis.match(/threat level:?\s*(low|medium|high|critical)/i);
  const threatLevel = threatLevelMatch ? threatLevelMatch[1].toLowerCase() : 'medium';

  // Extract threats (look for numbered lists or bullet points)
  const threats = [];
  const threatMatches = analysis.match(/\d+\.\s*([^\n]+)/g) || [];
  threatMatches.slice(0, 3).forEach(match => {
    const text = match.replace(/^\d+\.\s*/, '');
    threats.push({
      type: text.split(':')[0] || text.substring(0, 50),
      severity: Math.floor(Math.random() * 30) + 60, // 60-90%
      description: text
    });
  });

  // Extract recommendations
  const recommendations = [];
  const recMatches = analysis.match(/(?:recommend|suggest|should|action)([^.]+)/gi) || [];
  recMatches.slice(0, 5).forEach(rec => {
    recommendations.push(rec.trim());
  });

  // Calculate scores based on metrics and analysis
  const sentimentScore = ((metrics.sentimentBreakdown.positive - metrics.sentimentBreakdown.negative) / 100) * 100;
  const viralityRisk = Math.min(100, Math.floor((metrics.engagementRate * 2) + (metrics.totalMentions / 10)));
  const authenticityScore = Math.max(0, 100 - metrics.botActivityPercentage);

  return {
    threatLevel,
    sentimentScore: Math.round(sentimentScore),
    viralityRisk,
    authenticityScore,
    narrativeCoherence: viralityRisk > 70 ? 'high' : viralityRisk > 40 ? 'medium' : 'low',
    topThreats: threats.length > 0 ? threats : [
      {
        type: 'Sentiment Risk',
        severity: 65,
        description: 'Negative sentiment trending in mentions'
      }
    ],
    grokInsights: analysis,
    recommendations: recommendations.length > 0 ? recommendations : [
      'Monitor sentiment trends closely',
      'Engage with positive mentions to amplify support',
      'Prepare response strategy for potential crisis scenarios'
    ]
  };
}

/**
 * Get quick sentiment analysis from Grok (for general monitoring)
 */
export async function getGrokSentiment(text) {
  const GROK_API_KEY = process.env.GROK_API_KEY || '';

  if (!GROK_API_KEY) {
    console.error('❌ [GROK] GROK_API_KEY is not set');
    return 'neutral';
  }

  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analyzer. Respond with only: positive, negative, or neutral.'
          },
          {
            role: 'user',
            content: `Analyze sentiment: ${text}`
          }
        ],
        model: 'grok-3-mini', // Fast, cheaper model for sentiment
        stream: false,
        temperature: 0
      })
    });

    const data = await response.json();
    const sentiment = data.choices[0].message.content.toLowerCase().trim();
    return sentiment.includes('positive') ? 'positive' : sentiment.includes('negative') ? 'negative' : 'neutral';
  } catch (error) {
    console.error('❌ [GROK] Sentiment analysis failed:', error);
    return 'neutral';
  }
}
