import { Response } from 'express';
import { AuthenticatedRequest, logAudit } from '../middleware/auth.js';
import db from '../config/db.js';

export function createLeadRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const { requested_count = 100, notes = '' } = req.body;

    const count = Math.min(Math.max(Number(requested_count) || 100, 10), 1000);
    const requestId = 'req-' + Date.now() + '-' + Math.random().toString(36).substring(7);

    db.run(
      `INSERT INTO lead_requests (id, user_id, requested_count, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'Pending', datetime('now'), datetime('now'))`,
      [requestId, user.id, count, notes]
    );

    // Notify Admins and Managers
    const admins = db.all<any>("SELECT id FROM users WHERE role_id IN ('role-superadmin', 'role-admin', 'role-manager')");
    for (const a of admins) {
      db.run(
        `INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
         VALUES (?, ?, 'Lead Request from ' || ?, ? || ' requested ' || ? || ' leads for daily telecalling quota.', 'Lead', '/calling', 0, datetime('now'))`,
        ['notif-' + Date.now() + '-' + Math.random().toString(36).substring(7), a.id, user.name, user.name, count]
      );
    }

    logAudit(user.id, 'Lead Request Created', 'lead_requests', requestId, 'Requested ' + count + ' leads', req.ip);

    res.json({
      success: true,
      message: 'Request for ' + count + ' leads submitted to Admin successfully!',
      request_id: requestId,
      requested_count: count
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export function listLeadRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const isAdminOrManager = ['role-superadmin', 'role-admin', 'role-manager', 'role-leader'].includes(user.role_id);
    const statusFilter = (req.query.status as string) || 'all';

    let sql = `
      SELECT r.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar,
             t.name as team_name, ab.name as approved_by_name,
             (SELECT COUNT(id) FROM leads WHERE assigned_user_id = r.user_id AND (last_contact_at IS NULL OR DATE(last_contact_at) = DATE('now'))) as active_leads_count
      FROM lead_requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN teams t ON u.team_id = t.id
      LEFT JOIN users ab ON r.approved_by_id = ab.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!isAdminOrManager) {
      sql += ' AND r.user_id = ?';
      params.push(user.id);
    }

    if (statusFilter !== 'all') {
      sql += ' AND r.status = ?';
      params.push(statusFilter);
    }

    sql += " ORDER BY CASE WHEN r.status = 'Pending' THEN 1 ELSE 2 END, r.created_at DESC";

    const requests = db.all<any>(sql, params);

    // Get unallocated lead pool stats
    const unallocatedCount = db.get<any>("SELECT COUNT(id) as cnt FROM leads WHERE assigned_user_id IS NULL OR status = 'New'")?.cnt || 0;
    const pendingRequestsCount = db.get<any>("SELECT COUNT(id) as cnt FROM lead_requests WHERE status = 'Pending'")?.cnt || 0;
    const totalAllocatedToday = db.get<any>("SELECT COALESCE(SUM(allocated_count), 0) as total FROM lead_requests WHERE status = 'Approved' AND DATE(allocated_at) = DATE('now')")?.total || 0;

    res.json({
      success: true,
      poolStats: {
        availableUnassignedLeads: unallocatedCount,
        pendingRequestsCount,
        totalAllocatedToday
      },
      requests
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export function approveLeadRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { count: customCount, approved_count, source_filter } = req.body;

    const leadReq = db.get<any>('SELECT * FROM lead_requests WHERE id = ?', [id]);
    if (!leadReq) {
      return res.status(404).json({ success: false, message: 'Lead request not found' });
    }

    const targetUser = db.get<any>('SELECT * FROM users WHERE id = ?', [leadReq.user_id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Requesting user not found' });
    }

    const requestedQty = Number(customCount || approved_count) || leadReq.requested_count || 100;
    const allocateCount = Math.min(Math.max(requestedQty, 1), 1000);

    // Fetch unassigned or New leads
    let selectSql = "SELECT id FROM leads WHERE (assigned_user_id IS NULL OR assigned_user_id = '' OR status = 'New')";
    const selectParams: any[] = [];

    if (source_filter && source_filter !== 'all') {
      selectSql += ' AND source = ?';
      selectParams.push(source_filter);
    }

    selectSql += ' ORDER BY created_at DESC LIMIT ?';
    selectParams.push(allocateCount);

    let leadsToAssign = db.all<{ id: string }>(selectSql, selectParams);

    // If unassigned leads are insufficient, grab oldest leads with status New/Contacted not yet assigned to targetUser
    if (leadsToAssign.length < allocateCount) {
      const needed = allocateCount - leadsToAssign.length;
      const inClause = leadsToAssign.length > 0 ? leadsToAssign.map(() => '?').join(',') : "''";
      const fallbackLeads = db.all<{ id: string }>(
        'SELECT id FROM leads WHERE (assigned_user_id IS NULL OR assigned_user_id != ?) AND id NOT IN (' + inClause + ') ORDER BY created_at DESC LIMIT ?',
        leadsToAssign.length > 0 ? [targetUser.id, ...leadsToAssign.map(l => l.id), needed] : [targetUser.id, needed]
      );
      leadsToAssign = [...leadsToAssign, ...fallbackLeads];
    }

    for (const l of leadsToAssign) {
      db.run(
        `UPDATE leads SET assigned_user_id = ?, assigned_team_id = ?, status = 'New', updated_at = datetime('now') WHERE id = ?`,
        [targetUser.id, targetUser.team_id || null, l.id]
      );

      db.run(
        `INSERT INTO lead_activities (id, lead_id, user_id, action_type, description, created_at)
         VALUES (?, ?, ?, 'Batch Allocated', ?, datetime('now'))`,
        [
          'act-' + Date.now() + '-' + Math.random().toString(36).substring(7),
          l.id,
          admin.id,
          'Allocated to ' + targetUser.name + ' from Request #' + id + ' by ' + admin.name
        ]
      );
    }

    const actualCount = leadsToAssign.length;

    // Update Request status
    db.run(
      `UPDATE lead_requests
       SET status = 'Approved', allocated_count = ?, approved_by_id = ?, allocated_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
      [actualCount, admin.id, id]
    );

    // Notify the employee
    db.run(
      `INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
       VALUES (?, ?, '🎉 Leads Allocated!', ? || ' approved your request and assigned ' || ? || ' leads to your calling desk.', 'Lead', '/calling', 0, datetime('now'))`,
      ['notif-' + Date.now() + '-' + Math.random().toString(36).substring(7), targetUser.id, admin.name, actualCount]
    );

    logAudit(admin.id, 'Lead Request Approved', 'lead_requests', id, 'Allocated ' + actualCount + ' leads to ' + targetUser.name, req.ip);

    res.json({
      success: true,
      message: 'Successfully approved and assigned ' + actualCount + ' leads to ' + targetUser.name + '!',
      allocated_count: actualCount,
      target_user: { id: targetUser.id, name: targetUser.name }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export function rejectLeadRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { reason = 'Currently sufficient leads are already in queue.' } = req.body;

    const leadReq = db.get<any>('SELECT * FROM lead_requests WHERE id = ?', [id]);
    if (!leadReq) {
      return res.status(404).json({ success: false, message: 'Lead request not found' });
    }

    db.run(
      `UPDATE lead_requests
       SET status = 'Rejected', notes = ? || (CASE WHEN notes IS NOT NULL THEN ' | Note: ' || notes ELSE '' END), approved_by_id = ?, updated_at = datetime('now')
       WHERE id = ?`,
      ['Rejected: ' + reason, admin.id, id]
    );

    // Notify employee
    db.run(
      `INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
       VALUES (?, ?, 'Lead Request Update', 'Your lead request was reviewed: ' || ?, 'Lead', '/calling', 0, datetime('now'))`,
      ['notif-' + Date.now() + '-' + Math.random().toString(36).substring(7), leadReq.user_id, reason]
    );

    logAudit(admin.id, 'Lead Request Rejected', 'lead_requests', id, 'Reason: ' + reason, req.ip);

    res.json({
      success: true,
      message: 'Lead request rejected.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
