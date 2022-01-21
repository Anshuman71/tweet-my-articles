import { Article, DevArticle, SOURCE } from "./types";

export async function getPublishedArticlesFromDEV() {
  const res = await fetch(`${process.env.DEV_API_URL}/articles/me/published`, {
    headers: {
      "api-key": process.env.DEV_API_KEY as string,
    },
  });
  return res.json();
}
export function createDevArticle(article: DevArticle): Article {
  return {
    id: article.id,
    source: SOURCE.dev,
    title: article.title,
    published_at: new Date(article.published_timestamp).getTime(),
    lastViewsMilestone: 0,
    lastReactionsMilestone: 0,
    lastTweetedAt: Date.now(),
  };
}
