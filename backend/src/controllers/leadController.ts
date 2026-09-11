import { Request, Response } from 'express';
import db from '../config/db.js';
import { autoAssignLead, checkLeadDuplicate } from '../services/assignmentService.js';
import { logAudit } from '../middleware/auth.js';

export async function listLeads(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { status, source, priority, team_id, user_id, search, limit = '100', offset = '0' } = req.query;

  let query = `
    SELECT l.*,
           u.name as assigned_user_name,
           t.name as assigned_team_name,
           p.name as product_name
    FROM leads l
    LEFT JOIN users u ON l.assigned_user_id = u.id
    LEFT JOIN teams t ON l.assigned_team_id = t.id
    LEFT JOIN products p ON l.product_interest_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (user.role_code === 'SALES_EXECUTIVE') {
    query += ' AND (l.assigned_user_id = ? OR l.assigned_user_id IS NULL)';
    params.push(user.id);
  } else if (user.role_code === 'TEAM_LEADER' && user.team_id) {
    query += ' AND (l.assigned_team_id = ? OR l.assigned_user_id = ?)';
    params.push(user.team_id, user.id);
  }

  if (status && status !== 'all') {
    query += ' AND l.status = ?';
    params.push(status);
  }
  if (source && source !== 'all') {
    query += ' AND l.source = ?';
    params.push(source);
  }
  if (priority && priority !== 'all') {
    query += ' AND l.priority = ?';
    params.push(priority);
  }
  if (team_id && team_id !== 'all') {
    query += ' AND l.assigned_team_id = ?';
    params.push(team_id);
  }
  if (user_id && user_id !== 'all') {
    query += ' AND l.assigned_user_id = ?';
    params.push(user_id);
  }
  if (search) {
    query += ' AND (l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.lead_code LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const leads = db.all<any>(query, params);
  const countRow = db.get<any>('SELECT COUNT(id) as total FROM leads');

  res.json({
    success: true,
    total: countRow?.total || leads.length,
    leads
  });
}

export async function getLeadById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const lead = db.get<any>(
    `SELECT l.*,
            u.name as assigned_user_name,
            t.name as assigned_team_name,
            p.name as product_name,
            p.price as product_price
     FROM leads l
     LEFT JOIN users u ON l.assigned_user_id = u.id
     LEFT JOIN teams t ON l.assigned_team_id = t.id
     LEFT JOIN products p ON l.product_interest_id = p.id
     WHERE l.id = ?`,
    [id]
  );

  if (!lead) {
    res.status(404).json({ success: false, message: 'Lead not found' });
    return;
  }

  const activities = db.all<any>(
    `SELECT a.*, u.name as user_name FROM lead_activities a
     LEFT JOIN users u ON a.user_id = u.id WHERE a.lead_id = ? ORDER BY a.created_at DESC`,
    [id]
  );

  const notes = db.all<any>(
    `SELECT n.*, u.name as user_name FROM lead_notes n
     LEFT JOIN users u ON n.user_id = u.id WHERE n.lead_id = ? ORDER BY n.created_at DESC`,
    [id]
  );

  const calls = db.all<any>(
    `SELECT c.*, u.name as user_name FROM lead_calls c
     LEFT JOIN users u ON c.user_id = u.id WHERE c.lead_id = ? ORDER BY c.created_at DESC`,
    [id]
  );

  const followups = db.all<any>(
    `SELECT f.*, u.name as user_name FROM lead_followups f
     LEFT JOIN users u ON f.user_id = u.id WHERE f.lead_id = ? ORDER BY f.scheduled_at ASC`,
    [id]
  );

  res.json({
    success: true,
    lead: {
      ...lead,
      activities,
      notes,
      calls,
      followups
    }
  });
}

export async function createLead(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { name, email, phone, source = 'Manual', campaign = 'Direct', product_interest_id, priority = 'Medium', expected_value = 0, notes, assigned_user_id, assigned_team_id, allow_duplicate = false } = req.body;

  if (!name || !phone) {
    res.status(400).json({ success: false, message: 'Lead name and phone are required.' });
    return;
  }

  if (!allow_duplicate) {
    const dupCheck = checkLeadDuplicate(phone, email);
    if (dupCheck.isDuplicate) {
      res.status(409).json({
        success: false,
        isDuplicate: true,
        message: 'Possible duplicate lead found with same phone or email.',
        existingLead: dupCheck.existingLead
      });
      return;
    }
  }

  let assignUserId = assigned_user_id;
  let assignTeamId = assigned_team_id;

  if (!assignUserId && !assignTeamId) {
    const assigned = autoAssignLead(source, product_interest_id);
    assignUserId = assigned.assigned_user_id;
    assignTeamId = assigned.assigned_team_id;
  }

  const id = `lead-${Date.now().toString().slice(-6)}`;
  const count = db.get<any>('SELECT COUNT(id) as cnt FROM leads')?.cnt || 0;
  const lead_code = `LEAD-2026-${String(1001 + count)}`;

  db.run(
    `INSERT INTO leads (id, lead_code, name, email, phone, source, campaign, product_interest_id, assigned_user_id, assigned_team_id, status, priority, expected_value, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?, ?, ?)`,
    [id, lead_code, name, email || null, phone, source, campaign, product_interest_id || null, assignUserId || null, assignTeamId || null, priority, expected_value, notes || null]
  );

  const actId = `act-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  db.run(
    `INSERT INTO lead_activities (id, lead_id, user_id, action_type, description)
     VALUES (?, ?, ?, 'Created', ?)`,
    [actId, id, user.id, `Lead created via ${source} by ${user.name}`]
  );

  if (assignUserId && assignUserId !== user.id) {
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    db.run(
      `INSERT INTO notifications (id, user_id, title, message, type, link)
       VALUES (?, ?, 'New Lead Assigned', ?, 'Lead', ?)`,
      [notifId, assignUserId, `New lead "${name}" (${source}) assigned to you.`, `/leads/${id}`]
    );
  }

  logAudit(user.id, 'CREATE_LEAD', 'leads', id, null, { name, phone, source }, req.ip);

  res.json({
    success: true,
    message: 'Lead created successfully',
    leadId: id,
    leadCode: lead_code
  });
}

