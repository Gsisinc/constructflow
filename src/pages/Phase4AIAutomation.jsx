import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createAuditLog } from '@/lib/auditLog';
import {
  buildAiReliabilityStats,
  buildAutomationPreview,
  buildPromptTraceRows,
  DEFAULT_AI_POLICY,
  DEFAULT_MODEL_POLICY,
  normalizeAiPolicy,
  normalizeModelPolicy
} from '@/lib/phase4';
import { Bot, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { attachTenantScope, shouldRunAutomationForTenant } from '@/lib/tenantGuard';

const defaultRules = [
  {
    id: 'rule-risk-threshold',
    name: 'High-risk project recovery plan',
    trigger_type: 'risk_threshold',
    threshold: 0.75,
    action: 'Draft schedule and cost mitigation plan',
    enabled: true
  },
  {
    id: 'rule-bid-deadline',
    name: 'Bid deadline readiness review',
    trigger_type: 'bid_deadline_window',
    threshold: 7,
    action: 'Generate submission checklist and missing artifacts',
    enabled: true
  }
];

export default function Phase4AIAutomation() {
  const [aiPolicy, setAiPolicy] = useState(DEFAULT_AI_POLICY);
  const [modelPolicy, setModelPolicy] = useState(DEFAULT_MODEL_POLICY);
  const [automationRules, setAutomationRules] = useState(defaultRules);

  const { data: user } = useQuery({ queryKey: ['currentUser', 'phase4'], queryFn: () => base44.auth.me() });
  const { data: bids = [] } = useQuery({ queryKey: ['bids', 'phase4'], queryFn: () => base44.entities.BidOpportunity.list('-created_date') });
  const { data: projects = [] } = useQuery({ queryKey: ['projects', 'phase4'], queryFn: () => base44.entities.Project.list('-created_date') });

  const { data: promptTraces = [] } = useQuery({
    queryKey: ['phase4PromptTraces', user?.organization_id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const messages = await base44.entities.AgentMessage.list('-created_date');
        return buildPromptTraceRows(messages);
      } catch (error) {
        console.warn('AgentMessage unavailable. Showing empty prompt trace table.', error);
        return [];
      }
    }
  });

  useQuery({
    queryKey: ['phase4PolicyLoad', user?.organization_id],
    enabled: !!user?.organization_id,
    queryFn: async () => {
      try {
        const orgRows = await base44.entities.Organization.filter({ id: user.organization_id });
        const org = orgRows?.[0];
        const settings = org?.ai_governance_settings || {};
        setAiPolicy(normalizeAiPolicy(settings.ai_policy || {}));
        setModelPolicy(normalizeModelPolicy(settings.model_policy || {}));
      } catch (error) {
        console.warn('Organization AI governance settings unavailable; using defaults.', error);
      }
      return true;
    }
  });

  const scopedProjects = useMemo(() => projects.filter((row) => shouldRunAutomationForTenant({ row, user })), [projects, user]);
  const scopedBids = useMemo(() => bids.filter((row) => shouldRunAutomationForTenant({ row, user })), [bids, user]);

  const reliabilityStats = useMemo(() => buildAiReliabilityStats(promptTraces), [promptTraces]);
  const automationPreview = useMemo(
    () => buildAutomationPreview({ rules: automationRules.filter((rule) => rule.enabled), bids: scopedBids, projects: scopedProjects }),
    [automationRules, scopedBids, scopedProjects]
  );

  const savePoliciesMutation = useMutation({
    mutationFn: async () => {
      try {
        const orgRows = await base44.entities.Organization.filter({ id: user.organization_id });
        const org = orgRows?.[0];
        if (org?.id) {
          await base44.entities.Organization.update(org.id, {
            ai_governance_settings: {
              ai_policy: aiPolicy,
              model_policy: modelPolicy
            }
          });
        }
      } catch (error) {
        console.warn('Could not persist AI governance settings.', error);
      }

      await createAuditLog({
        organizationId: user?.organization_id,
        userId: user?.id,
        action: 'phase4_ai_policy_updated',
        entityType: 'Organization',
        entityId: user?.organization_id,
        after: { aiPolicy, modelPolicy }
      });
    },
    onSuccess: () => toast.success('AI policy saved.'),
    onError: () => toast.error('Failed to save AI policy.')
  });

  const saveRulesMutation = useMutation({
    mutationFn: async () => {
      try {
        const existing = await base44.entities.AutomationRule.filter({ organization_id: user.organization_id });
        await Promise.all(existing.map((row) => base44.entities.AutomationRule.delete(row.id)));
        await Promise.all(
          automationRules.map((rule) =>
            base44.entities.AutomationRule.create(attachTenantScope({
              ...rule
            }, user))
          )
        );
      } catch (error) {
        console.warn('AutomationRule entity unavailable; save skipped.', error);
      }

      await createAuditLog({
        organizationId: user?.organization_id,
        userId: user?.id,
        action: 'phase4_automation_rules_updated',
        entityType: 'AutomationRule',
        entityId: user?.organization_id,
        after: automationRules
      });
    },
    onSuccess: () => toast.success('Automation rules saved.'),
    onError: () => toast.error('Failed to save automation rules.')
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Governance + Automation Center</h1>
          <p className="text-sm text-slate-500">Model policy, AI traceability, and autonomous workflow previews.</p>
        </div>
        <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">AI Ops</Badge>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <MetricCard title="AI Runs" value={reliabilityStats.total_runs} icon={Bot} />
        <MetricCard title="Avg Confidence" value={`${Math.round(reliabilityStats.avg_confidence * 100)}%`} icon={Sparkles} />
        <MetricCard title="Low Confidence" value={reliabilityStats.low_confidence_runs} icon={ShieldCheck} />
        <MetricCard title="Est. Tokens" value={reliabilityStats.total_estimated_tokens.toLocaleString()} icon={Workflow} />
      </div>

      <Tabs defaultValue="governance" className="space-y-4">
        <TabsList className="grid md:grid-cols-3 w-full">
          <TabsTrigger value="governance">Governance Policy</TabsTrigger>
          <TabsTrigger value="traceability">Prompt Traceability</TabsTrigger>
          <TabsTrigger value="automation">Automation Studio</TabsTrigger>
        </TabsList>

        <TabsContent value="governance">
          <Card>
            <CardHeader>
              <CardTitle>AI Governance Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <PolicySwitch label="Require citations" checked={aiPolicy.require_citations} onChange={(checked) => setAiPolicy((prev) => ({ ...prev, require_citations: checked }))} />
                <PolicySwitch label="Block unverified claims" checked={aiPolicy.block_unverified_claims} onChange={(checked) => setAiPolicy((prev) => ({ ...prev, block_unverified_claims: checked }))} />
                <PolicySwitch label="Restrict live discovery to Market Intelligence" checked={aiPolicy.allow_live_discovery_only_for_market_intelligence} onChange={(checked) => setAiPolicy((prev) => ({ ...prev, allow_live_discovery_only_for_market_intelligence: checked }))} />
                <PolicySwitch label="Redact PII in logs" checked={aiPolicy.redact_pii_in_logs} onChange={(checked) => setAiPolicy((prev) => ({ ...prev, redact_pii_in_logs: checked }))} />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Confidence threshold</Label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1"
                    value={aiPolicy.confidence_threshold}
                    onChange={(event) => setAiPolicy((prev) => ({ ...prev, confidence_threshold: Number(event.target.value || 0.7) }))}
                  />
                </div>
                <div>
                  <Label>Prompt history retention (days)</Label>
                  <Input
                    type="number"
                    min="7"
                    value={aiPolicy.keep_prompt_history_days}
                    onChange={(event) => setAiPolicy((prev) => ({ ...prev, keep_prompt_history_days: Number(event.target.value || 90) }))}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Cost-sensitive model</Label>
                  <Input value={modelPolicy.cost_sensitive} onChange={(event) => setModelPolicy((prev) => ({ ...prev, cost_sensitive: event.target.value }))} />
                </div>
                <div>
                  <Label>Standard assistant model</Label>
                  <Input value={modelPolicy.standard_assistant} onChange={(event) => setModelPolicy((prev) => ({ ...prev, standard_assistant: event.target.value }))} />
                </div>
                <div>
                  <Label>High-reasoning model</Label>
                  <Input value={modelPolicy.high_reasoning} onChange={(event) => setModelPolicy((prev) => ({ ...prev, high_reasoning: event.target.value }))} />
                </div>
                <div>
                  <Label>Compliance-review model</Label>
                  <Input value={modelPolicy.compliance_review} onChange={(event) => setModelPolicy((prev) => ({ ...prev, compliance_review: event.target.value }))} />
                </div>
              </div>

              <Button onClick={() => savePoliciesMutation.mutate()} disabled={savePoliciesMutation.isPending}>
                {savePoliciesMutation.isPending ? 'Saving...' : 'Save governance policy'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traceability">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Traceability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-2 pr-3">Time</th>
                      <th className="py-2 pr-3">Agent</th>
                      <th className="py-2 pr-3">Model</th>
                      <th className="py-2 pr-3">Prompt</th>
                      <th className="py-2 pr-3">Response</th>
                      <th className="py-2 pr-3">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promptTraces.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">No prompt traces available yet.</td>
                      </tr>
                    ) : (
                      promptTraces.slice(0, 25).map((row) => (
                        <tr key={row.id} className="border-b border-slate-100 align-top">
                          <td className="py-2 pr-3 whitespace-nowrap">{new Date(row.created_date).toLocaleString()}</td>
                          <td className="py-2 pr-3">{row.agent_name}</td>
                          <td className="py-2 pr-3">{row.model}</td>
                          <td className="py-2 pr-3 max-w-xs text-slate-600">{row.prompt_preview || '—'}</td>
                          <td className="py-2 pr-3 max-w-xs text-slate-600">{row.response_preview || '—'}</td>
                          <td className="py-2 pr-3">
                            <Badge className={row.confidence >= 0.7 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                              {Math.round(row.confidence * 100)}%
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Automation Studio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {automationRules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-xs text-slate-500">{rule.action}</p>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => setAutomationRules((prev) => prev.map((item) => (item.id === rule.id ? { ...item, enabled: checked } : item)))}
                    />
                  </div>
                  <div>
                    <Label>Threshold</Label>
                    <Input
                      type="number"
                      step="0.05"
                      value={rule.threshold}
                      onChange={(event) => setAutomationRules((prev) => prev.map((item) => (item.id === rule.id ? { ...item, threshold: Number(event.target.value || item.threshold) } : item)))}
                    />
                  </div>
                </div>
              ))}

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <p className="font-medium text-slate-900">Trigger Preview</p>
                {automationPreview.map((row) => (
                  <div key={row.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p>{row.name}</p>
                      <p className="text-xs text-slate-500">Reason: {row.reason}</p>
                    </div>
                    <Badge className={row.shouldTrigger ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}>
                      {row.shouldTrigger ? `Would run (${row.impacted?.length || 0})` : 'Idle'}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button onClick={() => saveRulesMutation.mutate()} disabled={saveRulesMutation.isPending}>
                {saveRulesMutation.isPending ? 'Saving...' : 'Save automation rules'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon }) {
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

function PolicySwitch({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between border rounded-lg p-3">
      <p className="font-medium text-sm text-slate-800">{label}</p>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
