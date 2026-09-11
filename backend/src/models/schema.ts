import db from '../config/db.js';

export function initializeDatabase() {
  db.exec(`
    -- Roles
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Permissions
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT
    );

    -- Role Permissions
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT NOT NULL,
      permission_code TEXT NOT NULL,
      PRIMARY KEY (role_id, permission_code),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );

    -- Teams
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      leader_id TEXT,
      target_monthly REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role_id TEXT NOT NULL,
      team_id TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'active',
      target_monthly REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    );

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Warehouses
    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      location TEXT,
      contact TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Suppliers
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category_id TEXT,
      description TEXT,
      price REAL NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      reserved_stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 10,
      warehouse_id TEXT,
      supplier_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    );

    -- Stock Movements
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      warehouse_id TEXT,
      movement_type TEXT NOT NULL, -- 'Stock Added', 'Stock Removed', 'Sale', 'Return', 'Damage', 'Adjustment', 'Transfer'
      quantity_change INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reference_id TEXT,
      reason TEXT,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Stock Transfers
    CREATE TABLE IF NOT EXISTS stock_transfers (
      id TEXT PRIMARY KEY,
      transfer_code TEXT NOT NULL UNIQUE,
      from_warehouse_id TEXT NOT NULL,
      to_warehouse_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT DEFAULT 'Completed', -- 'Pending', 'Completed', 'Cancelled'
      notes TEXT,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Lead Sources
    CREATE TABLE IF NOT EXISTS lead_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1
    );

    -- Leads
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      lead_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      source TEXT NOT NULL, -- Facebook, Instagram, Website, WhatsApp, Google, Referral, Manual, Phone, Other
      campaign TEXT,
      product_interest_id TEXT,
      assigned_user_id TEXT,
      assigned_team_id TEXT,
      status TEXT NOT NULL DEFAULT 'New', -- New, Contacted, Interested, Qualified, Quotation, Negotiation, Won, Lost, Not Interested, Follow-up
      priority TEXT NOT NULL DEFAULT 'Medium', -- Low, Medium, High, Urgent
      expected_value REAL DEFAULT 0,
      notes TEXT,
      last_contact_at DATETIME,
      next_followup_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_interest_id) REFERENCES products(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_team_id) REFERENCES teams(id) ON DELETE SET NULL
    );

    -- Lead Activities
    CREATE TABLE IF NOT EXISTS lead_activities (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      user_id TEXT,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Lead Notes
    CREATE TABLE IF NOT EXISTS lead_notes (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      user_id TEXT,
      note TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Lead Calls
    CREATE TABLE IF NOT EXISTS lead_calls (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      user_id TEXT,
      duration_seconds INTEGER DEFAULT 0,
      call_outcome TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Lead Followups
    CREATE TABLE IF NOT EXISTS lead_followups (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      user_id TEXT,
      followup_type TEXT NOT NULL, -- Call, Meeting, WhatsApp, Email, Demo, Other
      scheduled_at DATETIME NOT NULL,
      notes TEXT,
      reminder_minutes INTEGER DEFAULT 30,
      status TEXT DEFAULT 'Pending', -- Pending, Completed, Overdue, Cancelled
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Lead Requests (Employees request 100 - 500 leads from Admin)
    CREATE TABLE IF NOT EXISTS lead_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      requested_count INTEGER NOT NULL DEFAULT 100,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected
      allocated_count INTEGER DEFAULT 0,
      approved_by_id TEXT,
      allocated_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      customer_code TEXT NOT NULL UNIQUE,
      lead_id TEXT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      company TEXT,
      address TEXT,
      assigned_user_id TEXT,
      total_sales REAL DEFAULT 0,
      pending_balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Deals / Orders
    CREATE TABLE IF NOT EXISTS deals_orders (
      id TEXT PRIMARY KEY,
      order_code TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL,
      lead_id TEXT,
      user_id TEXT NOT NULL,
      team_id TEXT,
      total_amount REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      net_amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      pending_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Confirmed', -- Quotation, Negotiation, Confirmed, Partially Paid, Paid, Cancelled, Refunded
      payment_status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Partial, Paid, Overdue, Refunded
      due_date DATETIME,
      sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    );

    -- Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES deals_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    -- Payments
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      payment_code TEXT NOT NULL UNIQUE,
      order_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      team_id TEXT,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL, -- Cash, UPI, Bank Transfer, Card, Other
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'Paid', -- Pending, Partial, Paid, Overdue, Refunded, Verified
      reference_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES deals_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );

    -- Invoices
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_code TEXT NOT NULL UNIQUE,
      order_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATETIME,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'Issued',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES deals_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
    );

    -- Daily Reports
    CREATE TABLE IF NOT EXISTS daily_reports (
      id TEXT PRIMARY KEY,
      report_date DATE NOT NULL,
      team_id TEXT,
      submitted_by TEXT NOT NULL,
      total_sales REAL DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      new_leads INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      pending_payments REAL DEFAULT 0,
      notes TEXT,
      whatsapp_status TEXT DEFAULT 'pending', -- pending, sent, failed
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
      FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE RESTRICT
    );

    -- Chat Rooms
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      room_type TEXT NOT NULL, -- direct, team, announcement, group
      team_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    -- Chat Members
    CREATE TABLE IF NOT EXISTS chat_members (
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (room_id, user_id),
      FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Chat Messages
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      message TEXT NOT NULL,
      attachments TEXT, -- JSON array
      is_pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Announcements
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'Normal', -- Normal, Important, Urgent
      created_by TEXT NOT NULL,
      target_team_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (target_team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- Lead, Sale, Payment, LowStock, OutOfStock, FollowUp, Chat, Announcement, Report
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      old_values TEXT, -- JSON string
      new_values TEXT, -- JSON string
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Meta Integrations
    CREATE TABLE IF NOT EXISTS integrations_meta (
      id TEXT PRIMARY KEY,
      page_name TEXT DEFAULT 'Nexora Official Store',
      page_id TEXT DEFAULT '1092837465928',
      instagram_account_id TEXT DEFAULT '17841400293847',
      ad_account_id TEXT DEFAULT 'act_9837462819',
      access_token TEXT,
      webhook_verify_token TEXT DEFAULT 'nexora_meta_secret_2026',
      is_connected INTEGER DEFAULT 1,
      lead_queue_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- WhatsApp Integrations
    CREATE TABLE IF NOT EXISTS integrations_whatsapp (
      id TEXT PRIMARY KEY,
      business_account_id TEXT DEFAULT 'waba_9928374829',
      phone_number_id TEXT DEFAULT 'phone_1092837492',
      access_token TEXT,
      is_connected INTEGER DEFAULT 1,
      daily_report_time TEXT DEFAULT '20:30',
      timezone TEXT DEFAULT 'Asia/Kolkata',
      report_template TEXT,
      recipients TEXT, -- JSON array of phones / roles
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Lead Assignment Rules
    CREATE TABLE IF NOT EXISTS assignment_rules (
      id TEXT PRIMARY KEY,
      rule_type TEXT NOT NULL, -- round_robin, team_based, product_based, source_based, performance_based, manual
      source_filter TEXT,
      product_filter TEXT,
      target_team_id TEXT,
      priority INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (target_team_id) REFERENCES teams(id) ON DELETE SET NULL
    );

    -- System Settings
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for high performance
    CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
    CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_assigned_user ON leads(assigned_user_id);
    CREATE INDEX IF NOT EXISTS idx_leads_assigned_team ON leads(assigned_team_id);
    CREATE INDEX IF NOT EXISTS idx_deals_customer ON deals_orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_deals_user ON deals_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_deals_team ON deals_orders(team_id);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity);
  `);
}
