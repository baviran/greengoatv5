import './globals.scss';
import { AuthProvider } from '@/context/auth-context';
import { RootErrorBoundary } from '@/app/components/error-boundary/RootErrorBoundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en"
            className="dark"
      >
      <body className="bg-background text-foreground ">
        <RootErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </RootErrorBoundary>
      </body>
      </html>
  );
}