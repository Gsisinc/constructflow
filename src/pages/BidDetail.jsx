import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, DollarSign, FileText, Trash2, TrendingUp } from 'lucide-react';
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
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="drawings">Drawing Analysis</TabsTrigger>
          <TabsTrigger value="designer">Designer</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
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