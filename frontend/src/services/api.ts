const BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('nexora_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('nexora_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('nexora_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred during API request');
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request<any>('/auth/me'),
  getDemoAccounts: () => request<any>('/auth/demo-accounts'),

  // Dashboard & Reports
  getDashboardAnalytics: () => request<any>('/reports/dashboard'),
  getWhatsAppReport: () => request<any>('/reports/whatsapp'),
  sendTestWhatsAppReport: (phone?: string) =>
    request<any>('/reports/whatsapp/test', { method: 'POST', body: JSON.stringify({ recipient_phone: phone }) }),

  // Leads
  getLeads: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/leads?${query}`);
  },
  getLeadById: (id: string) => request<any>(`/leads/${id}`),
  createLead: (leadData: any) =>
    request<any>('/leads', { method: 'POST', body: JSON.stringify(leadData) }),
  updateLeadStatus: (id: string, status: string, note?: string) =>
    request<any>(`/leads/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, note }) }),
  addLeadNote: (id: string, note: string) =>
    request<any>(`/leads/${id}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),
  scheduleFollowup: (id: string, followup: any) =>
    request<any>(`/leads/${id}/followups`, { method: 'POST', body: JSON.stringify(followup) }),
  assignLead: (id: string, user_id?: string, team_id?: string) =>
    request<any>(`/leads/${id}/assign`, { method: 'POST', body: JSON.stringify({ assigned_user_id: user_id, assigned_team_id: team_id }) }),

  // Daily Telecalling / Calling Desk Workflow
  getTodayCallingQueue: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/calling/today?${query}`);
  },
  logCallAndUpdateStatus: (data: any) =>
    request<any>('/calling/log', { method: 'POST', body: JSON.stringify(data) }),
  batchAssignLeads: (data: { user_id: string; count?: number; source?: string; status?: string }) =>
    request<any>('/calling/batch-assign', { method: 'POST', body: JSON.stringify(data) }),
  getTeamCallingSummary: () =>
    request<any>('/calling/team-summary'),

  // Employee Lead Requests & Admin Allocation
  createLeadRequest: (data: { requested_count: number; notes?: string }) =>
    request<any>('/lead-requests', { method: 'POST', body: JSON.stringify(data) }),
  getLeadRequests: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/lead-requests?${query}`);
  },
  approveLeadRequest: (id: string, data: { count?: number; source_filter?: string } = {}) =>
    request<any>(`/lead-requests/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  rejectLeadRequest: (id: string, reason?: string) =>
    request<any>(`/lead-requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Meta Inbound Simulation
  simulateMetaLead: (data: any) =>
    request<any>('/meta/simulate', { method: 'POST', body: JSON.stringify(data) }),
  getMetaStatus: () => request<any>('/meta/status'),
  updateMetaConfig: (data: any) =>
    request<any>('/meta/config', { method: 'PUT', body: JSON.stringify(data) }),

  // Customers
  getCustomers: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/customers?${query}`);
  },
  getCustomerById: (id: string) => request<any>(`/customers/${id}`),
  convertLeadToCustomer: (data: { lead_id: string; company?: string; address?: string }) =>
    request<any>('/customers/convert', { method: 'POST', body: JSON.stringify(data) }),

  // Sales
  getSales: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/sales?${query}`);
  },
  createSale: (saleData: any) =>
    request<any>('/sales', { method: 'POST', body: JSON.stringify(saleData) }),

  // Payments & Pending Dashboard
  getPayments: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/payments?${query}`);
  },
  getPendingPayments: () => request<any>('/payments/pending'),
  recordPayment: (paymentData: any) =>
    request<any>('/payments/record', { method: 'POST', body: JSON.stringify(paymentData) }),

  // Inventory
  getProducts: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/inventory/products?${query}`);
  },
  adjustStock: (data: { product_id: string; quantity_change: number; movement_type?: string; reason?: string }) =>
    request<any>('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  transferStock: (data: any) =>
    request<any>('/inventory/transfer', { method: 'POST', body: JSON.stringify(data) }),
  getWarehouses: () => request<any>('/inventory/warehouses'),

  // Teams
  getTeams: () => request<any>('/teams'),
  getTeamDashboard: (teamId?: string) =>
    request<any>(teamId ? `/teams/${teamId}/dashboard` : '/teams/dashboard'),
  submitDailyReport: (reportData: any) =>
    request<any>('/teams/daily-report', { method: 'POST', body: JSON.stringify(reportData) }),

  // Chat
  getChatRooms: () => request<any>('/chat/rooms'),
  getRoomMessages: (roomId: string) => request<any>(`/chat/rooms/${roomId}/messages`),
  sendChatMessage: (data: { roomId: string; message: string; attachments?: any[] }) =>
    request<any>('/chat/messages', { method: 'POST', body: JSON.stringify(data) }),
  getAnnouncements: () => request<any>('/announcements'),
  createAnnouncement: (data: any) =>
    request<any>('/announcements', { method: 'POST', body: JSON.stringify(data) }),

  // Admin & Settings
  getRolesMatrix: () => request<any>('/admin/roles-matrix'),
  updateRolePermissions: (roleId: string, permissions: string[]) =>
    request<any>(`/admin/roles/${roleId}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions }) }),
  getUsers: () => request<any>('/admin/users'),
  createUser: (userData: any) =>
    request<any>('/admin/users', { method: 'POST', body: JSON.stringify(userData) }),
  getAuditLogs: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/admin/audit-logs?${query}`);
  },
  getNotifications: () => request<any>('/notifications'),
  markNotificationRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
};
