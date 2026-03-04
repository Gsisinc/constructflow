import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, X, Settings } from 'lucide-react';
import { format, isPast, isBefore, addDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function AlertsWidget() {
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: () => base44.entities.Project.filter({ organization_id: user.organization_id }, '-created_date', 20),
    enabled: !!user?.organization_id
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues', user?.organization_id],
    queryFn: () => base44.entities.Issue.filter({ organization_id: user.organization_id }, '-created_date', 10),
    enabled: !!user?.organization_id
  });

  const { data: thresholds = [] } = useQuery({
    queryKey: ['thresholds', user?.organization_id],
    queryFn: () => base44.entities.AlertThreshold.filter({ 
      organization_id: user.organization_id,
      enabled: true
    }),
    enabled: !!user?.organization_id
  });

  const { data: dismissedAlerts = [] } = useQuery({
    queryKey: ['dismissedAlerts', user?.organization_id],
    queryFn: () => base44.entities.Alert.filter({ 
      organization_id: user.organization_id,
      dismissed: true
    }),
    enabled: !!user?.organization_id
  });

  const dismissAlertMutation = useMutation({
    mutationFn: async (alert) => {
      // Create dismissed alert record
      await base44.entities.Alert.create({
        organization_id: user.organization_id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        project_id: alert.project_id,
        reference_id: alert.reference_id,
        dismissed: true,
        dismissed_by: user.email,
        dismissed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dismissedAlerts'] });
      toast.success('Alert dismissed');
    }
  });

  const alerts = [];

  // Get budget threshold (default 90% critical, 75% warning)
  const budgetThreshold = thresholds.find(t => t.type === 'budget');
  const budgetCritical = budgetThreshold?.threshold_value || 90;
  const budgetWarning = budgetCritical - 15;

  // Check for overdue projects
  projects.forEach(p => {
    const alertKey = `overdue-${p.id}`;
    const isDismissed = dismissedAlerts.some(da => 
      da.reference_id === p.id && da.type === 'overdue' && da.dismissed
    );
    
    if (!isDismissed && p.end_date && isPast(new Date(p.end_date)) && p.status !== 'completed') {
      alerts.push({
        id: alertKey,
        type: 'overdue',
        severity: 'critical',
        title: 'Overdue Project',
        message: `Project "${p.name}" is overdue`,
        date: p.end_date,
        project_id: p.id,
        reference_id: p.id
      });
    }
  });

  // Check for upcoming deadlines (default 7 days)
  const deadlineThreshold = thresholds.find(t => t.type === 'deadline');
  const deadlineDays = deadlineThreshold?.threshold_value || 7;
  
  projects.forEach(p => {
    const alertKey = `upcoming-${p.id}`;
    const isDismissed = dismissedAlerts.some(da => 
      da.reference_id === p.id && da.type === 'upcoming' && da.dismissed
    );
    
    if (!isDismissed && p.end_date && isBefore(new Date(), new Date(p.end_date)) && isBefore(new Date(p.end_date), addDays(new Date(), deadlineDays))) {
      const daysRemaining = Math.ceil((new Date(p.end_date) - new Date()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: alertKey,
        type: 'upcoming',
        severity: daysRemaining <= 3 ? 'critical' : 'warning',
        title: 'Upcoming Deadline',
        message: `Project "${p.name}" due in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
        date: p.end_date,
        project_id: p.id,
        reference_id: p.id
      });
    }
  });

  // Check for open critical issues
  const criticalIssues = issues.filter(i => i.status === 'open' && i.severity === 'critical');
  criticalIssues.forEach(issue => {
    const alertKey = `issue-${issue.id}`;
    const isDismissed = dismissedAlerts.some(da => 
      da.reference_id === issue.id && da.type === 'issue' && da.dismissed
    );
    
    if (!isDismissed) {
      alerts.push({
        id: alertKey,
        type: 'issue',
        severity: 'critical',
        title: 'Critical Issue',
        message: `${issue.title}`,
        date: issue.created_date,
        project_id: issue.project_id,
        reference_id: issue.id
      });
    }
  });

  // Budget alerts with thresholds
  projects.forEach(p => {
    const alertKey = `budget-${p.id}`;
    const isDismissed = dismissedAlerts.some(da => 
      da.reference_id === p.id && da.type === 'budget' && da.dismissed
    );
    
    if (!isDismissed && p.budget && p.spent) {
      const usage = (p.spent / p.budget) * 100;
      if (usage > budgetCritical) {
        alerts.push({
          id: alertKey,
          type: 'budget',
          severity: 'critical',
          title: 'Budget Alert',
          message: `Project "${p.name}" budget at ${usage.toFixed(0)}%`,
          date: p.updated_date,
          project_id: p.id,
          reference_id: p.id
        });
      } else if (usage > budgetWarning) {
        alerts.push({
          id: alertKey,
          type: 'budget',
          severity: 'warning',
          title: 'Budget Warning',
          message: `Project "${p.name}" budget at ${usage.toFixed(0)}%`,
          date: p.updated_date,
          project_id: p.id,
          reference_id: p.id
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Critical Alerts
        </CardTitle>
        <Link to={createPageUrl('AlertSettings')}>
          <Button size="sm" variant="ghost">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sorted.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">All clear! No alerts</div>
          ) : (
            sorted.map((alert, idx) => (
              <div key={idx} className="flex gap-2 text-sm p-2 rounded bg-slate-50 group">
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
                <div className="flex items-start gap-1">
                  <Badge variant="outline" className={alert.severity === 'critical' ? 'text-red-700 border-red-300' : 'text-amber-700 border-amber-300'}>
                    {alert.severity}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => dismissAlertMutation.mutate(alert)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}