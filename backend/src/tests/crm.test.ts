import { describe, it, expect, beforeAll } from 'vitest';
import db from '../config/db.js';
import { initializeDatabase } from '../models/schema.js';
import { seedDatabase } from '../seeds/seed.js';
import { autoAssignLead, checkLeadDuplicate } from '../services/assignmentService.js';
import { generateDailySalesSummary } from '../services/whatsappService.js';

describe('NEXORA CRM Core Business Logic & Engine Tests', () => {
  beforeAll(async () => {
    initializeDatabase();
    await seedDatabase();
  });

  it('1. should seed users and verify all 8 roles exist', () => {
    const roles = db.all<any>('SELECT * FROM roles');
    expect(roles.length).toBe(8);
    const superAdmin = db.get<any>('SELECT * FROM users WHERE email = ?', ['superadmin@nexora.com']);
    expect(superAdmin).toBeDefined();
    expect(superAdmin.name).toBe('Akash SuperAdmin');
  });

  it('2. should enforce role permissions in role_permissions table', () => {
    const superAdminPerms = db.all<any>("SELECT * FROM role_permissions WHERE role_id = 'role-superadmin'");
    const salesExecPerms = db.all<any>("SELECT * FROM role_permissions WHERE role_id = 'role-executive'");
    expect(superAdminPerms.length).toBeGreaterThan(30);
    expect(salesExecPerms.length).toBeLessThan(superAdminPerms.length);
    const hasOwnLeads = salesExecPerms.some(p => p.permission_code === 'leads.view_own');
    const hasDeleteUsers = salesExecPerms.some(p => p.permission_code === 'users.delete');
    expect(hasOwnLeads).toBe(true);
    expect(hasDeleteUsers).toBe(false);
  });

  it('3. should detect duplicate leads by phone', () => {
    const existingLead = db.get<any>('SELECT * FROM leads LIMIT 1');
    const check = checkLeadDuplicate(existingLead.phone);
    expect(check.isDuplicate).toBe(true);
    expect(check.existingLead).toBeDefined();

    const uniqueCheck = checkLeadDuplicate('+91 99999 88888');
    expect(uniqueCheck.isDuplicate).toBe(false);
  });

  it('4. should auto-assign Facebook leads to Team Alpha according to rule', () => {
    const result = autoAssignLead('Facebook', null);
    expect(result.assigned_team_id).toBe('team-alpha');
    expect(result.assigned_user_id).toBeDefined();
    expect(result.rule_applied).toContain('Source Rule');
  });

  it('5. should auto-assign Instagram leads to Team Bravo according to rule', () => {
    const result = autoAssignLead('Instagram', null);
    expect(result.assigned_team_id).toBe('team-bravo');
    expect(result.assigned_user_id).toBeDefined();
  });

  it('6. should track low stock and out of stock items correctly', () => {
    const lowStockItems = db.all<any>('SELECT * FROM products WHERE stock <= min_stock');
    expect(lowStockItems.length).toBeGreaterThanOrEqual(10);
    const outOfStock = db.all<any>('SELECT * FROM products WHERE stock = 0');
    expect(outOfStock.length).toBeGreaterThanOrEqual(2);
  });

  it('7. should generate daily WhatsApp sales summary with correct variables', () => {
    const summary = generateDailySalesSummary();
    expect(summary.totalSales).toBeGreaterThan(0);
    expect(summary.topPerformer).toBeDefined();
    expect(summary.formattedMessage).toContain('NEXORA CRM — DAILY SALES REPORT');
    expect(summary.formattedMessage).toContain('TOTAL SALES');
    expect(summary.formattedMessage).toContain('TOP PERFORMER');
    expect(summary.formattedMessage).toContain('TEAM PERFORMANCE');
  });
});
