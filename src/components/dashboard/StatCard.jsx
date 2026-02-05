import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, color = 'slate' }) {
  const colorMap = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-semibold text-slate-900 tracking-tight">{value}</p>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2">
              {trend && (
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {trendUp ? '+' : ''}{trend}
                </span>
              )}
              {subtitle && <span className="text-sm text-slate-500">{subtitle}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-xl", colorMap[color])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}