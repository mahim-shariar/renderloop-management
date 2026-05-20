import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Salary from '../models/Salary.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import Task from '../models/Task.js';
import TeamMember from '../models/TeamMember.js';

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function monthsAgo(n) {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - n, 1);
}
function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const ACTIVE_STATUSES = [
  'not_started',
  'footage_received',
  'in_progress',
  'internal_review',
  'awaiting_client_review',
  'revision',
  'approved',
];

async function sumAmount(Model, match) {
  const r = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amountCents' }, count: { $sum: 1 } } },
  ]);
  return { total: r[0]?.total || 0, count: r[0]?.count || 0 };
}

/** Received-payment totals grouped by YYYY-MM for the last `n` months. */
async function revenueByMonth(n = 12) {
  const since = monthsAgo(n - 1);
  const rows = await Payment.aggregate([
    { $match: { status: 'received', date: { $gte: since } } },
    {
      $group: {
        _id: { y: { $year: '$date' }, m: { $month: '$date' } },
        total: { $sum: '$amountCents' },
      },
    },
  ]);
  const map = new Map(
    rows.map((r) => [`${r._id.y}-${String(r._id.m).padStart(2, '0')}`, r.total])
  );
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = monthsAgo(i);
    const key = monthKey(d);
    out.push({
      month: key,
      label: d.toLocaleString('en-US', { month: 'short' }),
      total: map.get(key) || 0,
    });
  }
  return out;
}

async function expenseByMonth(n = 12) {
  const since = monthsAgo(n - 1);
  const rows = await Expense.aggregate([
    { $match: { date: { $gte: since } } },
    {
      $group: {
        _id: { y: { $year: '$date' }, m: { $month: '$date' } },
        total: { $sum: '$amountCents' },
      },
    },
  ]);
  const map = new Map(
    rows.map((r) => [`${r._id.y}-${String(r._id.m).padStart(2, '0')}`, r.total])
  );
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = monthsAgo(i);
    const key = monthKey(d);
    out.push({ month: key, total: map.get(key) || 0 });
  }
  return out;
}

