import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  bidding: 'bg-purple-50 text-purple-700 border-purple-200',
  awarded: 'bg-blue-50 text-blue-700 border-blue-200',
  planning: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  on_hold: 'bg-slate-50 text-slate-700 border-slate-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const priorityColors = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-amber-100 text-amber-600',
  critical: 'bg-red-100 text-red-600',
};

export default function ProjectCard({ project }) {
  const budgetUsed = project.budget ? ((project.spent || 0) / project.budget * 100).toFixed(0) : 0;

  return (
    <Link
      to={createPageUrl(`ProjectDetail?id=${project.id}`)}
      className="block bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group"
    >
      {/* Image */}
      <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-slate-300">
              {project.name?.[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={cn("border", statusColors[project.status])}>
            {project.status?.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-lg group-hover:text-slate-700 transition-colors">
            {project.name}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">{project.client_name}</p>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          {project.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate max-w-[120px]">{project.address}</span>
            </div>
          )}
          {project.end_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(project.end_date), 'MMM d')}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Progress</span>
            <span className="font-medium text-slate-900">{project.progress || 0}%</span>
          </div>
          <Progress value={project.progress || 0} className="h-1.5" />
        </div>

        {/* Budget */}
        {project.budget && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Budget</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                ${(project.spent || 0).toLocaleString()} / ${project.budget.toLocaleString()}
              </p>
              <p className={cn(
                "text-xs",
                budgetUsed > 90 ? "text-red-500" : budgetUsed > 75 ? "text-amber-500" : "text-slate-400"
              )}>
                {budgetUsed}% used
              </p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}