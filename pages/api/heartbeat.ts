import { NextApiRequest, NextApiResponse } from "next";

export default async function heartbeat(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const date = new Date();
  console.log("time at running location ", date.toLocaleTimeString());
  response.status(200);
  response.send({
    time: date.toString(),
    local: date.toLocaleTimeString(),
    utc: date.toUTCString(),
    iso: date.toISOString(),
  });
}
