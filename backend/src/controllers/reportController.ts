import { Request, Response } from 'express';
import db from '../config/db.js';
import { generateDailySalesSummary, sendWhatsAppMessage } from '../services/whatsappService.js';
import { logAudit } from '../middleware/auth.js';

export async function getDashboardAnalytics(req: Request, res: Response): Promise<void> {
  const totalLeads = db.get<any>('SELECT COUNT(id) as cnt FROM leads')?.cnt || 0;
  const newLeadsToday = db.get<any>("SELECT COUNT(id) as cnt FROM leads WHERE DATE(created_at) = DATE('now')")?.cnt || 0;
  const qualifiedLeads = db.get<any>("SELECT COUNT(id) as cnt FROM leads WHERE status = 'Qualified'")?.cnt || 0;
  const wonLeads = db.get<any>("SELECT COUNT(id) as cnt FROM leads WHERE status = 'Won'")?.cnt || 0;

  const todaySales = db.get<any>("SELECT COALESCE(SUM(net_amount), 0) as total FROM deals_orders WHERE DATE(sale_date) = DATE('now')")?.total || 0;
  const monthlySales = db.get<any>("SELECT COALESCE(SUM(net_amount), 0) as total FROM deals_orders WHERE DATE(sale_date) >= DATE('now', 'start of month')")?.total || 0;
  const pendingPayments = db.get<any>("SELECT COALESCE(SUM(pending_amount), 0) as total FROM deals_orders WHERE pending_amount > 0")?.total || 0;
  const collectedPayments = db.get<any>("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Paid'")?.total || 0;
  const lowStockCount = db.get<any>("SELECT COUNT(id) as cnt FROM products WHERE stock <= min_stock")?.cnt || 0;
  const followupsToday = db.get<any>("SELECT COUNT(id) as cnt FROM lead_followups WHERE DATE(scheduled_at) = DATE('now') AND status = 'Pending'")?.cnt || 0;

  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  const avgDealValue = wonLeads > 0 ? Math.round(monthlySales / (wonLeads || 1)) : 45000;

  const salesByDay = db.all<any>(`
    SELECT
      strftime('%d %b', sale_date) as day,
      DATE(sale_date) as date_val,
      COALESCE(SUM(net_amount), 0) as sales,
      COUNT(id) as orders
    FROM deals_orders
    WHERE DATE(sale_date) >= DATE('now', '-7 days')
    GROUP BY DATE(sale_date)
    ORDER BY DATE(sale_date) ASC
  `);

  const salesByTeam = db.all<any>(`
    SELECT t.name, COALESCE(SUM(d.net_amount), 0) as sales
    FROM teams t
    LEFT JOIN deals_orders d ON d.team_id = t.id
    GROUP BY t.id
    ORDER BY sales DESC
  `);

  const leadsBySource = db.all<any>(`
    SELECT source as name, COUNT(id) as value
    FROM leads
    GROUP BY source
    ORDER BY value DESC
  `);

  const leaderboard = db.all<any>(`
    SELECT u.id, u.name, u.avatar, t.name as team_name,
           COALESCE(SUM(d.net_amount), 0) as sales,
           u.target_monthly as target,
           ROUND((COALESCE(SUM(d.net_amount), 0) / MAX(u.target_monthly, 1)) * 100) as achievement_pct,
           COUNT(DISTINCT d.id) as orders_count
    FROM users u
    LEFT JOIN teams t ON u.team_id = t.id
    LEFT JOIN deals_orders d ON d.user_id = u.id
    WHERE u.role_id IN ('role-executive', 'role-leader')
    GROUP BY u.id
    ORDER BY sales DESC
    LIMIT 10
  `);

  const lowStockItems = db.all<any>(`
    SELECT id, name, sku, stock, min_stock, price
    FROM products
    WHERE stock <= min_stock
    ORDER BY stock ASC
  `);

  res.json({
    success: true,
    kpis: {
      totalLeads,
      newLeadsToday,
      qualifiedLeads,
      wonLeads,
      todaySales,
      monthlySales,
      pendingPayments,
      collectedPayments,
      lowStockCount,
      followupsToday,
      conversionRate,
      avgDealValue,
      companyTarget: 15000000,
      targetAchievement: Math.min(Math.round((monthlySales / 15000000) * 100), 100)
    },
    salesByDay,
    salesByTeam,
    leadsBySource,
    leaderboard,
    lowStockItems
  });
}

export async function getWhatsAppReport(req: Request, res: Response): Promise<void> {
  const summary = generateDailySalesSummary();
  const config = db.get<any>("SELECT * FROM integrations_whatsapp WHERE id = 'wa-01'") || {
    id: 'wa-01',
    business_account_id: 'waba_9928374829',
    phone_number_id: 'phone_1092837492',
    is_connected: 1,
    daily_report_time: '20:30',
    timezone: 'Asia/Kolkata',
    recipients: JSON.stringify(['+91 9986917364', '9986917364', '+91 98800 11001'])
  };
  res.json({ success: true, summary, config });
}

export async function sendTestWhatsAppReport(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { recipient_phone } = req.body;
  const summary = generateDailySalesSummary();
  const targetPhone = recipient_phone || '+91 9986917364';

  const result = await sendWhatsAppMessage(targetPhone, summary.formattedMessage);
  logAudit(user.id, 'Send WhatsApp Report', 'integrations_whatsapp', 'wa-01', `Dispatched to ${targetPhone}`, req.ip);

  res.json({
    success: true,
    message: `Daily Sales & Calling Report dispatched successfully to ${targetPhone}!`,
    result,
    previewMessage: summary.formattedMessage
  });
}
