import { ObjectId } from "mongodb";

export enum SOURCE {
  dev = "DEV",
  hashnode = "hashnode",
}

export enum COLLECTION_NAMES {
  articles = "articles",
  followers = "followers",
}

export enum VIEWS_MILESTONE {
  hundred = 100,
  two_hundred_fifty = 2.5 * hundred,
  five_hundred = 5 * hundred,
  thousand = 1000,
  two_thousand = 2 * thousand,
  five_thousand = 5 * thousand,
  ten_thousand = 10 * thousand,
}

export enum REACTIONS_MILESTONE {
  ten = 10,
  fifty = 50,
  hundred = 100,
  two_hundred = 2 * hundred,
  five_hundred = 5 * hundred,
}

export interface Article {
  id: number;
  source: SOURCE;
  title: string;
  shortUrl: string;
  published_at: number;
  lastViewsMilestone: number;
  lastReactionsMilestone: number;
  lastTweetedAt: number;
}

export interface DevArticle {
  id: number;
  type_of: string;
  published_timestamp: string;
  title: string;
  description: string;
  published: boolean;
  slug: string;
  url: string;
  comments_count: number;
  public_reactions_count: number;
  page_views_count: number;
  positive_reactions_count: number;
  cover_image: string;
  reading_time_minutes: number;
}
