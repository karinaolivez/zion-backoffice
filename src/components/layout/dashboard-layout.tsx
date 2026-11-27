'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Sidebar } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPath?: string;
}

export const DashboardLayout = ({ children, currentPath }: DashboardLayoutProps) => {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, mounted, router, locale]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-svh bg-[#09101C] flex" suppressHydrationWarning>
      <Sidebar currentPath={currentPath} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-10 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};