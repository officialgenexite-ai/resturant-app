import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI as string;

if (!MONGO_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}
/**
 * TypeScript needs an explicit interface for the cached connection object
 * since `global` doesn't know about our custom `mongoose` property by default.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS global type so TS stops complaining about global.mongoose
declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  // 1. Reuse existing connection on warm serverless instance
  if (cached.conn) {
    return cached.conn;
  }

  // 2. If connection is being established, wait on the same promise
  //    instead of racing to create a second one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // fail fast instead of queuing ops if disconnected
      maxPoolSize: 10,       // safe upper bound for serverless concurrency
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(MONGO_URI, opts)
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected");
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null; // reset so next invocation can retry
        console.error("❌ MongoDB connection error:", err.message);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default dbConnect;
