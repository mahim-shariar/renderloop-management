/**
 * Demo seed — populates the whole app with realistic test data so the
 * dashboards, charts and analytics have something to show.
 *
 *   npm --prefix server run seed:demo
 *
 * It wipes the operational collections (clients, projects, team, finance,
 * tasks, notifications, activity) and recreates them. User accounts are
 * upserted, never wiped.
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

// ---------- date helpers ----------
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);
const daysFromNow = (n) => new Date(Date.now() + n * DAY);
const monthsAgo = (n) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - n, 12);
};
const pick = (arr, i) => arr[i % arr.length];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ---------- user accounts ----------
const USERS = [
  { name: 'Admin', email: 'admin@renderloop.local', password: 'admin12345', role: 'admin' },
  { name: 'Manager Maya', email: 'manager@renderloop.local', password: 'manager12345', role: 'manager' },
  { name: 'Editor Eli', email: 'eli@renderloop.local', password: 'editor12345', role: 'editor' },
  { name: 'Editor Priya', email: 'priya@renderloop.local', password: 'editor12345', role: 'editor' },
  { name: 'Editor Marco', email: 'marco@renderloop.local', password: 'editor12345', role: 'editor' },
  { name: 'Editor Sana', email: 'sana@renderloop.local', password: 'editor12345', role: 'editor' },
  { name: 'Client Viewer', email: 'client@renderloop.local', password: 'client12345', role: 'client' },
];

async function upsertUsers() {
  const byEmail = {};
  for (const u of USERS) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create(u);
      console.log(`  + user ${u.email}`);
    } else if (!user.isActive) {
      // Demo seed recreates team members — make sure their logins are active.
      user.isActive = true;
      await user.save();
      console.log(`  ~ reactivated ${u.email}`);
    }
    byEmail[u.email] = user;
  }
  return byEmail;
}

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[seed:demo] connected');

  console.log('[seed:demo] clearing operational collections…');
  await Promise.all([
    Client.deleteMany({}),
    Project.deleteMany({}),
    TeamMember.deleteMany({}),
    Payment.deleteMany({}),
    Expense.deleteMany({}),
    Salary.deleteMany({}),
    Task.deleteMany({}),
    Notification.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);

  const users = await upsertUsers();
  const admin = users['admin@renderloop.local'];
  const manager = users['manager@renderloop.local'];
  const editors = [
    users['eli@renderloop.local'],
    users['priya@renderloop.local'],
    users['marco@renderloop.local'],
    users['sana@renderloop.local'],
  ];

  // ---------- agency settings ----------
  await AgencySettings.findOneAndUpdate(
    { key: 'default' },
    {
      key: 'default',
      agencyName: 'RenderLoop Studio',
      email: 'hello@renderloop.studio',
      phone: '+1 415 555 0117',
      address: '24 Cutting Room Ave, San Francisco, CA',
      defaultRevisionRounds: 2,
      defaultCurrency: 'USD',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // ---------- team members ----------
  const teamSpec = [
    { name: 'Eli Tan', email: 'eli@renderloop.local', user: editors[0]._id, role: 'editor', specialties: ['YouTube long-form', 'storytelling'], salaryType: 'monthly', rateCents: 380000, availability: 'available', paymentMethod: 'wise' },
    { name: 'Priya Rao', email: 'priya@renderloop.local', user: editors[1]._id, role: 'editor', specialties: ['shorts', 'reels', 'pacing'], salaryType: 'per_project', rateCents: 22000, availability: 'busy', paymentMethod: 'payoneer' },
    { name: 'Marco Bianchi', email: 'marco@renderloop.local', user: editors[2]._id, role: 'colorist', specialties: ['color grading', 'DaVinci'], salaryType: 'per_project', rateCents: 18000, availability: 'available', paymentMethod: 'bank' },
    { name: 'Sana Iqbal', email: 'sana@renderloop.local', user: editors[3]._id, role: 'motion_graphics', specialties: ['After Effects', 'titles'], salaryType: 'monthly', rateCents: 340000, availability: 'available', paymentMethod: 'wise' },
    { name: 'Theo Novak', email: 'theo@freelance.dev', role: 'sound_designer', specialties: ['mixing', 'sfx'], salaryType: 'per_minute_of_footage', rateCents: 1500, availability: 'on_leave', paymentMethod: 'paypal' },
    { name: 'Lena Park', email: 'lena@freelance.dev', role: 'thumbnail_designer', specialties: ['thumbnails', 'CTR optimization'], salaryType: 'per_project', rateCents: 6000, availability: 'available', paymentMethod: 'wise' },
  ];
  const team = [];
  for (const t of teamSpec) {
    team.push(
      await TeamMember.create({
        ...t,
        currency: 'USD',
        joinedAt: monthsAgo(rand(3, 14)),
        payoutDetails: `${t.paymentMethod} account for ${t.name}`,
        createdBy: admin._id,
      })
    );
  }
  console.log(`  + ${team.length} team members`);

  // ---------- clients ----------
  const clientSpec = [
    { name: 'Jordan Wells', company: 'PixelPeak Media', email: 'jordan@pixelpeak.com', country: 'United States', timezone: 'America/Los_Angeles', paymentMethod: 'wise', preferredPlatforms: ['YouTube'], defaultRevisionRounds: 2, status: 'active' },
    { name: 'Amara Okafor', company: 'Bright Lattice', email: 'amara@brightlattice.io', country: 'United Kingdom', timezone: 'Europe/London', paymentMethod: 'paypal', preferredPlatforms: ['YouTube', 'Instagram'], defaultRevisionRounds: 3, status: 'active' },
    { name: 'Hiro Tanaka', company: 'Tanaka Films', email: 'hiro@tanakafilms.jp', country: 'Japan', timezone: 'Asia/Tokyo', paymentMethod: 'bank', preferredPlatforms: ['YouTube', 'TikTok'], defaultRevisionRounds: 1, status: 'active' },
    { name: 'Sofia Reyes', company: 'Reyes Coaching', email: 'sofia@reyescoaching.com', country: 'Spain', timezone: 'Europe/Madrid', paymentMethod: 'payoneer', preferredPlatforms: ['Instagram', 'TikTok'], defaultRevisionRounds: 2, status: 'active' },
    { name: 'Daniel Kerr', company: 'NorthSound Podcast', email: 'dan@northsound.fm', country: 'Canada', timezone: 'America/Toronto', paymentMethod: 'wise', preferredPlatforms: ['YouTube'], defaultRevisionRounds: 2, status: 'paused' },
    { name: 'Mei Lin', company: 'Lin Ecommerce', email: 'mei@linecom.co', country: 'Singapore', timezone: 'Asia/Singapore', paymentMethod: 'crypto', preferredPlatforms: ['TikTok', 'Facebook'], defaultRevisionRounds: 3, status: 'churned' },
  ];
  const clients = [];
  for (const c of clientSpec) {
    clients.push(
      await Client.create({
        ...c,
        handles: { discord: `${c.name.split(' ')[0].toLowerCase()}#1234` },
        lastContactedAt: daysAgo(rand(1, 30)),
        communicationLog: [
          { body: 'Kicked off the engagement on a discovery call.', author: manager._id, at: daysAgo(rand(20, 40)) },
        ],
        notes: 'Imported via demo seed.',
        createdBy: admin._id,
      })
    );
  }
  console.log(`  + ${clients.length} clients`);

  // ---------- projects ----------
  const VIDEO_TYPES = ['youtube_long', 'youtube_short', 'reel', 'tiktok', 'ad', 'podcast', 'corporate'];
  const projectSpec = [
    { title: 'Q2 Brand Documentary', client: 0, videoType: 'youtube_long', status: 'delivered', budget: 320000, deliveredOffset: 8, startOffset: 30 },
    { title: 'Product Launch Teaser', client: 0, videoType: 'ad', status: 'delivered', budget: 145000, deliveredOffset: 20, startOffset: 35 },
    { title: 'Founder Story — Episode 1', client: 1, videoType: 'youtube_long', status: 'delivered', budget: 280000, deliveredOffset: 14, startOffset: 44 },
    { title: 'Weekly Shorts Pack — May', client: 1, videoType: 'youtube_short', status: 'in_progress', budget: 90000, startOffset: 9 },
    { title: 'TikTok Growth Series', client: 2, videoType: 'tiktok', status: 'awaiting_client_review', budget: 60000, startOffset: 12 },
    { title: 'Cinematic Channel Trailer', client: 2, videoType: 'youtube_long', status: 'revision', budget: 210000, startOffset: 22, revisionsUsed: 3, revisionsAllowed: 1 },
    { title: 'Coaching Reel Bundle', client: 3, videoType: 'reel', status: 'internal_review', budget: 75000, startOffset: 6 },
    { title: 'Webinar Recap Edit', client: 3, videoType: 'corporate', status: 'footage_received', budget: 110000, startOffset: 3 },
    { title: 'NorthSound Ep. 42', client: 4, videoType: 'podcast', status: 'on_hold', budget: 95000, startOffset: 18 },
    { title: 'Holiday Campaign Ad', client: 5, videoType: 'ad', status: 'cancelled', budget: 130000, startOffset: 50 },
    { title: 'Channel Re-Brand Sizzle', client: 0, videoType: 'youtube_short', status: 'not_started', budget: 48000 },
    { title: 'Investor Update Q2', client: 1, videoType: 'corporate', status: 'approved', budget: 160000, startOffset: 16 },
    { title: 'Behind The Scenes Vlog', client: 2, videoType: 'youtube_long', status: 'in_progress', budget: 175000, startOffset: 5, overdue: true },
    { title: 'Reels Sprint — Coaching', client: 3, videoType: 'reel', status: 'awaiting_client_review', budget: 82000, startOffset: 11 },
  ];

  const projects = [];
  for (let i = 0; i < projectSpec.length; i++) {
    const s = projectSpec[i];
    const client = clients[s.client];
    const ed1 = editors[i % editors.length];
    const ed2 = editors[(i + 1) % editors.length];
    const startedAt = s.startOffset ? daysAgo(s.startOffset) : undefined;
    const deliveredAt =
      s.status === 'delivered' && s.deliveredOffset ? daysAgo(s.deliveredOffset) : undefined;
    const deadline = s.overdue
      ? daysAgo(rand(2, 6))
      : s.status === 'delivered'
      ? deliveredAt
      : daysFromNow(rand(3, 40));

    const revAllowed = s.revisionsAllowed ?? client.defaultRevisionRounds ?? 2;
    const revUsed = s.revisionsUsed ?? (s.status === 'revision' ? 1 : 0);

    const draftLinks = [];
    const draftCount = ['delivered', 'approved', 'awaiting_client_review', 'revision'].includes(s.status)
      ? Math.max(1, revUsed + 1)
      : 0;
    for (let v = 1; v <= draftCount; v++) {
      draftLinks.push({
        version: v,
        url: `https://frame.io/demo/${s.title.replace(/\s+/g, '-').toLowerCase()}-v${v}`,
        sentAt: daysAgo(rand(4, 25)),
        sentBy: ed1._id,
        clientFeedback: v < draftCount ? 'Tighten the intro and swap the music bed.' : '',
      });
    }

    projects.push(
      await Project.create({
        title: s.title,
        client: client._id,
        projectManager: manager._id,
        assignedEditors: [
          // The editor sees only their own payout — roughly a share of the budget.
          { user: ed1._id, role: 'editor', payoutCents: Math.round(s.budget * 0.3) },
          { user: ed2._id, role: 'colorist', payoutCents: Math.round(s.budget * 0.15) },
        ],
        videoType: s.videoType,
        aspectRatio: ['youtube_short', 'reel', 'tiktok'].includes(s.videoType) ? '9:16' : '16:9',
        targetDurationSec: rand(45, 900),
        actualDurationSec: deliveredAt ? rand(45, 900) : undefined,
        platform: pick(['YouTube', 'Instagram', 'TikTok'], i),
        budgetCents: s.budget,
        currency: 'USD',
        deadline,
        startedAt,
        deliveredAt,
        priority: pick(['low', 'normal', 'high', 'urgent'], i),
        status: s.status,
        revisionRoundsAllowed: revAllowed,
        revisionRoundsUsed: revUsed,
        rawFootageLinks: [
          { label: 'Raw footage', url: `https://drive.google.com/demo/${i}`, addedBy: ed1._id },
        ],
        draftLinks,
        finalDeliveryLink: deliveredAt ? `https://youtu.be/demo${i}` : undefined,
        clientBrief: 'Punchy, retention-focused edit. Match the brand tone from prior videos.',
        internalNotes: 'Demo project created by seed:demo.',
        tags: ['demo', s.videoType],
        createdBy: admin._id,
      })
    );
  }
  console.log(`  + ${projects.length} projects`);

  // ---------- payments (spread across 12 months for charts) ----------
  const SOURCES = ['client_direct', 'fiverr', 'upwork', 'wise', 'payoneer', 'paypal'];
  const payments = [];
  for (let m = 11; m >= 0; m--) {
    const count = rand(3, 6);
    for (let k = 0; k < count; k++) {
      const client = pick(clients, m + k);
      payments.push({
        amountCents: rand(40, 320) * 1000,
        currency: 'USD',
        date: new Date(monthsAgo(m).getFullYear(), monthsAgo(m).getMonth(), rand(2, 27)),
        source: pick(SOURCES, m + k),
        client: client._id,
        project: pick(projects, m + k)._id,
        invoiceNumber: `INV-${monthsAgo(m).getFullYear()}-${String(m * 10 + k).padStart(3, '0')}`,
        status: 'received',
        createdBy: admin._id,
      });
    }
  }
  // a few pending / overdue
  payments.push(
    { amountCents: 180000, currency: 'USD', date: daysAgo(10), source: 'client_direct', client: clients[1]._id, status: 'pending', invoiceNumber: 'INV-PEND-01', createdBy: admin._id },
    { amountCents: 95000, currency: 'USD', date: daysFromNow(8), source: 'wise', client: clients[2]._id, status: 'pending', invoiceNumber: 'INV-PEND-02', createdBy: admin._id }
  );
  await Payment.insertMany(payments);
  console.log(`  + ${payments.length} payments`);

  // ---------- expenses ----------
  const SUBS = [
    ['Adobe Creative Cloud', 5999], ['Frame.io', 2500], ['Epidemic Sound', 1700],
    ['Artlist', 1660], ['Envato Elements', 1650], ['Storyblocks', 3000],
  ];
  const expenses = [];
  for (let m = 5; m >= 0; m--) {
    for (const [name, amt] of SUBS) {
      expenses.push({
        name,
        amountCents: amt,
        currency: 'USD',
        category: 'software_subscription',
        date: new Date(monthsAgo(m).getFullYear(), monthsAgo(m).getMonth(), 3),
        paid: true,
        recurring: true,
        createdBy: admin._id,
      });
    }
  }
  expenses.push(
    { name: 'YouTube ads campaign', amountCents: 60000, currency: 'USD', category: 'ads', date: daysAgo(12), paid: true, createdBy: admin._id },
    { name: 'New SSD + capture card', amountCents: 42000, currency: 'USD', category: 'equipment', date: daysAgo(40), paid: true, createdBy: admin._id },
    { name: 'Stock footage pack', amountCents: 14900, currency: 'USD', category: 'stock_assets', date: daysAgo(6), paid: false, createdBy: admin._id }
  );
  await Expense.insertMany(expenses);
  console.log(`  + ${expenses.length} expenses`);

  // ---------- salaries / payouts ----------
  const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const lastPeriod = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();
  const salaries = [
    { teamMember: team[0]._id, type: 'monthly', period: lastPeriod, amountCents: 380000, paid: true, paidAt: daysAgo(20), transactionRef: 'WISE-8821' },
    { teamMember: team[3]._id, type: 'monthly', period: lastPeriod, amountCents: 340000, paid: true, paidAt: daysAgo(20), transactionRef: 'WISE-8822' },
    { teamMember: team[0]._id, type: 'monthly', period, amountCents: 380000, paid: false, dueOn: daysFromNow(4) },
    { teamMember: team[3]._id, type: 'monthly', period, amountCents: 340000, paid: false, dueOn: daysFromNow(4) },
    { teamMember: team[1]._id, type: 'per_project', project: projects[0]._id, amountCents: 22000, paid: false, dueOn: daysAgo(1) },
    { teamMember: team[2]._id, type: 'per_project', project: projects[2]._id, amountCents: 18000, paid: true, paidAt: daysAgo(9), transactionRef: 'BANK-5510' },
  ];
  for (const s of salaries) await Salary.create({ ...s, currency: 'USD', createdBy: admin._id });
  console.log(`  + ${salaries.length} payouts`);

  // ---------- tasks ----------
  const tasks = [
    { title: 'Review draft v2 for TikTok Growth Series', assignedTo: editors[0]._id, priority: 'high', status: 'in_progress', dueDate: daysFromNow(2), project: projects[4]._id },
    { title: 'Export final deliverable — Investor Update Q2', assignedTo: editors[1]._id, priority: 'urgent', status: 'todo', dueDate: daysFromNow(1), project: projects[11]._id },
    { title: 'Color pass on Cinematic Channel Trailer', assignedTo: editors[2]._id, priority: 'normal', status: 'todo', dueDate: daysFromNow(5), project: projects[5]._id },
    { title: 'Design 3 thumbnail options', assignedTo: editors[3]._id, priority: 'normal', status: 'done', dueDate: daysAgo(3) },
    { title: 'Chase footage from NorthSound', assignedTo: manager._id, priority: 'high', status: 'in_progress', dueDate: daysFromNow(3), project: projects[8]._id },
    { title: 'Send May invoices', assignedTo: admin._id, priority: 'normal', status: 'todo', dueDate: daysFromNow(6) },
  ];
  for (const t of tasks) await Task.create({ ...t, createdBy: manager._id });
  console.log(`  + ${tasks.length} tasks`);

  // ---------- a few activity log entries ----------
  await ActivityLog.insertMany([
    { actor: manager._id, action: 'project_created', summary: 'Created project "Behind The Scenes Vlog"', entityType: 'Project', entityId: projects[12]._id, link: `/projects/${projects[12]._id}` },
    { actor: editors[0]._id, action: 'draft_uploaded', summary: 'Draft v1 posted on "TikTok Growth Series"', entityType: 'Project', entityId: projects[4]._id, link: `/projects/${projects[4]._id}` },
    { actor: admin._id, action: 'payment_received', summary: 'Payment of $1,800 received', entityType: 'Payment', link: '/finance' },
  ]);

  await mongoose.disconnect();
  console.log('\n[seed:demo] done.');
  console.log('Login: admin@renderloop.local / admin12345');
}

run().catch(async (err) => {
  console.error('[seed:demo] failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