export async function updateLeadStatus(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;
  const { status, note } = req.body;

  const lead = db.get<any>('SELECT * FROM leads WHERE id = ?', [id]);
  if (!lead) {
    res.status(404).json({ success: false, message: 'Lead not found' });
    return;
  }

  const oldStatus = lead.status;
  db.run('UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

  const actId = `act-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  db.run(
    `INSERT INTO lead_activities (id, lead_id, user_id, action_type, description)
     VALUES (?, ?, ?, 'Status Change', ?)`,
    [actId, id, user.id, `Status updated from ${oldStatus} to ${status}${note ? ' - ' + note : ''}`]
  );

  logAudit(user.id, 'UPDATE_LEAD_STATUS', 'leads', id, { status: oldStatus }, { status }, req.ip);

  res.json({ success: true, message: `Lead status updated to ${status}` });
}

export async function addLeadNote(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;
  const { note } = req.body;

  if (!note) {
    res.status(400).json({ success: false, message: 'Note content required' });
    return;
  }

  const noteId = `note-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  db.run(
    'INSERT INTO lead_notes (id, lead_id, user_id, note) VALUES (?, ?, ?, ?)',
    [noteId, id, user.id, note]
  );

  const actId = `act-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  db.run(
    `INSERT INTO lead_activities (id, lead_id, user_id, action_type, description)
     VALUES (?, ?, ?, 'Note Added', ?)`,
    [actId, id, user.id, `Added note: "${note.substring(0, 50)}..."`]
  );

  res.json({ success: true, message: 'Note saved' });
}

export async function scheduleFollowup(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;
  const { followup_type = 'Call', scheduled_at, notes, reminder_minutes = 30 } = req.body;

  if (!scheduled_at) {
    res.status(400).json({ success: false, message: 'Scheduled date/time is required' });
    return;
  }

  const fid = `fol-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  db.run(
    `INSERT INTO lead_followups (id, lead_id, user_id, followup_type, scheduled_at, notes, reminder_minutes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
    [fid, id, user.id, followup_type, scheduled_at, notes || '', reminder_minutes]
  );

  db.run('UPDATE leads SET next_followup_at = ? WHERE id = ?', [scheduled_at, id]);

  const actId = `act-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  db.run(
    `INSERT INTO lead_activities (id, lead_id, user_id, action_type, description)
     VALUES (?, ?, ?, 'Follow-up Scheduled', ?)`,
    [actId, id, user.id, `Scheduled ${followup_type} for ${scheduled_at}`]
  );

  res.json({ success: true, message: 'Follow-up scheduled successfully' });
}

export async function assignLead(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;
  const { assigned_user_id, assigned_team_id } = req.body;

  const targetUser = assigned_user_id ? db.get<any>('SELECT name, team_id FROM users WHERE id = ?', [assigned_user_id]) : null;
  const finalTeamId = assigned_team_id || (targetUser ? targetUser.team_id : null);

  db.run(
    'UPDATE leads SET assigned_user_id = ?, assigned_team_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [assigned_user_id || null, finalTeamId, id]
  );

  const actId = `act-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  db.run(
    `INSERT INTO lead_activities (id, lead_id, user_id, action_type, description)
     VALUES (?, ?, ?, 'Assignment', ?)`,
    [actId, id, user.id, `Reassigned to ${targetUser ? targetUser.name : 'Unassigned'}`]
  );

  if (assigned_user_id) {
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    db.run(
      `INSERT INTO notifications (id, user_id, title, message, type, link)
       VALUES (?, ?, 'Lead Reassigned to You', 'You have been assigned a lead.', 'Lead', ?)`,
      [notifId, assigned_user_id, `/leads/${id}`]
    );
  }

  res.json({ success: true, message: 'Lead reassigned successfully' });
}
