import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#2D2A32',
            color: '#FDF8F5',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#B76E79', secondary: '#FDF8F5' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#FDF8F5' } },
        }}
      />
    </>
  );
}
