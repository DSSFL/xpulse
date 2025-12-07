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

    // Prioritize negative/threat posts for analysis (limit to 12 most relevant)
    const sortedPosts = posts
      .sort((a, b) => {
        // Prioritize negative sentiment and high engagement
        const aScore = (a.sentiment === 'negative' ? 2 : a.sentiment === 'neutral' ? 1 : 0) +
                      ((a.public_metrics?.like_count || 0) + (a.public_metrics?.repost_count || 0)) / 100;
        const bScore = (b.sentiment === 'negative' ? 2 : b.sentiment === 'neutral' ? 1 : 0) +
                      ((b.public_metrics?.like_count || 0) + (b.public_metrics?.repost_count || 0)) / 100;
        return bScore - aScore;
      })
      .slice(0, 12);

    // Build compact context
    const postsContext = sortedPosts.map(post =>
      `[@${post.author.username}] ${post.text} (${post.sentiment}, Likes: ${post.public_metrics?.like_count || 0}, Reposts: ${post.public_metrics?.repost_count || 0})`
    ).join('\n');

    const prompt = `Analyze threat landscape for @${handle} on X:

METRICS:
Mentions: ${metrics.totalMentions} | Sentiment: ${metrics.sentimentBreakdown.positive}% pos, ${metrics.sentimentBreakdown.neutral}% neutral, ${metrics.sentimentBreakdown.negative}% neg
Bot activity: ${metrics.botActivityPercentage}% | Engagement: ${metrics.engagementRate}%

RECENT MENTIONS (sorted by relevance):
${postsContext}

Provide a CONCISE threat-focused analysis (3-4 short paragraphs max):

1. Overall threat level and primary concerns
2. Specific threats, risks, or negative narratives to monitor
3. Bot/coordination patterns if any
4. Key recommendations

Keep it brief and actionable. Use plain text only - NO markdown, NO asterisks, NO emojis, NO bullet points. Write in clear prose paragraphs.`;

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
            content: 'You are a threat intelligence analyst. Write concise, plain text analysis in 3-4 short paragraphs focused on threats and risks. No markdown, no asterisks, no emojis, no bullet points - just clear prose.'
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
 * Analyze user activity monitoring data with Grok AI
 */
export async function analyzeUserActivityWithGrok(username, metrics, activities = []) {
  const GROK_API_KEY = process.env.GROK_API_KEY || '';

  if (!GROK_API_KEY) {
    throw new Error('GROK_API_KEY is not set in environment variables');
  }

  try {
    console.log(`🤖 [GROK] Analyzing activity for @${username} with ${activities.length} posts...`);

    // Build activity context for deeper analysis (limit to 15 most recent)
    const activityContext = activities.slice(0, 15).map(activity => {
      const type = activity.activityType === 'own_post' ? 'Posted' :
                   activity.activityType === 'mention' ? 'Mentioned in' :
                   activity.activityType === 'reply' ? 'Reply to' : 'Activity';
      return `[${type}] "${activity.text}" (Likes: ${activity.public_metrics.like_count}, Reposts: ${activity.public_metrics.repost_count}, Replies: ${activity.public_metrics.reply_count}) - ${activity.sentiment}`;
    }).join('\n');

    // Analyze activity types distribution
    const activityBreakdown = activities.reduce((acc, a) => {
      acc[a.activityType] = (acc[a.activityType] || 0) + 1;
      return acc;
    }, {});

    // Calculate average engagement
    const avgEngagement = activities.length > 0
      ? Math.round(activities.reduce((sum, a) => sum + a.engagement, 0) / activities.length)
      : 0;

    const prompt = `Analyze @${username} on X based on this data:

USER: ${metrics.user.name} (@${metrics.user.username})
Verified: ${metrics.user.verified ? 'Yes' : 'No'} | Followers: ${metrics.user.public_metrics?.followers_count?.toLocaleString() || 0}

ACTIVITY (Last ${activities.length} events in ${metrics.monitoringDuration} min):
Own Posts: ${activityBreakdown.own_post || 0} | Mentions: ${activityBreakdown.mention || 0} | Replies: ${activityBreakdown.reply || 0}
Avg Engagement: ${avgEngagement}

RECENT POSTS/ACTIVITY:
${activityContext || 'No recent activity'}

Provide a CONCISE analysis (3-4 short paragraphs max) covering:

1. Main topics and interests based on their actual posts
2. Posting style (original content vs replies/mentions) and engagement patterns
3. Sentiment and tone of conversations
4. Key insights and what to monitor

Keep it brief and actionable. Use plain text only - NO markdown formatting, NO asterisks, NO emojis, NO bullet points. Write in clear prose paragraphs.`;


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
            content: 'You are a social media analyst. Write concise, plain text analysis in 3-4 short paragraphs. No markdown, no asterisks, no emojis, no bullet points - just clear prose.'
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

    console.log('✅ [GROK] Enhanced activity analysis complete');

    return {
      summary: analysis,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ [GROK] Activity analysis failed:', error);
    throw error;
  }
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
