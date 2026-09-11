import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { logAudit } from '../middleware/auth.js';

export async function getRolesMatrix(req: Request, res: Response): Promise<void> {
  const roles = db.all<any>('SELECT * FROM roles ORDER BY is_system DESC, name ASC');
  const permissions = db.all<any>('SELECT * FROM permissions ORDER BY category ASC, code ASC');
  const rolePermissionsRows = db.all<any>('SELECT * FROM role_permissions');

  const rolePermissionsMap: Record<string, string[]> = {};
  for (const r of roles) {
    rolePermissionsMap[r.id] = [];
  }
  for (const rp of rolePermissionsRows) {
    if (!rolePermissionsMap[rp.role_id]) rolePermissionsMap[rp.role_id] = [];
    rolePermissionsMap[rp.role_id].push(rp.permission_code);
  }

  const categoriesMap: Record<string, any[]> = {};
  for (const p of permissions) {
    if (!categoriesMap[p.category]) categoriesMap[p.category] = [];
    categoriesMap[p.category].push(p);
  }

  res.json({
    success: true,
    roles,
    permissions,
    categories: categoriesMap,
    rolePermissions: rolePermissionsMap,
    rolePermissionsRows
  });
}

export async function updateRolePermissions(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { roleId } = req.params;
  const { permissions } = req.body;

  if (!roleId || !Array.isArray(permissions)) {
    res.status(400).json({ success: false, message: 'Role ID and array of permission codes required' });
    return;
  }

  if (roleId === 'role-superadmin') {
    res.status(400).json({ success: false, message: 'Super Admin permissions cannot be modified' });
    return;
  }

  db.transaction(() => {
    db.run('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
    for (const code of permissions) {
      db.run('INSERT INTO role_permissions (role_id, permission_code) VALUES (?, ?)', [roleId, code]);
    }
  });

  logAudit(user.id, 'UPDATE_ROLE_PERMISSIONS', 'roles', roleId, null, { permissionsCount: permissions.length }, req.ip);

  res.json({ success: true, message: 'Role permissions updated successfully!' });
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const users = db.all<any>(`
    SELECT u.id, u.name, u.email, u.phone, u.role_id, u.team_id, u.avatar, u.status, u.target_monthly, u.created_at,
           r.name as role_name, r.code as role_code,
           t.name as team_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN teams t ON u.team_id = t.id
    ORDER BY u.created_at DESC
  `);
  res.json({ success: true, users });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { name, email, password, phone, role_id, team_id, target_monthly = 0 } = req.body;

  if (!name || !email || !password || !role_id) {
    res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
    return;
  }

  const existing = db.get<any>('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing) {
    res.status(409).json({ success: false, message: 'User with this email already exists' });
    return;
  }

  const id = `user-${Date.now().toString().slice(-6)}`;
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  db.run(
    `INSERT INTO users (id, name, email, password_hash, phone, role_id, team_id, avatar, status, target_monthly)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
    [
      id,
      name,
      email.trim().toLowerCase(),
      passwordHash,
      phone || '',
      role_id,
      team_id || null,
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      Number(target_monthly) || 0
    ]
  );

  logAudit(user.id, 'CREATE_USER', 'users', id, null, { name, email, role_id }, req.ip);

  res.json({ success: true, message: 'User created successfully', userId: id });
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const { action, entity, search, limit = '100', offset = '0' } = req.query;

  let query = `
    SELECT a.*, u.name as user_name, u.email as user_email
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (action && action !== 'all') {
    query += ' AND a.action = ?';
    params.push(action);
  }
  if (entity && entity !== 'all') {
    query += ' AND a.entity = ?';
    params.push(entity);
  }
  if (search) {
    query += ' AND (a.action LIKE ? OR a.entity LIKE ? OR u.name LIKE ? OR a.new_values LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const logs = db.all<any>(query, params);
  res.json({ success: true, logs });
}

export async function getNotifications(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const notifications = db.all<any>(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [user.id]
  );
  const unreadCount = db.get<any>(
    'SELECT COUNT(id) as cnt FROM notifications WHERE user_id = ? AND is_read = 0',
    [user.id]
  )?.cnt || 0;

  res.json({ success: true, unreadCount, notifications });
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;

  if (id === 'all') {
    db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [user.id]);
  } else {
    db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, user.id]);
  }

  res.json({ success: true });
}
