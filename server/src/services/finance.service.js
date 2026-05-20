import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Salary from '../models/Salary.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import ApiError from '../utils/ApiError.js';
import { logActivity } from './activity.service.js';
import { formatCents } from '../utils/format.js';

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfYear(d = new Date()) {
  return new Date(d.getFullYear(), 0, 1);
}

async function sum(Model, match) {
  const r = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amountCents' }, count: { $sum: 1 } } },
  ]);
  return { total: r[0]?.total || 0, count: r[0]?.count || 0 };
}

// ----- Payments -----

export async function listPayments(params = {}) {
  const filter = {};
  if (params.status) filter.status = params.status;
  if (params.source) filter.source = params.source;
  if (params.clientId) filter.client = params.clientId;
  if (params.projectId) filter.project = params.projectId;
  if (params.from || params.to) {
    filter.date = {};
    if (params.from) filter.date.$gte = new Date(params.from);
    if (params.to) filter.date.$lte = new Date(params.to);
  }
  const limit = params.limit ? Math.min(500, Number(params.limit)) : 200;
  const items = await Payment.find(filter)
    .sort('-date')
    .limit(limit)
    .populate('client', 'name')
    .populate('project', 'title')
    .lean();
  return { items };
}

export async function getPayment(id) {
  const payment = await Payment.findById(id)
    .populate('client', 'name company email country')
    .populate('project', 'title');
  if (!payment) throw ApiError.notFound('Payment not found');
  return payment;
}

export async function createPayment(data, userId) {
  const payment = await Payment.create({ ...data, createdBy: userId });
  if (payment.status === 'received') {
    await logActivity({
      actor: userId,
      action: 'payment_received',
      summary: `Payment of ${formatCents(payment.amountCents, payment.currency)} received`,
      entityType: 'Payment',
      entityId: payment._id,
      link: '/finance',
    });
  }
  return payment;
}
export async function updatePayment(id, data) {
  const p = await Payment.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!p) throw ApiError.notFound('Payment not found');
  return p;
}
export async function deletePayment(id) {
  const p = await Payment.findByIdAndDelete(id);
  if (!p) throw ApiError.notFound('Payment not found');
  return p;
}

