# NEXORA CRM — Enterprise Sales & Inventory Operations Platform

> **"Turn Every Lead Into Opportunity."**
> A production-grade SaaS CRM platform inspired by enterprise leaders (Vtiger, HubSpot, Zoho CRM), featuring modern full-stack TypeScript architecture, real-time WebSocket communication, role-based access control (RBAC), and automated daily sales reporting.

---

## 🌟 Architecture & Key Features

### 1. Multi-Tier Role-Based Access Control (RBAC)
- **8 Distinct Roles**: Super Admin, Admin, Sales Manager, Team Leader, Sales Executive, Inventory Manager, Finance Manager, Support Staff.
- **Granular Permission Matrix**: 42 fine-grained permission codes enforced on both backend routes and dynamic UI elements.
- **1-Click Demo Persona Switcher**: Seamlessly toggle between personas in the UI to test role isolation.

### 2. Intelligent Lead Pipeline & Meta Ad Ingestion
- **Meta (Facebook & Instagram) Graph API Webhooks**: Real-time ad lead capture with test simulator.
- **Smart Routing & Deduplication Engine**: Detects duplicates by phone/email and routes leads via Round-Robin, Source-based, or Product-based rules.
- **Interactive Kanban Pipeline**: Drag-and-drop workflow (New, Contacted, Interested, Qualified, Quotation, Negotiation, Won, Lost).
- **Comprehensive Lead Profile**: Activity timeline, call logs with duration & outcomes, rich notes, and automated follow-up scheduler.

### 3. Inventory & Multi-Warehouse Tracking
- **Multi-Warehouse Support**: Bangalore Central Hub, Hubli Regional Hub, Mysore Logistics Center.
- **Automated Stock Deductions**: Stock decrements automatically upon deal confirmation with audit logging.
- **Low Stock & Out of Stock Alarms**: Automatic detection when stock falls below `min_stock` with a mandatory `"⚠ LOW STOCK ALERT"` quick restock popup.
- **Inter-Warehouse Transfers**: Seamless inventory movement between hubs.

### 4. Sales Orders & Dedicated Pending Payments Tracker
- **Sales Deal Entry**: Line items, SKU price lookup, custom discounts, and auto-calculated 18% GST.
- **30-Second Mobile Entry**: Streamlined workflow optimized for on-field sales representatives.
- **Pending & Overdue Payments Dashboard**: Dedicated view highlighting overdue days with red alert badges and milestone token collections (UPI, Bank Transfer, Card, Cash).

### 5. Multi-Pod Teams & Leaderboards
- **5 Sales Pods**: Team Alpha, Bravo, Charlie, Delta, Echo with designated Team Leaders.
- **Celebratory Live Leaderboards**: Real-time sales ranking with medal rankings and confetti celebration triggers.
- **Daily Team Report Submissions**: Team leaders submit standup metrics consolidated for executive digests.

### 6. Automated Daily WhatsApp Sales Reports
- **WhatsApp Cloud API Integration**: End-of-day aggregator compiling today's sales, top performers, pod targets, pending payments, and low stock SKU counts.
- **Interactive Template Variable Editor**: Customizable templates (`{{date}}`, `{{total_sales}}`, `{{top_performer}}`, `{{top_team}}`, `{{team_breakdown}}`, `{{pending_payments}}`, etc.).
- **Live WhatsApp Chat Bubble Simulator**: Realistic mobile device preview with instant copy-to-clipboard and test dispatch.

### 7. Internal Communication & Real-time Sockets
- **Company Channels**: `# Company Announcements`, `# General Sales Lounge`, `# Team Alpha`, etc.
- **Live WebSocket Support**: Real-time chat messages and notifications powered by Socket.IO.

### 8. Global Command Center (`Ctrl+K`)
- Universal search across Leads, Customers, Products, and quick navigation actions accessible anywhere via keyboard shortcut.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+`

### Backend Setup
```bash
cd backend
npm install
npx tsx src/seeds/seed.ts   # Seeds 100+ leads, 50+ customers, 35+ deals, 20+ products, 100+ chat messages
npm run dev                 # Starts Express & Socket.IO on http://localhost:5050
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev                 # Starts Vite dev server on http://localhost:5173
```

### Running Test Suite
```bash
cd backend
npm test                    # Runs Vitest automated test suite for RBAC, Auto-routing, Deduplication, Inventory & WhatsApp
```

---

## 👥 Demo Accounts Matrix

| Role | Demo Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@nexora.com` | `SuperAdmin123!` | Complete unrestricted access, system settings, RBAC matrix |
| **Admin** | `admin@nexora.com` | `Admin123!` | Operations management, team & user configuration, audit logs |
| **Sales Manager** | `manager@nexora.com` | `Manager123!` | Organization-wide sales targets, analytics & announcements |
| **Team Leader** | `leader@nexora.com` | `Leader123!` | Team Alpha management, lead routing, daily report submission |
| **Sales Executive** | `sales@nexora.com` | `Sales123!` | Personal lead pipeline, call logs, quotations & mobile sales entry |
| **Inventory Manager**| `inventory@nexora.com` | `Inventory123!` | Stock adjustments, warehouse transfers, low stock alarms |
| **Finance Manager** | `finance@nexora.com` | `Finance123!` | Payment verification, pending & overdue payment recovery |
| **Support Staff** | `support@nexora.com` | `Support123!` | Customer service history and internal chat lounge |

---

## 🔒 Security & Database
- **Engine**: Native `node:sqlite` in WAL mode with foreign key constraints.
- **Auth**: Passwords hashed with `bcryptjs` (salt 10 rounds), signed with JWT tokens.
- **Audit Logging**: Full audit trail recording user IDs, IP addresses, entity types, and timestamps.
