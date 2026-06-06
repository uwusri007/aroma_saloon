'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { Calendar, Bell, Sparkles, CreditCard } from 'lucide-react';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import TreatmentCard from '@/components/treatments/TreatmentCard';
import { useAuth } from '@/context/AuthContext';
import { appointmentApi, notificationApi, authApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';
import type { Appointment, Notification, Treatment } from '@/types';
import Input from '@/components/ui/Input';

export default function DashboardPage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'appointments' | 'profile' | 'notifications'>('appointments');
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [suggestions, setSuggestions] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ first_name: '', last_name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user?.role === 'Admin') router.push('/admin');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setProfile({ first_name: user.first_name, last_name: user.last_name, phone: user.phone || '' });
    Promise.all([
      appointmentApi.getMy({ upcoming: 'true' }),
      appointmentApi.getMy({ upcoming: 'false' }),
      notificationApi.getAll(),
      appointmentApi.getSuggestions(),
    ]).then(([upRes, pastRes, notRes, sugRes]) => {
      setUpcoming(upRes.data.data);
      setPast(pastRes.data.data);
      setNotifications(notRes.data.data);
      setSuggestions(sugRes.data.data);
    }).finally(() => setLoading(false));
  }, [user]);

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentApi.cancel(id);
      toast.success('Appointment cancelled');
      const upRes = await appointmentApi.getMy({ upcoming: 'true' });
      setUpcoming(upRes.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await authApi.updateProfile(profile);
      updateUser(res.data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="section-title">Hello, {user?.first_name}!</h1>
        <p className="text-charcoal/60">Manage your appointments and profile</p>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {[
          { key: 'appointments' as const, label: 'Appointments', icon: Calendar },
          { key: 'profile' as const, label: 'Profile', icon: Sparkles },
          { key: 'notifications' as const, label: 'Notifications', icon: Bell },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${tab === t.key ? 'bg-rose-gold text-white' : 'bg-blush/50 hover:bg-blush'}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'appointments' && (
        <div className="space-y-10">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Upcoming Appointments</h2>
              <Link href="/book"><Button size="sm">Book New</Button></Link>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState title="No upcoming appointments" action={<Link href="/book"><Button>Book Now</Button></Link>} />
            ) : (
              <div className="space-y-4">
                {upcoming.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} onCancel={handleCancel} />
                ))}
              </div>
            )}
          </section>

          {suggestions.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold mb-4">Recommended For You</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((s) => <TreatmentCard key={s.id} treatment={s} />)}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display text-xl font-semibold mb-4">Past Appointments</h2>
            {past.length === 0 ? (
              <p className="text-charcoal/60 text-sm">No past appointments yet.</p>
            ) : (
              <div className="space-y-4">
                {past.map((apt) => <AppointmentCard key={apt.id} appointment={apt} />)}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'profile' && (
        <div className="card p-6 max-w-md">
          <h2 className="font-display text-xl font-semibold mb-6">Edit Profile</h2>
          <div className="space-y-4">
            <Input label="First Name" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
            <Input label="Last Name" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
            <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            <Input label="Email" value={user?.email || ''} disabled />
            <Button onClick={handleSaveProfile} loading={saving}>Save Changes</Button>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <EmptyState title="No notifications" />
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`card p-4 ${!n.is_read ? 'border-l-4 border-l-rose-gold' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-charcoal/60 text-sm mt-1">{n.message}</p>
                    <p className="text-xs text-charcoal/40 mt-2">{format(parseISO(n.sent_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  <span className="badge bg-blush text-charcoal text-xs">{n.type}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appointment, onCancel }: { appointment: Appointment; onCancel?: (id: number) => void }) {
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={appointment.status} />
            {appointment.staff_name && <span className="text-sm text-charcoal/60">with {appointment.staff_name}</span>}
          </div>
          <p className="font-medium">{appointment.appointment_date} at {appointment.start_time?.substring(0, 5)}</p>
          <p className="text-sm text-charcoal/60 mt-1">
            {appointment.treatments?.map((t) => t.name).join(', ')}
          </p>
          <p className="text-sm font-medium text-rose-gold mt-2">${Number(appointment.total_price).toFixed(2)}</p>
        </div>
        <div className="flex gap-2">
          {appointment.status === 'Pending Payment' && (
            <Link href={`/payment/${appointment.id}`}>
              <Button size="sm"><CreditCard className="w-3 h-3" /> Pay Deposit</Button>
            </Link>
          )}
          {onCancel && ['Pending Payment', 'Confirmed'].includes(appointment.status) && (
            <Button size="sm" variant="ghost" onClick={() => onCancel(appointment.id)}>Cancel</Button>
          )}
        </div>
      </div>
    </div>
  );
}
