export default function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-10 h-10 border-3 border-rose-gold/30 border-t-rose-gold rounded-full animate-spin" />
      <p className="text-charcoal/60 text-sm">{message}</p>
    </div>
  );
}
