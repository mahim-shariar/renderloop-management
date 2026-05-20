import mongoose from 'mongoose';

const RETRY_DELAY_MS = 5_000;

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }

  mongoose.connection.on('connected', () => {
    console.log('[db] mongo connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[db] mongo error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] mongo disconnected — retrying in 5s');
    setTimeout(tryConnect, RETRY_DELAY_MS);
  });

  async function tryConnect() {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8_000 });
    } catch (err) {
      console.error('[db] connect failed:', err.message, '— retrying in 5s');
      setTimeout(tryConnect, RETRY_DELAY_MS);
    }
  }

  await tryConnect();
}
