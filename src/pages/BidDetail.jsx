import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  CheckSquare,
  TrendingUp,
  Calendar,
  DollarSign,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import BidUploader from '@/components/bids/BidUploader';
import BidRequirements from '@/components/bids/BidRequirements';
import BidToProject from '@/components/bids/BidToProject';

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

  const { data: bid } = useQuery({
    queryKey: ['bid', bidId],
    queryFn: async () => {
      const bids = await base44.entities.BidOpportunity.filter({ id: bidId });
      return bids[0];
    },
    enabled: !!bidId
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['bidDocuments', bidId],
    queryFn: () => base44.entities.BidDocument.filter({ 
      bid_opportunity_id: bidId 
    }),
    enabled: !!bidId
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BidOpportunity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid'] });
      toast.success('Updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BidOpportunity.delete(id),
    onSuccess: () => {
      toast.success('Bid deleted');
      navigate(createPageUrl('Bids'));
    }
  });

  if (!bid || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl('Bids'))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{bid.title}</h1>
            <p className="text-sm text-slate-600 mt-1">
              {bid.agency || bid.client_name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {bid.status === 'won' && (
            <BidToProject bid={bid} organizationId={user.organization_id} />
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (confirm('Delete this bid?')) {
                deleteMutation.mutate(bid.id);
              }
            }}
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-xs text-slate-500">Due Date</p>
                <p className="text-sm font-semibold">
                  {bid.due_date ? format(new Date(bid.due_date), 'MMM d, yyyy') : 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-xs text-slate-500">Estimated Value</p>
                <p className="text-sm font-semibold">
                  ${(bid.estimated_value || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Win Probability</p>
                <p className="text-sm font-semibold">
                  {bid.win_probability || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <Badge className={statusColors[bid.status]}>
                  {bid.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bid Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Project Name</label>
                <p className="text-sm text-slate-900 mt-1">{bid.project_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <p className="text-sm text-slate-900 mt-1">{bid.description || 'No description'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Scope of Work</label>
                <p className="text-sm text-slate-900 mt-1 whitespace-pre-wrap">
                  {bid.scope_of_work || 'No scope defined'}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Location</label>
                <p className="text-sm text-slate-900 mt-1">{bid.location || 'Not specified'}</p>
              </div>
              {bid.url && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">Source URL</label>
                  <a 
                    href={bid.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-amber-600 hover:underline mt-1 block"
                  >
                    View original posting →
                  </a>
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
              queryClient.invalidateQueries({ queryKey: ['bidDocuments'] });
              queryClient.invalidateQueries({ queryKey: ['bid'] });
            }}
          />
          
          {documents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Uploaded Documents</h3>
              {documents.map(doc => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-slate-500">
                            {(doc.file_size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.ai_processed && (
                          <Badge variant="outline" className="text-xs">
                            AI Processed
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
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

        <TabsContent value="analysis" className="space-y-4">
          {bid.ai_analysis ? (
            <div className="space-y-4">
              {bid.ai_analysis.complexity_score && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Complexity Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-amber-600">
                        {bid.ai_analysis.complexity_score}/10
                      </div>
                      <p className="text-sm text-slate-600">
                        {bid.ai_analysis.complexity_score > 7 ? 'High complexity' : 
                         bid.ai_analysis.complexity_score > 4 ? 'Medium complexity' : 
                         'Low complexity'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {bid.ai_analysis.risk_factors?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Risk Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {bid.ai_analysis.risk_factors.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-red-500 mt-0.5">⚠</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {bid.ai_analysis.recommended_markup && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recommended Markup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {bid.ai_analysis.recommended_markup}%
                    </p>
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