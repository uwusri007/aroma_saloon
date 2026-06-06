'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { adminApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then((res) => setSettings(res.data.data)).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      toast.success('Settings saved');
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
        <h1 className="font-display text-3xl font-semibold">Salon Settings</h1>
        <Button onClick={handleSave} loading={saving}>Save Settings</Button>
      </div>
      <div className="card p-6 max-w-lg space-y-4">
        {Object.entries(settings).map(([key, value]) => (
          <Input
            key={key}
            label={key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            value={value}
            onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
          />
        ))}
      </div>
    </div>
  );
}
