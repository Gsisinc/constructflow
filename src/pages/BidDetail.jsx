import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, DollarSign, FileText, Trash2, TrendingUp, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import BidUploader from '@/components/bids/BidUploader';
import BidRequirements from '@/components/bids/BidRequirements';
import BidToProject from '@/components/bids/BidToProject';
import DrawingAnalysisTab from '@/components/bids/DrawingAnalysisTab';
import DrawingDesignerTab from '@/components/bids/DrawingDesignerTab';

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  analyzing: 'bg-purple-100 text-purple-800',
  estimating: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-green-100 text-green-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800',
  declined: 'bg-slate-100 text-slate-800'
};

export default function BidDetail() {
  const [user, setUser] = useState(null);
  const [bidId, setBidId] = useState(null);
  const [showRfqDialog, setShowRfqDialog] = useState(false);
  const [rfqEmails, setRfqEmails] = useState('');
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

  const analysis = useMemo(() => normalizeAiAnalysis(bid?.ai_analysis, documents), [bid?.ai_analysis, documents]);

  if (!bid || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading...</p>
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
            <h1 className="text-2xl font-bold text-slate-900">{bid.title || bid.project_name || 'Untitled Bid'}</h1>
            <p className="text-sm text-slate-600 mt-1">{bid.agency || bid.client_name || 'Unknown Agency'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {bid.status === 'won' && <BidToProject bid={bid} organizationId={user.organization_id} />}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (confirm('Delete this bid?')) deleteMutation.mutate(bid.id);
            }}
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="h-8 w-8 text-amber-600" />} label="Due Date" value={bid.due_date ? format(new Date(bid.due_date), 'MMM d, yyyy') : 'Not set'} />
        <StatCard icon={<DollarSign className="h-8 w-8 text-green-600" />} label="Estimated Value" value={`$${Number(bid.estimated_value || bid.value || 0).toLocaleString()}`} />
        <StatCard icon={<TrendingUp className="h-8 w-8 text-blue-600" />} label="Win Probability" value={`${Number(bid.win_probability || 0)}%`} />
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <Badge className={statusColors[bid.status] || 'bg-slate-100 text-slate-700'}>{bid.status || 'new'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full overflow-x-auto flex flex-nowrap gap-1 p-1 h-auto bg-slate-100 rounded-lg sm:inline-flex">
          <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>
          <TabsTrigger value="boq" className="flex-shrink-0">BOQ</TabsTrigger>
          <TabsTrigger value="requirements" className="flex-shrink-0">Requirements</TabsTrigger>
          <TabsTrigger value="documents" className="flex-shrink-0">Documents</TabsTrigger>
          <TabsTrigger value="drawings" className="flex-shrink-0">Drawing Analysis</TabsTrigger>
          <TabsTrigger value="designer" className="flex-shrink-0">Designer</TabsTrigger>
          <TabsTrigger value="analysis" className="flex-shrink-0">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Bid Overview</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{bid.description || 'No description yet.'}</p>
              {bid.location && <p className="text-sm text-slate-600"><strong>Location:</strong> {bid.location}</p>}
              {bid.url && (
                <a href={bid.url} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-600 hover:underline block">
                  View original posting →
                </a>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boq" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Bill of Quantities</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">Estimate line items for this bid. Apply takeoff from Drawing Analysis to populate.</p>
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
                <p className="text-sm text-slate-500">No estimates yet. Run Drawing Analysis and click &quot;Apply this takeoff to bid estimate&quot;, or add an estimate from the Estimates page.</p>
              ) : (
                <div className="space-y-4">
                  {bidEstimates
                    .sort((a, b) => (b.version || 0) - (a.version || 0))
                    .map((est) => (
                      <div key={est.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                          Version {est.version ?? 1} · Subtotal ${Number(est.subtotal || 0).toLocaleString()} · Total bid ${Number(est.total_bid_amount || 0).toLocaleString()}
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-slate-100 dark:bg-slate-800">
                              <th className="text-left p-2">Description</th>
                              <th className="text-right p-2">Qty</th>
                              <th className="text-right p-2">Unit</th>
                              <th className="text-right p-2">Category</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(est.line_items || []).map((line, idx) => (
                              <tr key={idx} className="border-b border-slate-100">
                                <td className="p-2">{line.description}</td>
                                <td className="p-2 text-right">{line.quantity}</td>
                                <td className="p-2 text-right">{line.unit || 'ea'}</td>
                                <td className="p-2 text-right text-slate-500">{line.category || '—'}</td>
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
              <h3 className="text-sm font-semibold text-slate-900">Uploaded Documents</h3>
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium">{doc.name || 'Untitled document'}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(doc.file_size)}</p>
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

        <TabsContent value="drawings" className="space-y-4">
          <DrawingAnalysisTab
            bid={bid}
            organizationId={user.organization_id}
            onAnalysisSaved={() => {
              queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
              queryClient.invalidateQueries({ queryKey: ['bidDocuments', bidId] });
              refetchBid();
            }}
          />
        </TabsContent>

        <TabsContent value="designer" className="space-y-4">
          <DrawingDesignerTab
            bid={bid}
            onDesignerSaved={() => {
              queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
              refetchBid();
            }}
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {analysis.hasAnyData ? (
            <div className="space-y-4">
              {analysis.complexityScore !== null && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Complexity Score</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-amber-600">{analysis.complexityScore}/10</div>
                      <p className="text-sm text-slate-600">{analysis.complexityLabel}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {analysis.riskFactors.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Risk Factors</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.riskFactors.map((risk, idx) => (
                        <li key={`${risk}-${idx}`} className="flex items-start gap-2 text-sm"><span className="text-red-500 mt-0.5">⚠</span><span>{risk}</span></li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {analysis.recommendedMarkup !== null && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Recommended Markup</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold text-green-600">{analysis.recommendedMarkup}%</p></CardContent>
                </Card>
              )}

              {analysis.keyPoints.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Key Points</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-slate-700 list-disc ml-5">
                      {analysis.keyPoints.map((point, idx) => <li key={`${point}-${idx}`}>{point}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {analysis.deadlines.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Deadlines</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-slate-700 list-disc ml-5">
                      {analysis.deadlines.map((deadline, idx) => <li key={`${deadline}-${idx}`}>{deadline}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {analysis.extractedRequirements.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Extracted Requirements</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-slate-700 list-disc ml-5">
                      {analysis.extractedRequirements.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                <p className="text-sm">No AI analysis available yet.</p>
                <p className="text-xs mt-2">Upload documents to generate insights.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showRfqDialog} onOpenChange={setShowRfqDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send RFQ to vendors</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Enter vendor email addresses (one per line). They will receive a request for quote for this bid.</p>
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
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}