import { Router } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import * as authCtrl from '../controllers/authController.js';
import * as leadCtrl from '../controllers/leadController.js';
import * as salesCtrl from '../controllers/salesController.js';
import * as custCtrl from '../controllers/customerController.js';
import * as payCtrl from '../controllers/paymentController.js';
import * as invCtrl from '../controllers/inventoryController.js';
import * as teamCtrl from '../controllers/teamController.js';
import * as reportCtrl from '../controllers/reportController.js';
import * as chatCtrl from '../controllers/chatController.js';
import * as metaCtrl from '../controllers/metaController.js';
import * as adminCtrl from '../controllers/adminController.js';
import * as callingCtrl from '../controllers/callingController.js';
import * as leadReqCtrl from '../controllers/leadRequestController.js';

const router = Router();

// Public / Auth
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authMiddleware, authCtrl.getMe);
router.get('/auth/demo-accounts', authCtrl.getDemoAccounts);

// Meta Inbound Webhook (Public with token check)
router.get('/meta/webhook', metaCtrl.verifyWebhook);
router.post('/meta/webhook', metaCtrl.receiveWebhookLead);

// Protected routes
router.use(authMiddleware);

// Leads
router.get('/leads', requirePermission('leads.view_own', 'leads.view_team', 'leads.view_all'), leadCtrl.listLeads);
router.post('/leads', requirePermission('leads.create'), leadCtrl.createLead);
router.get('/leads/:id', requirePermission('leads.view_own', 'leads.view_team', 'leads.view_all'), leadCtrl.getLeadById);
router.put('/leads/:id/status', requirePermission('leads.edit'), leadCtrl.updateLeadStatus);
router.post('/leads/:id/notes', requirePermission('leads.edit'), leadCtrl.addLeadNote);
router.post('/leads/:id/followups', requirePermission('leads.edit'), leadCtrl.scheduleFollowup);
router.post('/leads/:id/assign', requirePermission('leads.assign'), leadCtrl.assignLead);

// Lead Allocation Requests (Employees ask for 100-500 leads, Admin allocates)
router.post('/lead-requests', leadReqCtrl.createLeadRequest);
router.get('/lead-requests', leadReqCtrl.listLeadRequests);
router.post('/lead-requests/:id/approve', requirePermission('leads.assign', 'teams.manage', 'users.view'), leadReqCtrl.approveLeadRequest);
router.post('/lead-requests/:id/reject', requirePermission('leads.assign', 'teams.manage', 'users.view'), leadReqCtrl.rejectLeadRequest);

// Daily Telecalling / Calling Desk Workflow
router.get('/calling/today', callingCtrl.getTodayCallingQueue);
router.post('/calling/log', callingCtrl.logCallAndUpdateStatus);
router.post('/calling/batch-assign', requirePermission('leads.assign', 'teams.manage'), callingCtrl.batchAssignLeads);
router.get('/calling/team-summary', requirePermission('reports.view_team', 'reports.view_all'), callingCtrl.getTeamCallingSummary);

// Sales & Deals
router.get('/sales', requirePermission('sales.view_own', 'sales.view_team', 'sales.view_all'), salesCtrl.listSales);
router.post('/sales', requirePermission('sales.create'), salesCtrl.createSale);

// Customers
router.get('/customers', requirePermission('customers.view'), custCtrl.listCustomers);
router.get('/customers/:id', requirePermission('customers.view'), custCtrl.getCustomerById);
router.post('/customers/convert', requirePermission('customers.create', 'leads.edit'), custCtrl.convertLeadToCustomer);

// Payments & Pending Payments Dashboard
router.get('/payments', requirePermission('payments.view_own', 'payments.view_team', 'payments.view_all'), payCtrl.listPayments);
router.get('/payments/pending', requirePermission('payments.view_own', 'payments.view_team', 'payments.view_all'), payCtrl.getPendingPayments);
router.post('/payments/record', requirePermission('payments.record'), payCtrl.recordPayment);

// Inventory
router.get('/inventory/products', requirePermission('inventory.view'), invCtrl.listProducts);
router.post('/inventory/adjust', requirePermission('inventory.manage'), invCtrl.adjustStock);
router.post('/inventory/transfer', requirePermission('inventory.transfer'), invCtrl.transferStock);
router.get('/inventory/warehouses', requirePermission('inventory.view'), invCtrl.listWarehouses);

// Teams
router.get('/teams', requirePermission('teams.view_own', 'teams.view_all'), teamCtrl.listTeams);
router.get('/teams/dashboard', requirePermission('teams.view_own', 'teams.view_all'), teamCtrl.getTeamDashboard);
router.get('/teams/:id/dashboard', requirePermission('teams.view_own', 'teams.view_all'), teamCtrl.getTeamDashboard);
router.post('/teams/daily-report', requirePermission('reports.submit_daily'), teamCtrl.submitDailyReport);

// Reports & WhatsApp
router.get('/reports/dashboard', requirePermission('reports.view_all', 'reports.view_team'), reportCtrl.getDashboardAnalytics);
router.get('/reports/whatsapp', requirePermission('reports.whatsapp'), reportCtrl.getWhatsAppReport);
router.post('/reports/whatsapp/test', requirePermission('reports.whatsapp'), reportCtrl.sendTestWhatsAppReport);

// Chat & Announcements
router.get('/chat/rooms', requirePermission('chat.view'), chatCtrl.listChatRooms);
router.get('/chat/rooms/:roomId/messages', requirePermission('chat.view'), chatCtrl.getRoomMessages);
router.post('/chat/messages', requirePermission('chat.view'), chatCtrl.sendChatMessage);
router.get('/announcements', requirePermission('chat.view'), chatCtrl.listAnnouncements);
router.post('/announcements', requirePermission('announcements.create'), chatCtrl.createAnnouncement);

// Meta Integrations & Simulator
router.get('/meta/status', requirePermission('integrations.manage'), metaCtrl.getMetaIntegration);
router.put('/meta/config', requirePermission('integrations.manage'), metaCtrl.updateMetaIntegration);
router.post('/meta/simulate', requirePermission('leads.create'), metaCtrl.simulateMetaLead);

// Admin & Settings & Notifications
router.get('/admin/roles-matrix', requirePermission('roles.view', 'roles.manage'), adminCtrl.getRolesMatrix);
router.put('/admin/roles/:roleId/permissions', requirePermission('roles.manage'), adminCtrl.updateRolePermissions);
router.get('/admin/users', requirePermission('users.view'), adminCtrl.listUsers);
router.post('/admin/users', requirePermission('users.create'), adminCtrl.createUser);
router.get('/admin/audit-logs', requirePermission('audit.view'), adminCtrl.getAuditLogs);
router.get('/notifications', adminCtrl.getNotifications);
router.put('/notifications/:id/read', adminCtrl.markNotificationRead);

export default router;
