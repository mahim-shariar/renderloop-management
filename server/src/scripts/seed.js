import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const SEED_USERS = [
  {
    name: 'Admin',
    email: 'admin@renderloop.local',
    password: 'admin12345',
    role: 'admin',
  },
  {
    name: 'Manager Maya',
    email: 'manager@renderloop.local',
    password: 'manager12345',
    role: 'manager',
  },
  {
    name: 'Editor Eli',
    email: 'eli@renderloop.local',
    password: 'editor12345',
    role: 'editor',
  },
  {
    name: 'Editor Priya',
    email: 'priya@renderloop.local',
    password: 'editor12345',
    role: 'editor',
  },
];

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);

  for (const u of SEED_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`= skip ${u.email} (exists)`);
      continue;
    }
    await User.create(u);
    console.log(`+ created ${u.role.padEnd(8)} ${u.email} (password: ${u.password})`);
  }

  await mongoose.disconnect();
  console.log('\nSeed complete.');
  console.log('Default admin login: admin@renderloop.local / admin12345');
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
