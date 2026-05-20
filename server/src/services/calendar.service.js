import Project from '../models/Project.js';
import Payment from '../models/Payment.js';
import Salary from '../models/Salary.js';
import Task from '../models/Task.js';

/**
 * Aggregate calendar events within an optional date window.
 *
 * Staff (admin/manager) see everything — project deadlines, payment dues,
 * salary payouts and tasks. Editors/clients see only their own assigned
 * project deadlines and their own tasks; no agency finance is exposed.
 */
export async function getCalendarEvents({ from, to, viewer } = {}) {
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) range.$lte = new Date(to);
  const hasRange = Object.keys(range).length > 0;
  const dateFilter = hasRange ? range : { $ne: null };

  const isStaff = viewer && (viewer.role === 'admin' || viewer.role === 'manager');

  const projectFilter = {
    deadline: dateFilter,
    status: { $nin: ['cancelled'] },
  };
  const taskFilter = { dueDate: dateFilter };
  if (!isStaff && viewer) {
    projectFilter['assignedEditors.user'] = viewer._id;
    taskFilter.assignedTo = viewer._id;
  }

  const [projects, tasks, payments, salaries] = await Promise.all([
    Project.find(projectFilter).select('title deadline status').lean(),
    Task.find(taskFilter).select('title dueDate status priority').lean(),
    isStaff
      ? Payment.find({ date: dateFilter })
          .select('amountCents currency date status client')
          .populate('client', 'name')
          .lean()
      : [],
    isStaff
      ? Salary.find({ dueOn: dateFilter })
          .select('amountCents currency dueOn paid teamMember')
          .populate('teamMember', 'name')
          .lean()
      : [],
  ]);

  const events = [];

  for (const p of projects) {
    events.push({
      id: `project:${p._id}`,
      kind: 'project_deadline',
      title: `Deadline · ${p.title}`,
      date: p.deadline,
      link: `/projects/${p._id}`,
      meta: { status: p.status },
    });
  }
  for (const t of tasks) {
    events.push({
      id: `task:${t._id}`,
      kind: 'task',
      title: `Task · ${t.title}`,
      date: t.dueDate,
      link: '/tasks',
      meta: { status: t.status, priority: t.priority },
    });
  }
  for (const pay of payments) {
    events.push({
      id: `payment:${pay._id}`,
      kind: 'payment_due',
      title: `Payment · ${pay.client?.name || 'income'}`,
      date: pay.date,
      link: '/finance',
      meta: { status: pay.status, amountCents: pay.amountCents, currency: pay.currency },
    });
  }
  for (const s of salaries) {
    events.push({
      id: `salary:${s._id}`,
      kind: 'salary_payout',
      title: `Payout · ${s.teamMember?.name || 'team'}`,
      date: s.dueOn,
      link: '/finance',
      meta: { paid: s.paid, amountCents: s.amountCents, currency: s.currency },
    });
  }

  return { events };
}
