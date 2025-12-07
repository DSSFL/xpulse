import { database } from './database.js';
import { xApiErrorHandler } from './xApiErrorHandler.js';

/**
 * Backfill Service
 * Fetches historical tweets when a user is first tracked
 */
export class BackfillService {
  constructor(twitterClient) {
    this.client = twitterClient.readOnly;
  }

  /**
   * Calculate sentiment from tweet text (simple heuristic)
   */
  analyzeSentiment(text) {
    if (!text) return { sentiment: 'neutral', score: 0 };

    const lowerText = text.toLowerCase();

    // Positive words
    const positiveWords = ['love', 'great', 'amazing', 'awesome', 'excellent', 'good', 'happy', 'wonderful', 'fantastic', 'best', 'thanks', 'thank', 'appreciate'];
    // Negative words
    const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'worst', 'horrible', 'disgusting', 'shit', 'fuck', 'damn', 'sucks', 'angry', 'mad'];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });

    const score = positiveCount - negativeCount;

    if (score > 0) return { sentiment: 'positive', score: 0.5 };
    if (score < 0) return { sentiment: 'negative', score: -0.5 };
    return { sentiment: 'neutral', score: 0 };
  }

  /**
   * Calculate account age in days
   */
  getAccountAge(accountCreatedAt) {
    if (!accountCreatedAt) return null;
    const created = new Date(accountCreatedAt);
    const now = new Date();
    const diffMs = now - created;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Backfill tweets for a user
   * Fetches mentions, replies, quotes, and own posts
   */
  async backfillUser(username, userId, trackedUserId) {
    try {
      console.log(`🔄 [BACKFILL] Starting backfill for @${username}`);

      // Mark backfill as started
      await database.startBackfillJob(trackedUserId);

      let totalTweetsFetched = 0;

      // 1. Fetch user's own tweets (last 100)
      console.log(`📥 [BACKFILL] Fetching own tweets for @${username}...`);
      const ownTweets = await this.fetchOwnTweets(userId, trackedUserId);
      totalTweetsFetched += ownTweets;

      // 2. Fetch mentions of the user (last 100)
      console.log(`📥 [BACKFILL] Fetching mentions of @${username}...`);
      const mentions = await this.fetchMentions(username, userId, trackedUserId);
      totalTweetsFetched += mentions;

      // Mark backfill as completed
      await database.completeBackfillJob(trackedUserId, totalTweetsFetched);

      console.log(`✅ [BACKFILL] Completed backfill for @${username}: ${totalTweetsFetched} tweets`);
      return totalTweetsFetched;

    } catch (error) {
      console.error(`❌ [BACKFILL] Error backfilling @${username}:`, error);
      await database.failBackfillJob(trackedUserId, error.message);
      throw error;
    }
  }

  /**
   * Fetch user's own tweets
   */
  async fetchOwnTweets(userId, trackedUserId) {
    try {
      const result = await xApiErrorHandler.executeWithRetry(
        `userTweets-${userId}`,
        () => this.client.v2.userTimeline(userId, {
          max_results: 100,
          'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'geo'],
          'user.fields': ['created_at', 'location', 'public_metrics'],
          expansions: ['author_id', 'geo.place_id'],
          'place.fields': ['full_name', 'country', 'country_code', 'geo', 'place_type']
        }),
        { maxRetries: 3, baseDelay: 2000 }
      );

      if (!result?.data?.data) {
        console.log('⚠️ [BACKFILL] No own tweets found');
        return 0;
      }

      // Extract users map
      const users = {};
      if (result.includes?.users) {
        result.includes.users.forEach(u => {
          users[u.id] = u;
        });
      }

      // Extract places map
      const places = {};
      if (result.includes?.places) {
        result.includes.places.forEach(p => {
          places[p.id] = p;
        });
      }

      let stored = 0;
      for (const tweet of result.data.data) {
        const author = users[tweet.author_id];
        const place = tweet.geo?.place_id ? places[tweet.geo.place_id] : null;

        const sentimentAnalysis = this.analyzeSentiment(tweet.text);
        const accountAge = author?.created_at ? this.getAccountAge(author.created_at) : null;

        const post = {
          tweet_id: tweet.id,
          author_username: author?.username || 'unknown',
          author_user_id: tweet.author_id,
          tweet_text: tweet.text,
          tweet_type: 'own_post',
          created_at: new Date(tweet.created_at),
          like_count: tweet.public_metrics?.like_count || 0,
          retweet_count: tweet.public_metrics?.retweet_count || 0,
          reply_count: tweet.public_metrics?.reply_count || 0,
          quote_count: tweet.public_metrics?.quote_count || 0,
          impression_count: tweet.public_metrics?.impression_count || 0,
          sentiment: sentimentAnalysis.sentiment,
          sentiment_score: sentimentAnalysis.score,
          has_geo: !!place,
          geo_place_id: place?.id,
          geo_full_name: place?.full_name,
          geo_country: place?.country,
          geo_country_code: place?.country_code,
          author_account_age_days: accountAge
        };

        const result = await database.storePost(post, trackedUserId);
        if (result) stored++;
      }

      console.log(`✅ [BACKFILL] Stored ${stored} own tweets`);
      return stored;

    } catch (error) {
      console.error('❌ [BACKFILL] Error fetching own tweets:', error);
      return 0;
    }
  }

  /**
   * Fetch mentions of the user
   */
  async fetchMentions(username, userId, trackedUserId) {
    try {
      // Search for mentions
      const searchQuery = `@${username} -from:${username} -is:retweet`;

      const result = await xApiErrorHandler.executeWithRetry(
        `mentions-${username}`,
        () => this.client.v2.search(searchQuery, {
          max_results: 100,
          'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'geo', 'in_reply_to_user_id', 'referenced_tweets'],
          'user.fields': ['username', 'name', 'created_at', 'location', 'public_metrics'],
          expansions: ['author_id', 'geo.place_id', 'referenced_tweets.id'],
          'place.fields': ['full_name', 'country', 'country_code', 'geo', 'place_type']
        }),
        { maxRetries: 3, baseDelay: 2000 }
      );

      if (!result?.data?.data) {
        console.log('⚠️ [BACKFILL] No mentions found');
        return 0;
      }

      // Extract users map
      const users = {};
      if (result.includes?.users) {
        result.includes.users.forEach(u => {
          users[u.id] = u;
        });
      }

      // Extract places map
      const places = {};
      if (result.includes?.places) {
        result.includes.places.forEach(p => {
          places[p.id] = p;
        });
      }

      let stored = 0;
      for (const tweet of result.data.data) {
        const author = users[tweet.author_id];
        const place = tweet.geo?.place_id ? places[tweet.geo.place_id] : null;

        // Determine tweet type
        let tweetType = 'mention';
        if (tweet.in_reply_to_user_id === userId) {
          tweetType = 'reply';
        } else if (tweet.referenced_tweets?.some(ref => ref.type === 'quoted')) {
          tweetType = 'quote';
        }

        const sentimentAnalysis = this.analyzeSentiment(tweet.text);
        const accountAge = author?.created_at ? this.getAccountAge(author.created_at) : null;

        const post = {
          tweet_id: tweet.id,
          author_username: author?.username || 'unknown',
          author_user_id: tweet.author_id,
          tweet_text: tweet.text,
          tweet_type: tweetType,
          created_at: new Date(tweet.created_at),
          like_count: tweet.public_metrics?.like_count || 0,
          retweet_count: tweet.public_metrics?.retweet_count || 0,
          reply_count: tweet.public_metrics?.reply_count || 0,
          quote_count: tweet.public_metrics?.quote_count || 0,
          impression_count: tweet.public_metrics?.impression_count || 0,
          sentiment: sentimentAnalysis.sentiment,
          sentiment_score: sentimentAnalysis.score,
          has_geo: !!place,
          geo_place_id: place?.id,
          geo_full_name: place?.full_name,
          geo_country: place?.country,
          geo_country_code: place?.country_code,
          author_account_age_days: accountAge
        };

        const result = await database.storePost(post, trackedUserId);
        if (result) stored++;
      }

      console.log(`✅ [BACKFILL] Stored ${stored} mentions/replies/quotes`);
      return stored;

    } catch (error) {
      console.error('❌ [BACKFILL] Error fetching mentions:', error);
      return 0;
    }
  }

  /**
   * Check if backfill is needed for a user
   */
  async isBackfillNeeded(username) {
    try {
      const trackedUser = await database.getTrackedUser(username);

      if (!trackedUser) {
        return true; // New user, backfill needed
      }

      if (trackedUser.backfill_completed) {
        return false; // Already backfilled
      }

      return true; // User exists but backfill not completed
    } catch (error) {
      console.error('❌ [BACKFILL] Error checking backfill status:', error);
      return false;
    }
  }
}
