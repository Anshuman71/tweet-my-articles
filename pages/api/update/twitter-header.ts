import { NextApiRequest, NextApiResponse } from "next";
import {
  formatLog,
  getFollowersFromDev,
  getMediumFollowers,
  getYoutubeSubscribers,
  twitterClient,
} from "../../../utils";
import path from "path";
import jimp from "jimp";

export default async function views(
  request: NextApiRequest,
  response: NextApiResponse
) {
  console.info(formatLog("Running Update Twitter Header Function"));
  try {
    const devFollowers = await getFollowersFromDev();
    const ytSubs = await getYoutubeSubscribers();
    const mediumFollowers = await getMediumFollowers();

    const filePath = path.resolve("./public/yellow_twitter_header.png");
    const jimpFont = path.resolve(
      "./public/open-sans-32-black/open-sans-32-black.fnt"
    );
    path.resolve("./public/open-sans-32-black/open-sans-32-black.png");

    const image = await jimp.read(filePath);
    const font = await jimp.loadFont(jimpFont);
    image.print(font, 150, 98, ytSubs);
    image.print(font, 620, 98, devFollowers.length);
    image.print(font, 1130, 98, mediumFollowers);
    const fromImage = await image.getBufferAsync(image.getMIME());
    const updatedHeader =
      await twitterClient.accountsAndUsers.accountUpdateProfileBanner({
        banner: fromImage.toString("base64"),
        width: 1500,
        height: 500,
      });
    response.status(200).send({
      type: "success",
      updatedHeader,
      devFollowers: devFollowers.length,
      ytSubs,
      mediumFollowers,
    });
  } catch (e: any) {
    console.log(e);
    response.status(500).send({
      type: "error",
      message: e.message,
    });
  }
}
