import { NextApiRequest, NextApiResponse } from "next";
import connectToDatabase from "../../../mongodb";
import {
  createDevArticle,
  getLogString,
  getPublishedArticlesFromDEV,
  getReactionsTweetBody,
  sendTweet,
} from "../../../utils";
import { Document } from "mongodb";
import { Article, COLLECTION_NAMES, DevArticle, SOURCE } from "../../../types";
import { REACTIONS_MILESTONE_SEQUENCE } from "../../../constants";

export default async function reactions(
  request: NextApiRequest,
  response: NextApiResponse
) {
  console.info(getLogString("Running Reactions Function"));
  try {
    const devArticles = await getPublishedArticlesFromDEV();
    console.info(getLogString("Total Articles: " + devArticles.length));
    const database = await connectToDatabase();
    const articlesCollection = database.collection(COLLECTION_NAMES.articles);
    const devArticleFromDB = (await articlesCollection
      .find({ source: SOURCE.dev })
      .toArray()) as unknown as Article[];
    console.info(
      getLogString("Total Articles In DB: " + devArticleFromDB.length)
    );
    const newArticles: Document[] = [];
    devArticles.forEach(async (article: DevArticle) => {
      const findExpression = {
        id: article.id,
        source: SOURCE.dev,
      };
      const value = devArticleFromDB.find((item) => item.id === article.id);
      if (value) {
        const milestoneReached = REACTIONS_MILESTONE_SEQUENCE.find(
          (milestone) => article.public_reactions_count > milestone
        );
        console.info(getLogString("Milestone reached: " + milestoneReached));
        console.info(
          getLogString("Existing Milestone: " + value.lastReactionsMilestone)
        );
        if (
          milestoneReached &&
          milestoneReached !== value.lastReactionsMilestone
        ) {
          console.info(getLogString("Sending Tweet!"));
          const tweetSent = await sendTweet(getReactionsTweetBody(article));
          if (tweetSent) {
            console.info(getLogString("Tweet sent successfully!"));
            await articlesCollection.updateOne(findExpression, {
              $set: {
                lastReactionsMilestone: milestoneReached,
                lastTweetedAt: Date.now(),
              },
            });
            console.info(getLogString("Data updated!"));
          } else {
            console.info(getLogString("Sending tweet failed!"));
          }
        }
      } else {
        console.info(getLogString("New article found: " + article.title));
        newArticles.push(createDevArticle(article));
      }
    });
    if (newArticles.length) {
      await articlesCollection.insertMany(newArticles);
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
