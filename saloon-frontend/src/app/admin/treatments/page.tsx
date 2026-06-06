'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { treatmentApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';
import type { Treatment, Category } from '@/types';

export default function AdminTreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Treatment | null>(null);
  const [form, setForm] = useState({ category_id: '', name: '', description: '', duration_minutes: '', price: '', is_active: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [tRes, cRes] = await Promise.all([
      treatmentApi.getTreatments({ active: 'false' }),
      treatmentApi.getCategories(),
    ]);
    setTreatments(tRes.data.data);
    setCategories(cRes.data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ category_id: categories[0]?.id?.toString() || '', name: '', description: '', duration_minutes: '', price: '', is_active: true });
    setShowForm(true);
  };

  const openEdit = (t: Treatment) => {
    setEditing(t);
    setForm({ category_id: t.category_id.toString(), name: t.name, description: t.description || '', duration_minutes: t.duration_minutes.toString(), price: t.price.toString(), is_active: t.is_active });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, category_id: parseInt(form.category_id), duration_minutes: parseInt(form.duration_minutes), price: parseFloat(form.price) };
    try {
      if (editing) {
        await treatmentApi.updateTreatment(editing.id, data);
        toast.success('Treatment updated');
      } else {
        await treatmentApi.createTreatment(data);
        toast.success('Treatment created');
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
    if (!confirm('Delete this treatment?')) return;
    try {
      await treatmentApi.deleteTreatment(id);
      toast.success('Treatment deleted');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold">Treatments</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Treatment</Button>
      </div>

      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className="font-display text-xl mb-4">{editing ? 'Edit' : 'New'} Treatment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select className="input-field" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Duration (minutes)" type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
            <Input label="Price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <div className="md:col-span-2">
              <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active
            </label>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} loading={saving}>Save</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blush/50 text-left text-charcoal/60">
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Price</th>
                <th className="p-4">Active</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {treatments.map((t) => (
                <tr key={t.id} className="border-b border-blush/30">
                  <td className="p-4 font-medium">{t.name}</td>
                  <td className="p-4">{t.category_name}</td>
                  <td className="p-4">{t.duration_minutes} min</td>
                  <td className="p-4">${Number(t.price).toFixed(2)}</td>
                  <td className="p-4">{t.is_active ? 'Yes' : 'No'}</td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => openEdit(t)} className="p-1 hover:text-rose-gold"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-1 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
