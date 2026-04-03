import dns from "node:dns";
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

let dnsConfigured = false;
let usingPublicDnsFallback = false;

function getConfiguredDnsServers() {
  return process.env.MONGODB_DNS_SERVERS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function applyDnsServers(servers: string[]) {
  try {
    dns.setServers(servers);
    dnsConfigured = true;
    usingPublicDnsFallback = servers.join(",") === "1.1.1.1,8.8.8.8";
    return true;
  } catch {
    return false;
  }
}

function configureMongoDns(mongoUri: string) {
  if (dnsConfigured || !mongoUri.startsWith("mongodb+srv://")) {
    return;
  }

  const configuredServers = getConfiguredDnsServers();

  if (!configuredServers?.length) {
    applyPublicDnsFallback();
    return;
  }

  if (!applyDnsServers(configuredServers)) {
    dnsConfigured = false;
  }
}

function isSrvDnsFailure(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("querysrv") || message.includes("econnrefused");
}

function applyPublicDnsFallback() {
  return applyDnsServers(["1.1.1.1", "8.8.8.8"]);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  configureMongoDns(mongoUri);

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

  const connectWithRetry = async () => {
    const attempts = Math.max(1, Number(process.env.MONGODB_CONNECT_RETRIES ?? "2"));
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await mongoose.connect(mongoUri, connectionOptions);
      } catch (error) {
        lastError = error;
        cached.promise = null;
        cached.conn = null;

        if (mongoUri.startsWith("mongodb+srv://") && isSrvDnsFailure(error)) {
          const configuredServers = getConfiguredDnsServers();
          const reapplied =
            configuredServers?.length
              ? applyDnsServers(configuredServers) || applyPublicDnsFallback()
              : !usingPublicDnsFallback && applyPublicDnsFallback();

          if (reapplied) {
            await wait(250 * attempt);
            continue;
          }
        }

        if (attempt >= attempts) {
          throw error;
        }

        await wait(250 * attempt);
      }
    }

    throw lastError instanceof Error ? lastError : new Error("MongoDB connection failed");
  };

  if (!cached.promise) {
    cached.promise = connectWithRetry();
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
