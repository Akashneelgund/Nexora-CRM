import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { initializeDatabase } from '../models/schema.js';
import { roles, permissionsList, teamsData, categories, warehouses, suppliers, products, sampleLeadNames } from './seedData.js';

export async function seedDatabase() {
  console.log('--- Initializing Database Schema ---');
  initializeDatabase();

  console.log('--- Resetting existing records ---');
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM audit_logs;
    DELETE FROM chat_messages;
    DELETE FROM chat_members;
    DELETE FROM chat_rooms;
    DELETE FROM announcements;
    DELETE FROM daily_reports;
    DELETE FROM invoices;
    DELETE FROM payments;
    DELETE FROM order_items;
    DELETE FROM deals_orders;
    DELETE FROM customers;
    DELETE FROM lead_followups;
    DELETE FROM lead_calls;
    DELETE FROM lead_notes;
    DELETE FROM lead_activities;
    DELETE FROM lead_requests;
    DELETE FROM leads;
    DELETE FROM assignment_rules;
    DELETE FROM stock_transfers;
    DELETE FROM stock_movements;
    DELETE FROM products;
    DELETE FROM suppliers;
    DELETE FROM warehouses;
    DELETE FROM categories;
    DELETE FROM lead_sources;
    DELETE FROM users;
    DELETE FROM teams;
    DELETE FROM role_permissions;
    DELETE FROM permissions;
    DELETE FROM roles;
    DELETE FROM integrations_meta;
    DELETE FROM integrations_whatsapp;
    DELETE FROM system_settings;
  `);

  console.log('--- Seeding Roles & Permissions ---');
  for (const r of roles) {
    db.run('INSERT INTO roles (id, name, code, description, is_system) VALUES (?, ?, ?, ?, ?)', [
      r.id, r.name, r.code, r.description, r.is_system
    ]);
  }

  for (const p of permissionsList) {
    db.run('INSERT INTO permissions (id, code, name, category, description) VALUES (?, ?, ?, ?, ?)', [
      `perm-${p.code}`, p.code, p.name, p.category, p.name
    ]);
  }

  const assignPermissions = (roleId: string, codes: string[]) => {
    for (const code of codes) {
      db.run('INSERT OR IGNORE INTO role_permissions (role_id, permission_code) VALUES (?, ?)', [roleId, code]);
    }
  };

  assignPermissions('role-superadmin', permissionsList.map(p => p.code));
  assignPermissions('role-admin', [
    'users.view', 'users.create', 'users.edit', 'roles.view',
    'teams.view_all', 'teams.manage',
    'leads.view_all', 'leads.create', 'leads.edit', 'leads.delete', 'leads.assign', 'leads.import_export', 'leads.request',
    'customers.view', 'customers.create', 'customers.edit',
    'sales.view_all', 'sales.create', 'sales.edit',
    'payments.view_all', 'payments.record', 'payments.verify',
    'inventory.view', 'inventory.manage', 'inventory.transfer',
    'reports.view_all', 'reports.view_team', 'reports.submit_daily', 'reports.whatsapp',
    'chat.view', 'announcements.create',
    'settings.manage', 'integrations.manage', 'audit.view'
  ]);
  assignPermissions('role-manager', [
    'users.view', 'teams.view_all',
    'leads.view_all', 'leads.create', 'leads.edit', 'leads.assign', 'leads.import_export', 'leads.request',
    'customers.view', 'customers.create', 'customers.edit',
    'sales.view_all', 'sales.create', 'sales.edit',
    'payments.view_all', 'payments.record',
    'inventory.view',
    'reports.view_all', 'reports.view_team', 'reports.submit_daily', 'reports.whatsapp',
    'chat.view', 'announcements.create'
  ]);
  assignPermissions('role-leader', [
    'teams.view_own',
    'leads.view_team', 'leads.view_own', 'leads.view_all', 'leads.create', 'leads.edit', 'leads.assign', 'leads.request',
    'customers.view', 'customers.create', 'customers.edit',
    'sales.view_team', 'sales.view_own', 'sales.create',
    'payments.view_team', 'payments.view_own', 'payments.record',
    'inventory.view',
    'reports.view_team', 'reports.submit_daily',
    'chat.view', 'announcements.create'
  ]);
  assignPermissions('role-executive', [
    'leads.view_own', 'leads.view_all', 'leads.create', 'leads.edit', 'leads.request',
    'customers.view', 'customers.create', 'customers.edit',
    'sales.view_own', 'sales.create',
    'payments.view_own', 'payments.record',
    'inventory.view',
    'reports.submit_daily',
    'chat.view'
  ]);
  assignPermissions('role-inventory', [
    'inventory.view', 'inventory.manage', 'inventory.transfer',
    'reports.view_all',
    'chat.view'
  ]);
  assignPermissions('role-finance', [
    'customers.view',
    'sales.view_all',
    'payments.view_all', 'payments.view_own', 'payments.view_team', 'payments.record', 'payments.verify',
    'reports.view_all',
    'chat.view'
  ]);
  assignPermissions('role-support', [
    'leads.view_own', 'leads.view_team', 'leads.view_all', 'customers.view', 'customers.edit', 'chat.view'
  ]);

  for (const t of teamsData) {
    db.run('INSERT INTO teams (id, name, code, target_monthly) VALUES (?, ?, ?, ?)', [
      t.id, t.name, t.code, t.target
    ]);
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = (pw: string) => bcrypt.hashSync(pw, salt);

  const demoUsers = [
    { id: 'user-superadmin', name: 'Akash SuperAdmin', email: 'superadmin@nexora.com', password: hash('SuperAdmin123!'), phone: '+91 98800 11001', role_id: 'role-superadmin', team_id: null, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', target: 0 },
    { id: 'user-admin', name: 'Neha Sharma', email: 'admin@nexora.com', password: hash('Admin123!'), phone: '+91 98800 11002', role_id: 'role-admin', team_id: null, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', target: 0 },
    { id: 'user-manager', name: 'Rajesh Verma', email: 'manager@nexora.com', password: hash('Manager123!'), phone: '+91 98800 11003', role_id: 'role-manager', team_id: null, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', target: 1200000 },
    { id: 'user-leader-alpha', name: 'Rahul Deshmukh', email: 'leader@nexora.com', password: hash('Leader123!'), phone: '+91 98800 11004', role_id: 'role-leader', team_id: 'team-alpha', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', target: 150000 },
    { id: 'user-sales-akash', name: 'Akash Neelgund', email: 'sales@nexora.com', password: hash('Sales123!'), phone: '+91 98800 11005', role_id: 'role-executive', team_id: 'team-alpha', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', target: 100000 },
    { id: 'user-inventory', name: 'Suresh Kumar', email: 'inventory@nexora.com', password: hash('Inventory123!'), phone: '+91 98800 11006', role_id: 'role-inventory', team_id: null, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', target: 0 },
    { id: 'user-finance', name: 'Meera Iyer', email: 'finance@nexora.com', password: hash('Finance123!'), phone: '+91 98800 11007', role_id: 'role-finance', team_id: null, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', target: 0 },
    { id: 'user-support', name: 'Rohan Joshi', email: 'support@nexora.com', password: hash('Support123!'), phone: '+91 98800 11008', role_id: 'role-support', team_id: null, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', target: 0 },
    { id: 'user-leader-bravo', name: 'Priya Nair', email: 'priya.nair@nexora.com', password: hash('Leader123!'), phone: '+91 98800 11010', role_id: 'role-leader', team_id: 'team-bravo', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', target: 120000 },
    { id: 'user-leader-charlie', name: 'Vikram Singh', email: 'vikram.singh@nexora.com', password: hash('Leader123!'), phone: '+91 98800 11011', role_id: 'role-leader', team_id: 'team-charlie', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', target: 100000 },
    { id: 'user-leader-delta', name: 'Sneha Roy', email: 'sneha.roy@nexora.com', password: hash('Leader123!'), phone: '+91 98800 11012', role_id: 'role-leader', team_id: 'team-delta', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', target: 90000 },
    { id: 'user-leader-echo', name: 'Amit Patel', email: 'amit.patel@nexora.com', password: hash('Leader123!'), phone: '+91 98800 11013', role_id: 'role-leader', team_id: 'team-echo', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', target: 80000 }
  ];

  for (const u of demoUsers) {
    db.run(
      `INSERT INTO users (id, name, email, password_hash, phone, role_id, team_id, avatar, target_monthly)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, u.password, u.phone, u.role_id, u.team_id, u.avatar, u.target]
    );
  }

  const additionalExecs = [
    { name: 'Kavita Menon', email: 'kavita.m@nexora.com', team_id: 'team-alpha', target: 80000 },
    { name: 'Sameer Kulkarni', email: 'sameer.k@nexora.com', team_id: 'team-alpha', target: 85000 },
    { name: 'Ananya Sen', email: 'ananya.s@nexora.com', team_id: 'team-alpha', target: 75000 },
    { name: 'Deepak Rao', email: 'deepak.r@nexora.com', team_id: 'team-bravo', target: 80000 },
    { name: 'Pooja Hegde', email: 'pooja.h@nexora.com', team_id: 'team-bravo', target: 70000 },
    { name: 'Arjun Das', email: 'arjun.d@nexora.com', team_id: 'team-bravo', target: 85000 },
    { name: 'Tanvi Shah', email: 'tanvi.s@nexora.com', team_id: 'team-bravo', target: 65000 },
    { name: 'Karthik Raja', email: 'karthik.r@nexora.com', team_id: 'team-charlie', target: 75000 },
    { name: 'Divya Pillai', email: 'divya.p@nexora.com', team_id: 'team-charlie', target: 75000 },
    { name: 'Manish Pandey', email: 'manish.p@nexora.com', team_id: 'team-charlie', target: 60000 },
    { name: 'Siddharth Jain', email: 'siddharth.j@nexora.com', team_id: 'team-delta', target: 70000 },
    { name: 'Megha Gupta', email: 'megha.g@nexora.com', team_id: 'team-delta', target: 65000 },
    { name: 'Varun Reddy', email: 'varun.r@nexora.com', team_id: 'team-delta', target: 60000 },
    { name: 'Nikhil Chauhan', email: 'nikhil.c@nexora.com', team_id: 'team-echo', target: 50000 },
    { name: 'Shreya Bhat', email: 'shreya.b@nexora.com', team_id: 'team-echo', target: 50000 },
    { name: 'Gaurav Mishra', email: 'gaurav.m@nexora.com', team_id: 'team-echo', target: 50000 }
  ];

  let execIdx = 100;
  for (const ex of additionalExecs) {
    execIdx++;
    db.run(
      `INSERT INTO users (id, name, email, password_hash, phone, role_id, team_id, avatar, target_monthly)
       VALUES (?, ?, ?, ?, ?, 'role-executive', ?, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', ?)`,
      [`user-exec-${execIdx}`, ex.name, ex.email, hash('Sales123!'), `+91 98800 ${11100 + execIdx}`, ex.team_id, ex.target]
    );
  }

  db.run('UPDATE teams SET leader_id = ? WHERE id = ?', ['user-leader-alpha', 'team-alpha']);
  db.run('UPDATE teams SET leader_id = ? WHERE id = ?', ['user-leader-bravo', 'team-bravo']);
  db.run('UPDATE teams SET leader_id = ? WHERE id = ?', ['user-leader-charlie', 'team-charlie']);
  db.run('UPDATE teams SET leader_id = ? WHERE id = ?', ['user-leader-delta', 'team-delta']);
  db.run('UPDATE teams SET leader_id = ? WHERE id = ?', ['user-leader-echo', 'team-echo']);

  for (const c of categories) {
    db.run('INSERT INTO categories (id, name, code, description) VALUES (?, ?, ?, ?)', [c.id, c.name, c.code, c.description]);
  }
  for (const w of warehouses) {
    db.run('INSERT INTO warehouses (id, name, code, location, contact) VALUES (?, ?, ?, ?, ?)', [w.id, w.name, w.code, w.location, w.contact]);
  }
  for (const s of suppliers) {
    db.run('INSERT INTO suppliers (id, name, contact_name, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)', [s.id, s.name, s.contact_name, s.phone, s.email, s.address]);
  }

  for (const p of products) {
    db.run(
      `INSERT INTO products (id, sku, name, category_id, description, price, cost, stock, min_stock, warehouse_id, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.sku, p.name, p.category_id, p.name, p.price, p.cost, p.stock, p.min_stock, p.warehouse_id, p.supplier_id]
    );

    const movId = `mov-init-${p.id}`;
    db.run(
      `INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity_change, previous_stock, new_stock, reason, user_id)
       VALUES (?, ?, ?, 'Stock Added', ?, 0, ?, 'Initial inventory stock load', 'user-inventory')`,
      [movId, p.id, p.warehouse_id, p.stock, p.stock]
    );
  }

  const sources = [
    { id: 'src-fb', name: 'Facebook Ads', code: 'Facebook' },
    { id: 'src-ig', name: 'Instagram Ads', code: 'Instagram' },
    { id: 'src-web', name: 'Website Form', code: 'Website' },
    { id: 'src-wa', name: 'WhatsApp Inbound', code: 'WhatsApp' },
    { id: 'src-goog', name: 'Google Search', code: 'Google' },
    { id: 'src-ref', name: 'Customer Referral', code: 'Referral' },
    { id: 'src-manual', name: 'Manual Outbound Call', code: 'Manual' },
    { id: 'src-phone', name: 'Direct Phone Inquiry', code: 'Phone' }
  ];

  for (const s of sources) {
    db.run('INSERT INTO lead_sources (id, name, code) VALUES (?, ?, ?)', [s.id, s.name, s.code]);
  }

  const rules = [
    { id: 'rule-01', rule_type: 'source_based', source_filter: 'Facebook', target_team_id: 'team-alpha', priority: 1 },
    { id: 'rule-02', rule_type: 'source_based', source_filter: 'Instagram', target_team_id: 'team-bravo', priority: 2 },
    { id: 'rule-03', rule_type: 'product_based', product_filter: 'prod-01', target_team_id: 'team-alpha', priority: 3 },
    { id: 'rule-04', rule_type: 'round_robin', target_team_id: null, priority: 10 }
  ];

  for (const r of rules) {
    db.run(
      'INSERT INTO assignment_rules (id, rule_type, source_filter, product_filter, target_team_id, priority) VALUES (?, ?, ?, ?, ?, ?)',
      [r.id, r.rule_type, r.source_filter || null, r.product_filter || null, r.target_team_id || null, r.priority]
    );
  }

  const leadStatuses = ['New', 'Contacted', 'Interested', 'Qualified', 'Quotation', 'Negotiation', 'Won', 'Lost', 'Follow-up'];
  const leadPriorities = ['Low', 'Medium', 'High', 'Urgent'];
  const leadSourcesArr = ['Facebook', 'Instagram', 'Website', 'WhatsApp', 'Google', 'Referral', 'Manual'];
  const campaigns = ['Summer_B2B_LeadGen_2026', 'IG_Reels_Product_Promo', 'FB_Direct_Enterprise', 'Google_Search_CRM', 'Organic_Inbound'];

  const assignedUsers = ['user-sales-akash', 'user-leader-alpha', 'user-leader-bravo', 'user-leader-charlie', 'user-leader-delta', 'user-leader-echo'];
  const teamsList = ['team-alpha', 'team-bravo', 'team-charlie', 'team-delta', 'team-echo'];

  const leadsCreated: string[] = [];

  for (let i = 0; i < sampleLeadNames.length; i++) {
    const leadId = `lead-${String(i + 1).padStart(3, '0')}`;
    const leadCode = `LEAD-2026-${String(1001 + i)}`;
    const name = sampleLeadNames[i];
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}${i + 1}@businessmail.in`;
    const phone = `+91 ${9820000000 + i * 137}`;
    const source = leadSourcesArr[i % leadSourcesArr.length];
    const campaign = campaigns[i % campaigns.length];
    const prodId = products[i % products.length].id;
    const teamId = teamsList[i % teamsList.length];
    const userId = i < 20 ? 'user-sales-akash' : assignedUsers[i % assignedUsers.length];
    const status = leadStatuses[i % leadStatuses.length];
    const priority = leadPriorities[i % leadPriorities.length];
    const expectedValue = (Math.floor(i * 1870) % 25 + 2) * 10000;
    const notes = `Customer interested in ${products[i % products.length].name}. Needs integration for retail branches in South India.`;

    db.run(
      `INSERT INTO leads (id, lead_code, name, email, phone, source, campaign, product_interest_id, assigned_user_id, assigned_team_id, status, priority, expected_value, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'), datetime('now', '-' || ? || ' hours'))`,
      [leadId, leadCode, name, email, phone, source, campaign, prodId, userId, teamId, status, priority, expectedValue, notes, (100 - i), (i % 24)]
    );

    leadsCreated.push(leadId);

    const act1 = `act-init-${leadId}`;
    db.run(
      `INSERT INTO lead_activities (id, lead_id, user_id, action_type, description, created_at)
       VALUES (?, ?, ?, 'Created', ?, datetime('now', '-' || ? || ' days'))`,
      [act1, leadId, userId, `Lead automatically ingested from ${source} campaign ${campaign}`, (100 - i)]
    );

    const act2 = `act-assign-${leadId}`;
    db.run(
      `INSERT INTO lead_activities (id, lead_id, user_id, action_type, description, created_at)
       VALUES (?, ?, ?, 'Assignment', ?, datetime('now', '-' || ? || ' days'))`,
      [act2, leadId, userId, `Lead routed and assigned to ${userId === 'user-sales-akash' ? 'Akash Neelgund' : 'Sales Representative'}`, (100 - i)]
    );

    if (status !== 'New') {
      const act3 = `act-stat-${leadId}`;
      db.run(
        `INSERT INTO lead_activities (id, lead_id, user_id, action_type, description, created_at)
         VALUES (?, ?, ?, 'Status Change', ?, datetime('now', '-' || ? || ' days'))`,
        [act3, leadId, userId, `Status updated to ${status}`, (90 - i > 0 ? 90 - i : 1)]
      );

      const callId = `call-${leadId}`;
      db.run(
        `INSERT INTO lead_calls (id, lead_id, user_id, duration_seconds, call_outcome, notes, created_at)
         VALUES (?, ?, ?, ?, 'Interested & Demo Scheduled', 'Discussed features, pricing discounts and hardware delivery timeline.', datetime('now', '-' || ? || ' days'))`,
        [callId, leadId, userId, 240 + (i * 15), (80 - i > 0 ? 80 - i : 1)]
      );
    }
  }

  
  console.log('--- Seeding 600+ Leads (Unassigned Pool + Assigned) ---');
  for (let i = 130; i < 650; i++) {
    const leadId = 'lead-' + String(i + 1).padStart(4, '0');
    const leadCode = 'LEAD-2026-' + String(1001 + i);
    const baseName = sampleLeadNames[i % sampleLeadNames.length];
    const name = baseName + ' (' + (Math.floor(i / sampleLeadNames.length) + 1) + ')';
    const email = baseName.toLowerCase().replace(/\s+/g, '.') + '.' + (i + 1) + '@gmail.com';
    const phone = '+91 ' + (9800000000 + i * 73);
    const source = leadSourcesArr[i % leadSourcesArr.length];
    const campaign = campaigns[i % campaigns.length];
    const prod = products[i % products.length];
    const priority = leadPriorities[i % leadPriorities.length];
    const expectedValue = prod.price * ((i % 3) + 1);
    const notes = 'Inbound enquiry from ' + source + ' for ' + prod.name + '. Wants fast delivery & installation.';

    // Keep bulk of leads as Unassigned 'New' so Admin can allocate batches of 100 - 500 leads to employees
    const isAssigned = i < 150;
    const userId = isAssigned ? (i < 135 ? 'user-sales-akash' : assignedUsers[i % assignedUsers.length]) : null;
    const teamId = isAssigned ? teamsList[i % teamsList.length] : null;
    const status = isAssigned ? leadStatuses[i % leadStatuses.length] : 'New';

    db.run(
      `INSERT INTO leads (id, lead_code, name, email, phone, source, campaign, product_interest_id, assigned_user_id, assigned_team_id, status, priority, expected_value, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'), datetime('now', '-' || ? || ' minutes'))`,
      [leadId, leadCode, name, email, phone, source, campaign, prod.id, userId, teamId, status, priority, expectedValue, notes, (i % 48), (i % 60)]
    );
  }

  console.log('--- Seeding Lead Allocation Requests (Employees requesting leads from Admin) ---');
  const sampleRequests = [
    { id: 'req-001', user_id: 'user-sales-akash', count: 100, notes: 'Completed yesterday calling batch. Ready for 100 new Facebook Yantra leads.', status: 'Pending' },
    { id: 'req-002', user_id: 'user-exec-101', count: 200, notes: 'Dialing quota for Team Alpha morning campaign.', status: 'Pending' },
    { id: 'req-003', user_id: 'user-exec-102', count: 500, notes: 'Full day telecalling quota for weekend festival sale.', status: 'Approved', allocated: 500, approved_by: 'user-superadmin' },
    { id: 'req-004', user_id: 'user-exec-103', count: 150, notes: 'Need 150 Instagram leads for Karungali Bracelets & Rings.', status: 'Pending' }
  ];

  for (const sr of sampleRequests) {
    db.run(
      `INSERT INTO lead_requests (id, user_id, requested_count, notes, status, allocated_count, approved_by_id, allocated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 hours'))`,
      [sr.id, sr.user_id, sr.count, sr.notes, sr.status, sr.allocated || 0, sr.approved_by || null, sr.status === 'Approved' ? new Date().toISOString() : null]
    );
  }

  console.log('--- Seeding 50+ Customers ---');
  const customersCreated: { id: string; name: string; email: string; phone: string; userId: string }[] = [];
  for (let i = 0; i < 50; i++) {
    const custId = `cust-${String(i + 1).padStart(3, '0')}`;
    const custCode = `CUST-2026-${String(5001 + i)}`;
    const name = sampleLeadNames[i];
    const company = `${name.split(' ')[0]} Enterprises & Retail`;
    const email = `contact@${name.toLowerCase().replace(/\s+/g, '')}retail.com`;
    const phone = `+91 ${9840000000 + i * 211}`;
    const userId = i < 15 ? 'user-sales-akash' : assignedUsers[i % assignedUsers.length];

    db.run(
      `INSERT INTO customers (id, customer_code, lead_id, name, email, phone, company, address, assigned_user_id, total_sales, pending_balance, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, datetime('now', '-' || ? || ' days'))`,
      [custId, custCode, leadsCreated[i], name, email, phone, company, `MG Road, Building #${10 + i}, Bangalore, Karnataka`, userId, (60 - i)]
    );

    customersCreated.push({ id: custId, name, email, phone, userId });
  }

  console.log('--- Seeding 35+ Deals & 50+ Payments ---');
  for (let i = 0; i < 35; i++) {
    const orderId = `order-${String(i + 1).padStart(3, '0')}`;
    const orderCode = `ORD-2026-${String(8001 + i)}`;
    const cust = customersCreated[i % customersCreated.length];
    const teamId = teamsList[i % teamsList.length];
    const prod1 = products[i % products.length];
    const prod2 = products[(i + 3) % products.length];
    const qty1 = (i % 3) + 1;
    const qty2 = (i % 2) + 1;

    const subtotal1 = prod1.price * qty1;
    const subtotal2 = prod2.price * qty2;
    const totalAmount = subtotal1 + subtotal2;
    const discount = Math.round(totalAmount * 0.05);
    const taxable = totalAmount - discount;
    const tax = Math.round(taxable * 0.18);
    const netAmount = taxable + tax;

    let paidAmount = 0;
    let paymentStatus = 'Paid';
    let dealStatus = 'Confirmed';

    if (i % 4 === 0) {
      paidAmount = Math.round(netAmount * 0.4);
      paymentStatus = 'Overdue';
    } else if (i % 4 === 1) {
      paidAmount = Math.round(netAmount * 0.6);
      paymentStatus = 'Partial';
    } else {
      paidAmount = netAmount;
      paymentStatus = 'Paid';
    }

    const pendingAmount = netAmount - paidAmount;
    const daysAgo = i < 5 ? 0 : i < 10 ? 1 : (i % 28) + 2;
    const dueDateDaysAgo = paymentStatus === 'Overdue' ? daysAgo + 5 : 0;

    db.run(
      `INSERT INTO deals_orders (id, order_code, customer_id, user_id, team_id, total_amount, discount_amount, tax_amount, net_amount, paid_amount, pending_amount, status, payment_status, due_date, sale_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'), datetime('now', '-' || ? || ' days'), 'Standard commercial POS hardware & cloud subscription bundle')`,
      [orderId, orderCode, cust.id, cust.userId, teamId, totalAmount, discount, tax, netAmount, paidAmount, pendingAmount, dealStatus, paymentStatus, dueDateDaysAgo, daysAgo]
    );

    const itm1 = `item-1-${orderId}`;
    const itm2 = `item-2-${orderId}`;
    db.run(
      'INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
      [itm1, orderId, prod1.id, qty1, prod1.price, subtotal1]
    );
    db.run(
      'INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
      [itm2, orderId, prod2.id, qty2, prod2.price, subtotal2]
    );

    db.run(
      'UPDATE customers SET total_sales = total_sales + ?, pending_balance = pending_balance + ? WHERE id = ?',
      [netAmount, pendingAmount, cust.id]
    );

    if (paidAmount > 0) {
      const p1 = Math.round(paidAmount * 0.7);
      const p2 = paidAmount - p1;

      db.run(
        `INSERT INTO payments (id, payment_code, order_id, customer_id, user_id, team_id, amount, payment_method, payment_date, status, reference_number, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'UPI', datetime('now', '-' || ? || ' days'), 'Paid', ?, 'Initial token advance via Razorpay UPI')`,
        [`pay-a-${orderId}`, `PAY-2026-${String(9001 + i * 2)}`, orderId, cust.id, cust.userId, teamId, p1, daysAgo, `UPI_TXN_${887766 + i}`]
      );

      if (p2 > 0) {
        db.run(
          `INSERT INTO payments (id, payment_code, order_id, customer_id, user_id, team_id, amount, payment_method, payment_date, status, reference_number, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Bank Transfer', datetime('now', '-' || ? || ' days'), 'Paid', ?, 'Second milestone transfer via NEFT')`,
          [`pay-b-${orderId}`, `PAY-2026-${String(9002 + i * 2)}`, orderId, cust.id, cust.userId, teamId, p2, daysAgo, `NEFT_HDFC_${998877 + i}`]
        );
      }
    }

    if (pendingAmount > 0) {
      db.run(
        `INSERT INTO payments (id, payment_code, order_id, customer_id, user_id, team_id, amount, payment_method, payment_date, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Bank Transfer', datetime('now', '+' || ? || ' days'), ?, 'Pending final balance payment')`,
        [`pay-pend-${orderId}`, `PAY-2026-${String(9500 + i)}`, orderId, cust.id, cust.userId, teamId, pendingAmount, 7, paymentStatus]
      );
    }
  }

  console.log('--- Seeding Follow-ups ---');
  const followupTypes = ['Call', 'Meeting', 'WhatsApp', 'Email', 'Demo'];
  for (let i = 0; i < 25; i++) {
    const leadId = leadsCreated[i];
    const type = followupTypes[i % followupTypes.length];
    const status = i < 5 ? 'Pending' : i < 10 ? 'Overdue' : 'Completed';
    const hourOffsetStr = i < 5 ? `+${i * 2 + 1} hours` : i < 10 ? `-${i * 3 + 2} hours` : '+24 hours';

    db.run(
      `INSERT INTO lead_followups (id, lead_id, user_id, followup_type, scheduled_at, notes, reminder_minutes, status)
       VALUES (?, ?, ?, ?, datetime('now', ?), 'Review proposal and answer hardware installation questions.', 30, ?)`,
      [`fol-${i}`, leadId, 'user-sales-akash', type, hourOffsetStr, status]
    );
  }

  console.log('--- Seeding Chat Channels & Messages (100+) ---');
  const channels = [
    { id: 'room-announcements', name: '📢 Company Announcements', type: 'announcement', team_id: null },
    { id: 'room-general', name: '💬 General Sales Lounge', type: 'group', team_id: null },
    { id: 'room-team-alpha', name: '⚡ Team Alpha Hub', type: 'team', team_id: 'team-alpha' },
    { id: 'room-team-bravo', name: '🚀 Team Bravo Channel', type: 'team', team_id: 'team-bravo' },
    { id: 'room-team-charlie', name: '🎯 Team Charlie Channel', type: 'team', team_id: 'team-charlie' },
    { id: 'room-team-delta', name: '🔥 Team Delta Channel', type: 'team', team_id: 'team-delta' },
    { id: 'room-team-echo', name: '🌟 Team Echo Channel', type: 'team', team_id: 'team-echo' }
  ];

  for (const ch of channels) {
    db.run('INSERT INTO chat_rooms (id, name, room_type, team_id) VALUES (?, ?, ?, ?)', [ch.id, ch.name, ch.type, ch.team_id]);
  }

  const allUsersList = db.all<{ id: string }>('SELECT id FROM users');
  for (const u of allUsersList) {
    db.run('INSERT OR IGNORE INTO chat_members (room_id, user_id) VALUES (?, ?)', ['room-announcements', u.id]);
    db.run('INSERT OR IGNORE INTO chat_members (room_id, user_id) VALUES (?, ?)', ['room-general', u.id]);
  }

  const alphaUsers = db.all<{ id: string }>('SELECT id FROM users WHERE team_id = ?', ['team-alpha']);
  for (const u of alphaUsers) {
    db.run('INSERT OR IGNORE INTO chat_members (room_id, user_id) VALUES (?, ?)', ['room-team-alpha', u.id]);
  }

  const sampleMessages = [
    { sender: 'user-superadmin', room: 'room-announcements', text: '🚀 Welcome to NEXORA CRM! Let us crush this quarters sales target of ₹1.5 Crore.' },
    { sender: 'user-manager', room: 'room-announcements', text: '📢 Reminder: Daily Sales Reports must be submitted by 8:00 PM every evening.' },
    { sender: 'user-leader-alpha', room: 'room-team-alpha', text: 'Team Alpha morning standup at 9:30 AM! Akash, great job on closing the ₹1.25L deal today!' },
    { sender: 'user-sales-akash', room: 'room-team-alpha', text: 'Thanks Rahul! The client signed the contract for 5 POS terminals and annual cloud license.' },
    { sender: 'user-sales-akash', room: 'room-team-alpha', text: 'Also scheduled a follow-up demo with 2 prospective leads from the Facebook campaign.' },
    { sender: 'user-inventory', room: 'room-general', text: '⚠️ Note: 2D Barcode Scanners are running low in Hubli warehouse. Restocking shipment arriving Friday.' },
    { sender: 'user-finance', room: 'room-general', text: '💳 All pending UPI payments received before 4 PM have been reconciled and verified.' }
  ];

  for (let i = 0; i < 105; i++) {
    const base = sampleMessages[i % sampleMessages.length];
    const text = i < sampleMessages.length ? base.text : `[Update #${i}] Follow-up completed with client regarding hardware deployment and software license keys.`;
    const roomId = i % 3 === 0 ? 'room-team-alpha' : i % 3 === 1 ? 'room-general' : 'room-announcements';
    const senderId = i % 2 === 0 ? 'user-sales-akash' : 'user-leader-alpha';

    db.run(
      `INSERT INTO chat_messages (id, room_id, sender_id, message, is_pinned, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now', '-' || ? || ' minutes'))`,
      [`msg-seed-${i}`, roomId, senderId, text, i === 0 ? 1 : 0, (1200 - i * 10)]
    );
  }

  console.log('--- Seeding Notifications ---');
  const notifications = [
    { user_id: 'user-sales-akash', title: 'New Lead Assigned', message: 'Facebook Lead "Ramesh Patel" has been assigned to you.', type: 'Lead', link: '/leads/lead-001' },
    { user_id: 'user-sales-akash', title: 'Payment Verified', message: 'Payment of ₹25,000 for Order ORD-2026-8001 was verified by Finance.', type: 'Payment', link: '/payments' },
    { user_id: 'user-superadmin', title: '⚠️ Low Stock Alert', message: 'Nexora 2D Barcode Scanner (SKU: NX-BCS-2D) is below minimum threshold (6 / 12 units).', type: 'LowStock', link: '/inventory' },
    { user_id: 'user-admin', title: '⚠️ Out of Stock Alert', message: 'Heavy Duty Electronic Cash Drawer Pro (SKU: NX-DRAWER-PRO) is OUT OF STOCK (0 units).', type: 'OutOfStock', link: '/inventory' },
    { user_id: 'user-leader-alpha', title: 'Daily Report Submitted', message: 'Team Alpha daily report logged successfully.', type: 'Report', link: '/reports' }
  ];

  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    db.run(
      'INSERT INTO notifications (id, user_id, title, message, type, link, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [`notif-seed-${i}`, n.user_id, n.title, n.message, n.type, n.link]
    );
  }

  console.log('--- Seeding Meta & WhatsApp Integrations & Settings ---');
  db.run(
    `INSERT INTO integrations_meta (id, page_name, page_id, instagram_account_id, ad_account_id, webhook_verify_token, is_connected, lead_queue_count)
     VALUES ('meta-01', 'Nexora Technologies Official Store', '1092837465928', '17841400293847', 'act_9837462819', 'nexora_meta_secret_2026', 1, 14)`
  );

  const defaultWhatsappTemplate = `*NEXORA CRM — DAILY SALES REPORT* 📊\n*Date:* {{date}}\n\n💰 *TOTAL SALES:* {{total_sales}}\n📦 *TOTAL ORDERS:* {{total_orders}}\n⭐ *TOP PERFORMER:* {{top_performer}}\n🏆 *TOP TEAM:* {{top_team}}\n\n📈 *TEAM PERFORMANCE*\n{{team_breakdown}}\n\n⏳ *PENDING PAYMENTS:* {{pending_payments}}\n🎯 *NEW LEADS:* {{new_leads}}\n✅ *CONVERSIONS:* {{conversions}}\n⚠️ *LOW STOCK ITEMS:* {{low_stock}}\n\n_Generated automatically by Nexora Cloud CRM_`;

  db.run(
    `INSERT INTO integrations_whatsapp (id, business_account_id, phone_number_id, is_connected, daily_report_time, timezone, report_template, recipients)
     VALUES ('wa-01', 'waba_9928374829', 'phone_1092837492', 1, '20:30', 'Asia/Kolkata', ?, ?)`,
    [defaultWhatsappTemplate, JSON.stringify(['+91 9986917364', '9986917364'])]
  );

  db.run('INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)', [
    'company_name', 'NEXORA Technologies Pvt Ltd', 'Registered enterprise name'
  ]);
  db.run('INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)', [
    'currency', 'INR (₹)', 'Base organization currency symbol'
  ]);
  db.run('INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)', [
    'auto_assign_enabled', 'true', 'Enable real-time round-robin and source assignment rules'
  ]);

  db.run(
    `INSERT INTO daily_reports (id, report_date, team_id, submitted_by, total_sales, total_orders, new_leads, conversions, pending_payments, notes, whatsapp_status)
     VALUES ('rep-today-alpha', date('now'), 'team-alpha', 'user-leader-alpha', 340000, 14, 28, 8, 45000, 'Team Alpha achieved 85% of daily target. Akash led sales with 3 major POS deals.', 'sent')`
  );

  console.log('✅ DATABASE SEED COMPLETED SUCCESSFULLY! Realistic enterprise dataset ready.');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().catch(err => {
    console.error('Database seed error:', err);
    process.exit(1);
  });
}
