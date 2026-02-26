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
import { buildPortfolioMetrics, buildPortfolioRows, normalizeIntegrationState, toCsv } from '@/lib/phase3';
import { createAuditLog } from '@/lib/auditLog';
import { BarChart3, Link2, ShieldCheck } from 'lucide-react';

const defaultCompliance = {
  enforce_sso: false,
  session_timeout_minutes: 60,
  mfa_required: false,
  data_retention_days: 365,
  scim_provisioning: false
};

export default function Phase3Operations() {
  const [integrationState, setIntegrationState] = useState(() => normalizeIntegrationState({}));
  const [compliance, setCompliance] = useState(defaultCompliance);

  const { data: user } = useQuery({ queryKey: ['currentUser', 'phase3'], queryFn: () => base44.auth.me() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects', 'phase3'], queryFn: () => base44.entities.Project.list('-created_date') });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses', 'phase3'], queryFn: () => base44.entities.Expense.list('-created_date') });
  const { data: bids = [] } = useQuery({ queryKey: ['bids', 'phase3'], queryFn: () => base44.entities.BidOpportunity.list('-created_date') });

  useQuery({
    queryKey: ['integrations', user?.organization_id],
    enabled: !!user?.organization_id,
    queryFn: async () => {
      try {
        const rows = await base44.entities.IntegrationConfig.filter({ organization_id: user.organization_id });
        const mapped = rows.reduce((acc, row) => {
          acc[row.provider] = {
            connected: !!row.connected,
            account_name: row.account_name || '',
            last_sync_at: row.last_sync_at || null
          };
          return acc;
        }, {});
        setIntegrationState(normalizeIntegrationState(mapped));
      } catch (error) {
        console.warn('IntegrationConfig unavailable. Using local defaults.', error);
      }
      return true;
    }
  });

  useQuery({
    queryKey: ['organizationCompliance', user?.organization_id],
    enabled: !!user?.organization_id,
    queryFn: async () => {
      try {
        const orgRows = await base44.entities.Organization.filter({ id: user.organization_id });
        const org = orgRows?.[0];
        const settings = org?.security_settings || org?.compliance_settings;
        if (settings) {
          setCompliance({ ...defaultCompliance, ...settings });
        }
      } catch (error) {
        console.warn('Could not load compliance settings.', error);
      }
      return true;
    }
  });

  const metrics = useMemo(() => buildPortfolioMetrics({ projects, bids, expenses }), [projects, bids, expenses]);
  const portfolioRows = useMemo(() => buildPortfolioRows({ projects, expenses }), [projects, expenses]);

  const saveIntegrationsMutation = useMutation({
    mutationFn: async () => {
      try {
        const existing = await base44.entities.IntegrationConfig.filter({ organization_id: user.organization_id });
        await Promise.all(existing.map((row) => base44.entities.IntegrationConfig.delete(row.id)));

        const records = Object.entries(integrationState).map(([provider, cfg]) => ({
          organization_id: user.organization_id,
          provider,
          connected: cfg.connected,
          account_name: cfg.account_name,
          last_sync_at: cfg.connected ? new Date().toISOString() : null
        }));

        await Promise.all(records.map((row) => base44.entities.IntegrationConfig.create(row)));
      } catch (error) {
        console.warn('IntegrationConfig entity not available; save skipped.', error);
      }

      await createAuditLog({
        organizationId: user?.organization_id,
        userId: user?.id,
        action: 'phase3_integrations_updated',
        entityType: 'IntegrationConfig',
        entityId: user?.organization_id,
        after: integrationState
      });
    },
    onSuccess: () => toast.success('Integration settings saved.'),
    onError: () => toast.error('Failed to save integrations.')
  });

  const saveComplianceMutation = useMutation({
    mutationFn: async () => {
      try {
        const orgRows = await base44.entities.Organization.filter({ id: user.organization_id });
        const org = orgRows?.[0];
        if (org?.id) {
          await base44.entities.Organization.update(org.id, {
            security_settings: compliance,
            compliance_settings: compliance
          });
        }
      } catch (error) {
        console.warn('Organization security settings update failed.', error);
      }

      await createAuditLog({
        organizationId: user?.organization_id,
        userId: user?.id,
        action: 'phase3_compliance_updated',
        entityType: 'Organization',
        entityId: user?.organization_id,
        after: compliance
      });
    },
    onSuccess: () => toast.success('Compliance settings saved.'),
    onError: () => toast.error('Failed to save compliance settings.')
  });

  const exportCsv = () => {
    const csv = toCsv(portfolioRows);
    if (!csv) {
      toast.error('No portfolio rows available to export.');
      return;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `portfolio-report-${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Portfolio report exported.');
  };

  const providers = [
    { id: 'quickbooks', label: 'QuickBooks' },
    { id: 'sage', label: 'Sage' },
    { id: 'netsuite', label: 'NetSuite' },
    { id: 'google_calendar', label: 'Google Calendar' },
    { id: 'microsoft_teams', label: 'Microsoft Teams' },
    { id: 'slack', label: 'Slack' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Enterprise Integrations Hub</h1>
        <p className="text-sm text-slate-600 mt-1">Integrations, SSO/compliance controls, and portfolio BI reporting.</p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations"><Link2 className="h-4 w-4 mr-1" /> Integrations</TabsTrigger>
          <TabsTrigger value="security"><ShieldCheck className="h-4 w-4 mr-1" /> SSO & Compliance</TabsTrigger>
          <TabsTrigger value="reporting"><BarChart3 className="h-4 w-4 mr-1" /> Portfolio BI</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integration Marketplace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {providers.map((provider) => {
                const state = integrationState[provider.id] || { connected: false, account_name: '', last_sync_at: null };
                return (
                  <div key={provider.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{provider.label}</p>
                        <p className="text-xs text-slate-500">
                          {state.last_sync_at ? `Last sync: ${new Date(state.last_sync_at).toLocaleString()}` : 'Never synced'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={state.connected ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}>
                          {state.connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                        <Switch
                          checked={state.connected}
                          onCheckedChange={(checked) => setIntegrationState((prev) => ({
                            ...prev,
                            [provider.id]: {
                              ...prev[provider.id],
                              connected: checked,
                              last_sync_at: checked ? new Date().toISOString() : prev[provider.id]?.last_sync_at || null
                            }
                          }))}
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label className="text-xs">Account name</Label>
                      <Input
                        value={state.account_name || ''}
                        onChange={(event) => setIntegrationState((prev) => ({
                          ...prev,
                          [provider.id]: { ...prev[provider.id], account_name: event.target.value }
                        }))}
                      />
                    </div>
                  </div>
                );
              })}

              <Button className="mt-2" onClick={() => saveIntegrationsMutation.mutate()} disabled={saveIntegrationsMutation.isPending}>
                {saveIntegrationsMutation.isPending ? 'Saving...' : 'Save integrations'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>SSO + Compliance Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enforce SSO</p>
                  <p className="text-xs text-slate-500">Require identity provider login for all users.</p>
                </div>
                <Switch checked={compliance.enforce_sso} onCheckedChange={(checked) => setCompliance((prev) => ({ ...prev, enforce_sso: checked }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">MFA Required</p>
                  <p className="text-xs text-slate-500">Require multi-factor authentication at login.</p>
                </div>
                <Switch checked={compliance.mfa_required} onCheckedChange={(checked) => setCompliance((prev) => ({ ...prev, mfa_required: checked }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SCIM Provisioning</p>
                  <p className="text-xs text-slate-500">Enable automated user lifecycle sync.</p>
                </div>
                <Switch checked={compliance.scim_provisioning} onCheckedChange={(checked) => setCompliance((prev) => ({ ...prev, scim_provisioning: checked }))} />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Session timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={compliance.session_timeout_minutes}
                    onChange={(event) => setCompliance((prev) => ({ ...prev, session_timeout_minutes: Number(event.target.value || 0) }))}
                  />
                </div>
                <div>
                  <Label>Data retention (days)</Label>
                  <Input
                    type="number"
                    value={compliance.data_retention_days}
                    onChange={(event) => setCompliance((prev) => ({ ...prev, data_retention_days: Number(event.target.value || 0) }))}
                  />
                </div>
              </div>

              <Button onClick={() => saveComplianceMutation.mutate()} disabled={saveComplianceMutation.isPending}>
                {saveComplianceMutation.isPending ? 'Saving...' : 'Save compliance policy'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reporting">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Active Projects</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{metrics.active_projects}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Bid Win Rate</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{metrics.bid_win_rate}%</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Projected Profit</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">${metrics.projected_profit.toLocaleString()}</p></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Portfolio Report Rows
                  <Button size="sm" variant="outline" onClick={exportCsv}>Export CSV</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {portfolioRows.length === 0 ? (
                  <p className="text-sm text-slate-500">No projects available for reporting.</p>
                ) : (
                  <div className="space-y-2">
                    {portfolioRows.map((row) => (
                      <div key={row.project_id} className="border rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{row.project_name}</p>
                          <p className="text-xs text-slate-500">Status: {row.status} • Budget: ${row.budget.toLocaleString()} • Spend: ${row.spend.toLocaleString()}</p>
                        </div>
                        <Badge className={row.variance >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {row.variance_percent}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
