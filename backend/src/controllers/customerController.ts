import { Request, Response } from 'express';
import db from '../config/db.js';
import { logAudit } from '../middleware/auth.js';

export async function listCustomers(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { search, limit = '100', offset = '0' } = req.query;

  let query = `
    SELECT c.*, u.name as assigned_user_name
    FROM customers c
    LEFT JOIN users u ON c.assigned_user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (user.role_code === 'SALES_EXECUTIVE') {
    query += ' AND c.assigned_user_id = ?';
    params.push(user.id);
  }

  if (search) {
    query += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.company LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY c.total_sales DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const customers = db.all<any>(query, params);
  res.json({ success: true, customers });
}

export async function getCustomerById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const customer = db.get<any>(
    `SELECT c.*, u.name as assigned_user_name
     FROM customers c
     LEFT JOIN users u ON c.assigned_user_id = u.id
     WHERE c.id = ?`,
    [id]
  );

  if (!customer) {
    res.status(404).json({ success: false, message: 'Customer not found' });
    return;
  }

  const orders = db.all<any>(
    'SELECT * FROM deals_orders WHERE customer_id = ? ORDER BY sale_date DESC',
    [id]
  );

  const payments = db.all<any>(
    'SELECT * FROM payments WHERE customer_id = ? ORDER BY payment_date DESC',
    [id]
  );

  res.json({
    success: true,
    customer: {
      ...customer,
      orders,
      payments
    }
  });
}

export async function convertLeadToCustomer(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { lead_id, company, address } = req.body;

  const lead = db.get<any>('SELECT * FROM leads WHERE id = ?', [lead_id]);
  if (!lead) {
    res.status(404).json({ success: false, message: 'Lead not found' });
    return;
  }

  const existingCust = db.get<any>('SELECT * FROM customers WHERE lead_id = ?', [lead_id]);
  if (existingCust) {
    res.status(400).json({ success: false, message: 'Lead already converted to customer', customerId: existingCust.id });
    return;
  }

  const custId = `cust-${Date.now().toString().slice(-6)}`;
  const count = db.get<any>('SELECT COUNT(id) as cnt FROM customers')?.cnt || 0;
  const custCode = `CUST-2026-${String(5050 + count)}`;

  try {
    db.transaction(() => {
      db.run(
        `INSERT INTO customers (id, customer_code, lead_id, name, email, phone, company, address, assigned_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [custId, custCode, lead_id, lead.name, lead.email, lead.phone, company || `${lead.name} Enterprises`, address || 'MG Road, Bangalore', lead.assigned_user_id || user.id]
      );

      db.run("UPDATE leads SET status = 'Won', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [lead_id]);

      const actId = `act-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      db.run(
        `INSERT INTO lead_activities (id, lead_id, user_id, action_type, description)
         VALUES (?, ?, ?, 'Conversion', ?)`,
        [actId, lead_id, user.id, `Lead converted to official customer (${custCode})`]
      );
    });

    logAudit(user.id, 'CONVERT_LEAD', 'customers', custId, null, { lead_id, custCode }, req.ip);

    res.json({
      success: true,
      message: 'Lead successfully converted to Customer!',
      customerId: custId,
      customerCode: custCode,
      customer: {
        id: custId,
        customer_code: custCode,
        lead_id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: company || `${lead.name} Enterprises`,
        address: address || 'MG Road, Bangalore'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to convert lead to customer' });
  }
}
