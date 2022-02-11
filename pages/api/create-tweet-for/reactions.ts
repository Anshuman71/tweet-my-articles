import { NextApiRequest, NextApiResponse } from "next";
import connectToDatabase from "../../../mongodb";
import {
  createDevArticle,
  formatLog,
  getPublishedArticlesFromDEV,
  getReactionsTweetBody,
  sendTweet,
} from "../../../utils";
import { Document } from "mongodb";
import { Article, COLLECTION_NAMES, SOURCE } from "../../../types";
import { REACTIONS_MILESTONE_SEQUENCE } from "../../../constants";
import {isWithinInterval, subDays} from 'date-fns'

export default async function reactions(
  request: NextApiRequest,
  response: NextApiResponse
) {
  console.info(formatLog("Running Reactions Function"));
  try {
    const devArticles = await getPublishedArticlesFromDEV();
    console.info(formatLog("Total Articles: " + devArticles.length));
    const database = await connectToDatabase();
    const articlesCollection = database.collection(COLLECTION_NAMES.articles);
    const devArticleFromDB = (await articlesCollection
      .find({ source: SOURCE.dev })
      .toArray()) as unknown as Article[];
    console.info(formatLog("Total Articles In DB: " + devArticleFromDB.length));
    const newArticles: Document[] = [];
    let oneTweetSent = false;

    for (let index = 0; index < devArticles.length; index++) {
      const article = devArticles[index];
      const findExpression = {
        id: article.id,
        source: SOURCE.dev,
      };
      const value = devArticleFromDB.find((item) => item.id === article.id);

      if (value) {
        const milestoneReached = REACTIONS_MILESTONE_SEQUENCE.find(
          (milestone) => article.public_reactions_count > milestone
        );
        console.info(formatLog("Milestone reached: " + milestoneReached));
        console.info(
          formatLog("Existing Milestone: " + value.lastReactionsMilestone)
        );
        const today = new Date()
        const tweetedRecently = isWithinInterval(new Date(value.lastTweetedAt), {
          start: subDays(today, 3),
          end: today
        })
        if (
            !oneTweetSent &&
            milestoneReached &&
            milestoneReached !== value.lastReactionsMilestone &&
            !tweetedRecently
        ) {
          console.info(formatLog("Sending Tweet!"));
          const tweetSent = await sendTweet(
            getReactionsTweetBody({ ...article, ...value })
          );
          if (tweetSent) {
            oneTweetSent = true;
            console.info(formatLog("Tweet sent successfully!"));
            await articlesCollection.updateOne(findExpression, {
              $set: {
                lastReactionsMilestone: milestoneReached,
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
