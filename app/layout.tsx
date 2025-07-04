import './globals.scss';
import { AuthProvider } from '@/context/auth-context';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en"
            className="dark"
      >
      <body className="bg-background text-foreground ">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
      </html>
  );
}