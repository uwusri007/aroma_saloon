export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'Admin' | 'Customer' | 'Staff';
  is_active?: boolean;
}

export interface Treatment {
  id: number;
  category_id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  image_url?: string;
  is_active: boolean;
  category_name?: string;
  suggestions?: Treatment[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Staff {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  is_active: boolean;
  treatments?: { id: number; name: string }[];
}

export interface Appointment {
  id: number;
  customer_id: number;
  staff_id?: number;
  staff_name?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  total_duration_minutes: number;
  total_price: number;
  deposit_amount: number;
  status: 'Pending Payment' | 'Confirmed' | 'Completed' | 'Cancelled';
  notes?: string;
  treatments?: AppointmentTreatment[];
  payments?: Payment[];
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
  first_name?: string;
  last_name?: string;
}

export interface AppointmentTreatment {
  id: number;
  treatment_id: number;
  name: string;
  price: number;
  duration_minutes: number;
  image_url?: string;
}

export interface Payment {
  id: number;
  appointment_id: number;
  paypal_order_id?: string;
  amount: number;
  status: string;
  payment_type: string;
  created_at: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  availableStaff: { id: number; name: string }[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown[];
}

export interface WorkingHour {
  id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface Holiday {
  id: number;
  date: string;
  reason?: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  sent_at: string;
}

export interface DashboardStats {
  todayAppointments: number;
  totalCustomers: number;
  pendingPayments: number;
  monthRevenue: number;
  recentAppointments: Appointment[];
}
