/**
 * Reset — wipes ALL data and leaves a single temporary admin account.
 *
 *   npm --prefix server run seed:reset
 *
 * Use this to clear out demo/test data and start fresh. Sign in with the
 * admin below, then change the email/password in Settings and invite your
 * real team from the Team page.
 */
import 'dotenv/config';
import mongoose from 'mongoose';

import User from '../models/User.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import TeamMember from '../models/TeamMember.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Salary from '../models/Salary.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import AgencySettings from '../models/AgencySettings.js';

// ---- Temporary admin — change these in Settings after first login ----
const ADMIN = {
  name: 'Admin',
  email: 'admin@renderloop.com',
  password: 'admin12345',
  role: 'admin',
};

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[seed:reset] connected');

  console.log('[seed:reset] wiping all collections…');
  await Promise.all([
    User.deleteMany({}),
    Client.deleteMany({}),
    Project.deleteMany({}),
    TeamMember.deleteMany({}),
    Payment.deleteMany({}),
    Expense.deleteMany({}),
    Salary.deleteMany({}),
    Task.deleteMany({}),
    Notification.deleteMany({}),
    ActivityLog.deleteMany({}),
    AgencySettings.deleteMany({}),
  ]);

  await User.create(ADMIN);
  await AgencySettings.create({ key: 'default' });

  await mongoose.disconnect();
  console.log('\n[seed:reset] done — all data cleared.');
  console.log('Temporary admin login:');
  console.log(`  email:    ${ADMIN.email}`);
  console.log(`  password: ${ADMIN.password}`);
  console.log('Change these in Settings after you sign in.');
}

run().catch(async (err) => {
  console.error('[seed:reset] failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
