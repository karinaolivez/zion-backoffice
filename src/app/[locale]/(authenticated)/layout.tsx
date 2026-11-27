"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  console.log('🏠 AuthenticatedLayout: Estado atual:', { 
    user: user?.email, 
    isLoading, 
    isAuthenticated 
  });

  useEffect(() => {
    console.log('🔄 AuthenticatedLayout: useEffect executado');
    
    if (!isLoading && !isAuthenticated) {
      console.log('🚪 AuthenticatedLayout: Redirecionando para login');
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading spinner while context is loading
  if (isLoading) {
    console.log('⏳ AuthenticatedLayout: Mostrando loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect will happen)
  if (!isAuthenticated) {
    console.log('❌ AuthenticatedLayout: Não autenticado, aguardando redirecionamento');
    return null;
  }

  console.log('✅ AuthenticatedLayout: Renderizando dashboard');
  return <DashboardLayout>{children}</DashboardLayout>;
}