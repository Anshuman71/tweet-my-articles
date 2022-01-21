import { NextApiRequest, NextApiResponse } from "next";
import connectToDatabase from "../../../mongodb";
import { createDevArticle, getPublishedArticlesFromDEV } from "../../../utils";
import { COLLECTION_NAMES, DevArticle, SOURCE } from "../../../types";
import { REACTIONS_MILESTONE_SEQUENCE } from "../../../constants";

export default async function reactions(
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
        const milestoneReached = REACTIONS_MILESTONE_SEQUENCE.find(
          (milestone) => article.public_reactions_count > milestone
        );
        if (
          milestoneReached &&
          milestoneReached !== value.lastReactionsMilestone
        ) {
          await articlesCollection.updateOne(findExpression, {
            $set: {
              lastReactionsMilestone: milestoneReached,
              last_tweeted_at: Date.now(),
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
