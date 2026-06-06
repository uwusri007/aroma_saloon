'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { adminApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';
import type { Holiday } from '@/types';

export default function AdminHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    adminApi.getHolidays().then((res) => setHolidays(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.date) { toast.error('Date is required'); return; }
    setSaving(true);
    try {
      await adminApi.createHoliday(form);
      toast.success('Holiday added');
      setForm({ date: '', reason: '' });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteHoliday(id);
      toast.success('Holiday removed');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-8">Holidays</h1>
      <div className="card p-6 mb-8">
        <h2 className="font-display text-lg mb-4">Add Holiday</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <Button onClick={handleAdd} loading={saving}><Plus className="w-4 h-4" /> Add</Button>
        </div>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="card divide-y divide-blush/50">
          {holidays.length === 0 ? (
            <p className="p-6 text-charcoal/60 text-sm">No holidays configured.</p>
          ) : holidays.map((h) => (
            <div key={h.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{h.date}</p>
                {h.reason && <p className="text-sm text-charcoal/60">{h.reason}</p>}
              </div>
              <button onClick={() => handleDelete(h.id)} className="p-2 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
