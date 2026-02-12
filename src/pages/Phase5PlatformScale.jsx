import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Link2, ShieldCheck, BarChart3, Repeat2 } from 'lucide-react';
import { createAuditLog } from '@/lib/auditLog';
import {
  buildExecutiveKpis,
  buildRevenueForecast,
  buildTenantUsageSummary,
  getPhase5Providers,
  normalizeTenantPolicy
} from '@/lib/phase5';
import {
  detectReconciliationConflicts,
  queueIntegrationSync,
  runSyncJob,
  saveReconciliationDecision
} from '@/lib/integrationConnectors';

export default function Phase5PlatformScale() {
  const providers = getPhase5Providers();
  const [providerState, setProviderState] = useState(() =>
    providers.reduce((acc, provider) => {
      acc[provider.id] = { connected: false, account_name: '', webhook_enabled: false, sync_mode: 'ingest_only' };
      return acc;
    }, {})
  );
  const [tenantPolicy, setTenantPolicy] = useState(() => normalizeTenantPolicy({}));
  const [selectedProvider, setSelectedProvider] = useState('quickbooks');
  const [syncResults, setSyncResults] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  const { data: user } = useQuery({ queryKey: ['currentUser', 'phase5'], queryFn: () => base44.auth.me() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects', 'phase5'], queryFn: () => base44.entities.Project.list('-created_date') });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses', 'phase5'], queryFn: () => base44.entities.Expense.list('-created_date') });
  const { data: bids = [] } = useQuery({ queryKey: ['bids', 'phase5'], queryFn: () => base44.entities.BidOpportunity.list('-created_date') });

  const { data: teamUsers = [] } = useQuery({
    queryKey: ['teamUsers', user?.organization_id, 'phase5'],
    enabled: !!user?.organization_id,
    queryFn: async () => {
      try {
        return await base44.entities.UserProfile.filter({ organization_id: user.organization_id });
      } catch (error) {
        console.warn('UserProfile entity unavailable; using current user only.', error);
        return user ? [{ id: user.id, status: 'active' }] : [];
      }
    }
  });

  const { data: docs = [] } = useQuery({ queryKey: ['documents', 'phase5'], queryFn: () => base44.entities.Document.list('-created_date') });
  const { data: aiLogs = [] } = useQuery({
    queryKey: ['aiLogs', 'phase5'],
    queryFn: async () => {
      try {
        return await base44.entities.AgentMessage.list('-created_date');
      } catch (error) {
        console.warn('AgentMessage unavailable; using empty AI usage list.', error);
        return [];
      }
    }
  });

  useQuery({
    queryKey: ['phase5IntegrationConfig', user?.organization_id],
    enabled: !!user?.organization_id,
    queryFn: async () => {
      try {
        const rows = await base44.entities.IntegrationConfig.filter({ organization_id: user.organization_id });
        const mapped = rows.reduce((acc, row) => {
          acc[row.provider] = {
            connected: !!row.connected,
            account_name: row.account_name || '',
            webhook_enabled: !!row.webhook_enabled,
            sync_mode: row.sync_mode || 'ingest_only'
          };
          return acc;
        }, {});
        setProviderState((prev) => ({ ...prev, ...mapped }));
      } catch (error) {
        console.warn('IntegrationConfig unavailable.', error);
      }
      return true;
    }
  });

  useQuery({
    queryKey: ['phase5TenantPolicyLoad', user?.organization_id],
    enabled: !!user?.organization_id,
    queryFn: async () => {
      try {
        const orgRows = await base44.entities.Organization.filter({ id: user.organization_id });
        const org = orgRows?.[0];
        const policy = org?.tenant_policy || org?.platform_policy || {};
        setTenantPolicy(normalizeTenantPolicy(policy));
      } catch (error) {
        console.warn('Organization policy unavailable.', error);
      }
      return true;
    }
  });

  const usage = useMemo(() => buildTenantUsageSummary({ users: teamUsers, documents: docs, aiLogs }), [teamUsers, docs, aiLogs]);
  const kpis = useMemo(() => buildExecutiveKpis({ projects, expenses, bids }), [projects, expenses, bids]);
  const revenueForecast = useMemo(() => buildRevenueForecast({ projects }), [projects]);

  const saveIntegrations = useMutation({
    mutationFn: async () => {
      const existing = await base44.entities.IntegrationConfig.filter({ organization_id: user.organization_id });
      await Promise.all(existing.map((row) => base44.entities.IntegrationConfig.delete(row.id)));
      await Promise.all(
        Object.entries(providerState).map(([provider, cfg]) =>
          base44.entities.IntegrationConfig.create({
            organization_id: user.organization_id,
            provider,
            connected: !!cfg.connected,
            account_name: cfg.account_name || '',
            webhook_enabled: !!cfg.webhook_enabled,
            sync_mode: cfg.sync_mode || 'ingest_only',
            last_sync_at: cfg.connected ? new Date().toISOString() : null
          })
        )
      );

      await createAuditLog({
        organizationId: user?.organization_id,
        userId: user?.id,
        action: 'phase5_integrations_marketplace_updated',
        entityType: 'IntegrationConfig',
        entityId: user?.organization_id,
        after: providerState
      });
    },
    onSuccess: () => toast.success('Phase 5 integration settings saved.'),
    onError: () => toast.error('Failed to save integration settings.')
  });

  const saveTenantPolicy = useMutation({
    mutationFn: async () => {
      const orgRows = await base44.entities.Organization.filter({ id: user.organization_id });
      const org = orgRows?.[0];
      if (org?.id) {
        await base44.entities.Organization.update(org.id, {
          tenant_policy: tenantPolicy,
          platform_policy: tenantPolicy
        });
      }

      await createAuditLog({
        organizationId: user?.organization_id,
        userId: user?.id,
        action: 'phase5_tenant_policy_updated',
        entityType: 'Organization',
        entityId: user?.organization_id,
        after: tenantPolicy
      });
    },
    onSuccess: () => toast.success('Tenant policy saved.'),
    onError: () => toast.error('Failed to save tenant policy.')
  });

  const runConnectorSync = useMutation({
    mutationFn: async () => {
      const cfg = providerState[selectedProvider] || { sync_mode: 'ingest_only' };
      const queued = await queueIntegrationSync({
        organizationId: user?.organization_id,
        userId: user?.id,
        provider: selectedProvider,
        direction: cfg.sync_mode,
        entity: 'projects',
        payload: { reason: 'manual_phase5_sync' }
      });
      const result = await runSyncJob(queued);
      const sampleSource = [{ external_id: 'P-100', budget: 250000, status: 'active' }];
      const sampleTarget = [{ external_id: 'P-100', budget: 245000, status: 'active' }];
      const nextConflicts = detectReconciliationConflicts({ sourceRecords: sampleSource, targetRecords: sampleTarget });

      setSyncResults((prev) => [result, ...prev].slice(0, 10));
      setConflicts(nextConflicts);

      await createAuditLog({
        organizationId: user?.organization_id,
        userId: user?.id,
        action: 'phase5_connector_sync_executed',
        entityType: 'IntegrationSyncJob',
        entityId: result?.id,
        after: { provider: selectedProvider, direction: cfg.sync_mode, conflicts: nextConflicts.length }
      });

      return result;
    },
    onSuccess: () => toast.success('Connector sync completed.'),
    onError: () => toast.error('Connector sync failed.')
  });

  const resolveConflict = useMutation({
    mutationFn: async ({ conflict, resolution }) => {
      await saveReconciliationDecision({
        organizationId: user?.organization_id,
        provider: selectedProvider,
        externalId: conflict.external_id,
        resolution,
        resolvedBy: user?.id
      });

      await createAuditLog({
        organizationId: user?.organization_id,
        userId: user?.id,
        action: 'phase5_reconciliation_resolved',
        entityType: 'IntegrationReconciliation',
        entityId: conflict.external_id,
        after: { resolution, provider: selectedProvider }
      });

      setConflicts((prev) => prev.filter((item) => item.external_id !== conflict.external_id));
    },
    onSuccess: () => toast.success('Reconciliation decision saved.')
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Phase 5 Platform & Scale Hub</h1>
        <p className="text-sm text-slate-600 mt-1">Integration marketplace, tenant administration, and executive reporting command center.</p>
      </div>

      <Tabs defaultValue="marketplace" className="space-y-4">
        <TabsList className="grid w-full md:grid-cols-4">
          <TabsTrigger value="marketplace"><Link2 className="h-4 w-4 mr-1" /> Marketplace</TabsTrigger>
          <TabsTrigger value="connectors"><Repeat2 className="h-4 w-4 mr-1" /> Connectors</TabsTrigger>
          <TabsTrigger value="tenant"><ShieldCheck className="h-4 w-4 mr-1" /> Tenant Admin</TabsTrigger>
          <TabsTrigger value="executive"><BarChart3 className="h-4 w-4 mr-1" /> Executive Center</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          <Card>
            <CardHeader>
              <CardTitle>Integration Marketplace+</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {providers.map((provider) => {
                const cfg = providerState[provider.id] || { connected: false, account_name: '', webhook_enabled: false, sync_mode: 'ingest_only' };
                return (
                  <div key={provider.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{provider.name}</p>
                        <p className="text-xs text-slate-500">{provider.category} • {provider.tier.toUpperCase()} tier</p>
                      </div>
                      <Badge className={cfg.connected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                        {cfg.connected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <Label>Connected account</Label>
                        <Input
                          value={cfg.account_name}
                          placeholder="account@company.com"
                          onChange={(event) => setProviderState((prev) => ({
                            ...prev,
                            [provider.id]: { ...prev[provider.id], account_name: event.target.value }
                          }))}
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="flex items-center justify-between border rounded-md p-2 w-full">
                          <span className="text-sm">Connected</span>
                          <Switch
                            checked={cfg.connected}
                            onCheckedChange={(checked) => setProviderState((prev) => ({
                              ...prev,
                              [provider.id]: { ...prev[provider.id], connected: checked }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border rounded-md p-2">
                      <span className="text-sm">Enable webhook sync</span>
                      <Switch
                        disabled={!provider.supports_webhook}
                        checked={cfg.webhook_enabled && provider.supports_webhook}
                        onCheckedChange={(checked) => setProviderState((prev) => ({
                          ...prev,
                          [provider.id]: { ...prev[provider.id], webhook_enabled: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between border rounded-md p-2">
                      <span className="text-sm">Sync direction</span>
                      <Select
                        value={cfg.sync_mode || 'ingest_only'}
                        onValueChange={(value) => setProviderState((prev) => ({
                          ...prev,
                          [provider.id]: { ...prev[provider.id], sync_mode: value }
                        }))}
                      >
                        <SelectTrigger className="w-52" aria-label={`Sync direction for ${provider.name}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ingest_only">Ingest only</SelectItem>
                          <SelectItem value="push_only">Push only</SelectItem>
                          <SelectItem value="bi_directional" disabled={!provider.supports_bidirectional}>Bi-directional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}

              <Button onClick={() => saveIntegrations.mutate()} disabled={saveIntegrations.isPending}>
                {saveIntegrations.isPending ? 'Saving...' : 'Save marketplace settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectors">
          <Card>
            <CardHeader>
              <CardTitle>Production Connector Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label>Provider</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger aria-label="Connector provider"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sync mode</Label>
                  <Input value={providerState[selectedProvider]?.sync_mode || 'ingest_only'} readOnly />
                </div>
                <div className="flex items-end">
                  <Button className="w-full" onClick={() => runConnectorSync.mutate()} disabled={runConnectorSync.isPending}>
                    {runConnectorSync.isPending ? 'Running sync...' : 'Run bi-directional sync job'}
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <p className="font-medium text-slate-900">Sync run history</p>
                {syncResults.length === 0 ? (
                  <p className="text-sm text-slate-500">No sync jobs run yet.</p>
                ) : syncResults.map((job) => (
                  <div key={job.id} className="text-sm border rounded-md p-2 flex items-center justify-between">
                    <span>{job.provider} • {job.direction} • {job.status}</span>
                    <span className="text-slate-500">Read {job.records_read} / Wrote {job.records_written} / Conflicts {job.conflicts}</span>
                  </div>
                ))}
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <p className="font-medium text-slate-900">Reconciliation queue</p>
                {conflicts.length === 0 ? (
                  <p className="text-sm text-slate-500">No conflicts detected from latest sync.</p>
                ) : conflicts.map((conflict) => (
                  <div key={conflict.external_id} className="border rounded-md p-2 space-y-2">
                    <p className="text-sm font-medium">External ID: {conflict.external_id}</p>
                    <p className="text-xs text-slate-600">Changed fields: {conflict.diff_fields.join(', ')}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => resolveConflict.mutate({ conflict, resolution: 'prefer_source' })}>Prefer source</Button>
                      <Button size="sm" variant="outline" onClick={() => resolveConflict.mutate({ conflict, resolution: 'prefer_target' })}>Prefer target</Button>
                      <Button size="sm" variant="outline" onClick={() => resolveConflict.mutate({ conflict, resolution: 'manual_review' })}>Manual review</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenant">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Admin Console</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <Metric title="Active users" value={usage.active_users} />
                <Metric title="Documents" value={usage.documents_count} />
                <Metric title="AI tokens used" value={usage.ai_tokens_used.toLocaleString()} />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tenant-slug">Tenant slug</Label>
                  <Input id="tenant-slug" value={tenantPolicy.tenant_slug} onChange={(event) => setTenantPolicy((prev) => ({ ...prev, tenant_slug: event.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="tenant-region">Region</Label>
                  <Input id="tenant-region" value={tenantPolicy.region} onChange={(event) => setTenantPolicy((prev) => ({ ...prev, region: event.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="tenant-seat-limit">Seat limit</Label>
                  <Input id="tenant-seat-limit" type="number" value={tenantPolicy.seat_limit} onChange={(event) => setTenantPolicy((prev) => ({ ...prev, seat_limit: Number(event.target.value || prev.seat_limit) }))} />
                </div>
                <div>
                  <Label htmlFor="tenant-storage">Storage limit (GB)</Label>
                  <Input id="tenant-storage" type="number" value={tenantPolicy.storage_limit_gb} onChange={(event) => setTenantPolicy((prev) => ({ ...prev, storage_limit_gb: Number(event.target.value || prev.storage_limit_gb) }))} />
                </div>
                <div>
                  <Label htmlFor="tenant-ai-limit">AI token limit per month</Label>
                  <Input id="tenant-ai-limit" type="number" value={tenantPolicy.ai_monthly_token_limit} onChange={(event) => setTenantPolicy((prev) => ({ ...prev, ai_monthly_token_limit: Number(event.target.value || prev.ai_monthly_token_limit) }))} />
                </div>
                <div>
                  <Label htmlFor="tenant-retention">Data retention (days)</Label>
                  <Input id="tenant-retention" type="number" value={tenantPolicy.retention_days} onChange={(event) => setTenantPolicy((prev) => ({ ...prev, retention_days: Number(event.target.value || prev.retention_days) }))} />
                </div>
              </div>

              <div className="flex items-center justify-between border rounded-md p-2">
                <span className="text-sm">Data residency required</span>
                <Switch checked={tenantPolicy.data_residency_required} onCheckedChange={(checked) => setTenantPolicy((prev) => ({ ...prev, data_residency_required: checked }))} />
              </div>

              <Button onClick={() => saveTenantPolicy.mutate()} disabled={saveTenantPolicy.isPending}>
                {saveTenantPolicy.isPending ? 'Saving...' : 'Save tenant policy'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executive">
          <Card>
            <CardHeader>
              <CardTitle>Executive Command Center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-5 gap-3">
                <Metric title="Active projects" value={kpis.active_projects} />
                <Metric title="Budget" value={`$${kpis.total_budget.toLocaleString()}`} />
                <Metric title="Spend" value={`$${kpis.total_spend.toLocaleString()}`} />
                <Metric title="Projected margin" value={`$${kpis.margin_projection.toLocaleString()}`} />
                <Metric title="Bid win rate" value={`${kpis.bid_win_rate}%`} />
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <p className="font-medium text-slate-900">Revenue forecast by start month</p>
                {revenueForecast.length === 0 ? (
                  <p className="text-sm text-slate-500">No project dates available yet.</p>
                ) : (
                  revenueForecast.map((row) => (
                    <div key={row.month} className="flex items-center justify-between text-sm border-b border-slate-100 pb-1">
                      <span>{row.month}</span>
                      <span className="font-medium">${row.revenue.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="border rounded-lg p-3 bg-slate-50">
                <p className="text-sm text-slate-700">
                  Phase 5 focus: tenant-level policy controls, production connector ops with reconciliation, and portfolio command center metrics for multi-company SaaS operations.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
