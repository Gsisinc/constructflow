import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, DollarSign, FileText, MoreHorizontal, Trash2, TrendingUp, Send, Upload, ArrowDownToLine, Copy, Download, LayoutDashboard, ListChecks, Boxes, Calculator, ShoppingCart, ClipboardList, FolderOpen, FileImage, Building2, MapPin, CalendarClock, Layers, CircleDollarSign, PieChart, StickyNote, Lock, ExternalLink, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fmtDollars } from '@/lib/money';
import BidUploader from '@/components/bids/BidUploader';
import BidRequirements from '@/components/bids/BidRequirements';
import BidToProject from '@/components/bids/BidToProject';
import BidDetailsEditor from '@/components/bids/BidDetailsEditor';
import BidDrawings from '@/components/bids/BidDrawings';
import CompanyStandardsFloors from '@/components/companyStandards/CompanyStandardsFloors';
import BidPhaseWorkspace from '@/components/bids/BidPhaseWorkspace';
import BidStatusSelect from '@/components/bids/BidStatusSelect';
import EstimateEditor, { computeEstimateTotals, marginBand } from '@/components/bids/EstimateEditor';
import { fmtDate } from '@/lib/dates';
import RecordAuditInfo from '@/components/ui/RecordAuditInfo';
import { Input } from '@/components/ui/input';
import { stampUpdate } from '@/lib/audit';
import { convertBidToProject } from '@/lib/bidConversion';

const statusColors = {
  review: 'bg-primary/15 text-primary',
  intake: 'bg-muted text-foreground',
  off_pricing: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300',
  user_analyzing: 'bg-accent text-accent-foreground',
  estimated: 'bg-muted text-foreground',
  submitted: 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300',
  won: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  lost: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300',
  no_bid: 'bg-muted text-muted-foreground',
  closed: 'bg-muted text-foreground'
};

// Valid bid date: yyyy-MM-dd..., year >= 1990, parses. Rejects '0000-00-00' and other junk.
const isValidDateStr = (v) => {
  if (!v) return false;
  const s = String(v);
  if (!/^\d{4}-\d{2}-\d{2}/.test(s) || Number(s.slice(0, 4)) < 1990) return false;
  return !Number.isNaN(new Date(s.length <= 10 ? `${s}T00:00:00` : s).getTime());
};

// Bid folders — same constant as Bids.jsx (duplicated; no shared file). Path stored in BidOpportunity.folder.
export const BID_FOLDER_TREE = [
  { name: 'Fire Alarm', children: ['ITM', 'Monitoring', 'Design', 'Install'] },
  { name: 'Low Voltage', children: [] },
];
const BID_FOLDER_OPTIONS = BID_FOLDER_TREE.flatMap((r) => [
  { value: r.name, label: r.name },
  ...r.children.map((c) => ({ value: `${r.name}/${c}`, label: `${r.name} › ${c}` })),
]);
const folderLabel = (f) => String(f || '').split('/').join(' › ');

// Editable bid text fields (all exist on BidOpportunity.jsonc as type string).
const EDIT_FIELDS = [
  { key: 'client_name', label: 'Client / GC' },
  { key: 'agency', label: 'Agency' },
  { key: 'location', label: 'Location' },
  { key: 'source', label: 'Source' },
  { key: 'folder', label: 'Folder', select: BID_FOLDER_OPTIONS },
  { key: 'notes', label: 'Notes', multiline: true },
];

