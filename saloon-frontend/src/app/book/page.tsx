'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import { Calendar, Clock, User, CreditCard, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import TreatmentCard from '@/components/treatments/TreatmentCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { treatmentApi, appointmentApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';
import type { Treatment, TimeSlot } from '@/types';
import clsx from 'clsx';

const STEPS = ['Select Treatments', 'Choose Date & Time', 'Review & Confirm'];

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState<{ totalDuration: number; totalPrice: number; depositAmount: number } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please login to book an appointment');
      router.push('/login?redirect=/book');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    treatmentApi.getTreatments().then((res) => {
      setTreatments(res.data.data);
      const preselected = searchParams.get('treatments');
      if (preselected) {
        setSelected(preselected.split(',').map(Number).filter(Boolean));
      }
    }).finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    if (selected.length && step >= 1) {
      appointmentApi.calculate(selected).then((res) => setSummary(res.data.data));
    }
  }, [selected, step]);

  useEffect(() => {
    if (selected.length && selectedDate && step >= 1) {
      setSlotsLoading(true);
      appointmentApi.getSlots(selectedDate, selected)
        .then((res) => setSlots(res.data.data.slots))
        .catch(() => setSlots([]))
        .finally(() => setSlotsLoading(false));
    }
  }, [selected, selectedDate, step]);

  const toggleTreatment = (t: Treatment) => {
    setSelected((prev) =>
      prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
    );
    setSelectedSlot(null);
    setSelectedStaffId(null);
  };

  const handleNext = () => {
    if (step === 0 && !selected.length) {
      toast.error('Please select at least one treatment');
      return;
    }
    if (step === 1 && (!selectedSlot || !selectedStaffId)) {
      toast.error('Please select a time slot and staff member');
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !selectedStaffId) return;
    setSubmitting(true);
    try {
      const res = await appointmentApi.create({
        treatment_ids: selected,
        appointment_date: selectedDate,
        start_time: selectedSlot.startTime.substring(0, 5),
        staff_id: selectedStaffId,
        notes,
      });
      toast.success('Appointment created! Proceed to payment.');
      router.push(`/payment/${res.data.data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) return <LoadingSpinner message="Preparing booking..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="section-title text-center mb-2">Book Appointment</h1>
      <p className="text-center text-charcoal/60 mb-10">Complete your booking in a few simple steps</p>

      <div className="flex justify-center mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
              i <= step ? 'bg-rose-gold text-white' : 'bg-blush/50 text-charcoal/50'
            )}>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">{i + 1}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={clsx('w-8 h-0.5 mx-1', i < step ? 'bg-rose-gold' : 'bg-blush')} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <p className="text-sm text-charcoal/60 mb-4">Select one or more treatments</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {treatments.map((t) => (
              <TreatmentCard key={t.id} treatment={t} selectable selected={selected.includes(t.id)} onSelect={toggleTreatment} />
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Input label="Select Date" type="date" value={selectedDate} min={format(addDays(new Date(), 1), 'yyyy-MM-dd')} onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }} />
            <div className="mt-6">
              <label className="block text-sm font-medium text-charcoal/80 mb-3">Available Time Slots</label>
              {slotsLoading ? (
                <LoadingSpinner message="Finding available slots..." />
              ) : slots.length === 0 ? (
                <p className="text-charcoal/60 text-sm">No slots available for this date. Try another date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => { setSelectedSlot(slot); setSelectedStaffId(slot.availableStaff[0]?.id || null); }}
                      className={clsx(
                        'p-3 rounded-xl border text-sm font-medium transition-all',
                        selectedSlot?.startTime === slot.startTime ? 'border-rose-gold bg-rose-gold/10 text-rose-gold' : 'border-blush hover:border-rose-gold/50'
                      )}
                    >
                      {slot.startTime.substring(0, 5)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedSlot && selectedSlot.availableStaff.length > 1 && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-charcoal/80 mb-3">Select Stylist</label>
                <div className="space-y-2">
                  {selectedSlot.availableStaff.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStaffId(s.id)}
                      className={clsx(
                        'w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all',
                        selectedStaffId === s.id ? 'border-rose-gold bg-rose-gold/10' : 'border-blush hover:border-rose-gold/50'
                      )}
                    >
                      <User className="w-4 h-4 text-rose-gold" /> {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {summary && (
            <div className="card p-6">
              <h3 className="font-display text-xl font-semibold mb-4">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-charcoal/60">Duration</span><span>{summary.totalDuration} min</span></div>
                <div className="flex justify-between"><span className="text-charcoal/60">Total Price</span><span className="font-semibold">${summary.totalPrice.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-blush pt-3"><span className="text-charcoal/60">Deposit (10%)</span><span className="font-semibold text-rose-gold">${summary.depositAmount.toFixed(2)}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && summary && (
        <div className="max-w-lg mx-auto">
          <div className="card p-6 space-y-4">
            <h3 className="font-display text-xl font-semibold">Confirm Your Booking</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-rose-gold" /> {selectedDate}</div>
              <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-rose-gold" /> {selectedSlot?.startTime.substring(0, 5)} ({summary.totalDuration} min)</div>
              <div className="flex items-center gap-3"><CreditCard className="w-4 h-4 text-rose-gold" /> Deposit: ${summary.depositAmount.toFixed(2)}</div>
            </div>
            <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requests..." />
            <p className="text-xs text-charcoal/50">A 10% deposit is required via PayPal to confirm your appointment.</p>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-10">
        {step > 0 ? (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>Back</Button>
        ) : <div />}
        {step < 2 ? (
          <Button onClick={handleNext}>Continue</Button>
        ) : (
          <Button onClick={handleSubmit} loading={submitting}>
            <Check className="w-4 h-4" /> Confirm & Pay Deposit
          </Button>
        )}
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BookingContent />
    </Suspense>
  );
}
