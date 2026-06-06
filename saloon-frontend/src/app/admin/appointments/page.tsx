'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { adminApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';
import type { Appointment } from '@/types';

const STATUSES = ['Pending Payment', 'Confirmed', 'Completed', 'Cancelled'];

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = () => {
    setLoading(true);
    adminApi.getAppointments(filter ? { status: filter } : undefined)
      .then((res) => setAppointments(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await adminApi.updateAppointmentStatus(id, status);
      toast.success('Status updated');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl font-semibold">Appointments</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blush/50 text-left text-charcoal/60">
                <th className="p-4">ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Time</th>
                <th className="p-4">Staff</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt.id} className="border-b border-blush/30">
                  <td className="p-4">#{apt.id}</td>
                  <td className="p-4">{apt.customer_first_name} {apt.customer_last_name}</td>
                  <td className="p-4">{apt.appointment_date}</td>
                  <td className="p-4">{apt.start_time?.substring(0, 5)}</td>
                  <td className="p-4">{apt.staff_name || '-'}</td>
                  <td className="p-4">${Number(apt.total_price).toFixed(2)}</td>
                  <td className="p-4"><StatusBadge status={apt.status} /></td>
                  <td className="p-4">
                    <select
                      value={apt.status}
                      onChange={(e) => updateStatus(apt.id, e.target.value)}
                      className="text-xs border border-blush rounded-lg px-2 py-1"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
