import React from 'react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import {
  FolderPlus,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  FileText,
  Users
} from 'lucide-react';

const iconMap = {
  project: FolderPlus,
  task: CheckCircle2,
  issue: AlertTriangle,
  expense: DollarSign,
  document: FileText,
  worker: Users,
};

const colorMap = {
  project: 'bg-blue-100 text-blue-600',
  task: 'bg-emerald-100 text-emerald-600',
  issue: 'bg-amber-100 text-amber-600',
  expense: 'bg-purple-100 text-purple-600',
  document: 'bg-slate-100 text-slate-600',
  worker: 'bg-cyan-100 text-cyan-600',
};

export default function ActivityFeed({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = iconMap[activity.type] || FolderPlus;
        return (
          <div key={index} className="flex gap-3">
            <div className={cn("p-2 rounded-lg h-fit", colorMap[activity.type] || colorMap.project)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900">{activity.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>
              <p className="text-xs text-slate-400 mt-1">
                {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}