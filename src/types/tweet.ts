// Comprehensive X API Post type with all enriched data
export interface XUser {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
  verified: boolean;
  description?: string;
  followers_count: number;
  following_count: number;
  post_count: number;
  created_at: string;
  location?: string;
  url?: string;
}

export interface PublicMetrics {
  like_count: number;
  repost_count: number;
  reply_count: number;
  quote_count: number;
  impression_count: number;
}

export interface Hashtag {
  start: number;
  end: number;
  tag: string;
}

export interface UserMention {
  start: number;
  end: number;
  username: string;
  id: string;
}

export interface Url {
  start: number;
  end: number;
  url: string;
  expanded_url: string;
  display_url: string;
}

export interface Media {
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;
  preview_image_url?: string;
  width?: number;
  height?: number;
}

export interface Entities {
  hashtags?: Hashtag[];
  mentions?: UserMention[];
  urls?: Url[];
  media?: Media[];
}

export interface EnrichedPost {
  id: string;
  text: string;
  created_at: string;
  author: XUser;
  public_metrics: PublicMetrics;
  entities?: Entities;
  sentiment: 'positive' | 'negative' | 'neutral';
  engagement: number;
  bot_probability: number;
  source?: string;
  language: string;
  possibly_sensitive: boolean;
  referenced_posts?: Array<{
    type: 'reposted' | 'quoted' | 'replied_to';
    id: string;
  }>;
  geo?: {
    place_id: string;
    place_name: string;
    coordinates?: [number, number];
  };
}

// Legacy alias for backward compatibility during migration
export type EnrichedTweet = EnrichedPost;
