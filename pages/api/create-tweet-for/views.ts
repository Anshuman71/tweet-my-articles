import { NextApiRequest, NextApiResponse } from "next";
import { VIEWS_MILESTONE_SEQUENCE } from "../../../constants";
import connectToDatabase from "../../../mongodb";
import { Article, COLLECTION_NAMES, DevArticle, SOURCE } from "../../../types";
import {
  createDevArticle,
  generateLogString,
  getPublishedArticlesFromDEV,
} from "../../../utils";

export default async function views(
  request: NextApiRequest,
  response: NextApiResponse
) {
  console.info(generateLogString("Running Views Function"));
  try {
    const devArticles = await getPublishedArticlesFromDEV();
    console.info(generateLogString("Total Articles: " + devArticles.length));
    const database = await connectToDatabase();
    const articlesCollection = database.collection(COLLECTION_NAMES.articles);
    const devArticleFromDB = (await articlesCollection
      .find({ source: SOURCE.dev })
      .toArray()) as unknown as Article[];
    console.info(
      generateLogString("Total Articles In DB: " + devArticleFromDB.length)
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
        console.info(
          generateLogString("Milestone reached: " + milestoneReached)
        );
        console.info(
          generateLogString("Existing Milestone: " + value.lastViewsMilestone)
        );
        if (milestoneReached && milestoneReached !== value.lastViewsMilestone) {
          console.info(generateLogString("Updating database"));
          await articlesCollection.updateOne(findExpression, {
            $set: {
              lastViewsMilestone: milestoneReached,
              lastTweetedAt: Date.now(),
            },
          });
          // send tweet
        }
      } else {
        console.info(generateLogString("New article found: " + article.title));
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
