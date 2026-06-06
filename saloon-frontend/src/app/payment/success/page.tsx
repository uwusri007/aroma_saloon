'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { paymentApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const capturePayment = async () => {
      const pending = sessionStorage.getItem('pendingPayment');
      const token = searchParams.get('token');

      if (pending) {
        const { appointmentId, orderId } = JSON.parse(pending);
        try {
          await paymentApi.capture(orderId, appointmentId);
          sessionStorage.removeItem('pendingPayment');
          toast.success('Payment successful! Appointment confirmed.');
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      } else if (token) {
        toast.success('Payment approved! Processing confirmation...');
      }

      setProcessing(false);
    };

    capturePayment();
  }, [searchParams]);

  if (processing) return <LoadingSpinner message="Confirming your payment..." />;

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
      <h1 className="font-display text-3xl font-semibold mb-4">Payment Successful!</h1>
      <p className="text-charcoal/60 mb-8">Your appointment has been confirmed. We look forward to seeing you!</p>
      <div className="flex flex-col gap-3">
        <Link href="/dashboard"><Button className="w-full">View My Appointments</Button></Link>
        <Link href="/"><Button variant="secondary" className="w-full">Back to Home</Button></Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
