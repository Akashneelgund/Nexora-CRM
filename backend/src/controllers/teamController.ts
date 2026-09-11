import { Request, Response } from 'express';
import db from '../config/db.js';
import { logAudit } from '../middleware/auth.js';

export async function listTeams(req: Request, res: Response): Promise<void> {
  const teams = db.all<any>(`
    SELECT t.*,
           u.name as leader_name,
           u.avatar as leader_avatar,
           u.email as leader_email,
           COUNT(DISTINCT m.id) as member_count,
           COALESCE(SUM(d.net_amount), 0) as total_sales,
           COUNT(DISTINCT l.id) as total_leads,
           COALESCE(SUM(d.pending_amount), 0) as pending_payments
    FROM teams t
    LEFT JOIN users u ON t.leader_id = u.id
    LEFT JOIN users m ON m.team_id = t.id
    LEFT JOIN deals_orders d ON d.team_id = t.id
    LEFT JOIN leads l ON l.assigned_team_id = t.id
    GROUP BY t.id
    ORDER BY total_sales DESC
  `);

  res.json({ success: true, teams });
}

export async function getTeamDashboard(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const teamId = req.params.id || user.team_id;

  if (!teamId) {
    res.status(400).json({ success: false, message: 'No team specified or user not in a team' });
    return;
  }

  const team = db.get<any>(`
    SELECT t.*, u.name as leader_name, u.avatar as leader_avatar
    FROM teams t
    LEFT JOIN users u ON t.leader_id = u.id
    WHERE t.id = ?
  `, [teamId]);

  if (!team) {
    res.status(404).json({ success: false, message: 'Team not found' });
    return;
  }

  const stats = db.get<any>(`
    SELECT
      COALESCE(SUM(CASE WHEN DATE(sale_date) = DATE('now') THEN net_amount ELSE 0 END), 0) as today_sales,
      COALESCE(SUM(net_amount), 0) as monthly_sales,
      COALESCE(SUM(pending_amount), 0) as pending_payments,
      COUNT(id) as total_orders
    FROM deals_orders
    WHERE team_id = ?
  `, [teamId]);

  const members = db.all<any>(`
    SELECT u.id, u.name, u.email, u.phone, u.avatar, u.target_monthly,
           COALESCE(SUM(d.net_amount), 0) as sales,
           COUNT(DISTINCT l.id) as leads_count,
           COUNT(DISTINCT CASE WHEN l.status = 'Won' THEN l.id END) as won_leads,
           COALESCE(SUM(d.pending_amount), 0) as pending_amount
    FROM users u
    LEFT JOIN deals_orders d ON u.id = d.user_id
    LEFT JOIN leads l ON u.id = l.assigned_user_id
    WHERE u.team_id = ?
    GROUP BY u.id
    ORDER BY sales DESC
  `, [teamId]);

  const target = team.target_monthly || 400000;
  const monthlySales = stats?.monthly_sales || 0;
  const achievement = Math.min(Math.round((monthlySales / target) * 100), 100);

  res.json({
    success: true,
    team: {
      ...team,
      stats: {
        todaySales: stats?.today_sales || 0,
        monthlySales,
        target,
        achievement,
        pendingPayments: stats?.pending_payments || 0,
        totalOrders: stats?.total_orders || 0
      },
      members
    }
  });
}

export async function submitDailyReport(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { team_id, total_sales, total_orders, new_leads, conversions, pending_payments, notes } = req.body;

  const targetTeamId = team_id || user.team_id;
  const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  db.run(
    `INSERT INTO daily_reports (id, report_date, team_id, submitted_by, total_sales, total_orders, new_leads, conversions, pending_payments, notes, whatsapp_status)
     VALUES (?, date('now'), ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      reportId,
      targetTeamId,
      user.id,
      Number(total_sales) || 0,
      Number(total_orders) || 0,
      Number(new_leads) || 0,
      Number(conversions) || 0,
      Number(pending_payments) || 0,
      notes || 'Daily report submitted via CRM team portal'
    ]
  );

  const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  db.run(
    `INSERT INTO notifications (id, user_id, title, message, type, link)
     VALUES (?, 'user-superadmin', 'Daily Team Report Submitted', ?, 'Report', '/reports')`,
    [notifId, `Team Leader ${user.name} submitted daily sales report.`]
  );

  logAudit(user.id, 'SUBMIT_DAILY_REPORT', 'daily_reports', reportId, null, { targetTeamId, total_sales }, req.ip);

  res.json({
    success: true,
    message: 'Daily Team Report submitted successfully! Included in tonight WhatsApp batch.',
    reportId
  });
}
