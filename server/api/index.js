/**
 * Vercel serverless entry point for the RenderLoop API.
 *
 * Vercel invokes this exported handler for every request (see vercel.json
 * rewrites). The Express app from src/app.js handles all /api/* routing.
 * A cached Mongo connection is reused across warm invocations.
 */
import mongoose from 'mongoose';
import app from '../src/app.js';

let connectionPromise = null;

async function ensureDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
      .catch((err) => {
        connectionPromise = null; // allow retry on the next invocation
        throw err;
      });
  }
  await connectionPromise;
}

export default async function handler(req, res) {
  try {
    await ensureDB();
  } catch (err) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({ success: false, message: 'Database unavailable, try again shortly.' })
    );
    return;
  }
  return app(req, res);
}
