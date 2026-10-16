import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, DollarSign, FileText, Trash2, TrendingUp, LayoutDashboard, ListChecks, Boxes, Calculator, ShoppingCart, ClipboardList, FolderOpen, FileImage, Building2, MapPin, CalendarClock, Layers, CircleDollarSign, PieChart, StickyNote, Lock, ExternalLink, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fmtDate } from '@/lib/dates';
import BidStatusSelect from '@/components/bids/BidStatusSelect';
import { convertBidToProject } from '@/lib/bidConversion';
import BidUploader from '@/components/bids/BidUploader';
import BidRequirements from '@/components/bids/BidRequirements';
import BidToProject from '@/components/bids/BidToProject';
import BidDrawings from '@/components/bids/BidDrawings';
import BidPhaseWorkspace from '@/components/bids/BidPhaseWorkspace';
import EstimateEditor, { computeEstimateTotals, marginBand } from '@/components/bids/EstimateEditor';
import { fmtDollars } from '@/lib/money';

const statusColors = {
  review: 'bg-primary/15 text-primary',
  intake: 'bg-cyan-100 text-cyan-800',
  off_pricing: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300',
  user_analyzing: 'bg-purple-100 dark:bg-purple-500/15 text-purple-800 dark:text-purple-300',
  estimated: 'bg-indigo-100 text-indigo-800',
  submitted: 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300',
  won: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  lost: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300',
  no_bid: 'bg-muted text-foreground',
  closed: 'bg-muted text-foreground'
};

