import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache ?? { conn: null, promise: null };

globalThis.mongooseCache = cached;

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const parsedTimeout = Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? "10000");
  const serverSelectionTimeoutMS = Number.isFinite(parsedTimeout) ? parsedTimeout : 10000;
  const connectionOptions: mongoose.ConnectOptions & {
    serverSelectionTimeoutMS?: number;
    connectTimeoutMS?: number;
  } = {
    bufferCommands: false,
    serverSelectionTimeoutMS,
    connectTimeoutMS: serverSelectionTimeoutMS,
  };

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, connectionOptions).catch((error) => {
      // Allow retries on the next request if the first connection attempt fails.
      cached.promise = null;
      cached.conn = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}
