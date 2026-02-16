import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Skeleton Loading Components
 * Provides beautiful loading states for better perceived performance
 */

// ========================================
// Dashboard Skeletons
// ========================================

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <KPICardSkeleton key={i} delay={i * 0.1} />
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <QuickActionSkeleton key={i} delay={i * 0.05} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-8 w-20" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <ProjectCardSkeleton key={i} delay={i * 0.1} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <ActivityItemSkeleton key={i} delay={i * 0.08} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function KPICardSkeleton({ delay = 0 }) {
  return (
    <Card 
      className="border-0 shadow-md overflow-hidden"
      style={{ animationDelay: `${delay}s` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickActionSkeleton({ delay = 0 }) {
  return (
    <div 
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50"
      style={{ animationDelay: `${delay}s` }}
    >
      <Skeleton className="h-12 w-12 rounded-lg" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

// ========================================
// Project Skeletons
// ========================================

export function ProjectCardSkeleton({ delay = 0 }) {
  return (
    <Card 
      className="border-0 shadow-md"
      style={{ animationDelay: `${delay}s` }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full" />
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <ProjectListItemSkeleton key={i} delay={i * 0.05} />
      ))}
    </div>
  );
}

export function ProjectListItemSkeleton({ delay = 0 }) {
  return (
    <Card 
      className="border-0 shadow-sm"
      style={{ animationDelay: `${delay}s` }}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========================================
// Activity & Feed Skeletons
// ========================================

export function ActivityItemSkeleton({ delay = 0 }) {
  return (
    <div 
      className="flex items-start gap-4 p-4 rounded-lg"
      style={{ animationDelay: `${delay}s` }}
    >
      <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function ActivityFeedSkeleton({ count = 5 }) {
  return (
    <div className="space-y-1">
      {[...Array(count)].map((_, i) => (
        <ActivityItemSkeleton key={i} delay={i * 0.05} />
      ))}
    </div>
  );
}

// ========================================
// Bid Skeletons
// ========================================

export function BidListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4">
      {/* Filter Bar Skeleton */}
      <div className="flex flex-wrap items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <div className="flex-1" />
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Bid Cards Skeleton */}
      <div className="space-y-3">
        {[...Array(count)].map((_, i) => (
          <BidCardSkeleton key={i} delay={i * 0.08} />
        ))}
      </div>
    </div>
  );
}

export function BidCardSkeleton({ delay = 0 }) {
  return (
    <Card 
      className="border-0 shadow-md"
      style={{ animationDelay: `${delay}s` }}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========================================
// Table Skeletons
// ========================================

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-5 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex items-center gap-4 py-3"
          style={{ animationDelay: `${rowIndex * 0.05}s` }}
        >
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ========================================
// Form Skeletons
// ========================================

export function FormSkeleton({ fields = 4 }) {
  return (
    <div className="space-y-6">
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2" style={{ animationDelay: `${i * 0.05}s` }}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

// ========================================
// Card Grid Skeletons
// ========================================

export function CardGridSkeleton({ count = 6, columns = 3 }) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {[...Array(count)].map((_, i) => (
        <GenericCardSkeleton key={i} delay={i * 0.05} />
      ))}
    </div>
  );
}

export function GenericCardSkeleton({ delay = 0 }) {
  return (
    <Card 
      className="border-0 shadow-md"
      style={{ animationDelay: `${delay}s` }}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

// ========================================
// AI Agent Skeletons
// ========================================

export function AIAgentCardSkeleton({ delay = 0 }) {
  return (
    <Card 
      className="border-0 shadow-md overflow-hidden"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="h-2 bg-gradient-to-r from-purple-500 to-blue-500 animate-shimmer" />
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex flex-wrap gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-20" />
          ))}
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export function AIAgentGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <AIAgentCardSkeleton key={i} delay={i * 0.08} />
      ))}
    </div>
  );
}

// ========================================
// Stats & Metrics Skeletons
// ========================================

export function StatsRowSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <StatCardSkeleton key={i} delay={i * 0.05} />
      ))}
    </div>
  );
}

export function StatCardSkeleton({ delay = 0 }) {
  return (
    <Card 
      className="border-0 shadow-md"
      style={{ animationDelay: `${delay}s` }}
    >
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

// ========================================
// Page Layout Skeletons
// ========================================

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 space-y-6">
      {/* Logo */}
      <Skeleton className="h-10 w-40" />

      {/* Nav Items */}
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* User */}
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FullPageSkeleton() {
  return (
    <div className="flex h-screen">
      <SidebarSkeleton />
      <div className="flex-1 p-6 space-y-6 overflow-auto bg-slate-50 dark:bg-slate-900">
        <PageHeaderSkeleton />
        <StatsRowSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-md h-96">
              <CardContent className="p-6">
                <Skeleton className="h-full w-full" />
              </CardContent>
            </Card>
          </div>
          <Card className="border-0 shadow-md h-96">
            <CardContent className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <ActivityItemSkeleton key={i} delay={i * 0.05} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Specialized Skeletons
// ========================================

export function ChartSkeleton({ height = 300 }) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

export function ChatSkeleton({ messageCount = 4 }) {
  return (
    <div className="space-y-4">
      {[...Array(messageCount)].map((_, i) => (
        <div 
          key={i} 
          className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className={`max-w-[70%] ${i % 2 === 0 ? 'bg-slate-100' : 'bg-blue-100'} rounded-2xl p-4`}>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocumentSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="pt-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TimelineSkeleton({ itemCount = 5 }) {
  return (
    <div className="space-y-0">
      {[...Array(itemCount)].map((_, i) => (
        <div key={i} className="flex gap-4 pb-8 relative" style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="flex flex-col items-center">
            <Skeleton className="h-8 w-8 rounded-full" />
            {i < itemCount - 1 && (
              <Skeleton className="w-0.5 flex-1 mt-2" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ========================================
// Shimmer Effect Wrapper
// ========================================

export function Shimmer({ children, className = '' }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

// ========================================
// Export All
// ========================================

export default {
  DashboardSkeleton,
  KPICardSkeleton,
  QuickActionSkeleton,
  ProjectCardSkeleton,
  ProjectListSkeleton,
  ProjectListItemSkeleton,
  ActivityItemSkeleton,
  ActivityFeedSkeleton,
  BidListSkeleton,
  BidCardSkeleton,
  TableSkeleton,
  FormSkeleton,
  CardGridSkeleton,
  GenericCardSkeleton,
  AIAgentCardSkeleton,
  AIAgentGridSkeleton,
  StatsRowSkeleton,
  StatCardSkeleton,
  PageHeaderSkeleton,
  SidebarSkeleton,
  FullPageSkeleton,
  ChartSkeleton,
  ChatSkeleton,
  DocumentSkeleton,
  TimelineSkeleton,
  Shimmer,
};
