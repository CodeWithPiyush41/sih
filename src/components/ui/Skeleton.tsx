import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 w-full shadow-sm">
      <Skeleton className="h-10 w-10 rounded-full mb-4" />
      <Skeleton className="h-5 w-1/3 mb-2" />
      <Skeleton className="h-8 w-1/2 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-4 px-6 border-b border-slate-100 bg-white">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-3 w-[150px]" />
      </div>
      <Skeleton className="h-6 w-[100px] shrink-0 rounded-full" />
      <Skeleton className="h-8 w-[80px] shrink-0" />
    </div>
  );
}
