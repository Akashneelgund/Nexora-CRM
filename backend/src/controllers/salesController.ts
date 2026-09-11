import { Request, Response } from 'express';
import db from '../config/db.js';
import { logAudit } from '../middleware/auth.js';

export async function listSales(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { date_range, team_id, user_id, search, limit = '100', offset = '0' } = req.query;

  let query = `
    SELECT d.*,
           c.name as customer_name,
           c.phone as customer_phone,
           c.email as customer_email,
           c.company as customer_company,
           u.name as sales_rep_name,
           t.name as team_name
    FROM deals_orders d
    JOIN customers c ON d.customer_id = c.id
    JOIN users u ON d.user_id = u.id
    LEFT JOIN teams t ON d.team_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (user.role_code === 'SALES_EXECUTIVE') {
    query += ' AND d.user_id = ?';
    params.push(user.id);
  } else if (user.role_code === 'TEAM_LEADER' && user.team_id) {
    query += ' AND (d.team_id = ? OR d.user_id = ?)';
    params.push(user.team_id, user.id);
  }

  if (team_id && team_id !== 'all') {
    query += ' AND d.team_id = ?';
    params.push(team_id);
  }
  if (user_id && user_id !== 'all') {
    query += ' AND d.user_id = ?';
    params.push(user_id);
  }

  if (date_range === 'today') {
    query += " AND DATE(d.sale_date) = DATE('now')";
  } else if (date_range === 'yesterday') {
    query += " AND DATE(d.sale_date) = DATE('now', '-1 day')";
  } else if (date_range === 'this_week') {
    query += " AND DATE(d.sale_date) >= DATE('now', '-7 days')";
  } else if (date_range === 'this_month') {
    query += " AND DATE(d.sale_date) >= DATE('now', 'start of month')";
  } else if (date_range === 'last_month') {
    query += " AND DATE(d.sale_date) >= DATE('now', '-1 month', 'start of month') AND DATE(d.sale_date) < DATE('now', 'start of month')";
  }

  if (search) {
    query += ' AND (d.order_code LIKE ? OR c.name LIKE ? OR c.company LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY d.sale_date DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const deals = db.all<any>(query, params);

  for (const d of deals) {
    d.items = db.all<any>(
      `SELECT oi.*, p.name as product_name, p.sku
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [d.id]
    );
  }

  res.json({ success: true, deals });
}

export async function createSale(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { customer_id, items, discount_amount = 0, tax_rate = 0.18, paid_now = 0, paid_amount = 0, payment_method = 'UPI', notes, due_days = 7 } = req.body;

  if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, message: 'Customer and at least one item required.' });
    return;
  }

  const cust = db.get<any>('SELECT * FROM customers WHERE id = ?', [customer_id]);
  if (!cust) {
    res.status(404).json({ success: false, message: 'Customer not found' });
    return;
  }

  let totalAmount = 0;
  for (const item of items) {
    const prod = db.get<any>('SELECT * FROM products WHERE id = ?', [item.product_id]);
    if (!prod) {
      res.status(400).json({ success: false, message: `Product ${item.product_id} not found` });
      return;
    }
    if (prod.stock < item.quantity) {
      res.status(400).json({
        success: false,
        message: `Insufficient stock for product "${prod.name}". Available: ${prod.stock}, Requested: ${item.quantity}`
      });
      return;
    }
    totalAmount += prod.price * item.quantity;
  }

  const discount = Number(discount_amount) || 0;
  const taxable = totalAmount - discount;
  const tax = Math.round(taxable * Number(tax_rate));
  const netAmount = taxable + tax;
  const paid = Math.min(Number(paid_now || paid_amount) || 0, netAmount);
  const pending = netAmount - paid;

  const paymentStatus = pending === 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Pending');

  const orderId = `order-${Date.now().toString().slice(-6)}`;
  const orderCount = db.get<any>('SELECT COUNT(id) as cnt FROM deals_orders')?.cnt || 0;
  const orderCode = `ORD-2026-${String(8100 + orderCount)}`;

  db.transaction(() => {
    db.run(
      `INSERT INTO deals_orders (id, order_code, customer_id, user_id, team_id, total_amount, discount_amount, tax_amount, net_amount, paid_amount, pending_amount, status, payment_status, due_date, sale_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?, datetime('now', '+' || ? || ' days'), CURRENT_TIMESTAMP, ?)`,
      [orderId, orderCode, customer_id, user.id, user.team_id || null, totalAmount, discount, tax, netAmount, paid, pending, paymentStatus, due_days, notes || '']
    );

    for (const item of items) {
      const prod = db.get<any>('SELECT * FROM products WHERE id = ?', [item.product_id]);
      const subtotal = prod.price * item.quantity;

      const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      db.run(
        'INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [itemId, orderId, prod.id, item.quantity, prod.price, subtotal]
      );

      const previousStock = prod.stock;
      const newStock = previousStock - item.quantity;
      db.run('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStock, prod.id]);

      const movId = `mov-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      db.run(
        `INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity_change, previous_stock, new_stock, reference_id, reason, user_id)
         VALUES (?, ?, ?, 'Sale', ?, ?, ?, ?, 'Deducted for Order ' || ?, ?)`,
        [movId, prod.id, prod.warehouse_id, -item.quantity, previousStock, newStock, orderId, orderCode, user.id]
      );

      if (newStock <= 0) {
        const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        db.run(
          `INSERT INTO notifications (id, user_id, title, message, type, link)
           VALUES (?, ?, '⚠️ OUT OF STOCK ALERT', ?, 'OutOfStock', '/inventory')`,
          [notifId, 'user-admin', `Product "${prod.name}" (SKU: ${prod.sku}) is now OUT OF STOCK (0 units)!`, '/inventory']
        );
      } else if (newStock <= prod.min_stock) {
        const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        db.run(
          `INSERT INTO notifications (id, user_id, title, message, type, link)
           VALUES (?, ?, '⚠️ LOW STOCK ALERT', ?, 'LowStock', '/inventory')`,
          [notifId, 'user-admin', `Product "${prod.name}" is low in stock: ${newStock} units remaining (Min: ${prod.min_stock})`, '/inventory']
        );
      }
    }

    db.run(
      'UPDATE customers SET total_sales = total_sales + ?, pending_balance = pending_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [netAmount, pending, customer_id]
    );

    if (paid > 0) {
      const paymentCode = `PAY-2026-${String(9100 + orderCount)}`;
      const payId = `pay-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      db.run(
        `INSERT INTO payments (id, payment_code, order_id, customer_id, user_id, team_id, amount, payment_method, payment_date, status, reference_number, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'Paid', ?, 'Initial payment received during sale creation')`,
        [payId, paymentCode, orderId, customer_id, user.id, user.team_id || null, paid, payment_method, `TXN_SALE_${orderCode}`]
      );
    }
  });

  logAudit(user.id, 'CREATE_SALE', 'deals_orders', orderId, null, { orderCode, netAmount, paid, customer_id }, req.ip);

  res.json({
    success: true,
    message: 'Sale created and inventory automatically updated!',
    orderId,
    orderCode,
    netAmount,
    pendingAmount: pending
  });
}
