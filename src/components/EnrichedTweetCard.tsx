'use client';

import { EnrichedTweet } from '@/types/tweet';
import Image from 'next/image';

interface EnrichedTweetCardProps {
  tweet: EnrichedTweet;
}

export default function EnrichedTweetCard({ tweet }: EnrichedTweetCardProps) {
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
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const sentimentColor = {
    positive: 'text-vital-healthy',
    negative: 'text-vital-critical',
    neutral: 'text-vital-neutral'
  }[tweet.sentiment];

  const sentimentBg = {
    positive: 'bg-vital-healthy/10 border-vital-healthy/30',
    negative: 'bg-vital-critical/10 border-vital-critical/30',
    neutral: 'bg-vital-neutral/10 border-vital-neutral/30'
  }[tweet.sentiment];

  return (
    <div className={`p-4 rounded-xl border transition-all hover:border-x-blue hover:bg-x-gray-dark/50 ${sentimentBg}`}>
      {/* Header - User Info */}
      <div className="flex items-start gap-3 mb-3">
        {/* Profile Picture */}
        <div className="relative flex-shrink-0">
          <Image
            src={tweet.author.profile_image_url}
            alt={tweet.author.name}
            width={48}
            height={48}
            className="rounded-full"
          />
          {tweet.author.verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-pulse-blue rounded-full flex items-center justify-center border-2 border-x-black">
              <svg className="w-3 h-3 text-x-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            </div>
          )}
        </div>

        {/* User Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-x-white font-bold truncate">{tweet.author.name}</span>
            {tweet.author.verified && (
              <svg className="w-4 h-4 text-pulse-blue flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            )}
            <span className="text-x-gray-text text-sm truncate">@{tweet.author.username}</span>
            <span className="text-x-gray-text text-sm">·</span>
            <span className="text-x-gray-text text-sm">{formatDate(tweet.created_at)}</span>
          </div>
          {tweet.author.description && (
            <p className="text-x-gray-text text-xs mt-1 truncate">{tweet.author.description}</p>
          )}
        </div>

        {/* Sentiment Badge */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${sentimentColor} bg-x-gray-dark border border-current/30`}>
          {tweet.sentiment}
        </div>
      </div>

      {/* Tweet Text */}
      <p className="text-x-white text-sm mb-3 leading-relaxed">{tweet.text}</p>

      {/* Hashtags */}
      {tweet.entities?.hashtags && tweet.entities.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tweet.entities.hashtags.slice(0, 5).map((hashtag, index) => (
            <span
              key={index}
              className="text-xs text-pulse-blue bg-pulse-blue/10 px-2 py-1 rounded-full border border-pulse-blue/30"
            >
              #{hashtag.tag}
            </span>
          ))}
        </div>
      )}

      {/* Engagement Metrics */}
      <div className="flex items-center gap-6 pt-3 border-t border-x-gray-border">
        {/* Likes */}
        <div className="flex items-center gap-1.5 text-x-gray-text hover:text-vital-critical transition-colors cursor-pointer group">
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-xs font-medium">{formatNumber(tweet.public_metrics.like_count)}</span>
        </div>

        {/* Retweets */}
        <div className="flex items-center gap-1.5 text-x-gray-text hover:text-vital-healthy transition-colors cursor-pointer group">
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-xs font-medium">{formatNumber(tweet.public_metrics.retweet_count)}</span>
        </div>

        {/* Replies */}
        <div className="flex items-center gap-1.5 text-x-gray-text hover:text-pulse-blue transition-colors cursor-pointer group">
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs font-medium">{formatNumber(tweet.public_metrics.reply_count)}</span>
        </div>

        {/* Impressions */}
        <div className="flex items-center gap-1.5 text-x-gray-text hover:text-pulse-purple transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-xs font-medium">{formatNumber(tweet.public_metrics.impression_count)}</span>
        </div>

        {/* Bot Probability Indicator */}
        {tweet.bot_probability > 0.5 && (
          <div className="ml-auto flex items-center gap-1 text-vital-warning text-xs">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>Bot?</span>
          </div>
        )}
      </div>

      {/* Additional Metadata */}
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-x-gray-border/50">
        {tweet.source && (
          <span className="text-xs text-x-gray-text">
            via {tweet.source}
          </span>
        )}
        {tweet.author.location && (
          <span className="text-xs text-x-gray-text flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {tweet.author.location}
          </span>
        )}
        <span className="text-xs text-x-gray-text ml-auto">
          {formatNumber(tweet.author.followers_count)} followers
        </span>
      </div>
    </div>
  );
}
