import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-blush/50 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-rose-gold/60" />
      </div>
      <h3 className="text-lg font-medium text-charcoal mb-2">{title}</h3>
      {description && <p className="text-charcoal/60 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}