export async function getOverview() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    revenueThisMonth,
    expensesThisMonth,
    pendingPayments,
    salaryDue,
    activeProjects,
    deliveredThisMonth,
    upcomingDeadlines,
    turnaroundAgg,
    statusBreakdown,
    revByMonth,
    topClientsAgg,
    atRiskProjects,
    recentPayments,
    recentProjects,
  ] = await Promise.all([
    sumAmount(Payment, { status: 'received', date: { $gte: monthStart } }),
    sumAmount(Expense, { date: { $gte: monthStart } }),
    sumAmount(Payment, { status: 'pending' }),
    sumAmount(Salary, { paid: false }),
    Project.countDocuments({ status: { $in: ACTIVE_STATUSES } }),
    Project.countDocuments({ status: 'delivered', deliveredAt: { $gte: monthStart } }),
    Project.countDocuments({
      deadline: { $gte: now, $lte: next7 },
      status: { $nin: ['delivered', 'cancelled'] },
    }),
    Project.aggregate([
      { $match: { status: 'delivered', startedAt: { $ne: null }, deliveredAt: { $ne: null } } },
      {
        $project: {
          days: {
            $divide: [{ $subtract: ['$deliveredAt', '$startedAt'] }, 1000 * 60 * 60 * 24],
          },
        },
      },
      { $group: { _id: null, avg: { $avg: '$days' } } },
    ]),
    Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    revenueByMonth(12),
    Payment.aggregate([
      { $match: { status: 'received', client: { $ne: null } } },
      { $group: { _id: '$client', total: { $sum: '$amountCents' } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
    Project.find({
      status: { $nin: ['delivered', 'cancelled'] },
      $or: [
        { deadline: { $lt: now } },
        {
          $expr: {
            $gt: ['$revisionRoundsUsed', '$revisionRoundsAllowed'],
          },
        },
      ],
    })
      .select('title deadline status revisionRoundsUsed revisionRoundsAllowed client')
      .populate('client', 'name')
      .sort('deadline')
      .limit(20)
      .lean(),
    Payment.find({ status: 'received' })
      .sort('-date')
      .limit(10)
      .populate('client', 'name')
      .lean(),
    Project.find({})
      .sort('-updatedAt')
      .limit(10)
      .select('title status updatedAt')
      .lean(),
  ]);

  const avgTurnaroundDays = turnaroundAgg[0]?.avg
    ? Number(turnaroundAgg[0].avg.toFixed(1))
    : null;

  const netProfit = revenueThisMonth.total - expensesThisMonth.total;

  // Resolve top client names
  const clientIds = topClientsAgg.map((c) => c._id);
  const clientDocs = await Client.find({ _id: { $in: clientIds } })
    .select('name company')
    .lean();
  const clientMap = new Map(clientDocs.map((c) => [c._id.toString(), c]));
  const topClients = topClientsAgg.map((c) => ({
    clientId: c._id,
    name: clientMap.get(c._id.toString())?.name || 'Unknown',
    total: c.total,
  }));

  // Recent activity feed (synthesized until the ActivityLog model lands in Phase 10)
  const activity = [
    ...recentPayments.map((p) => ({
      type: 'payment',
      title: `Payment received${p.client ? ` from ${p.client.name}` : ''}`,
      amountCents: p.amountCents,
      currency: p.currency,
      date: p.date,
      link: '/finance',
    })),
    ...recentProjects.map((p) => ({
      type: 'project',
      title: `${p.title} — ${p.status.replace(/_/g, ' ')}`,
      date: p.updatedAt,
      link: `/projects/${p._id}`,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 15);

  return {
    cards: {
      revenueThisMonth: revenueThisMonth.total,
      netProfit,
      pendingPayments: pendingPayments.total,
      salaryDueThisMonth: salaryDue.total,
      activeProjects,
      deliveredThisMonth,
      avgTurnaroundDays,
      upcomingDeadlines,
    },
    revenueByMonth: revByMonth,
    statusBreakdown: statusBreakdown.map((s) => ({ status: s._id, count: s.count })),
    topClients,
    activity,
    projectsAtRisk: atRiskProjects.map((p) => ({
      _id: p._id,
      title: p.title,
      deadline: p.deadline,
      status: p.status,
      overdue: p.deadline ? new Date(p.deadline) < now : false,
      revisionsExceeded:
        p.revisionRoundsAllowed != null && p.revisionRoundsUsed > p.revisionRoundsAllowed,
    })),
  };
}

export async function getAnalytics() {
  const [revByMonth, expByMonth, profitableClientsAgg, typeAgg, revisionAgg, teamAgg] =
    await Promise.all([
      revenueByMonth(12),
      expenseByMonth(12),
      Payment.aggregate([
        { $match: { status: 'received', client: { $ne: null } } },
        { $group: { _id: '$client', total: { $sum: '$amountCents' } } },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
      Project.aggregate([
        {
          $group: {
            _id: '$videoType',
            count: { $sum: 1 },
            revenue: { $sum: '$budgetCents' },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Project.aggregate([
        { $match: { client: { $ne: null } } },
        {
          $group: {
            _id: '$client',
            avgRevisions: { $avg: '$revisionRoundsUsed' },
            projects: { $sum: 1 },
          },
        },
        { $sort: { avgRevisions: -1 } },
        { $limit: 8 },
      ]),
      Project.aggregate([
        { $match: { status: 'delivered' } },
        { $unwind: '$assignedEditors' },
        {
          $group: {
            _id: '$assignedEditors.user',
            completed: { $sum: 1 },
            onTime: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$deadline', null] },
                      { $ne: ['$deliveredAt', null] },
                      { $lte: ['$deliveredAt', '$deadline'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            avgTurnaround: {
              $avg: {
                $cond: [
                  { $and: [{ $ne: ['$startedAt', null] }, { $ne: ['$deliveredAt', null] }] },
                  {
                    $divide: [
                      { $subtract: ['$deliveredAt', '$startedAt'] },
                      1000 * 60 * 60 * 24,
                    ],
                  },
                  null,
                ],
              },
            },
          },
        },
        { $sort: { completed: -1 } },
        { $limit: 12 },
      ]),
    ]);

  // Resolve client names
  const clientIds = [
    ...profitableClientsAgg.map((c) => c._id),
    ...revisionAgg.map((c) => c._id),
  ];
  const clientDocs = await Client.find({ _id: { $in: clientIds } })
    .select('name')
    .lean();
  const clientMap = new Map(clientDocs.map((c) => [c._id.toString(), c.name]));

  // Resolve editor names
  const editorIds = teamAgg.map((t) => t._id).filter(Boolean);
  const users = await mongoose
    .model('User')
    .find({ _id: { $in: editorIds } })
    .select('name')
    .lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

  // Revenue growth (MoM %)
  const revenueGrowth = revByMonth.map((m, i) => {
    const prev = i > 0 ? revByMonth[i - 1].total : 0;
    const growthPct = prev ? ((m.total - prev) / prev) * 100 : null;
    return { ...m, growthPct: growthPct != null ? Number(growthPct.toFixed(1)) : null };
  });

  const expenseVsProfit = revByMonth.map((m, i) => {
    const expense = expByMonth[i]?.total || 0;
    return {
      month: m.month,
      label: m.label,
      revenue: m.total,
      expense,
      profit: m.total - expense,
    };
  });

  return {
    revenueGrowth,
    profitableClients: profitableClientsAgg.map((c) => ({
      clientId: c._id,
      name: clientMap.get(c._id.toString()) || 'Unknown',
      total: c.total,
    })),
    projectTypeBreakdown: typeAgg.map((t) => ({
      videoType: t._id,
      count: t.count,
      revenue: t.revenue,
    })),
    teamProductivity: teamAgg.map((t) => ({
      userId: t._id,
      name: t._id ? userMap.get(t._id.toString()) || 'Unknown' : 'Unassigned',
      completed: t.completed,
      onTime: t.onTime,
      onTimePct: t.completed ? Math.round((t.onTime / t.completed) * 100) : 0,
      avgTurnaroundDays: t.avgTurnaround != null ? Number(t.avgTurnaround.toFixed(1)) : null,
    })),
    expenseVsProfit,
    revisionAnalytics: revisionAgg.map((c) => ({
      clientId: c._id,
      name: clientMap.get(c._id.toString()) || 'Unknown',
      avgRevisions: Number((c.avgRevisions || 0).toFixed(2)),
      projects: c.projects,
    })),
  };
}

/**
 * Personal dashboard for the logged-in editor — their workload, progress and
 * earnings. Never exposes client budgets; payouts are the editor's own.
 */
export async function getMyDashboard(user) {
  const uid = new mongoose.Types.ObjectId(user._id);
  const monthStart = startOfMonth();

  const [allMine, deliveredThisMonth, perfAgg, openTasks, teamMember] = await Promise.all([
    Project.find({ 'assignedEditors.user': uid })
      .select('title status deadline videoType priority assignedEditors client updatedAt')
      .populate('client', 'name')
      .sort('-updatedAt')
      .limit(100)
      .lean(),
    Project.countDocuments({
      'assignedEditors.user': uid,
      status: 'delivered',
      deliveredAt: { $gte: monthStart },
    }),
    Project.aggregate([
      { $match: { 'assignedEditors.user': uid, status: 'delivered' } },
      {
        $group: {
          _id: null,
          completed: { $sum: 1 },
          onTime: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$deadline', null] },
                    { $ne: ['$deliveredAt', null] },
                    { $lte: ['$deliveredAt', '$deadline'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          avgTurnaround: {
            $avg: {
              $cond: [
                { $and: [{ $ne: ['$startedAt', null] }, { $ne: ['$deliveredAt', null] }] },
                { $divide: [{ $subtract: ['$deliveredAt', '$startedAt'] }, 1000 * 60 * 60 * 24] },
                null,
              ],
            },
          },
        },
      },
    ]),
    Task.find({ assignedTo: uid, status: { $ne: 'done' } })
      .select('title status priority dueDate project')
      .populate('project', 'title')
      .sort('dueDate')
      .limit(25)
      .lean(),
    TeamMember.findOne({ user: uid }).select('_id').lean(),
  ]);

  const perf = perfAgg[0] || { completed: 0, onTime: 0, avgTurnaround: null };

  let earningsThisMonth = 0;
  let pendingPayout = 0;
  if (teamMember) {
    const [paid, pending] = await Promise.all([
      sumAmount(Salary, { teamMember: teamMember._id, paid: true, paidAt: { $gte: monthStart } }),
      sumAmount(Salary, { teamMember: teamMember._id, paid: false }),
    ]);
    earningsThisMonth = paid.total;
    pendingPayout = pending.total;
  }

  const uidStr = user._id.toString();
  // Each project keeps only this editor's own payout, never the client budget.
  const decorate = (p) => {
    const mine = (p.assignedEditors || []).find(
      (a) => (a.user?._id || a.user)?.toString() === uidStr
    );
    return {
      _id: p._id,
      title: p.title,
      status: p.status,
      deadline: p.deadline,
      videoType: p.videoType,
      priority: p.priority,
      client: p.client,
      myPayoutCents: mine?.payoutCents ?? 0,
    };
  };

  const activeProjects = allMine.filter((p) => ACTIVE_STATUSES.includes(p.status));
  const now = new Date();
  const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    cards: {
      activeProjects: activeProjects.length,
      deliveredThisMonth,
      avgTurnaroundDays:
        perf.avgTurnaround != null ? Number(perf.avgTurnaround.toFixed(1)) : null,
      onTimePct: perf.completed ? Math.round((perf.onTime / perf.completed) * 100) : 0,
      openTasks: openTasks.length,
      upcomingDeadlines: activeProjects.filter(
        (p) => p.deadline && new Date(p.deadline) >= now && new Date(p.deadline) <= next7
      ).length,
      earningsThisMonth,
      pendingPayout,
    },
    myProjects: activeProjects.map(decorate),
    myTasks: openTasks,
  };
}
