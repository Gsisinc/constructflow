import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, TrendingUp, DollarSign, Search, ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  analyzing: 'bg-purple-100 text-purple-800',
  estimating: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-green-100 text-green-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800',
  declined: 'bg-slate-100 text-slate-800',
  active: 'bg-blue-100 text-blue-800',
  closing_soon: 'bg-orange-100 text-orange-800',
  upcoming: 'bg-cyan-100 text-cyan-800'
};

const bidStatuses = ['All', 'new', 'analyzing', 'estimating', 'submitted', 'won', 'lost', 'declined'];

export default function Bids() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingBid, setEditingBid] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: bids = [], isLoading } = useQuery({
    queryKey: ['bids', user?.organization_id],
    queryFn: () => base44.entities.BidOpportunity.filter({ 
      organization_id: user.organization_id 
    }),
    enabled: !!user?.organization_id
  });

  const createBidMutation = useMutation({
    mutationFn: (data) => base44.entities.BidOpportunity.create({ 
      ...data, 
      organization_id: user.organization_id 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      setShowDialog(false);
      setEditingBid(null);
      toast.success('Bid saved');
    }
  });

  const updateBidMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BidOpportunity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      setShowDialog(false);
      setEditingBid(null);
      toast.success('Bid updated');
    }
  });

  const deleteBidMutation = useMutation({
    mutationFn: (id) => base44.entities.BidOpportunity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      toast.success('Bid deleted');
    }
  });

  const filteredBids = bids.filter((bid) => {
    const matchesStatus = statusFilter === 'All' || bid.status === statusFilter;
    const matchesSearch = 
      bid.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.agency?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: bids.length,
    won: bids.filter(b => b.status === 'won').length,
    active: bids.filter(b => ['new', 'analyzing', 'estimating', 'submitted'].includes(b.status)).length,
    value: bids.reduce((sum, b) => sum + (b.estimated_value || 0), 0)
  };

  if (isLoading || !user) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-amber-600" />
            Bid Intelligence Center
          </h1>
          <p className="text-slate-600 mt-1">AI-powered bid management & conversion</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setEditingBid(null)}
              className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              <Plus className="h-5 w-5" />
              New Bid
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <BidForm 
              bid={editingBid} 
              onSubmit={(data) => {
                if (editingBid) {
                  updateBidMutation.mutate({ id: editingBid.id, data });
                } else {
                  createBidMutation.mutate(data);
                }
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Bids</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <FileText className="h-10 w-10 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Won</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{stats.won}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">{stats.active}</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Value</p>
                <p className="text-xl font-bold mt-1 text-purple-600">
                  ${(stats.value / 1000000).toFixed(1)}M
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-amber-100">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search bids..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {bidStatuses.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? 'bg-amber-600 hover:bg-amber-700' : ''}
                  size="sm"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bids List */}
      <div className="space-y-3">
        {filteredBids.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No bids found"
            description={statusFilter === 'All' ? 'Create your first bid to get started' : `No ${statusFilter} bids`}
            actionLabel="Create Bid"
            onAction={() => {
              setEditingBid(null);
              setShowDialog(true);
            }}
          />
        ) : (
          filteredBids.map((bid) => (
            <Card 
              key={bid.id} 
              className="hover:shadow-lg transition-all cursor-pointer group border-amber-100"
              onClick={() => navigate(createPageUrl('BidOpportunityDetail') + `?id=${bid.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">
                        {bid.title || bid.project_name}
                      </h3>
                      {bid.ai_analysis && (
                        <Sparkles className="h-4 w-4 text-purple-600 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {bid.client_name || bid.agency}
                    </p>
                    {bid.description && (
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                        {bid.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className={statusColors[bid.status]}>
                        {bid.status}
                      </Badge>
                      {bid.due_date && (
                        <Badge variant="outline">
                          Due: {format(new Date(bid.due_date), 'MMM d')}
                        </Badge>
                      )}
                      {bid.estimated_value && (
                        <Badge variant="outline" className="bg-green-50">
                          ${(bid.estimated_value / 1000).toFixed(0)}K
                        </Badge>
                      )}
                      {bid.win_probability && (
                        <Badge variant="outline" className="bg-blue-50">
                          {bid.win_probability}% win
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="group-hover:opacity-100 opacity-0 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function BidForm({ bid, onSubmit }) {
  const [formData, setFormData] = useState(bid || {
    title: '',
    project_name: '',
    client_name: '',
    agency: '',
    status: 'new',
    estimated_value: '',
    due_date: '',
    description: '',
    scope_of_work: '',
    location: '',
    url: '',
    win_probability: 50
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{bid ? 'Edit Bid' : 'Create New Bid'}</DialogTitle>
      </DialogHeader>
      <div>
        <label className="text-sm font-semibold">Bid Title *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief title for this opportunity"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Project Name</label>
        <Input
          value={formData.project_name}
          onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
          placeholder="Official project name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold">Client Name</label>
          <Input
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            placeholder="Client"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Agency</label>
          <Input
            value={formData.agency}
            onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
            placeholder="Issuing agency"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description..."
          className="h-20"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Scope of Work</label>
        <Textarea
          value={formData.scope_of_work}
          onChange={(e) => setFormData({ ...formData, scope_of_work: e.target.value })}
          placeholder="Detailed scope..."
          className="h-24"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full border rounded p-2"
          >
            {bidStatuses.filter(s => s !== 'All').map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold">Estimated Value</label>
          <Input
            type="number"
            value={formData.estimated_value}
            onChange={(e) => setFormData({ ...formData, estimated_value: parseFloat(e.target.value) })}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold">Due Date</label>
          <Input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Win Probability (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.win_probability}
            onChange={(e) => setFormData({ ...formData, win_probability: parseInt(e.target.value) })}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold">Location</label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Project location"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Source URL</label>
        <Input
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <Button onClick={() => onSubmit(formData)} className="w-full bg-amber-600 hover:bg-amber-700">
        {bid ? 'Update Bid' : 'Create Bid'}
      </Button>
    </div>
  );
}