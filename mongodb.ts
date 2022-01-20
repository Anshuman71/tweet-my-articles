import { Db } from "mongodb";
const MongoClient = require("mongodb").MongoClient;

// Create cached connection variable
let cachedDb: Db | null = null;

// A function for connecting to MongoDB,
export default async function connectToDatabase(): Promise<Db> {
  // If the database connection is cached, use it instead of creating a new connection
  if (cachedDb) {
    return cachedDb;
  }

  // If no connection is cached, create a new one
  const client = await MongoClient.connect(
    process.env.ATLAS_URI_PROD as string,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );

  // Select the database through the connection,
  const db: Db = client.db(process.env.DB_NAME);

  // Cache the database connection and return the connection
  cachedDb = db;
  return cachedDb;
}

export const COLLECTION_NAMES = {
  articles: "articles",
};
