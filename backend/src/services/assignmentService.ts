import db from '../config/db.js';

export interface AssignmentResult {
  assigned_user_id: string | null;
  assigned_team_id: string | null;
  rule_applied: string;
}

export function checkLeadDuplicate(phone: string, email?: string): { isDuplicate: boolean; existingLead?: any } {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const existing = db.get<any>(
    "SELECT * FROM leads WHERE phone = ? OR REPLACE(phone, ' ', '') = ? OR (email IS NOT NULL AND email = ?)",
    [phone, cleanPhone, email || '']
  );
  if (existing) {
    return { isDuplicate: true, existingLead: existing };
  }
  return { isDuplicate: false };
}

export function autoAssignLead(source: string, productId?: string | null): AssignmentResult {
  const rules = db.all<any>(
    'SELECT * FROM assignment_rules WHERE is_active = 1 ORDER BY priority ASC'
  );

  for (const r of rules) {
    if (r.rule_type === 'source_based' && r.source_filter && r.source_filter.toLowerCase() === source.toLowerCase()) {
      if (r.target_team_id) {
        const user = getRoundRobinUser(r.target_team_id);
        return {
          assigned_user_id: user ? user.id : null,
          assigned_team_id: r.target_team_id,
          rule_applied: `Source Rule: ${source} -> Team ${r.target_team_id}`
        };
      }
    }

    if (r.rule_type === 'product_based' && r.product_filter && productId && r.product_filter === productId) {
      if (r.target_team_id) {
        const user = getRoundRobinUser(r.target_team_id);
        return {
          assigned_user_id: user ? user.id : null,
          assigned_team_id: r.target_team_id,
          rule_applied: `Product Rule -> Team ${r.target_team_id}`
        };
      }
    }

    if (r.rule_type === 'round_robin') {
      const user = getRoundRobinUser(r.target_team_id || undefined);
      return {
        assigned_user_id: user ? user.id : null,
        assigned_team_id: user ? user.team_id : (r.target_team_id || null),
        rule_applied: 'Company Round Robin'
      };
    }
  }

  const fallbackUser = getRoundRobinUser();
  return {
    assigned_user_id: fallbackUser ? fallbackUser.id : null,
    assigned_team_id: fallbackUser ? fallbackUser.team_id : null,
    rule_applied: 'Default Fallback Assignment'
  };
}

let roundRobinCounter = 0;
export function getRoundRobinUser(teamId?: string): any {
  let query = "SELECT id, name, team_id FROM users WHERE role_id = 'role-executive' AND status = 'active'";
  const params: any[] = [];
  if (teamId) {
    query += ' AND team_id = ?';
    params.push(teamId);
  }
  const users = db.all<any>(query, params);
  if (users.length === 0) {
    return db.get<any>("SELECT id, name, team_id FROM users WHERE status = 'active' LIMIT 1");
  }
  const selected = users[roundRobinCounter % users.length];
  roundRobinCounter++;
  return selected;
}
