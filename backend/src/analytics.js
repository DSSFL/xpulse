/**
 * Real-time Analytics Engine
 * Tracks velocity, spikes, sentiment, and narrative patterns
 */
export class AnalyticsEngine {
  constructor(options = {}) {
    this.windowSize = options.windowSize || 60000; // 1 minute default
    this.spikeThreshold = options.spikeThreshold || 2.0; // 2x average = spike

    // Time-series data
    this.postTimestamps = [];
    this.sentimentHistory = [];
    this.hashtagCounts = new Map();
    this.keywordCounts = new Map();
    this.authorActivity = new Map();

    // NEW: Account age tracking
    this.accountAges = [];
    this.accountLocations = new Map();

    // NEW: Geographic tracking
    this.geoData = [];
    this.countryCounts = new Map();
    this.regionCounts = new Map();

    // Metrics
    this.metrics = {
      totalPosts: 0,
      postsPerMinute: 0,
      velocity: 0,
      sentiment: {
        positive: 0,
        neutral: 0,
        negative: 0
      },
      viralityRisk: 0,
      authenticityScore: 100,
      narrativeCoherence: 'low',
      responseWindow: 6,
      engagementRate: 0,
      coordinatedActivity: 0,
      topHashtags: [],
      topKeywords: [],
      avgFollowers: 0,
      botPercentage: 0,
      // NEW: Account age metrics
      accountAgeRisk: 0,
      accountAgeDistribution: {
        under7days: 0,
        days7to30: 0,
        days30to180: 0,
        over180days: 0
      },
      averageAccountAge: 0,
      // NEW: Geographic metrics
      topCountries: [],
      topRegions: [],
      geoDistribution: {},
      geoSentiment: {}
    };

    // Spike detection
    this.baselineVelocity = 0;
    this.spikeDetected = false;
    this.spikeStartTime = null;

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Analyze incoming post
   */
  analyzePost(post) {
    const now = Date.now();

    // Track timestamp
    this.postTimestamps.push(now);
    this.metrics.totalPosts++;

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(post.text);
    this.sentimentHistory.push({ sentiment, timestamp: now });
    this.metrics.sentiment[sentiment]++;

    // Extract and count hashtags
    if (post.entities?.hashtags) {
      post.entities.hashtags.forEach(tag => {
        const count = this.hashtagCounts.get(tag.tag) || 0;
        this.hashtagCounts.set(tag.tag, count + 1);
      });
    }

    // Extract keywords
    this.extractKeywords(post.text).forEach(keyword => {
      const count = this.keywordCounts.get(keyword) || 0;
      this.keywordCounts.set(keyword, count + 1);
    });

    // Track author activity
    const authorId = post.author.id;
    if (!this.authorActivity.has(authorId)) {
      this.authorActivity.set(authorId, {
        postCount: 0,
        firstSeen: now,
        lastSeen: now,
        avgTimeBetweenPosts: 0,
        posts: []
      });
    }

    const authorData = this.authorActivity.get(authorId);
    authorData.postCount++;
    authorData.lastSeen = now;
    authorData.posts.push(now);

    // Calculate average time between posts for this author
    if (authorData.posts.length > 1) {
      const times = authorData.posts;
      let totalGap = 0;
      for (let i = 1; i < times.length; i++) {
        totalGap += times[i] - times[i - 1];
      }
      authorData.avgTimeBetweenPosts = totalGap / (times.length - 1);
    }

    // Update computed metrics
    this.updateMetrics();

    // Check for bot probability contribution
    if (post.bot_probability > 0.5) {
      this.metrics.botPercentage =
        (this.metrics.botPercentage * (this.metrics.totalPosts - 1) + post.bot_probability) /
        this.metrics.totalPosts;
    }

    // Track engagement
    const engagement =
      (post.public_metrics.like_count || 0) +
      (post.public_metrics.repost_count || 0) +
      (post.public_metrics.reply_count || 0);

    this.metrics.engagementRate =
      (this.metrics.engagementRate * (this.metrics.totalPosts - 1) + engagement) /
      this.metrics.totalPosts;

    // Track average followers
    this.metrics.avgFollowers =
      (this.metrics.avgFollowers * (this.metrics.totalPosts - 1) + (post.author.followers_count || 0)) /
      this.metrics.totalPosts;

    // NEW: Track account age
    if (post.author.account_created_at) {
      const accountCreated = new Date(post.author.account_created_at);
      const accountAgeDays = (now - accountCreated.getTime()) / (1000 * 60 * 60 * 24);
      this.accountAges.push({
        ageDays: accountAgeDays,
        timestamp: now,
        sentiment: sentiment
      });
    }

    // NEW: Track location string (for location clustering analysis)
    if (post.author.location) {
      const location = post.author.location.toLowerCase().trim();
      const count = this.accountLocations.get(location) || 0;
      this.accountLocations.set(location, count + 1);
    }

    // NEW: Track geographic data
    if (post.place) {
      this.geoData.push({
        country: post.place.country,
        country_code: post.place.country_code,
        full_name: post.place.full_name,
        place_type: post.place.place_type,
        sentiment: sentiment,
        timestamp: now,
        geo: post.place.geo
      });

      // Count by country
      const country = post.place.country || post.place.country_code || 'Unknown';
      const countryCount = this.countryCounts.get(country) || {
        count: 0,
        positive: 0,
        neutral: 0,
        negative: 0
      };
      countryCount.count++;
      countryCount[sentiment]++;
      this.countryCounts.set(country, countryCount);

      // Count by region/full name
      const region = post.place.full_name || 'Unknown';
      const regionCount = this.regionCounts.get(region) || {
        count: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        country: country,
        country_code: post.place.country_code
      };
      regionCount.count++;
      regionCount[sentiment]++;
      this.regionCounts.set(region, regionCount);
    }

    return this.metrics;
  }

  /**
   * Simple sentiment analysis
   */
  analyzeSentiment(text) {
    const lowerText = text.toLowerCase();
    const positiveWords = [
      'amazing', 'great', 'awesome', 'love', 'excellent', 'incredible',
      'fantastic', 'wonderful', 'breakthrough', 'innovation', 'success',
      'win', 'winning', 'best', 'perfect', 'beautiful', 'happy', 'good'
    ];
    const negativeWords = [
      'terrible', 'bad', 'awful', 'hate', 'concern', 'worried',
      'disaster', 'crisis', 'problem', 'issue', 'fail', 'failure',
      'worst', 'horrible', 'sad', 'angry', 'disgusting', 'scary'
    ];

    let score = 0;
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score++;
    });
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score--;
    });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    // Simple keyword extraction (words longer than 4 chars, excluding common words)
    const commonWords = new Set([
      'that', 'this', 'with', 'from', 'have', 'been', 'were', 'they',
      'what', 'when', 'where', 'which', 'who', 'will', 'would', 'could',
      'should', 'their', 'there', 'these', 'those', 'about', 'after',
      'before', 'being', 'during', 'into', 'through', 'under', 'above'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4 && !commonWords.has(word))
      .slice(0, 10); // Top 10 keywords per post
  }

  /**
   * Update computed metrics
   */
  updateMetrics() {
    const now = Date.now();
    const oneMinuteAgo = now - this.windowSize;

    // Calculate posts per minute (velocity)
    const recentPosts = this.postTimestamps.filter(ts => ts > oneMinuteAgo);
    this.metrics.postsPerMinute = recentPosts.length;
    this.metrics.velocity = recentPosts.length;

    // Detect spikes
    this.detectSpike();

    // Calculate virality risk
    this.metrics.viralityRisk = this.calculateViralityRisk();

    // Calculate authenticity score
    this.metrics.authenticityScore = this.calculateAuthenticityScore();

    // Detect narrative coherence
    this.metrics.narrativeCoherence = this.detectNarrativeCoherence();

    // Estimate response window
    this.metrics.responseWindow = this.estimateResponseWindow();

    // Detect coordinated activity
    this.metrics.coordinatedActivity = this.detectCoordinatedActivity();

    // Update top hashtags
    this.metrics.topHashtags = Array.from(this.hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Update top keywords
    this.metrics.topKeywords = Array.from(this.keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    // NEW: Calculate account age metrics
    this.calculateAccountAgeMetrics();

    // NEW: Calculate geographic metrics
    this.calculateGeographicMetrics();
  }

  /**
   * Detect velocity spikes
   */
  detectSpike() {
    if (this.metrics.totalPosts < 100) {
      // Not enough data for baseline
      this.baselineVelocity = this.metrics.velocity;
      return;
    }

    // Update baseline (slow moving average)
    this.baselineVelocity = this.baselineVelocity * 0.95 + this.metrics.velocity * 0.05;

    // Check if current velocity exceeds threshold
    if (this.metrics.velocity >= this.baselineVelocity * this.spikeThreshold) {
      if (!this.spikeDetected) {
        this.spikeDetected = true;
        this.spikeStartTime = Date.now();
        console.log(`🚨 SPIKE DETECTED: ${this.metrics.velocity} posts/min (baseline: ${this.baselineVelocity.toFixed(1)})`);
      }
    } else {
      if (this.spikeDetected) {
        const duration = (Date.now() - this.spikeStartTime) / 1000 / 60;
        console.log(`✅ Spike ended after ${duration.toFixed(1)} minutes`);
      }
      this.spikeDetected = false;
    }
  }

  /**
   * Calculate virality risk (0-100)
   */
  calculateViralityRisk() {
    let risk = 0;

    // High velocity = higher risk
    risk += Math.min(this.metrics.velocity / 3, 40);

    // Spike in progress = higher risk
    if (this.spikeDetected) risk += 20;

    // High engagement = higher risk
    if (this.metrics.engagementRate > 100) risk += 15;

    // Coordinated activity = higher risk
    risk += this.metrics.coordinatedActivity * 0.25;

    // Negative sentiment spike = higher risk
    const totalSentiment =
      this.metrics.sentiment.positive +
      this.metrics.sentiment.neutral +
      this.metrics.sentiment.negative;

    if (totalSentiment > 0) {
      const negativeRatio = this.metrics.sentiment.negative / totalSentiment;
      if (negativeRatio > 0.5) risk += 10;
    }

    return Math.min(Math.round(risk), 100);
  }

  /**
   * Calculate authenticity score (0-100)
   */
  calculateAuthenticityScore() {
    let score = 100;

    // High bot percentage = lower score
    score -= this.metrics.botPercentage * 50;

    // High coordinated activity = lower score
    score -= this.metrics.coordinatedActivity * 0.3;

    // Very low or very high average followers is suspicious
    if (this.metrics.avgFollowers < 100) score -= 10;
    if (this.metrics.avgFollowers > 100000) score -= 5;

    return Math.max(Math.min(Math.round(score), 100), 0);
  }

  /**
   * Detect narrative coherence (low/medium/high)
   */
  detectNarrativeCoherence() {
    // Check if hashtags/keywords are converging
    const topHashtagCount = this.metrics.topHashtags[0]?.count || 0;
    const totalHashtags = Array.from(this.hashtagCounts.values())
      .reduce((sum, count) => sum + count, 0);

    if (totalHashtags === 0) return 'low';

    const concentration = topHashtagCount / totalHashtags;

    if (concentration > 0.4) return 'high';
    if (concentration > 0.2) return 'medium';
    return 'low';
  }

  /**
   * Estimate response window in hours
   */
  estimateResponseWindow() {
    // Based on velocity and virality risk
    const baseWindow = 6;

    if (this.metrics.velocity > 200) return 0.5;
    if (this.metrics.velocity > 100) return 2;
    if (this.metrics.velocity > 50) return 4;

    return baseWindow;
  }

  /**
   * Detect coordinated activity (0-100)
   */
  detectCoordinatedActivity() {
    let score = 0;

    // Check for multiple posts from same authors in short time
    let suspiciousAuthors = 0;

    this.authorActivity.forEach(authorData => {
      // More than 3 posts in analysis window
      if (authorData.postCount > 3) {
        // Average time between posts less than 1 minute
        if (authorData.avgTimeBetweenPosts < 60000) {
          suspiciousAuthors++;
        }
      }
    });

    // Calculate percentage of suspicious authors
    const totalAuthors = this.authorActivity.size;
    if (totalAuthors > 0) {
      score = (suspiciousAuthors / totalAuthors) * 100;
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * NEW: Calculate account age metrics and risk score
   */
  calculateAccountAgeMetrics() {
    if (this.accountAges.length === 0) {
      this.metrics.accountAgeRisk = 0;
      this.metrics.averageAccountAge = 0;
      return;
    }

    // Filter to recent window
    const now = Date.now();
    const oneMinuteAgo = now - this.windowSize;
    const recentAges = this.accountAges.filter(a => a.timestamp > oneMinuteAgo);

    if (recentAges.length === 0) {
      this.metrics.accountAgeRisk = 0;
      this.metrics.averageAccountAge = 0;
      return;
    }

    // Calculate distribution
    let under7 = 0;
    let days7to30 = 0;
    let days30to180 = 0;
    let over180 = 0;
    let totalAge = 0;

    recentAges.forEach(({ ageDays }) => {
      totalAge += ageDays;
      if (ageDays < 7) under7++;
      else if (ageDays < 30) days7to30++;
      else if (ageDays < 180) days30to180++;
      else over180++;
    });

    const total = recentAges.length;
    this.metrics.accountAgeDistribution = {
      under7days: Math.round((under7 / total) * 100),
      days7to30: Math.round((days7to30 / total) * 100),
      days30to180: Math.round((days30to180 / total) * 100),
      over180days: Math.round((over180 / total) * 100)
    };

    this.metrics.averageAccountAge = Math.round(totalAge / total);

    // Calculate risk score (0-100)
    // High % of new accounts = high risk (bot indicator)
    let risk = 0;
    risk += (under7 / total) * 50;  // <7 days = 50% of risk
    risk += (days7to30 / total) * 30; // 7-30 days = 30% of risk
    risk += (days30to180 / total) * 10; // 30-180 days = 10% of risk

    // Very low average age is suspicious
    if (this.metrics.averageAccountAge < 30) risk += 20;
    else if (this.metrics.averageAccountAge < 90) risk += 10;

    this.metrics.accountAgeRisk = Math.min(Math.round(risk), 100);
  }

  /**
   * NEW: Calculate geographic metrics
   */
  calculateGeographicMetrics() {
    // Top countries
    this.metrics.topCountries = Array.from(this.countryCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([country, data]) => ({
        country,
        count: data.count,
        positive: data.positive,
        neutral: data.neutral,
        negative: data.negative,
        sentiment_score: this.calculateSentimentScore(data)
      }));

    // Top regions
    this.metrics.topRegions = Array.from(this.regionCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([region, data]) => ({
        region,
        country: data.country,
        country_code: data.country_code,
        count: data.count,
        positive: data.positive,
        neutral: data.neutral,
        negative: data.negative,
        sentiment_score: this.calculateSentimentScore(data)
      }));

    // Build geo distribution for heat map
    this.metrics.geoDistribution = {};
    this.countryCounts.forEach((data, country) => {
      this.metrics.geoDistribution[country] = data.count;
    });

    // Build geo sentiment map
    this.metrics.geoSentiment = {};
    this.countryCounts.forEach((data, country) => {
      this.metrics.geoSentiment[country] = this.calculateSentimentScore(data);
    });
  }

  /**
   * Helper: Calculate sentiment score (-1 to 1)
   */
  calculateSentimentScore(data) {
    const total = data.positive + data.neutral + data.negative;
    if (total === 0) return 0;
    return ((data.positive - data.negative) / total).toFixed(2);
  }

  /**
   * Clean up old data
   */
  cleanup() {
    const now = Date.now();
    const cutoff = now - (this.windowSize * 5); // Keep 5 minutes of history

    // Clean timestamps
    this.postTimestamps = this.postTimestamps.filter(ts => ts > cutoff);

    // Clean sentiment history
    this.sentimentHistory = this.sentimentHistory.filter(s => s.timestamp > cutoff);

    // Clean author activity
    this.authorActivity.forEach((data, authorId) => {
      data.posts = data.posts.filter(ts => ts > cutoff);
      if (data.posts.length === 0) {
        this.authorActivity.delete(authorId);
      }
    });

    // NEW: Clean account ages
    this.accountAges = this.accountAges.filter(a => a.timestamp > cutoff);

    // NEW: Clean geo data
    this.geoData = this.geoData.filter(g => g.timestamp > cutoff);
  }

  /**
   * Start cleanup interval
   */
  startCleanup() {
    setInterval(() => this.cleanup(), 30000); // Every 30 seconds
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.postTimestamps = [];
    this.sentimentHistory = [];
    this.hashtagCounts.clear();
    this.keywordCounts.clear();
    this.authorActivity.clear();
    this.accountAges = [];
    this.accountLocations.clear();
    this.geoData = [];
    this.countryCounts.clear();
    this.regionCounts.clear();

    this.metrics = {
      totalPosts: 0,
      postsPerMinute: 0,
      velocity: 0,
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      viralityRisk: 0,
      authenticityScore: 100,
      narrativeCoherence: 'low',
      responseWindow: 6,
      engagementRate: 0,
      coordinatedActivity: 0,
      topHashtags: [],
      topKeywords: [],
      avgFollowers: 0,
      botPercentage: 0,
      accountAgeRisk: 0,
      accountAgeDistribution: {
        under7days: 0,
        days7to30: 0,
        days30to180: 0,
        over180days: 0
      },
      averageAccountAge: 0,
      topCountries: [],
      topRegions: [],
      geoDistribution: {},
      geoSentiment: {}
    };
  }
}

export default AnalyticsEngine;
