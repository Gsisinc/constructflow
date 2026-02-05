import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      {Icon && (
        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 text-center max-w-md mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-slate-900 hover:bg-slate-800">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}