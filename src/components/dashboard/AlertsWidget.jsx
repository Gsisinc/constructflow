import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import { format, isPast, isBefore, addDays } from 'date-fns';

export default function AlertsWidget() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 20)
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues'],
    queryFn: () => base44.entities.Issue.list('-created_date', 10)
  });

  const alerts = [];

  // Check for overdue projects
  projects.forEach(p => {
    if (p.end_date && isPast(new Date(p.end_date)) && p.status !== 'completed') {
      alerts.push({
        type: 'overdue',
        severity: 'critical',
        message: `Project "${p.name}" is overdue`,
        date: p.end_date
      });
    }
  });

  // Check for upcoming deadlines
  projects.forEach(p => {
    if (p.end_date && isBefore(new Date(), new Date(p.end_date)) && isBefore(new Date(p.end_date), addDays(new Date(), 7))) {
      alerts.push({
        type: 'upcoming',
        severity: 'warning',
        message: `Project "${p.name}" due in ${Math.ceil((new Date(p.end_date) - new Date()) / (1000 * 60 * 60 * 24))} days`,
        date: p.end_date
      });
    }
  });

  // Check for open critical issues
  const criticalIssues = issues.filter(i => i.status === 'open' && i.severity === 'critical');
  criticalIssues.forEach(issue => {
    alerts.push({
      type: 'issue',
      severity: 'critical',
      message: `Critical issue in project: ${issue.title}`,
      date: issue.created_date
    });
  });

  // Budget alerts
  projects.forEach(p => {
    if (p.budget && p.spent) {
      const usage = (p.spent / p.budget) * 100;
      if (usage > 90) {
        alerts.push({
          type: 'budget',
          severity: 'critical',
          message: `Project "${p.name}" budget at ${usage.toFixed(0)}%`,
          date: p.updated_date
        });
      } else if (usage > 75) {
        alerts.push({
          type: 'budget',
          severity: 'warning',
          message: `Project "${p.name}" budget at ${usage.toFixed(0)}%`,
          date: p.updated_date
        });
      }
    }
  });

  const sorted = alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  }).slice(0, 5);

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Critical Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sorted.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">All clear! No alerts</div>
          ) : (
            sorted.map((alert, idx) => (
              <div key={idx} className="flex gap-2 text-sm p-2 rounded bg-slate-50">
                <div className="flex-shrink-0 mt-0.5">
                  {alert.severity === 'critical' ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 truncate">{alert.message}</p>
                  <p className="text-xs text-slate-500">{format(new Date(alert.date), 'MMM d, h:mm a')}</p>
                </div>
                <Badge variant="outline" className={alert.severity === 'critical' ? 'text-red-700 border-red-300' : 'text-amber-700 border-amber-300'}>
                  {alert.severity}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}