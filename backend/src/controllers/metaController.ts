import { Request, Response } from 'express';
import db from '../config/db.js';
import { autoAssignLead, checkLeadDuplicate } from '../services/assignmentService.js';
import { logAudit } from '../middleware/auth.js';

export async function getMetaIntegration(req: Request, res: Response): Promise<void> {
  const meta = db.get<any>('SELECT * FROM integrations_meta WHERE id = "meta-01"');
  res.json({ success: true, meta });
}

export async function updateMetaIntegration(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { page_name, page_id, instagram_account_id, ad_account_id, access_token, webhook_verify_token, is_connected } = req.body;

  db.run(
    `UPDATE integrations_meta
     SET page_name = ?, page_id = ?, instagram_account_id = ?, ad_account_id = ?, access_token = ?, webhook_verify_token = ?, is_connected = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = 'meta-01'`,
    [
      page_name || 'Nexora Technologies Official',
      page_id || '1092837465928',
      instagram_account_id || '17841400293847',
      ad_account_id || 'act_9837462819',
      access_token || '',
      webhook_verify_token || 'nexora_meta_secret_2026',
      is_connected ? 1 : 0
    ]
  );

  logAudit(user.id, 'UPDATE_META_CONFIG', 'integrations_meta', 'meta-01', null, { page_name, is_connected }, req.ip);

  res.json({ success: true, message: 'Meta Graph API settings updated successfully!' });
}

export async function verifyWebhook(req: Request, res: Response): Promise<void> {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const meta = db.get<any>('SELECT webhook_verify_token FROM integrations_meta WHERE id = "meta-01"');
  const expectedToken = meta?.webhook_verify_token || 'nexora_meta_secret_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden: Token mismatch');
  }
}

export async function receiveWebhookLead(req: Request, res: Response): Promise<void> {
  const body = req.body;
  if (body.object === 'page') {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'leadgen') {
          console.log(`[Meta Lead Webhook Received] Leadgen ID: ${change.value?.leadgen_id}`);
        }
      }
    }
  }
  res.status(200).send('EVENT_RECEIVED');
}

export async function simulateMetaLead(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const {
    source = 'Facebook',
    campaign = 'Summer_B2B_LeadGen_2026',
    name = 'Sunil Deshpande',
    phone = '+91 98765 43210',
    email = 'sunil.d@enterprisestore.in',
    product_interest_id = 'prod-01',
    ad_id = 'ad_8837461928',
    expected_value = 85000
  } = req.body;

  const dupCheck = checkLeadDuplicate(phone, email);
  if (dupCheck.isDuplicate) {
    res.status(409).json({
      success: false,
      isDuplicate: true,
      message: `Meta Webhook detected duplicate lead: Lead ${dupCheck.existingLead.lead_code} already exists for ${phone}. Dropping duplicate.`,
      existingLead: dupCheck.existingLead
    });
    return;
  }

  const assigned = autoAssignLead(source, product_interest_id);
  const id = `lead-${Date.now().toString().slice(-6)}`;
  const count = db.get<any>('SELECT COUNT(id) as cnt FROM leads')?.cnt || 0;
  const lead_code = `LEAD-2026-${String(1001 + count)}`;

  db.transaction(() => {
    db.run(
      `INSERT INTO leads (id, lead_code, name, email, phone, source, campaign, product_interest_id, assigned_user_id, assigned_team_id, status, priority, expected_value, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', 'High', ?, ?)`,
      [
        id,
        lead_code,
        name,
        email,
        phone,
        source,
        campaign,
        product_interest_id,
        assigned.assigned_user_id,
        assigned.assigned_team_id,
        expected_value,
        `Automated lead ingested via ${source} Ads (Ad ID: ${ad_id}, Campaign: ${campaign}).`
      ]
    );

    const actId = `act-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    db.run(
      `INSERT INTO lead_activities (id, lead_id, user_id, action_type, description)
       VALUES (?, ?, ?, 'Meta Ingestion', ?)`,
      [actId, id, assigned.assigned_user_id, `Received from ${source} Lead Ads webhook -> Applied rule: ${assigned.rule_applied}`]
    );

    if (assigned.assigned_user_id) {
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      db.run(
        `INSERT INTO notifications (id, user_id, title, message, type, link)
         VALUES (?, ?, ?, ?, 'Lead', ?)`,
        [
          notifId,
          assigned.assigned_user_id,
          `⚡ Inbound ${source} Lead Assigned!`,
          `Lead "${name}" (${source} - ${campaign}) assigned to you.`,
          `/leads/${id}`
        ]
      );
    }
  });

  logAudit(user.id, 'SIMULATE_META_LEAD', 'leads', id, null, { source, campaign, name, rule: assigned.rule_applied }, req.ip);

  res.json({
    success: true,
    message: `Inbound ${source} lead ingested, deduplicated, and auto-assigned successfully!`,
    lead: {
      id,
      lead_code,
      name,
      source,
      campaign,
      assigned_user_id: assigned.assigned_user_id,
      assigned_team_id: assigned.assigned_team_id,
      rule_applied: assigned.rule_applied
    }
  });
}
