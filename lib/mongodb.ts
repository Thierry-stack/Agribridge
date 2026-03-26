import "./register-models";
import mongoose from "mongoose";

/**
 * Agribridge — MongoDB connection helper for Next.js API routes.
 *
 * Why we cache the connection:
 * - In development, Next.js hot-reloads often. Without a cache, each reload could
 *   create a new Mongoose connection and eventually hit MongoDB's connection limit.
 * - We store one promise + connection on `globalThis` so all imports share the same client.
 */

// Extend globalThis so TypeScript knows about our cache field (dev-only pattern).
const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

function getCache() {
  if (!globalForMongoose.mongooseCache) {
    globalForMongoose.mongooseCache = { conn: null, promise: null };
  }
  return globalForMongoose.mongooseCache;
}

/**
 * Connects to MongoDB once and reuses the connection.
 * Call this at the start of any API route that needs the database.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === "") {
    throw new Error(
      "Missing MONGODB_URI. Copy .env.example to .env.local and set your MongoDB connection string."
    );
  }

  const cached = getCache();

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // bufferCommands: false avoids buffering while disconnected (fail fast in serverless).
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
