import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { generateToken, logAudit } from '../middleware/auth.js';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required' });
    return;
  }

  const user = db.get<any>(
    `SELECT u.*, r.name as role_name, r.code as role_code, t.name as team_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     LEFT JOIN teams t ON u.team_id = t.id
     WHERE u.email = ? AND u.status = 'active'`,
    [email.trim().toLowerCase()]
  );

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }

  const permissions = db.all<any>(
    'SELECT permission_code FROM role_permissions WHERE role_id = ?',
    [user.role_id]
  ).map(p => p.permission_code);

  const token = generateToken(user);
  logAudit(user.id, 'LOGIN', 'users', user.id, null, { email: user.email }, req.ip);

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role_id: user.role_id,
      role_code: user.role_code,
      role_name: user.role_name,
      team_id: user.team_id,
      team_name: user.team_name,
      avatar: user.avatar,
      target_monthly: user.target_monthly,
      permissions
    }
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const user = db.get<any>(
    `SELECT u.*, r.name as role_name, r.code as role_code, t.name as team_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     LEFT JOIN teams t ON u.team_id = t.id
     WHERE u.id = ?`,
    [req.user.id]
  );

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role_id: user.role_id,
      role_code: user.role_code,
      role_name: user.role_name,
      team_id: user.team_id,
      team_name: user.team_name,
      avatar: user.avatar,
      target_monthly: user.target_monthly,
      permissions: req.user.permissions
    }
  });
}

export async function getDemoAccounts(req: Request, res: Response): Promise<void> {
  const demoUsers = [
    { role: 'Super Admin', code: 'SUPER_ADMIN', email: 'superadmin@nexora.com', password: 'SuperAdmin123!', name: 'Akash SuperAdmin', description: 'Full system & settings access' },
    { role: 'Admin', code: 'ADMIN', email: 'admin@nexora.com', password: 'Admin123!', name: 'Neha Sharma', description: 'Manage teams, users, leads, sales & inventory' },
    { role: 'Sales Manager', code: 'SALES_MANAGER', email: 'manager@nexora.com', password: 'Manager123!', name: 'Rajesh Verma', description: 'Oversight across all sales teams and company targets' },
    { role: 'Team Leader', code: 'TEAM_LEADER', email: 'leader@nexora.com', password: 'Leader123!', name: 'Rahul Deshmukh', description: 'Manages Team Alpha, assigns leads, submits daily reports' },
    { role: 'Sales Executive', code: 'SALES_EXECUTIVE', email: 'sales@nexora.com', password: 'Sales123!', name: 'Akash Neelgund', description: 'Team Alpha top sales rep, manages private leads and sales' },
    { role: 'Inventory Manager', code: 'INVENTORY_MANAGER', email: 'inventory@nexora.com', password: 'Inventory123!', name: 'Suresh Kumar', description: 'Products, stock levels, warehouse transfers & low stock' },
    { role: 'Finance Manager', code: 'FINANCE_MANAGER', email: 'finance@nexora.com', password: 'Finance123!', name: 'Meera Iyer', description: 'Reconcile payments, invoices, pending balances' },
    { role: 'Support Staff', code: 'SUPPORT_STAFF', email: 'support@nexora.com', password: 'Support123!', name: 'Rohan Joshi', description: 'Customer tickets, inquiries and support' }
  ];
  res.json({ success: true, demoUsers });
}
