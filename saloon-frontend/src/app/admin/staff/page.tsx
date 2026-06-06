'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { adminApi, treatmentApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';
import type { Staff, Treatment } from '@/types';

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', bio: '', treatment_ids: [] as number[], is_active: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [sRes, tRes] = await Promise.all([adminApi.getStaff(), treatmentApi.getTreatments()]);
    setStaff(sRes.data.data);
    setTreatments(tRes.data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await adminApi.updateStaff(editing.id, form);
        toast.success('Staff updated');
      } else {
        await adminApi.createStaff(form);
        toast.success('Staff created');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this staff member?')) return;
    try {
      await adminApi.deleteStaff(id);
      toast.success('Staff deleted');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const toggleTreatment = (id: number) => {
    setForm((f) => ({
      ...f,
      treatment_ids: f.treatment_ids.includes(id) ? f.treatment_ids.filter((t) => t !== id) : [...f.treatment_ids, id],
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold">Staff</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '', bio: '', treatment_ids: [], is_active: true }); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className="font-display text-xl mb-4">{editing ? 'Edit' : 'New'} Staff Member</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="md:col-span-2"><Textarea label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Assigned Treatments</label>
              <div className="flex flex-wrap gap-2">
                {treatments.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTreatment(t.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.treatment_ids.includes(t.id) ? 'bg-rose-gold text-white' : 'bg-blush/50'}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} loading={saving}>Save</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {staff.map((s) => (
            <div key={s.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">{s.name}</h3>
                  <p className="text-sm text-charcoal/60">{s.email}</p>
                  <p className="text-sm text-charcoal/60">{s.phone}</p>
                  {s.bio && <p className="text-sm mt-2">{s.bio}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => {
                    const res = await adminApi.getStaffMember(s.id);
                    const member = res.data.data;
                    setEditing(member);
                    setForm({ name: member.name, email: member.email || '', phone: member.phone || '', bio: member.bio || '', treatment_ids: member.treatments?.map((t) => t.id) || [], is_active: member.is_active });
                    setShowForm(true);
                  }} className="p-1 hover:text-rose-gold"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
