'use client';

import { EnrichedPost } from '@/types/tweet';

interface ThreatDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  threatType: 'velocity' | 'sentiment' | 'virality' | 'authenticity' | 'coordination' | 'narrative';
  posts: EnrichedPost[];
  metrics: {
    postsPerMinute?: number;
    sentiment?: { positive: number; neutral: number; negative: number };
    viralityRisk?: number;
    authenticityScore?: number;
    narrativeCoherence?: string;
    coordinatedActivity?: number;
  };
}

export default function ThreatDetailsModal({
  isOpen,
  onClose,
  threatType,
  posts,
  metrics
}: ThreatDetailsModalProps) {
  if (!isOpen) return null;

  const getThreatTitle = () => {
    switch (threatType) {
      case 'velocity':
        return 'Spread Rate';
      case 'sentiment':
        return 'Sentiment Balance';
      case 'virality':
        return 'Viral Potential';
      case 'authenticity':
        return 'Bot Activity';
      case 'coordination':
        return 'Time to Peak';
      case 'narrative':
        return 'Message Unity';
      default:
        return 'Threat Details';
    }
  };

  const getFilteredPosts = () => {
    switch (threatType) {
      case 'velocity':
        // Show most recent posts driving velocity
        return posts.slice(0, 10);

      case 'sentiment':
        // Show negative sentiment posts
        return posts
          .filter(p => p.sentiment === 'negative')
          .slice(0, 10);

      case 'virality':
        // Show high engagement posts
        return posts
          .sort((a, b) => {
            const engA = (a.public_metrics?.like_count || 0) + (a.public_metrics?.repost_count || 0);
            const engB = (b.public_metrics?.like_count || 0) + (b.public_metrics?.repost_count || 0);
            return engB - engA;
          })
          .slice(0, 10);

      case 'authenticity':
        // Show posts with high bot probability
        return posts
          .filter(p => (p.bot_probability || 0) > 0.3)
          .sort((a, b) => (b.bot_probability || 0) - (a.bot_probability || 0))
          .slice(0, 10);

      case 'coordination':
        // Show posts from accounts posting frequently
        const authorFrequency = new Map<string, number>();
        posts.forEach(p => {
          const count = authorFrequency.get(p.author.username) || 0;
          authorFrequency.set(p.author.username, count + 1);
        });

        return posts
          .filter(p => (authorFrequency.get(p.author.username) || 0) > 1)
          .slice(0, 10);

      case 'narrative':
        // Show posts with common keywords
        return posts.slice(0, 10);

      default:
        return posts.slice(0, 10);
    }
  };

  const getDescription = () => {
    switch (threatType) {
      case 'velocity':
        return `Currently tracking ${metrics?.postsPerMinute || 0} posts per minute. This measures how fast the narrative is spreading across X. Higher rates indicate rapid viral spread, coordinated campaigns, or breaking news. Posts shown below are driving the current spread.`;
      case 'sentiment':
        return `${((metrics?.sentiment?.negative || 0) / Math.max((metrics?.sentiment?.positive || 0) + (metrics?.sentiment?.neutral || 0) + (metrics?.sentiment?.negative || 0), 1) * 100).toFixed(0)}% of posts have negative sentiment. This shows the emotional tone of the conversation. High negativity may indicate brewing backlash or crisis. Posts shown below are negative sentiment examples.`;
      case 'virality':
        return `Viral potential score: ${metrics?.viralityRisk || 0}/100. This estimates the likelihood of mainstream media pickup based on engagement velocity, influencer involvement, and share patterns. Posts shown below have the highest engagement.`;
      case 'authenticity':
        return `Estimated ${100 - (metrics?.authenticityScore || 100)}% bot/coordinated activity. This detects inauthentic behavior via account age, posting patterns, and timing analysis. Posts shown below have the highest bot probability scores.`;
      case 'coordination':
        return `Estimated time to peak viral spread. Currently tracking ${metrics?.coordinatedActivity || 0}% coordinated activity. This shows accounts posting similar content at suspiciously similar times - a sign of coordinated campaigns.`;
      case 'narrative':
        return `Message unity is ${metrics?.narrativeCoherence || 'low'}. This measures how similar the messaging is across posts - high unity with similar keywords and phrases suggests coordinated talking points or viral memes.`;
      default:
        return '';
    }
  };

  const filteredPosts = getFilteredPosts();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-x-gray-dark border border-x-gray-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-x-gray-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-x-white">{getThreatTitle()}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-x-gray-light hover:bg-x-gray-border text-x-gray-text hover:text-x-white transition-colors flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <p className="text-x-gray-text text-sm">{getDescription()}</p>
        </div>

        {/* Posts List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-x-gray-text">No threats detected in this category</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl border border-x-gray-border bg-x-gray-light/30 hover:bg-x-gray-light/50 transition-colors"
              >
                {/* Author */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-pulse-blue/20 flex items-center justify-center text-x-white font-bold">
                    {post.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-x-white font-medium truncate">
                        {post.author.name}
                      </span>
                      <span className="text-x-gray-text text-sm">@{post.author.username}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-x-gray-text">
                      <span>{formatDate(post.created_at)}</span>
                      {post.bot_probability && post.bot_probability > 0.5 && (
                        <span className="text-vital-warning">⚠️ Bot ({(post.bot_probability * 100).toFixed(0)}%)</span>
                      )}
                    </div>
                  </div>

                  {/* Sentiment Badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    post.sentiment === 'positive' ? 'bg-vital-healthy/20 text-vital-healthy' :
                    post.sentiment === 'negative' ? 'bg-vital-critical/20 text-vital-critical' :
                    'bg-vital-neutral/20 text-vital-neutral'
                  }`}>
                    {post.sentiment}
                  </div>
                </div>

                {/* Post Text */}
                <p className="text-x-white text-sm mb-3 leading-relaxed">{post.text}</p>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-xs text-x-gray-text">
                  <span>❤️ {formatNumber(post.public_metrics?.like_count || 0)}</span>
                  <span>🔁 {formatNumber(post.public_metrics?.repost_count || 0)}</span>
                  <span>💬 {formatNumber(post.public_metrics?.reply_count || 0)}</span>
                  <span>👁️ {formatNumber(post.public_metrics?.impression_count || 0)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-x-gray-border bg-x-gray-light/20">
          <div className="text-center text-xs text-x-gray-text">
            Showing {filteredPosts.length} of {posts.length} total posts
          </div>
        </div>
      </div>
    </div>
  );
}
