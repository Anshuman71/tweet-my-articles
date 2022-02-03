import { NextApiRequest, NextApiResponse } from "next";
import {
  formatLog,
  getFollowersFromDev,
  getMediumFollowers,
  getYoutubeSubscribers,
  sendTweet,
  twitterClient,
} from "../../../utils";
import { COLLECTION_NAMES } from "../../../types";
import connectToDatabase from "../../../mongodb";
import { startOfDay, isLastDayOfMonth, subMonths } from "date-fns";

export default async function endOfMonthStats(
  request: NextApiRequest,
  response: NextApiResponse
) {
  console.info(formatLog("Running End of Months Stats"));
  try {
    const devFollowers = await getFollowersFromDev();
    const ytSubs = await getYoutubeSubscribers();
    const mediumFollowers = await getMediumFollowers();
    const database = await connectToDatabase();
    const eomStatsCollection = database.collection(COLLECTION_NAMES.eomStats);
    const today = startOfDay(new Date());
    if (isLastDayOfMonth(today)) {
      const prevMonth = startOfDay(subMonths(today, 1));
      const twitterFollowers =
        await twitterClient.accountsAndUsers.followersIds({
          count: 5000,
        });
      const prevStats = await eomStatsCollection.findOne({
        eom: prevMonth.getTime(),
      });
      const newData = {
        eom: today.getTime(),
        devFollowers: devFollowers.length,
        ytSubs,
        twitterFollowers: twitterFollowers.ids.length,
        mediumFollowers,
      };
      await eomStatsCollection.insertOne(newData);

      if (prevStats) {
        await sendTweet(
          `📈 End of Month Stats: 📈\nNew people joined\nTwitter:${
            newData.twitterFollowers - prevStats.twitterFollowers
          }\nDEV:${newData.devFollowers - prevStats.devFollowers}\nYouTube:${
            newData.ytSubs - prevStats.ytSubs
          }\nMedium:${
            newData.mediumFollowers - prevStats.mediumFollowers
          }\nThanks for showing all the love and support.`
        );
      }
      response.status(200).send({
        type: "success",
        ...newData,
      });
    }
    response.status(200).send({
      type: "success",
      message: "Not the last day of month",
    });
  } catch (e: any) {
    response.status(500).send({
      type: "error",
      message: e.message,
    });
  }
}
