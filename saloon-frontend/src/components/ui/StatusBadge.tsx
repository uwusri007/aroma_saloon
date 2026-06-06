import clsx from 'clsx';

const statusStyles: Record<string, string> = {
  'Pending Payment': 'bg-amber-100 text-amber-800',
  Confirmed: 'bg-emerald-100 text-emerald-800',
  Completed: 'bg-blue-100 text-blue-800',
  Cancelled: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('badge', statusStyles[status] || 'bg-gray-100 text-gray-600')}>
      {status}
    </span>
  );
}
