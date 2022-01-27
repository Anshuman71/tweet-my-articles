import { NextApiRequest, NextApiResponse } from "next";
import { Document } from "mongodb";

import { VIEWS_MILESTONE_SEQUENCE } from "../../../constants";
import connectToDatabase from "../../../mongodb";
import { Article, COLLECTION_NAMES, DevArticle, SOURCE } from "../../../types";
import {
  createDevArticle,
  formatLog,
  getFollowersFromDev,
  getFollowersTweetBody,
  getPublishedArticlesFromDEV,
  getViewsTweetBody,
  sendTweet,
} from "../../../utils";

export default async function views(
  request: NextApiRequest,
  response: NextApiResponse
) {
  console.info(formatLog("Running Followers Function"));
  try {
    const followersFromDev = await getFollowersFromDev();
    console.info(formatLog("Total followers: " + followersFromDev.length));
    const database = await connectToDatabase();

    const followersCollection = database.collection(COLLECTION_NAMES.followers);
    const doc = await followersCollection.findOne({
      source: SOURCE.dev,
    });
    if (doc) {
      const milestoneReached = VIEWS_MILESTONE_SEQUENCE.find(
        (milestone) => followersFromDev.length > milestone
      );
      console.info(formatLog("Milestone reached: " + milestoneReached));
      console.info(formatLog("Existing Milestone: " + doc.lastMilestone));
      if (milestoneReached && milestoneReached !== doc.lastMilestone) {
        console.info(formatLog("Sending Tweet!"));
        const tweetSent = await sendTweet(
          getFollowersTweetBody(followersFromDev.length)
        );
        if (tweetSent) {
          console.info(formatLog("Tweet sent successfully!"));
          await followersCollection.updateOne(
            { source: SOURCE.dev },
            {
              $set: {
                lastMilestone: milestoneReached,
                lastTweetedAt: Date.now(),
              },
            }
          );
          console.info(formatLog("Data updated!"));
        } else {
          console.info(formatLog("Sending tweet failed!"));
        }
      }
    } else {
      await followersCollection.insertOne({
        source: SOURCE.dev,
        lastMilestone: 100,
        lastTweetedAt: Date.now(),
      });
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
