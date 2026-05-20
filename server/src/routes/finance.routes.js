import { Router } from 'express';
import { CURRENCIES } from '../config/currencies.js';
import { body, param, query } from 'express-validator';
import {
  listPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  paymentsSummary,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  expensesSummary,
  listSalaries,
  createSalary,
  updateSalary,
  deleteSalary,
  markPaid,
  salariesSummary,
  buildInvoice,
} from '../controllers/finance.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { PAYMENT_SOURCES, PAYMENT_STATUSES } from '../models/Payment.js';
import { EXPENSE_CATEGORIES } from '../models/Expense.js';
import { SALARY_TYPES } from '../models/Salary.js';

const router = Router();
router.use(authMiddleware);
router.use(roleMiddleware('admin', 'manager'));

// ----- Payments -----
router.get('/payments/summary', paymentsSummary);
router.get(
  '/payments',
  query('status').optional().isIn(PAYMENT_STATUSES),
  query('source').optional().isIn(PAYMENT_SOURCES),
  validate,
  listPayments
);
router.post(
  '/payments',
  body('amountCents').isInt({ min: 0 }).toInt(),
  body('currency').optional().isIn(CURRENCIES),
  body('date').optional().isISO8601(),
  body('source').optional().isIn(PAYMENT_SOURCES),
  body('client').optional({ values: 'null' }).isMongoId(),
  body('project').optional({ values: 'null' }).isMongoId(),
  body('invoiceNumber').optional({ values: 'falsy' }).isString().isLength({ max: 50 }),
  body('status').optional().isIn(PAYMENT_STATUSES),
  body('notes').optional({ values: 'falsy' }).isString().isLength({ max: 5000 }),
  validate,
  createPayment
);
router.get('/payments/:id', param('id').isMongoId(), validate, getPayment);
router.patch(
  '/payments/:id',
  param('id').isMongoId(),
  body('amountCents').optional().isInt({ min: 0 }).toInt(),
  body('status').optional().isIn(PAYMENT_STATUSES),
  body('source').optional().isIn(PAYMENT_SOURCES),
  body('client').optional({ values: 'null' }).isMongoId(),
  body('project').optional({ values: 'null' }).isMongoId(),
  validate,
  updatePayment
);
router.delete('/payments/:id', param('id').isMongoId(), validate, deletePayment);

// ----- Expenses -----
router.get('/expenses/summary', expensesSummary);
router.get(
  '/expenses',
  query('category').optional().isIn(EXPENSE_CATEGORIES),
  validate,
  listExpenses
);
router.post(
  '/expenses',
  body('name').isString().trim().isLength({ min: 1, max: 200 }),
  body('amountCents').isInt({ min: 0 }).toInt(),
  body('currency').optional().isIn(CURRENCIES),
  body('category').optional().isIn(EXPENSE_CATEGORIES),
  body('date').optional().isISO8601(),
  body('paid').optional().isBoolean().toBoolean(),
  body('recurring').optional().isBoolean().toBoolean(),
  body('notes').optional({ values: 'falsy' }).isString().isLength({ max: 5000 }),
  validate,
  createExpense
);
router.patch(
  '/expenses/:id',
  param('id').isMongoId(),
  body('amountCents').optional().isInt({ min: 0 }).toInt(),
  body('category').optional().isIn(EXPENSE_CATEGORIES),
  body('paid').optional().isBoolean().toBoolean(),
  body('recurring').optional().isBoolean().toBoolean(),
  validate,
  updateExpense
);
router.delete('/expenses/:id', param('id').isMongoId(), validate, deleteExpense);

// ----- Salaries / Payouts -----
router.get('/salaries/summary', salariesSummary);
router.get('/salaries', listSalaries);
router.post(
  '/salaries',
  body('teamMember').isMongoId(),
  body('type').optional().isIn(SALARY_TYPES),
  body('period').optional({ values: 'falsy' }).matches(/^\d{4}-\d{2}$/),
  body('project').optional({ values: 'null' }).isMongoId(),
  body('amountCents').isInt({ min: 0 }).toInt(),
  body('currency').optional().isIn(CURRENCIES),
  body('paid').optional().isBoolean().toBoolean(),
  body('dueOn').optional({ values: 'null' }).isISO8601(),
  body('transactionRef').optional({ values: 'falsy' }).isString().isLength({ max: 120 }),
  validate,
  createSalary
);
router.patch(
  '/salaries/:id',
  param('id').isMongoId(),
  body('amountCents').optional().isInt({ min: 0 }).toInt(),
  body('paid').optional().isBoolean().toBoolean(),
  validate,
  updateSalary
);
router.delete('/salaries/:id', param('id').isMongoId(), validate, deleteSalary);
router.post(
  '/salaries/:id/mark-paid',
  param('id').isMongoId(),
  body('transactionRef').optional({ values: 'falsy' }).isString().isLength({ max: 120 }),
  validate,
  markPaid
);

// ----- Invoice -----
router.get('/invoice/from-project/:projectId', param('projectId').isMongoId(), validate, buildInvoice);

export default router;
