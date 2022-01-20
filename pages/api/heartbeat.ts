import { NextApiRequest, NextApiResponse } from "next";

export default async function tweets(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const date = Date.now();
  console.log("time at running location ", date);
  response.status(200);
  response.send({
    date,
  });
}
