'use client';

import { Card, CardContent } from '@/components/ui/card';

interface CampusSkeletonProps {
  count?: number;
}

export const CampusSkeleton = ({ count = 5 }: CampusSkeletonProps) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="glass bg-white/5 backdrop-blur-xl border border-white/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {/* Avatar skeleton */}
                  <div className="w-10 h-10 bg-white/10 rounded-lg animate-pulse" />
                  <div>
                    {/* Title skeleton */}
                    <div className="h-5 bg-white/10 rounded animate-pulse w-32 mb-2" />
                    {/* Subtitle skeleton */}
                    <div className="h-4 bg-white/10 rounded animate-pulse w-20" />
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  {/* Group info skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 bg-white/10 rounded animate-pulse w-24" />
                  </div>
                  {/* Date info skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 bg-white/10 rounded animate-pulse w-28" />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {/* Badge skeleton */}
                <div className="h-6 bg-white/10 rounded-full animate-pulse w-16" />
                {/* Button skeleton */}
                <div className="h-8 bg-white/10 rounded animate-pulse w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};