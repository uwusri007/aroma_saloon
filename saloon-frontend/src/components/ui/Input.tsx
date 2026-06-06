import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-charcoal/80">
          {label}
        </label>
      )}
      <input id={inputId} className={clsx('input-field', error && 'border-red-400', className)} {...props} />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
