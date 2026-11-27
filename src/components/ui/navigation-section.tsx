'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MenuItem, SubMenuItem } from '@/hooks/use-navigation-items';

interface NavigationSectionProps {
  title: string;
  items: MenuItem[];
  onNavigate: (path: string) => void;
  filterMenuItems: (items: MenuItem[]) => MenuItem[];
  filterSubMenuItems: (subItems: SubMenuItem[]) => SubMenuItem[];
  isFiltered?: boolean;
}

export const NavigationSection = ({
  title,
  items,
  onNavigate,
  filterMenuItems,
  filterSubMenuItems,
  isFiltered = false
}: NavigationSectionProps) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  return (
    <div className={`mb-6 transition-all duration-300 ${isFiltered ? 'animate-in fade-in-0 slide-in-from-left-2' : ''}`}>
      <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 px-3">
        {title}
      </div>
      <div className="space-y-1">
        {filterMenuItems(items).map((item) => (
          <div key={item.path} className={`transition-all duration-200 ${isFiltered ? 'animate-in fade-in-0 slide-in-from-left-1' : ''}`}>
            {/* Item principal */}
            <div
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${item.active
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                : 'hover:bg-white/10 text-gray-300 hover:text-white'
                }`}
              onClick={() => item.submenu ? toggleMenu(item.path) : onNavigate(item.path)}
            >
              <div className="flex items-center space-x-3">
                {item.icon && <item.icon className="w-5 h-5" />}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.submenu && (
                expandedMenus.includes(item.path) ?
                  <ChevronDown className="w-4 h-4" /> :
                  <ChevronRight className="w-4 h-4" />
              )}
            </div>

            {/* Submenu */}
            {item.submenu && expandedMenus.includes(item.path) && (
              <div className="ml-6 mt-2 space-y-1">
                {filterSubMenuItems(item.submenu).map((subItem) => (
                  <div
                    key={subItem.path}
                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${subItem.active
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                      : 'hover:bg-white/10 text-gray-300 hover:text-white'
                      } ${isFiltered ? 'animate-in fade-in-0 slide-in-from-left-1' : ''}`}
                    onClick={() => onNavigate(subItem.path)}
                  >
                    {subItem.icon && <subItem.icon className="w-4 h-4" />}
                    <span className="text-sm font-light">{subItem.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};