export default function BidDetail() {
  const [user, setUser] = useState(null);
  const [bidId, setBidId] = useState(null);
  const [showRfqDialog, setShowRfqDialog] = useState(false);
  const [rfqEmails, setRfqEmails] = useState('');
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [editForm, setEditForm] = useState({});
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

  const { data: bidEstimates = [] } = useQuery({
    queryKey: ['bidEstimates', bidId],
    queryFn: () => base44.entities.BidEstimate.filter({ bid_opportunity_id: bidId }),
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
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.success(res.already_exists ? 'Project already exists' : 'Awarded — project auto-created');
          } catch (e) { toast.error('Auto-create project failed: ' + (e.message || '')); }
        }
      }
    },
    onError: (e) => toast.error('Status update failed: ' + (e.message || ''))
  });

  const editDetailsMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BidOpportunity.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
      queryClient.invalidateQueries({ queryKey: ['bids-all'] });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      setShowEditDetails(false);
      toast.success('Bid details saved');
    },
    onError: (e) => toast.error('Save failed: ' + (e.message || ''))
  });

  const openEditDetails = () => {
    const init = {};
    EDIT_FIELDS.forEach(({ key }) => { init[key] = bid?.[key] ?? ''; });
    setEditForm(init);
    setShowEditDetails(true);
  };

  const saveEditDetails = () => {
    const changed = {};
    EDIT_FIELDS.forEach(({ key }) => {
      const next = editForm[key] ?? '';
      if (next !== (bid?.[key] ?? '')) changed[key] = next;
    });
    if (!Object.keys(changed).length) { setShowEditDetails(false); return; }
    editDetailsMutation.mutate({ id: bid.id, data: changed });
  };

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
          <Button variant="outline" onClick={openEditDetails} className="gap-2 min-h-[44px] sm:min-h-0" title="Edit details">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Edit details</span>
          </Button>
          {bid.linked_project_id ? (
            <Button onClick={() => navigate(createPageUrl('ProjectDetail') + `?id=${bid.linked_project_id}`)} className="gap-2">
              <ArrowLeft className="h-4 w-4 rotate-180" />
              View Project
            </Button>
          ) : bid.status === 'won' ? (
            <BidToProject bid={bid} organizationId={user.organization_id} />
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                className="text-red-600 dark:text-red-300 focus:text-red-600"
                onClick={() => {
                  if (confirm('Delete this bid?')) deleteMutation.mutate(bid.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete bid
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="h-8 w-8 text-amber-600 dark:text-amber-300" />} label="Due Date" value={isValidDateStr(bid.due_date) ? format(new Date(String(bid.due_date).slice(0, 10) + 'T00:00:00'), 'MMM d, yyyy') : 'Not set'} />
        <StatCard icon={<DollarSign className="h-8 w-8 text-green-600 dark:text-green-300" />} label="Estimated Value" value={fmtDollars(bid.estimated_value || bid.value || 0)} />
        <StatCard icon={<TrendingUp className="h-8 w-8 text-primary" />} label="Win Probability" value={`${Number(bid.win_probability || 0)}%`} />
        <div className="md:col-span-2 lg:col-span-4">
          <div className="bg-card rounded-xl border border-border px-4 py-3">
            <RecordAuditInfo record={bid} />
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[bid.status] || 'bg-muted text-foreground'}>{(bid.status || 'new').replace('_', ' ')}</Badge>
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
          <TabsTrigger value="boq" className="flex-shrink-0 gap-1.5"><Boxes className="h-4 w-4" />BOQ</TabsTrigger>
          <TabsTrigger value="estimate" className="flex-shrink-0 gap-1.5"><Calculator className="h-4 w-4" />Estimate</TabsTrigger>
          <TabsTrigger value="procurement" className="flex-shrink-0 gap-1.5"><ShoppingCart className="h-4 w-4" />Procurement</TabsTrigger>
          <TabsTrigger value="requirements" className="flex-shrink-0 gap-1.5"><ClipboardList className="h-4 w-4" />Requirements</TabsTrigger>
          <TabsTrigger value="documents" className="flex-shrink-0 gap-1.5"><FolderOpen className="h-4 w-4" />Documents</TabsTrigger>
          <TabsTrigger value="bid-drawings" className="flex-shrink-0 gap-1.5"><FileImage className="h-4 w-4" />Drawings</TabsTrigger>
          {/* Drawing Analysis now lives under Estimate; Designer and AI Analysis tabs removed (UI only). */}
        </TabsList>

        <TabsContent value="phases" className="space-y-4">
          <BidPhaseWorkspace bid={bid} organizationId={user.organization_id} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <BidOverviewPanel bid={bid} documents={documents} statusColors={statusColors} />
          <BidDetailsEditor bid={bid} />
          <CompanyStandardsFloors />
        </TabsContent>

        <TabsContent value="boq" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Bill of Quantities</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Estimate line items for this bid. Apply a takeoff from Estimate &gt; Blueprints & Drawing Analysis to populate.</p>
                </div>
                {bidEstimates.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowRfqDialog(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send RFQ
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {bidEstimates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No estimates yet. Open the Estimate tab to start one from scratch or apply a drawing takeoff.</p>
              ) : (
                <div className="space-y-4">
                  {bidEstimates
                    .sort((a, b) => (b.version || 0) - (a.version || 0))
                    .map((est) => (
                      <div key={est.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-muted px-4 py-2 text-sm font-medium text-foreground">
                          Version {est.version ?? 1} · Subtotal {fmtDollars(est.subtotal || 0)} · Total bid {fmtDollars(est.total_bid_amount || 0)}
                        </div>
                        <table className="w-full sm:w-auto text-sm">
                          <thead>
                            <tr className="border-b bg-muted">
                              <th className="text-left p-2">Description</th>
                              <th className="text-right p-2">Qty</th>
                              <th className="text-right p-2">Unit</th>
                              <th className="text-right p-2">Category</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(est.line_items || []).map((line, idx) => (
                              <tr key={idx} className="border-b border-border">
                                <td className="p-2">{line.description}</td>
                                <td className="p-2 text-right">{line.quantity}</td>
                                <td className="p-2 text-right">{line.unit || 'ea'}</td>
                                <td className="p-2 text-right text-muted-foreground">{line.category || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estimate" className="space-y-4">
          <EstimateEditor bidId={bid.id} organizationId={user.organization_id} bidTitle={bid.title || bid.project_name || 'Bid'} bid={bid} />
        </TabsContent>
        {typeof window !== 'undefined' && true && (
          <TabsContent value="procurement" className="space-y-4">
            <ProcurementTab bidId={bid.id} bidTitle={bid.title || bid.project_name || 'Bid'} />
          </TabsContent>
        )}

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

      <Dialog open={showEditDetails} onOpenChange={setShowEditDetails}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit bid details</DialogTitle>
            <DialogDescription>Update client, agency, location, source, folder and notes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {EDIT_FIELDS.map(({ key, label, multiline, select }) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`edit-${key}`}>{label}</Label>
                {select ? (
                  <select id={`edit-${key}`} className="w-full min-h-[44px] rounded-md border border-input bg-background px-3 text-sm" value={editForm[key] ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}>
                    <option value="">Unfiled</option>
                    {select.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : multiline ? (
                  <Textarea id={`edit-${key}`} rows={5} className="w-full" value={editForm[key] ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))} />
                ) : (
                  <Input id={`edit-${key}`} className="w-full min-h-[44px]" value={editForm[key] ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto min-h-[44px]" onClick={() => setShowEditDetails(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto min-h-[44px]" disabled={editDetailsMutation.isPending} onClick={saveEditDetails}>
              {editDetailsMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRfqDialog} onOpenChange={setShowRfqDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send RFQ to vendors</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Enter vendor email addresses (one per line). They will receive a request for quote for this bid.</p>
          <Label className="sr-only">Vendor emails</Label>
          <Textarea
            placeholder="vendor1@example.com&#10;vendor2@example.com"
            value={rfqEmails}
            onChange={(e) => setRfqEmails(e.target.value)}
            rows={4}
            className="font-mono text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRfqDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const emails = rfqEmails.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
                if (emails.length === 0) {
                  toast.error('Enter at least one email');
                  return;
                }
                toast.success(`RFQ sent to ${emails.length} vendor${emails.length === 1 ? '' : 's'}. (In production this would email the BOQ.)`);
                setRfqEmails('');
                setShowRfqDialog(false);
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Send RFQ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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

// ===== Procurement tab (v2, additions only; dev/preview only — hidden on mygsis.com) =====
// Draft only — Kemar sends. Nothing is emailed from the app. No new entity: quote info lives on
// BidEstimate.line_items[] (price_source, quote_ref, supplier_name). No deletes.

// Verbatim copy of EstimateEditor.jsx lines 176-200 (calculateTotals + its effective % inputs),
// wrapped so it runs on a plain estimate object instead of EstimateForm state.
function procCalculateTotals(formData) {
  const hasDollarLines = (formData.line_items || []).some((i) => i.pricing_type === 'dollar');
  const effectiveOverheadPct = hasDollarLines ? 0 : (parseFloat(formData.overhead_percent) || 0);
  const effectiveProfitPct = hasDollarLines ? 0 : (parseFloat(formData.profit_margin_percent) || 0);

  const calculateTotals = () => {
    const laborCost = (parseFloat(formData.labor_hours) || 0) * (parseFloat(formData.labor_rate) || 0);
    const materialCost = (formData.line_items || [])
      .reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0);
    
    const subtotal = laborCost + materialCost + (parseFloat(formData.equipment_cost) || 0) + (parseFloat(formData.subcontractor_cost) || 0);
    const contingencyAmount = subtotal * ((parseFloat(formData.contingency_percent) || 0) / 100);
    const overhead = subtotal * (effectiveOverheadPct / 100);
    const profit = subtotal * (effectiveProfitPct / 100);
    const total = subtotal + overhead + profit + contingencyAmount;

    return {
      labor_cost: laborCost,
      material_cost: materialCost,
      subtotal,
      contingency_amount: contingencyAmount,
      overhead_percent: effectiveOverheadPct,
      profit_margin_percent: effectiveProfitPct,
      total_bid_amount: total
    };
  };

  return calculateTotals();
}

const PROC_SIGNATURE = 'Thank you,\n\nKemar McKenzie, President/CEO\nGolden State Integrated Systems | CA License #1150625 (C7, C10)\n601 Brannan Island Road, Isleton, CA 95641 | 209-200-1073 | gsistech.com | {{GSIS_EMAIL}}';
const PROC_TAP = 'min-h-[44px] md:min-h-0';
const PROC_FIELD = 'h-9 w-full rounded-md border border-border bg-background text-foreground text-sm px-2';

// Stable line key for Insert mapping (NOT array index).
// Evidence: EstimateEditor.addLineItem (L147-154) creates lines with no `id`; BidEstimate.jsonc
// line_items.items.properties has no `id`. Prefer `id` if present; else name + cost_code; else description.
function procLineKey(line) {
  if (line?.id != null && String(line.id).trim() !== '') return `id:${String(line.id).trim()}`;
  const name = String(line?.name ?? '').trim();
  const costCode = String(line?.cost_code ?? '').trim();
  if (name || costCode) return `nc:${name}\u0000${costCode}`;
  return `d:${String(line?.description ?? '').trim()}`;
}

function procLineLabel(line) {
  if (!line) return '(unknown line)';
  return line.description || line.name || line.cost_code || '(unnamed line)';
}

function procFindKeyMatches(items, key) {
  const matches = [];
  (items || []).forEach((item, idx) => {
    if (procLineKey(item) === key) matches.push({ item, idx });
  });
  return matches;
}

function procBuildDraft({ template, supplierName, bidTitle, lines }) {
  const rep = '{{REP_NAME}}';
  const header = 'Line | Item / description | Qty | Unit';
  const table = lines.map((l) => `${l._idx + 1} | ${l.description || l.name || ''} | ${l.quantity ?? ''} | ${l.unit || 'ea'}`).join('\n');
  let subject; let body;
  if (template === 'follow_up') {
    subject = `Follow-up: RFQ ${bidTitle} - quote needed by {{QUOTE_NEEDED_BY}}`;
    body = `Hi ${rep},\n\nFollowing up on our request for quote for ${bidTitle}. Our bid is due {{BID_DUE_DATE}}, so we need your quote by {{QUOTE_NEEDED_BY}}.\n\nStill open:\n${header}\n${table}`;
  } else {
    subject = `RFQ - ${bidTitle} - materials - bid due {{BID_DUE_DATE}}`;
    body = `Hi ${rep},\n\nGolden State Integrated Systems requests a quote from ${supplierName} for the materials below.\n\n- Job: ${bidTitle}\n- Our account #: {{KEMAR_ACCOUNT_NO}}\n- Quote needed by: {{QUOTE_NEEDED_BY}}\n- Deliver to: {{DELIVERY_ADDRESS}}\n\n${header}\n${table}\n\nFor each line please give: unit price, extended price, lead time, freight, and quote validity date. Please note any substitutions clearly.`;
  }
  return { subject, text: `To: ${supplierName}\nSubject: ${subject}\n\n${body}\n\n${PROC_SIGNATURE}\n` };
}

function ProcurementTab({ bidId, bidTitle }) {
  const queryClient = useQueryClient();
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);

  // Same query key as EstimateEditor, so caches stay shared.
  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ['bidEstimates', bidId],
    queryFn: () => base44.entities.BidEstimate.filter({ bid_opportunity_id: bidId }),
    enabled: !!bidId
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list()
  });

  // EstimateEditor edits estimates[0] (EstimateEditor.jsx line 87) — target the same record.
  const estimate = estimates[0] || null;
  const allLines = useMemo(() => (estimate?.line_items || []).map((l, idx) => ({ ...l, _idx: idx, _key: procLineKey(l) })), [estimate]);
  const anyTagged = allLines.some((l) => String(l.category || '').toLowerCase() === 'material');
  const matLines = anyTagged ? allLines.filter((l) => String(l.category || '').toLowerCase() === 'material') : allLines;

  // ---------- Request Quote (draft only) ----------
  const [rfqOpen, setRfqOpen] = useState(false);
  const [rfqSupplier, setRfqSupplier] = useState('');
  const [rfqTemplate, setRfqTemplate] = useState('rfq');
  const [rfqLines, setRfqLines] = useState([]);
  const draft = useMemo(() => procBuildDraft({
    template: rfqTemplate,
    supplierName: rfqSupplier || '{{SUPPLIER_NAME}}',
    bidTitle: bidTitle || 'Bid',
    lines: matLines.filter((l) => rfqLines.includes(l._idx))
  }), [rfqTemplate, rfqSupplier, bidTitle, matLines, rfqLines]);

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft.text);
      toast.success('Draft copied — Kemar sends');
    } catch (e) {
      toast.error('Copy failed: ' + (e?.message || ''));
    }
  };
  const downloadDraft = () => {
    const blob = new Blob([draft.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfq-${(bidTitle || 'bid').replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${(rfqSupplier || 'supplier').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Draft downloaded — Kemar sends');
  };

  // ---------- Supplier quote upload + manual mapping (local state until Insert) ----------
  const [quoteFile, setQuoteFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [mapSupplier, setMapSupplier] = useState('');
  const [mapRef, setMapRef] = useState('');
  const [mapSource, setMapSource] = useState('rep_quote');
  const [mapCosts, setMapCosts] = useState({}); // stable line key -> new unit_cost (string)
  const fileInputRef = useRef(null);

  const uploadQuote = async () => {
    if (submitting.current || !quoteFile) return;
    submitting.current = true; setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: quoteFile });
      setFileUrl(file_url);
      toast.success('Quote file uploaded — map prices below');
    } catch (e) {
      toast.error('Upload failed: ' + (e?.message || ''));
    } finally {
      submitting.current = false; setBusy(false);
    }
  };

  // quote_ref storage choice: "REF | file_url" when a file was uploaded, else just REF.
  const quoteRefValue = fileUrl ? `${mapRef.trim()} | ${fileUrl}` : mapRef.trim();

  // Resolve mapped keys against the current estimate (preview). Exact unique key match only.
  const { appliedChanges, skippedChanges, pendingCount } = useMemo(() => {
    const items = estimate?.line_items || [];
    const applied = [];
    const skipped = [];
    let pending = 0;
    Object.entries(mapCosts).forEach(([key, v]) => {
      if (v === '' || v == null || !Number.isFinite(parseFloat(v))) return;
      pending += 1;
      const newCost = parseFloat(v);
      const matches = procFindKeyMatches(items, key);
      const fromUi = allLines.find((l) => l._key === key);
      const label = procLineLabel(fromUi || matches[0]?.item);
      if (matches.length === 1) {
        const { item: line, idx } = matches[0];
        applied.push({ key, idx, line, oldCost: line.unit_cost, newCost, label });
      } else {
        skipped.push({
          key,
          label,
          reason: matches.length === 0 ? 'no matching line' : 'multiple matching lines'
        });
      }
    });
    return { appliedChanges: applied, skippedChanges: skipped, pendingCount: pending };
  }, [mapCosts, estimate, allLines]);

  // Build new line_items for preview; total_cost as EstimateEditor.updateLineItem (lines 161-165).
  // Never reorder, add, or delete — only overwrite fields on exact matches.
  const newLineItems = useMemo(() => {
    const items = [...(estimate?.line_items || [])];
    appliedChanges.forEach((c) => {
      items[c.idx] = {
        ...items[c.idx],
        unit_cost: c.newCost,
        price_source: mapSource,
        quote_ref: quoteRefValue,
        supplier_name: mapSupplier.trim()
      };
      const qty = parseFloat(items[c.idx].quantity) || 0;
      const cost = parseFloat(items[c.idx].unit_cost) || 0;
      items[c.idx].total_cost = qty * cost;
    });
    return items;
  }, [estimate, appliedChanges, mapSource, quoteRefValue, mapSupplier]);

  const oldTotals = estimate ? procCalculateTotals(estimate) : null;
  const newTotals = estimate ? procCalculateTotals({ ...estimate, line_items: newLineItems }) : null;

  // ---------- Insert Procurement Prices ----------
  const [applyOpen, setApplyOpen] = useState(false);
  const insertPrices = async () => {
    if (submitting.current || !estimate || pendingCount === 0) return;
    submitting.current = true; setBusy(true);
    try {
      // Re-read the current estimate; resolve each mapped key against fresh line_items.
      const freshList = await base44.entities.BidEstimate.filter({ bid_opportunity_id: bidId });
      const fresh = freshList?.[0] || null;
      if (!fresh?.id) {
        toast.error('Insert failed: estimate not found');
        return;
      }
      const items = [...(fresh.line_items || [])];
      const applied = [];
      const skipped = [];
      Object.entries(mapCosts).forEach(([key, v]) => {
        if (v === '' || v == null || !Number.isFinite(parseFloat(v))) return;
        const newCost = parseFloat(v);
        const matches = procFindKeyMatches(items, key);
        const fromUi = allLines.find((l) => l._key === key);
        const label = procLineLabel(fromUi || matches[0]?.item);
        if (matches.length !== 1) {
          skipped.push({
            key,
            label,
            reason: matches.length === 0 ? 'no matching line' : 'multiple matching lines'
          });
          return;
        }
        const idx = matches[0].idx;
        items[idx] = {
          ...items[idx],
          unit_cost: newCost,
          price_source: mapSource,
          quote_ref: quoteRefValue,
          supplier_name: mapSupplier.trim()
        };
        const qty = parseFloat(items[idx].quantity) || 0;
        const cost = parseFloat(items[idx].unit_cost) || 0;
        items[idx].total_cost = qty * cost;
        applied.push({ key, idx, label, newCost });
      });

      const skippedSummary = skipped.length
        ? ` Skipped ${skipped.length}: ${skipped.map((s) => `${s.label} (${s.reason})`).join('; ')}`
        : '';

      if (applied.length === 0) {
        toast.error(`No lines updated.${skippedSummary}`);
        return;
      }

      // Same payload shape as EstimateEditor.handleSave (lines 202-209).
      const formData = { ...fresh, line_items: items };
      const totals = procCalculateTotals(formData);
      const data = {
        ...formData,
        ...totals,
        version: (formData.version || 0) + (formData.id ? 1 : 0)
      };
      // Same as EstimateEditor updateMutation.mutationFn (lines 53-62).
      const bidIdForSync = bidId;
      await base44.entities.BidEstimate.update(data.id, await stampUpdate(data));
      if (Number.isFinite(data.total_bid_amount)) {
        await base44.entities.BidOpportunity.update(bidIdForSync, { estimated_value: data.total_bid_amount });
        const bids = await base44.entities.BidOpportunity.filter({ id: bidIdForSync }, { fields: ['linked_project_id'] });
        const pid = bids?.[0]?.linked_project_id;
        if (pid) await base44.entities.Project.update(pid, { budget: data.total_bid_amount });
      }
      // Same invalidations as EstimateEditor updateMutation.onSuccess (lines 65-69).
      queryClient.invalidateQueries({ queryKey: ['bidEstimates', bidId] });
      queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
      queryClient.invalidateQueries({ queryKey: ['bids-all'] });
      queryClient.invalidateQueries({ queryKey: ['dash-bids-list'] });
      queryClient.invalidateQueries({ queryKey: ['org-projects'] });
      toast.success(`Inserted ${applied.length} procurement price(s) into the estimate.${skippedSummary}`);
      setApplyOpen(false);
      setMapCosts({});
    } catch (e) {
      toast.error('Insert failed: ' + (e?.message || ''));
    } finally {
      submitting.current = false; setBusy(false);
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading estimate…</p>;

  if (!estimate) {
    return (
      <Card className="bg-card border-border rounded-xl">
        <CardContent className="py-8 text-sm text-muted-foreground">No estimate for this bid yet. Create one on the Estimate tab.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      <Card className="bg-card border-border rounded-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <CardTitle className="text-foreground">Procurement — Material lines</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Estimate version {estimate.version ?? 1}</p>
            </div>
            <div className="text-left md:text-right text-sm">
              <div className="text-muted-foreground">Subtotal {fmtDollars(estimate.subtotal || 0)}</div>
              <div className="font-semibold text-foreground">Total bid {fmtDollars(estimate.total_bid_amount || 0)}</div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-2 pt-2">
            <Button variant="default" className={PROC_TAP} disabled={matLines.length === 0} onClick={() => setRfqOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />Request Quote
            </Button>
            <Button className={`bg-gold-500 text-navy-900 hover:bg-gold-500/90 ${PROC_TAP}`} disabled={busy || pendingCount === 0} onClick={() => setApplyOpen(true)}>
              <ArrowDownToLine className="h-4 w-4 mr-2" />Insert Procurement Prices
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="md:hidden space-y-3">
            {matLines.map((l) => (
              <div key={l._idx} className="rounded-xl border border-border bg-card p-3 space-y-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-foreground">{l._idx + 1}. {l.description || l.name}</div>
                  {l.price_source ? <Badge variant="outline">{l.price_source}</Badge> : null}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><div className="text-xs text-muted-foreground">Qty / unit</div><div className="text-foreground">{l.quantity} {l.unit || 'ea'}</div></div>
                  <div><div className="text-xs text-muted-foreground">Unit cost</div><div className="text-foreground">{l.unit_cost ? fmtDollars(l.unit_cost) : <Badge variant="destructive">MISSING</Badge>}</div></div>
                  <div><div className="text-xs text-muted-foreground">Supplier</div><div className="text-foreground break-words">{l.supplier_name || '—'}</div></div>
                  <div><div className="text-xs text-muted-foreground">Source</div><div className="text-foreground">{l.price_source || '—'}</div></div>
                  <div className="col-span-2"><div className="text-xs text-muted-foreground">Quote ref</div><div className="text-foreground break-all">{l.quote_ref || '—'}</div></div>
                </div>
                <div>
                  <Label htmlFor={`proc-m-cost-${l._idx}`}>New unit cost</Label>
                  <Input
                    id={`proc-m-cost-${l._idx}`}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    className={`w-full ${PROC_TAP}`}
                    placeholder="—"
                    value={mapCosts[l._key] ?? ''}
                    onChange={(e) => setMapCosts((m) => ({ ...m, [l._key]: e.target.value }))}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Description</th>
                <th className="text-right p-2">Qty</th>
                <th className="text-left p-2">Unit</th>
                <th className="text-right p-2">Unit cost</th>
                <th className="text-left p-2">Supplier</th>
                <th className="text-left p-2">Source</th>
                <th className="text-left p-2">Quote ref</th>
                <th className="text-right p-2">New unit cost</th>
              </tr>
            </thead>
            <tbody>
              {matLines.map((l) => (
                <tr key={l._idx} className="border-b border-border">
                  <td className="p-2 text-muted-foreground">{l._idx + 1}</td>
                  <td className="p-2 text-foreground">{l.description || l.name}</td>
                  <td className="p-2 text-right">{l.quantity}</td>
                  <td className="p-2">{l.unit || 'ea'}</td>
                  <td className="p-2 text-right">{l.unit_cost ? fmtDollars(l.unit_cost) : <Badge variant="destructive">MISSING</Badge>}</td>
                  <td className="p-2">{l.supplier_name || '—'}</td>
                  <td className="p-2">{l.price_source ? <Badge variant="outline">{l.price_source}</Badge> : '—'}</td>
                  <td className="p-2 max-w-[200px] truncate" title={l.quote_ref || ''}>{l.quote_ref || '—'}</td>
                  <td className="p-2 text-right">
                    <Input
                      type="number"
                      step="0.01"
                      className={`w-28 ml-auto ${PROC_TAP}`}
                      placeholder="—"
                      value={mapCosts[l._key] ?? ''}
                      onChange={(e) => setMapCosts((m) => ({ ...m, [l._key]: e.target.value }))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border rounded-xl">
        <CardHeader><CardTitle className="text-foreground">Supplier quote → mapping</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <Label>Quote file (PDF/XLSX/CSV, optional)</Label>
              <Input ref={fileInputRef} type="file" accept=".pdf,.xlsx,.csv" className={PROC_TAP} onChange={(e) => { setQuoteFile(e.target.files?.[0] || null); setFileUrl(''); }} />
            </div>
            <Button variant="outline" className={PROC_TAP} disabled={busy || !quoteFile} onClick={uploadQuote}>
              <Upload className="h-4 w-4 mr-2" />{fileUrl ? 'Uploaded' : 'Upload file'}
            </Button>
          </div>
          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline text-foreground">Open uploaded quote</a>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Supplier name</Label>
              <Input list="proc-suppliers" className={PROC_TAP} value={mapSupplier} onChange={(e) => setMapSupplier(e.target.value)} />
              <datalist id="proc-suppliers">{suppliers.map((s) => <option key={s.id} value={s.name} />)}</datalist>
            </div>
            <div>
              <Label>Quote ref</Label>
              <Input className={PROC_TAP} value={mapRef} onChange={(e) => setMapRef(e.target.value)} />
            </div>
            <div>
              <Label>Price source</Label>
              <select className={`${PROC_FIELD} ${PROC_TAP}`} value={mapSource} onChange={(e) => setMapSource(e.target.value)}>
                <option value="rep_quote">rep_quote</option>
                <option value="web_store">web_store</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Enter the new unit cost on each line in the table above. Supplier, quote ref and source apply to every line you price. Nothing is saved until Insert Procurement Prices is confirmed. Lines are matched by stable key (name + cost_code, or description), not array index.</p>
        </CardContent>
      </Card>

      <Dialog open={rfqOpen} onOpenChange={setRfqOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>Request Quote</DialogTitle>
            <DialogDescription>Draft only — Kemar sends. Nothing is emailed or saved by the app.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Supplier</Label>
              <Input list="proc-suppliers" className={PROC_TAP} value={rfqSupplier} onChange={(e) => setRfqSupplier(e.target.value)} />
            </div>
            <div>
              <Label>Template</Label>
              <select className={`${PROC_FIELD} ${PROC_TAP}`} value={rfqTemplate} onChange={(e) => setRfqTemplate(e.target.value)}>
                <option value="rfq">RFQ</option>
                <option value="follow_up">Follow-up</option>
              </select>
            </div>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto border border-border rounded-md p-2">
            {matLines.map((l) => (
              <label key={l._idx} className="flex items-center gap-3 min-h-[44px] cursor-pointer text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0"
                  checked={rfqLines.includes(l._idx)}
                  onChange={(e) => setRfqLines((s) => (e.target.checked ? [...s, l._idx] : s.filter((x) => x !== l._idx)))}
                />
                {l._idx + 1}. {l.description || l.name} — {l.quantity} {l.unit || 'ea'}
              </label>
            ))}
          </div>
          <Label>Preview</Label>
          <Textarea readOnly rows={14} className="font-mono text-xs bg-background" value={draft.text} />
          <DialogFooter className="flex flex-col md:flex-row gap-2 md:items-center">
            <span className="text-xs text-muted-foreground md:mr-auto">Draft only — Kemar sends</span>
            <Button variant="outline" className={PROC_TAP} disabled={rfqLines.length === 0} onClick={copyDraft}>
              <Copy className="h-4 w-4 mr-2" />Copy to clipboard
            </Button>
            <Button variant="outline" className={PROC_TAP} disabled={rfqLines.length === 0} onClick={downloadDraft}>
              <Download className="h-4 w-4 mr-2" />Download .txt
            </Button>
          </DialogFooter>
          <div className="md:hidden sticky bottom-0 -mx-6 -mb-6 px-6 py-3 bg-card border-t border-border">
            <Button variant="outline" className="w-full min-h-[44px]" onClick={() => setRfqOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>Insert Procurement Prices</DialogTitle>
            <DialogDescription>Updates the estimate lines below and recomputes totals the same way the Estimate tab does. Nothing is deleted. Lines are matched by stable key; unmatched or ambiguous keys are skipped.</DialogDescription>
          </DialogHeader>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-2">Line</th>
                <th className="text-right p-2">Old unit cost</th>
                <th className="text-right p-2">New unit cost</th>
                <th className="text-right p-2">Old ext.</th>
                <th className="text-right p-2">New ext.</th>
              </tr>
            </thead>
            <tbody>
              {appliedChanges.map((c) => (
                <tr key={c.key} className="border-b border-border">
                  <td className="p-2">{c.idx + 1}. {c.line.description || c.line.name}</td>
                  <td className="p-2 text-right">{c.oldCost ? fmtDollars(c.oldCost) : 'MISSING'}</td>
                  <td className="p-2 text-right font-medium">{fmtDollars(c.newCost)}</td>
                  <td className="p-2 text-right">{fmtDollars(c.line.total_cost || 0)}</td>
                  <td className="p-2 text-right font-medium">{fmtDollars(newLineItems[c.idx]?.total_cost || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {skippedChanges.length > 0 && (
            <div className="text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/40 rounded-md p-3 space-y-1">
              <div className="font-medium">Skipped {skippedChanges.length} line(s) — no unique key match:</div>
              <ul className="list-disc pl-5">
                {skippedChanges.map((s) => (
                  <li key={s.key}>{s.label} — {s.reason}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="text-sm text-foreground space-y-1">
            <div>Supplier: {mapSupplier || '—'} · Source: {mapSource} · Quote ref: {quoteRefValue || '—'}</div>
            <div>Subtotal: {fmtDollars(oldTotals?.subtotal || 0)} → <span className="font-semibold">{fmtDollars(newTotals?.subtotal || 0)}</span></div>
            <div>Total bid: {fmtDollars(oldTotals?.total_bid_amount || 0)} → <span className="font-semibold">{fmtDollars(newTotals?.total_bid_amount || 0)}</span></div>
            <div className="text-xs text-muted-foreground">Old values are recomputed from the saved estimate. Saving also updates the bid's Estimated Value and, if linked, the project budget (same as the Estimate tab Save). Insert re-reads the estimate and updates only exact unique key matches; it never reorders, adds, or deletes lines.</div>
          </div>
          <DialogFooter className="flex flex-col md:flex-row gap-2">
            <Button variant="outline" className={PROC_TAP} onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button className={PROC_TAP} disabled={busy || appliedChanges.length === 0} onClick={insertPrices}>{busy ? 'Saving...' : 'Confirm insert'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
  if (!isValidDateStr(d)) return '—';
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
    { icon: CalendarClock, label: 'Due date', value: isValidDateStr(bid.due_date) ? safeDate(bid.due_date) : 'Not set' },
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
            {bid.source ? <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Source</dt><dd className="font-medium text-right break-words min-w-0">{bid.source}</dd></div> : null}
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Folder</dt><dd className="font-medium text-right break-words min-w-0">{bid.folder ? folderLabel(bid.folder) : 'Unfiled'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd className="font-medium">{safeDate(bid.created_date)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Due</dt><dd className="font-medium">{isValidDateStr(bid.due_date) ? safeDate(bid.due_date) : '—'}</dd></div>
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
