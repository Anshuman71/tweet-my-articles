export async function getPublishedArticlesFromDEV() {
  const res = await fetch(`${process.env.DEV_API_URL}/articles/me/published`, {
    headers: {
      "api-key": process.env.DEV_API_KEY as string,
    },
  });
  return res.json();
}
