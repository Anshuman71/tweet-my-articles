import { Article, DevArticle, SOURCE } from "./types";
import crypto from "crypto";
import oauth1a from "oauth-1.0a";

const CONSUMER_KEY = process.env.CONSUMER_KEY as string;
const CONSUMER_KEY_SECRET = process.env.CONSUMER_KEY_SECRET as string;
const ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN as string;
const ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET as string;

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

export function getLogString(val: string) {
  const separator = "=".repeat(20);
  const padding = " ".repeat(10);
  return separator + padding + val + padding + separator;
}

function getAuthHeaderForRequest(request: any) {
  const oauth = new oauth1a({
    consumer: { key: CONSUMER_KEY, secret: CONSUMER_KEY_SECRET },
    signature_method: "HMAC-SHA1",
    hash_function(base_string, key) {
      return crypto
        .createHmac("sha1", key)
        .update(base_string)
        .digest("base64");
    },
  });

  const authorization = oauth.authorize(request, {
    key: ACCESS_TOKEN,
    secret: ACCESS_TOKEN_SECRET,
  });

  return oauth.toHeader(authorization);
}

export async function sendTweet(text: string) {
  const request = {
    url: "https://api.twitter.com/2/tweets",
    method: "POST",
    body: {
      text,
    },
  };
  const authHeader = getAuthHeaderForRequest(request);
  try {
    const data = await fetch(request.url, {
      body: JSON.stringify(request.body),
      method: request.method,
      // @ts-ignore
      headers: { "content-type": "application/json", ...authHeader },
    });
    console.info(getLogString("Tweet status: " + data.status));
    return data.status === 201;
  } catch (err) {
    console.error(err);
    return false;
  }
}

function sliceAtFifty(val: string) {
  if (val.length <= 50) {
    return val;
  }
  return val.slice(0, 47).padEnd(50, ".");
}

export function getViewsTweetBody(article: DevArticle): string {
  return `🚀 Yayy! 🚀\nMy article on DEV "${sliceAtFifty(
    article.title
  )}" has been viewed more than ${
    article.page_views_count
  } times.\nIn case you missed it, please go check it out now! ${article.url}.`;
}

export function getReactionsTweetBody(article: DevArticle): string {
  return `🚀 Yayy! 🚀\nMy article on DEV "${sliceAtFifty(
    article.title
  )}" has been liked more than ${
    article.positive_reactions_count
  } times.\nIn case you missed it, please go check it out now! ${article.url}.`;
}
