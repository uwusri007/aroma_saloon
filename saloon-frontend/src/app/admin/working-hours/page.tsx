'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { adminApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';
import type { WorkingHour } from '@/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminWorkingHoursPage() {
  const [hours, setHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getWorkingHours().then((res) => {
      const data = res.data.data;
      if (data.length === 0) {
        setHours(DAYS.map((_, i) => ({ id: 0, day_of_week: i, open_time: '09:00:00', close_time: '19:00:00', is_closed: i === 0 })));
      } else {
        setHours(data);
      }
    }).finally(() => setLoading(false));
  }, []);

  const updateHour = (index: number, field: string, value: string | boolean) => {
    setHours((prev) => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateWorkingHours(hours);
      toast.success('Working hours updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold">Working Hours</h1>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>
      <div className="card divide-y divide-blush/50">
        {hours.sort((a, b) => a.day_of_week - b.day_of_week).map((h, i) => (
          <div key={h.day_of_week} className="p-4 flex flex-wrap items-center gap-4">
            <span className="w-28 font-medium">{DAYS[h.day_of_week]}</span>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={h.is_closed} onChange={(e) => updateHour(i, 'is_closed', e.target.checked)} />
              Closed
            </label>
            {!h.is_closed && (
              <>
                <input type="time" className="input-field w-auto" value={h.open_time.substring(0, 5)} onChange={(e) => updateHour(i, 'open_time', e.target.value + ':00')} />
                <span>to</span>
                <input type="time" className="input-field w-auto" value={h.close_time.substring(0, 5)} onChange={(e) => updateHour(i, 'close_time', e.target.value + ':00')} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
