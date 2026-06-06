'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CreditCard, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { appointmentApi, paymentApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';
import type { Appointment } from '@/types';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = parseInt(params.id as string);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    appointmentApi.getById(appointmentId).then((res) => {
      const apt = res.data.data;
      setAppointment(apt);
      if (apt.status === 'Confirmed') {
        router.push('/dashboard');
      }
    }).catch(() => toast.error('Appointment not found')).finally(() => setLoading(false));
  }, [appointmentId, router]);

  const handlePayPal = async () => {
    setPaying(true);
    try {
      const res = await paymentApi.createOrder(appointmentId);
      const { approveUrl } = res.data.data;
      if (approveUrl) {
        sessionStorage.setItem('pendingPayment', JSON.stringify({ appointmentId, orderId: res.data.data.orderId }));
        window.location.href = approveUrl;
      } else {
        toast.error('Failed to get PayPal approval URL');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading payment details..." />;
  if (!appointment) return <div className="text-center py-20">Appointment not found</div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="card p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blush/50 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-rose-gold" />
          </div>
          <h1 className="font-display text-2xl font-semibold mb-2">Complete Payment</h1>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="space-y-3 text-sm mb-8">
          <div className="flex justify-between"><span className="text-charcoal/60">Date</span><span>{appointment.appointment_date}</span></div>
          <div className="flex justify-between"><span className="text-charcoal/60">Time</span><span>{appointment.start_time?.substring(0, 5)}</span></div>
          <div className="flex justify-between"><span className="text-charcoal/60">Total</span><span>${Number(appointment.total_price).toFixed(2)}</span></div>
          <div className="flex justify-between border-t border-blush pt-3 font-semibold">
            <span>Deposit Due (10%)</span>
            <span className="text-rose-gold">${Number(appointment.deposit_amount).toFixed(2)}</span>
          </div>
        </div>

        <Button onClick={handlePayPal} loading={paying} className="w-full">
          <ExternalLink className="w-4 h-4" /> Pay with PayPal
        </Button>

        <p className="text-xs text-charcoal/50 text-center mt-4">
          You will be redirected to PayPal to complete your deposit payment securely.
        </p>
      </div>
    </div>
  );
}
