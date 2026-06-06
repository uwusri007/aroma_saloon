import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function PaymentCancelPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-semibold mb-4">Payment Cancelled</h1>
      <p className="text-charcoal/60 mb-8">Your payment was cancelled. Your appointment is still pending payment.</p>
      <Link href="/dashboard"><Button>Go to Dashboard</Button></Link>
    </div>
  );
}
