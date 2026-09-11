import { Request, Response } from 'express';
import db from '../config/db.js';
import { logAudit } from '../middleware/auth.js';

export async function listPayments(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { status, limit = '100', offset = '0' } = req.query;

  let query = `
    SELECT p.*,
           c.name as customer_name,
           c.company as customer_company,
           o.order_code,
           u.name as collected_by_name,
           t.name as team_name
    FROM payments p
    JOIN customers c ON p.customer_id = c.id
    JOIN deals_orders o ON p.order_id = o.id
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'all') {
    query += ' AND p.status = ?';
    params.push(status);
  }

  query += ' ORDER BY p.payment_date DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const payments = db.all<any>(query, params);
  res.json({ success: true, payments });
}

export async function getPendingPayments(req: Request, res: Response): Promise<void> {
  const user = req.user!;

  let query = `
    SELECT d.id as order_id,
           d.order_code,
           d.total_amount,
           d.net_amount,
           d.paid_amount,
           d.pending_amount,
           d.payment_status,
           d.due_date,
           d.sale_date,
           c.id as customer_id,
           c.name as customer_name,
           c.phone as customer_phone,
           c.company as customer_company,
           u.id as user_id,
           u.name as employee_name,
           t.id as team_id,
           t.name as team_name,
           CAST(JULIANDAY('now') - JULIANDAY(d.due_date) AS INTEGER) as days_overdue
    FROM deals_orders d
    JOIN customers c ON d.customer_id = c.id
    JOIN users u ON d.user_id = u.id
    LEFT JOIN teams t ON d.team_id = t.id
    WHERE d.pending_amount > 0 AND d.status != 'Cancelled'
  `;
  const params: any[] = [];

  if (user.role_code === 'SALES_EXECUTIVE') {
    query += ' AND d.user_id = ?';
    params.push(user.id);
  } else if (user.role_code === 'TEAM_LEADER' && user.team_id) {
    query += ' AND (d.team_id = ? OR d.user_id = ?)';
    params.push(user.team_id, user.id);
  }

  query += ' ORDER BY d.due_date ASC';

  const pending = db.all<any>(query, params);

  let totalPending = 0;
  let totalOverdue = 0;
  let overdueCount = 0;

  for (const row of pending) {
    totalPending += row.pending_amount;
    if (row.days_overdue > 0 || row.payment_status === 'Overdue') {
      totalOverdue += row.pending_amount;
      overdueCount++;
    }
  }

  res.json({
    success: true,
    summary: {
      totalPendingAmount: totalPending,
      totalOverdueAmount: totalOverdue,
      totalPendingOrders: pending.length,
      overdueCount
    },
    pendingOrders: pending
  });
}

export async function recordPayment(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { order_id, amount, payment_method = 'UPI', reference_number, notes } = req.body;

  if (!order_id || !amount || Number(amount) <= 0) {
    res.status(400).json({ success: false, message: 'Valid Order ID and amount required' });
    return;
  }

  const order = db.get<any>('SELECT * FROM deals_orders WHERE id = ?', [order_id]);
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  const payAmount = Number(amount);
  const newPaid = order.paid_amount + payAmount;
  const newPending = Math.max(order.net_amount - newPaid, 0);
  const newPaymentStatus = newPending === 0 ? 'Paid' : 'Partial';

  const count = db.get<any>('SELECT COUNT(id) as cnt FROM payments')?.cnt || 0;
  const paymentCode = `PAY-2026-${String(9200 + count)}`;
  const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  db.transaction(() => {
    db.run(
      `INSERT INTO payments (id, payment_code, order_id, customer_id, user_id, team_id, amount, payment_method, payment_date, status, reference_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'Paid', ?, ?)`,
      [paymentId, paymentCode, order.id, order.customer_id, user.id, order.team_id, payAmount, payment_method, reference_number || `TXN_${Date.now()}`, notes || 'Payment recorded via portal']
    );

    db.run(
      'UPDATE deals_orders SET paid_amount = ?, pending_amount = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPaid, newPending, newPaymentStatus, order.id]
    );

    db.run(
      'UPDATE customers SET pending_balance = MAX(pending_balance - ?, 0), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [payAmount, order.customer_id]
    );
  });

  logAudit(user.id, 'RECORD_PAYMENT', 'payments', paymentId, null, { order_id, payAmount, paymentCode }, req.ip);

  res.json({
    success: true,
    message: 'Payment recorded and balance updated successfully!',
    paymentCode,
    newPaidAmount: newPaid,
    remainingPending: newPending
  });
}
