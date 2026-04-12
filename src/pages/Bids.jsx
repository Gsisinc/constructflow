import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BidListSkeleton } from '@/components/skeleton/SkeletonComponents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, DollarSign, Zap, Clock, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const STATUS_CONFIG = {
  new: { color: 'bg-blue-100 text-blue-800', label: 'New', order: 1 },
  analyzing: { color: 'bg-purple-100 text-purple-800', label: 'Analyzing', order: 2 },
  estimating: { color: 'bg-yellow-100 text-yellow-800', label: 'Estimating', order: 3 },
  submitted: { color: 'bg-cyan-100 text-cyan-800', label: 'Submitted', order: 4 },
  won: { color: 'bg-emerald-100 text-emerald-800', label: 'Won', order: 5 },
  lost: { color: 'bg-red-100 text-red-800', label: 'Lost', order: 6 },
};

export default function Bids() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingBid, setEditingBid] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
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
    queryFn: async () => {
      const list = await base44.entities.BidOpportunity.filter({ 
        organization_id: user.organization_id 
      });
      return list.filter(b => 
        !b.title?.includes('Downtown Plaza') && 
        !b.title?.includes('Highway 101') &&
        !b.title?.includes('Springfield')
      );
    },
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
      toast.success('Bid created');
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
    const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
    const matchesSearch = 
      bid.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    active: bids.filter(b => ['new', 'analyzing', 'estimating'].includes(b.status)).length,
    submitted: bids.filter(b => b.status === 'submitted').length,
    won: bids.filter(b => b.status === 'won').length,
  };

  const groupedByStatus = Object.entries(STATUS_CONFIG).reduce((acc, [status]) => {
    acc[status] = filteredBids.filter(b => b.status === status);
    return acc;
  }, {});

  if (isLoading || !user) return <BidListSkeleton />;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bid Pipeline</h1>
          <p className="text-slate-500 text-sm mt-1">Track opportunities through the bidding workflow</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setEditingBid(null)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Bid
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'In Progress', value: stats.active, color: 'bg-blue-50' },
          { label: 'Submitted', value: stats.submitted, color: 'bg-cyan-50' },
          { label: 'Won', value: stats.won, color: 'bg-emerald-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4 text-center">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${stat.color} mb-2`}>
                <span className="text-lg font-bold text-slate-900">{stat.value}</span>
              </div>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by title or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {['all', ...Object.keys(STATUS_CONFIG)].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize whitespace-nowrap"
            >
              {status === 'all' ? 'All' : STATUS_CONFIG[status]?.label || status}
            </Button>
          ))}
        </div>
      </div>

      {/* Kanban View */}
      {filteredBids.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <div key={status} className="flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-1">
                <h3 className="text-sm font-semibold text-slate-600">{config.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {groupedByStatus[status]?.length || 0}
                </Badge>
              </div>
              <div className="space-y-2 flex-1">
                {groupedByStatus[status]?.map((bid) => (
                  <BidCard key={bid.id} bid={bid} onEdit={() => {
                    setEditingBid(bid);
                    setShowDialog(true);
                  }} onDelete={() => deleteBidMutation.mutate(bid.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No bids found"
          description="Create your first bid to get started"
          actionLabel="New Bid"
          onAction={() => {
            setEditingBid(null);
            setShowDialog(true);
          }}
        />
      )}
    </div>
  );
}

function BidCard({ bid, onEdit, onDelete }) {
  const navigate = useNavigate();
  const daysUntilDue = bid.due_date ? Math.ceil((new Date(bid.due_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-slate-200"
      onClick={() => navigate(createPageUrl('BidOpportunityDetail') + `?id=${bid.id}`)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title + Menu */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-slate-900 text-sm line-clamp-2">{bid.title || bid.project_name}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Client */}
          <p className="text-xs text-slate-600">{bid.client_name || bid.agency || 'No client'}</p>

          {/* Value & Due */}
          <div className="flex items-center justify-between text-xs">
            {bid.estimated_value && (
              <div className="flex items-center gap-1 text-slate-700 font-medium">
                <DollarSign className="h-3 w-3" />
                ${(bid.estimated_value / 1000).toFixed(0)}K
              </div>
            )}
            {daysUntilDue !== null && (
              <div className={`flex items-center gap-1 font-medium ${daysUntilDue <= 7 ? 'text-red-600' : 'text-slate-600'}`}>
                <Clock className="h-3 w-3" />
                {daysUntilDue <= 0 ? 'Overdue' : `${daysUntilDue}d`}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BidForm({ bid, onSubmit }) {
  const [formData, setFormData] = useState(bid || {
    title: '',
    project_name: '',
    client_name: '',
    status: 'new',
    estimated_value: '',
    due_date: '',
  });

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{bid ? 'Edit Bid' : 'Create New Bid'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold">Bid Title *</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Downtown Plaza - AV & Data"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Client Name *</label>
          <Input
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            placeholder="General Contractor or Client"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            >
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">Est. Value</label>
            <Input
              type="number"
              value={formData.estimated_value}
              onChange={(e) => setFormData({ ...formData, estimated_value: parseFloat(e.target.value) })}
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold">Due Date</label>
          <Input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
        <Button onClick={() => onSubmit(formData)} className="w-full">
          {bid ? 'Update' : 'Create'} Bid
        </Button>
      </div>
    </div>
  );
}