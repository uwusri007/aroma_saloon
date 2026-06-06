'use client';

import { useEffect, useState } from 'react';
import { Calendar, Users, CreditCard, Clock } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { adminApi } from '@/lib/services';
import type { DashboardStats } from '@/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then((res) => setStats(res.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return null;

  const cards = [
    { label: "Today's Appointments", value: stats.todayAppointments, icon: Calendar, color: 'bg-rose-gold/10 text-rose-gold' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: Clock, color: 'bg-amber-100 text-amber-600' },
    { label: 'Monthly Revenue', value: `$${Number(stats.monthRevenue).toFixed(2)}`, icon: CreditCard, color: 'bg-emerald-100 text-emerald-600' },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map((card) => (
          <div key={card.label} className="card p-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-semibold">{card.value}</p>
            <p className="text-sm text-charcoal/60">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="p-6 border-b border-blush/50">
          <h2 className="font-display text-xl font-semibold">Recent Appointments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blush/50 text-left text-charcoal/60">
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Time</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAppointments.map((apt) => (
                <tr key={apt.id} className="border-b border-blush/30 hover:bg-blush/20">
                  <td className="p-4">{apt.first_name || apt.customer_first_name} {apt.last_name || apt.customer_last_name}</td>
                  <td className="p-4">{apt.appointment_date}</td>
                  <td className="p-4">{apt.start_time?.substring(0, 5)}</td>
                  <td className="p-4">${Number(apt.total_price).toFixed(2)}</td>
                  <td className="p-4"><StatusBadge status={apt.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
