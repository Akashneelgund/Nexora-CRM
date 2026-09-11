import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nexora_super_secret_jwt_key_2026';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role_id: string;
  role_code: string;
  role_name: string;
  team_id: string | null;
  permissions: string[];
}

export type AuthenticatedRequest = Request;

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function generateToken(user: { id: string; email: string; role_id: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role_id: user.role_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role_id: string };

    const userRow = db.get<{
      id: string;
      name: string;
      email: string;
      phone: string;
      role_id: string;
      team_id: string | null;
      avatar: string;
      status: string;
      target_monthly: number;
      role_name: string;
      role_code: string;
    }>(
      `SELECT u.*, r.name as role_name, r.code as role_code
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.status = 'active'`,
      [decoded.id]
    );

    if (!userRow) {
      res.status(401).json({ success: false, message: 'User not found or account deactivated.' });
      return;
    }

    const permissionRows = db.all<{ permission_code: string }>(
      'SELECT permission_code FROM role_permissions WHERE role_id = ?',
      [userRow.role_id]
    );

    req.user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role_id: userRow.role_id,
      role_code: userRow.role_code,
      role_name: userRow.role_name,
      team_id: userRow.team_id,
      permissions: permissionRows.map(p => p.permission_code)
    };

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

export function requirePermission(...permissionCodes: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (req.user.role_code?.toUpperCase() === 'SUPER_ADMIN' || req.user.role_code === 'super_admin' || req.user.role_id === 'role-superadmin') {
      next();
      return;
    }

    const hasPermission = permissionCodes.some(p => req.user!.permissions.includes(p));
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission [${permissionCodes.join(', ')}]`
      });
      return;
    }

    next();
  };
}

export function logAudit(
  userId: string | null,
  action: string,
  entity: string,
  entityId: string | string[] | null | undefined = null,
  oldVal: any = null,
  newVal: any = null,
  ip: string | string[] | undefined = '127.0.0.1'
) {
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const finalIp = Array.isArray(ip) ? ip[0] : (ip || '127.0.0.1');
    const finalEntityId = Array.isArray(entityId) ? entityId[0] : (entityId || null);
    db.run(
      `INSERT INTO audit_logs (id, user_id, action, entity, entity_id, old_values, new_values, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        action,
        entity,
        finalEntityId,
        oldVal ? JSON.stringify(oldVal) : null,
        newVal ? JSON.stringify(newVal) : null,
        finalIp
      ]
    );
  } catch (e) {
    console.error('Audit logging failed:', e);
  }
}
