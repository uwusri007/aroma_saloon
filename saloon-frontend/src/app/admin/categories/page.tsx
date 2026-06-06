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
import type { Category } from '@/types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '', sort_order: '0', is_active: true });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    treatmentApi.getCategories().then((res) => setCategories(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, sort_order: parseInt(form.sort_order) };
    try {
      if (editing) {
        await treatmentApi.updateCategory(editing.id, data);
        toast.success('Category updated');
      } else {
        await treatmentApi.createCategory(data);
        toast.success('Category created');
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
    if (!confirm('Delete this category?')) return;
    try {
      await treatmentApi.deleteCategory(id);
      toast.success('Category deleted');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold">Categories</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: '', description: '', sort_order: '0', is_active: true }); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className="font-display text-xl mb-4">{editing ? 'Edit' : 'New'} Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            <div className="md:col-span-2"><Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
                <th className="p-4">Description</th>
                <th className="p-4">Order</th>
                <th className="p-4">Active</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-blush/30">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4 text-charcoal/60">{c.description}</td>
                  <td className="p-4">{c.sort_order}</td>
                  <td className="p-4">{c.is_active ? 'Yes' : 'No'}</td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => { setEditing(c); setForm({ name: c.name, description: c.description || '', sort_order: c.sort_order.toString(), is_active: c.is_active }); setShowForm(true); }} className="p-1 hover:text-rose-gold"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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
