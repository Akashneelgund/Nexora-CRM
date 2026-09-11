import { Response } from 'express';
import { AuthenticatedRequest, logAudit } from '../middleware/auth.js';
import db from '../config/db.js';

export function getTodayCallingQueue(req: AuthenticatedRequest, res: Response) {
  try {
    const targetUserId = (req.query.user_id as string) || req.user!.id;
    const search = (req.query.search as string) || '';
    const statusFilter = (req.query.status as string) || 'all';

    let baseQuery = `
      SELECT l.*, p.name as product_name, p.price as product_price,
             u.name as assigned_user_name, t.name as assigned_team_name,
             (SELECT COUNT(id) FROM lead_calls WHERE lead_id = l.id) as call_count,
             (SELECT call_outcome FROM lead_calls WHERE lead_id = l.id ORDER BY created_at DESC LIMIT 1) as last_call_outcome
      FROM leads l
      LEFT JOIN products p ON l.product_interest_id = p.id
      LEFT JOIN users u ON l.assigned_user_id = u.id
      LEFT JOIN teams t ON l.assigned_team_id = t.id
      WHERE l.assigned_user_id = ?
    `;
    const params: any[] = [targetUserId];

    if (search) {
      baseQuery += ` AND (l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.lead_code LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (statusFilter !== 'all') {
      baseQuery += ` AND l.status = ?`;
      params.push(statusFilter);
    }

    baseQuery += ` ORDER BY CASE WHEN l.status = 'New' THEN 1 WHEN l.status = 'Follow-up' THEN 2 ELSE 3 END, l.created_at DESC`;

    const queue = db.all<any>(baseQuery, params);

    // Compute Daily Dialing Stats for this employee
    const totalAssigned = db.get<any>(
      'SELECT COUNT(id) as count FROM leads WHERE assigned_user_id = ?',
      [targetUserId]
    )?.count || 0;

    const todayCalls = db.get<any>(`
      SELECT
        COUNT(id) as total_calls,
        SUM(CASE WHEN duration_seconds > 0 AND call_outcome NOT LIKE '%Not Answered%' THEN 1 ELSE 0 END) as connected_calls,
        SUM(CASE WHEN call_outcome LIKE '%Interested%' OR call_outcome LIKE '%Quotation%' OR call_outcome LIKE '%Demo%' THEN 1 ELSE 0 END) as interested_calls,
        SUM(CASE WHEN call_outcome LIKE '%Callback%' OR call_outcome LIKE '%Busy%' THEN 1 ELSE 0 END) as callback_calls,
        SUM(CASE WHEN call_outcome LIKE '%Not Answered%' OR call_outcome LIKE '%Switched Off%' THEN 1 ELSE 0 END) as not_answered_calls,
        SUM(CASE WHEN call_outcome LIKE '%Not Interested%' OR call_outcome LIKE '%Wrong%' THEN 1 ELSE 0 END) as not_interested_calls
      FROM lead_calls
      WHERE user_id = ? AND DATE(created_at) = DATE('now')
    `, [targetUserId]) || {};

    const completedLeadsCount = db.get<any>(`
      SELECT COUNT(DISTINCT lead_id) as count
      FROM lead_calls
      WHERE user_id = ? AND DATE(created_at) = DATE('now')
    `, [targetUserId])?.count || 0;

    const pendingCallsCount = Math.max(totalAssigned - completedLeadsCount, 0);

    res.json({
      success: true,
      stats: {
        totalAssigned,
        completedToday: completedLeadsCount,
        pendingToday: pendingCallsCount,
        totalCallsMadeToday: todayCalls.total_calls || 0,
        connectedCalls: todayCalls.connected_calls || 0,
        interestedCalls: todayCalls.interested_calls || 0,
        callbackCalls: todayCalls.callback_calls || 0,
        notAnsweredCalls: todayCalls.not_answered_calls || 0,
        notInterestedCalls: todayCalls.not_interested_calls || 0,
        progressPct: totalAssigned > 0 ? Math.min(Math.round((completedLeadsCount / totalAssigned) * 100), 100) : 0
      },
      queue
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export function logCallAndUpdateStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      lead_id,
      call_outcome,
      duration_seconds = 0,
      notes = '',
      new_status,
      followup_date,
      expected_value
    } = req.body;

    if (!lead_id || !call_outcome) {
      return res.status(400).json({ success: false, message: 'lead_id and call_outcome are required' });
    }

    const lead = db.get<any>('SELECT * FROM leads WHERE id = ?', [lead_id]);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const callId = `call-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    db.run(
      `INSERT INTO lead_calls (id, lead_id, user_id, duration_seconds, call_outcome, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [callId, lead_id, req.user!.id, duration_seconds, call_outcome, notes]
    );

    // Update lead status & timestamp
    const targetStatus = new_status || (
      call_outcome.includes('Interested') || call_outcome.includes('Demo') ? 'Interested' :
      call_outcome.includes('Quotation') ? 'Quotation' :
      call_outcome.includes('Callback') || call_outcome.includes('Busy') ? 'Follow-up' :
      call_outcome.includes('Not Interested') || call_outcome.includes('Wrong') ? 'Lost' :
      lead.status === 'New' ? 'Contacted' : lead.status
    );

    let updateSql = `UPDATE leads SET status = ?, last_contact_at = datetime('now'), updated_at = datetime('now')`;
    const updateParams: any[] = [targetStatus];

    if (expected_value !== undefined && expected_value !== null) {
      updateSql += `, expected_value = ?`;
      updateParams.push(expected_value);
    }
    if (notes) {
      updateSql += `, notes = ?`;
      updateParams.push(notes);
    }

    updateSql += ` WHERE id = ?`;
    updateParams.push(lead_id);

    db.run(updateSql, updateParams);

    // Log Activity
    db.run(
      `INSERT INTO lead_activities (id, lead_id, user_id, action_type, description, created_at)
       VALUES (?, ?, ?, 'Call Completed', ?, datetime('now'))`,
      [
        `act-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        lead_id,
        req.user!.id,
        `Telecall outcome: "${call_outcome}". Duration: ${Math.floor(duration_seconds / 60)}m ${duration_seconds % 60}s. Status set to ${targetStatus}.`
      ]
    );

    // Schedule Follow-up if requested
    if (followup_date) {
      const followupId = `fol-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      db.run(
        `INSERT INTO lead_followups (id, lead_id, user_id, followup_type, scheduled_at, notes, reminder_minutes, status)
         VALUES (?, ?, ?, 'Call', ?, ?, 30, 'Pending')`,
        [followupId, lead_id, req.user!.id, followup_date, notes || `Follow-up call scheduled after ${call_outcome}`]
      );
    }

    logAudit(req.user!.id, 'Call Logged', 'lead', lead_id, `Outcome: ${call_outcome}, Status: ${targetStatus}`, req.ip);

    // Fetch next pending lead in queue for seamless dialing
    const nextLead = db.get<any>(`
      SELECT l.*, p.name as product_name
      FROM leads l
      LEFT JOIN products p ON l.product_interest_id = p.id
      WHERE l.assigned_user_id = ? AND l.id != ? AND (l.last_contact_at IS NULL OR DATE(l.last_contact_at) != DATE('now'))
      ORDER BY CASE WHEN l.status = 'New' THEN 1 ELSE 2 END, l.created_at DESC
      LIMIT 1
    `, [req.user!.id, lead_id]);

    res.json({
      success: true,
      message: 'Call logged and lead status updated',
      call_id: callId,
      updated_status: targetStatus,
      next_lead: nextLead || null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export function batchAssignLeads(req: AuthenticatedRequest, res: Response) {
  try {
    const { user_id, count = 100, source, status = 'New' } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Target user_id is required' });
    }

    const targetUser = db.get<any>('SELECT * FROM users WHERE id = ?', [user_id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    let selectSql = 'SELECT id FROM leads WHERE 1=1';
    const params: any[] = [];

    if (source) {
      selectSql += ' AND source = ?';
      params.push(source);
    }

    if (status && status !== 'all') {
      selectSql += ' AND status = ?';
      params.push(status);
    }

    selectSql += ' LIMIT ?';
    params.push(Number(count));

    const leadsToAssign = db.all<{ id: string }>(selectSql, params);

    for (const l of leadsToAssign) {
      db.run(
        `UPDATE leads SET assigned_user_id = ?, assigned_team_id = ?, updated_at = datetime('now') WHERE id = ?`,
        [targetUser.id, targetUser.team_id || null, l.id]
      );

      db.run(
        `INSERT INTO lead_activities (id, lead_id, user_id, action_type, description, created_at)
         VALUES (?, ?, ?, 'Batch Assigned', ?, datetime('now'))`,
        [
          `act-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          l.id,
          req.user!.id,
          `Batch allocated to ${targetUser.name} for today's calling quota`
        ]
      );
    }

    logAudit(req.user!.id, 'Batch Assign', 'leads', targetUser.id, `Allocated ${leadsToAssign.length} leads to ${targetUser.name}`, req.ip);

    res.json({
      success: true,
      assigned_count: leadsToAssign.length,
      target_user: { id: targetUser.id, name: targetUser.name },
      message: `Successfully allocated ${leadsToAssign.length} leads to ${targetUser.name} for today's calling quota.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export function getTeamCallingSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const execs = db.all<any>(`
      SELECT u.id, u.name, u.email, u.avatar, t.name as team_name,
        (SELECT COUNT(id) FROM leads WHERE assigned_user_id = u.id) as total_assigned,
        (SELECT COUNT(DISTINCT lead_id) FROM lead_calls WHERE user_id = u.id AND DATE(created_at) = DATE('now')) as calls_completed_today,
        (SELECT COUNT(id) FROM lead_calls WHERE user_id = u.id AND DATE(created_at) = DATE('now') AND (call_outcome LIKE '%Interested%' OR call_outcome LIKE '%Demo%' OR call_outcome LIKE '%Quotation%')) as interested_today
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE u.role_id IN ('role-executive', 'role-leader')
      ORDER BY calls_completed_today DESC, total_assigned DESC
    `);

    const totalTeamCallsToday = execs.reduce((sum, e) => sum + (e.calls_completed_today || 0), 0);
    const totalTeamInterestedToday = execs.reduce((sum, e) => sum + (e.interested_today || 0), 0);

    res.json({
      success: true,
      totalTeamCallsToday,
      totalTeamInterestedToday,
      executives: execs.map(e => ({
        ...e,
        pending_calls: Math.max(e.total_assigned - e.calls_completed_today, 0),
        completion_pct: e.total_assigned > 0 ? Math.min(Math.round((e.calls_completed_today / e.total_assigned) * 100), 100) : 0
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
