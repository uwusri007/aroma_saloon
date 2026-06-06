'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { adminApi } from '@/lib/services';
import type { Payment } from '@/types';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getPayments().then((res) => setPayments(res.data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-8">Payments</h1>
      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blush/50 text-left text-charcoal/60">
                <th className="p-4">ID</th>
                <th className="p-4">Appointment</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">PayPal Order</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-blush/30">
                  <td className="p-4">#{p.id}</td>
                  <td className="p-4">#{p.appointment_id}</td>
                  <td className="p-4">${Number(p.amount).toFixed(2)}</td>
                  <td className="p-4 capitalize">{p.payment_type}</td>
                  <td className="p-4"><StatusBadge status={p.status} /></td>
                  <td className="p-4 text-xs font-mono">{p.paypal_order_id?.substring(0, 12) || '-'}...</td>
                  <td className="p-4">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
