import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { BidListSkeleton } from '@/components/skeleton/SkeletonComponents';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, TrendingUp, DollarSign, Calendar, MapPin, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  analyzing: 'bg-purple-100 text-purple-800',
  estimating: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-green-100 text-green-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800',
  declined: 'bg-slate-100 text-slate-800'
};

export default function BidOpportunities() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: bids = [], isLoading } = useQuery({
    queryKey: ['bidOpportunities', user?.organization_id],
    queryFn: () => base44.entities.BidOpportunity.filter({ organization_id: user.organization_id }, '-created_date'),
    enabled: !!user?.organization_id
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BidOpportunity.create({
      ...data,
      organization_id: user.organization_id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidOpportunities'] });
      setShowCreateForm(false);
      toast.success('Bid opportunity created');
    }
  });

  const analyzeWithAI = async (bid) => {
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this bid opportunity and provide recommendations:
        
Project: ${bid.title}
Type: ${bid.project_type}
Description: ${bid.description}
Scope: ${bid.scope_of_work}
Estimated Value: $${bid.estimated_value || 'Not specified'}

Please provide:
1. Complexity score (1-10)
2. Recommended profit markup percentage
3. Key risk factors (array)
4. Estimated labor hours required

Return as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            complexity_score: { type: "number" },
            recommended_markup: { type: "number" },
            risk_factors: { type: "array", items: { type: "string" } },
            estimated_hours: { type: "number" }
          }
        }
      });

      await base44.entities.BidOpportunity.update(bid.id, {
        status: 'analyzing',
        ai_analysis: analysis
      });

      queryClient.invalidateQueries({ queryKey: ['bidOpportunities'] });
      toast.success('AI analysis complete');
    } catch (error) {
      toast.error('AI analysis failed');
    }
  };

  const filteredBids = bids.filter(b =>
    b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: bids.length,
    new: bids.filter(b => b.status === 'new').length,
    active: bids.filter(b => ['analyzing', 'estimating'].includes(b.status)).length,
    submitted: bids.filter(b => b.status === 'submitted').length,
    won: bids.filter(b => b.status === 'won').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Bid Opportunities</h1>
          <p className="text-slate-500 mt-1">Track and estimate project bids</p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Opportunity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Bid Opportunity</DialogTitle>
            </DialogHeader>
            <BidForm onSubmit={(data) => createMutation.mutate(data)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.submitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Won</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.won}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search bids..."
          className="pl-10"
        />
      </div>

      {/* Bids List */}
      <div className="grid gap-4">
        {filteredBids.map((bid) => (
          <Card key={bid.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`${createPageUrl('BidDetail')}?id=${bid.id}`}>
                      <CardTitle className="text-lg hover:text-blue-600">{bid.title}</CardTitle>
                    </Link>
                    <Badge className={statusColors[bid.status]}>
                      {bid.status.replace('_', ' ')}
                    </Badge>
                    {bid.ai_analysis && (
                      <Badge variant="outline" className="bg-purple-50">
                        <Bot className="h-3 w-3 mr-1" />
                        AI Analyzed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{bid.client_name}</p>
                </div>
                <div className="flex gap-2">
                  {bid.status === 'new' && (
                    <Button size="sm" variant="outline" onClick={() => analyzeWithAI(bid)}>
                      <Bot className="h-4 w-4 mr-1" />
                      Analyze
                    </Button>
                  )}
                  <Link to={`${createPageUrl('BidDetail')}?id=${bid.id}`}>
                    <Button size="sm">Estimate</Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                {bid.project_type && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">Type:</span>
                    <Badge variant="outline">{bid.project_type.replace('_', ' ')}</Badge>
                  </div>
                )}
                {bid.estimated_value && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">Est. Value:</span>
                    <span className="font-medium">${bid.estimated_value.toLocaleString()}</span>
                  </div>
                )}
                {bid.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">Due:</span>
                    <span className="font-medium">{format(new Date(bid.due_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {bid.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{bid.location}</span>
                  </div>
                )}
              </div>
              {bid.ai_analysis && (
                <div className="mt-3 bg-purple-50 rounded p-3 space-y-1 text-sm">
                  <div className="flex gap-4">
                    <span className="text-slate-600">Complexity: {bid.ai_analysis.complexity_score}/10</span>
                    <span className="text-slate-600">Recommended Markup: {bid.ai_analysis.recommended_markup}%</span>
                  </div>
                  {bid.ai_analysis.risk_factors?.length > 0 && (
                    <div className="text-slate-600">
                      Risks: {bid.ai_analysis.risk_factors.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BidForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    project_type: 'low_voltage',
    description: '',
    scope_of_work: '',
    location: '',
    estimated_value: '',
    due_date: ''
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <Input
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Opportunity title"
        required
      />
      <Input
        value={formData.client_name}
        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
        placeholder="Client name"
      />
      <Input
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        placeholder="Location"
      />
      <Input
        type="number"
        value={formData.estimated_value}
        onChange={(e) => setFormData({ ...formData, estimated_value: parseFloat(e.target.value) })}
        placeholder="Estimated value"
      />
      <Input
        type="date"
        value={formData.due_date}
        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
      />
      <Button type="submit" className="w-full">Create Opportunity</Button>
    </form>
  );
}