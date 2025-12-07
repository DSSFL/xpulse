import { TwitterApi } from 'twitter-api-v2';

/**
 * X API Filtered Stream Manager
 * Provides real-time streaming with rules-based filtering
 */
export class XStreamManager {
  constructor(bearerToken, options = {}) {
    this.client = new TwitterApi(bearerToken);
    this.stream = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 5000;
    this.isRunning = false;
    this.eventHandlers = {
      data: [],
      error: [],
      connected: [],
      disconnected: [],
      reconnecting: []
    };
  }

  /**
   * Set up stream rules for filtering
   * Rules define what content we want to receive
   */
  async setupRules(rules) {
    try {
      console.log('📋 Setting up stream rules...');

      // Delete existing rules first
      const existingRules = await this.client.v2.streamRules();
      if (existingRules.data?.length) {
        const ids = existingRules.data.map(rule => rule.id);
        await this.client.v2.updateStreamRules({
          delete: { ids }
        });
        console.log(`🗑️  Deleted ${ids.length} existing rules`);
      }

      // Add new rules
      const result = await this.client.v2.updateStreamRules({
        add: rules
      });

      console.log(`✅ Added ${result.data?.length || 0} new rules:`, rules);
      return result;
    } catch (error) {
      console.error('❌ Error setting up rules:', error);
      throw error;
    }
  }

  /**
   * Start the filtered stream
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Stream already running');
      return;
    }

    try {
      console.log('🚀 Starting filtered stream...');
      this.isRunning = true;

      // Get the stream
      this.stream = await this.client.v2.searchStream({
        'tweet.fields': [
          'created_at',
          'public_metrics',
          'author_id',
          'entities',
          'referenced_tweets',
          'context_annotations',
          'lang',
          'possibly_sensitive',
          'source'
        ],
        'user.fields': [
          'username',
          'name',
          'profile_image_url',
          'verified',
          'description',
          'public_metrics',
          'created_at',
          'location'
        ],
        'expansions': ['author_id', 'referenced_tweets.id'],
        'media.fields': ['type', 'url', 'preview_image_url']
      });

      console.log('✅ Filtered stream connected');
      this.reconnectAttempts = 0;
      this.emit('connected');

      // Process stream data
      for await (const { data: post, includes } of this.stream) {
        try {
          // Enrich post with user data
          const enrichedPost = this.enrichPost(post, includes);
          this.emit('data', enrichedPost);
        } catch (error) {
          console.error('❌ Error processing post:', error);
        }
      }
    } catch (error) {
      console.error('❌ Stream error:', error);
      this.emit('error', error);

      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        this.emit('reconnecting', this.reconnectAttempts);
        console.log(`🔄 Reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
        this.isRunning = false;
        return this.start();
      } else {
        console.error('❌ Max reconnection attempts reached');
        this.stop();
      }
    }
  }

  /**
   * Enrich post with user data and additional metadata
   */
  enrichPost(post, includes) {
    const users = {};
    if (includes?.users) {
      includes.users.forEach(user => {
        users[user.id] = user;
      });
    }

    const author = users[post.author_id] || {
      id: post.author_id,
      username: 'unknown',
      name: 'Unknown User',
      profile_image_url: null,
      verified: false
    };

    // Calculate basic bot probability
    const botProbability = this.calculateBotProbability(author, post);

    return {
      id: post.id,
      text: post.text,
      created_at: post.created_at,
      author: {
        id: author.id,
        username: author.username,
        name: author.name,
        profile_image_url: author.profile_image_url,
        verified: author.verified || false,
        description: author.description,
        followers_count: author.public_metrics?.followers_count || 0,
        following_count: author.public_metrics?.following_count || 0,
        post_count: author.public_metrics?.tweet_count || 0,
        created_at: author.created_at,
        location: author.location
      },
      public_metrics: {
        like_count: post.public_metrics?.like_count || 0,
        repost_count: post.public_metrics?.retweet_count || 0,
        reply_count: post.public_metrics?.reply_count || 0,
        quote_count: post.public_metrics?.quote_count || 0,
        impression_count: post.public_metrics?.impression_count || 0
      },
      entities: post.entities,
      language: post.lang || 'unknown',
      possibly_sensitive: post.possibly_sensitive || false,
      source: post.source,
      referenced_posts: post.referenced_tweets,
      context_annotations: post.context_annotations,
      bot_probability: botProbability
    };
  }

  /**
   * Calculate bot probability based on account characteristics
   */
  calculateBotProbability(author, post) {
    let score = 0;
    const metrics = author.public_metrics || {};

    // High post count
    if (metrics.tweet_count > 50000) score += 0.2;

    // Low followers relative to following
    const ratio = metrics.followers_count / Math.max(metrics.following_count, 1);
    if (ratio < 0.5) score += 0.15;

    // Account age
    if (author.created_at) {
      const accountAge = Date.now() - new Date(author.created_at).getTime();
      const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 30) score += 0.2;
    }

    // No profile image
    if (!author.profile_image_url || author.profile_image_url.includes('default_profile')) {
      score += 0.15;
    }

    // No description
    if (!author.description || author.description.length < 10) {
      score += 0.1;
    }

    // Suspicious patterns in username (lots of numbers)
    if (author.username && /\d{6,}/.test(author.username)) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Stop the stream
   */
  stop() {
    if (this.stream) {
      this.stream.close();
      this.stream = null;
    }
    this.isRunning = false;
    this.emit('disconnected');
    console.log('🛑 Stream stopped');
  }

  /**
   * Event handling
   */
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }

  /**
   * Get current stream status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

export default XStreamManager;
