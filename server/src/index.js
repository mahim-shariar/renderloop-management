import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { runSweep } from './services/notification.service.js';

const PORT = process.env.PORT || 5000;
const SWEEP_INTERVAL_MS = 30 * 60 * 1000; // every 30 minutes

// Generate time-based notifications (deadlines, salary due, overdue payments).
function startNotificationSweep() {
  const sweep = () =>
    runSweep().catch((err) => console.error('[sweep] failed:', err.message));
  setTimeout(sweep, 20_000); // first run shortly after boot
  setInterval(sweep, SWEEP_INTERVAL_MS);
}

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error('[boot] initial DB connection failed:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`[renderloop-server] listening on http://localhost:${PORT}`);
  });
  startNotificationSweep();
}

start();
