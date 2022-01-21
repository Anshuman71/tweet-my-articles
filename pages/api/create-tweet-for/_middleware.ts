import { NextRequest, NextFetchEvent, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const apiKey = request.headers.get("api-key");
  console.info("========== Running middleware ============");
  if (request.method !== "POST" && apiKey !== process.env.API_KEY) {
    return NextResponse.json({
      type: "Error",
      code: 405,
      message: "Only POST method is accepted on this route",
    });
  }
}
