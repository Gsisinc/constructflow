import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Activity, LifeBuoy, ShieldAlert, Wrench } from 'lucide-react';
import { createAuditLog } from '@/lib/auditLog';
import { buildBackupDrillRows, buildReleaseQuality, buildSlaSummary, defaultPhase6Runbooks } from '@/lib/phase6';

export default function Phase6ReliabilityOps() {
  const [autoEscalationEnabled, setAutoEscalationEnabled] = useState(true);
  const runbooks = defaultPhase6Runbooks();

  const { data: user } = useQuery({ queryKey: ['currentUser', 'phase6'], queryFn: () => base44.auth.me() });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents', 'phase6'],
    queryFn: async () => {
      try {
        return await base44.entities.IncidentLog.list('-created_date');
      } catch (error) {
        console.warn('IncidentLog unavailable, using fallback from issues.', error);
        try {
          return await base44.entities.Issue.list('-created_date');
        } catch {
          return [];
        }
      }
    }
  });

  const { data: supportTickets = [] } = useQuery({
    queryKey: ['supportTickets', 'phase6'],
    queryFn: async () => {
      try {
        return await base44.entities.SupportTicket.list('-created_date');
      } catch (error) {
        console.warn('SupportTicket unavailable, using join requests as fallback.', error);
        try {
          return await base44.entities.JoinRequest.list('-created_date');
        } catch {
          return [];
        }
      }
    }
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['releases', 'phase6'],
    queryFn: async () => {
      try {
        return await base44.entities.ReleaseLog.list('-created_date');
      } catch {
        return [];
      }
    }
  });

  const { data: deployments = [] } = useQuery({
    queryKey: ['deployments', 'phase6'],
    queryFn: async () => {
      try {
        return await base44.entities.DeploymentLog.list('-created_date');
      } catch {
        return [];
      }
    }
  });

  const { data: backupDrills = [] } = useQuery({
    queryKey: ['backupDrills', 'phase6'],
    queryFn: async () => {
      try {
        return await base44.entities.BackupDrill.list('-created_date');
      } catch {
        return [];
      }
    }
  });

  const sla = useMemo(() => buildSlaSummary({ incidents, tickets: supportTickets }), [incidents, supportTickets]);
  const releaseQuality = useMemo(() => buildReleaseQuality({ releases, deployments }), [releases, deployments]);
  const drillRows = useMemo(() => buildBackupDrillRows({ drills: backupDrills }), [backupDrills]);

  const saveOpsPolicy = useMutation({
    mutationFn: async () => {
      try {
        const orgRows = await base44.entities.Organization.filter({ id: user.organization_id });
        const org = orgRows?.[0];
        if (org?.id) {
          await base44.entities.Organization.update(org.id, {
            reliability_policy: {
              auto_escalation_enabled: autoEscalationEnabled,
              runbook_count: runbooks.length
            }
          });
        }
      } catch (error) {
        console.warn('Organization reliability policy update failed.', error);
      }

      await createAuditLog({
        organizationId: user?.organization_id,
        userId: user?.id,
        action: 'phase6_reliability_policy_updated',
        entityType: 'Organization',
        entityId: user?.organization_id,
        after: { auto_escalation_enabled: autoEscalationEnabled }
      });
    },
    onSuccess: () => toast.success('Reliability policy saved.'),
    onError: () => toast.error('Failed to save reliability policy.')
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Reliability & Customer Operations</h1>
        <p className="text-sm text-slate-600 mt-1">Operational excellence for uptime, support SLA, release quality, and disaster-recovery readiness.</p>
      </div>

      <div className="grid md:grid-cols-5 gap-3">
        <Metric title="Open incidents" value={sla.open_incidents} icon={ShieldAlert} />
        <Metric title="Critical open" value={sla.critical_open_incidents} icon={ShieldAlert} />
        <Metric title="SLA breaches" value={sla.sla_breach_count} icon={LifeBuoy} />
        <Metric title="Deploy success" value={`${releaseQuality.deployment_success_rate}%`} icon={Activity} />
        <Metric title="Change failure" value={`${releaseQuality.change_failure_rate}%`} icon={Wrench} />
      </div>

      <Tabs defaultValue="reliability" className="space-y-4">
        <TabsList className="grid md:grid-cols-3 w-full">
          <TabsTrigger value="reliability">Reliability</TabsTrigger>
          <TabsTrigger value="release">Release Quality</TabsTrigger>
          <TabsTrigger value="support">Support & DR</TabsTrigger>
        </TabsList>

        <TabsContent value="reliability">
          <Card>
            <CardHeader>
              <CardTitle>Incident + SLA Reliability Console</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Auto escalation policy</Label>
                  <div className="border rounded-md p-3 mt-1 flex items-center justify-between">
                    <span className="text-sm text-slate-700">Escalate unresolved critical incidents automatically</span>
                    <Switch checked={autoEscalationEnabled} onCheckedChange={setAutoEscalationEnabled} />
                  </div>
                </div>
                <div>
                  <Label>Current SLA breach rate</Label>
                  <Input readOnly value={`${sla.sla_breach_rate}%`} />
                </div>
              </div>

              <Button onClick={() => saveOpsPolicy.mutate()} disabled={saveOpsPolicy.isPending}>
                {saveOpsPolicy.isPending ? 'Saving...' : 'Save reliability policy'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="release">
          <Card>
            <CardHeader>
              <CardTitle>Release Quality Gate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-4 gap-3">
                <MetricFlat title="Releases (last 12)" value={releaseQuality.releases_last_12} />
                <MetricFlat title="Failed/rollback" value={releaseQuality.failed_or_rollback_count} />
                <MetricFlat title="Deploy success" value={`${releaseQuality.deployment_success_rate}%`} />
                <MetricFlat title="Change failure" value={`${releaseQuality.change_failure_rate}%`} />
              </div>

              <div className="border rounded-lg p-3">
                <p className="font-medium text-slate-900 mb-2">Quality gate recommendation</p>
                <p className="text-sm text-slate-700">
                  {releaseQuality.change_failure_rate > 15
                    ? 'Hold release trains until change-failure rate drops below 15% and complete postmortem actions.'
                    : 'Release quality is within acceptable threshold. Continue canary deployment strategy.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>Support Playbooks + Disaster Recovery Drills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {runbooks.map((runbook) => (
                  <div key={runbook.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900">{runbook.title}</p>
                      <Badge>{runbook.owner_role}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Target recovery: {runbook.target_mins} minutes</p>
                    <ul className="list-disc list-inside text-sm text-slate-700 mt-2">
                      {runbook.checklist.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="border rounded-lg p-3">
                <p className="font-medium text-slate-900 mb-2">Recent backup drills</p>
                {drillRows.length === 0 ? (
                  <p className="text-sm text-slate-500">No drill logs yet. Run first drill this week.</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {drillRows.slice(0, 5).map((row) => (
                      <div key={row.id} className="flex items-center justify-between border-b border-slate-100 pb-1">
                        <span>{row.executed_at ? new Date(row.executed_at).toLocaleString() : 'Unknown date'}</span>
                        <span>{row.duration_minutes}m</span>
                        <Badge className={row.outcome === 'success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                          {row.outcome}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ title, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">{title}</p>
            <p className="text-2xl font-semibold text-slate-900">{value}</p>
          </div>
          <Icon className="h-5 w-5 text-indigo-500" />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricFlat({ title, value }) {
  return (
    <div className="border rounded-lg p-3 bg-slate-50">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
