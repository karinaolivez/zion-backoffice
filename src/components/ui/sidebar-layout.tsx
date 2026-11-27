'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { SearchBar } from './search-bar';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Zion App Name';

interface SidebarLayoutProps {
  children: React.ReactNode;
  userProfile?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  onLogout: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export const SidebarLayout = ({ 
  children, 
  userProfile, 
  onLogout, 
  searchValue = '', 
  onSearchChange 
}: SidebarLayoutProps) => {
  return (
    <div className="w-64 h-svh glass bg-white/5 backdrop-blur-xl border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Image
              src="https://zionglobal.app/img/logo.svg"
              className="w-6 h-6 text-white"
              alt="Zion Logo"
              width={24}
              height={24}
            />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">{APP_NAME}</h1>
            <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
              v2.0
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {onSearchChange && (
        <div className="px-4 py-3 border-b border-white/10">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            className="w-full"
          />
        </div>
      )}

      {/* Navigation Content */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {children}
      </nav>

      {/* User Account */}
      <div className="p-4 border-t border-white/10">
        <div className="glass bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
          <div className="flex items-center space-x-3">
            <Image
              src={
                userProfile?.avatar || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || 'U')}&background=10b981&color=fff`
              }
              alt="Avatar"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userProfile?.name || 'Usuário'}
              </p>
              <p className="text-xs text-white/60 truncate">
                {userProfile?.email || 'user@example.com'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};