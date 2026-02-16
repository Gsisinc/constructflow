import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="max-w-[1600px] mx-auto space-y-8 animate-slide-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2 uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            Intelligence Center
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Bid Opportunities
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Manage, analyze, and track your construction bids with AI-powered insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setEditingBid(null)}
                className="btn-premium-primary h-12 px-6 gap-2"
              >
                <Plus className="h-5 w-5" />
                Create New Bid
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bids', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Won Bids', value: stats.won, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Bids', value: stats.active, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Pipeline Value', value: `$${(stats.value / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <Card key={i} className="premium-card border-none">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="premium-card border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search by title, client, or agency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-slate-50 border-none focus-visible:ring-primary/20 rounded-xl"
              />
            </div>
            <div className="h-8 w-px bg-slate-200 hidden lg:block" />
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto no-scrollbar">
              {bidStatuses.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'ghost'}
                  onClick={() => setStatusFilter(status)}
                  className={`h-10 px-4 rounded-xl capitalize font-medium transition-all ${
                    statusFilter === status 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bids List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredBids.length === 0 ? (
          <div className="py-20">
            <EmptyState
              icon={FileText}
              title="No bids found"
              description={statusFilter === 'All' ? 'Create your first bid to get started' : `No ${statusFilter} bids found matching your criteria.`}
              actionLabel="Create Bid"
              onAction={() => {
                setEditingBid(null);
                setShowDialog(true);
              }}
            />
          </div>
        ) : (
          filteredBids.map((bid) => (
            <Card 
              key={bid.id} 
              className="premium-card border-none group cursor-pointer"
              onClick={() => navigate(createPageUrl('BidOpportunityDetail') + `?id=${bid.id}`)}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                  <div className="flex items-start gap-5 flex-1">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      bid.status === 'won' ? 'bg-emerald-50 text-emerald-600' : 
                      bid.status === 'lost' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                    } group-hover:bg-primary group-hover:text-white`}>
                      <FileText className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-xl text-slate-900 group-hover:text-primary transition-colors">
                          {bid.title || bid.project_name}
                        </h3>
                        {bid.ai_analysis && (
                          <Badge className="bg-purple-50 text-purple-700 border-purple-100 px-2 py-0.5 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> AI Analyzed
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-500 font-medium flex items-center gap-2">
                        {bid.client_name || bid.agency}
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        {bid.location || 'No location set'}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-4">
                        <Badge className={`${statusColors[bid.status]} px-3 py-1 rounded-lg font-semibold uppercase text-[10px] tracking-wider`}>
                          {bid.status.replace('_', ' ')}
                        </Badge>
                        {bid.estimated_value && (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                            <DollarSign className="h-4 w-4 text-slate-400" />
                            {bid.estimated_value.toLocaleString()}
                          </div>
                        )}
                        {bid.due_date && (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            Due {format(new Date(bid.due_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="hidden lg:flex flex-col items-end mr-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Probability</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: '65%' }} />
                        </div>
                        <span className="text-sm font-bold text-slate-900">65%</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBid(bid);
                        setShowDialog(true);
                      }}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                    <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    </div>
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