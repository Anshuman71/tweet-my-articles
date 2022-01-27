import { NextApiRequest, NextApiResponse } from "next";
import { Document } from "mongodb";

import { VIEWS_MILESTONE_SEQUENCE } from "../../../constants";
import connectToDatabase from "../../../mongodb";
import { Article, COLLECTION_NAMES, DevArticle, SOURCE } from "../../../types";
import {
  createDevArticle,
  formatLog,
  getPublishedArticlesFromDEV,
  getViewsTweetBody,
  sendTweet,
} from "../../../utils";

export default async function views(
  request: NextApiRequest,
  response: NextApiResponse
) {
  console.info(formatLog("Running Views Function"));
  try {
    const devArticles = await getPublishedArticlesFromDEV();
    console.info(formatLog("Total Articles: " + devArticles.length));
    const database = await connectToDatabase();
    const articlesCollection = database.collection(COLLECTION_NAMES.articles);
    const devArticleFromDB = (await articlesCollection
      .find({ source: SOURCE.dev })
      .toArray()) as unknown as Article[];
    console.info(formatLog("Total Articles In DB: " + devArticleFromDB.length));
    const newArticles: any[] = [];
    let oneTweetSent = false;

    for (let index = 0; index < devArticles.length; index++) {
      const article = devArticles[index];
      const findExpression = {
        id: article.id,
        source: SOURCE.dev,
      };
      const value = devArticleFromDB.find((item) => item.id === article.id);
      if (value) {
        const milestoneReached = VIEWS_MILESTONE_SEQUENCE.find(
          (milestone) => article.page_views_count > milestone
        );
        console.info(formatLog("Milestone reached: " + milestoneReached));
        console.info(
          formatLog("Existing Milestone: " + value.lastViewsMilestone)
        );
        if (
          !oneTweetSent &&
          milestoneReached &&
          milestoneReached !== value.lastViewsMilestone
        ) {
          console.info(formatLog("Sending Tweet!"));
          const tweetSent = await sendTweet(
            getViewsTweetBody({ ...article, ...value })
          );
          if (tweetSent) {
            oneTweetSent = true;
            console.info(formatLog("Tweet sent successfully!"));
            await articlesCollection.updateOne(findExpression, {
              $set: {
                lastViewsMilestone: milestoneReached,
                lastTweetedAt: Date.now(),
              },
            });
            console.info(formatLog("Data updated!"));
          } else {
            console.info(formatLog("Sending tweet failed!"));
          }
        }
      } else {
        console.info(formatLog("New article found: " + article.title));
        const newDoc = await createDevArticle(article);
        newArticles.push(newDoc);
      }
    }
    if (newArticles.length) {
      const insertResult = await articlesCollection.insertMany(newArticles);
      console.log(formatLog("Insert result "), insertResult);
    }
    response.status(200).send({
      type: "success",
    });
  } catch (e: any) {
    response.status(500).send({
      type: "error",
      message: e.message,
    });
  }
}