export async function paymentsSummary() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const yearStart = startOfYear(now);
  const lastYearStart = startOfYear(new Date(now.getFullYear() - 1, 0, 1));
  const lastYearEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);

  const [thisMonth, lastMonth, thisYearToDate, lastYearSamePeriod, pending, bySource] =
    await Promise.all([
      sum(Payment, { status: 'received', date: { $gte: monthStart } }),
      sum(Payment, { status: 'received', date: { $gte: lastMonthStart, $lt: monthStart } }),
      sum(Payment, { status: 'received', date: { $gte: yearStart } }),
      sum(Payment, { status: 'received', date: { $gte: lastYearStart, $lte: lastYearEnd } }),
      sum(Payment, { status: 'pending' }),
      Payment.aggregate([
        { $match: { status: 'received', date: { $gte: yearStart } } },
        { $group: { _id: '$source', total: { $sum: '$amountCents' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

  return {
    thisMonth,
    lastMonth,
    thisYearToDate,
    lastYearSamePeriod,
    pending,
    bySource: bySource.map((b) => ({ source: b._id, total: b.total, count: b.count })),
  };
}

// ----- Expenses -----

export async function listExpenses(params = {}) {
  const filter = {};
  if (params.category) filter.category = params.category;
  if (params.paid !== undefined) filter.paid = params.paid === 'true' || params.paid === true;
  if (params.from || params.to) {
    filter.date = {};
    if (params.from) filter.date.$gte = new Date(params.from);
    if (params.to) filter.date.$lte = new Date(params.to);
  }
  const limit = params.limit ? Math.min(500, Number(params.limit)) : 200;
  const items = await Expense.find(filter).sort('-date').limit(limit).lean();
  return { items };
}

export async function createExpense(data, userId) {
  return Expense.create({ ...data, createdBy: userId });
}
export async function updateExpense(id, data) {
  const e = await Expense.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!e) throw ApiError.notFound('Expense not found');
  return e;
}
export async function deleteExpense(id) {
  const e = await Expense.findByIdAndDelete(id);
  if (!e) throw ApiError.notFound('Expense not found');
  return e;
}

export async function expensesSummary() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const yearStart = startOfYear(now);

  const [thisMonth, lastMonth, thisYearToDate, unpaid, byCategory] = await Promise.all([
    sum(Expense, { date: { $gte: monthStart } }),
    sum(Expense, { date: { $gte: lastMonthStart, $lt: monthStart } }),
    sum(Expense, { date: { $gte: yearStart } }),
    sum(Expense, { paid: false }),
    Expense.aggregate([
      { $match: { date: { $gte: yearStart } } },
      { $group: { _id: '$category', total: { $sum: '$amountCents' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  return {
    thisMonth,
    lastMonth,
    thisYearToDate,
    unpaid,
    byCategory: byCategory.map((b) => ({ category: b._id, total: b.total, count: b.count })),
  };
}

// ----- Salaries / Payouts -----

export async function listSalaries(params = {}) {
  const filter = {};
  if (params.paid !== undefined) filter.paid = params.paid === 'true' || params.paid === true;
  if (params.teamMemberId) filter.teamMember = params.teamMemberId;
  if (params.period) filter.period = params.period;
  const limit = params.limit ? Math.min(500, Number(params.limit)) : 200;
  const items = await Salary.find(filter)
    .sort([['paid', 1], ['dueOn', 1], ['createdAt', -1]])
    .limit(limit)
    .populate('teamMember', 'name role avatarUrl currency')
    .populate('project', 'title')
    .lean();
  return { items };
}

export async function createSalary(data, userId) {
  return Salary.create({ ...data, createdBy: userId });
}
export async function updateSalary(id, data) {
  const s = await Salary.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!s) throw ApiError.notFound('Payout not found');
  return s;
}
export async function deleteSalary(id) {
  const s = await Salary.findByIdAndDelete(id);
  if (!s) throw ApiError.notFound('Payout not found');
  return s;
}

export async function markPaid(id, { transactionRef } = {}, actorId) {
  const s = await Salary.findById(id).populate('teamMember', 'name');
  if (!s) throw ApiError.notFound('Payout not found');
  s.paid = true;
  s.paidAt = new Date();
  if (transactionRef) s.transactionRef = transactionRef;
  await s.save();
  await logActivity({
    actor: actorId,
    action: 'payout_paid',
    summary: `Payout of ${formatCents(s.amountCents, s.currency)} sent to ${s.teamMember?.name || 'team member'}`,
    entityType: 'Salary',
    entityId: s._id,
    link: '/finance',
  });
  return s;
}

export async function salariesSummary() {
  const [pending, paidThisMonth] = await Promise.all([
    sum(Salary, { paid: false }),
    sum(Salary, {
      paid: true,
      paidAt: { $gte: startOfMonth() },
    }),
  ]);
  return { pending, paidThisMonth };
}

// ----- Invoice generator helpers -----

export async function buildInvoiceFromProject(projectId) {
  const project = await Project.findById(projectId)
    .populate('client', 'name company email phone country address')
    .populate('projectManager', 'name email');
  if (!project) throw ApiError.notFound('Project not found');
  const client = project.client;
  if (!client) throw ApiError.badRequest('Project has no client');

  const { getSettings } = await import('./settings.service.js');
  const settings = await getSettings();

  return {
    agency: {
      name: settings.agencyName,
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
      logoUrl: settings.logoUrl,
      invoiceFooter: settings.invoiceFooter,
    },
    project: {
      _id: project._id,
      title: project.title,
      deliveredAt: project.deliveredAt,
      budgetCents: project.budgetCents,
      currency: project.currency,
      videoType: project.videoType,
      targetDurationSec: project.targetDurationSec,
    },
    client: {
      _id: client._id,
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      country: client.country,
    },
    lineItems: [
      {
        description: `${project.title} — ${project.videoType?.replace(/_/g, ' ')}`,
        amountCents: project.budgetCents,
      },
    ],
    totalCents: project.budgetCents,
    currency: project.currency,
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(project._id).slice(-6).toUpperCase()}`,
    issuedOn: new Date(),
  };
}
