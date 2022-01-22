import { Article, DevArticle, SOURCE } from "./types";
import crypto from "crypto";
import oauth1a from "oauth-1.0a";

const CONSUMER_KEY = process.env.CONSUMER_KEY as string;
const CONSUMER_KEY_SECRET = process.env.CONSUMER_KEY_SECRET as string;
const ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN as string;
const ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET as string;
const SHORTNER_API_KEY = process.env.SHORTNER_API_KEY;
const SHORTNER_DOMAIN = process.env.SHORTNER_DOMAIN;

export async function getPublishedArticlesFromDEV() {
  const res = await fetch(`${process.env.DEV_API_URL}/articles/me/published`, {
    headers: {
      "api-key": process.env.DEV_API_KEY as string,
    },
  });
  return res.json();
}

export async function createDevArticle(article: DevArticle): Promise<Article> {
  const shortUrl = await getShortUrl(article);
  return {
    id: article.id,
    source: SOURCE.dev,
    shortUrl,
    title: article.title,
    published_at: new Date(article.published_timestamp).getTime(),
    lastViewsMilestone: 0,
    lastReactionsMilestone: 0,
    lastTweetedAt: Date.now(),
  };
}

export function formatLog(val: string) {
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
    console.info(formatLog("Tweet status: " + data.status));
    return data.status === 201;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export function getViewsTweetBody(article: Article & DevArticle): string {
  return `🚀 Yayy! 🚀\nMy article on DEV has been viewed more than ${article.page_views_count} times. In case you missed it, please go check it out now! ${article.shortUrl}`;
}

export function getReactionsTweetBody(article: Article & DevArticle): string {
  return `🚀 Yayy! 🚀\nMy article on DEV has been liked more than ${article.positive_reactions_count} times. In case you missed it, please go check it out now! ${article.shortUrl}`;
}

export async function getShortUrl(article: DevArticle) {
  const options = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      apikey: SHORTNER_API_KEY,
    },
    body: JSON.stringify({
      domain: { fullName: SHORTNER_DOMAIN },
      destination: article.url,
      title: article.title,
    }),
  };
  // @ts-ignore
  const res = await fetch("https://api.rebrandly.com/v1/links", options);
  const data = await res.json();
  return data.shortUrl.startsWith("http")
    ? data.shortUrl
    : `https://${data.shortUrl}`;
}

export async function deleteLinks() {
  const allLinksRes = await fetch("https://api.rebrandly.com/v1/links", {
    // @ts-ignore
    headers: { apiKey: SHORTNER_API_KEY },
  });
  const data = await allLinksRes.json();
  console.log("🚀 ~ file: utils.ts ~ line 121 ~ deleteLinks ~ data", data);
  for (let i = 0; i < data.length; i++) {
    await fetch("https://api.rebrandly.com/v1/links/" + data[i].id, {
      method: "DELETE",
      // @ts-ignore
      headers: { apiKey: SHORTNER_API_KEY },
    });
  }
}
