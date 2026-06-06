'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setSent(true);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="font-display text-3xl font-semibold text-center mb-2">Forgot Password</h1>
        <p className="text-center text-charcoal/60 mb-8">
          {sent ? 'Check your email for reset instructions.' : 'Enter your email to receive a reset link.'}
        </p>
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" loading={loading} className="w-full">Send Reset Link</Button>
          </form>
        ) : (
          <Link href="/login"><Button className="w-full">Back to Login</Button></Link>
        )}
      </div>
    </div>
  );
}
