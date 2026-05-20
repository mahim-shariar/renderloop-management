import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/finance.service.js';

// ----- Payments -----

export const listPayments = asyncHandler(async (req, res) => {
  const data = await svc.listPayments(req.query);
  res.json({ success: true, data });
});
export const getPayment = asyncHandler(async (req, res) => {
  const payment = await svc.getPayment(req.params.id);
  res.json({ success: true, data: { payment } });
});
export const createPayment = asyncHandler(async (req, res) => {
  const payment = await svc.createPayment(req.body, req.user._id);
  res.status(201).json({ success: true, data: { payment } });
});
export const updatePayment = asyncHandler(async (req, res) => {
  const payment = await svc.updatePayment(req.params.id, req.body);
  res.json({ success: true, data: { payment } });
});
export const deletePayment = asyncHandler(async (req, res) => {
  await svc.deletePayment(req.params.id);
  res.json({ success: true, message: 'Payment deleted' });
});
export const paymentsSummary = asyncHandler(async (_req, res) => {
  const data = await svc.paymentsSummary();
  res.json({ success: true, data });
});

// ----- Expenses -----

export const listExpenses = asyncHandler(async (req, res) => {
  const data = await svc.listExpenses(req.query);
  res.json({ success: true, data });
});
export const createExpense = asyncHandler(async (req, res) => {
  const expense = await svc.createExpense(req.body, req.user._id);
  res.status(201).json({ success: true, data: { expense } });
});
export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await svc.updateExpense(req.params.id, req.body);
  res.json({ success: true, data: { expense } });
});
export const deleteExpense = asyncHandler(async (req, res) => {
  await svc.deleteExpense(req.params.id);
  res.json({ success: true, message: 'Expense deleted' });
});
export const expensesSummary = asyncHandler(async (_req, res) => {
  const data = await svc.expensesSummary();
  res.json({ success: true, data });
});

// ----- Salaries / Payouts -----

export const listSalaries = asyncHandler(async (req, res) => {
  const data = await svc.listSalaries(req.query);
  res.json({ success: true, data });
});
export const createSalary = asyncHandler(async (req, res) => {
  const salary = await svc.createSalary(req.body, req.user._id);
  res.status(201).json({ success: true, data: { salary } });
});
export const updateSalary = asyncHandler(async (req, res) => {
  const salary = await svc.updateSalary(req.params.id, req.body);
  res.json({ success: true, data: { salary } });
});
export const deleteSalary = asyncHandler(async (req, res) => {
  await svc.deleteSalary(req.params.id);
  res.json({ success: true, message: 'Payout deleted' });
});
export const markPaid = asyncHandler(async (req, res) => {
  const salary = await svc.markPaid(req.params.id, req.body, req.user._id);
  res.json({ success: true, data: { salary } });
});
export const salariesSummary = asyncHandler(async (_req, res) => {
  const data = await svc.salariesSummary();
  res.json({ success: true, data });
});

// ----- Invoice generator -----

export const buildInvoice = asyncHandler(async (req, res) => {
  const invoice = await svc.buildInvoiceFromProject(req.params.projectId);
  res.json({ success: true, data: { invoice } });
});
