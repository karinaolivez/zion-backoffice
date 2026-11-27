'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { LanguageSelector } from '@/components/ui/language-selector';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  showLanguageSelector?: boolean;
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
}

export const PageHeader = ({ 
  title, 
  description, 
  actions, 
  showLanguageSelector = true,
  breadcrumbs
}: PageHeaderProps) => {
  return (
    <header className="pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-white/60">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {actions}
          {showLanguageSelector && <LanguageSelector />}
        </div>
        {breadcrumbs && (
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb) => (
              <React.Fragment key={crumb.href || crumb.label}>
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
                {breadcrumbs.indexOf(crumb) < breadcrumbs.length - 1 && (
                  <ChevronRight className="h-4 w-4" />
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};