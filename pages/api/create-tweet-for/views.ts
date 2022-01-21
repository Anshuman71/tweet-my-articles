import { NextApiRequest, NextApiResponse } from "next";
import { VIEWS_MILESTONE_SEQUENCE } from "../../../constants";
import connectToDatabase from "../../../mongodb";
import { Article, COLLECTION_NAMES, DevArticle, SOURCE } from "../../../types";
import {
  createDevArticle,
  getLogString,
  getPublishedArticlesFromDEV,
  getViewsTweetBody,
  sendTweet,
} from "../../../utils";

export default async function views(
  request: NextApiRequest,
  response: NextApiResponse
) {
  console.info(getLogString("Running Views Function"));
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

    devArticles.forEach(async (article: DevArticle) => {
      const findExpression = {
        id: article.id,
        source: SOURCE.dev,
      };
      const value = devArticleFromDB.find((item) => item.id === article.id);
      if (value) {
        const milestoneReached = VIEWS_MILESTONE_SEQUENCE.find(
          (milestone) => article.page_views_count > milestone
        );
        console.info(getLogString("Milestone reached: " + milestoneReached));
        console.info(
          getLogString("Existing Milestone: " + value.lastViewsMilestone)
        );
        if (milestoneReached && milestoneReached !== value.lastViewsMilestone) {
          console.info(getLogString("Sending Tweet!"));
          const tweetSent = await sendTweet(getViewsTweetBody(article));
          if (tweetSent) {
            console.info(getLogString("Tweet sent successfully!"));
            await articlesCollection.updateOne(findExpression, {
              $set: {
                lastViewsMilestone: milestoneReached,
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
        await articlesCollection.insertOne(createDevArticle(article));
      }
    });
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
