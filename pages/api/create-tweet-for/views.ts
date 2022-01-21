import { NextApiRequest, NextApiResponse } from "next";
import connectToDatabase from "../../../mongodb";
import { createDevArticle, getPublishedArticlesFromDEV } from "../../../utils";
import { COLLECTION_NAMES, DevArticle, SOURCE } from "../../../types";
import { VIEWS_MILESTONE_SEQUENCE } from "../../../constants";

export default async function views(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const devArticles = await getPublishedArticlesFromDEV();
    const database = await connectToDatabase();
    const articlesCollection = database.collection(COLLECTION_NAMES.articles);
    const devArticleFromDB = await articlesCollection
      .find({ source: SOURCE.dev })
      .toArray();

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
        if (milestoneReached && milestoneReached !== value.lastViewsMileStone) {
          await articlesCollection.updateOne(findExpression, {
            $set: {
              lastViewsMileStone: milestoneReached,
              lastTweetedAt: Date.now(),
            },
          });
          // send tweet
        }
      } else {
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
