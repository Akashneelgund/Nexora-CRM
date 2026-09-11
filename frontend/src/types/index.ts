export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role_id: string;
  role_code: string;
  role_name: string;
  team_id?: string | null;
  team_name?: string | null;
  avatar?: string;
  target_monthly?: number;
  permissions: string[];
}

export interface Lead {
  id: string;
  lead_code: string;
  name: string;
  email?: string;
  phone: string;
  source: string;
  campaign?: string;
  product_interest_id?: string;
  product_name?: string;
  product_price?: number;
  assigned_user_id?: string;
  assigned_user_name?: string;
  assigned_team_id?: string;
  assigned_team_name?: string;
  status: 'New' | 'Contacted' | 'Interested' | 'Qualified' | 'Quotation' | 'Negotiation' | 'Won' | 'Lost' | 'Follow-up';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  expected_value: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  activities?: LeadActivity[];
  notesList?: LeadNote[];
  calls?: LeadCall[];
  followups?: LeadFollowup[];
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id?: string;
  user_name?: string;
  action_type: string;
  description: string;
  created_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  user_id?: string;
  user_name?: string;
  note: string;
  created_at: string;
}

export interface LeadCall {
  id: string;
  lead_id: string;
  user_id?: string;
  user_name?: string;
  duration_seconds: number;
  call_outcome: string;
  notes?: string;
  created_at: string;
}

export interface LeadFollowup {
  id: string;
  lead_id: string;
  user_id?: string;
  user_name?: string;
  followup_type: 'Call' | 'Meeting' | 'WhatsApp' | 'Email' | 'Demo' | 'Other';
  scheduled_at: string;
  notes?: string;
  reminder_minutes: number;
  status: 'Pending' | 'Completed' | 'Overdue' | 'Cancelled';
}

export interface Customer {
  id: string;
  customer_code: string;
  lead_id?: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  address?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  total_sales: number;
  pending_balance: number;
  created_at: string;
  orders?: DealOrder[];
  payments?: Payment[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category_id?: string;
  category_name?: string;
  description?: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  warehouse_id?: string;
  warehouse_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  is_low_stock?: boolean | number;
  is_out_of_stock?: boolean | number;
}

export interface DealOrder {
  id: string;
  order_code: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_company?: string;
  user_id: string;
  sales_rep_name?: string;
  team_id?: string;
  team_name?: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  paid_amount: number;
  pending_amount: number;
  status: string;
  payment_status: 'Pending' | 'Partial' | 'Paid' | 'Overdue' | 'Refunded';
  due_date?: string;
  sale_date: string;
  notes?: string;
  days_overdue?: number;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Payment {
  id: string;
  payment_code: string;
  order_id: string;
  order_code?: string;
  customer_id: string;
  customer_name?: string;
  customer_company?: string;
  user_id: string;
  collected_by_name?: string;
  team_id?: string;
  team_name?: string;
  amount: number;
  payment_method: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
  payment_date: string;
  status: 'Pending' | 'Partial' | 'Paid' | 'Overdue' | 'Refunded' | 'Verified';
  reference_number?: string;
  notes?: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  leader_id?: string;
  leader_name?: string;
  leader_avatar?: string;
  leader_email?: string;
  target_monthly: number;
  member_count?: number;
  total_sales?: number;
  total_leads?: number;
  pending_payments?: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  room_type: 'direct' | 'team' | 'announcement' | 'group';
  team_id?: string;
  last_message?: string;
  last_message_time?: string;
  message_count?: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  sender_role?: string;
  message: string;
  attachments?: string;
  is_pinned?: number;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: number;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  is_system: number;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
}
