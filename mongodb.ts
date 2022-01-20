import { Db } from "mongodb";

const url = require("url");
const MongoClient = require("mongodb").MongoClient;

// Create cached connection variable
let cachedDb: Db | null = null;

// A function for connecting to MongoDB,
// taking a single parameter of the connection string
export default async function connectToDatabase(): Promise<Db> {
  // If the database connection is cached,
  // use it instead of creating a new connection
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
  const db = client.db(process.env.DB_NAME);

  // Cache the database connection and return the connection
  cachedDb = db;
  return db;
}

export const COLLECTION_NAMES = {
  articles: "articles",
};