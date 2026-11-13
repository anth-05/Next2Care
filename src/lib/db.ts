import mongoose from "mongoose";

/**
 * One shared MongoDB connection for the whole app.
 * In development Next.js reloads modules often, so the connection is cached on globalThis
 * to avoid opening a new one on every reload.
 */
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = globalThis as unknown as { _mongoose?: Cache };
const cache: Cache = g._mongoose ?? (g._mongoose = { conn: null, promise: null });

export class DbNotConfiguredError extends Error {
  constructor() {
    super("MONGODB_URI ontbreekt. Zet de connection string van MongoDB in .env.local (zie .env.example).");
  }
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectDb(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DbNotConfiguredError();
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || "next2care",
      serverSelectionTimeoutMS: 8000,
    });
  }
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null; // allow a retry on the next request
    throw err;
  }
  return cache.conn;
}
