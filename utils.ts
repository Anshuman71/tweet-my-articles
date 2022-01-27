import { Article, DevArticle, SOURCE } from "./types";
import crypto from "crypto";
import oauth1a from "oauth-1.0a";

const CONSUMER_KEY = process.env.CONSUMER_KEY as string;
const CONSUMER_KEY_SECRET = process.env.CONSUMER_KEY_SECRET as string;
const ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN as string;
const ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET as string;

const SHORTNER_API_KEY = process.env.SHORTNER_API_KEY;
const SHORTNER_DOMAIN = process.env.SHORTNER_DOMAIN;

const MEDIUM_USERNAME = process.env.MEDIUM_USERNAME;
const MEDIUM_USER_ID = process.env.MEDIUM_USER_ID as string;

const YT_CHANNEL_ID = process.env.YT_CHANNEL_ID as string;
const YT_API_KEY = process.env.YT_API_KEY as string;
import { TwitterClient } from "twitter-api-client";

export const twitterClient = new TwitterClient({
  apiKey: CONSUMER_KEY,
  apiSecret: CONSUMER_KEY_SECRET,
  accessToken: ACCESS_TOKEN,
  accessTokenSecret: ACCESS_TOKEN_SECRET,
});

export async function getPublishedArticlesFromDEV() {
  const res = await fetch(`${process.env.DEV_API_URL}/articles/me/published`, {
    headers: {
      "api-key": process.env.DEV_API_KEY as string,
    },
  });
  return res.json();
}

export async function getMediumFollowers() {
  const res = await fetch("https://medium.com/@anshuman-bhardwaj?format=json", {
    headers: {
      "user-agent": "insomnia/2021.7.2",
    },
  });
  const hijackString = "])}while(1);</x>";
  const jsonText = await res.text();
  const data = JSON.parse(jsonText.replace(hijackString, ""));
  return (
    data?.payload?.references?.SocialStats?.[MEDIUM_USER_ID]
      ?.usersFollowedByCount || 20
  );
}

export async function getYoutubeSubscribers() {
  const res = await fetch(
    `https://youtube.googleapis.com/youtube/v3/channels?part=statistics&id=${YT_CHANNEL_ID}&key=${YT_API_KEY}`
  );
  const data = await res.json();
  return data?.items[0]?.statistics?.subscriberCount || 330;
}

// fetch all followers
export async function getFollowersFromDev(): Promise<string[]> {
  let page = 1,
    limit = 1000;
  const followers = [];
  while (page) {
    const res = await fetch(
      `${process.env.DEV_API_URL}/followers/users?per_page=${limit}&page=${page}`,
      {
        headers: {
          "api-key": process.env.DEV_API_KEY as string,
        },
      }
    );
    const answer = await res.json();
    if (answer && Array.isArray(answer) && answer.length) {
      followers.push(...answer);
      page = answer.length === limit ? page + 1 : 0;
    } else {
      page = 0;
    }
  }
  return followers;
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

const MessageStart = `💛 Yayy! 💛\nMy article on DEV has been`;
const hashTags = "#javascript #DEVCommunity";
const footerText = "\n Thanks, please follow me for more such posts!";

function TagLine(url: string) {
  return `In case you missed it, please check it out now! ${url}`;
}

function createMessage(value: string) {
  return `${MessageStart} ${value} \n ${footerText} ${hashTags}`;
}

export function getViewsTweetBody(article: Article & DevArticle): string {
  return createMessage(
    `viewed more than ${article.page_views_count} times. ${TagLine(
      article.shortUrl
    )}`
  );
}

export function getFollowersTweetBody(value: number): string {
  return `💛 Yayy!! 💛 I've reached ${value} followers on DEV. Thanks for all the love and support. Please check out my DEV profile https://dev.to/anshuman_bhardwaj \n ${footerText} ${hashTags}`;
}

export function getReactionsTweetBody(article: Article & DevArticle): string {
  return createMessage(
    `liked more than ${article.public_reactions_count} times. ${TagLine(
      article.shortUrl
    )}`
  );
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
