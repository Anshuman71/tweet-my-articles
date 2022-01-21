import { NextApiRequest, NextApiResponse } from "next";
import connectToDatabase from "../../../mongodb";
import {
  createDevArticle,
  generateLogString,
  getPublishedArticlesFromDEV,
} from "../../../utils";
import { Document } from "mongodb";
import { Article, COLLECTION_NAMES, DevArticle, SOURCE } from "../../../types";
import { REACTIONS_MILESTONE_SEQUENCE } from "../../../constants";

export default async function reactions(
  request: NextApiRequest,
  response: NextApiResponse
) {
  console.info(generateLogString("Running Reactions Function"));
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
        console.info(
          generateLogString("Milestone reached: " + milestoneReached)
        );
        console.info(
          generateLogString(
            "Existing Milestone: " + value.lastReactionsMilestone
          )
        );
        if (
          milestoneReached &&
          milestoneReached !== value.lastReactionsMilestone
        ) {
          console.info(generateLogString("Updating database"));
          await articlesCollection.updateOne(findExpression, {
            $set: {
              lastReactionsMilestone: milestoneReached,
              lastTweetedAt: Date.now(),
            },
          });
          // send tweet
        }
      } else {
        console.info(generateLogString("New article found: " + article.title));
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
