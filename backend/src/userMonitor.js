import { analyzeUserActivityWithGrok } from './grok.js';

/**
 * Helper function to upgrade profile image URL to higher resolution
 */
function upgradeProfileImageUrl(url) {
  if (!url) return url;
  // Replace _normal (48x48) with _400x400 for better quality
  return url.replace('_normal', '_400x400');
}

/**
 * User Activity Monitor
 * Tracks user-specific activity: mentions, likes, replies, quotes, own posts
 */
export class UserActivityMonitor {
  constructor(twitterClient, analytics, io) {
    this.client = twitterClient.readOnly;
    this.analytics = analytics;
    this.io = io;
    this.activeMonitors = new Map(); // socketId -> monitoring config
    this.processedIds = new Map(); // username -> Set of processed tweet IDs
    this.lastAnalysis = new Map(); // username -> last analysis data
    this.recentActivities = new Map(); // username -> array of recent activities for analysis
  }

  /**
   * Start monitoring a specific user
   */
  async startMonitoring(socketId, username) {
    try {
      console.log(`🎯 [USER MONITOR] Starting monitoring for @${username} (socket: ${socketId})`);

      // Get user ID from username
      const user = await this.client.v2.userByUsername(username, {
        'user.fields': ['id', 'name', 'username', 'verified', 'profile_image_url', 'public_metrics', 'description']
      });

      if (!user.data) {
        throw new Error(`User @${username} not found`);
      }

      const userId = user.data.id;
      const userInfo = user.data;

      // Store monitoring config
      this.activeMonitors.set(socketId, {
        username,
        userId,
        userInfo,
        startTime: Date.now(),
        activityCount: 0
      });

      // Initialize processed IDs set
      if (!this.processedIds.has(username)) {
        this.processedIds.set(username, new Set());
      }

      // Emit user info to client
      this.io.to(socketId).emit('monitor:user-info', {
        user: {
          id: userInfo.id,
          username: userInfo.username,
          name: userInfo.name,
          verified: userInfo.verified || false,
          profile_image_url: upgradeProfileImageUrl(userInfo.profile_image_url),
          description: userInfo.description || '',
          followers_count: userInfo.public_metrics?.followers_count || 0,
          following_count: userInfo.public_metrics?.following_count || 0,
          tweet_count: userInfo.public_metrics?.tweet_count || 0
        }
      });

      console.log(`✅ [USER MONITOR] Monitoring started for @${username} (ID: ${userId})`);

      // Start fetching activity immediately
      await this.fetchUserActivity(socketId, username, userId);

      // Set up polling interval
      const intervalId = setInterval(async () => {
        if (!this.activeMonitors.has(socketId)) {
          clearInterval(intervalId);
          return;
        }
        await this.fetchUserActivity(socketId, username, userId);
      }, 15000); // Poll every 15 seconds

      // Store interval ID for cleanup
      this.activeMonitors.get(socketId).intervalId = intervalId;

      return { success: true, user: userInfo };

    } catch (error) {
      console.error(`❌ [USER MONITOR] Error starting monitoring:`, error);
      throw error;
    }
  }

  /**
   * Fetch user activity from X API
   */
  async fetchUserActivity(socketId, username, userId) {
    try {
      const activities = [];
      const processedIds = this.processedIds.get(username);

      // 1. Get user's own recent posts
      try {
        const userTweets = await this.client.v2.userTimeline(userId, {
          max_results: 10,
          'tweet.fields': ['created_at', 'public_metrics', 'referenced_tweets', 'entities'],
          'user.fields': ['username', 'name', 'verified', 'profile_image_url']
        });

        if (userTweets.data?.data) {
          for (const tweet of userTweets.data.data) {
            if (!processedIds.has(tweet.id)) {
              processedIds.add(tweet.id);
              activities.push(this.enrichActivity(tweet, userTweets.includes, 'own_post', username));
            }
          }
        }
      } catch (error) {
        console.error(`[USER MONITOR] Error fetching user timeline:`, error.message);
      }

      // 2. Get mentions of the user
      try {
        const mentions = await this.client.v2.search(`@${username} -from:${username} -is:retweet lang:en`, {
          max_results: 20,
          'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'referenced_tweets'],
          'user.fields': ['username', 'name', 'verified', 'profile_image_url'],
          expansions: ['author_id']
        });

        if (mentions.data?.data) {
          for (const tweet of mentions.data.data) {
            if (!processedIds.has(tweet.id)) {
              processedIds.add(tweet.id);
              activities.push(this.enrichActivity(tweet, mentions.includes, 'mention', username));
            }
          }
        }
      } catch (error) {
        console.error(`[USER MONITOR] Error fetching mentions:`, error.message);
      }

      // 3. Get replies to the user's posts (search for "to:username")
      try {
        const replies = await this.client.v2.search(`to:${username} -from:${username} -is:retweet lang:en`, {
          max_results: 20,
          'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'referenced_tweets'],
          'user.fields': ['username', 'name', 'verified', 'profile_image_url'],
          expansions: ['author_id']
        });

        if (replies.data?.data) {
          for (const tweet of replies.data.data) {
            if (!processedIds.has(tweet.id)) {
              processedIds.add(tweet.id);
              activities.push(this.enrichActivity(tweet, replies.includes, 'reply', username));
            }
          }
        }
      } catch (error) {
        console.error(`[USER MONITOR] Error fetching replies:`, error.message);
      }

      // Sort by creation time (newest first)
      activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Store recent activities for AI analysis (keep last 50)
      if (!this.recentActivities.has(username)) {
        this.recentActivities.set(username, []);
      }
      const recentActivities = this.recentActivities.get(username);
      recentActivities.unshift(...activities);
      if (recentActivities.length > 50) {
        recentActivities.splice(50);
      }

      // Send activities to client
      if (activities.length > 0) {
        console.log(`📊 [USER MONITOR] Sending ${activities.length} activities for @${username}`);
        this.io.to(socketId).emit('monitor:activity', { activities });

        // Update activity count
        const monitor = this.activeMonitors.get(socketId);
        if (monitor) {
          monitor.activityCount += activities.length;
        }
      }

      // Generate AI analysis every 30 seconds
      const monitor = this.activeMonitors.get(socketId);
      const lastAnalysisTime = this.lastAnalysis.get(username)?.timestamp || 0;
      const now = Date.now();

      if (monitor && (now - lastAnalysisTime > 30000)) {
        await this.generateAnalysis(socketId, username, userId);
      }

      // Cleanup old processed IDs (keep last 500 per user)
      if (processedIds.size > 500) {
        const idsArray = Array.from(processedIds);
        processedIds.clear();
        idsArray.slice(-500).forEach(id => processedIds.add(id));
      }

    } catch (error) {
      console.error(`❌ [USER MONITOR] Error fetching activity:`, error);
    }
  }

