'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { adminApi } from '@/lib/services';
import type { User } from '@/types';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<(User & { appointment_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getCustomers().then((res) => setCustomers(res.data.data)).finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (id: number) => {
    await adminApi.toggleCustomerStatus(id);
    const res = await adminApi.getCustomers();
    setCustomers(res.data.data);
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-8">Customers</h1>
      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blush/50 text-left text-charcoal/60">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Appointments</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-blush/30">
                  <td className="p-4 font-medium">{c.first_name} {c.last_name}</td>
                  <td className="p-4">{c.email}</td>
                  <td className="p-4">{c.phone || '-'}</td>
                  <td className="p-4">{c.appointment_count || 0}</td>
                  <td className="p-4">{c.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="p-4">
                    <Button size="sm" variant="ghost" onClick={() => toggleStatus(c.id)}>
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
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