export default function BidOpportunityDetail() {
  const [user, setUser] = useState(null);
  const [bidId, setBidId] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setBidId(urlParams.get('id'));

    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: bid, refetch: refetchBid } = useQuery({
    queryKey: ['bid', bidId],
    queryFn: async () => {
      const bids = await base44.entities.BidOpportunity.filter({ id: bidId });
      return bids?.[0] || null;
    },
    enabled: !!bidId
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['bidDocuments', bidId],
    queryFn: () => base44.entities.BidDocument.filter({ bid_opportunity_id: bidId }),
    enabled: !!bidId
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BidOpportunity.delete(id),
    onSuccess: () => {
      toast.success('Bid deleted');
      navigate(createPageUrl('Bids'));
    },
    onError: () => toast.error('Unable to delete bid')
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.BidOpportunity.update(id, { status }),
    onSuccess: async (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
      toast.success('Status updated');
      if (vars.status === 'won') {
        const fresh = (await base44.entities.BidOpportunity.filter({ id: vars.id }))?.[0];
        if (fresh && !fresh.linked_project_id) {
          try {
            const res = await convertBidToProject({ base44Client: base44, bid: fresh, organizationId: user.organization_id });
            queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
            toast.success(res.already_exists ? 'Project already exists' : 'Awarded — project auto-created');
          } catch (e) { toast.error('Auto-create project failed: ' + (e.message || '')); }
        }
      }
    },
    onError: (e) => toast.error('Status update failed: ' + (e.message || ''))
  });

  const analysis = useMemo(() => normalizeAiAnalysis(bid?.ai_analysis, documents), [bid?.ai_analysis, documents]);

  if (!bid || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl('Bids'))}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words">{bid.title || bid.project_name || 'Untitled Bid'}</h1>
            <p className="text-sm text-muted-foreground mt-1">{bid.agency || bid.client_name || 'Unknown Agency'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {bid.linked_project_id ? (
            <Button onClick={() => navigate(createPageUrl('ProjectDetail') + `?id=${bid.linked_project_id}`)} className="gap-2">
              <ArrowLeft className="h-4 w-4 rotate-180" />
              View Project
            </Button>
          ) : bid.status === 'won' ? (
            <BidToProject bid={bid} organizationId={user.organization_id} />
          ) : null}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (confirm('Delete this bid?')) deleteMutation.mutate(bid.id);
            }}
            className="text-red-600 dark:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="h-8 w-8 text-amber-600 dark:text-amber-300" />} label="Due Date" value={bid.due_date ? fmtDate(bid.due_date) : 'Not set'} />
        <StatCard icon={<DollarSign className="h-8 w-8 text-green-600 dark:text-green-300" />} label="Estimated Value" value={`$${Number(bid.estimated_value || bid.value || 0).toLocaleString()}`} />
        <StatCard icon={<TrendingUp className="h-8 w-8 text-primary" />} label="Win Probability" value={`${Number(bid.win_probability || 0)}%`} />
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[bid.status] || 'bg-muted text-foreground'}>{(bid.status || 'new').replace('_',' ')}</Badge>
                  <BidStatusSelect value={bid.status} onChange={(v) => statusMutation.mutate({ id: bid.id, status: v })} className="h-8 w-[150px]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full sm:w-auto">
        <TabsList className="w-full sm:w-auto overflow-x-auto flex flex-nowrap gap-1 p-1 h-auto bg-muted rounded-lg sm:inline-flex">
          <TabsTrigger value="overview" className="flex-shrink-0 gap-1.5"><LayoutDashboard className="h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="phases" className="flex-shrink-0 gap-1.5"><ListChecks className="h-4 w-4" />Phases/Stages</TabsTrigger>
          <TabsTrigger value="estimate" className="flex-shrink-0 gap-1.5"><Calculator className="h-4 w-4" />Estimate</TabsTrigger>
          <TabsTrigger value="requirements" className="flex-shrink-0 gap-1.5"><ClipboardList className="h-4 w-4" />Requirements</TabsTrigger>
          <TabsTrigger value="documents" className="flex-shrink-0 gap-1.5"><FolderOpen className="h-4 w-4" />Documents</TabsTrigger>
          <TabsTrigger value="bid-drawings" className="flex-shrink-0 gap-1.5"><FileImage className="h-4 w-4" />Drawings</TabsTrigger>
          {/* Drawing Analysis now lives under Estimate; Designer and AI Analysis tabs removed (UI only). */}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <BidOverviewPanel bid={bid} documents={documents} statusColors={statusColors} />
        </TabsContent>

        <TabsContent value="phases" className="space-y-4">
          <BidPhaseWorkspace bid={bid} organizationId={user.organization_id} />
        </TabsContent>

        <TabsContent value="estimate" className="space-y-4">
          <EstimateEditor bidId={bid.id} organizationId={user.organization_id} bidTitle={bid.title || bid.project_name || 'Bid'} bid={bid} />
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <BidRequirements bidId={bid.id} organizationId={user.organization_id} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <BidUploader
            bidId={bid.id}
            organizationId={user.organization_id}
            onUploadComplete={() => {
              queryClient.invalidateQueries({ queryKey: ['bidDocuments', bidId] });
              queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
              refetchBid();
            }}
          />

          {documents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground break-words">Uploaded Documents</h3>
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.name || 'Untitled document'}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.ai_processed && <Badge variant="outline" className="text-xs">AI Processed</Badge>}
                        <Button size="sm" variant="outline" onClick={() => doc.file_url && window.open(doc.file_url, '_blank')}>
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bid-drawings" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileImage className="h-5 w-5 text-primary" />Drawings</CardTitle></CardHeader>
            <CardContent>
              <BidDrawings bidId={bid.id} organizationId={user.organization_id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatFileSize(fileSize) {
  const bytes = Number(fileSize || 0);
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeAiAnalysis(raw, documents = []) {
  const parsed = typeof raw === 'string' ? safeParseJson(raw) : (raw || {});

  const docExtractions = (documents || [])
    .map((doc) => doc?.extracted_data || {})
    .filter(Boolean);

  const docRiskFactors = docExtractions.flatMap((data) => asArray(data.risk_factors));
  const docKeyPoints = docExtractions.flatMap((data) => asArray(data.key_points));
  const docDeadlines = docExtractions.flatMap((data) => asArray(data.deadlines));
  const docRequirements = docExtractions.flatMap((data) => asArray(data.requirements));

  const complexity = asNumber(parsed?.complexity_score);
  const markup = asNumber(parsed?.recommended_markup);

  const riskFactors = dedupe([...(asArray(parsed?.risk_factors)), ...docRiskFactors]);
  const keyPoints = dedupe([...(asArray(parsed?.key_points)), ...docKeyPoints]);
  const deadlines = dedupe([...(asArray(parsed?.deadlines)), ...docDeadlines]);
  const extractedRequirements = dedupe([...(asArray(parsed?.extracted_requirements)), ...docRequirements]);

  return {
    hasAnyData: riskFactors.length > 0 || keyPoints.length > 0 || deadlines.length > 0 || extractedRequirements.length > 0 || complexity !== null || markup !== null,
    complexityScore: complexity,
    complexityLabel: complexity === null
      ? 'Not scored'
      : complexity > 7
        ? 'High complexity'
        : complexity > 4
          ? 'Medium complexity'
          : 'Low complexity',
    recommendedMarkup: markup,
    riskFactors,
    keyPoints,
    deadlines,
    extractedRequirements
  };
}

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function dedupe(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function asNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function StatCard({ icon, label, value }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==== Bid Overview panel (inlined; same copy in BidDetail and BidOpportunityDetail) ====
const ovAsList = (res) => (Array.isArray(res) ? res : res?.items || []);

const DIVISION_LABELS = { fire_alarm: 'Fire Alarm', low_voltage: 'Low Voltage', drone: 'Drone', software: 'Software', other: 'Other' };
const STATUS_LABELS = { review: 'Review', intake: 'Intake', off_pricing: 'Off Pricing', user_analyzing: 'User Analyzing', estimated: 'Estimated', submitted: 'Submitted', won: 'Won', lost: 'Lost', no_bid: 'No Bid', closed: 'Closed' };
// Mirrors DualTrackTracker phase grouping (Phase A 1-2, B 3-6, C 7-12).
const PHASES = [
  { label: 'Phase A', stages: [1, 2] },
  { label: 'Phase B', stages: [3, 4, 5, 6] },
  { label: 'Phase C', stages: [7, 8, 9, 10, 11, 12] },
];

const safeDate = (d) => {
  if (!d) return '—';
  try { return fmtDate(d); } catch (e) { return String(d).slice(0, 10); }
};

// Read-only overview used by BidDetail and BidOpportunityDetail.
// Estimate total and margin are INTERNAL (this page is staff-only).
function BidOverviewPanel({ bid, documents = [], statusColors = {} }) {
  const bidId = bid?.id;

  const { data: estimates = [] } = useQuery({
    queryKey: ['bidEstimates', bidId],
    queryFn: async () => ovAsList(await base44.entities.BidEstimate.filter({ bid_opportunity_id: bidId })),
    enabled: !!bidId,
  });
  const { data: drawings = [] } = useQuery({
    queryKey: ['bid-drawings', bidId],
    queryFn: async () => (await base44.entities.Drawing.filter({ bid_id: bidId }, { sort: '-created_date', limit: 200 }))?.items || [],
    enabled: !!bidId,
  });
  const { data: stages = [] } = useQuery({
    queryKey: ['dualtrack-stages', bidId],
    queryFn: async () => (await base44.entities.DualTrackStage.filter({ project_id: bidId }, { sort: 'stage_number', limit: 50 }))?.items || [],
    enabled: !!bidId,
  });

  const latest = [...estimates].sort((a, b) => (b.version || 0) - (a.version || 0))[0];
  const t = latest ? computeEstimateTotals(latest) : null;
  const band = t ? marginBand(t.margin_pct) : null;
  const cleared = new Set(stages.filter((s) => s.exit_gate_passed).map((s) => s.stage_number));
  const pct = Math.round((cleared.size / 12) * 100);
  const currentStage = stages.find((s) => !s.exit_gate_passed);

  const facts = [
    { icon: Building2, label: 'Customer / GC', value: bid.client_name || bid.agency || '—', sub: bid.client_name && bid.agency && bid.agency !== bid.client_name ? bid.agency : null },
    { icon: MapPin, label: 'Location', value: bid.location || '—' },
    { icon: CalendarClock, label: 'Due date', value: bid.due_date ? safeDate(bid.due_date) : 'Not set' },
    { icon: Layers, label: 'Division', value: DIVISION_LABELS[bid.division] || bid.division || '—' },
    { icon: User, label: 'Owner', value: bid.owner_name || '—' },
    { icon: CircleDollarSign, label: 'Estimated value', value: fmtDollars(bid.estimated_value || bid.value || 0) },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Key facts */}
      <Card className="lg:col-span-2 rounded-xl border-border">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Bid details</CardTitle>
          <Badge className={statusColors[bid.status] || 'bg-muted text-foreground'}>{STATUS_LABELS[bid.status] || bid.status || 'New'}</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {facts.map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground break-words">{value}</p>
                  {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                </div>
              </div>
            ))}
          </div>
          {bid.url && (
            <a href={bid.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              <ExternalLink className="h-4 w-4" /> View original posting
            </a>
          )}
        </CardContent>
      </Card>

      {/* Estimate (internal) */}
      <Card className="rounded-xl border-border border-t-4 border-t-[hsl(var(--brand-gold,43_67%_47%))]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" />Estimate <Badge variant="outline" className="text-[10px]"><Lock className="h-3 w-3 mr-1" />Internal</Badge></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {t ? (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Estimate total (v{latest.version || 1})</p>
                <p className="text-[28px] font-bold leading-tight tabular-nums text-primary">{fmtDollars(t.total_bid_amount)}</p>
              </div>
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-[hsl(var(--brand-gold,43_67%_47%))]" />
                <span className="text-sm font-semibold tabular-nums">{t.margin_pct.toFixed(1)}% · {fmtDollars(t.margin_dollars)}</span>
                <Badge className={`border ${band.cls}`}>{band.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Margin on sell · target 25–30% · floor 20%</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No estimate yet. Open the Estimate tab to start one.</p>
          )}
        </CardContent>
      </Card>

      {/* Phase progress */}
      <Card className="lg:col-span-2 rounded-xl border-border">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" />Phase progress</CardTitle>
          <span className="text-sm font-semibold tabular-nums text-primary">{cleared.size}/12 stages</span>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-[hsl(var(--brand-gold,43_67%_47%))]" style={{ width: `${pct}%` }} /></div>
          <div className="grid grid-cols-3 gap-3">
            {PHASES.map((p) => {
              const done = p.stages.filter((n) => cleared.has(n)).length;
              return (
                <div key={p.label} className="rounded-lg border border-border p-3">
                  <p className="text-xs font-semibold text-muted-foreground">{p.label}</p>
                  <p className="text-sm font-bold text-primary">{done}/{p.stages.length} cleared</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {currentStage ? <>Current stage: <span className="font-semibold text-foreground">{currentStage.stage_number}. {currentStage.stage_name}</span></> : stages.length ? 'All stages cleared' : 'Stages are created when the Phases/Stages tab is first opened.'}
          </p>
        </CardContent>
      </Card>

      {/* Counts + key dates */}
      <Card className="rounded-xl border-border">
        <CardHeader className="pb-2"><CardTitle className="text-base">Files & dates</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-primary/10 p-3"><FileImage className="h-4 w-4 text-primary" /><p className="mt-1 text-xl font-bold text-primary">{drawings.length}</p><p className="text-xs text-muted-foreground">Drawings</p></div>
            <div className="rounded-lg bg-accent p-3"><FolderOpen className="h-4 w-4 text-[hsl(var(--brand-gold,43_67%_47%))]" /><p className="mt-1 text-xl font-bold text-primary">{documents.length}</p><p className="text-xs text-muted-foreground">Documents</p></div>
          </div>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd className="font-medium">{safeDate(bid.created_date)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Due</dt><dd className="font-medium">{bid.due_date ? safeDate(bid.due_date) : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Last updated</dt><dd className="font-medium">{safeDate(bid.updated_date)}</dd></div>
            {latest && <div className="flex justify-between"><dt className="text-muted-foreground">Estimate saved</dt><dd className="font-medium">{safeDate(latest.updated_date || latest.created_date)}</dd></div>}
          </dl>
        </CardContent>
      </Card>

      {/* Description / notes */}
      <Card className="lg:col-span-3 rounded-xl border-border">
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><StickyNote className="h-4 w-4 text-primary" />Scope & notes</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs font-medium text-muted-foreground mb-1">Description / scope</p><p className="whitespace-pre-wrap text-foreground">{bid.scope_of_work || bid.description || 'No description yet.'}</p></div>
          <div><p className="text-xs font-medium text-muted-foreground mb-1">Notes</p><p className="whitespace-pre-wrap text-foreground">{bid.notes || '—'}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