  /**
   * Enrich activity data
   */
  enrichActivity(tweet, includes, activityType, targetUsername) {
    // Get author info from includes
    const users = {};
    if (includes?.users) {
      includes.users.forEach(user => {
        users[user.id] = user;
      });
    }

    const author = users[tweet.author_id] || {
      id: tweet.author_id,
      username: 'unknown',
      name: 'Unknown User',
      verified: false,
      profile_image_url: null
    };

    // Analyze sentiment
    const sentiment = this.analytics.analyzeSentiment(tweet.text);

    return {
      id: tweet.id,
      text: tweet.text,
      created_at: tweet.created_at,
      author: {
        id: author.id,
        username: author.username,
        name: author.name,
        verified: author.verified || false,
        profile_image_url: upgradeProfileImageUrl(author.profile_image_url)
      },
      public_metrics: {
        like_count: tweet.public_metrics?.like_count || 0,
        repost_count: tweet.public_metrics?.retweet_count || 0,
        reply_count: tweet.public_metrics?.reply_count || 0,
        quote_count: tweet.public_metrics?.quote_count || 0,
        impression_count: tweet.public_metrics?.impression_count || 0
      },
      sentiment,
      engagement: (tweet.public_metrics?.like_count || 0) +
                 (tweet.public_metrics?.retweet_count || 0) +
                 (tweet.public_metrics?.reply_count || 0),
      activityType, // 'own_post', 'mention', 'reply', 'quote', 'like'
      targetUsername
    };
  }

  /**
   * Generate AI analysis of user activity
   */
  async generateAnalysis(socketId, username, userId) {
    try {
      console.log(`🤖 [USER MONITOR] Generating AI analysis for @${username}...`);

      const monitor = this.activeMonitors.get(socketId);
      if (!monitor) return;

      // Get recent activity data
      const processedIds = this.processedIds.get(username);
      const recentCount = processedIds ? processedIds.size : 0;
      const recentActivities = this.recentActivities.get(username) || [];

      // Calculate metrics
      const metrics = {
        totalActivity: monitor.activityCount,
        monitoringDuration: Math.round((Date.now() - monitor.startTime) / 1000 / 60), // minutes
        recentPosts: recentCount,
        user: monitor.userInfo
      };

      // Get Grok AI analysis with actual post content
      const analysis = await analyzeUserActivityWithGrok(username, metrics, recentActivities);

      // Store last analysis
      this.lastAnalysis.set(username, {
        analysis,
        metrics,
        timestamp: Date.now()
      });

      // Send to client
      this.io.to(socketId).emit('monitor:analysis', {
        analysis,
        metrics,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ [USER MONITOR] AI analysis sent for @${username}`);

    } catch (error) {
      console.error(`❌ [USER MONITOR] Error generating analysis:`, error);
    }
  }

  /**
   * Stop monitoring a user
   */
  stopMonitoring(socketId) {
    const monitor = this.activeMonitors.get(socketId);
    if (monitor) {
      if (monitor.intervalId) {
        clearInterval(monitor.intervalId);
      }
      console.log(`🛑 [USER MONITOR] Stopped monitoring @${monitor.username} (socket: ${socketId})`);
      this.activeMonitors.delete(socketId);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(socketId) {
    const monitor = this.activeMonitors.get(socketId);
    if (!monitor) return null;

    return {
      username: monitor.username,
      userId: monitor.userId,
      activityCount: monitor.activityCount,
      duration: Math.round((Date.now() - monitor.startTime) / 1000 / 60)
    };
  }
}
