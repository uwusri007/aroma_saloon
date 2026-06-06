import api from './api';
import type {
  ApiResponse,
  User,
  Treatment,
  Category,
  Appointment,
  TimeSlot,
  Payment,
  Staff,
  WorkingHour,
  Holiday,
  Notification,
  DashboardStats,
} from '@/types';

export const authApi = {
  register: (data: { email: string; password: string; first_name: string; last_name: string; phone?: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data),
  forgotPassword: (email: string) => api.post<ApiResponse>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse>('/auth/reset-password', { token, password }),
  getProfile: () => api.get<ApiResponse<User>>('/auth/profile'),
  updateProfile: (data: Partial<User>) => api.put<ApiResponse<User>>('/auth/profile', data),
  changePassword: (current_password: string, new_password: string) =>
    api.put<ApiResponse>('/auth/change-password', { current_password, new_password }),
};

export const treatmentApi = {
  getCategories: () => api.get<ApiResponse<Category[]>>('/treatments/categories'),
  getTreatments: (params?: { category_id?: number; search?: string; active?: string }) =>
    api.get<ApiResponse<Treatment[]>>('/treatments', { params }),
  getTreatment: (id: number) => api.get<ApiResponse<Treatment>>(`/treatments/${id}`),
  createCategory: (data: Partial<Category>) => api.post<ApiResponse<Category>>('/treatments/categories', data),
  updateCategory: (id: number, data: Partial<Category>) =>
    api.put<ApiResponse<Category>>(`/treatments/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete<ApiResponse>(`/treatments/categories/${id}`),
  createTreatment: (data: Partial<Treatment>) => api.post<ApiResponse<Treatment>>('/treatments', data),
  updateTreatment: (id: number, data: Partial<Treatment>) =>
    api.put<ApiResponse<Treatment>>(`/treatments/${id}`, data),
  deleteTreatment: (id: number) => api.delete<ApiResponse>(`/treatments/${id}`),
};

export const appointmentApi = {
  getSlots: (date: string, treatmentIds: number[]) =>
    api.get<ApiResponse<{ slots: TimeSlot[]; totalDuration: number }>>('/appointments/slots', {
      params: { date, treatment_ids: treatmentIds.join(',') },
    }),
  calculate: (treatmentIds: number[]) =>
    api.post<ApiResponse<{ treatments: Treatment[]; totalDuration: number; totalPrice: number; depositAmount: number }>>(
      '/appointments/calculate',
      { treatment_ids: treatmentIds }
    ),
  create: (data: {
    treatment_ids: number[];
    appointment_date: string;
    start_time: string;
    staff_id: number;
    notes?: string;
  }) => api.post<ApiResponse<Appointment>>('/appointments', data),
  getMy: (params?: { status?: string; upcoming?: string }) =>
    api.get<ApiResponse<Appointment[]>>('/appointments/my', { params }),
  getById: (id: number) => api.get<ApiResponse<Appointment>>(`/appointments/${id}`),
  cancel: (id: number) => api.put<ApiResponse<Appointment>>(`/appointments/${id}/cancel`),
  getSuggestions: () => api.get<ApiResponse<Treatment[]>>('/appointments/suggestions'),
};

export const paymentApi = {
  createOrder: (appointmentId: number) =>
    api.post<ApiResponse<{ orderId: string; approveUrl: string; amount: number }>>('/payments/create-order', {
      appointment_id: appointmentId,
    }),
  capture: (orderId: string, appointmentId: number) =>
    api.post<ApiResponse<{ appointment: Appointment; payment: Payment }>>('/payments/capture', {
      order_id: orderId,
      appointment_id: appointmentId,
    }),
  getHistory: () => api.get<ApiResponse<Payment[]>>('/payments/history'),
};

export const adminApi = {
  getDashboard: () => api.get<ApiResponse<DashboardStats>>('/admin/dashboard'),
  getAppointments: (params?: { status?: string; date?: string }) =>
    api.get<ApiResponse<Appointment[]>>('/admin/appointments', { params }),
  updateAppointmentStatus: (id: number, status: string) =>
    api.put<ApiResponse<Appointment>>(`/admin/appointments/${id}/status`, { status }),
  updateAppointment: (id: number, data: Partial<Appointment>) =>
    api.put<ApiResponse<Appointment>>(`/admin/appointments/${id}`, data),
  getCustomers: () => api.get<ApiResponse<User[]>>('/admin/customers'),
  getCustomer: (id: number) => api.get<ApiResponse<User & { appointments: Appointment[] }>>(`/admin/customers/${id}`),
  toggleCustomerStatus: (id: number) => api.put<ApiResponse>(`/admin/customers/${id}/toggle-status`),
  getStaff: () => api.get<ApiResponse<Staff[]>>('/admin/staff'),
  getStaffMember: (id: number) => api.get<ApiResponse<Staff>>(`/admin/staff/${id}`),
  createStaff: (data: Partial<Staff> & { treatment_ids?: number[] }) =>
    api.post<ApiResponse<Staff>>('/admin/staff', data),
  updateStaff: (id: number, data: Partial<Staff> & { treatment_ids?: number[] }) =>
    api.put<ApiResponse<Staff>>(`/admin/staff/${id}`, data),
  deleteStaff: (id: number) => api.delete<ApiResponse>(`/admin/staff/${id}`),
  getWorkingHours: () => api.get<ApiResponse<WorkingHour[]>>('/admin/working-hours'),
  updateWorkingHours: (hours: Partial<WorkingHour>[]) =>
    api.put<ApiResponse<WorkingHour[]>>('/admin/working-hours', { hours }),
  getHolidays: () => api.get<ApiResponse<Holiday[]>>('/admin/holidays'),
  createHoliday: (data: { date: string; reason?: string }) =>
    api.post<ApiResponse<Holiday>>('/admin/holidays', data),
  deleteHoliday: (id: number) => api.delete<ApiResponse>(`/admin/holidays/${id}`),
  getSettings: () => api.get<ApiResponse<Record<string, string>>>('/admin/settings'),
  updateSettings: (settings: Record<string, string>) =>
    api.put<ApiResponse<Record<string, string>>>('/admin/settings', settings),
  getPayments: () => api.get<ApiResponse<Payment[]>>('/admin/payments'),
};

export const notificationApi = {
  getAll: () => api.get<ApiResponse<Notification[]>>('/notifications'),
  markRead: (id: number) => api.put<ApiResponse>(`/notifications/${id}/read`),
};

export const publicApi = {
  getSettings: () => api.get<ApiResponse<Record<string, string>>>('/settings/public'),
};
