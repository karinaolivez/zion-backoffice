'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  content?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'underline' | 'figma';
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultTab,
  onTabChange,
  className,
  variant = 'figma'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id || '');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeTabIndex = items.findIndex(item => item.id === activeTab);
  const activeTabContent = items.find(item => item.id === activeTab)?.content;

  if (!mounted) {
    return <div className="w-full h-12 bg-[#09101D] rounded-lg animate-pulse" />;
  }

  if (variant === 'figma') {
    return (
      <div className={cn('w-full', className)}>
        {/* Tab Navigation - Figma Style */}
        <div className="relative bg-[#09101D] rounded-lg p-3 mb-6 overflow-x-auto">
          <div className="flex gap-8 min-w-max">
            {items.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-3 text-lg font-bold transition-colors duration-200',
                    'font-montserrat tracking-wide whitespace-nowrap',
                    isActive
                      ? 'text-[#00D0BB]'
                      : 'text-[#C4CDD5] hover:text-white'
                  )}
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 700,
                    fontSize: '16px',
                    lineHeight: '1.111',
                    letterSpacing: '0.56%'
                  }}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  {item.label}

                  {/* Active Tab Indicator */}
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-[#00D0BB] rounded-full"
                      style={{ height: '3px' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTabContent}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation */}
      <div className="relative">
        {/* Tab Buttons Container */}
        <div className="flex gap-8 relative">
          {items.map((item) => {
            const isActive = item.id === activeTab;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  'relative px-0 py-3 text-lg font-bold transition-all duration-200',
                  'font-montserrat tracking-wide',
                  isActive
                    ? 'text-[#00D0BB]' // Primary/500 from Figma
                    : 'text-[#C4CDD5] hover:text-white' // Grey/400 from Figma
                )}
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  lineHeight: '20px',
                  letterSpacing: '0.1px'
                }}
              >
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Tab Indicator */}
        {variant === 'underline' && activeTabIndex >= 0 && (
          <div
            className="absolute bottom-0 h-1 bg-[#00D0BB] rounded-full transition-all duration-300 ease-out"
            style={{
              left: `${activeTabIndex * (100 / items.length)}%`,
              width: `${100 / items.length}%`,
              transform: 'translateX(0%)',
              height: '3px'
            }}
          />
        )}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'transition-all duration-200',
              item.id === activeTab ? 'block' : 'hidden'
            )}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;